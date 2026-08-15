"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { TradeMetricLogo } from "@/components/Header";
import Calculator from "@/components/Calculator";
import RiskReward from "@/components/RiskReward";
import ProfileView from "@/components/ProfileView";
import ForexGuide from "@/components/ForexGuide";
import SettingsView from "@/components/SettingsView";
import JournalView from "@/components/JournalView";
import OverviewView from "@/components/OverviewView";
import AnalyticsView from "@/components/AnalyticsView";
import CurrencyConverter from "@/components/CurrencyConverter";
import MotivationModal from "@/components/MotivationModal";
import AdminView from "@/components/AdminView";
import MarketSessionsView from "@/components/MarketSessionsView";
import BacktestView from "@/components/BacktestView";
import { isAdminEmail } from "@/lib/admin";
import { SettingsProvider, themeVariables, useSettings } from "@/lib/settings";
import { downloadBackup } from "@/lib/backup";
import {
  IconBook,
  IconBars,
  IconCalculator,
  IconCalendar,
  IconChart,
  IconDownload,
  IconGlobe,
  IconClock,
  IconLogOut,
  IconMenu,
  IconSettings,
  IconTarget,
  IconTrendUp,
  IconUser,
} from "@/components/icons";

type View =
  | "overview"
  | "compound"
  | "journal"
  | "risk"
  | "analytics"
  | "converter"
  | "sessions"
  | "backtest"
  | "guide"
  | "settings"
  | "profile"
  | "admin";

export type { View };

type NavItem = {
  key: View;
  icon: (props: { className?: string }) => React.JSX.Element;
  label: string;
  desc: string;
  accent?: "mint" | "amber";
  badge?: string;
};

const TOOLS: NavItem[] = [
  {
    key: "overview",
    icon: IconTrendUp,
    label: "Today's Overview",
    desc: "Balance · target · momentum",
  },
  {
    key: "compound",
    icon: IconCalculator,
    label: "Compound calculator",
    desc: "Daily interest projection",
  },
  {
    key: "journal",
    icon: IconCalendar,
    label: "Trading Journal",
    desc: "Log trades & track targets",
  },
  {
    key: "risk",
    icon: IconTarget,
    label: "Risk / Reward",
    desc: "Forex points → profit",
  },
  {
    key: "analytics",
    icon: IconBars,
    label: "Analytics",
    desc: "Equity curve & streaks",
  },
  {
    key: "converter",
    icon: IconGlobe,
    label: "Currency Converter",
    desc: "Live FX conversion",
  },
  {
    key: "sessions",
    icon: IconClock,
    label: "Market Sessions",
    desc: "Live session times",
  },
  {
    key: "backtest",
    icon: IconChart,
    label: "Backtest",
    desc: "Charts & bar replay",
  },
  {
    key: "guide",
    icon: IconBook,
    label: "Forex Guide",
    desc: "Price action course",
  },
  {
    key: "settings",
    icon: IconSettings,
    label: "Settings",
    desc: "Theme & font size",
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    key: "admin",
    icon: IconBars,
    label: "Admin",
    desc: "Console · users · activity",
    accent: "amber",
    badge: "HRM",
  },
  {
    key: "settings",
    icon: IconSettings,
    label: "Settings",
    desc: "Theme & font size",
  },
];

const ADMIN_VIEWS = new Set<View>(["admin", "settings", "profile"]);

const VIEW_KEYS: View[] = [
  "overview",
  "compound",
  "journal",
  "risk",
  "analytics",
  "converter",
  "sessions",
  "backtest",
  "guide",
  "settings",
  "profile",
  "admin",
];

function viewFromPath(path?: string): View | null {
  const p = (path ?? (typeof window !== "undefined" ? window.location.pathname : "")).replace(/^\/+|\/+$/g, "");
  return (VIEW_KEYS as string[]).includes(p) ? (p as View) : null;
}

export default function AppShell({ initialView }: { initialView?: View }) {
  return (
    <SettingsProvider>
      <AppInner initialView={initialView} />
    </SettingsProvider>
  );
}

