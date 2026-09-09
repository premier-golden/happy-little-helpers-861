import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { TikPayBrandIcon } from "@/components/members/TikPayBrandIcon";
import { TikPayLanguageSwitcher } from "@/components/members/TikPayLanguageSwitcher";
import { useTikPayAuth } from "@/hooks/use-tikpay-auth";
import { signInTikPay } from "@/lib/tikpay-auth";
import { useTikPayI18n } from "@/lib/tikpay-i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Tik Pay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useTikPayAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTikPayI18n();

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/members", replace: true });
  }, [authLoading, user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      await signInTikPay(email, password);
      navigate({ to: "/members", replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "No se pudo iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f5f5f5] px-4 py-5 font-sans text-[#161823]">
      <div className="fixed right-3 top-3 z-30">
        <TikPayLanguageSwitcher compact />
      </div>
      <div className="w-full max-w-[420px]">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <TikPayBrandIcon className="h-11 w-11 rounded-[13px] shadow-sm" />
          <div>
            <div className="text-[24px] font-black leading-none tracking-tight">
              Tik <span className="text-[#ff3b5c]">Pay</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-[#8a8a8e]">{t("login.tagline")}</p>
          </div>
        </div>

        <section className="rounded-[28px] border border-black/[0.06] bg-white p-6 shadow-[0_14px_42px_rgba(0,0,0,0.07)]">
          <div className="mb-6">
            <span className="inline-flex rounded-full bg-[#fff0f3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff3b5c]">
              {t("login.badge")}
            </span>
            <h1 className="mt-3 text-[27px] font-black tracking-tight">{t("login.title")}</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#747378]">
              {t("login.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-[#4f4f53]">{t("login.email")}</span>
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-black/[0.09] bg-[#fafafa] px-3.5 focus-within:border-[#ff3b5c]/50 focus-within:ring-2 focus-within:ring-[#ff3b5c]/10">
                <Mail className="h-4.5 w-4.5 shrink-0 text-[#a0a0a4]" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#b5b5b8]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-[#4f4f53]">{t("login.password")}</span>
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-black/[0.09] bg-[#fafafa] px-3.5 focus-within:border-[#ff3b5c]/50 focus-within:ring-2 focus-within:ring-[#ff3b5c]/10">
                <LockKeyhole className="h-4.5 w-4.5 shrink-0 text-[#a0a0a4]" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#b5b5b8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#8a8a8e]"
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </label>

            {error ? (
              <p className="rounded-2xl bg-[#fff0f3] px-3.5 py-2.5 text-[12px] font-semibold text-[#d92d4b]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-13 w-full items-center justify-center rounded-2xl bg-[#ff3b5c] px-5 text-[15px] font-black text-white shadow-[0_10px_24px_rgba(255,59,92,0.24)] transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? t("login.submitting") : t("login.submit")}
            </button>
          </form>

          <div className="mt-6 border-t border-black/[0.06] pt-5 text-center">
            <p className="text-[12px] text-[#747378]">{t("login.noAccount")}</p>
            <Link
              to="/signup"
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#f3f3f4] px-5 text-[13px] font-black text-[#161823]"
            >
              {t("login.createAccount")}
            </Link>
            <p className="mt-4 text-[9px] leading-relaxed text-[#a0a0a4]">
              {t("login.termsPrefix")}{" "}
              <Link to="/terms" className="font-bold text-[#747378] underline underline-offset-2">
                {t("common.terms")}
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
