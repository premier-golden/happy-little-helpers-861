import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { TikPayBrandIcon } from "@/components/members/TikPayBrandIcon";
import { TikPayLanguageSwitcher } from "@/components/members/TikPayLanguageSwitcher";
import { useTikPayAuth } from "@/hooks/use-tikpay-auth";
import { signInTikPay } from "@/lib/tikpay-auth";
import { registerTikPayAccount } from "@/lib/tikpay-signup.functions";
import { useTikPayI18n } from "@/lib/tikpay-i18n";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — Tik Pay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useTikPayAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTikPayI18n();

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/members", replace: true });
  }, [authLoading, user, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    if (!acceptedTerms) {
      setError(t("signup.termsError"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await registerTikPayAccount({
        data: { fullName, email, password },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      await signInTikPay(email, password);
      navigate({ to: "/members", replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : t("signup.genericError"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-7 font-sans text-[#161823]">
      <div className="fixed right-3 top-3 z-30">
        <TikPayLanguageSwitcher compact />
      </div>
      <div className="mx-auto w-full max-w-[420px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <TikPayBrandIcon className="h-11 w-11 rounded-[13px] shadow-sm" />
          <div>
            <div className="text-[24px] font-black leading-none tracking-tight">
              Tik <span className="text-[#ff3b5c]">Pay</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-[#8a8a8e]">{t("signup.tagline")}</p>
          </div>
        </div>

        <section className="rounded-[28px] border border-black/[0.06] bg-white p-6 shadow-[0_14px_42px_rgba(0,0,0,0.07)]">
          <span className="inline-flex rounded-full bg-[#fff0f3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff3b5c]">
            {t("signup.badge")}
          </span>
          <h1 className="mt-3 text-[27px] font-black tracking-tight">{t("signup.title")}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#747378]">
            {t("signup.subtitle")}
          </p>

          <div className="mt-4 rounded-2xl bg-[#f7f7f8] p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#545459]">
              <Check className="h-4 w-4 text-[#159447]" /> {t("signup.benefitImmediate")}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#545459]">
              <Check className="h-4 w-4 text-[#159447]" /> {t("signup.benefitSaved")}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-[#4f4f53]">{t("signup.name")}</span>
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-black/[0.09] bg-[#fafafa] px-3.5 focus-within:border-[#ff3b5c]/50 focus-within:ring-2 focus-within:ring-[#ff3b5c]/10">
                <UserRound className="h-4.5 w-4.5 shrink-0 text-[#a0a0a4]" />
                <input
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("signup.namePlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#b5b5b8]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-bold text-[#4f4f53]">{t("signup.email")}</span>
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
              <span className="mb-1.5 block text-[12px] font-bold text-[#4f4f53]">{t("signup.password")}</span>
              <div className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-black/[0.09] bg-[#fafafa] px-3.5 focus-within:border-[#ff3b5c]/50 focus-within:ring-2 focus-within:ring-[#ff3b5c]/10">
                <LockKeyhole className="h-4.5 w-4.5 shrink-0 text-[#a0a0a4]" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("signup.passwordPlaceholder")}
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

            <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-black/[0.06] bg-[#fafafa] px-3.5 py-3">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff3b5c]"
              />
              <span className="text-[10px] leading-relaxed text-[#747378]">
                {t("signup.termsBefore")}{" "}
                <Link
                  to="/terms"
                  className="font-black text-[#ff3b5c] underline underline-offset-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  {t("common.terms")}
                </Link>
                {t("signup.termsAfter")}
              </span>
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
              {loading ? t("signup.submitting") : t("signup.submit")}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] text-[#747378]">
            {t("signup.haveAccount")}{" "}
            <Link to="/login" className="font-black text-[#ff3b5c]">
              {t("signup.signIn")}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
