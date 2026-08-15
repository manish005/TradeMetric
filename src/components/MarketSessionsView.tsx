"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IconClock, IconGlobe } from "@/components/icons";

type SessionDef = {
  id: string;
  name: string;
  startUtcMin: number;
  endUtcMin: number;
  color: string;
  note: string;
};

type Seg = { start: number; end: number };

type OverlapNow = {
  a: SessionDef;
  b: SessionDef;
  start: number;
  end: number;
};

const SESSIONS: SessionDef[] = [
  {
    id: "sydney",
    name: "Sydney",
    startUtcMin: 21 * 60,
    endUtcMin: 6 * 60,
    color: "#f59e0b",
    note: "Asia-Pacific rollover — AUD/NZD activity",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    startUtcMin: 0,
    endUtcMin: 9 * 60,
    color: "#e879f9",
    note: "JPY crosses & USD/JPY lead",
  },
  {
    id: "london",
    name: "London",
    startUtcMin: 8 * 60,
    endUtcMin: 17 * 60,
    color: "#34d399",
    note: "Highest liquidity — the first London hour is the strongest",
  },
  {
    id: "newyork",
    name: "New York",
    startUtcMin: 13 * 60,
    endUtcMin: 22 * 60,
    color: "#38bdf8",
    note: "USD majors move most in NY afternoon",
  },
];

type Location = { label: string; offsetMin: number };

const LOCATIONS: Location[] = [
  { label: "Auto — use my device time", offsetMin: NaN },
  { label: "United States (New York)", offsetMin: -5 * 60 },
  { label: "United States (Chicago)", offsetMin: -6 * 60 },
  { label: "United States (Los Angeles)", offsetMin: -8 * 60 },
  { label: "Canada (Toronto)", offsetMin: -5 * 60 },
  { label: "United Kingdom (London)", offsetMin: 0 },
  { label: "India (IST)", offsetMin: 5 * 60 + 30 },
  { label: "UAE (Dubai)", offsetMin: 4 * 60 },
  { label: "Pakistan (Karachi)", offsetMin: 5 * 60 },
  { label: "Bangladesh (Dhaka)", offsetMin: 6 * 60 },
  { label: "Singapore", offsetMin: 8 * 60 },
  { label: "Japan (Tokyo)", offsetMin: 9 * 60 },
  { label: "Australia (Sydney)", offsetMin: 10 * 60 },
  { label: "Nigeria (Abuja)", offsetMin: 60 },
  { label: "Kenya (Nairobi)", offsetMin: 3 * 60 },
  { label: "South Africa (Johannesburg)", offsetMin: 2 * 60 },
  { label: "Brazil (São Paulo)", offsetMin: -3 * 60 },
];

const STORE_KEY = "tradermatrix:session";

const WEEKEND_ROWS: Array<{
  market: string;
  venue: string;
  sat: boolean;
  sun: boolean;
  vol: string;
}> = [
  { market: "Forex — spot & futures", venue: "Interbank · CME", sat: false, sun: false, vol: "—" },
  { market: "Crypto — BTC & ETH", venue: "Binance · Coinbase · Bybit", sat: true, sun: true, vol: "Best" },
  { market: "Crypto — altcoins", venue: "Centralized exchanges", sat: true, sun: true, vol: "Good" },
  { market: "Gold — XAU/USD futures", venue: "CME (COMEX)", sat: false, sun: false, vol: "—" },
  { market: "US indices — S&P 500 · NASDAQ", venue: "NYSE · NASDAQ", sat: false, sun: false, vol: "—" },
  { market: "European indices — DAX · FTSE", venue: "Eurex · LSE", sat: false, sun: false, vol: "—" },
];

function loadLocation(): Location {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Location;
      if (typeof parsed.label === "string" && Number.isFinite(parsed.offsetMin)) return parsed;
    }
  } catch {
    // ignore
  }
  const device = new Date().getTimezoneOffset();
  return { label: "Auto — device time", offsetMin: -device };
}

function minsOfDay(utcMs: number, offsetMin: number): number {
  return (((utcMs + offsetMin * 60000) % 86400000) + 86400000) % 86400000 / 60000;
}

function localMinutes(utcMin: number, offsetMin: number): number {
  return (((utcMin + offsetMin) % 1440) + 1440) % 1440;
}

function segmentsOf(s: SessionDef, offsetMin: number): Seg[] {
  const start = localMinutes(s.startUtcMin, offsetMin);
  const end = localMinutes(s.endUtcMin, offsetMin);
  return start >= end
    ? [
        { start, end: 1440 },
        { start: 0, end },
      ]
    : [{ start, end }];
}

