"use client";

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
  earnedOn?: string;
};

export function computeAchievements(input: {
  count: number;
  winRate: number;
  netProfit: number;
  consist: number;
  maxWinStreak: number;
  currentStreak: number;
  firstHit: string | null;
  goalsDone: number;
  balanceMultiple: number;
}): Achievement[] {
  const {
    count,
    winRate,
    netProfit,
    consist,
    maxWinStreak,
    currentStreak,
    firstHit,
    goalsDone,
    balanceMultiple,
  } = input;

  return [
    {
      id: "first",
      icon: "🎯",
      title: "First Trade",
      desc: "Log your first journal entry",
      unlocked: count >= 1,
      earnedOn: firstHit ?? undefined,
    },
    {
      id: "first-hit",
      icon: "🏆",
      title: "Target Breaker",
      desc: "Hit your first daily target",
      unlocked: !!firstHit,
      earnedOn: firstHit ?? undefined,
    },
    {
      id: "streak3",
      icon: "⚡",
      title: "On Fire ×3",
      desc: "Win 3 trades in a row",
      unlocked: maxWinStreak >= 3,
    },
    {
      id: "streak5",
      icon: "🔥",
      title: "Unstoppable ×5",
      desc: "Win 5 trades in a row",
      unlocked: maxWinStreak >= 5,
    },
    {
      id: "win50",
      icon: "🎓",
      title: "Sharpshooter",
      desc: "50%+ win rate over 10 trades",
      unlocked: count >= 10 && winRate >= 50,
    },
    {
      id: "profitable",
      icon: "💰",
      title: "In the Green",
      desc: "Positive net profit overall",
      unlocked: netProfit > 0,
    },
    {
      id: "consistent",
      icon: "📅",
      title: "Consistent One",
      desc: "70%+ of targets hit (5+ trades)",
      unlocked: count >= 5 && consist >= 70,
    },
    {
      id: "ten",
      icon: "🧠",
      title: "Veteran",
      desc: "Log 10 trades",
      unlocked: count >= 10,
    },
    {
      id: "fifty",
      icon: "👑",
      title: "Monk Mode",
      desc: "Log 50 trades",
      unlocked: count >= 50,
    },
    {
      id: "growth",
      icon: "🚀",
      title: "Growth Engine",
      desc: "Balance at 2x starting deposit",
      unlocked: balanceMultiple >= 2,
    },
    {
      id: "goal",
      icon: "🎖️",
      title: "Goal Getter",
      desc: "Complete a goal",
      unlocked: goalsDone > 0,
    },
    {
      id: "streak-now",
      icon: "⚡",
      title: "Live Streak",
      desc: `Current win streak: ${currentStreak} trades`,
      unlocked: currentStreak >= 2,
    },
  ];
}