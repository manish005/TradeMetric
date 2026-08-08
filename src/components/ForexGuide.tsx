"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FOREX_GUIDE, GuideTopic } from "@/data/forexGuide";
import {
  IconBook,
  IconChevL,
  IconChevR,
  IconTrendUp,
  IconGauge,
  IconArrows,
  IconTarget,
  IconArrowRight,
} from "@/components/icons";

const TONE_ICONS = [IconTarget, IconGauge, IconArrows, IconTrendUp, IconBook];

export default function ForexGuide() {
  const [open, setOpen] = useState<GuideTopic | null>(null);
  const [openIdx, setOpenIdx] = useState(0);

  const next = () => {
    if (openIdx + 1 < FOREX_GUIDE.length) {
      const t = FOREX_GUIDE[openIdx + 1];
      setOpen(t);
      setOpenIdx(openIdx + 1);
    }
  };
  const prev = () => {
    if (openIdx > 0) {
      const t = FOREX_GUIDE[openIdx - 1];
      setOpen(t);
      setOpenIdx(openIdx - 1);
    }
  };

  if (open) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setOpen(null)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-[13px] font-semibold text-muted transition-colors hover:border-mint/40 hover:text-mint"
          >
            <IconChevL className="h-4 w-4" />
            All topics
          </button>
          <span className="rounded-full bg-panel2 px-3 py-1 text-[11px] font-bold tabular-nums text-faint">
            {openIdx + 1} / {FOREX_GUIDE.length}
          </span>
        </div>

        <motion.div
          key={open.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-7"
        >
          <div className="mb-1 flex items-center gap-2">
            {open.chapter && (
              <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan ring-1 ring-cyan/25">
                {open.chapter}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-ink">
            {open.title}
          </h2>
          <p className="mt-1 text-sm text-mint">{open.sub}</p>
          <p className="mt-4 text-[14px] leading-relaxed text-muted">
            {open.body}
          </p>

          <ul className="mt-5 space-y-2">
            {open.bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2.5 rounded-xl bg-panel2 px-4 py-2.5 text-[13px] leading-relaxed text-muted"
              >
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-mint/15 text-[10px] font-black text-mint flex items-center justify-center">
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>

          {open.imgs.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4">
              {open.imgs.map((src) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-2xl border border-line bg-black/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-auto w-full"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
            <button
              onClick={prev}
              disabled={openIdx === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel2 px-3.5 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:border-mint/40 hover:text-mint disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconChevL className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={next}
              disabled={openIdx + 1 >= FOREX_GUIDE.length}
              className="inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-[13px] font-bold text-bg shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next topic
              <IconChevR className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <p className="mt-4 text-[11px] leading-relaxed text-faint">
          Educational content extracted from the &quot;Free Price Action Guide
          2026&quot; by AIRFOREXONE. Not financial advice — illustrative only.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-mint">
            Free Price Action Guide 2026 · AIRFOREXONE
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Forex Guide · learn before you earn
          </h2>
          <p className="mt-1 max-w-lg text-sm text-muted">
            The exact basics institution traders use — cycles, order blocks,
            liquidity traps, risk-to-reward. Every topic links to the chart
            that explains it.
          </p>
        </div>
        <span className="hidden shrink-0 rounded-2xl border border-mint/25 bg-mint/5 px-4 py-3 text-center sm:block">
          <span className="block text-2xl font-black text-mint">
            {FOREX_GUIDE.length}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
            topics
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FOREX_GUIDE.map((t, i) => {
          const TIcon = TONE_ICONS[i % TONE_ICONS.length];
          return (
            <motion.button
              key={t.id}
              onClick={() => setOpen(t)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-line bg-panel/70 p-4 text-left backdrop-blur transition-colors hover:border-mint/35"
            >
              {t.imgs.length > 0 && (
                <div className="relative h-28 w-full overflow-hidden rounded-xl border border-line bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.imgs[0]}
                    alt=""
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-cyan">
                    {t.imgs.length} chart{t.imgs.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/10 text-mint ring-1 ring-mint/20">
                  <TIcon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                  {t.chapter ?? "Start here"}
                </span>
              </span>
              <div>
                <h3 className="text-[15px] font-bold leading-snug text-ink">
                  {t.title}
                </h3>
                <p className="mt-0.5 text-[12.5px] text-muted">{t.sub}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-[12px] font-bold text-mint opacity-80 transition-opacity group-hover:opacity-100">
                Open lesson
                <IconArrowRight className="h-3.5 w-3.5" />
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}