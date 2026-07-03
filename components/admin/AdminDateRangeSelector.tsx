"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const presets = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "This month", value: "this_month" },
  { label: "Last month", value: "last_month" },
  { label: "Custom", value: "custom" }
];

function todayInput() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";
  return `${year}-${month}-${day}`;
}

export function AdminDateRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRange = searchParams.get("range") || (searchParams.get("from") || searchParams.get("to") ? "custom" : "7d");
  const [from, setFrom] = useState(searchParams.get("from") || todayInput());
  const [to, setTo] = useState(searchParams.get("to") || todayInput());
  const activeLabel = useMemo(() => presets.find((preset) => preset.value === activeRange)?.label || "Last 7 days", [activeRange]);

  function applyPreset(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    params.set("range", value);

    if (value === "custom") {
      params.set("from", from);
      params.set("to", to);
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustom() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Date range</p>
          <p className="mt-1 text-sm font-semibold text-neutral-700">{activeLabel} - Asia/Kolkata</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => applyPreset(preset.value)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                activeRange === preset.value ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      {activeRange === "custom" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-1 text-sm font-semibold text-neutral-700">
            From
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="min-h-10 rounded-lg border border-black/10 px-3" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-neutral-700">
            To
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="min-h-10 rounded-lg border border-black/10 px-3" />
          </label>
          <button type="button" onClick={applyCustom} className="self-end rounded-lg bg-neutral-950 px-4 py-2 text-sm font-bold text-white">
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
