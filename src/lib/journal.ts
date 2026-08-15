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
  rules?: string[];
  createdAt: number;
};

export type JournalDraft = Omit<JournalEntry, "id" | "createdAt">;

export type ProjectedTarget = {
  target: number;
  date: string;
};

export type DepositEntry = {
  id: string;
  date: string;
  amount: number;
  createdAt: number;
};

const KEY = "trademetric:journal";
const PROJ_KEY = "trademetric:target";
const BAL_KEY = "trademetric:balance";
const DEPOSIT_KEY = "trademetric:deposit";
const DEPOSITS_KEY = "trademetric:deposits";

let depositCache = 0;
let depositLoaded = false;

let cache: JournalEntry[] = [];
let balanceCache = 0;
let version = 0;
let depositsCache: DepositEntry[] | null = null;
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
  const total = getDepositTotal();
  if (total > 0) return total;
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

export function getDeposit(): number {
  if (!depositLoaded) {
    depositLoaded = true;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(DEPOSIT_KEY);
        const n = raw ? Number(JSON.parse(raw)) : 0;
        if (Number.isFinite(n) && n > 0) depositCache = n;
      } catch {
        // ignore
      }
    }
  }
  return depositCache;
}

function saveDeposits(list: DepositEntry[]) {
  try {
    localStorage.setItem(DEPOSITS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function loadDeposits(): DepositEntry[] {
  if (depositsCache) return depositsCache;
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEPOSITS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        depositsCache = arr;
        return arr;
      }
    }
  } catch {
    // ignore
  }
  const legacy = getDeposit();
  const migrated: DepositEntry[] = legacy > 0
    ? [{ id: "d-legacy", date: today(), amount: Math.round(legacy * 100) / 100, createdAt: Date.now() }]
    : [];
  depositsCache = migrated;
  saveDeposits(migrated);
  return migrated;
}

export function getDeposits(): DepositEntry[] {
  return loadDeposits();
}

export function getDepositTotal(): number {
  return loadDeposits().reduce((s, d) => s + d.amount, 0);
}

export function addDeposit(amount: number, date?: string): DepositEntry {
  const d: DepositEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    date: date || today(),
    amount: Math.max(0, Math.round(amount * 100) / 100),
    createdAt: Date.now(),
  };
  const list = [...loadDeposits(), d];
  depositsCache = list;
  saveDeposits(list);
  depositCache = getDepositTotal();
  depositLoaded = true;
  emit();
  return d;
}

export function deleteDeposit(id: string) {
  const list = loadDeposits().filter((d) => d.id !== id);
  depositsCache = list;
  saveDeposits(list);
  depositCache = getDepositTotal();
  depositLoaded = true;
  emit();
}

export function setDeposit(n: number) {
  depositCache = Math.max(0, n);
  depositLoaded = true;
  try {
    localStorage.setItem(DEPOSIT_KEY, JSON.stringify(depositCache));
  } catch {
    // ignore
  }
  emit();
}

export { today };