"use client";

import type { CurrencyKey } from "@/lib/types";

export type Goal = {
  id: string;
  title: string;
  target: number;
  currency: CurrencyKey;
  deadline: string; // YYYY-MM-DD
  done: boolean;
  createdAt: number;
};

const GOALS_KEY = "trademetric:goals";

let cache: Goal[] = [];
let version = 0;
const listeners = new Set<() => void>();

function load(): Goal[] {
  if (typeof window === "undefined") return cache;
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? (JSON.parse(raw) as Goal[]) : [];
  } catch {
    return [];
  }
}

cache = load();

function emit() {
  version++;
  listeners.forEach((l) => l());
}

export function subscribeGoals(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getGoalsVersion(): number {
  return version;
}

export function loadGoals(): Goal[] {
  return cache.map((g) => ({ ...g, currency: g.currency ?? "dollar" as const }));
}

export function getGoals(): Goal[] {
  return loadGoals();
}

export function addGoal(g: Omit<Goal, "id" | "createdAt" | "done">): Goal {
  const goal: Goal = {
    ...g,
    done: false,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  cache = [goal, ...cache];
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(cache));
  } catch {
    // storage full
  }
  emit();
  return goal;
}

export function updateGoal(id: string, patch: Partial<Omit<Goal, "id" | "createdAt">>): Goal | null {
  const goal = cache.find((g) => g.id === id);
  if (!goal) return null;
  const updated = { ...goal, ...patch };
  cache = cache.map((g) => (g.id === id ? updated : g));
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
  emit();
  return updated;
}

export function deleteGoal(id: string) {
  cache = cache.filter((g) => g.id !== id);
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
  emit();
}