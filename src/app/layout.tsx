import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.tradermatrix.in"),
  title: {
    default:
      "Daily Compound Interest Calculator & Forex Tools India | TraderMatrix",
    template: "%s | TraderMatrix",
  },
  description:
    "Free compound interest calculator with daily compounding — project money day-by-day with reinvest rate control, plus forex pip value, lot size, margin and risk reward calculators and forex market hours in IST for Indian traders. No sign-up needed.",
  keywords: [
    "compound interest calculator",
    "compound interest calculator India",
    "daily compound interest calculator",
    "daily compound interest calculator India",
    "daily compounding calculator",
    "daily interest calculator",
    "daily profit calculator",
    "compounding calculator",
    "compound interest calculator daily reinvest",
    "compound interest calculator formula",
    "forex pip value calculator",
    "pip value calculator USD to INR",
    "forex lot size calculator",
    "position size calculator MT4",
    "margin calculator forex",
    "risk reward ratio calculator",
    "forex market hours IST",
    "London session time in India",
    "New York session trading time in IST",
    "best time to trade forex in India IST",
  ],
  applicationName: "TraderMatrix",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://www.tradermatrix.in",
    siteName: "TraderMatrix",
    title: "Daily Compound Interest Calculator & Forex Tools India | TraderMatrix",
    description:
      "Project your money daily with a free compound interest calculator and daily compounding math — plus pip, lot size, margin and risk reward calculators, and forex market hours in IST.",
  },
  twitter: {
    card: "summary",
    title: "TraderMatrix — Daily Compound Interest Calculator & Forex Tools",
    description:
      "Free compound interest calculator with daily compounding + forex pip, lot size, margin and risk reward tools with market hours in IST.",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "TraderMatrix",
                url: "https://www.tradermatrix.in",
                applicationCategory: "FinanceApplication",
                operatingSystem: "Web",
                description:
                  "Free daily compound interest calculator with reinvestment control, plus forex pip value, lot size, margin and risk reward calculators for Indian traders.",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "5",
                  reviewCount: "10",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Is TraderMatrix free?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes — completely free forever. No credit card, no trial clock, no paywall. Every calculator, table and export is unlocked.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is a compound interest calculator?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "A compound interest calculator works out how a balance grows when earned interest is added back to the principal and itself earns interest. TraderMatrix is a free compound interest calculator that compounds day-by-day: set the daily return, reinvest rate and trading days, and it shows the full amortization table plus year-level totals. At 1% daily on ₹10,000 with full reinvestment over 260 trading days, the balance grows to over ₹1.3 lakh because each day's profit earns profit the next day.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is the difference between daily compounding and simple interest?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "With simple interest, only the original principal earns interest. With daily compounding — also called daily interest or daily compounding — every day's profit is added to the balance, so it starts earning profit too. The TraderMatrix daily compounding calculator lets you control the reinvest rate, so you can compare a simple-interest projection against full daily compounding side by side.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is my data private?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "All calculations run locally in your browser and nothing is uploaded. Optional Google sign-in exists only so TraderMatrix remembers your saved workspace — we never store or sell your numbers.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Why do my results not match a simple annual formula?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Because TraderMatrix compounds day-by-day instead of annually. The golden-test suite is locked to real market day counts (365, 260 business days), so your numbers match what daily reinvestment actually produces.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Can I include deposits, withdrawals and top-ups?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. Schedule recurring deposits and percentage-based withdrawals weekly, bi-weekly or monthly, and add one-time top-ups at any compounding step — the amortization table shows every row.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Does it handle weekends and holidays?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. Exclude weekends, pick your own trading days, or skip U.S. market holidays. Trading-day counts are shown alongside calendar days.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "How do I calculate daily compound interest manually?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Multiply your balance by the daily return, add reinvested profit to the balance, and repeat for every day. For example 1000 at 1% daily: day 1 = 1010, day 2 = 1020.10, day 3 = 1030.30. The TraderMatrix calculator runs this exact day-by-day math for any rate, deposit or withdrawal plan.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What is a pip and how do I calculate pip value in INR?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Forex pairs quote in pips — the decimal change in price. Pip value depends on lot size and pair; for Indian traders the pip value in INR is converted from the quote currency at the live USD/INR rate. TraderMatrix computes pip value for EURUSD, GBPUSD, USDJPY, gold and more per point size.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Is the daily compounding calculator financial advice?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. TraderMatrix produces illustrative projections only — it is a planning tool, not a recommendation. Nothing here is financial advice.",
                    },
                  },
                ],
              },
            ]),
          }}
        />
      </body>
    </html>
  );
}
