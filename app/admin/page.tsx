"use client";

import Link from "next/link";
import { AlertTriangle, Boxes, ClipboardList, CreditCard, MousePointerClick, PackagePlus, ShoppingBag, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDateRangeSelector } from "@/components/admin/AdminDateRangeSelector";
import { AdminShell } from "@/components/admin/AdminShell";
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
  comparison: {}
};

function StatCard({ label, value, hint, Icon }: { label: string; value: string; hint: string; Icon?: LucideIcon }) {
  const CardIcon = Icon;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
          <p className="mt-1 text-sm text-neutral-500">{hint}</p>
        </div>
        {CardIcon ? (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100 text-neutral-700">
            <CardIcon size={19} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyPanel({ title, text, Icon }: { title: string; text: string; Icon: typeof ShoppingBag }) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 bg-white p-6 text-center">
      <Icon className="mx-auto text-neutral-400" size={30} />
      <h2 className="mt-3 text-base font-bold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{text}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const { products } = useCatalog();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>(emptyDashboardAnalytics);
  const queryString = searchParams.toString() || "range=7d";
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const draftProducts = products.filter((product) => product.status === "Draft").length;
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.cost, 0);
  const lowStock = products.filter((product) => product.trackQuantity && product.stock <= product.reorderLevel).length;
  const realOrders = orders.filter(isRealOrder);
  const paidOnlineTotal = realOrders
    .filter((order) => order.paymentMethod === "ONLINE" && order.paymentStatus === "Paid")
    .reduce((sum, order) => sum + order.finalAmount, 0);

  useEffect(() => {
    async function refreshOrders() {
      const response = await fetch(`/api/orders?${queryString}`, { cache: "no-store" });
      if (!response.ok) return;
      setOrders((await response.json()) as SavedOrder[]);
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

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Home</p>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <Link href="/admin/products/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
            <PackagePlus size={17} /> Add product
          </Link>
        </div>
        <div className="mt-5">
          <AdminDateRangeSelector />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard Icon={ShoppingBag} label="Products" value={String(products.length)} hint={`${activeProducts} active, ${draftProducts} draft`} />
          <StatCard Icon={Boxes} label="Inventory value" value={formatCurrency(inventoryValue)} hint={`${lowStock} low-stock items`} />
          <StatCard Icon={ClipboardList} label="Orders" value={String(realOrders.length)} hint={comparisonText(analytics.comparison.ordersCompleted) || "Confirmed orders only"} />
          <StatCard Icon={CreditCard} label="Payments" value={formatCurrency(paidOnlineTotal)} hint={paidOnlineTotal ? "Paid online payments" : "No paid online payments yet"} />
          <StatCard Icon={Users} label="Visitors" value={String(analytics.summary.totalVisitors)} hint={comparisonText(analytics.comparison.totalVisitors) || "Unique sessions"} />
          <StatCard Icon={MousePointerClick} label="Product views" value={String(analytics.summary.productViews)} hint={comparisonText(analytics.comparison.productViews) || "Product detail opens"} />
          <StatCard Icon={ShoppingBag} label="Add to carts" value={String(analytics.summary.addToCarts)} hint={comparisonText(analytics.comparison.addToCarts) || "Cart intent events"} />
          <StatCard Icon={MousePointerClick} label="Checkouts started" value={String(analytics.summary.checkoutStarted)} hint={comparisonText(analytics.comparison.checkoutStarted) || "Checkout sessions"} />
          <StatCard Icon={ShoppingBag} label="Abandoned checkouts" value={String(analytics.summary.abandonedCheckouts)} hint={comparisonText(analytics.comparison.abandonedCheckouts) || "Started or abandoned"} />
          <StatCard Icon={TrendingUp} label="Revenue" value={formatCurrency(analytics.summary.revenue)} hint={comparisonText(analytics.comparison.revenue) || "Confirmed order revenue"} />
          <StatCard Icon={TrendingUp} label="Conversion rate" value={`${analytics.summary.conversionRate.toFixed(1)}%`} hint="Orders / visitors" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Recent products</h2>
              <Link href="/admin/products" className="text-sm font-bold text-blue-700">View all</Link>
            </div>
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
              <div className="mt-4">
                <EmptyPanel Icon={ShoppingBag} title="No products yet" text="Create your first product to start selling on the storefront." />
              </div>
            )}
          </section>

          <div className="space-y-4">
            {realOrders.length ? (
              <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">Recent orders</h2>
                  <Link href="/admin/orders" className="text-sm font-bold text-blue-700">View all</Link>
                </div>
                <div className="mt-3 divide-y divide-black/10">
                  {realOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="py-3">
                      <p className="font-semibold">{order.customerName}</p>
                      <p className="text-xs text-neutral-500">{order.paymentMethod} - {order.paymentStatus} - {formatCurrency(order.finalAmount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyPanel Icon={ClipboardList} title="No orders yet" text="Orders will appear here after customers checkout." />
            )}
            <EmptyPanel Icon={Users} title={realOrders.length ? "Customers active" : "No customers yet"} text={realOrders.length ? "Customer profiles are being created from confirmed orders." : "Customer profiles will appear as orders come in."} />
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 text-amber-600" size={20} />
                <div>
                  <h2 className="font-bold">Inventory watch</h2>
                  <p className="mt-1 text-sm text-neutral-500">{lowStock ? `${lowStock} product needs attention.` : "No low-stock products right now."}</p>
                </div>
              </div>
            </div>
            <EmptyPanel Icon={CreditCard} title="No payment data" text="Payments will appear after live orders are placed." />
            <EmptyPanel Icon={Boxes} title="Inventory movements empty" text="Stock changes are tracked as products are edited." />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