function AppInner({ initialView }: { initialView?: View }) {
  const [view, setView] = useState<View>(() => viewFromPath() ?? initialView ?? "compound");
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const { user, signOutUser } = useAuth();
  const settings = useSettings();
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (user) {
      if (!wasLoggedIn.current) setShowMotivation(true);
      wasLoggedIn.current = true;
    } else {
      wasLoggedIn.current = false;
    }
  }, [user]);

  const isAdmin = isAdminEmail(user?.email);

  // Pure admin menus — admins only ever render admin/settings/profile
  const effectiveView = isAdmin && !ADMIN_VIEWS.has(view) ? "admin" : view;

  const navItems = isAdmin ? ADMIN_NAV : TOOLS;

  const isProfile = effectiveView === "profile";
  const active = navItems.find((t) => t.key === effectiveView);
  const headerMeta =
    effectiveView === "admin"
      ? { label: "Admin", desc: "Console · users · sessions · revenue" }
      : effectiveView === "profile"
        ? { label: "Profile", desc: "Your account details" }
        : active
          ? { label: active.label, desc: active.desc }
          : { label: "", desc: "" };
  const ActiveIcon =
    effectiveView === "admin"
      ? IconBars
      : isProfile
        ? IconUser
        : (active?.icon ?? IconUser);

  const openTool = (key: View) => {
    setView(key);
    setNavOpen(false);
    window.history.pushState(null, "", `/${key}`);
  };

  useEffect(() => {
    const applyPath = () => {
      const v = viewFromPath();
      if (isAdmin) {
        setView(v && ADMIN_VIEWS.has(v) ? v : "admin");
        if (window.location.pathname !== `/${v && ADMIN_VIEWS.has(v) ? v : "admin"}`) {
          window.history.replaceState(null, "", `/${v && ADMIN_VIEWS.has(v) ? v : "admin"}`);
        }
        return;
      }
      if (v) {
        setView(v);
      } else if (window.location.pathname === "/") {
        window.history.replaceState(null, "", `/${view}`);
      }
    };
    window.addEventListener("popstate", applyPath);
    const pv = viewFromPath();
    const resolved = pv
      ? isAdmin && !ADMIN_VIEWS.has(pv)
        ? "admin"
        : pv
      : isAdmin
        ? "admin"
        : initialView ?? "compound";
    if (window.location.pathname !== `/${resolved}`) {
      window.history.replaceState(null, "", `/${resolved}`);
    }
    return () => window.removeEventListener("popstate", applyPath);
  }, [view, initialView, isAdmin]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={
        {
          ...themeVariables(settings.theme),
          "--app-scale": (settings.fontPct / 100).toFixed(3),
          "--text-xs": "calc(0.75rem * var(--app-scale))",
          "--text-sm": "calc(0.875rem * var(--app-scale))",
          "--text-base": "calc(1rem * var(--app-scale))",
          "--text-lg": "calc(1.125rem * var(--app-scale))",
          "--text-xl": "calc(1.25rem * var(--app-scale))",
          "--text-2xl": "calc(1.5rem * var(--app-scale))",
          "--text-3xl": "calc(1.875rem * var(--app-scale))",
          "--text-4xl": "calc(2.25rem * var(--app-scale))",
        } as CSSProperties
      }
    >
      {/* Mobile backdrop */}
      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-panel/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:w-52 lg:translate-x-0 lg:bg-panel/60 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <TradeMetricLogo />
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:text-mint lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1.5 p-3">
          {navItems.map((t) => {
            const TabIcon = t.icon;
            const isActive = effectiveView === t.key;
            const accent = t.accent ?? "mint";
            return (
              <button
                key={t.key}
                onClick={() => openTool(t.key)}
                className={`relative flex flex-col items-start gap-0 py-2 rounded-xl px-3 text-left transition-colors ${
                  isActive ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className={`absolute inset-0 rounded-xl ${
                      accent === "amber"
                        ? "bg-amber/10 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.32)]"
                        : "bg-mint/10 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.32)]"
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-2.5 text-sm font-semibold">
                  <TabIcon
                    className={`h-4.5 w-4.5 ${
                      isActive ? (accent === "amber" ? "text-amber" : "text-mint") : ""
                    }`}
                  />
                  {t.label}
                  {t.badge && (
                    <span className="rounded-full bg-amber/15 px-1.5 py-0.5 text-[9px] font-black text-amber">
                      {t.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line p-3">
          <div className="flex w-full items-center gap-2.5 rounded-xl bg-panel2 px-3 py-2.5">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                className="h-8 w-8 rounded-full border border-line"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint/15 text-sm font-bold text-mint">
                {user?.displayName?.[0] ?? user?.email?.[0] ?? "G"}
              </span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-semibold text-ink">
                {user?.displayName ?? "Trader"}
              </div>
              <div className="truncate text-[11px] text-faint">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-panel2 text-muted transition-colors hover:border-mint/60 hover:text-mint lg:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex min-w-0 items-center gap-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint/10 text-mint ring-1 ring-mint/20">
                <ActiveIcon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-bold text-ink">
                  {headerMeta.label}
                </h1>
                <p className="hidden text-[11px] text-faint sm:block">
                  {headerMeta.desc}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel2 transition-colors hover:border-mint/60 hover:ring-2 hover:ring-mint/20"
              aria-label="Account menu"
            >
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-10 w-10 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-sm font-bold text-mint">
                  {user?.displayName?.[0] ?? user?.email?.[0] ?? "G"}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 6 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute right-0 top-12 z-20 w-52 rounded-2xl border border-line bg-panel p-2 shadow-2xl shadow-black/50"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setView("profile");
                      }}
                      className="inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel2 hover:text-mint"
                    >
                      <IconUser className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setView("settings");
                      }}
                      className="mt-1 inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel2 hover:text-mint"
                    >
                      <IconSettings className="h-4 w-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        if (user?.uid) downloadBackup(user.uid);
                      }}
                      className="mt-1 inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel2 hover:text-mint"
                    >
                      <IconDownload className="h-4 w-4" />
                      Export data
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        void signOutUser();
                      }}
                      className="mt-1 inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted transition-colors hover:bg-panel2 hover:text-coral"
                    >
                      <IconLogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Scrollable main content — only this scrolls */}
        <main className="grid-bg relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="orb orb-a -top-32 left-[-8%] h-[420px] w-[420px]" />
          <div className="orb orb-b right-[-10%] top-1/3 h-[380px] w-[380px]" />

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 16, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.992 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {effectiveView === "overview" ? (
                <OverviewView />
              ) : effectiveView === "admin" ? (
                <AdminView />
              ) : effectiveView === "compound" ? (
                <Calculator />
              ) : effectiveView === "journal" ? (
                <JournalView />
              ) : effectiveView === "risk" ? (
                <RiskReward />
              ) : effectiveView === "analytics" ? (
                <AnalyticsView />
              ) : effectiveView === "converter" ? (
                <CurrencyConverter
                  initialValue={1000}
                  initialCurrency={settings.currency}
                />
              ) : effectiveView === "sessions" ? (
                <MarketSessionsView />
              ) : effectiveView === "backtest" ? (
                <BacktestView />
              ) : effectiveView === "guide" ? (
                <ForexGuide />
              ) : effectiveView === "settings" ? (
                <SettingsView />
              ) : (
                <ProfileView user={user} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MotivationModal
        open={showMotivation}
        onClose={() => setShowMotivation(false)}
      />
    </div>
  );
}