import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";
import { getPublicSupabaseConfig } from "./config";

function createSupabaseClient() {
  const { url, key } = getPublicSupabaseConfig();
  return createClient<Database>(url, key, {
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let browserClient: ReturnType<typeof createSupabaseClient> | undefined;

/** Call from browser effects/events, never during SSR or in server handlers. */
export function getSupabaseClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "Supabase: the browser client cannot be used during SSR. Use the request-scoped auth middleware in server handlers.",
    );
  }
  return (browserClient ??= createSupabaseClient());
}

// Preserve existing imports and defer configuration/storage access until use.
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
