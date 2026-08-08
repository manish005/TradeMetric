"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";

export type ThemeVars = {
  bg: string;
  panel: string;
  panel2: string;
  line: string;
  line2: string;
  ink: string;
  muted: string;
  faint: string;
  mint: string;
  teal: string;
  cyan: string;
  amber: string;
  coral: string;
  violet: string;
};

export type Theme = {
  id: string;
  label: string;
  desc: string;
  sw: [string, string, string];
  vars: ThemeVars;
};

export const THEMES: Theme[] = [
  {
    id: "emerald",
    label: "Midnight Mint",
    desc: "Classic dark with mint accents",
    sw: ["#34d399", "#38bdf8", "#070b13"],
    vars: {
      bg: "#070b13",
      panel: "#0d151e",
      panel2: "#121c27",
      line: "#1d2a3a",
      line2: "#2a3b4f",
      ink: "#e9f1f9",
      muted: "#8296ab",
      faint: "#5c7086",
      mint: "#34d399",
      teal: "#2dd4bf",
      cyan: "#38bdf8",
      amber: "#fbbf24",
      coral: "#fb7185",
      violet: "#a78bfa",
    },
  },
  {
    id: "ocean",
    label: "Deep Ocean",
    desc: "Cold steel blues, teal highlights",
    sw: ["#22d3ee", "#60a5fa", "#040811"],
    vars: {
      bg: "#040811",
      panel: "#0a1521",
      panel2: "#0f1e2e",
      line: "#16283f",
      line2: "#23305f",
      ink: "#e6f3ff",
      muted: "#7d96bd",
      faint: "#50668c",
      mint: "#22d3ee",
      teal: "#2dd4bf",
      cyan: "#60a5fa",
      amber: "#fbbf24",
      coral: "#fb7185",
      violet: "#a78bfa",
    },
  },
  {
    id: "forest",
    label: "Evergreen Forest",
    desc: "Deep green with fresh lime growth",
    sw: ["#4ade80", "#a3e635", "#04120c"],
    vars: {
      bg: "#04120c",
      panel: "#082017",
      panel2: "#0d2b20",
      line: "#16302a",
      line2: "#1f4a37",
      ink: "#e9fbea",
      muted: "#7fa68d",
      faint: "#4d735d",
      mint: "#4ade80",
      teal: "#2dd4bf",
      cyan: "#38bdf8",
      amber: "#fbbf24",
      coral: "#fb7185",
      violet: "#a78bfa",
    },
  },
  {
    id: "sunset",
    label: "Desert Sunset",
    desc: "Warm embers and amber glow",
    sw: ["#fbbf24", "#f97316", "#140c06"],
    vars: {
      bg: "#140c06",
      panel: "#1e140b",
      panel2: "#291b0e",
      line: "#3a2714",
      line2: "#55381d",
      ink: "#fff3e2",
      muted: "#b3a07e",
      faint: "#7d6a52",
      mint: "#fbbf24",
      teal: "#fb923c",
      cyan: "#f97316",
      amber: "#f59e0b",
      coral: "#f43f5e",
      violet: "#c084fc",
    },
  },
  {
    id: "rose",
    label: "Rosewood",
    desc: "Deep wine reds, blush accents",
    sw: ["#fb7185", "#e879f9", "#150a10"],
    vars: {
      bg: "#150a10",
      panel: "#22121b",
      panel2: "#2f1a25",
      line: "#3d2430",
      line2: "#5a3140",
      ink: "#ffecef",
      muted: "#c08c9c",
      faint: "#8a5d6b",
      mint: "#fb7185",
      teal: "#fda4af",
      cyan: "#e879f9",
      amber: "#fbbf24",
      coral: "#f43f5e",
      violet: "#c084fc",
    },
  },
  {
    id: "amber",
    label: "Champagne Gold",
    desc: "Warm gold on ebony black",
    sw: ["#f5d061", "#e8b64c", "#0e0a04"],
    vars: {
      bg: "#0e0a04",
      panel: "#1a1408",
      panel2: "#241c0b",
      line: "#2a2010",
      line2: "#4d3b14",
      ink: "#fdf3dd",
      muted: "#b3a05f",
      faint: "#7c6a3c",
      mint: "#f5d061",
      teal: "#e8b64c",
      cyan: "#fbbf24",
      amber: "#f59e0b",
      coral: "#ef4444",
      violet: "#a78bfa",
    },
  },
  {
    id: "slate",
    label: "Tactical Slate",
    desc: "Neutral graphite, low saturation",
    sw: ["#94a3b8", "#64748b", "#0b1220"],
    vars: {
      bg: "#0b1220",
      panel: "#141a2c",
      panel2: "#1a2436",
      line: "#26364e",
      line2: "#3a4a66",
      ink: "#e2e8f0",
      muted: "#8ca0b8",
      faint: "#5f7591",
      mint: "#94a3b8",
      teal: "#7dd3fc",
      cyan: "#60a5fa",
      amber: "#eab308",
      coral: "#f87171",
      violet: "#a78bfa",
    },
  },
  {
    id: "synth",
    label: "Synthgrid",
    desc: "Retro neon magenta and cyan",
    sw: ["#ff2dd7", "#22d3ee", "#0a0512"],
    vars: {
      bg: "#0a0512",
      panel: "#150b20",
      panel2: "#1d1130",
      line: "#31204a",
      line2: "#4a2f6b",
      ink: "#f5eaff",
      muted: "#b9a0e0",
      faint: "#7d5fa8",
      mint: "#22d3ee",
      teal: "#66f0ff",
      cyan: "#8b5cf6",
      amber: "#f6d061",
      coral: "#ff2d9b",
      violet: "#c084fc",
    },
  },
  {
    id: "galaxy",
    label: "Deep Space",
    desc: "Indigo space with stardust",
    sw: ["#6366f1", "#a855f7", "#05030f"],
    vars: {
      bg: "#05030f",
      panel: "#0d0922",
      panel2: "#141031",
      line: "#26204e",
      line2: "#3a316b",
      ink: "#eef0ff",
      muted: "#9aa0d6",
      faint: "#6b6fa6",
      mint: "#6366f1",
      teal: "#818cf8",
      cyan: "#a855f7",
      amber: "#fcd34d",
      coral: "#fb7185",
      violet: "#c4b5fd",
    },
  },
];

