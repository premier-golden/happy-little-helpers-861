/** Validate only public connection settings; never include key values in errors. */
export function validateSupabaseConfig(url?: string, key?: string) {
  const publicUrl = url?.trim();
  const publicKey = key?.trim();
  if (!publicUrl || !publicKey) {
    throw new Error(
      "Supabase: configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY). See README.md; restart development or rebuild after changes.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(publicUrl);
  } catch {
    throw new Error("Supabase: VITE_SUPABASE_URL must be a valid HTTP(S) URL.");
  }
  if (
    !["https:", "http:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      "Supabase: use the project HTTP(S) URL without credentials, query or fragment.",
    );
  }

  // Legacy anon keys are JWTs. Decoding checks configuration, not authenticity.
  let isAnon = false;
  try {
    const payload = publicKey.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    isAnon = publicKey.split(".").length === 3 && JSON.parse(atob(base64)).role === "anon";
  } catch {
    // Opaque publishable keys are handled below.
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey) && !isAnon) {
    throw new Error(
      "Supabase: use a publishable key or legacy anon key. Secret/admin keys are not allowed in public configuration.",
    );
  }

  return { url: publicUrl.replace(/\/$/, ""), key: publicKey };
}

export function getPublicSupabaseConfig() {
  return validateSupabaseConfig(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}
