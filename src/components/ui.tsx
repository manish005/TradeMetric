"use client";

import { useState, type ReactNode } from "react";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint}
    </div>
  );
}

export function InfoTip({
  text,
  title = "More info",
}: {
  text: string;
  title?: string;
}) {
  return (
    <HelpToggle title={title}>
      <p className="text-[13px] leading-relaxed text-muted">{text}</p>
    </HelpToggle>
  );
}

export function HelpToggle({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={title}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="ml-1 inline-flex h-[18px] w-[18px] shrink-0 translate-y-[-1px] items-center justify-center rounded-full border border-line2 bg-panel2 text-[11px] font-bold text-muted transition-colors hover:border-mint hover:text-mint"
      >
        ?
      </button>
      {open && (
        <div className="animate-rise mt-2 rounded-xl border border-line bg-panel2 p-3.5">
          {children}
        </div>
      )}
    </>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
  min,
  step,
  prefix,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  step?: string;
  prefix?: string;
  suffix?: ReactNode;
}) {
  return (
    <div className="relative flex w-full items-center">
      {prefix && (
        <span className="pointer-events-none absolute left-3 text-sm font-semibold text-muted">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value === 0 && value !== undefined ? "" : value}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" || raw === "-") {
            onChange(0);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        className={`h-11 min-w-0 w-full rounded-xl border border-line bg-panel2 px-3 text-[15px] text-ink outline-none transition-colors placeholder:text-faint focus:border-mint/70 focus:ring-2 focus:ring-mint/20 ${
          prefix ? "pl-8" : ""
        } ${className}`}
      />
      {suffix}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: Array<{ value: T; label: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-stretch overflow-hidden rounded-xl border border-line bg-panel2 p-1 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex min-w-9 flex-1 items-center justify-center rounded-[10px] px-2.5 py-2 text-sm font-semibold transition-all ${
              active
                ? "bg-mint/15 text-mint shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]"
                : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 flex-1 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
        active
          ? "border-mint/50 bg-mint/15 text-mint"
          : "border-line text-muted hover:border-line2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Select({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 rounded-xl border border-line bg-panel2 px-3 text-[14px] text-ink outline-none transition-colors focus:border-mint/70 [&>option]:bg-panel2 ${className}`}
    >
      {children}
    </select>
  );
}