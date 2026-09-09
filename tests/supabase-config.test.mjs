import assert from "node:assert/strict";
import test from "node:test";
import { validateSupabaseConfig } from "../src/integrations/supabase/config.ts";

const url = "https://example.supabase.co";
// Synthetic fixtures only; these are not credentials.
const jwt = (role) =>
  `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;

test("accepts publishable and legacy anon configuration", () => {
  assert.deepEqual(validateSupabaseConfig(` ${url}/ `, " sb_publishable_fixture "), {
    url,
    key: "sb_publishable_fixture",
  });
  assert.equal(validateSupabaseConfig(url, jwt("anon")).key, jwt("anon"));
  assert.equal(
    validateSupabaseConfig("http://localhost:54321", jwt("anon")).url,
    "http://localhost:54321",
  );
});

test("reports missing configuration clearly", () => {
  for (const values of [
    [undefined, undefined],
    [url, ""],
    [" ", jwt("anon")],
  ]) {
    assert.throws(
      () => validateSupabaseConfig(...values),
      /VITE_SUPABASE_URL.*VITE_SUPABASE_PUBLISHABLE_KEY/,
    );
  }
});

test("rejects privileged and malformed keys without echoing them", () => {
  for (const key of [
    "sb_secret_fixture",
    jwt("service_role"),
    jwt("authenticated"),
    "invalid-key",
  ]) {
    assert.throws(
      () => validateSupabaseConfig(url, key),
      (error) => {
        assert.match(error.message, /publishable key or legacy anon key/);
        assert.ok(!error.message.includes(key));
        return true;
      },
    );
  }
});

test("rejects unsafe or malformed project URLs", () => {
  for (const value of [
    "invalid",
    "ftp://example.com",
    "https://user:pass@example.com",
    `${url}?secret=x`,
    `${url}#x`,
  ]) {
    assert.throws(() => validateSupabaseConfig(value, jwt("anon")), /Supabase:/);
  }
});
