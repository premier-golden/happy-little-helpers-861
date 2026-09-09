import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTikPayAuth } from "@/hooks/use-tikpay-auth";

export function MembersAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useTikPayAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#ffd1da] border-t-[#ff3b5c]" />
          <p className="text-[12px] font-bold text-[#8a8a8e]">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
