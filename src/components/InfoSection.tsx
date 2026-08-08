import type { ReactNode } from "react";

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id?: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-line bg-panel/60 p-6 sm:p-8"
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-mint">
        {kicker}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold text-ink">{title}</h2>
      <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export default function InfoSection() {
  return (
    <div className="mt-16 grid gap-6">
      <Section kicker="How it works" title="What is daily compound interest?">
        <p>
          With compound interest, the interest you earn is credited back to
          your balance, and the next interest payment is calculated on that
          larger balance. The more frequently interest is calculated and
          credited, the faster your money grows — which is why daily
          compounding beats monthly, quarterly or yearly compounding.
        </p>
        <p>
          You see this in two main places: <b className="text-ink">savings and
          investments</b> (savings accounts, CDs, money-market funds that post
          interest daily) and <b className="text-ink">trading with margin</b>{" "}
          (CFDs, forex, spread-betting and options, where the same daily
          compounding applies to both gains and losses). Margin trading is very
          high risk — you can lose more than your initial investment.
        </p>
        <p className="text-[13px] text-faint">
          TradeMetric is for illustration only and does not constitute financial
          advice. We don&apos;t offer investment opportunities or promise
          returns — please consult a qualified independent financial adviser.
        </p>
      </Section>

      <Section kicker="The mathematics" title="How to calculate daily compound interest">
        <p>The formula for a fixed daily interest rate is:</p>
        <div className="rounded-2xl border border-line bg-panel2 p-5 font-mono text-lg text-mint">
          A = P × (1 + r)
          <sup>t</sup>
        </div>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b className="text-ink">A</b> — future value of the investment
          </li>
          <li>
            <b className="text-ink">P</b> — principal amount
          </li>
          <li>
            <b className="text-ink">r</b> — daily interest rate (decimal, e.g.
            0.004 for 0.4%)
          </li>
          <li>
            <b className="text-ink">t</b> — number of days invested
          </li>
        </ul>
        <p>
          For an <strong className="text-ink">annual</strong> rate, the daily
          rate is <span className="font-mono text-ink">r/365</span>. With the
          TradeMetric reinvest rate, only your chosen percentage of each
          day&apos;s gain is kept compounding — the rest is paid out as cash.
        </p>
      </Section>

      <Section kicker="Tools & tips" title="Daily reinvest rate and weekdays">
        <p>
          Set the <strong className="text-ink">Daily reinvest rate</strong> to
          keep only part of each day&apos;s earnings in the pot. Example: with
          $5,000 at 0.5% daily, day one earns $25. Reinvesting 80% adds $20 to
          the balance ($5,020) and pays out $5 cash.
        </p>
        <p>
          Use <strong className="text-ink">“Include all days of week? No”</strong>{" "}
          to compound only on the weekdays you select — useful if you trade
          only on business days. The <strong className="text-ink">“Exclude
          U.S. holidays &amp; weekends”</strong> option filters federal
          holidays too.
        </p>
      </Section>

      <Section title="Formula &amp; methods" kicker="Transparency">
        <p>
          TradeMetric compounds day-by-day across the calendar from your start
          date to the end date (start + years, months &amp; days). Each
          included day: interest = balance × daily rate, then your reinvest %
          stays in and the rest is cashed out. Deposits are credited at the end
          of each period and start earning the following day. No cookies, no
          tracking — all math runs in your browser.
        </p>
      </Section>
    </div>
  );
}