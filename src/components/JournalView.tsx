"use client";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SYMBOLS } from "@/components/ResultsPanel";
import {
  addJournalEntry,
  deleteJournalEntry,
  getInitialBalance,
  getJournalEntries,
  getJournalVersion,
  getProjected,
  setInitialBalance,
  subscribeJournal,
  today,
  updateJournalEntry,
  type JournalDraft,
  type JournalEntry,
} from "@/lib/journal";
import { CURRENCIES, money, round } from "@/lib/format";
import { IconCalendar, IconEdit, IconTrash } from "@/components/icons";
import type { CurrencyKey } from "@/lib/types";

export default function JournalView() {
  useSyncExternalStore(subscribeJournal, getJournalVersion);
  const entries = getJournalEntries();
  const projected = getProjected();

  const [date, setDate] = useState(today());
  const [pair, setPair] = useState("XAUUSD");
  const [currency, setCurrency] = useState<CurrencyKey>("dollar");
  const [profit, setProfit] = useState(0);
  const [loss, setLoss] = useState(0);
  const [commission, setCommission] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<JournalEntry | null>(null);

  const initialBalance = getInitialBalance();

  const effectiveTarget =
    projected.date === today() ? projected.target : 0;

  const amountNet = round(profit - loss - commission, 2);
  const balanceAfterNet = round(initialBalance + amountNet, 2);

  const startEdit = (e: JournalEntry) => {
    setEditingId(e.id);
    setDate(e.date);
    setPair(e.pair);
    setProfit(e.profit);
    setLoss(e.loss);
    setCommission(e.commission);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDate(today());
    setPair("XAUUSD");
    setProfit(0);
    setLoss(0);
    setCommission(0);
  };

  const submit = () => {
    const p = Math.max(0, profit);
    const achieved = effectiveTarget > 0 && p >= effectiveTarget;
    const draft: JournalDraft = {
      date,
      pair,
      deposit: initialBalance,
      profit: p,
      loss: Math.max(0, loss),
      commission: Math.max(0, commission),
      projected: effectiveTarget,
      achieved,
    };

    let saved: JournalEntry | null = null;
    if (editingId) {
      saved = updateJournalEntry(editingId, draft);
      setEditingId(null);
      setDate(today());
      setPair("XAUUSD");
    } else {
      saved = addJournalEntry(draft);
    }
    setProfit(0);
    setLoss(0);
    setCommission(0);

    if (saved && saved.achieved) {
      setCelebrate(saved);
      window.setTimeout(() => setCelebrate(null), 3200);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mint/25 bg-mint/10 text-mint">
          <IconCalendar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink">
            Trading Journal
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Log trades and track compound targets
          </p>
        </div>
      </div>

      {effectiveTarget > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-mint/25 bg-mint/10 px-4 py-3 text-[13px]">
          <span className="font-bold text-mint">Today&apos;s target</span>
          <b className="tabular-nums text-ink">{money(effectiveTarget, currency)}</b>
          <span className="text-faint">
            from compound calculator — profit at or above counts as achieved
          </span>
        </div>
      )}

      <div className="mt-5 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-7">
        <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted">
          {editingId ? "Edit entry" : "New entry"}
        </h3>

        <div className="mt-4 rounded-2xl border border-mint/25 bg-mint/5 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[12px] font-bold text-faint">
              Deposit amount (initial balance)
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={initialBalance || ""}
              onChange={(e) =>
                setInitialBalance(e.target.value === "" ? 0 : Number(e.target.value))
              }
              placeholder="e.g. 1000"
              className="h-10 w-40 rounded-xl border border-line bg-panel2 px-3 text-[14px] font-bold tabular-nums text-mint outline-none transition-colors focus:border-mint/70"
            />
            <span className="text-[11px] text-faint">
              Saved for every entry — edit anytime
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-semibold text-faint">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="date-picker-icon mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[13px] text-ink outline-none transition-colors focus:border-mint/70"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-semibold text-faint">Pair</span>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[13px] font-semibold text-ink outline-none transition-colors focus:border-mint/70"
              >
                {Object.keys(SYMBOLS).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-semibold text-faint">
                Currency
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyKey)}
                className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[13px] font-semibold text-ink outline-none transition-colors focus:border-mint/70"
              >
                {Object.entries(CURRENCIES).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.symbol} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-semibold text-faint">
                Profit amount
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={profit || ""}
                onChange={(e) =>
                  setProfit(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[14px] tabular-nums text-ink outline-none transition-colors focus:border-mint/70"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-semibold text-faint">
                Loss amount
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={loss || ""}
                onChange={(e) =>
                  setLoss(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[14px] tabular-nums text-ink outline-none transition-colors focus:border-mint/70"
              />
            </label>
            <label className="block sm:col-span-1">
              <span className="text-[11px] font-semibold text-faint">
                Commission
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={commission || ""}
                onChange={(e) =>
                  setCommission(e.target.value === "" ? 0 : Number(e.target.value))
                }
                className="mt-1 h-10 w-full rounded-xl border border-line bg-panel2 px-3 text-[14px] tabular-nums text-ink outline-none transition-colors focus:border-mint/70"
              />
            </label>
          </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-faint">
              <span>
                Net:{" "}
                <b className={amountNet >= 0 ? "text-mint" : "text-coral"}>
                  {money(amountNet, currency)}
                </b>
              </span>
              <span>
                Balance after:{" "}
                <b className="tabular-nums text-ink">
                  {money(balanceAfterNet, currency)}
                </b>
              </span>
              {effectiveTarget > 0 && (
                <span>
                  Target:{" "}
                  <b className="text-amber">{money(effectiveTarget, currency)}</b>
                  {profit > 0 && (
                    <span
                      className={
                        profit >= effectiveTarget
                          ? " pl-1 font-bold text-mint"
                          : " pl-1 text-faint"
                      }
                    >
                      {profit >= effectiveTarget
                        ? "· hit"
                        : `· ${money(effectiveTarget - profit, currency)} to go`}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="h-11 rounded-2xl border border-line px-4 text-sm font-semibold text-muted transition-colors hover:text-ink"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={submit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-mint to-teal px-6 text-sm font-bold text-bg shadow-[0_10px_32px_-8px_rgba(52,211,153,0.55)] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                {editingId ? "Update entry" : "Submit entry"}
              </button>
            </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-panel/70 backdrop-blur">
        <div className="flex items-center justify-between px-5 pb-2 pt-4 sm:px-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted">
            History ({entries.length})
          </h3>
        </div>
        {entries.length === 0 ? (
          <p className="px-5 pb-5 text-[13px] text-faint sm:px-6">
            No entries yet — submit your first trade above.
          </p>
        ) : (
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
              <thead>
                <tr className="sticky top-0 z-10 bg-panel2 text-left">
                  <th className="px-3 py-2.5 font-bold text-cyan">Date</th>
                  <th className="px-3 py-2.5 font-bold text-muted">Pair</th>
                  <th className="px-3 py-2.5 font-bold text-mint">Profit</th>
                  <th className="px-3 py-2.5 font-bold text-coral">Loss</th>
                  <th className="px-3 py-2.5 font-bold text-muted">Comm</th>
                  <th className="px-3 py-2.5 font-bold text-ink">Target</th>
                  <th className="px-3 py-2.5 font-bold text-muted">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className={`border-t border-line ${
                      e.achieved ? "bg-mint/15" : ""
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-ink">
                      {e.date}
                    </td>
                    <td className="px-3 py-2 font-semibold text-ink">{e.pair}</td>
                    <td className="px-3 py-2 tabular-nums font-semibold text-mint">
                      {money(e.profit, currency)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-coral">
                      {money(e.loss, currency)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted">
                      {money(e.commission, currency)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-amber">
                      {e.projected > 0 ? money(e.projected, currency) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {e.achieved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 text-[11px] font-bold text-mint">
                          Achieved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-panel2 px-2.5 py-1 text-[11px] font-bold text-faint">
                          Missed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(e)}
                          aria-label="Edit entry"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-mint/10 hover:text-mint"
                        >
                          <IconEdit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteJournalEntry(e.id)}
                          aria-label="Delete entry"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-coral/15 hover:text-coral"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Celebration entry={celebrate} currency={currency} />
    </div>
  );
}

function Celebration({
  entry,
  currency,
}: {
  entry: JournalEntry | null;
  currency: CurrencyKey;
}) {
  const colors = ["#34d399", "#fbbf24", "#38bdf8", "#fb7185", "#a78bfa"];
  const particles = Array.from({ length: 28 }, (_, i) => ({
    x: Math.cos((i / 28) * Math.PI * 2) * (90 + (i % 5) * 28),
    y: Math.sin((i / 28) * Math.PI * 2) * (80 + (i % 4) * 26),
    c: colors[i % colors.length],
    d: 0.4 + (i % 7) * 0.08,
  }));

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          {particles.map((p, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0],
                x: p.x,
                y: p.y,
                scale: [1, 1.4, 0.6],
                rotate: [0, 220],
              }}
              transition={{ duration: 1.4, delay: p.d, ease: "easeOut" }}
              className="pointer-events-none absolute h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: p.c }}
            />
          ))}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative z-10 mx-4 w-full max-w-sm rounded-3xl border border-mint/40 bg-panel p-7 text-center shadow-[0_0_80px_-10px_rgba(52,211,153,0.6)]"
          >
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint/20 text-3xl font-black text-mint ring-1 ring-mint/40"
            >
              ✓
            </motion.div>
            <h3 className="mt-4 text-2xl font-black text-ink">Target hit!</h3>
            <p className="mt-1 text-[13px] text-muted">
              You earned{" "}
              <b className="text-mint">{money(entry.profit, currency)}</b> vs target{" "}
              <b className="text-amber">{money(entry.projected, currency)}</b>
            </p>
            <p className="mt-3 rounded-xl bg-panel2 px-3 py-2 text-[11px] font-semibold text-faint">
              {entry.pair} · {entry.date}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}