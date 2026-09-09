import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Play,
  Sparkles,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MembersLayout } from "@/components/members/MembersLayout";
import { useTikPayMemberState } from "@/hooks/use-tikpay-member-state";
import { formatTikPayBalance } from "@/lib/members-balance";
import { useTikPayI18n } from "@/lib/tikpay-i18n";
import {
  buildTikPayRewardPlan,
  TIK_PAY_PLAN_DAYS,
  TIK_PAY_VIDEOS_PER_DAY,
} from "@/lib/reward-plan";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Área de miembros — Tik Pay" },
      { name: "description", content: "Tu progreso y recompensas en Tik Pay." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembersPage,
});

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}

function MembersPage() {
  const rewardPlan = useMemo(() => buildTikPayRewardPlan(), []);
  const { t } = useTikPayI18n();
  const { state, loading, error, refresh } = useTikPayMemberState();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const member = state?.member;
  const planDay = member?.activeDay ?? 1;
  const completedDays = member?.completedDays ?? 0;
  const dayConfig = rewardPlan[planDay - 1] ?? rewardPlan[0];

  const completedToday =
    state?.progress.filter(
      (row) => row.planDay === planDay && row.rewardClaimed,
    ).length ?? 0;

  const unlockAt = member?.nextUnlockAt
    ? new Date(member.nextUnlockAt).getTime()
    : 0;
  const locked = unlockAt > now;
  const planCompleted = completedDays >= TIK_PAY_PLAN_DAYS;
  const available = !locked && !planCompleted;
  const countdown = locked
    ? formatCountdown(unlockAt - now)
    : t("members.availableNow");

  useEffect(() => {
    if (unlockAt > 0 && unlockAt <= now) {
      window.dispatchEvent(new Event("tikpay:member-state-update"));
    }
  }, [unlockAt > 0 && unlockAt <= now]);

  return (
    <MembersLayout>
      {loading && !state ? (
        <div className="mb-5 rounded-[22px] border border-black/[0.05] bg-white p-5 text-center shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-[#ffd1da] border-t-[#ff3b5c]" />
          <p className="mt-3 text-[12px] font-bold text-[#8a8a8e]">{t("members.loading")}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-[20px] border border-[#ffd6de] bg-[#fff5f7] p-4">
          <p className="text-[12px] font-semibold text-[#c93652]">{t("members.error")}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 text-[12px] font-black text-[#ff3b5c]"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      <section className="mb-5 overflow-hidden rounded-[24px] border border-[#f3d9df] bg-white shadow-[0_10px_34px_rgba(22,24,35,0.06)]">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[17px] bg-gradient-to-br from-[#ff4766] to-[#ff2f57] text-white shadow-[0_9px_20px_rgba(255,59,92,0.22)]">
              <Sparkles className="h-5 w-5" strokeWidth={2.4} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[17px] font-black tracking-tight text-[#161823]">
                  {t("members.planToday")}
                </h2>
                <span className="shrink-0 rounded-full bg-[#fff0f3] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#ff3b5c]">
                  {t("members.day", { day: planDay })}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-[1.45] text-[#747378]">
                {t("members.planSubtitle")}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[19px] bg-[#f8f8f9] p-3.5 ring-1 ring-black/[0.035]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#929297]">
                  {t("members.progressToday")}
                </p>
                <p className="mt-1 text-[20px] font-black leading-none tracking-tight text-[#161823]">
                  {t("members.videosCount", {
                    count: planCompleted ? 3 : completedToday,
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-[15px] bg-white px-3 py-2 shadow-sm ring-1 ring-black/[0.04]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#ffe58a] to-[#f3b51b] text-[11px] font-black text-[#7b5700] shadow-inner">
                  €
                </span>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.07em] text-[#a0a0a4]">
                    {t("members.reward")}
                  </p>
                  <p className="text-[14px] font-black leading-none text-[#161823]">
                    {formatTikPayBalance(dayConfig.dailyTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: TIK_PAY_VIDEOS_PER_DAY }, (_, index) => {
                const complete = planCompleted || index < completedToday;
                return (
                  <div
                    key={index}
                    className={
                      "h-2 flex-1 rounded-full transition-colors " +
                      (complete ? "bg-[#ff3b5c]" : "bg-[#dedee1]")
                    }
                  />
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-[9px] font-bold text-[#99999e]">
              <span>
                {planCompleted
                  ? t("members.batchCompleted")
                  : completedToday === 0
                    ? t("members.startFirst")
                    : TIK_PAY_VIDEOS_PER_DAY - completedToday === 1
                      ? t("members.remainingOne")
                      : t("members.remainingMany", {
                          count: TIK_PAY_VIDEOS_PER_DAY - completedToday,
                        })}
              </span>
              <span>{planCompleted ? "100%" : Math.round((completedToday / TIK_PAY_VIDEOS_PER_DAY) * 100) + "%"}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-black/[0.055] bg-[#fcfcfc] px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={
                "grid h-10 w-10 shrink-0 place-items-center rounded-[14px] " +
                (planCompleted
                  ? "bg-[#eafaf0] text-[#159447]"
                  : locked
                    ? "bg-[#fff5df] text-[#b97808]"
                    : "bg-[#fff0f3] text-[#ff3b5c]")
              }
            >
              {planCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : locked ? (
                <LockKeyhole className="h-5 w-5" />
              ) : (
                <Play className="h-4.5 w-4.5 fill-current" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#929297]">
                {planCompleted
                  ? t("members.planCompleted")
                  : locked
                    ? t("members.nextBatch")
                    : t("members.batchAvailable")}
              </p>
              <p className="mt-0.5 text-[15px] font-black leading-none tabular-nums text-[#161823]">
                {planCompleted
                  ? t("members.days30Completed")
                  : locked
                    ? t("members.unlocksIn", { time: countdown })
                    : t("members.availableNow")}
              </p>
            </div>

            {available ? (
              <Link
                to="/module/start-here"
                className="shrink-0 rounded-full bg-[#ff3b5c] px-3 py-2 text-[9px] font-black uppercase tracking-[0.04em] text-white shadow-[0_6px_14px_rgba(255,59,92,0.22)]"
              >
                {t("members.watchVideos")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <MiniMetric
          icon={<Video className="h-4 w-4" />}
          label={t("members.progressToday")}
          value={
            planCompleted
              ? t("members.planCompleted")
              : t("members.ofThree", { count: completedToday })
          }
        />
        <MiniMetric
          icon={<CalendarDays className="h-4 w-4" />}
          label={t("members.totalProgress")}
          value={t("members.ofThirty", { count: completedDays })}
        />
      </section>

      <section className="mb-5 rounded-[22px] border border-black/[0.05] bg-white p-4 shadow-[0_8px_26px_rgba(0,0,0,0.05)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#ff3b5c]" />
              <h2 className="text-[15px] font-black text-[#161823]">{t("members.progress30")}</h2>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8a8a8e]">
              {t("members.progress30Subtitle")}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#fff0f3] px-2.5 py-1 text-[10px] font-black text-[#ff3b5c]">
            {completedDays}/30
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: TIK_PAY_PLAN_DAYS }, (_, index) => {
            const day = index + 1;
            const completed = day <= completedDays;
            const current = !planCompleted && day === planDay;
            const future = day > planDay;

            return (
              <div
                key={day}
                className={
                  "relative flex aspect-square items-center justify-center rounded-[13px] text-[11px] font-black " +
                  (completed
                    ? "bg-[#159447] text-white shadow-[0_5px_12px_rgba(21,148,71,0.18)]"
                    : current && locked
                      ? "bg-[#fff5df] text-[#b97808] ring-1 ring-[#f4d68c]"
                      : current
                        ? "bg-[#ff3b5c] text-white shadow-[0_5px_12px_rgba(255,59,92,0.18)]"
                        : future
                          ? "bg-[#f4f4f5] text-[#b8b8bb]"
                          : "bg-[#f4f4f5] text-[#a0a0a4]")
                }
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : current && locked ? (
                  <LockKeyhole className="h-3.5 w-3.5" />
                ) : (
                  day
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ededee]">
          <div
            className="h-full rounded-full bg-[#ff3b5c] transition-[width] duration-500"
            style={{
              width: String(
                Math.round((completedDays / TIK_PAY_PLAN_DAYS) * 100),
              ) + "%",
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-[#8a8a8e]">
          <span>{t("members.daysCompleted", { count: completedDays })}</span>
          <span>{Math.round((completedDays / TIK_PAY_PLAN_DAYS) * 100)}%</span>
        </div>
      </section>

      <div className="space-y-3">
        {available ? (
          <ModuleCard
            to="/module/start-here"
            title={t("members.rewardsDay", { day: planDay })}
            subtitle={
              TIK_PAY_VIDEOS_PER_DAY - completedToday === 1
                ? t("members.pendingOne")
                : t("members.pendingMany", {
                    count: TIK_PAY_VIDEOS_PER_DAY - completedToday,
                  })
            }
            description={t("members.moduleDescription")}
            icon={<Play className="h-6 w-6 fill-white" />}
          />
        ) : (
          <LockedModuleCard
            title={
              planCompleted
                ? t("members.dailyPlanCompleted")
                : t("members.nextBatchLocked")
            }
            subtitle={planCompleted ? "30/30 días" : countdown}
            description={
              planCompleted
                ? t("members.planDoneDescription")
                : t("members.lockedDescription")
            }
          />
        )}

      </div>
    </MembersLayout>
  );
}

function MiniMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.05] bg-white p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-xl bg-[#fff0f3] text-[#ff3b5c]">{icon}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#8a8a8e]">{label}</div>
      <div className="mt-1 text-[17px] font-black text-[#161823]">{value}</div>
    </div>
  );
}

function ModuleCard({
  to,
  title,
  subtitle,
  description,
  icon,
}: {
  to: "/module/start-here";
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex w-full items-center gap-4 rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-[0_8px_26px_rgba(0,0,0,0.05)] transition-all active:scale-[0.995]"
    >
      <div className="relative grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-gradient-to-br from-[#ff3b5c] to-[#fe2b54] text-white shadow-[0_8px_20px_rgba(255,59,92,0.2)]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-black leading-tight text-[#161823]">{title}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-[#747378]">{description}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fff0f3] px-2.5 py-1 text-[10px] font-bold text-[#ff3b5c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b5c]" />
          {subtitle}
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-[#c5c5c7]" />
    </Link>
  );
}

function LockedModuleCard({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="flex w-full items-center gap-4 rounded-[20px] border border-black/[0.06] bg-white p-4 opacity-85 shadow-[0_8px_26px_rgba(0,0,0,0.04)]">
      <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[18px] bg-[#f2f2f3] text-[#9b9b9f]">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-black leading-tight text-[#161823]">{title}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-[#747378]">{description}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#fff5df] px-2.5 py-1 text-[10px] font-black text-[#a66a05]">
          <Clock3 className="h-3 w-3" />
          {subtitle}
        </div>
      </div>
    </div>
  );
}
