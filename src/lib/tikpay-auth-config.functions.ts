import { createServerFn } from "@tanstack/react-start";

export const getTikPayAuthConfig = createServerFn({ method: "GET" }).handler(async () => {
  "use server";

  const url = process.env["SUPABASE_URL"]?.replace(/\/$/, "");
  const publishableKey =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["SUPABASE_ANON_KEY"];

  if (!url || !publishableKey) {
    throw new Error("Tik Pay authentication is not configured.");
  }

  return { url, publishableKey };
});
