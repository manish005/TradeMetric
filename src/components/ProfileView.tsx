"use client";

import { useRef, useState, useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { User } from "firebase/auth";
import {
  IconDownload,
  IconShield,
  IconTrendUp,
  IconBars,
} from "@/components/icons";
import { useSettings, RISK_STYLES } from "@/lib/settings";
import { money, moneyCompact, round } from "@/lib/format";
import type { CurrencyKey } from "@/lib/types";
import {
  convert,
  loadRates,
  FALLBACK_RATES,
  CURRENCY_ISO,
} from "@/lib/rates";
import {
  addDeposit,
  deleteDeposit,
  getDeposit,
  getDeposits,
  getJournalEntries,
  getJournalVersion,
  getInitialBalance,
  subscribeJournal,
} from "@/lib/journal";
import { analyze, currentBalance, netSince } from "@/lib/analysis";
import { computeAchievements } from "@/lib/achievements";
import { downloadBackup, importBackup } from "@/lib/backup";
import { uploadProfileImage } from "@/lib/cloudinary";
import { app } from "@/lib/firebase";
import { getGoals } from "@/lib/goals";
import { isAdminEmail } from "@/lib/admin";
import GoalsPanel from "@/components/GoalsPanel";

export default function ProfileView({ user }: { user: User | null }) {
  const isAdmin = user ? isAdminEmail(user.email) : false;
  useSyncExternalStore(subscribeJournal, getJournalVersion);
  const settings = useSettings();
  const { setRiskStyle, currency, setCurrency } = settings;
  const uid = user?.uid ?? null;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [baseCur, setBaseCur] = useState<CurrencyKey>(() => {
    try {
      const raw = localStorage.getItem("trademetric:baseCur");
      if (raw && raw in CURRENCY_ISO) return raw as CurrencyKey;
    } catch {
      // ignore
    }
    return "dollar";
  });

  useEffect(() => {
    try {
      localStorage.setItem("trademetric:baseCur", baseCur);
    } catch {
      // ignore
    }
  }, [baseCur]);

  useEffect(() => {
    let mounted = true;
    loadRates().then((r) => {
      if (mounted) setRates(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const cx = (value: number) =>
    round(convert(value, CURRENCY_ISO[baseCur], CURRENCY_ISO[currency], rates), 2);

  const entries = getJournalEntries();
  const initial = getInitialBalance();
  const deposit = getDeposit();
  const deposits = getDeposits();
  const [depAmount, setDepAmount] = useState("");
  const [depDate, setDepDate] = useState(() => new Date().toISOString().slice(0, 10));
  const submitDeposit = () => {
    const n = Number(depAmount);
    if (!Number.isFinite(n) || n <= 0) return;
    addDeposit(n, depDate || undefined);
    setDepAmount("");
  };
  const metrics = analyze(entries, initial);
  const balance = currentBalance(entries, initial);
  const balanceMultiple = initial > 0 ? round(balance / initial, 2) : 0;
  const firstHit =
    entries.find((e) => e.achieved)?.date ?? null;
  const [growthPeriod, setGrowthPeriod] = useState<"day" | "week" | "month" | "year">("week");
  const growthPeriods: Array<{ key: typeof growthPeriod; days: number; label: string }> = [
    { key: "day", days: 0, label: "Day" },
    { key: "week", days: 7, label: "Week" },
    { key: "month", days: 30, label: "Month" },
    { key: "year", days: 365, label: "Year" },
  ];
  const periodNet = netSince(entries, growthPeriods.find((g) => g.key === growthPeriod)?.days ?? 7);
  const totalGrowth = deposit > 0 ? round(((balance - deposit) / deposit) * 100, 1) : 0;
  const hasTrades = entries.length > 0;
  const periodGrowth = deposit > 0 ? round((periodNet / deposit) * 100, 1) : 0;

  const achievements = computeAchievements({
    count: metrics.total,
    winRate: metrics.winRate,
    netProfit: metrics.netProfit,
    consist: metrics.consistency,
    maxWinStreak: metrics.maxWinStreak,
    currentStreak: metrics.currentStreak,
    firstHit,
    goalsDone: getGoals().filter((g) => g.done).length,
    balanceMultiple,
  });

  if (!user) return null;

  if (isAdmin) {
    return (
      <AdminProfileView
        user={user}
        uid={uid}
        displayName={user.displayName ?? null}
      />
    );
  }

  const doName = async () => {
    const name = nameDraft.trim();
    if (!name) {
      setNameMsg("Name cannot be empty.");
      return;
    }
    if (name.length > 40) {
      setNameMsg("Keep it under 40 characters.");
      return;
    }
    setNameBusy(true);
    setNameMsg(null);
    try {
      const { getAuth, updateProfile } = await import("firebase/auth");
      const auth = getAuth(app);
      const cur = auth.currentUser;
      if (!cur) throw new Error("Not signed in.");
      await updateProfile(cur, { displayName: name });
      setEditingName(false);
      setNameMsg("Name updated ✓");
    } catch (err) {
      setNameMsg(
        err instanceof Error ? err.message : "Update failed — try again."
      );
    } finally {
      setNameBusy(false);
    }
  };

  const doPhoto = async (f: File) => {
    if (!f.type.startsWith("image/")) {
      setPhotoMsg("Please choose an image file.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setPhotoMsg("Image too large — max 8 MB.");
      return;
    }
    setPhotoBusy(true);
    setPhotoMsg(null);
    try {
      const url = await uploadProfileImage(f);
      const { getAuth, updateProfile } = await import("firebase/auth");
      const auth = getAuth(app);
      const cur = auth.currentUser;
      if (!cur) throw new Error("Not signed in.");
      await updateProfile(cur, { photoURL: url });
      setPhotoMsg("Photo updated ✓");
    } catch (err) {
      setPhotoMsg(
        err instanceof Error ? err.message : "Upload failed — try again."
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const doImport = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const res = importBackup(text);
      if (res.ok) {
        setImportMsg(
          `Restored ${res.written.length} groups — reloading…`
        );
        setTimeout(() => window.location.reload(), 600);
      } else {
        setImportMsg("Invalid backup file — nothing changed.");
      }
    } catch {
      setImportMsg("Could not read that file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-5xl"
    >
      {/* Identity card */}
      <div className="rounded-3xl border border-line bg-panel/70 p-6 backdrop-blur sm:p-7">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
          <div className="relative shrink-0">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt="Profile photo"
                className="h-24 w-24 rounded-3xl border border-line object-cover shadow-[0_0_40px_-12px_rgba(52,211,153,0.45)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-3xl border border-mint/30 bg-gradient-to-br from-mint/20 to-teal/10 text-4xl font-black text-mint">
                {user.displayName?.[0] ?? user.email?.[0] ?? "G"}
              </span>
            )}
            <button
              onClick={() => photoRef.current?.click()}
              disabled={photoBusy}
              title="Change profile photo"
              className="absolute -bottom-2 left-1/2 inline-flex h-7 -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-panel2 px-2.5 text-[10px] font-bold text-muted shadow-lg transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M17 8l-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              {photoBusy ? "Uploading…" : "Edit"}
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void doPhoto(f);
                e.target.value = "";
              }}
            />
            {photoMsg && (
              <span
                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold ${
                  photoMsg.includes("✓") ? "text-mint" : "text-coral"
                }`}
              >
                {photoMsg}
              </span>
            )}
          </div>
{editingName ? (
              <div className="mt-4 flex w-full flex-col items-center gap-2 sm:mt-0 sm:items-start">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void doName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameMsg(null);
                    }
                  }}
                  maxLength={40}
                  autoFocus
                  placeholder="Your name"
                  className="w-full rounded-xl border border-line bg-panel2 px-3 py-2 text-sm font-semibold text-ink outline-none transition-colors focus:border-mint/60 max-w-xs"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void doName()}
                    disabled={nameBusy}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-mint/15 px-3 text-[12px] font-bold text-mint ring-1 ring-mint/30 transition-colors hover:bg-mint/25 disabled:opacity-60"
                  >
                    {nameBusy ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNameMsg(null);
                    }}
                    className="inline-flex h-8 items-center rounded-lg bg-panel2 px-3 text-[12px] font-bold text-muted transition-colors hover:text-ink"
                  >
                    Cancel
                  </button>
                  {nameMsg && (
                    <span
                      className={`text-[11px] font-semibold ${
                        nameMsg.includes("✓") ? "text-mint" : "text-coral"
                      }`}
                    >
                      {nameMsg}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 sm:mt-0 sm:min-w-0">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-2xl font-extrabold text-ink">
                    {user.displayName ?? "TraderMatrix user"}
                  </h2>
                  <button
                    onClick={() => {
                      setNameDraft(user.displayName ?? "");
                      setEditingName(true);
                      setNameMsg(null);
                    }}
                    title="Edit display name"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-mint/50 hover:text-mint"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-muted">{user.email}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[11px] font-semibold text-mint">
                  <IconShield className="h-3.5 w-3.5" />
                  Verified with Google
                </div>
                {nameMsg && (
                  <p
                    className={`mt-1.5 text-center text-[11px] font-semibold sm:text-left ${
                      nameMsg.includes("✓") ? "text-mint" : "text-coral"
                    }`}
                  >
                    {nameMsg}
                  </p>
                )}
              </div>
            )}
          </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Current balance"
            value={money(cx(balance), currency)}
            tone="mint"
          />
          <Stat
            label="Net P&L"
            value={`${metrics.netProfit >= 0 ? "+" : "−"}${money(Math.abs(cx(metrics.netProfit)), currency)}`}
            tone={metrics.netProfit >= 0 ? "mint" : "coral"}
          />
          <Stat
            label="Win rate"
            value={`${metrics.winRate}%`}
            tone="cyan"
          />
          <Stat
            label="Consistency"
            value={`${metrics.consistency}%`}
            tone="amber"
          />
        </div>

        {/* Deposit & growth */}
        <div className="mt-5 rounded-2xl border border-line bg-panel2/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Total deposits
              </div>
              <div className="mt-1 text-2xl font-black tabular-nums text-mint">
                {money(cx(deposit), currency)}
              </div>
              <div className="text-[11px] font-semibold text-muted">
                {deposits.length} deposit{deposits.length === 1 ? "" : "s"} · balance grows from deposits + trade P&amp;L
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
                Growth since deposits
              </div>
              <div className={`mt-1 text-2xl font-black tabular-nums ${!hasTrades ? "text-faint" : totalGrowth >= 0 ? "text-mint" : "text-coral"}`}>
                {deposit > 0 && hasTrades
                  ? `${totalGrowth >= 0 ? "+" : "−"}${Math.abs(totalGrowth)}%`
                  : "—"}
              </div>
              <div className="text-[11px] font-semibold text-muted">
                {deposit > 0
                  ? hasTrades
                    ? `${money(cx(balance), currency)} of ${money(cx(deposit), currency)}`
                    : "Log your first trade — growth appears here"
                  : "Set your deposit to track growth"}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <input
              type="number"
              min={0}
              step={0.01}
              value={depAmount}
              onChange={(e) => setDepAmount(e.target.value)}
              placeholder="Amount e.g. 46.13"
              className="h-10 w-40 rounded-xl border border-line bg-panel px-3 text-[14px] font-bold tabular-nums text-mint outline-none transition-colors focus:border-mint/70"
            />
            <input
              type="date"
              value={depDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDepDate(e.target.value)}
              className="date-picker-icon h-10 w-40 rounded-xl border border-line bg-panel px-3 text-[13px] text-ink outline-none transition-colors focus:border-mint/70"
            />
            <button
              onClick={submitDeposit}
              disabled={!depAmount || Number(depAmount) <= 0}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-mint to-teal px-5 text-sm font-bold text-bg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              + Add deposit
            </button>
          </div>
          {deposits.length > 0 && (
            <div className="mt-3 max-h-36 overflow-auto">
              {deposits.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg bg-panel/60 py-1.5 pl-3 pr-1.5 text-[12px] text-muted ring-1 ring-line"
                >
                  <span className="tabular-nums">{d.date} · +{money(cx(d.amount), currency)}</span>
                  <button
                    onClick={() => deleteDeposit(d.id)}
                    aria-label="Delete deposit"
                    className="flex h-6 w-6 items-center justify-center rounded-md text-faint transition-colors hover:bg-coral/15 hover:text-coral"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <div className="flex flex-wrap gap-1.5">
              {growthPeriods.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGrowthPeriod(g.key)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    growthPeriod === g.key
                      ? "bg-amber/15 text-amber ring-1 ring-amber/40"
                      : "bg-panel/60 text-muted hover:text-ink"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px]">
              {hasTrades ? (
                <>
                  <span className="text-faint">
                    P&amp;L over {growthPeriods.find((g) => g.key === growthPeriod)?.label.toLowerCase() ?? "period"}:
                  </span>
                  <b className={`tabular-nums ${periodNet >= 0 ? "text-mint" : "text-coral"}`}>
                    {periodNet >= 0 ? "+" : "−"}{money(Math.abs(cx(periodNet)), currency)}
                  </b>
                  <span className="text-faint">as % of deposit:</span>
                  <b className={`tabular-nums ${periodGrowth >= 0 ? "text-mint" : "text-coral"}`}>
                    {periodGrowth >= 0 ? "+" : "−"}{Math.abs(periodGrowth)}%
                  </b>
                </>
              ) : (
                <span className="text-faint">
                  Log your first trade in the journal — P&amp;L appears here.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preferences row */}
        <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-panel2/50 p-4 sm:grid-cols-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
              Journal currency (base)
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["dollar", "$ USD"],
                  ["euro", "€ EUR"],
                  ["pound", "£ GBP"],
                  ["rupee", "₹ INR"],
                  ["yen", "¥ JPY"],
                ] as [CurrencyKey, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setBaseCur(k)}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-colors ${
                    baseCur === k
                      ? "bg-ink/10 text-ink ring-1 ring-ink/30 dark:bg-white/10 dark:text-white dark:ring-white/30"
                      : "bg-panel/60 text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-faint">
              Currency your journal numbers are recorded in.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
              Display currency
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["dollar", "$ USD"],
                  ["euro", "€ EUR"],
                  ["pound", "£ GBP"],
                  ["rupee", "₹ INR"],
                  ["yen", "¥ JPY"],
                ] as [CurrencyKey, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setCurrency(k)}
                  className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-colors ${
                    currency === k
                      ? "bg-mint/15 text-mint ring-1 ring-mint/40"
                      : "bg-panel/60 text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
              Risk profile
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {RISK_STYLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRiskStyle(r.id)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${
                    settings.riskStyle === r.id
                      ? "bg-cyan/15 text-cyan ring-1 ring-cyan/40"
                      : "bg-panel/60 text-muted hover:text-ink"
                  }`}
                >
                  {r.label} · {r.riskPct}%
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-faint">
              Used by Risk &amp; Reward presets and journal risk chip.
            </p>
          </div>
        </div>
      </div>

      {/* Investor DNA */}
      <section className="mt-5 rounded-3xl border border-line bg-panel/70 p-6 backdrop-blur sm:p-7">
        <SectionTitle
          icon={<IconBars className="h-4.5 w-4.5" />}
          title="Investor DNA"
          desc="What your journal history says about you"
        />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Dna
            label="Trades"
            value={String(metrics.total)}
            tone={metrics.total ? "default" : "faint"}
          />
          <Dna
            label="Win rate"
            value={`${metrics.winRate}%`}
            tone={metrics.winRate >= 50 ? "mint" : metrics.winRate > 0 ? "amber" : "faint"}
          />
          <Dna
            label="Avg win"
            value={moneyCompact(cx(metrics.avgWin), currency)}
            tone="mint"
          />
          <Dna
            label="Avg loss"
            value={moneyCompact(Math.abs(cx(metrics.avgLoss)), currency)}
            tone="coral"
          />
          <Dna
            label="Profit factor"
            value={
              metrics.profitFactor === Infinity
                ? "∞"
                : metrics.profitFactor > 0
                  ? String(metrics.profitFactor)
                  : "—"
            }
            tone={metrics.profitFactor >= 1.5 ? "mint" : "amber"}
          />
          <Dna
            label="Expectancy"
            value={`${metrics.expectancy > 0 ? "+" : ""}${moneyCompact(cx(metrics.expectancy), currency)}`}
            tone={metrics.expectancy > 0 ? "mint" : "coral"}
          />
          <Dna
            label="Max drawdown"
            value={moneyCompact(cx(metrics.maxDrawdown), currency)}
            tone={metrics.maxDrawdown > 0 ? "coral" : "faint"}
          />
          <Dna
            label="Best day"
            value={metrics.bestDay ? moneyCompact(cx(metrics.bestDay.net), currency) : "—"}
            tone="mint"
          />
          <Dna
            label="Worst day"
            value={metrics.worstDay ? moneyCompact(cx(metrics.worstDay.net), currency) : "—"}
            tone="coral"
          />
          <Dna
            label="Best streak"
            value={`${metrics.maxWinStreak}${metrics.maxWinStreak === 1 ? " win" : " wins"}`}
            tone={metrics.maxWinStreak >= 3 ? "mint" : "faint"}
          />
          <Dna
            label="Current streak"
            value={
              metrics.currentStreak === 0
                ? "—"
                : `${Math.abs(metrics.currentStreak)} ${
                    metrics.currentStreak > 0 ? "wins" : "losses"
                  }`
            }
            tone={metrics.currentStreak > 0 ? "mint" : "coral"}
          />
          <Dna
            label="Last 7 days"
            value={`${metrics.last7Net > 0 ? "+" : ""}${moneyCompact(cx(metrics.last7Net), currency)}`}
            tone={metrics.last7Net >= 0 ? "mint" : "coral"}
          />
        </div>

        {/* Consistency meter */}
        <div className="mt-6 rounded-2xl border border-line bg-panel2/40 p-4">
          <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold">
            <span className="text-muted">Target-hit consistency</span>
            <span className="text-amber">{metrics.consistency}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metrics.consistency}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-amber to-mint"
            />
          </div>
          <p className="mt-2 text-[11px] text-faint">
            Days you hit the compound-calculator target ÷ journal entries
            logged. Discipline compounds like interest.
          </p>
        </div>
      </section>

      {/* Achievements */}
      <section className="mt-5 rounded-3xl border border-line bg-panel/70 p-6 backdrop-blur sm:p-7">
        <SectionTitle
          icon={<IconTrendUp className="h-4.5 w-4.5" />}
          title="Achievements"
          desc="Badges only your own discipline can earn"
        />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border p-4 transition-all ${
                a.unlocked
                  ? "border-mint/30 bg-mint/10"
                  : "border-line bg-panel2/40 opacity-60 grayscale"
              }`}
            >
              <div className="text-2xl">{a.icon}</div>
              <div className="mt-1.5 text-[13px] font-bold text-ink">{a.title}</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-faint">
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Goals */}
      <div className="mt-5">
        <GoalsPanel
          balance={balance}
          currency={currency}
          baseCur={baseCur}
          rates={rates}
        />
      </div>

      {/* Backup */}
      <section className="mt-5 rounded-3xl border border-line bg-panel/70 p-6 backdrop-blur sm:p-7">
        <SectionTitle
          icon={<IconDownload className="h-4.5 w-4.5" />}
          title="Workspace backup"
          desc="Everything lives in this browser — keep a copy"
        />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => uid && downloadBackup(uid)}
            disabled={!uid || busy}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-mint to-teal px-5 text-[13px] font-bold text-bg shadow-[0_10px_32px_-8px_rgba(52,211,153,0.55)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <IconDownload className="h-4 w-4" />
            Export backup (.json)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-line bg-panel2 px-5 text-[13px] font-bold text-muted transition-colors hover:border-mint/50 hover:text-mint"
          >
            {busy ? "Importing…" : "Import backup"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = "";
            }}
          />
        </div>
        <AnimatePresence>
          {importMsg && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 rounded-xl px-3 py-2 text-[12px] font-semibold ${
                importMsg.startsWith("Restored")
                  ? "bg-mint/10 text-mint"
                  : "bg-coral/10 text-coral"
              }`}
            >
              {importMsg}
            </motion.p>
          )}
        </AnimatePresence>
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Backup includes journal entries, balance, target, goals and profile
          preferences (theme, font scale, risk style, currency). Import
          restores them exactly.
        </p>
      </section>
    </motion.div>
  );
}

function AdminProfileView({
  user,
  uid,
  displayName,
}: {
  user: User;
  uid: string | null;
  displayName: string | null;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-3xl border border-amber/25 bg-panel/70 p-6 backdrop-blur sm:p-7">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
          <div className="relative shrink-0">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt="Profile photo"
                className="h-24 w-24 rounded-3xl border border-line object-cover shadow-[0_0_40px_-12px_rgba(251,191,36,0.45)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-3xl border border-amber/30 bg-gradient-to-br from-amber/20 to-orange/10 text-4xl font-black text-amber">
                {displayName?.[0] ?? user.email?.[0] ?? "A"}
              </span>
            )}
          </div>
          <div className="sm:min-w-0">
            <h2 className="text-2xl font-extrabold text-ink">
              {displayName ?? "TraderMatrix admin"}
            </h2>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber/30 bg-amber/10 px-3 py-1 text-[11px] font-semibold text-amber">
              <IconShield className="h-3.5 w-3.5" />
              Administrator · full console access
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Role" value="Admin" tone="amber" />
          <Stat label="Provider" value="Google" tone="cyan" />
          <Stat label="App" value="TraderMatrix" tone="mint" />
          <Stat label="Deploy" value="Production" tone="mint" />
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-panel2/50 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
            Account details
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold text-faint">Email</dt>
              <dd className="mt-0.5 break-all font-semibold text-ink">
                {user.email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-faint">
                User ID (uid)
              </dt>
              <dd className="mt-0.5 break-all font-mono text-[12px] text-muted">
                {uid ?? "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-5 rounded-2xl border border-amber/25 bg-amber/5 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
            What this account can do
          </div>
          <ul className="mt-2 grid grid-cols-1 gap-1.5 text-[12px] text-muted sm:grid-cols-2">
            <li>✓ Registered users &amp; sign-in analytics</li>
            <li>✓ Sessions — live 30s heartbeat tracking</li>
            <li>✓ Demo revenue from plan purchases</li>
            <li>✓ Daily active views chart (14 days)</li>
            <li>✓ Per-user activity table</li>
            <li>✓ Settings — theme, font size, risk profile</li>
          </ul>
        </div>
        <p className="mt-4 text-[11px] text-faint">
          Open <b className="text-amber">Admin</b> from the sidebar for the full
          console. Trading tools are not available to admin accounts.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "mint" | "coral" | "cyan" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel2/50 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className={`mt-1 text-xl font-black tabular-nums text-${tone}`}>
        {value}
      </div>
    </div>
  );
}

function Dna({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  const color =
    tone === "mint"
      ? "text-mint"
      : tone === "coral"
        ? "text-coral"
        : tone === "amber"
          ? "text-amber"
          : tone === "cyan"
            ? "text-cyan"
            : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-panel2/40 px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-faint">
        {label}
      </div>
      <div className={`mt-1 truncate text-[16px] font-extrabold tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/15 text-violet ring-1 ring-violet/20">
        {icon}
      </span>
      <div>
        <h3 className="text-[14px] font-bold text-ink">{title}</h3>
        <p className="text-[12px] text-faint">{desc}</p>
      </div>
    </div>
  );
}