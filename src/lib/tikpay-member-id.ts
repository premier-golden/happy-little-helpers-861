const MEMBER_ID_KEY = "tikpay:member-id";

function randomId() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fallback abaixo
  }
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateTikPayMemberId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(MEMBER_ID_KEY);
    if (stored) return stored;

    const created = randomId();
    window.localStorage.setItem(MEMBER_ID_KEY, created);
    return created;
  } catch {
    return null;
  }
}
