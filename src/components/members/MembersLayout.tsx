import { Link, useRouterState } from "@tanstack/react-router";
import { Headphones, Home, User, UsersRound } from "lucide-react";
import { MembersAuthGate } from "@/components/members/MembersAuthGate";
import { TikPayBrandIcon } from "@/components/members/TikPayBrandIcon";
import { TikPayLanguageSwitcher } from "@/components/members/TikPayLanguageSwitcher";
import { useTikPayMemberState } from "@/hooks/use-tikpay-member-state";
import { formatTikPayBalance, readTikPayBalance } from "@/lib/members-balance";
import { useTikPayI18n } from "@/lib/tikpay-i18n";

type Props = {
  children: React.ReactNode;
};

export function MembersLayout({ children }: Props) {
  return (
    <MembersAuthGate>
      <MembersLayoutContent>{children}</MembersLayoutContent>
    </MembersAuthGate>
  );
}

function MembersLayoutContent({ children }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useTikPayMemberState();
  const { t } = useTikPayI18n();
  const balance = state?.member.balance ?? readTikPayBalance();

  return (
    <div className="min-h-screen w-full bg-[#f5f5f5] pb-24 font-sans text-[#161823]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto w-full max-w-[520px] px-4 pb-5 pt-4">
          <div className="mb-3 flex justify-end">
            <TikPayLanguageSwitcher compact />
          </div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <TikPayBrandIcon className="h-10 w-10 shrink-0 rounded-[12px] shadow-sm" />
              <div className="min-w-0">
                <div className="text-[19px] font-black leading-none tracking-tight">
                  Tik <span className="text-[#ff3b5c]">Pay</span>
                </div>
                <div className="mt-1 truncate text-[11px] text-[#8a8a8e]">
                  {state?.member.fullName
                    ? t("layout.hello", { name: state.member.fullName.split(" ")[0] })
                    : t("layout.exclusive")}
                </div>
              </div>
            </div>

            <span className="rounded-full bg-[#fff0f3] px-3 py-1.5 text-[11px] font-bold text-[#ff3b5c]">
              {t("layout.activeAccess")}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[18px] border border-black/[0.06] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#6f6f73]">
                {t("layout.balance")}
                <span className="grid h-[15px] w-[15px] place-items-center rounded-full bg-[#fedc60] text-[8px] font-black text-white shadow-inner">
                  P
                </span>
              </div>
              <div className="mt-1 text-[25px] font-black tracking-tight text-black tabular-nums">
                {formatTikPayBalance(balance)}
              </div>
            </div>

            <div className="rounded-full bg-[#ff3b5c] px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(255,59,92,0.22)]">
              Tik Pay
            </div>
          </div>

          <div className="mt-5">
            <h1 className="text-[24px] font-black tracking-tight">{t("layout.memberArea")}</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-[#747378]">
              {t("layout.memberSubtitle")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-[#fff0f3] px-3 py-1.5 text-[#ff3b5c]">
                {t("layout.dayOf30", { day: state?.member.activeDay ?? 1 })}
              </span>
              <span className="rounded-full bg-[#f1f1f3] px-3 py-1.5 text-[#747378]">
                {t("layout.completedDays", { count: state?.member.completedDays ?? 0 })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[520px] px-4 pt-5">
        {pathname === "/members" ? <WatchRewardMotion /> : null}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.07] bg-white/95 backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-[520px] grid-cols-4 px-2 py-2.5">
          <NavItem
            to="/members"
            label={t("nav.home")}
            icon={<Home className="h-5 w-5" />}
            active={pathname === "/members"}
          />
          <NavItem
            to="/community"
            label={t("nav.community")}
            icon={<UsersRound className="h-5 w-5" />}
            active={pathname === "/community" || pathname === "/admin-community"}
          />
          <NavItem
            to="/support"
            label={t("nav.support")}
            icon={<Headphones className="h-5 w-5" />}
            active={pathname === "/support"}
          />
          <NavItem
            to="/profile"
            label={t("nav.profile")}
            icon={<User className="h-5 w-5" />}
            active={pathname === "/profile"}
          />
        </div>
      </nav>
    </div>
  );
}

function WatchRewardMotion() {
  const { t } = useTikPayI18n();

  return (
    <>
      <style>{`
        @keyframes tpPersonNod {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes tpPhoneGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(255,59,92,0); }
          50% { box-shadow: 0 0 18px rgba(255,59,92,.24); }
        }
        @keyframes tpCoinFall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          18% { opacity: 1; }
          100% { transform: translateY(48px) rotate(220deg); opacity: 0; }
        }
        @keyframes tpPlayPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .tp-person-head { animation: tpPersonNod 2.8s ease-in-out infinite; transform-origin: 50% 100%; }
        .tp-phone { animation: tpPhoneGlow 2.5s ease-in-out infinite; }
        .tp-play { animation: tpPlayPulse 1.8s ease-in-out infinite; }
        .tp-coin { animation: tpCoinFall 2.4s linear infinite; }
        .tp-coin-2 { animation-delay: .8s; }
        .tp-coin-3 { animation-delay: 1.55s; }
        @media (prefers-reduced-motion: reduce) {
          .tp-person-head, .tp-phone, .tp-play, .tp-coin { animation: none !important; }
        }
      `}</style>

      <section className="mb-4 flex min-h-[88px] items-center justify-between overflow-hidden rounded-[22px] border border-black/[0.05] bg-white px-4 py-3 shadow-[0_7px_24px_rgba(0,0,0,0.045)]">
        <div className="min-w-0 pr-3">
          <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#ff3b5c]">
            {t("motion.kicker")}
          </p>
          <h2 className="mt-1 text-[14px] font-black leading-tight text-[#161823]">
            {t("motion.title")}
          </h2>
          <p className="mt-1 text-[10px] leading-relaxed text-[#8a8a8e]">
            {t("motion.subtitle")}
          </p>
        </div>

        <div className="relative h-[66px] w-[116px] shrink-0">
          <div className="absolute bottom-0 left-0 h-[33px] w-[40px] rounded-t-[18px] bg-[#f2f2f3]" />
          <div className="tp-person-head absolute left-[9px] top-[3px] h-[25px] w-[25px] rounded-full bg-[#28282d]">
            <span className="absolute -right-[3px] top-[11px] h-[8px] w-[8px] rounded-full bg-[#28282d]" />
          </div>
          <div className="absolute bottom-[7px] left-[29px] h-[6px] w-[27px] -rotate-[18deg] rounded-full bg-[#28282d]" />

          <div className="tp-phone absolute bottom-[4px] left-[54px] h-[58px] w-[34px] rounded-[9px] border-[3px] border-[#222228] bg-[#fff0f3]">
            <div className="absolute left-1/2 top-[4px] h-[2px] w-[10px] -translate-x-1/2 rounded-full bg-[#222228]/40" />
            <div className="tp-play absolute left-1/2 top-1/2 grid h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#ff3b5c] text-[8px] text-white shadow-sm">
              ▶
            </div>
          </div>

          <span className="tp-coin absolute right-[11px] top-[2px] grid h-[17px] w-[17px] place-items-center rounded-full bg-gradient-to-br from-[#ffe784] to-[#efb21b] text-[8px] font-black text-[#775200] shadow-sm">€</span>
          <span className="tp-coin tp-coin-2 absolute right-[31px] top-[7px] grid h-[14px] w-[14px] place-items-center rounded-full bg-gradient-to-br from-[#ffe784] to-[#efb21b] text-[7px] font-black text-[#775200] shadow-sm">€</span>
          <span className="tp-coin tp-coin-3 absolute right-[2px] top-[13px] grid h-[12px] w-[12px] place-items-center rounded-full bg-gradient-to-br from-[#ffe784] to-[#efb21b] text-[6px] font-black text-[#775200] shadow-sm">€</span>
        </div>
      </section>
    </>
  );
}

function NavItem({
  to,
  label,
  icon,
  active,
}: {
  to: "/members" | "/community" | "/support" | "/profile";
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors " +
        (active ? "bg-[#fff0f3] text-[#ff3b5c]" : "text-[#8a8a8e] hover:text-[#ff3b5c]")
      }
    >
      {icon}
      <span className="text-[11px] font-bold">{label}</span>
    </Link>
  );
}
