"use client";

import type { User } from "firebase/auth";

export type Plan = {
  id: string;
  name: string;
  price: number; // INR
  period: "day" | "week" | "month" | "year";
  tagline: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    period: "day",
    tagline: "Full access for 1 day",
    features: [
      "Every tool unlocked for 24h",
      "No payment needed",
      "Starts the moment you activate",
    ],
  },
  {
    id: "weekly",
    name: "Weekly",
    price: 50,
    period: "week",
    tagline: "Full access for 7 days",
    features: ["All tools unlocked", "Renewable anytime"],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 130,
    period: "month",
    tagline: "Full access for 30 days",
    features: ["All tools unlocked", "Best for daily traders"],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 700,
    period: "year",
    tagline: "Full access for 365 days",
    features: ["All tools unlocked", "Best value"],
  },
];

export type OwnedPlan = {
  planId: string;
  purchasedAt: number;
  expiresAt: number;
};

type AccessState = {
  trial?: { activatedAt: number; expiresAt: number };
  plans: OwnedPlan[];
};

export type ActiveAccess = {
  fullAccess: boolean;
  label: string | null;
  expiresAt: number | null;
  kind: "trial" | "plan" | "none";
};

const ACCESS_KEY = "tradermatrix:access";
const PERIOD_MS = {
  day: 86400000,
  week: 7 * 86400000,
  month: 30 * 86400000,
  year: 365 * 86400000,
} as const;

let cache: AccessState = { plans: [] };
let version = 0;
const listeners = new Set<() => void>();

function load(): AccessState {
  if (typeof window === "undefined") return cache;
  try {
    const raw = localStorage.getItem(ACCESS_KEY);
    return raw ? (JSON.parse(raw) as AccessState) : { plans: [] };
  } catch {
    return { plans: [] };
  }
}

cache = load();

function saveAndEmit() {
  version++;
  try {
    localStorage.setItem(ACCESS_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function subscribeAccess(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAccessVersion(): number {
  return version;
}

export function getAccess(): AccessState {
  return cache;
}

export function activateTrial() {
  const now = Date.now();
  cache = { ...cache, trial: { activatedAt: now, expiresAt: now + PERIOD_MS.day } };
  saveAndEmit();
  return cache.trial;
}

export function buyPlan(planId: string): OwnedPlan | null {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  const now = Date.now();
  const existing = cache.plans.find((p) => p.planId === planId);
  const base = existing && existing.expiresAt > now ? existing.expiresAt : now;
  const owned: OwnedPlan = {
    planId,
    purchasedAt: now,
    expiresAt: base + PERIOD_MS[plan.period],
  };
  cache = {
    ...cache,
    plans: [...cache.plans.filter((p) => p.planId !== planId), owned],
  };
  saveAndEmit();
  return owned;
}

export function accessStatus(now = Date.now()): ActiveAccess {
  const trial = cache.trial && cache.trial.expiresAt > now ? cache.trial : undefined;
  const activePlan = cache.plans
    .filter((p) => p.expiresAt > now)
    .sort((a, b) => b.expiresAt - a.expiresAt)[0];
  if (activePlan) {
    const plan = PLANS.find((p) => p.id === activePlan.planId);
    return {
      fullAccess: true,
      label: `${plan?.name ?? "Plan"} active`,
      expiresAt: activePlan.expiresAt,
      kind: "plan",
    };
  }
  if (trial) {
    return {
      fullAccess: true,
      label: "Free trial active",
      expiresAt: trial.expiresAt,
      kind: "trial",
    };
  }
  return { fullAccess: false, label: null, expiresAt: null, kind: "none" };
}

/** Demo payment – wired to a real gateway later; grants access + records Firestore analytics. */
export async function recordPurchase(user: User | null, plan: Plan): Promise<void> {
  const owned = buyPlan(plan.id);
  if (!owned || !user) return;
  try {
    const { getFirestore, addDoc, collection } = await import("firebase/firestore");
    const { app } = await import("@/lib/firebase");
    const db = getFirestore(app);
    await addDoc(collection(db, "purchases"), {
      uid: user.uid,
      email: user.email ?? "",
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      currency: "inr",
      purchasedAt: owned.purchasedAt,
      expiresAt: owned.expiresAt,
      status: "paid",
    });
  } catch {
    // Firestore unreachable – local access already granted
  }
}

/** Record a free-trial activation so the admin console can see it. */
export async function recordTrial(user: User | null, expiresAt: number): Promise<void> {
  if (!user) return;
  try {
    const { getFirestore, addDoc, collection } = await import("firebase/firestore");
    const { app } = await import("@/lib/firebase");
    const db = getFirestore(app);
    await addDoc(collection(db, "purchases"), {
      uid: user.uid,
      email: user.email ?? "",
      planId: "free",
      planName: "Free Trial",
      price: 0,
      currency: "inr",
      purchasedAt: Date.now(),
      expiresAt,
      status: "trial",
    });
  } catch {
    // Firestore unreachable — local access already granted
  }
}