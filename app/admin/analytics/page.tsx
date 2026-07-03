"use client";

import { BarChart3, MousePointerClick, PackageSearch, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDateRangeSelector } from "@/components/admin/AdminDateRangeSelector";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader, AdminPanel, KpiCard, SimpleBarChart } from "@/components/admin/AdminWidgets";
import { formatCurrency } from "@/lib/utils";

type CountRow = { label: string; count: number };
type AnalyticsSummary = {
  totalVisitors: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  checkoutStarted: number;
  ordersCompleted: number;
  conversionRate: number;
  abandonedCheckouts: number;
  revenue: number;
};
type AnalyticsResponse = {
  summary: AnalyticsSummary;
  comparison: Partial<Record<keyof AnalyticsSummary, number>>;
  funnel: {
    cartToCheckoutRate: number;
    checkoutToPurchaseRate: number;
  };
  visitsByDay: Array<{ date: string; count: number }>;
  topTrafficSources: CountRow[];
  topPages: CountRow[];
  topProductsViewed: Array<{ productId: string; label: string; count: number }>;
  deviceBreakdown: CountRow[];
  browserBreakdown: CountRow[];
  countryBreakdown: CountRow[];
};

const emptyAnalytics: AnalyticsResponse = {
  summary: {
    totalVisitors: 0,
    pageViews: 0,
    productViews: 0,
    addToCarts: 0,
    checkoutStarted: 0,
    ordersCompleted: 0,
    conversionRate: 0,
    abandonedCheckouts: 0,
    revenue: 0
  },
  comparison: {},
  funnel: {
    cartToCheckoutRate: 0,
    checkoutToPurchaseRate: 0
  },
  visitsByDay: [],
  topTrafficSources: [],
  topPages: [],
  topProductsViewed: [],
  deviceBreakdown: [],
  browserBreakdown: [],
  countryBreakdown: []
};

function DataPanel({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <h2 className="font-bold">{title}</h2>
      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate text-neutral-600">{row.label}</span>
              <b>{row.count}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No data yet.</p>
      )}
    </section>
  );
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function comparisonText(value?: number) {
  if (typeof value !== "number") return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}% vs previous period`;
}

export default function AdminAnalyticsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<AnalyticsResponse>(emptyAnalytics);
  const [error, setError] = useState("");
  const queryString = searchParams.toString() || "range=7d";

  useEffect(() => {
    async function loadAnalytics() {
      const response = await fetch(`/api/admin/analytics?${queryString}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result) {
        setError("Analytics could not be loaded. Please log in again.");
        return;
      }

      setData(result as AnalyticsResponse);
    }

    void loadAnalytics();
  }, [queryString]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <AdminPageHeader eyebrow="Admin" title="Analytics" description="Realtime store behavior, traffic, funnels, top pages, products, searches, and collection performance." />
        <div className="mt-5">
          <AdminDateRangeSelector />
        </div>
        {error ? <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard Icon={Users} label="Realtime visitors" value={String(data.summary.totalVisitors)} hint={comparisonText(data.comparison.totalVisitors) || "Live users estimate"} />
          <KpiCard Icon={BarChart3} label="Page views" value={String(data.summary.pageViews)} hint={comparisonText(data.comparison.pageViews) || "Tracked route views"} />
          <KpiCard Icon={PackageSearch} label="Product views" value={String(data.summary.productViews)} hint={comparisonText(data.comparison.productViews) || "Product detail opens"} />
          <KpiCard Icon={ShoppingCart} label="Add to carts" value={String(data.summary.addToCarts)} hint={comparisonText(data.comparison.addToCarts) || "Cart intent events"} />
          <KpiCard Icon={MousePointerClick} label="Checkouts started" value={String(data.summary.checkoutStarted)} hint={comparisonText(data.comparison.checkoutStarted) || "Checkout sessions"} />
          <KpiCard Icon={TrendingUp} label="Orders completed" value={String(data.summary.ordersCompleted)} hint={comparisonText(data.comparison.ordersCompleted) || "Confirmed orders only"} />
          <KpiCard Icon={TrendingUp} label="Conversion rate" value={percent(data.summary.conversionRate)} hint="Orders / visitors" />
          <KpiCard Icon={ShoppingCart} label="Abandoned checkouts" value={String(data.summary.abandonedCheckouts)} hint={comparisonText(data.comparison.abandonedCheckouts) || "Started or abandoned"} />
          <KpiCard Icon={TrendingUp} label="Revenue" value={formatCurrency(data.summary.revenue)} hint={comparisonText(data.comparison.revenue) || "Confirmed order revenue"} />
          <KpiCard Icon={MousePointerClick} label="Bounce rate" value="0.0%" hint="Placeholder until exit tracking" />
          <KpiCard Icon={BarChart3} label="Session duration" value="0m 00s" hint="Placeholder until timing events" />
          <KpiCard Icon={TrendingUp} label="Live users" value={String(data.summary.totalVisitors)} hint="Selected range visitor base" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <AdminPanel title="Visitors by day"><SimpleBarChart rows={data.visitsByDay.map((row) => ({ label: row.date.slice(5), value: row.count }))} /></AdminPanel>
          <AdminPanel title="Traffic sources"><SimpleBarChart rows={data.topTrafficSources.map((row) => ({ label: row.label, value: row.count }))} /></AdminPanel>
          <AdminPanel title="Device breakdown"><SimpleBarChart rows={data.deviceBreakdown.map((row) => ({ label: row.label, value: row.count }))} /></AdminPanel>
          <AdminPanel title="Funnels"><SimpleBarChart rows={[{ label: "Cart -> Checkout", value: data.funnel.cartToCheckoutRate }, { label: "Checkout -> Buy", value: data.funnel.checkoutToPurchaseRate }, { label: "Visitors -> Buy", value: data.summary.conversionRate }]} /></AdminPanel>
          <DataPanel title="Top pages" rows={data.topPages} />
          <DataPanel title="Top products" rows={data.topProductsViewed.map((row) => ({ label: row.label, count: row.count }))} />
          <DataPanel title="Top search terms" rows={[]} />
          <DataPanel title="Top collections" rows={[]} />
          <AdminPanel title="Heatmap placeholder"><p className="rounded-lg border border-dashed border-black/10 p-8 text-center text-sm text-neutral-500">Heatmap capture can be connected here without changing the admin layout.</p></AdminPanel>
          <DataPanel title="Browser breakdown" rows={data.browserBreakdown} />
          <DataPanel title="Country / region" rows={data.countryBreakdown} />
        </div>
      </div>
    </AdminShell>
  );
}
