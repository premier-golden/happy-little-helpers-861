import { getTikPayAuthConfig } from "@/lib/tikpay-auth-config.functions";

export type TikPayAuthUser = {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type TikPayAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type?: string;
  user: TikPayAuthUser;
};

const SESSION_KEY = "tikpay:auth-session:v1";
const AUTH_EVENT = "tikpay:auth-change";

let configPromise: Promise<{ url: string; publishableKey: string }> | null = null;
let refreshPromise: Promise<TikPayAuthSession | null> | null = null;

async function config() {
  const env = import.meta.env as Record<string, string | undefined>;
  const directUrl = env["VITE_SUPABASE_URL"]?.replace(/\/$/, "");
  const directKey = env["VITE_SUPABASE_PUBLISHABLE_KEY"] || env["VITE_SUPABASE_ANON_KEY"];

  if (directUrl && directKey) return { url: directUrl, publishableKey: directKey };

  if (!configPromise) configPromise = getTikPayAuthConfig();
  return configPromise;
}

function normalizeSession(raw: Partial<TikPayAuthSession>): TikPayAuthSession | null {
  if (!raw.access_token || !raw.refresh_token || !raw.user?.id) return null;

  const expiresIn = Number(raw.expires_in ?? 3600);
  const expiresAt =
    Number(raw.expires_at) > 0
      ? Number(raw.expires_at)
      : Math.floor(Date.now() / 1000) + expiresIn;

  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_in: expiresIn,
    expires_at: expiresAt,
    token_type: raw.token_type,
    user: raw.user,
  };
}

function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return normalizeSession(JSON.parse(raw) as Partial<TikPayAuthSession>);
  } catch {
    return null;
  }
}

function storeSession(session: TikPayAuthSession | null) {
  if (typeof window === "undefined") return;

  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Sem persistência local, a sessão pode continuar apenas até a próxima navegação.
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

async function authRequest(path: string, init: RequestInit = {}) {
  const { url, publishableKey } = await config();
  const headers = new Headers(init.headers);
  headers.set("apikey", publishableKey);
  headers.set("Content-Type", "application/json");

  return fetch(`${url}/auth/v1/${path}`, {
    ...init,
    headers,
  });
}

export async function signInTikPay(email: string, password: string) {
  const response = await authRequest("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = "Correo o contraseña incorrectos.";

    try {
      const parsed = JSON.parse(raw) as { error_description?: string; msg?: string; message?: string };
      const candidate = parsed.error_description || parsed.msg || parsed.message;
      if (candidate && !/confirm/i.test(candidate)) message = candidate;
    } catch {
      // Usa mensagem amigável.
    }

    throw new Error(message);
  }

  const session = normalizeSession((await response.json()) as Partial<TikPayAuthSession>);
  if (!session) throw new Error("No se pudo iniciar sesión.");

  storeSession(session);
  return session;
}

export async function refreshTikPaySession() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const current = readStoredSession();
    if (!current?.refresh_token) return null;

    const response = await authRequest("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });

    if (!response.ok) {
      storeSession(null);
      return null;
    }

    const session = normalizeSession((await response.json()) as Partial<TikPayAuthSession>);
    storeSession(session);
    return session;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function getTikPaySession() {
  const current = readStoredSession();
  if (!current) return null;

  const now = Math.floor(Date.now() / 1000);
  if (current.expires_at > now + 60) return current;

  return refreshTikPaySession();
}

export function getCachedTikPaySession() {
  return readStoredSession();
}

export async function signOutTikPay() {
  const current = readStoredSession();

  if (current?.access_token) {
    try {
      const { url, publishableKey } = await config();
      await fetch(`${url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${current.access_token}`,
        },
      });
    } catch {
      // A limpeza local continua mesmo se a revogação remota falhar.
    }
  }

  storeSession(null);
}

export function subscribeTikPayAuth(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export async function tikPayAuthenticatedFetch(path: string, init: RequestInit = {}) {
  const session = await getTikPaySession();
  if (!session) throw new Error("not_authenticated");

  const { url, publishableKey } = await config();
  const headers = new Headers(init.headers);
  headers.set("apikey", publishableKey);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  headers.set("Content-Type", "application/json");

  const request = () =>
    fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers,
    });

  let response = await request();

  if (response.status === 401) {
    const refreshed = await refreshTikPaySession();
    if (!refreshed) throw new Error("not_authenticated");
    headers.set("Authorization", `Bearer ${refreshed.access_token}`);
    response = await request();
  }

  return response;
}
