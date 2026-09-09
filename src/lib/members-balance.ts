export const INITIAL_TIK_PAY_BALANCE = 1395.72;

const BALANCE_KEY = "tikpay:members-balance";
const REWARD_PREFIX = "tikpay:reward-claimed:";

export function readTikPayBalance() {
  if (typeof window === "undefined") return INITIAL_TIK_PAY_BALANCE;
  try {
    const stored = Number(window.localStorage.getItem(BALANCE_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : INITIAL_TIK_PAY_BALANCE;
  } catch {
    return INITIAL_TIK_PAY_BALANCE;
  }
}

export function formatTikPayBalance(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function hasTikPayRewardClaimed(rewardId: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${REWARD_PREFIX}${rewardId}`) === "1";
  } catch {
    return false;
  }
}

export function addTikPayRewardOnce(rewardId: string, amount: number) {
  if (typeof window === "undefined") return { balance: INITIAL_TIK_PAY_BALANCE, added: false };

  try {
    const claimedKey = `${REWARD_PREFIX}${rewardId}`;
    const current = readTikPayBalance();

    if (window.localStorage.getItem(claimedKey) === "1") {
      return { balance: current, added: false };
    }

    const next = Math.round((current + amount) * 100) / 100;
    window.localStorage.setItem(BALANCE_KEY, String(next));
    window.localStorage.setItem(claimedKey, "1");
    window.dispatchEvent(new CustomEvent("tikpay:balance-update", { detail: { balance: next, amount } }));

    return { balance: next, added: true };
  } catch {
    return { balance: readTikPayBalance(), added: false };
  }
}


export function syncTikPayBalance(balance: number) {
  if (typeof window === "undefined") return;

  const normalized = Math.round((Number(balance) || INITIAL_TIK_PAY_BALANCE) * 100) / 100;

  try {
    window.localStorage.setItem(BALANCE_KEY, String(normalized));
  } catch {
    // Mantém o valor apenas em memória quando o armazenamento local é bloqueado.
  }

  window.dispatchEvent(
    new CustomEvent("tikpay:balance-update", {
      detail: { balance: normalized, amount: 0, source: "server" },
    }),
  );
}

export function markTikPayRewardClaimed(rewardId: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(`${REWARD_PREFIX}${rewardId}`, "1");
  } catch {
    // O banco continua sendo a fonte de verdade.
  }
}
