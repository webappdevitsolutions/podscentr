"use client";

import { BarChart3, MousePointerClick, PackageSearch, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatCurrency } from "@/lib/utils";

type CountRow = { label: string; count: number };
type AnalyticsResponse = {
  summary: {
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

function StatCard({ label, value, hint, Icon }: { label: string; value: string; hint: string; Icon: typeof Users }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
          <p className="mt-1 text-sm text-neutral-500">{hint}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100 text-neutral-700">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

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

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse>(emptyAnalytics);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result) {
        setError("Analytics could not be loaded. Please log in again.");
        return;
      }

      setData(result as AnalyticsResponse);
    }

    void loadAnalytics();
  }, []);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <p className="text-sm font-semibold text-neutral-500">Admin</p>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        {error ? <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard Icon={Users} label="Total visitors" value={String(data.summary.totalVisitors)} hint="Unique sessions, 30 days" />
          <StatCard Icon={BarChart3} label="Page views" value={String(data.summary.pageViews)} hint="Tracked route views" />
          <StatCard Icon={PackageSearch} label="Product views" value={String(data.summary.productViews)} hint="Product detail opens" />
          <StatCard Icon={ShoppingCart} label="Add to carts" value={String(data.summary.addToCarts)} hint="Cart intent events" />
          <StatCard Icon={MousePointerClick} label="Checkout started" value={String(data.summary.checkoutStarted)} hint="Checkout sessions" />
          <StatCard Icon={TrendingUp} label="Orders completed" value={String(data.summary.ordersCompleted)} hint="Confirmed orders only" />
          <StatCard Icon={TrendingUp} label="Conversion rate" value={percent(data.summary.conversionRate)} hint="Orders / visitors" />
          <StatCard Icon={ShoppingCart} label="Abandoned checkouts" value={String(data.summary.abandonedCheckouts)} hint="Started or abandoned" />
          <StatCard Icon={TrendingUp} label="Revenue" value={formatCurrency(data.summary.revenue)} hint="Confirmed order revenue" />
          <StatCard Icon={MousePointerClick} label="Cart to checkout" value={percent(data.funnel.cartToCheckoutRate)} hint="Checkout / add-to-cart" />
          <StatCard Icon={TrendingUp} label="Checkout to purchase" value={percent(data.funnel.checkoutToPurchaseRate)} hint="Purchase / checkout" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <DataPanel title="Visits by day" rows={data.visitsByDay.map((row) => ({ label: row.date, count: row.count }))} />
          <DataPanel title="Top traffic sources" rows={data.topTrafficSources} />
          <DataPanel title="Top pages" rows={data.topPages} />
          <DataPanel title="Top products viewed" rows={data.topProductsViewed.map((row) => ({ label: row.label, count: row.count }))} />
          <DataPanel title="Device breakdown" rows={data.deviceBreakdown} />
          <DataPanel title="Browser breakdown" rows={data.browserBreakdown} />
          <DataPanel title="Country / region" rows={data.countryBreakdown} />
        </div>
      </div>
    </AdminShell>
  );
}
