<div align="center">

# 📈 TraderMatrix

**Daily compound interest & Forex planning, in your browser.**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://tradermatrix.in)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**Project tomorrow's growth, today** — [\*\*\*Live App\*\*\*](https://tradermatrix.in)

</div>

---

## ✨ Features

| | |
|---|---|
| 🧮 **Daily compound calculator** | Day-by-day compounding with reinvest-rate control, deposits, withdrawals & one-time top-ups |
| 🗓️ **Trading-day aware** | Exclude weekends, pick trading days, skip U.S. holidays — with business-day counts |
| 💱 **Multi-currency & Forex tools** | USD / EUR / GBP / INR / JPY projections, live FX conversion, risk-reward calculator |
| 📊 **Amortization tables & CSV** | Day / week / month / year breakdowns with totals — one-click CSV export |
| 📒 **Trade journal** | Log trades, track today's target vs. projected earnings, one-time deposit tracking & celebration animations |
| 🌗 **9 themes + font scaling** | Text-only font sizing (80–140%) with saved per-user preferences |
| 🔒 **Private by design** | All math runs locally — nothing leaves your device; optional Google sign-in remembers your workspace |
| 💬 **Daily motivation** | 3 curated quotes a day (discipline → consistency → patience) + "Happy Best Trade Day" greeting |

## 🖥️ Live Demo

| | |
|---|---|
| 🌍 **Production** | [https://tradermatrix.in](https://tradermatrix.in) |
| 🧪 **Golden test suite** | 10/10 checks lock the compound math against live market numbers — run with `npm run verify` |

## 🚀 Tech Stack

- **Next.js 16** (App Router, static export) — React 19
- **TypeScript** — strict, typed end-to-end
- **Tailwind CSS 4** — theme tokens, dark-first design system
- **Framer Motion** — micro-interactions & celebrations
- **Firebase Auth** — optional Google sign-in
- **Vercel** — continuous deployment

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — all tools live in the sidebar: **Compound Calculator · Journal · Risk/Reward · Forex Guide · Settings**

### Quality gates

```bash
npm run lint      # ESLint
npm run build     # Production build (Turbopack, static export)
npm run verify    # Golden compound-math suite (10/10)
```

> 💡 Run `npm run verify` after any change to compound math or day-counting logic — the goldens (`1051.27`, `1036.26`, `2280.37`, `5020.00`…) are the source of truth.

## 📁 Project Structure

```
src/
├── app/                  # Next.js app router (page + layout)
├── components/
│   ├── CalculatorForm.tsx  # Compound inputs & scenarios
│   ├── ResultsPanel.tsx    # Cards, tables, TradesTarget, SYMBOLS mapping
│   ├── JournalView.tsx     # Trade journal with stores
│   ├── Landing.tsx         # Marketing page (features, FAQ, footer)
│   ├── AppShell.tsx        # Sidebar/hamburger shell + motivation modal
│   └── ...                 # RiskReward, ForexGuide, SettingsView, ui kit
├── lib/
│   ├── journal.ts          # localStorage-backed journal store
│   ├── settings.tsx        # Theme system (9 themes) + font scale
│   └── format.ts           # Currency & compact-money helpers (Lakh/Cr)
├── data/
│   └── quotes.ts           # Daily quote rotation (discipline/consistency/patience)
└── scripts/golden.mts      # Golden verification suite
```

## ⚖️ Disclaimer

TraderMatrix provides **illustrative projections only** — nothing here is financial advice. All calculations run locally in your browser; results are estimates, not guarantees.

---

<div align="center">

<sub>Built with ⚡ by [manish005](https://github.com/manish005) · Made for growing.</sub>

</div>