function fmtHM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const CARDS: Array<{ title: string; body: string; list: string[]; tag: string }> = [
  {
    title: "Best forex pairs for beginners",
    tag: "start here",
    body: "Trade pairs with the tightest spreads, deepest liquidity and calmest spreads — less noise means easier learning of price action.",
    list: ["EUR/USD", "USD/JPY", "GBP/USD", "AUD/USD"],
  },
  {
    title: "Most volatile pairs in the London session",
    tag: "london",
    body: "London 08:00–17:00 (your local time) is the widest liquidity window. These crosses swing the most when Europe opens.",
    list: ["GBP/JPY", "GBP/USD", "EUR/JPY", "EUR/USD", "AUD/JPY"],
  },
  {
    title: "Best currency pairs to trade today",
    tag: "today",
    body: "For everyday plain-Jane trading, stick to the majors — low spreads, fixed-tight pricing and chart-friendly moves.",
    list: ["EUR/USD", "USD/JPY", "GBP/USD", "USD/CHF"],
  },
  {
    title: "Lowest spread currency pairs for scalping",
    tag: "scalping",
    body: "Scalpers live or die by the spread. These pairs consistently quote under roughly one pip during active sessions.",
    list: ["EUR/USD", "USD/JPY", "GBP/USD", "USD/CHF", "EUR/JPY"],
  },
  {
    title: "Best pairs in IST morning (Indian time)",
    tag: "india",
    body: "9:00 IST is mid-Tokyo for the close of Asia. JPY crosses clap with USD/INR as the local favourite.",
    list: ["USD/INR", "USD/JPY", "AUD/USD", "EUR/JPY", "GBP/JPY"],
  },
  {
    title: "Gold trading strategy for beginners",
    tag: "gold",
    body: "Gold (XAU/USD) follows the US session. Trade its trend during London–New York overlap (13:30–17:30 UTC beats), with a daily bias and stop loss above/below the swing.",
    list: ["Wait for London–NY overlap", "Trade after the first daily high/low", "Stop below swing — never add to losers"],
  },
];

