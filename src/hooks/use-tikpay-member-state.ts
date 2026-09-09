import { useCallback, useEffect, useState } from "react";
import { useTikPayAuth } from "@/hooks/use-tikpay-auth";
import {
  fetchTikPayAccountState,
  type TikPayAccountState,
} from "@/lib/tikpay-member-api";

export function useTikPayMemberState() {
  const { user, loading: authLoading } = useTikPayAuth();
  const [state, setState] = useState<TikPayAccountState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(null);
      setLoading(false);
      return null;
    }

    setError(null);

    try {
      const next = await fetchTikPayAccountState();
      setState(next);
      return next;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No se pudo cargar tu progreso.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    void refresh();
  }, [authLoading, refresh]);

  useEffect(() => {
    const onUpdate = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("tikpay:member-state-update", onUpdate);
    window.addEventListener("focus", onUpdate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("tikpay:member-state-update", onUpdate);
      window.removeEventListener("focus", onUpdate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return {
    state,
    loading: authLoading || loading,
    error,
    refresh,
  };
}
