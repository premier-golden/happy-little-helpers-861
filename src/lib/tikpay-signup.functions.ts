import { createServerFn } from "@tanstack/react-start";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

function serviceHeaders(key: string) {
  const headers = new Headers({
    "Content-Type": "application/json",
    apikey: key,
  });

  if (!key.startsWith("sb_secret_") && !key.startsWith("sb_publishable_")) {
    headers.set("Authorization", `Bearer ${key}`);
  }

  return headers;
}

export const registerTikPayAccount = createServerFn({ method: "POST" })
  .validator((input: RegisterInput) => input)
  .handler(async ({ data }) => {
    "use server";

    const fullName = data.fullName.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    if (fullName.length < 2) {
      return { ok: false as const, error: "Introduce tu nombre." };
    }

    if (!email || !email.includes("@") || email.length > 254) {
      return { ok: false as const, error: "Introduce un correo electrónico válido." };
    }

    if (!password || password.length < 6) {
      return { ok: false as const, error: "La contraseña debe tener al menos 6 caracteres." };
    }

    const url = process.env["SUPABASE_URL"]?.replace(/\/$/, "");
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

    if (!url || !key) {
      console.error("[Tik Pay signup] Supabase server environment is missing.");
      return { ok: false as const, error: "No se pudo crear tu cuenta ahora." };
    }

    const response = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: serviceHeaders(key),
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    });

    if (!response.ok) {
      const raw = await response.text();
      let message = raw;

      try {
        const parsed = JSON.parse(raw) as { message?: string; msg?: string; error_description?: string };
        message = parsed.message || parsed.msg || parsed.error_description || raw;
      } catch {
        // Mantém a resposta original apenas para classificação interna.
      }

      const normalized = message.toLowerCase();
      if (
        response.status === 422 ||
        normalized.includes("already") ||
        normalized.includes("registered") ||
        normalized.includes("exists")
      ) {
        return { ok: false as const, error: "Este correo ya está registrado. Inicia sesión." };
      }

      console.error("[Tik Pay signup] create user failed", {
        status: response.status,
        message: message.slice(0, 300),
      });
      return { ok: false as const, error: "No se pudo crear tu cuenta ahora." };
    }

    return { ok: true as const };
  });
