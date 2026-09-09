import {
  claimTikPayVideoRewardAuth,
  fetchTikPayAccountState,
  saveTikPayVideoProgressAuth,
} from "@/lib/tikpay-member-api";

type MemberArg = { data: { memberId: string } };

type SaveArg = {
  data: {
    memberId: string;
    planDay: number;
    videoIndex: number;
    progress: number;
  };
};

type ClaimArg = {
  data: {
    memberId: string;
    planDay: number;
    videoIndex: number;
    reward: number;
  };
};

function planStartedOnForDay(activeDay: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - (Math.max(1, activeDay) - 1));
  return start.toISOString();
}

export async function getTikPayMemberState(_arg: MemberArg) {
  const state = await fetchTikPayAccountState();

  return {
    member: {
      id: state.member.id,
      balance: state.member.balance,
      planStartedOn: planStartedOnForDay(state.member.activeDay),
      activeDay: state.member.activeDay,
      completedDays: state.member.completedDays,
      nextUnlockAt: state.member.nextUnlockAt,
    },
    progress: state.progress,
  };
}

export async function saveTikPayVideoProgress({ data }: SaveArg) {
  return saveTikPayVideoProgressAuth(data.planDay, data.videoIndex, data.progress);
}

export async function claimTikPayVideoReward({ data }: ClaimArg) {
  const result = await claimTikPayVideoRewardAuth(data.planDay, data.videoIndex);

  return {
    balance: result.balance,
    added: result.added,
    rewardAmount: result.rewardAmount || data.reward,
    activeDay: result.activeDay,
    completedDays: result.completedDays,
    nextUnlockAt: result.nextUnlockAt,
  };
}
