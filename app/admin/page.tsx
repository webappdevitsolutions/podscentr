"use client";

import Link from "next/link";
import { AlertTriangle, Boxes, ClipboardList, CreditCard, PackagePlus, Repeat, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminDateRangeSelector } from "@/components/admin/AdminDateRangeSelector";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader, AdminPanel, KpiCard, SimpleBarChart, SkeletonGrid } from "@/components/admin/AdminWidgets";
import { useCatalog } from "@/hooks/useCatalog";
import { isRealOrder, type SavedOrder } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

type DashboardAnalytics = {
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
  comparison: Partial<Record<string, number>>;
  visitsByDay?: Array<{ date: string; count: number }>;
  deviceBreakdown?: Array<{ label: string; count: number }>;
  topTrafficSources?: Array<{ label: string; count: number }>;
  topProductsViewed?: Array<{ productId: string; label: string; count: number }>;
};

const emptyDashboardAnalytics: DashboardAnalytics = {
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
  visitsByDay: [],
  deviceBreakdown: [],
  topTrafficSources: [],
  topProductsViewed: []
};

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const { products } = useCatalog();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [todayOrders, setTodayOrders] = useState<SavedOrder[]>([]);
  const [monthOrders, setMonthOrders] = useState<SavedOrder[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(emptyDashboardAnalytics);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const queryString = searchParams.toString() || "range=7d";
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const draftProducts = products.filter((product) => product.status === "Draft").length;
  const lowStock = products.filter((product) => product.trackQuantity && product.stock <= product.reorderLevel).length;
  const outOfStock = products.filter((product) => product.trackQuantity && product.stock <= 0).length;
  const realOrders = orders.filter(isRealOrder);
  const realTodayOrders = todayOrders.filter(isRealOrder);
  const realMonthOrders = monthOrders.filter(isRealOrder);
  const revenueToday = realTodayOrders.reduce((sum, order) => sum + order.finalAmount, 0);
  const revenueMonth = realMonthOrders.reduce((sum, order) => sum + order.finalAmount, 0);
  const averageOrderValue = realOrders.length ? realOrders.reduce((sum, order) => sum + order.finalAmount, 0) / realOrders.length : 0;
  const pendingOrders = orders.filter((order) => order.paymentStatus === "Pending" || order.orderStatus === "New").length;
  const returningCustomers = new Set(realOrders.map((order) => order.customerEmail).filter(Boolean)).size;
  useEffect(() => {
    async function refreshOrders() {
      setIsDashboardLoading(true);
      const [rangeResponse, todayResponse, monthResponse] = await Promise.all([
        fetch(`/api/orders?${queryString}`, { cache: "no-store" }),
        fetch("/api/orders?range=today", { cache: "no-store" }),
        fetch("/api/orders?range=this_month", { cache: "no-store" })
      ]);
      if (rangeResponse.ok) setOrders((await rangeResponse.json()) as SavedOrder[]);
      if (todayResponse.ok) setTodayOrders((await todayResponse.json()) as SavedOrder[]);
      if (monthResponse.ok) setMonthOrders((await monthResponse.json()) as SavedOrder[]);
      setIsDashboardLoading(false);
    }

    void refreshOrders();
  }, [queryString]);

  useEffect(() => {
    async function refreshAnalytics() {
      const response = await fetch(`/api/admin/analytics?${queryString}`, { cache: "no-store" });
      if (!response.ok) return;
      setAnalytics((await response.json()) as DashboardAnalytics);
    }

    void refreshAnalytics();
  }, [queryString]);

  function comparisonText(value?: number) {
    if (typeof value !== "number") return "";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}% vs previous period`;
  }

  const ordersByDay = useMemo(() => {
    const map = new Map<string, number>();
    realOrders.forEach((order) => {
      const key = new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].slice(-10).map(([label, value]) => ({ label, value }));
  }, [realOrders]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    realOrders.forEach((order) => {
      const key = new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map.set(key, (map.get(key) || 0) + order.finalAmount);
    });
    return [...map.entries()].slice(-10).map(([label, value]) => ({ label, value: Math.round(value) }));
  }, [realOrders]);

  const bestSellingProducts = useMemo(() => {
    const map = new Map<string, number>();
    realOrders.flatMap((order) => order.items).forEach((item) => {
      map.set(item.name, (map.get(item.name) || 0) + item.quantity);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
  }, [realOrders]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <AdminPageHeader
          eyebrow="Home"
          title="Dashboard"
          description="Realtime storefront health, operations, revenue, inventory, and conversion signals."
          action={
          <Link href="/admin/products/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
            <PackagePlus size={17} /> Add product
          </Link>
          }
        />
        <div className="mt-5">
          <AdminDateRangeSelector />
        </div>

        {isDashboardLoading ? <div className="mt-6"><SkeletonGrid /></div> : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard Icon={TrendingUp} tone="green" label="Revenue Today" value={formatCurrency(revenueToday)} hint={`${realTodayOrders.length} orders today`} />
          <KpiCard Icon={TrendingUp} tone="green" label="Revenue This Month" value={formatCurrency(revenueMonth)} hint={`${realMonthOrders.length} orders this month`} />
          <KpiCard Icon={ClipboardList} label="Orders Today" value={String(realTodayOrders.length)} hint="Confirmed, paid, COD" />
          <KpiCard Icon={ClipboardList} label="Orders This Month" value={String(realMonthOrders.length)} hint={comparisonText(analytics.comparison.ordersCompleted) || "Month to date"} />
          <KpiCard Icon={CreditCard} tone="blue" label="Average Order Value" value={formatCurrency(averageOrderValue)} hint="AOV for selected range" />
          <KpiCard Icon={TrendingUp} label="Conversion Rate" value={`${analytics.summary.conversionRate.toFixed(1)}%`} hint="Orders / visitors" />
          <KpiCard Icon={Users} label="Visitors" value={String(analytics.summary.totalVisitors)} hint={comparisonText(analytics.comparison.totalVisitors) || "Unique sessions"} />
          <KpiCard Icon={Repeat} label="Returning Customers" value={String(returningCustomers)} hint="Repeat customer emails" />
          <KpiCard Icon={Boxes} tone={lowStock ? "amber" : "neutral"} label="Products Low in Stock" value={String(lowStock)} hint={`${outOfStock} out of stock`} />
          <KpiCard Icon={ClipboardList} tone={pendingOrders ? "amber" : "neutral"} label="Pending Orders" value={String(pendingOrders)} hint="Needs attention" />
          <KpiCard Icon={ShoppingBag} tone={analytics.summary.abandonedCheckouts ? "rose" : "neutral"} label="Abandoned Checkouts" value={String(analytics.summary.abandonedCheckouts)} hint={comparisonText(analytics.comparison.abandonedCheckouts) || "Started or abandoned"} />
          <KpiCard Icon={ShoppingBag} label="Products" value={String(products.length)} hint={`${activeProducts} active, ${draftProducts} draft`} />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <AdminPanel title="Sales" action={<span className="text-xs font-bold text-neutral-500">7d / 30d / 90d / custom</span>}>
            <SimpleBarChart rows={revenueByDay} />
          </AdminPanel>
          <AdminPanel title="Orders by day">
            <SimpleBarChart rows={ordersByDay} />
          </AdminPanel>
          <AdminPanel title="Visitors by day">
            <SimpleBarChart rows={(analytics.visitsByDay || []).slice(-8).map((row) => ({ label: row.date.slice(5), value: row.count }))} />
          </AdminPanel>
          <AdminPanel title="Device breakdown">
            <SimpleBarChart rows={(analytics.deviceBreakdown || []).map((row) => ({ label: row.label, value: row.count }))} />
          </AdminPanel>
          <AdminPanel title="Traffic sources">
            <SimpleBarChart rows={(analytics.topTrafficSources || []).map((row) => ({ label: row.label, value: row.count }))} />
          </AdminPanel>
          <AdminPanel title="Best selling products">
            <SimpleBarChart rows={bestSellingProducts} />
          </AdminPanel>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <AdminPanel title="Recent products" action={<Link href="/admin/products" className="text-sm font-bold text-blue-700">View all</Link>}>
            {products.length ? (
              <div className="mt-4 divide-y divide-black/10">
                {products.slice(0, 6).map((product) => (
                  <Link key={product.id} href={`/admin/products/${product.id}/edit`} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 py-3">
                    <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-neutral-500">{product.category} - {product.stock} in stock</p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">{product.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-black/10 p-8 text-center text-sm text-neutral-500">Create your first product to start selling on the storefront.</p>
            )}
          </AdminPanel>

          <div className="space-y-4">
            {realOrders.length ? (
              <AdminPanel title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-bold text-blue-700">View all</Link>}>
                <div className="mt-3 divide-y divide-black/10">
                  {realOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="py-3">
                      <p className="font-semibold">{order.customerName}</p>
                      <p className="text-xs text-neutral-500">{order.paymentMethod} - {order.paymentStatus} - {formatCurrency(order.finalAmount)}</p>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            ) : (
              <AdminPanel title="Recent orders"><p className="text-sm text-neutral-500">Orders will appear here after customers checkout.</p></AdminPanel>
            )}
            <AdminPanel title="Inventory watch">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 text-amber-600" size={20} />
                <p className="text-sm text-neutral-500">{lowStock ? `${lowStock} product needs attention.` : "No low-stock products right now."}</p>
              </div>
            </AdminPanel>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
