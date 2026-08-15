"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SYMBOLS,
  SYMBOL_MAP,
  TIMEFRAMES,
  fmtPrice,
  fmtTime,
  loadSeries,
  type Candle,
  type Timeframe,
  type SymbolSpec,
} from "@/lib/backtest";

const UP = "#34d399";
const DOWN = "#fb7185";
const GRID = "rgba(148,163,184,0.14)";
const AXIS_TXT = "#8b98ab";
const PAD_R = 64;
const PAD_B = 26;
const PAD_T = 10;
const PAD_L = 8;
const VOL_H = 66;
const MIN_STEP = 5;
const MAX_STEP = 42;
const DEFAULT_VISIBLE = 140;

function leftIdxOf(len: number, end: number, step: number, plotW: number) {
  const count = Math.max(8, Math.floor(plotW / step));
  return Math.max(0, end - (count - 1));
}

export default function BacktestView() {
  const [symbol, setSymbol] = useState<SymbolSpec>(SYMBOL_MAP["XAUUSD"]);
  const [tf, setTf] = useState<Timeframe>("1h");
  const [series, setSeries] = useState<Candle[] | null>(null);
  const [source, setSource] = useState<"live" | "simulated">("simulated");

  const [candleStep, setCandleStep] = useState(10);
  const [winStart, setWinStart] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);

  const [cross, setCross] = useState<{ idx: number; px: number; py: number } | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 480 });

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; start: number; step: number; moved: boolean } | null>(null);
  const viewRef = useRef({ winStart: 0, end: 0, step: 10, w: 800, len: 0 });

  const len = series?.length ?? 0;
  const loading = series === null;
  const tfMs = TIMEFRAMES.find((t) => t.key === tf)?.ms ?? 3_600_000;
  const plotW = canvasSize.w - PAD_L - PAD_R;

  const speedMs = useMemo(() => [140, 70, 35, 18][speedIdx] ?? 140, [speedIdx]);

  // mirror latest view into a ref for the playback clock (reads after renders only)
  useEffect(() => {
    viewRef.current = { winStart, end: endIndex, step: candleStep, w: canvasSize.w, len };
  });

  // data request — bumped in event handlers only
  const [request, setRequest] = useState({ sym: symbol, tf });
  const requestSymbol = (sym: SymbolSpec) => {
    setSymbol(sym);
    setQuery("");
    setSearchOpen(false);
    setPlaying(false);
    setSeries(null);
    setCross(null);
    setRequest({ sym, tf: request.tf });
  };
  const requestTf = (t: Timeframe) => {
    setTf(t);
    setPlaying(false);
    setSeries(null);
    setCross(null);
    setRequest({ sym: request.sym, tf: t });
  };

  useEffect(() => {
    let cancelled = false;
    void loadSeries(request.sym, request.tf).then((res) => {
      if (cancelled) return;
      setSeries(res.candles);
      setSource(res.source);
      setEndIndex(res.candles.length - 1);
      setWinStart(Math.max(0, res.candles.length - DEFAULT_VISIBLE));
      setCross(null);
    });
    return () => {
      cancelled = true;
    };
  }, [request]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setCanvasSize({ w: Math.max(320, Math.round(r.width)), h: Math.max(240, Math.round(r.height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // playback clock — reads latest view via ref, writes state from timer callback
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const v = viewRef.current;
      if (v.end >= v.len - 1) {
        setPlaying(false);
        return;
      }
      const next = v.end + 1;
      const count = Math.max(8, Math.floor((v.w - PAD_L - PAD_R) / v.step));
      if (next - v.winStart > count - 2) {
        setWinStart(Math.max(0, next - count + 3));
      }
      setEndIndex(next);
    }, speedMs);
    return () => window.clearInterval(id);
  }, [playing, speedMs]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !series || len === 0) return;
    const { w, h } = canvasSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const leftIdx = leftIdxOf(len, endIndex, candleStep, plotW);
    const pxTop = PAD_T;
    const pxH = h - PAD_T - PAD_B - VOL_H;
    const visible = series.slice(leftIdx, endIndex + 1);
    if (visible.length === 0) return;

    let hi = -Infinity;
    let lo = Infinity;
    const maxV = Math.max(...visible.map((c) => c.v), 1);
    for (const c of visible) {
      if (c.h > hi) hi = c.h;
      if (c.l < lo) lo = c.l;
    }
    const rawRange = hi - lo;
    const padAmt = rawRange > 0 ? rawRange * 0.08 : 1;
    hi += padAmt;
    lo = Math.max(0, lo - padAmt);
    const range = hi - lo || 1;

    const xAt = (i: number) => PAD_L + (i - leftIdx + 0.5) * candleStep;
    const yAt = (p: number) => pxTop + pxH * (1 - (p - lo) / range);
    const volBase = pxTop + pxH + VOL_H;

    // grid + price axis
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 5; i++) {
      const p = lo + (range * i) / 5;
      const y = Math.round(yAt(p)) + 0.5;
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(w - PAD_R, y);
      ctx.stroke();
      ctx.fillStyle = AXIS_TXT;
      ctx.textAlign = "left";
      ctx.fillText(fmtPrice(p, symbol.pip), w - PAD_R + 8, y);
    }

    // candles + volume
    const bodyW = Math.max(1.5, Math.min(candleStep * 0.66, 26));
    for (const c of visible) {
      const i = series.indexOf(c);
      const x = xAt(i);
      const up = c.c >= c.o;
      const col = up ? UP : DOWN;
      const volBarH = (c.v / maxV) * (VOL_H - 10);
      ctx.fillStyle = up ? "rgba(52,211,153,0.32)" : "rgba(251,113,133,0.32)";
      ctx.fillRect(x - bodyW / 2, volBase - volBarH, bodyW, volBarH);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yAt(c.h));
      ctx.lineTo(x, yAt(c.l));
      ctx.stroke();
      const yo = yAt(c.o);
      const yc = yAt(c.c);
      ctx.fillStyle = col;
      ctx.fillRect(x - bodyW / 2, Math.min(yo, yc), bodyW, Math.max(1, Math.abs(yc - yo)));
    }

    // last (visible-right) price line
    const lastC = visible[visible.length - 1];
    const lastY = yAt(lastC.c);
    ctx.strokeStyle = playing || endIndex < len - 1 ? "rgba(251,191,36,0.55)" : "rgba(52,211,153,0.5)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD_L, lastY);
    ctx.lineTo(w - PAD_R, lastY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = playing || endIndex < len - 1 ? "#fbbf24" : UP;
    ctx.fillRect(w - PAD_R, lastY - 8, PAD_R, 16);
    ctx.fillStyle = "#0b1120";
    ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(fmtPrice(lastC.c, symbol.pip), w - PAD_R + 7, lastY);

    // time axis
    ctx.fillStyle = AXIS_TXT;
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const idx = Math.round(leftIdx + ((visible.length - 1) * i) / ticks);
      const c = series[idx];
      if (!c) continue;
      const x = xAt(idx);
      ctx.fillText(fmtTime(c.t, tfMs), x, h - PAD_B / 2);
    }

    // crosshair
    if (cross && cross.idx >= leftIdx && cross.idx <= endIndex && cross.idx < len) {
      const cx = xAt(cross.idx);
      ctx.strokeStyle = "rgba(148,163,184,0.55)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, PAD_T);
      ctx.lineTo(cx, h - PAD_B);
      ctx.moveTo(PAD_L, cross.py);
      ctx.lineTo(w - PAD_R, cross.py);
      ctx.stroke();
      ctx.setLineDash([]);
      const c = series[cross.idx];
      const price = lo + (1 - (cross.py - pxTop) / pxH) * range;
      // time label
      const tw = 92;
      const tx = Math.min(Math.max(cx - tw / 2, PAD_L), w - PAD_R - tw);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(tx, PAD_T - 4, tw, 20);
      ctx.strokeStyle = GRID;
      ctx.strokeRect(tx + 0.5, PAD_T - 3.5, tw, 19);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(fmtTime(c.t, tfMs), tx + tw / 2, PAD_T + 6);
      // price label
      const py = Math.min(Math.max(cross.py - 8, PAD_T), h - PAD_B - 18);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(w - PAD_R, py, PAD_R, 18);
      ctx.strokeStyle = GRID;
      ctx.strokeRect(w - PAD_R + 0.5, py + 0.5, PAD_R - 1, 17);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(fmtPrice(price, symbol.pip), w - PAD_R + 7, py + 9);
    }
  }, [series, len, symbol, canvasSize, candleStep, endIndex, cross, plotW, playing, tfMs]);

  useEffect(() => {
    draw();
  }, [draw]);

  // wheel zoom (non-passive to preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCandleStep((s) => Math.min(MAX_STEP, Math.max(MIN_STEP, s * (e.deltaY > 0 ? 1.14 : 0.88))));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: e.clientX, start: winStart, step: candleStep, moved: false };
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const now = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - now.left;
    const py = e.clientY - now.top;
    const leftIdx = leftIdxOf(len, endIndex, candleStep, plotW);
    const count = Math.max(8, Math.floor(plotW / candleStep));
    if (dragRef.current) {
      const d = (e.clientX - dragRef.current.x) / dragRef.current.step;
      setWinStart(Math.max(0, Math.min(endIndex - count + 1, Math.round(dragRef.current.start - d))));
      return;
    }
    const idx = Math.min(endIndex, Math.max(leftIdx, leftIdx + Math.floor((px - PAD_L) / candleStep)));
    setCross({ idx, px, py });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  };
  const onPointerLeave = () => setCross(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? SYMBOLS.filter(
          (s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
        )
      : SYMBOLS;
    const groups = new Map<string, SymbolSpec[]>();
    for (const s of list) {
      const arr = groups.get(s.category) ?? [];
      arr.push(s);
      groups.set(s.category, arr);
    }
    return groups;
  }, [query]);

  const lastCandle = series ? series[len - 1] : undefined;
  const ohlcCandle = cross && cross.idx < len ? series?.[cross.idx] : lastCandle;
  const lastDelta = lastCandle ? ((lastCandle.c - lastCandle.o) / lastCandle.o) * 100 : 0;

  const togglePlay = () => {
    if (!playing && (endIndex >= len - 1 || endIndex <= winStart)) {
      setEndIndex(Math.max(winStart + 1, winStart + Math.floor(Math.min(120, DEFAULT_VISIBLE) * 0.4)));
    }
    setPlaying((p) => !p);
  };
  const goLive = () => {
    setPlaying(false);
    setEndIndex(len - 1);
    setWinStart(Math.max(0, len - DEFAULT_VISIBLE));
  };
  const scrub = (v: number) => {
    setPlaying(false);
    setEndIndex(Math.min(v, len - 1));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-panel/70 p-3 backdrop-blur lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
                if (e.key === "Enter") {
                  const first = [...filtered.values()][0]?.[0];
                  if (first) requestSymbol(first);
                }
              }}
              placeholder="Search symbol — XAUUSD, BTCUSDT, EURUSD…"
              className="h-11 w-full rounded-xl border border-line bg-panel2 px-3 pl-9 text-[14px] font-semibold text-ink outline-none transition-colors placeholder:text-faint focus:border-mint/70 focus:ring-2 focus:ring-mint/20"
              aria-label="Search symbol"
            />
          </div>
          {searchOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setSearchOpen(false)} />
              <div className="absolute left-0 right-0 top-[52px] z-30 max-h-[340px] overflow-y-auto rounded-2xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/50">
                {filtered.size === 0 && (
                  <p className="px-3 py-3 text-[13px] text-faint">No symbols match “{query}”.</p>
                )}
                {[...filtered.entries()].map(([cat, items]) => (
                  <div key={cat}>
                    <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-widest text-faint">
                      {cat}
                    </p>
                    {items.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => requestSymbol(s)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-panel2 ${
                          s.id === symbol.id ? "bg-mint/10" : ""
                        }`}
                      >
                        <span className="flex items-baseline gap-2.5">
                          <span className="text-[13.5px] font-bold text-ink">{s.id}</span>
                          <span className="truncate text-[12px] text-faint">{s.name}</span>
                        </span>
                        <span className="shrink-0 rounded-full bg-panel2 px-2 py-0.5 text-[10px] font-bold text-muted">
                          {s.category}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-6 gap-1 overflow-hidden rounded-xl border border-line bg-panel2 p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => requestTf(t.key)}
              className={`rounded-[10px] px-2 py-2 text-[12px] font-bold transition-all ${
                tf === t.key
                  ? "bg-mint/15 text-mint shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
              source === "live" ? "bg-mint/15 text-mint" : "bg-amber/15 text-amber"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${source === "live" ? "bg-mint" : "bg-amber"}`} />
            {source === "live" ? "Live · Binance" : "Simulated"}
          </span>
          {lastCandle && (
            <span className="rounded-full bg-panel2 px-2.5 py-1 text-[12px] font-bold tabular-nums text-ink">
              {fmtPrice(lastCandle.c, symbol.pip)}{" "}
              <span className={lastDelta >= 0 ? "text-mint" : "text-coral"}>
                {lastDelta >= 0 ? "+" : ""}
                {lastDelta.toFixed(2)}%
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div
        ref={wrapRef}
        className="relative h-[440px] overflow-hidden rounded-3xl border border-line bg-panel/70 backdrop-blur sm:h-[480px]"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-panel2">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-mint/60" />
            </div>
          </div>
        ) : (
          <>
            {/* OHLC readout */}
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-panel/85 px-3 py-2 backdrop-blur">
              <span className="text-[13px] font-black tracking-wide text-ink">
                {symbol.id}
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-faint">
                  {tf} · {source === "live" ? "Binance" : "Simulated"}
                </span>
              </span>
              {ohlcCandle && (
                <>
                  <span className="text-[12px] tabular-nums text-muted">
                    O <b className="text-ink">{fmtPrice(ohlcCandle.o, symbol.pip)}</b>
                  </span>
                  <span className="text-[12px] tabular-nums text-muted">
                    H <b className="text-mint">{fmtPrice(ohlcCandle.h, symbol.pip)}</b>
                  </span>
                  <span className="text-[12px] tabular-nums text-muted">
                    L <b className="text-coral">{fmtPrice(ohlcCandle.l, symbol.pip)}</b>
                  </span>
                  <span className="text-[12px] tabular-nums text-muted">
                    C{" "}
                    <b
                      className={
                        ohlcCandle.c >= ohlcCandle.o ? "text-mint" : "text-coral"
                      }
                    >
                      {fmtPrice(ohlcCandle.c, symbol.pip)}
                    </b>
                  </span>
                </>
              )}
            </div>

            <canvas
              ref={canvasRef}
              className="h-full w-full cursor-crosshair touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
            />

            {source === "simulated" && (
              <p className="pointer-events-none absolute bottom-12 left-3 rounded-lg bg-panel/80 px-2 py-1 text-[10px] text-faint backdrop-blur">
                No free live feed for {symbol.id} — realistic simulated candles. BTC, ETH, SOL, BNB, XRP stream live.
              </p>
            )}
          </>
        )}
      </div>

      {/* Playback bar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-panel/70 p-3 backdrop-blur sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPlaying(false);
              setEndIndex(Math.max(winStart + 1, winStart + 3));
            }}
            title="Cut candles here and replay"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-panel2 text-muted transition-colors hover:border-mint/50 hover:text-mint"
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition-all ${
              playing
                ? "bg-amber/15 text-amber shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]"
                : "bg-gradient-to-r from-mint to-teal text-bg shadow-[0_6px_20px_-6px_rgba(52,211,153,0.55)] hover:brightness-110"
            }`}
          >
            {playing ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M7 5.5v13a1 1 0 0 0 1.5 0.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5z" />
                </svg>
                Play
              </>
            )}
          </button>
          <div className="flex items-center overflow-hidden rounded-xl border border-line bg-panel2 p-0.5">
            {[1, 2, 4, 8].map((sp, i) => (
              <button
                key={sp}
                onClick={() => setSpeedIdx(i)}
                className={`rounded-[10px] px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                  speedIdx === i ? "bg-mint/15 text-mint" : "text-muted hover:text-ink"
                }`}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(1, len - 1)}
            value={Math.min(endIndex, Math.max(0, len - 1))}
            onChange={(e) => scrub(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer accent-[#34d399]"
            aria-label="Replay cursor"
          />
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
              endIndex >= len - 1 ? "bg-mint/15 text-mint" : "bg-amber/15 text-amber"
            }`}
          >
            {endIndex >= len - 1 ? "Live" : `Replay · ${endIndex + 1}/${len}`}
          </span>
          <button
            onClick={goLive}
            disabled={endIndex >= len - 1}
            className="shrink-0 rounded-xl border border-line bg-panel2 px-3 py-2 text-[12px] font-bold text-muted transition-colors hover:border-mint/50 hover:text-mint disabled:opacity-40"
          >
            Jump to live
          </button>
        </div>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-faint">
        Scroll to zoom · drag to pan · press <b>Play</b> to replay candles one by one (Bar Replay, like TradingView) ·
        drag the slider to cut the chart anywhere.
      </p>
    </div>
  );
}