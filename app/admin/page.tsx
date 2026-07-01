"use client";

import Link from "next/link";
import { AlertTriangle, Boxes, ClipboardList, CreditCard, PackagePlus, ShoppingBag, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCatalog } from "@/hooks/useCatalog";
import { readOrders, type SavedOrder } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
      <p className="mt-1 text-sm text-neutral-500">{hint}</p>
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
  const { products } = useCatalog();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const activeProducts = products.filter((product) => product.status === "Active").length;
  const draftProducts = products.filter((product) => product.status === "Draft").length;
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.cost, 0);
  const lowStock = products.filter((product) => product.trackQuantity && product.stock <= product.reorderLevel).length;
  const paymentTotal = orders.reduce((sum, order) => sum + order.finalAmount, 0);

  useEffect(() => {
    function refreshOrders() {
      setOrders(readOrders());
    }

    refreshOrders();
    window.addEventListener("podscentra-orders-updated", refreshOrders);
    window.addEventListener("storage", refreshOrders);
    return () => {
      window.removeEventListener("podscentra-orders-updated", refreshOrders);
      window.removeEventListener("storage", refreshOrders);
    };
  }, []);

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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Products" value={String(products.length)} hint={`${activeProducts} active, ${draftProducts} draft`} />
          <StatCard label="Inventory value" value={formatCurrency(inventoryValue)} hint={`${lowStock} low-stock items`} />
          <StatCard label="Orders" value={String(orders.length)} hint={orders.length ? "Saved checkout orders" : "No orders yet"} />
          <StatCard label="Payments" value={formatCurrency(paymentTotal)} hint={paymentTotal ? "Grand total collected" : "No payments yet"} />
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
                      <p className="text-sm text-neutral-500">{product.category} · {product.stock} in stock</p>
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
            <EmptyPanel Icon={ClipboardList} title="No orders yet" text="Orders will appear here after customers checkout." />
            <EmptyPanel Icon={Users} title="No customers yet" text="Customer profiles will appear as orders come in." />
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
