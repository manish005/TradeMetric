"use client";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { THEMES, useSettings, themeVariables } from "@/lib/settings";
import { IconSettings, IconReset } from "@/components/icons";

export default function SettingsView() {
  const { fontPct, theme, setFontPct, setThemeId, reset } = useSettings();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-mint/25 bg-mint/10 text-mint">
          <IconSettings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-ink">
            Settings
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Personalize your dashboard — saved per account
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted">
              Font size
            </h3>
            <span className="rounded-full bg-panel2 px-2.5 py-1 text-[12px] font-bold tabular-nums text-mint">
              {fontPct}%
            </span>
          </div>

          <input
            type="range"
            min={80}
            max={140}
            step={5}
            value={fontPct}
            onChange={(e) => setFontPct(Number(e.target.value))}
            className="mt-4 w-full accent-[var(--color-mint)]"
          />
          <div className="mt-1 flex justify-between text-[11px] font-medium text-faint">
            <span>80%</span>
            <span>140%</span>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-panel2/60 p-4">
            <div className="text-[13px] font-semibold text-muted">
              Preview — daily interest compounds silently,{" "}
              <span className="text-mint">results speak loudly.</span>
            </div>
            <div className="mt-1 text-[11px] text-faint">
              Scales text across the dashboard — layout stays fixed.
            </div>
          </div>

          <button
            onClick={reset}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-panel2 px-4 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:border-coral/40 hover:text-coral"
          >
            <IconReset className="h-4 w-4" />
            Reset to defaults
          </button>
        </div>

        <div className="rounded-3xl border border-line bg-panel/70 p-5 backdrop-blur sm:p-6">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted">
            Theme
          </h3>
          <p className="mt-1 text-[12px] text-faint">
            Applied live across the app for your account.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {THEMES.map((t) => {
              const active = t.id === theme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`group relative rounded-2xl border p-3 text-left transition-all ${
                    active
                      ? "border-mint/60 bg-mint/10"
                      : "border-line bg-panel2/50 hover:border-mint/30"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="theme-active"
                      className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-mint shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                    />
                  )}
                  <div className="flex gap-1.5">
                    {t.sw.map((c, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full ring-1 ring-black/30"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 text-[13px] font-bold text-ink">
                    {t.label}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-faint">
                    {t.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-panel2/60 p-4"
            style={themeVariables(theme) as CSSProperties}
          >
            <span
              className="h-8 w-8 rounded-xl"
              style={{ backgroundColor: "var(--color-mint)" }}
            />
            <div>
              <div className="text-[13px] font-bold" style={{ color: "var(--color-ink)" }}>
                {theme.label} — live preview
              </div>
              <div className="text-[11px]" style={{ color: "var(--color-muted)" }}>
                <span className="font-semibold" style={{ color: "var(--color-amber)" }}>
                  mint
                </span>{" "}
                <span style={{ color: "var(--color-cyan)" }}>cyan</span> on{" "}
                <span style={{ color: "var(--color-faint)" }}>{theme.vars.bg}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
