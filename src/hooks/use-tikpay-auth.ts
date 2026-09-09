import { useCallback, useEffect, useState } from "react";
import {
  getTikPaySession,
  signOutTikPay,
  subscribeTikPayAuth,
  type TikPayAuthSession,
  type TikPayAuthUser,
} from "@/lib/tikpay-auth";

export function useTikPayAuth() {
  const [session, setSession] = useState<TikPayAuthSession | null>(null);
  const [user, setUser] = useState<TikPayAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await getTikPaySession();
    setSession(next);
    setUser(next?.user ?? null);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const next = await getTikPaySession();
      if (!active) return;
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    };

    void hydrate();
    const unsubscribe = subscribeTikPayAuth(() => void hydrate());

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await signOutTikPay();
    setSession(null);
    setUser(null);
  }, []);

  return { session, user, loading, refresh, signOut };
}
