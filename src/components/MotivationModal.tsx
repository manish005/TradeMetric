"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDailyQuotes, type Quote, type QuoteCategory } from "@/data/quotes";

type Slide = {
  category: QuoteCategory | "greeting";
  quote: Quote;
};

const SLIDE_MS = 15000;

const CATEGORY_META: Record<QuoteCategory, string> = {
  discipline: "Discipline",
  consistency: "Consistency",
  patience: "Patience",
};

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 17) return "Good Afternoon";
  if (h >= 17 && h < 21) return "Good Evening";
  return "Good Night";
}

export default function MotivationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const daily = useMemo(() => getDailyQuotes(new Date()), []);
  const [idx, setIdx] = useState(0);

  const slides: Slide[] = useMemo(
    () => [
      ...daily.map((d) => ({ category: d.category, quote: d.quote })),
      {
        category: "greeting" as const,
        quote: { q: "Happy Best Trade Day — make today count!" },
      },
    ],
    [daily]
  );

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [open, slides.length]);

  const active = slides[idx];
  const isGreeting = active.category === "greeting";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl border border-mint/25 bg-panel p-7 shadow-[0_0_90px_-20px_rgba(52,211,153,0.5)] sm:p-9"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-panel2 text-muted transition-all hover:border-coral/50 hover:text-coral"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${
                  isGreeting
                    ? "bg-amber/15 text-amber ring-amber/25"
                    : "bg-mint/15 text-mint ring-mint/25"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M6 17l3 2-1-4 4-3-5-1-1-4-1 4-4 1 4 3-1 4z" />
                  <path d="M19 7l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" opacity=".6" />
                </svg>
              </span>
              <span className="text-[12px] font-bold uppercase tracking-widest text-muted">
                {isGreeting ? greetingLabel() : "Daily Motivation"}
              </span>
            </div>

            <div className="mt-6 flex min-h-[150px] items-center">
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={isGreeting ? "greeting" : active.category}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  {isGreeting ? (
                    <>
                      <p className="text-2xl font-extrabold leading-snug text-amber sm:text-3xl">
                        Happy Best Trade Day! 🎯
                      </p>
                      <p className="mt-3 text-[14px] font-medium text-ink/80">
                        Three daily quotes loaded. Discipline, consistency and
                        patience — go earn today&apos;s pips with a calm mind.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold leading-relaxed text-ink sm:text-2xl">
                        &ldquo;{active.quote.q}&rdquo;
                      </p>
                      {active.quote.a && (
                        <footer className="mt-3 text-[13px] font-semibold text-mint">
                          — {active.quote.a}
                        </footer>
                      )}
                    </>
                  )}
                </motion.blockquote>
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <span
                    key={s.category}
                    className={`h-1.5 rounded-full transition-all ${
                      i === idx
                        ? i === slides.length - 1
                          ? "w-6 bg-amber"
                          : "w-6 bg-mint"
                        : "w-1.5 bg-line2"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-faint">
                {isGreeting
                  ? "Your day is set"
                  : `${idx + 1} / ${slides.length - 1} · ${
                      CATEGORY_META[active.category as QuoteCategory]
                    }`}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}