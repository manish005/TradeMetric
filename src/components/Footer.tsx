import { TradeMetricLogo } from "@/components/Header";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-panel/60">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <TradeMetricLogo />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
            Free daily compound interest and projection calculator. Built for
            savers, investors and traders who want to understand where their
            money can go.
          </p>
        </div>
        <div className="text-[13px] text-muted">
          <h3 className="mb-3 text-sm font-bold text-ink">Disclaimer</h3>
          <p className="leading-relaxed">
            Whilst every effort has been made in building TradeMetric, we are not
            to be held liable for any damages or monetary losses arising from
            its use. TradeMetric provides projections for illustrative purposes
            only — nothing here is financial advice.
          </p>
        </div>
        <div className="text-[13px] text-muted">
          <h3 className="mb-3 text-sm font-bold text-ink">Trade &amp; privacy</h3>
          <p className="leading-relaxed">
            All calculations run locally in your browser — your numbers never
            leave your device. Optional Google sign-in is used only to
            recognise you; we never track or sell your data.
          </p>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-[12px] text-faint">
        © {new Date().getFullYear()} TradeMetric — Made for growing.
      </div>
    </footer>
  );
}