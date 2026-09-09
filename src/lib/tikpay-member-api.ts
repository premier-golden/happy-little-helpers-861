import { tikPayAuthenticatedFetch } from "@/lib/tikpay-auth";
import { syncTikPayBalance } from "@/lib/members-balance";

export type TikPayMemberRow = {
  id: string;
  full_name: string;
  email: string | null;
  balance: number | string;
  active_day: number;
  completed_days: number;
  next_unlock_at: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  is_admin: boolean;
};

export type TikPayMemberProgressRow = {
  plan_day: number;
  video_index: number;
  progress: number | string;
  reward_amount: number | string;
  reward_claimed: boolean;
  completed_at: string | null;
  updated_at: string;
};

export type TikPayAccountState = {
  member: {
    id: string;
    fullName: string;
    email: string | null;
    balance: number;
    activeDay: number;
    completedDays: number;
    nextUnlockAt: string | null;
    avatarUrl: string | null;
    isAdmin: boolean;
  };
  progress: Array<{
    planDay: number;
    videoIndex: number;
    progress: number;
    rewardAmount: number;
    rewardClaimed: boolean;
    completedAt: string | null;
  }>;
};

async function parseError(response: Response) {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as { message?: string; details?: string; hint?: string; code?: string };
    return parsed.message || parsed.details || parsed.hint || parsed.code || raw;
  } catch {
    return raw;
  }
}

export async function fetchTikPayAccountState(): Promise<TikPayAccountState> {
  const [memberResponse, progressResponse] = await Promise.all([
    tikPayAuthenticatedFetch(
      "tikpay_members?select=id,full_name,email,balance,active_day,completed_days,next_unlock_at,avatar_url,is_admin,created_at,updated_at&limit=1",
    ),
    tikPayAuthenticatedFetch(
      "tikpay_video_progress?select=plan_day,video_index,progress,reward_amount,reward_claimed,completed_at,updated_at&order=plan_day.asc,video_index.asc",
    ),
  ]);

  if (!memberResponse.ok) {
    throw new Error(await parseError(memberResponse));
  }

  if (!progressResponse.ok) {
    throw new Error(await parseError(progressResponse));
  }

  const members = (await memberResponse.json()) as TikPayMemberRow[];
  const rows = (await progressResponse.json()) as TikPayMemberProgressRow[];
  const member = members[0];

  if (!member) throw new Error("member_not_found");

  const state: TikPayAccountState = {
    member: {
      id: member.id,
      fullName: member.full_name || "",
      email: member.email,
      balance: Number(member.balance),
      activeDay: Number(member.active_day),
      completedDays: Number(member.completed_days),
      nextUnlockAt: member.next_unlock_at,
      avatarUrl: member.avatar_url,
      isAdmin: Boolean(member.is_admin),
    },
    progress: rows.map((row) => ({
      planDay: Number(row.plan_day),
      videoIndex: Number(row.video_index),
      progress: Number(row.progress),
      rewardAmount: Number(row.reward_amount),
      rewardClaimed: Boolean(row.reward_claimed),
      completedAt: row.completed_at,
    })),
  };

  syncTikPayBalance(state.member.balance);
  return state;
}

export async function saveTikPayVideoProgressAuth(
  planDay: number,
  videoIndex: number,
  progress: number,
) {
  const response = await tikPayAuthenticatedFetch("rpc/save_tikpay_video_progress_auth", {
    method: "POST",
    body: JSON.stringify({
      p_plan_day: planDay,
      p_video_index: videoIndex,
      p_progress: progress,
    }),
  });

  if (!response.ok) {
    const message = await parseError(response);
    if (message.includes("day_locked") || message.includes("day_not_active")) {
      window.dispatchEvent(new Event("tikpay:member-state-update"));
    }
    throw new Error(message);
  }

  const rows = (await response.json()) as Array<{ saved_progress: number | string }>;
  return { progress: Number(rows[0]?.saved_progress ?? progress) };
}

export async function claimTikPayVideoRewardAuth(planDay: number, videoIndex: number) {
  const response = await tikPayAuthenticatedFetch("rpc/claim_tikpay_video_reward_auth", {
    method: "POST",
    body: JSON.stringify({
      p_plan_day: planDay,
      p_video_index: videoIndex,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const rows = (await response.json()) as Array<{
    new_balance: number | string;
    reward_added: boolean;
    reward_amount: number | string;
    active_day: number;
    completed_days: number;
    next_unlock_at: string | null;
  }>;

  const row = rows[0];
  const result = {
    balance: Number(row?.new_balance ?? 0),
    added: Boolean(row?.reward_added),
    rewardAmount: Number(row?.reward_amount ?? 0),
    activeDay: Number(row?.active_day ?? planDay),
    completedDays: Number(row?.completed_days ?? 0),
    nextUnlockAt: row?.next_unlock_at ?? null,
  };

  syncTikPayBalance(result.balance);
  window.dispatchEvent(new Event("tikpay:member-state-update"));
  return result;
}
