import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/integrations/supabase/client.ts", import.meta.url),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function loadClient(browser) {
  let creations = 0;
  const client = {
    auth: {},
    from() {
      return this;
    },
  };
  const context = {
    exports: {},
    ...(browser ? { window: {} } : {}),
    require(name) {
      if (name === "@supabase/supabase-js")
        return {
          createClient() {
            creations++;
            return client;
          },
        };
      if (name === "./config")
        return {
          getPublicSupabaseConfig: () => ({ url: "https://example.supabase.co", key: "fixture" }),
        };
      if (name === "./previewAuthStorage") return { brokeredPreviewStorage: () => undefined };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(code, context);
  return { api: context.exports, client, creations: () => creations };
}

test("imports lazily and refuses to create shared server sessions", () => {
  const { api, creations } = loadClient(false);
  assert.equal(creations(), 0);
  assert.throws(() => api.getSupabaseClient(), /cannot be used during SSR/);
  assert.throws(() => api.supabase.auth, /cannot be used during SSR/);
  assert.equal(creations(), 0);
});

test("reuses the browser instance and preserves method receivers", () => {
  const { api, client, creations } = loadClient(true);
  assert.equal(creations(), 0);
  assert.equal(api.getSupabaseClient(), client);
  assert.equal(api.getSupabaseClient(), client);
  assert.equal(api.supabase.auth, client.auth);
  assert.equal(api.supabase.from(), client);
  assert.equal(creations(), 1);
});