const DEFAULTS = { fontPct: 100, themeId: "emerald" };

function storageKey(uid: string) {
  return `trademetric:prefs:${uid}`;
}

type SettingsCtx = {
  fontPct: number;
  theme: Theme;
  setFontPct: (pct: number) => void;
  setThemeId: (id: string) => void;
  reset: () => void;
};

const Ctx = createContext<SettingsCtx>({
  fontPct: DEFAULTS.fontPct,
  theme: THEMES[0],
  setFontPct: () => {},
  setThemeId: () => {},
  reset: () => {},
});

export function themeVariables(t: Theme): CSSProperties {
  return {
    "--color-bg": t.vars.bg,
    "--color-panel": t.vars.panel,
    "--color-panel2": t.vars.panel2,
    "--color-line": t.vars.line,
    "--color-line2": t.vars.line2,
    "--color-ink": t.vars.ink,
    "--color-muted": t.vars.muted,
    "--color-faint": t.vars.faint,
    "--color-mint": t.vars.mint,
    "--color-teal": t.vars.teal,
    "--color-cyan": t.vars.cyan,
    "--color-amber": t.vars.amber,
    "--color-coral": t.vars.coral,
    "--color-violet": t.vars.violet,
  } as CSSProperties;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [fontPct, setFontPct] = useState(DEFAULTS.fontPct);
  const [themeId, setThemeId] = useState(DEFAULTS.themeId);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!uid) return;
    try {
      const raw = localStorage.getItem(storageKey(uid));
      if (raw) {
        const p = JSON.parse(raw) as Partial<typeof DEFAULTS>;
        if (typeof p.fontPct === "number") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFontPct(Math.min(140, Math.max(80, Math.round(p.fontPct))));
        }
        if (typeof p.themeId === "string" && THEMES.some((t) => t.id === p.themeId)) {
          setThemeId(p.themeId);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    hydrated.current = true;
  }, [uid]);

  useEffect(() => {
    if (!uid || !hydrated.current) return;
    try {
      localStorage.setItem(
        storageKey(uid),
        JSON.stringify({ fontPct, themeId })
      );
    } catch {
      // storage busy — ignore
    }
  }, [uid, fontPct, themeId]);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  return (
    <Ctx.Provider
      value={{
        fontPct,
        theme,
        setFontPct: (p) => setFontPct(Math.min(140, Math.max(80, Math.round(p)))),
        setThemeId,
        reset: () => {
          setFontPct(DEFAULTS.fontPct);
          setThemeId(DEFAULTS.themeId);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  return useContext(Ctx);
}