"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  Icon,
  tone = "neutral"
}: {
  label: string;
  value: string;
  hint?: string;
  Icon?: LucideIcon;
  tone?: "neutral" | "green" | "amber" | "rose" | "blue";
}) {
  const toneClass = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700"
  }[tone];

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-neutral-950">{value}</p>
          {hint ? <p className="mt-1 text-sm text-neutral-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", toneClass)}>
            <Icon size={19} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminPanel({ title, children, action, className }: { title: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-black/10 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
        <h2 className="font-bold text-neutral-950">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SimpleBarChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="space-y-3">
      {rows.length ? rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[92px_1fr_56px] items-center gap-3 text-sm">
          <span className="truncate text-neutral-500">{row.label}</span>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-neutral-950" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
          </div>
          <b className="text-right">{row.value}</b>
        </div>
      )) : <p className="text-sm text-neutral-500">No data yet.</p>}
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "amber" | "rose" | "blue" }) {
  const toneClass = {
    neutral: "bg-neutral-100 text-neutral-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700"
  }[tone];

  return <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-bold", toneClass)}>{children}</span>;
}

export function BulkActionBar({ actions }: { actions: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
      {actions.map((action) => (
        <button key={action} type="button" className="min-h-9 rounded-lg border border-black/10 px-3 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50">
          {action}
        </button>
      ))}
    </div>
  );
}

export function Timeline({ items }: { items: Array<{ label: string; detail: string; done?: boolean }> }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="grid grid-cols-[24px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <span className={cn("h-3 w-3 rounded-full", item.done ? "bg-emerald-500" : "bg-neutral-300")} />
            {index < items.length - 1 ? <span className="mt-1 h-full w-px bg-neutral-200" /> : null}
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-950">{item.label}</p>
            <p className="text-xs leading-5 text-neutral-500">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-xl bg-white shadow-sm" />
      ))}
    </div>
  );
}
