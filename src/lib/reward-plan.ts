export const TIK_PAY_PLAN_DAYS = 30;
export const TIK_PAY_VIDEOS_PER_DAY = 3;
export const TIK_PAY_DAY1_TOTAL_REWARD = 5;

const PLAN_START_KEY = "tikpay:reward-plan-start";

export type RewardDay = {
  day: number;
  growthRate: number;
  dailyTotal: number;
  videoRewards: number[];
};

export function getGrowthRateForDay(day: number) {
  if (day <= 10) return 0.10;
  if (day <= 20) return 0.15;
  return 0.20;
}

function splitDailyReward(total: number) {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / TIK_PAY_VIDEOS_PER_DAY);
  const remainder = totalCents - baseCents * TIK_PAY_VIDEOS_PER_DAY;

  return Array.from({ length: TIK_PAY_VIDEOS_PER_DAY }, (_, index) => {
    const cents = baseCents + (index >= TIK_PAY_VIDEOS_PER_DAY - remainder ? 1 : 0);
    return cents / 100;
  });
}

export function buildTikPayRewardPlan(): RewardDay[] {
  const days: RewardDay[] = [];
  let dailyTotal = TIK_PAY_DAY1_TOTAL_REWARD;

  for (let day = 1; day <= TIK_PAY_PLAN_DAYS; day += 1) {
    if (day > 1) {
      dailyTotal = Math.round(dailyTotal * (1 + getGrowthRateForDay(day)) * 100) / 100;
    }

    days.push({
      day,
      growthRate: getGrowthRateForDay(day),
      dailyTotal,
      videoRewards: splitDailyReward(dailyTotal),
    });
  }

  return days;
}

export function readOrCreatePlanStartDate() {
  if (typeof window === "undefined") return new Date();

  try {
    const stored = window.localStorage.getItem(PLAN_START_KEY);
    if (stored) {
      const parsed = new Date(stored);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const now = new Date();
    const normalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    window.localStorage.setItem(PLAN_START_KEY, normalized.toISOString());
    return normalized;
  } catch {
    return new Date();
  }
}

export function getPlanDayFromStartDate(startDate: string | Date, now = new Date()) {
  const start =
    startDate instanceof Date
      ? startDate
      : new Date(`${startDate.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(start.getTime())) return 1;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diffDays = Math.floor((today.getTime() - startDay.getTime()) / 86400000);

  return Math.max(1, Math.min(TIK_PAY_PLAN_DAYS, diffDays + 1));
}

export function getCurrentPlanDay() {
  if (typeof window === "undefined") return 1;
  return getPlanDayFromStartDate(readOrCreatePlanStartDate());
}

export function rewardIdForVideo(day: number, videoIndex: number) {
  return `plan-day-${day}-video-${videoIndex}`;
}
