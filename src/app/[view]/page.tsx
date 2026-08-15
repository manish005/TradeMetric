import type { Metadata } from "next";
import ToolPage from "@/components/ToolPage";
import type { View } from "@/components/AppShell";

export function generateStaticParams() {
  return [
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
  ].map((view) => ({ view }));
}

const VIEW_META: Record<string, Metadata> = {
  overview: {
    title: "Daily Profit Tracker & Account Overview",
    description:
      "Track your daily profit, account balance and momentum in one overview. A free daily profit calculator-style dashboard with target progress, win rate and P&L totals.",
    keywords: [
      "daily profit calculator",
      "daily profit tracker",
      "trading account overview",
      "daily P&L tracker",
    ],
  },
  compound: {
    title: "Compound Interest Calculator — Daily Compounding",
    description:
      "Free compound interest calculator with daily compounding. Set the daily return, reinvest rate and trading days to project growth with deposits, withdrawals and a full amortization table. No sign-up needed.",
    keywords: [
      "compound interest calculator",
      "daily compound interest calculator",
      "daily compounding calculator",
      "daily interest calculator",
      "compounding calculator",
      "compound interest calculator daily reinvest",
      "compound interest calculator formula",
    ],
  },
  journal: {
    title: "Trading Journal & Trade Log",
    description:
      "Log trades, tag setups and review your trading history. A free trading journal with streaks, targets and export.",
  },
  risk: {
    title: "Risk Reward Ratio & Forex Lot Size Calculator",
    description:
      "Calculate the exact lot size for MT4 and MT5 from account balance, risk per trade and stop loss in pips. Free risk reward ratio calculator with take profit targeting.",
    keywords: [
      "risk reward ratio calculator",
      "forex lot size calculator",
      "position size calculator MT4",
      "forex position size calculator",
    ],
  },
  analytics: {
    title: "Trading Analytics & Performance Stats",
    description:
      "Win rate, average win, max drawdown and equity curve — free performance analytics for your trading journal.",
  },
  converter: {
    title: "Currency Converter — Live Exchange Rates",
    description:
      "Convert between USD, EUR, GBP, INR, JPY and more with live exchange rates. Free multi-currency converter with historical comparisons.",
  },
  sessions: {
    title: "Forex Market Hours in IST — Session Times India",
    description:
      "Live forex market hours in IST. Sydney opens 5:30 am, Tokyo 6:30 am, London 12:30 pm and New York 5:30 pm IST — see the London–New York overlap and the best time to trade forex in India.",
    keywords: [
      "forex market hours IST",
      "London session time in India",
      "New York session trading time in IST",
      "best time to trade forex in India IST",
      "forex session times India",
    ],
  },
  backtest: {
    title: "Backtest & Candlestick Chart Replay",
    description:
      "Free candlestick backtesting chart with bar replay. Analyse XAUUSD, XAGUSD, EURUSD, BTCUSDT and more — cut candles and replay price history step by step, with zoom, pan and live Binance crypto data.",
    keywords: [
      "backtest trading chart",
      "candlestick chart replay",
      "bar replay trading view",
      "XAUUSD chart analysis",
      "XAGUSD candlestick chart",
      "forex candlestick chart gold",
      "BTCUSDT chart backtest",
    ],
  },
  guide: {
    title: "Forex Guide — Pip Value & Margin Explained",
    description:
      "Learn what a pip is, how pip value in INR is calculated and how margin and leverage work. Free forex guide for Indian traders with pip value calculator, margin calculator forex and examples.",
    keywords: [
      "forex pip value calculator",
      "pip value calculator USD to INR",
      "margin calculator forex",
      "what is a pip in forex",
      "forex leverage explained beginner",
    ],
  },
  settings: {
    title: "Settings & Preferences",
    description: "Manage your TraderMatrix workspace, theme and export settings.",
  },
  profile: {
    title: "Profile & Achievements",
    description: "Your TraderMatrix profile, streaks and achievements.",
  },
  admin: {
    title: "Admin",
    description: "TraderMatrix administration.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ view: string }>;
}): Promise<Metadata> {
  const { view } = await params;
  const meta = VIEW_META[view] ?? VIEW_META.overview;
  return {
    ...meta,
    alternates: { canonical: `/${view}` },
  };
}

export default async function Page({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  return <ToolPage view={view as View} />;
}