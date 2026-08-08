"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TradeMetricLogo } from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { fadeUp, stagger } from "@/lib/motion";
import {
  IconArrows,
  IconBars,
  IconCalculator,
  IconCalendar,
  IconGlobe,
  IconShield,
  IconSparkles,
  IconTable,
  IconTrendUp,
} from "@/components/icons";

const FEATURES = [
  {
    icon: IconCalculator,
    title: "Daily compound calculator",
    text: "Day-by-day compounding with reinvest rate control — see exactly how much each day adds to your balance.",
  },
  {
    icon: IconCalendar,
    title: "Trading-day aware",
    text: "Exclude weekends, pick your trading days, or skip U.S. holidays. Business-day counts included.",
  },
  {
    icon: IconArrows,
    title: "Deposits & withdrawals",
    text: "Schedule deposits or percentage-based withdrawals weekly, bi-weekly or monthly, plus one-time top-ups.",
  },
  {
    icon: IconGlobe,
    title: "Multi-currency & Forex tools",
    text: "Projections in USD, EUR, GBP, INR or JPY, live currency conversion, and a risk/reward calculator.",
  },
  {
    icon: IconTable,
    title: "Breakdown tables & CSV",
    text: "Day, week, month and year amortization tables with totals — export everything to CSV in one click.",
  },
  {
    icon: IconShield,
    title: "Private by design",
    text: "Everything runs in your browser. Sign in with Google only to remember your workspace — no data leaves your device.",
  },
];

const STATS = [
  { value: "10/10", label: "golden tests vs live market math" },
  { value: "5", label: "currencies & live FX rates" },
  { value: "365", label: "days of daily compounding insight" },
];

const FAQS = [
  {
    q: "Is TradeMetric free?",
    a: "Yes — completely free forever. No credit card, no trial clock, no paywall. Every calculator, table and export is unlocked.",
  },
  {
    q: "Is my data private?",
    a: "Extremely. All calculations run locally in your browser and nothing is uploaded. Optional Google sign-in exists only so TradeMetric remembers your saved workspace — we never store or sell your numbers.",
  },
  {
    q: "Why do my results not match a simple annual formula?",
    a: "Because TradeMetric compounds day-by-day instead of annually. The 10-service-golden-test suite is locked to real market day counts (365, 260 business days), so your numbers match what daily reinvestment actually produces.",
  },
  {
    q: "Can I include deposits, withdrawals and top-ups?",
    a: "Yes. Schedule recurring deposits and percentage-based withdrawals weekly, bi-weekly or monthly, and add one-time top-ups at any compounding step — the amortization table shows every row.",
  },
  {
    q: "Does it handle weekends and holidays?",
    a: "Yes. Exclude weekends, pick your own trading days, or skip U.S. market holidays. Trading-day counts are shown alongside calendar days.",
  },
  {
    q: "Is this financial advice?",
    a: "No. TradeMetric produces illustrative projections only — it is a planning tool, not a recommendation. Nothing here is financial advice.",
  },
];

export default function Landing() {
  const { busy, signInWithGoogle } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="grid-bg relative min-h-screen overflow-hidden">
      {/* Ambient light */}
      <div className="orb orb-a -top-40 left-[-10%] h-[520px] w-[520px]" />
      <div className="orb orb-b right-[-12%] top-24 h-[560px] w-[560px]" />
      <div className="orb orb-c bottom-[-20%] left-1/3 h-[480px] w-[480px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-16 items-center justify-between"
        >
          <TradeMetricLogo />
          <button
            onClick={() => void signInWithGoogle()}
            disabled={busy}
            className="group inline-flex h-10 items-center gap-2 rounded-xl border border-mint/40 bg-mint/10 px-4 text-sm font-bold text-mint transition-all hover:bg-mint/20 disabled:opacity-60"
          >
            Sign in
            <IconArrowRightInline />
          </button>
        </motion.div>

        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center py-16 pb-20 text-center sm:py-24"
        >
          <motion.p
            variants={fadeUp}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[12px] font-semibold text-mint"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Compound · Convert · Risk
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-ink sm:text-7xl"
          >
            Watch your money{" "}
            <span className="bg-gradient-to-r from-mint via-teal to-cyan bg-clip-text text-transparent">
              grow daily
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
          >
            TradeMetric projects daily compound interest on your investments and
            helps you plan Forex trades with risk/reward math — weekends,
            holidays, currencies and exact point values included.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex w-full max-w-md flex-col gap-3">
            <button
              onClick={() => void signInWithGoogle()}
              disabled={busy}
              className="sheen inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-mint to-teal px-6 text-base font-bold text-bg shadow-[0_10px_32px_-8px_rgba(52,211,153,0.55)] transition-all hover:shadow-[0_14px_44px_-8px_rgba(52,211,153,0.7)] active:scale-[0.98] disabled:opacity-60"
            >
              <IconTrendUp className="h-5 w-5" />
              {busy ? "Signing in…" : "Let's Trade"}
            </button>
            <p className="text-[12px] text-faint">
              Free forever. No credit card. Your calculations never leave this
              browser.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center"
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black tabular-nums text-ink">
                  <span className="bg-gradient-to-r from-mint to-cyan bg-clip-text text-transparent">
                    {s.value}
                  </span>
                </div>
                <div className="mt-0.5 max-w-[180px] text-[11px] text-faint">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -6, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="group relative overflow-hidden rounded-3xl border border-line bg-panel/70 p-6 backdrop-blur transition-colors hover:border-mint/40"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-mint/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint/10 text-mint ring-1 ring-mint/20 transition-all group-hover:bg-mint/20 group-hover:ring-mint/40">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                {f.text}
              </p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-20 max-w-3xl"
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Frequently asked{" "}
              <span className="bg-gradient-to-r from-mint to-cyan bg-clip-text text-transparent">
                questions
              </span>
            </h2>
            <p className="mt-3 text-[14px] text-muted">
              Everything you may be wondering before your first compound run.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={f.q}
                  className={`overflow-hidden rounded-2xl border transition-colors ${
                    open
                      ? "border-mint/40 bg-panel"
                      : "border-line bg-panel/60 hover:border-mint/25"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="text-[15px] font-bold text-ink">{f.q}</span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 ${
                        open
                          ? "rotate-45 border-mint/40 bg-mint/15 text-mint"
                          : "border-line bg-panel2 text-muted"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-muted">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-20 overflow-hidden rounded-3xl border border-mint/25 bg-gradient-to-br from-mint/10 via-panel to-cyan/10 p-8 text-center sm:p-12"
        >
          <div className="mb-3 inline-flex items-center gap-2 text-mint">
            <IconSparkles className="h-5 w-5" />
            <span className="text-[13px] font-bold uppercase tracking-widest">
              Ready when you are
            </span>
          </div>
          <h2 className="mx-auto max-w-2xl text-3xl font-black tracking-tight text-ink sm:text-4xl">
            Start projecting your{" "}
            <span className="bg-gradient-to-r from-mint to-cyan bg-clip-text text-transparent">
              daily growth
            </span>{" "}
            in seconds
          </h2>
          <button
            onClick={() => void signInWithGoogle()}
            disabled={busy}
            className="sheen mt-7 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-mint to-teal px-7 text-[15px] font-bold text-bg shadow-[0_10px_32px_-8px_rgba(52,211,153,0.55)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            <IconBars className="h-5 w-5" />
            Calculate for free
          </button>
        </motion.section>

        <Footer />
      </div>
    </div>
  );
}

function IconArrowRightInline() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M14 6l6 6-6 6" />
    </svg>
  );
}