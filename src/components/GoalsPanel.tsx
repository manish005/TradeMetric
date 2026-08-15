"use client";
import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addGoal,
  deleteGoal,
  getGoals,
  getGoalsVersion,
  subscribeGoals,
  updateGoal,
} from "@/lib/goals";
import { money, round } from "@/lib/format";
import type { CurrencyKey } from "@/lib/types";
import { convert, CURRENCY_ISO } from "@/lib/rates";
import { IconEdit, IconTrash } from "@/components/icons";

const GOAL_CURRENCIES: Array<[CurrencyKey, string]> = [
  ["dollar", "$ USD"],
  ["euro", "€ EUR"],
  ["pound", "£ GBP"],
  ["rupee", "₹ INR"],
  ["yen", "¥ JPY"],
];

export default function GoalsPanel({
  balance,
  currency,
  baseCur,
  rates,
}: {
  balance: number;
  currency: CurrencyKey;
  baseCur: CurrencyKey;
  rates: Record<string, number>;
}) {
  useSyncExternalStore(subscribeGoals, getGoalsVersion);
  const goals = getGoals();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(0);
  const [goalCur, setGoalCur] = useState<CurrencyKey>(currency);
  const [deadline, setDeadline] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const convertTo = (value: number, to: CurrencyKey) =>
    round(convert(value, CURRENCY_ISO[baseCur] ?? "USD", CURRENCY_ISO[to] ?? "USD", rates), 2);

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setTarget(0);
    setGoalCur(currency);
    setDeadline("");
    setAdding((a) => !a);
  };

  const openEdit = (g: (typeof goals)[number]) => {
    setAdding(false);
    setEditingId(g.id);
    setTitle(g.title);
    setTarget(g.target);
    setGoalCur(g.currency ?? baseCur);
    setDeadline(g.deadline);
  };

  const cancelForm = () => {
    setAdding(false);
    setEditingId(null);
    setTitle("");
    setTarget(0);
    setGoalCur(currency);
    setDeadline("");
  };

  const submit = () => {
    if (!title.trim() || target <= 0) return;
    const payload = {
      title: title.trim(),
      target: Math.max(0, target),
      currency: goalCur,
      deadline: deadline || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    };
    if (editingId) {
      updateGoal(editingId, payload);
    } else {
      addGoal(payload);
    }
    cancelForm();
  };

  const pendingCount = goals.filter((g) => !g.done).length;

  return (
    <section className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-bold text-ink">
            Goals &amp; milestones{" "}
            {pendingCount > 0 && (
              <span className="text-[11px] font-black text-amber">
                · {pendingCount} open
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-[12px] text-faint">
            Track your journey against real current balance
          </p>
        </div>
        <button
          onClick={() => (adding || editingId ? cancelForm() : openNew())}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-mint/40 bg-mint/10 px-3 text-[12px] font-bold text-mint transition-colors hover:bg-mint/20"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {adding || editingId ? "Cancel" : "New goal"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {(adding || editingId) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-mint/20 bg-mint/5 p-4 sm:grid-cols-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  editingId ? "Goal title" : "e.g. First ₹1 Lakh account"
                }
                className="h-10 rounded-xl border border-line bg-panel2 px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-mint/70 sm:col-span-2"
              />
              <input
                type="number"
                min={0}
                value={target || ""}
                onChange={(e) => setTarget(e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder={`Target (${goalCur.toUpperCase()})`}
                className="h-10 rounded-xl border border-line bg-panel2 px-3 text-[13px] tabular-nums text-ink outline-none transition-colors placeholder:text-faint focus:border-mint/70"
              />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="date-picker-icon h-10 rounded-xl border border-line bg-panel2 px-3 text-[12px] text-ink outline-none transition-colors focus:border-mint/70"
              />
              <div className="flex flex-wrap items-center gap-1.5 sm:col-span-4">
                <span className="text-[11px] font-semibold text-faint">
                  Target currency:
                </span>
                {GOAL_CURRENCIES.map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setGoalCur(k)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      goalCur === k
                        ? "bg-mint/15 text-mint ring-1 ring-mint/40"
                        : "bg-panel/60 text-muted hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={submit}
                disabled={!title.trim() || target <= 0}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-mint to-teal px-4 text-[13px] font-bold text-bg transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:col-span-4"
              >
                {editingId ? "Update goal" : "Create goal"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-line bg-panel2/40 px-4 py-5 text-center text-[12px] text-faint">
          No goals yet — add a milestone like &ldquo;First ₹1 Lakh&rdquo; and watch it fill from your journal balance.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {[...goals]
            .sort((a, b) => Number(a.done) - Number(b.done) || (a.deadline < b.deadline ? -1 : 1))
            .map((g) => {
              const gCur: CurrencyKey = g.currency ?? baseCur;
              const conv = convertTo(balance, gCur);
              const pct = g.target > 0 ? round(Math.min(100, (conv / g.target) * 100), 1) : 0;
              const done = conv >= g.target || g.done;
              const pastDue = !done && g.deadline < todayStr();
              return (
                <div
                  key={g.id}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
                    done ? "border-mint/30 bg-mint/10" : "border-line bg-panel2/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[14px] font-bold text-ink">
                          {g.title}
                        </span>
                        {g.currency && g.currency !== baseCur && (
                          <span className="inline-flex rounded-full bg-panel2 px-2 py-0.5 text-[10px] font-bold text-faint">
                            {g.currency.toUpperCase()}
                          </span>
                        )}
                        {done && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 text-[10px] font-bold text-mint">
                            ✓ Reached
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">
                        Target{" "}
                        <b className="tabular-nums text-ink">{money(g.target, gCur)}</b>
                        <span className="text-faint"> · {g.deadline}</span>
                        {pastDue && <span className="text-coral"> · past due</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(g)}
                        aria-label="Edit goal"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-cyan/15 hover:text-cyan"
                      >
                        <IconEdit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteGoal(g.id)}
                        aria-label="Delete goal"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors hover:bg-coral/15 hover:text-coral"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-muted">
                        {money(conv, gCur)} now
                      </span>
                      <span className={pct >= 100 ? "text-mint" : "text-muted"}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, pct)}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${pct >= 100 ? "bg-gradient-to-r from-mint to-teal" : "bg-gradient-to-r from-amber to-teal"}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}