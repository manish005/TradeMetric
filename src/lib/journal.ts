"use client";

export type JournalEntry = {
  id: string;
  date: string;
  pair: string;
  deposit: number;
  profit: number;
  loss: number;
  commission: number;
  projected: number;
  achieved: boolean;
  createdAt: number;
};

export type JournalDraft = Omit<JournalEntry, "id" | "createdAt">;

export type ProjectedTarget = {
  target: number;
  date: string;
};

const KEY = "trademetric:journal";
const PROJ_KEY = "trademetric:target";
const BAL_KEY = "trademetric:balance";

let cache: JournalEntry[] = [];
let balanceCache = 0;
let version = 0;
const listeners = new Set<() => void>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emit() {
  version++;
  listeners.forEach((l) => l());
}

function load(): JournalEntry[] {
  if (typeof window === "undefined") return cache;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

cache = load();

export function subscribeJournal(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getJournalVersion(): number {
  return version;
}

export function getJournalEntries(): JournalEntry[] {
  return cache;
}

export function addJournalEntry(draft: JournalDraft): JournalEntry {
  const entry: JournalEntry = {
    ...draft,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  cache = [entry, ...cache];
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage full - keep in memory for the session
  }
  emit();
  return entry;
}

export function deleteJournalEntry(id: string) {
  cache = cache.filter((e) => e.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
  emit();
}

export function getProjected(): ProjectedTarget {
  if (typeof window === "undefined") return { target: 0, date: "" };
  try {
    const raw = localStorage.getItem(PROJ_KEY);
    return raw ? (JSON.parse(raw) as ProjectedTarget) : { target: 0, date: "" };
  } catch {
    return { target: 0, date: "" };
  }
}

export function getInitialBalance(): number {
  if (typeof window !== "undefined" && balanceCache === 0) {
    try {
      const raw = localStorage.getItem(BAL_KEY);
      const n = raw ? Number(JSON.parse(raw)) : 0;
      if (Number.isFinite(n) && n > 0) balanceCache = n;
    } catch {
      // ignore
    }
  }
  return balanceCache;
}

export function setInitialBalance(n: number) {
  balanceCache = Math.max(0, n);
  try {
    localStorage.setItem(BAL_KEY, JSON.stringify(balanceCache));
  } catch {
    // ignore
  }
  emit();
}

export function updateJournalEntry(id: string, draft: JournalDraft): JournalEntry | null {
  const found = cache.find((e) => e.id === id);
  if (!found) return null;
  const updated: JournalEntry = { ...found, ...draft };
  cache = cache.map((e) => (e.id === id ? updated : e));
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
  emit();
  return updated;
}

export function setProjected(target: number, date: string) {
  try {
    localStorage.setItem(PROJ_KEY, JSON.stringify({ target, date }));
  } catch {
    // ignore
  }
}

export { today };