function InfoCard({ c, i }: { c: (typeof CARDS)[number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[14px] font-bold leading-snug text-ink">{c.title}</h3>
        <span className="shrink-0 rounded-full bg-mint/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-mint">
          {c.tag}
        </span>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{c.body}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {c.list.map((p) => (
          <li
            key={p}
            className="rounded-lg bg-panel2/80 px-2.5 py-1 text-[11px] font-bold text-ink ring-1 ring-line"
          >
            {p}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function OpenC({ open }: { open: boolean }) {
  return open ? (
    <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
      Open 24h
    </span>
  ) : (
    <span className="rounded-full bg-panel2 px-2 py-0.5 text-[10px] font-bold text-faint">
      Closed
    </span>
  );
}

function VolChip({ v }: { v: string }) {
  const tone =
    v === "Best"
      ? "border-mint/40 bg-mint/10 text-mint"
      : v === "Good"
        ? "border-cyan/40 bg-cyan/10 text-cyan"
        : v === "Low"
          ? "border-amber/40 bg-amber/10 text-amber"
          : "border-line bg-panel2/60 text-faint";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${tone}`}>
      {v}
    </span>
  );
}

export default function MarketSessionsView() {
  const [loc, setLoc] = useState<Location>(loadLocation);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t = window.setInterval(tick, 10_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
  }, [loc]);

  const offset = loc.offsetMin;
  const nowMin = minsOfDay(now, offset);
  const localClock = fmtHM(nowMin);
  const [hover, setHover] = useState<number | null>(null);
  const dayName = new Date(now + offset * 60000).toLocaleDateString(undefined, {
    weekday: "long",
  });
  const weekend = dayName === "Saturday" || dayName === "Sunday";

  const sessionsAt = (mins: number): SessionDef[] =>
    SESSIONS.filter((s) => segmentsOf(s, offset).some((seg) => seg.start <= mins && mins < seg.end));

  const active = sessionsAt(nowMin);

  const overlapsAt = (mins: number): OverlapNow[] => {
    const found: OverlapNow[] = [];
    for (let i = 0; i < SESSIONS.length; i++) {
      for (let j = i + 1; j < SESSIONS.length; j++) {
        const a = SESSIONS[i];
        const b = SESSIONS[j];
        const aSegs = segmentsOf(a, offset);
        const bSegs = segmentsOf(b, offset);
        for (const sa of aSegs) {
          for (const sb of bSegs) {
            const start = Math.max(sa.start, sb.start);
            const end = Math.min(sa.end, sb.end);
            if (start < end && start <= mins && mins < end) {
              found.push({ a, b, start, end });
            }
          }
        }
      }
    }
    return found;
  };

  const overlaps = overlapsAt(nowMin);
  const overlapEnds = overlaps.length > 0 ? Math.min(...overlaps.map((o) => o.end)) : null;

  const nextSessions = SESSIONS.map((s) => {
    const start = localMinutes(s.startUtcMin, offset);
    const diff = ((start - nowMin + 1440) % 1440) || 1440;
    return { id: s.id, name: s.name, diff };
  }).sort((a, b) => a.diff - b.diff);
  const next = nextSessions[0];

  const countdown =
    next && Number.isFinite(next.diff)
      ? `${Math.floor(next.diff / 60)}h ${String(Math.round(next.diff % 60)).padStart(2, "0")}m`
      : "—";

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Location picker */}
      <div className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-mint/25 bg-mint/10 text-mint">
            <IconGlobe className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black text-ink">
              Where do you trade from?
            </h3>
            <p className="text-[12.5px] text-muted">
              Sessions below are live for your time zone.
            </p>
          </div>
          <select
            value={loc.label}
            onChange={(e) => {
              const item = LOCATIONS.find((l) => l.label === e.target.value);
              if (item) setLoc(item);
            }}
            className="ml-auto h-11 w-full max-w-xs rounded-xl border border-line bg-panel px-3 text-[13px] font-semibold text-ink outline-none transition-colors focus:border-mint/60"
          >
            {LOCATIONS.map((l) => (
              <option key={l.label} value={l.label}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-[11px] text-faint">
          {loc.label === "Auto — my device time"
            ? `Detected your device offset (UTC ${offset >= 0 ? "+" : ""}${Math.floor(offset / 60)}:${String(Math.abs(offset % 60)).padStart(2, "0")}).`
            : "No DST adjustments — times shift ±1h during daylight-saving weeks."}
        </p>
      </div>

      {/* Live clock + session status */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-mint/25 bg-mint/5 p-5 backdrop-blur sm:p-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-faint">
            <IconClock className="h-4 w-4" />
            Your local time
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums text-ink">{localClock}</span>
            <span className="text-[12px] font-semibold text-muted">{loc.label}</span>
          </div>
          <div className="mt-3 text-[12.5px] text-muted">
            {active.length > 0 ? (
              <>
                Open now:{" "}
                <b className="text-mint">{active.map((s) => s.name).join(" · ")}</b>
                {overlaps.length > 0 && overlapEnds !== null && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 align-middle text-[11px] font-bold text-amber">
                    ⚡ overlap · ends {fmtHM(overlapEnds)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-coral">All sessions closed — next opens in:</span>
            )}
            {!active.length && next && (
              <b className="ml-1 tabular-nums text-mint">{countdown} ({next.name})</b>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
            Next opening
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] font-black text-ink">
            {nextSessions.slice(0, 3).map((s) => (
              <span
                key={s.name}
                className="rounded-full bg-panel2 px-3 py-1 text-[12px] font-bold tabular-nums text-muted ring-1 ring-line"
              >
                {s.name} in {Math.floor(s.diff / 60)}h {String(Math.round(s.diff % 60)).padStart(2, "0")}m
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            Session hours reference typical windows (UTC). Overlap zones —
            London+NY, Tokyo+London — show the most volatile moves.
          </p>
        </div>
      </div>

      {/* Session chart */}
      <div className="mt-4 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-faint">
            Live sessions · 24h day
          </div>
          <div className="flex gap-1.5">
            {SESSIONS.map((s) => (
              <span key={s.id} className="flex items-center gap-1 text-[10px] font-semibold text-faint">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mt-5">
          <div className="space-y-3">
            {SESSIONS.map((s) => {
              const start = localMinutes(s.startUtcMin, offset);
              const end = localMinutes(s.endUtcMin, offset);
              const spansMidnight = start >= end;
              const activeThis = sessionsAt(nowMin).some((x) => x.id === s.id);
              const segs = spansMidnight
                ? [
                    { left: start, width: 1440 - start },
                    { left: 0, width: end },
                  ]
                : [{ left: start, width: end - start }];
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="w-16 shrink-0 text-right">
                    <div className={`text-[12px] font-black ${activeThis ? "text-ink" : "text-muted"}`}>
                      {s.name}
                    </div>
                    <div className="text-[9px] text-faint">
                      {fmtHM(start)}–{fmtHM(end)}
                    </div>
                  </div>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-panel2/70">
                    {segs.map((seg, i) => (
                      <div
                        key={i}
                        className={`absolute top-1 h-5 rounded-md transition-opacity ${activeThis ? "opacity-100" : "opacity-40"}`}
                        style={{
                          left: `${(seg.left / 1440) * 100}%`,
                          width: `${Math.max(1.5, (seg.width / 1440) * 100)}%`,
                          background: s.color,
                        }}
                      />
                    ))}
                  </div>
                  <div className="hidden w-52 shrink-0 text-[10.5px] leading-snug text-faint sm:block">
                    {s.note}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hover zone */}
          <div
            className="absolute inset-y-0 left-4 right-4 cursor-crosshair"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const frac = (e.clientX - r.left) / r.width;
              setHover(Math.min(1440, Math.max(0, frac * 1440)));
            }}
            onMouseLeave={() => setHover(null)}
          />

          {/* Now cursor + time label at its foot */}
          <div
            className="pointer-events-none absolute inset-y-0 left-4"
            style={{ width: "calc(100% - 2rem)" }}
          >
            <div
              className="absolute inset-y-0 w-px bg-coral/80"
              style={{ left: `${(nowMin / 1440) * 100}%` }}
            />
            <div
              className="absolute bottom-0 whitespace-nowrap rounded-md bg-coral/15 px-1.5 py-0.5 text-[9px] font-black tabular-nums text-coral ring-1 ring-coral/40"
              style={{
                left: `${(nowMin / 1440) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {localClock} {dayName}
            </div>
          </div>

          {/* Hover tooltip */}
          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-5 z-20 -translate-x-1/2 whitespace-nowrap rounded-xl border border-line bg-panel px-2.5 py-1.5 shadow-2xl shadow-black/40"
              style={{ left: `${Math.min(86, Math.max(14, (hover / 1440) * 100))}%` }}
            >
              <span className="text-[11px] font-black tabular-nums text-ink">
                {fmtHM(hover)}
              </span>
              <span className="mx-1 text-faint">·</span>
              {sessionsAt(hover).length > 0 ? (
                <span className="text-[11px] font-bold text-mint">
                  {sessionsAt(hover).map((s) => s.name).join(" · ")}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-coral">
                  No session open
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-between text-[10px] text-faint">
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h}>{String(h).padStart(2, "0")}:00</span>
          ))}
        </div>
      </div>

      {/* Weekend calendar */}
      <div className="mt-4 rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h3 className="text-[15px] font-black text-ink">
              Weekend market calendar
            </h3>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Forex is <b className="text-coral">closed Saturday and Sunday</b> —
              interbank FX stops at Friday UTC close ~22:00 and reopens with
              Sydney at Sunday ~21:00 UTC. Only crypto exchanges keep trading.
            </p>
          </div>
          {weekend ? (
            <span className="ml-auto rounded-full bg-coral/15 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-coral ring-1 ring-coral/30">
              {dayName} — FX closed
            </span>
          ) : (
            <span className="ml-auto rounded-full bg-mint/15 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-mint ring-1 ring-mint/30">
              Open · {dayName}
            </span>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-faint">
                <th className="pb-2 pr-3 font-bold">Market</th>
                <th className="pb-2 pr-3 font-bold">Venue</th>
                <th className="pb-2 pr-3 font-bold">Saturday</th>
                <th className="pb-2 pr-3 font-bold">Sunday</th>
                <th className="pb-2 font-bold">Volatility</th>
              </tr>
            </thead>
            <tbody>
              {WEEKEND_ROWS.map((w) => (
                <tr key={w.market} className="border-b border-line/60 text-muted">
                  <td className="py-2.5 pr-3 font-semibold text-ink">{w.market}</td>
                  <td className="py-2.5 pr-3">{w.venue}</td>
                  <td className="py-2.5 pr-3"><OpenC open={w.sat} /></td>
                  <td className="py-2.5 pr-3"><OpenC open={w.sun} /></td>
                  <td className="py-2.5"><VolChip v={w.vol} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-faint">
          Weekend volatility is rated for what keeps trading: BTC &amp; ETH lead
          weekend crypto swings (Best), altcoins follow with wider gaps (Good).
          Old fx pending positions carry swap charges — flat over the weekend is
          the beginner-safe default.
        </p>
      </div>

      {/* Curated market intel */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c, i) => (
          <InfoCard key={c.title} c={c} i={i} />
        ))}
      </div>

      <p className="mt-4 text-[11px] text-faint">
        Session clocks align to your chosen time zone (device default).
        Forex is fully closed on Saturday and Sunday; the week restarts with
        the Sydney open around 21:00 UTC on Sunday. Spreads and pair names are
        typical values — always verify with your broker.
      </p>
    </div>
  );
}