"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { isAdminEmail } from "@/lib/admin";
import { money, round, number } from "@/lib/format";

type UserDoc = {
  id: string;
  email?: string | null;
  name?: string | null;
  createdAt?: number;
  lastSeen?: number;
};

type SessionDoc = {
  id?: string;
  uid?: string;
  startedAt?: number;
  durationSec?: number;
};

type PurchaseDoc = {
  uid?: string;
  email?: string | null;
  planName?: string;
  price?: number;
  purchasedAt?: number;
  expiresAt?: number;
  status?: string;
};

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${round(sec / 60, 1)}m`;
  return `${round(sec / 3600, 2)}h`;
}

function fmtTime(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDay(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function fmtAgo(ts?: number, now = Date.now()): string {
  if (!ts) return "—";
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function useNowTs(): number {
  const [now] = useState(() => Date.now());
  return now;
}

function exportCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const header = Object.keys(rows[0] ?? {});
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      header.map((h) => `"${String(r[h] ?? "").replaceAll('"', '""')}"`).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

type AccessStatus = "paid" | "trial" | "none";

export default function AdminView() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDoc[] | null>(null);
  const [sessions, setSessions] = useState<SessionDoc[] | null>(null);
  const [purchases, setPurchases] = useState<PurchaseDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "paying" | "trial" | "active">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { getFirestore, getDocs, collection } = await import("firebase/firestore");
        const { app } = await import("@/lib/firebase");
        const db = getFirestore(app);
        const [us, s, p] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "sessions")),
          getDocs(collection(db, "purchases")),
        ]);
        if (cancelled) return;
        setUsers(us.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<UserDoc>) })));
        setSessions(s.docs.map((d) => d.data() as SessionDoc));
        setPurchases(p.docs.map((d) => d.data() as PurchaseDoc));
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load analytics.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const now = useNowTs();

  if (!isAdminEmail(user?.email)) return null;

  const sortedPurchases = [...(purchases ?? [])].sort(
    (a, b) => (b.purchasedAt ?? 0) - (a.purchasedAt ?? 0)
  );

  const accessFor = new Map<string, { status: AccessStatus; label: string; expiresAt?: number }>();
  (purchases ?? [])
    .slice()
    .sort((a, b) => (b.purchasedAt ?? 0) - (a.purchasedAt ?? 0))
    .forEach((p) => {
      const uid = p.uid ?? "";
      const expires = p.expiresAt ?? 0;
      if (expires < now) return; // expired — treat as none
      const status: AccessStatus = p.status === "trial" ? "trial" : "paid";
      accessFor.set(uid, {
        status,
        label:
          status === "trial"
            ? "Free Trial"
            : p.planName && p.planName !== "Free Trial"
              ? p.planName
              : "Paid plan",
        expiresAt: expires,
      });
    });

  const registeredUsers = users?.length ?? 0;
  const revenue = sortedPurchases.reduce((s, p) => s + (p.status === "paid" ? (p.price ?? 0) : 0), 0);
  const payingUsers = new Set(
    sortedPurchases.filter((p) => p.status === "paid").map((p) => p.uid)
  ).size;
  const trialUsers = new Set(
    sortedPurchases.filter((p) => p.status === "trial").map((p) => p.uid)
  ).size;
  const conversion = registeredUsers > 0 ? round((payingUsers / registeredUsers) * 100, 1) : 0;

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const mau = (sessions ?? []).filter((s) => (s.startedAt ?? 0) >= monthStart.getTime()).length;

  const totalSessions = (sessions ?? []).length;
  const totalDuration = (sessions ?? []).reduce((s, x) => s + (x.durationSec ?? 0), 0);
  const avgTime = totalSessions > 0 ? totalDuration / totalSessions : 0;

  const dayMap = new Map<string, number>();
  (sessions ?? []).forEach((s) => {
    const k = dayKey(s.startedAt ?? now);
    dayMap.set(k, (dayMap.get(k) ?? 0) + 1);
  });
  const signupMap = new Map<string, number>();
  (users ?? []).forEach((u) => {
    if (!u.createdAt) return;
    const k = dayKey(u.createdAt);
    signupMap.set(k, (signupMap.get(k) ?? 0) + 1);
  });
  const last14: Array<{ key: string; label: string; views: number; signups: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const ts = now - i * 86400000;
    last14.push({
      key: dayKey(ts),
      label: fmtDay(ts),
      views: dayMap.get(dayKey(ts)) ?? 0,
      signups: signupMap.get(dayKey(ts)) ?? 0,
    });
  }
  const maxViews = Math.max(1, ...last14.map((d) => d.views));
  const maxSignups = Math.max(1, ...last14.map((d) => d.signups));

  const planTotals = new Map<string, number>();
  sortedPurchases.forEach((p) => {
    if (p.status !== "paid") return;
    const name = p.planName ?? "Unknown";
    planTotals.set(name, (planTotals.get(name) ?? 0) + (p.price ?? 0));
  });
  const planBars = [...planTotals.entries()].sort((a, b) => b[1] - a[1]);
  const maxPlan = Math.max(1, ...planBars.map(([, v]) => v));
  const planCount = new Map<string, number>();
  sortedPurchases.forEach((p) => {
    if (p.status !== "paid") return;
    const name = p.planName ?? "Unknown";
    planCount.set(name, (planCount.get(name) ?? 0) + 1);
  });

  type UserRow = {
    uid: string;
    email: string;
    sessions: number;
    totalSec: number;
    lastSeen?: number;
    createdAt?: number;
    status: AccessStatus;
    planLabel: string;
    expiresAt?: number;
  };
  const perUser = new Map<string, UserRow>();
  (users ?? []).forEach((u) =>
    perUser.set(u.id, {
      uid: u.id,
      email: u.email ?? "—",
      sessions: 0,
      totalSec: 0,
      lastSeen: u.lastSeen,
      createdAt: u.createdAt,
      status: "none",
      planLabel: "—",
    })
  );
  accessFor.forEach((a, uid) => {
    const row = perUser.get(uid);
    if (row) {
      row.status = a.status;
      row.planLabel = a.label;
      row.expiresAt = a.expiresAt;
    }
  });
  (sessions ?? []).forEach((s) => {
    const row = perUser.get(s.uid ?? "");
    if (row) {
      row.sessions += 1;
      row.totalSec += s.durationSec ?? 0;
    }
  });
  const sortedUsers = [...perUser.values()].sort((a, b) => b.totalSec - a.totalSec);

  const activeNow = (users ?? []).filter((u) => (u.lastSeen ?? 0) >= now - 90_000).length;

  const q = query.trim().toLowerCase();
  const filteredUsers = sortedUsers.filter((u) => {
    if (q && !u.email.toLowerCase().includes(q)) return false;
    if (tab === "paying") return u.status === "paid";
    if (tab === "trial") return u.status === "trial";
    if (tab === "active") return (u.lastSeen ?? 0) >= now - 3_600_000;
    return true;
  });

  const onExportUsers = () =>
    exportCsv(
      "tradermatrix-users.csv",
      filteredUsers.map((u) => ({
        email: u.email,
        access: u.status,
        plan: u.planLabel,
        sessions: u.sessions,
        total_time_sec: u.totalSec,
        last_seen: fmtTime(u.lastSeen),
        joined: fmtDay(u.createdAt),
      }))
    );
  const onExportPurchases = () =>
    exportCsv(
      "tradermatrix-purchases.csv",
      sortedPurchases.map((p) => ({
        email: p.email ?? "",
        plan: p.planName ?? "",
        status: p.status ?? "",
        price_inr: p.price ?? 0,
        purchased: fmtTime(p.purchasedAt),
        expires: fmtTime(p.expiresAt),
      }))
    );

  return (
    <div className="mx-auto w-full max-w-6xl">
      {error && (
        <div className="rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-[13px] font-semibold text-coral">
          Failed to read analytics: {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label="Registered users" value={number(registeredUsers)} tone="mint" />
        <StatBox label="Paying users" value={number(payingUsers)} tone="amber" />
        <StatBox label="Revenue (demo)" value={money(revenue, "rupee")} tone="mint" />
        <StatBox label="Monthly active" value={number(mau)} tone="cyan" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label="Trial users" value={number(trialUsers)} tone="cyan" />
        <StatBox label="Conversion rate" value={`${conversion}%`} tone="amber" />
        <StatBox label="Avg time / session" value={fmtDuration(Math.round(avgTime))} tone="mint" />
        <StatBox label="Online now" value={number(activeNow)} tone="mint" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted">
              Activity · last 14 days
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-faint">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-mint/50" /> sessions
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber/50" /> signups
              </span>
            </div>
          </div>
          <div className="mt-4 flex h-32 items-end gap-1.5">
            {last14.map((d, i) => (
              <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-panel2 px-1.5 py-0.5 text-[9px] font-bold text-ink opacity-0 shadow transition-opacity group-hover:opacity-100">
                  {d.views} sessions · {d.signups} signups
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md bg-amber/40"
                  style={{ height: `${Math.max(2, (d.signups / maxSignups) * 100)}%` }}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(3, (d.views / maxViews) * 100)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full rounded-t-md bg-mint/50"
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-faint">
            <span>{last14[0]?.label}</span>
            <span>{last14[last14.length - 1]?.label}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted">
            Revenue by plan (demo)
          </h3>
          {planBars.length === 0 ? (
            <p className="mt-8 text-center text-[12px] text-faint">No purchases yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {planBars.map(([name, value]) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-muted">{name}</span>
                    <span className="tabular-nums text-faint">
                      {planCount.get(name) ?? 0} × <b className="text-ink">{money(value, "rupee")}</b>
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / maxPlan) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-amber to-mint"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-panel2/40 p-3 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-faint">Paid</div>
              <div className="mt-0.5 text-[15px] font-black tabular-nums text-mint">{number(payingUsers)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-faint">Trial</div>
              <div className="mt-0.5 text-[15px] font-black tabular-nums text-cyan">{number(trialUsers)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-faint">Converted</div>
              <div className="mt-0.5 text-[15px] font-black tabular-nums text-amber">{conversion}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users */}
      <div className="mt-4 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "paying", "trial", "active"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize transition-colors ${
                  tab === t
                    ? "bg-amber/15 text-amber ring-1 ring-amber/40"
                    : "bg-panel2/60 text-muted hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email…"
              className="h-9 w-48 rounded-xl border border-line bg-panel px-3 text-[12px] text-ink outline-none transition-colors placeholder:text-faint focus:border-mint/60"
            />
            <button
              onClick={onExportUsers}
              disabled={filteredUsers.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-panel2 px-3 text-[11px] font-bold text-muted transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
            >
              CSV
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                <th className="pb-2 pr-3 font-bold">User</th>
                <th className="pb-2 pr-3 font-bold">Access</th>
                <th className="pb-2 pr-3 font-bold">Sessions</th>
                <th className="pb-2 pr-3 font-bold">Total time</th>
                <th className="pb-2 pr-3 font-bold">Last seen</th>
                <th className="pb-2 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-faint">
                    No users match.
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="border-b border-line/60 text-muted">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      {((u.lastSeen ?? 0) >= now - 90_000) && (
                        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-mint" />
                      )}
                      <span className="font-semibold text-ink">{u.email}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <AccessChip status={u.status} label={u.planLabel} />
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{u.sessions}</td>
                  <td className="py-2.5 pr-3 font-bold tabular-nums text-mint">
                    {fmtDuration(u.totalSec)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{fmtAgo(u.lastSeen, now)}</td>
                  <td className="py-2.5">{fmtDay(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchases */}
      <div className="mt-4 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted">
            Recent purchases
          </h3>
          <button
            onClick={onExportPurchases}
            disabled={sortedPurchases.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-panel2 px-3 text-[11px] font-bold text-muted transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
          >
            CSV
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                <th className="pb-2 pr-3 font-bold">User</th>
                <th className="pb-2 pr-3 font-bold">Plan</th>
                <th className="pb-2 pr-3 font-bold">Status</th>
                <th className="pb-2 pr-3 font-bold">Amount</th>
                <th className="pb-2 pr-3 font-bold">Purchased</th>
                <th className="pb-2 font-bold">Expires</th>
              </tr>
            </thead>
            <tbody>
              {sortedPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-faint">
                    No purchases recorded yet.
                  </td>
                </tr>
              )}
              {sortedPurchases.map((p, i) => (
                <tr key={i} className="border-b border-line/60 text-muted">
                  <td className="py-2.5 pr-3 font-semibold text-ink">{p.email ?? "—"}</td>
                  <td className="py-2.5 pr-3">{p.planName ?? "—"}</td>
                  <td className="py-2.5 pr-3">
                    <AccessChip status={p.status === "trial" ? "trial" : "paid"} label={p.status ?? "paid"} />
                  </td>
                  <td className="py-2.5 pr-3 font-bold tabular-nums text-amber">
                    {p.status === "paid" ? money(p.price ?? 0, "rupee") : "—"}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{fmtTime(p.purchasedAt)}</td>
                  <td className="py-2.5 tabular-nums">{fmtDay(p.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-faint">
        Live data — signed-in activity only; sessions heartbeat every 30s while a tab is open.
        Access status is derived from the latest unexpired purchase/trial record.
      </p>
    </div>
  );
}

function AccessChip({ status, label }: { status: AccessStatus; label: string }) {
  const styles =
    status === "paid"
      ? "border-mint/30 bg-mint/10 text-mint"
      : status === "trial"
        ? "border-cyan/30 bg-cyan/10 text-cyan"
        : "border-line bg-panel2/60 text-faint";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${styles}`}>
      {label}
    </span>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/70 p-4 backdrop-blur">
      <div className="text-[10px] font-bold uppercase tracking-wider text-faint">{label}</div>
      <div className={`mt-1 text-xl font-black tabular-nums text-${tone}`}>{value}</div>
    </div>
  );
}