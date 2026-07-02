"use client";

import { useParams } from "next/navigation";
import { BarChart3, Boxes, ClipboardList, CreditCard, Download, FileText, Megaphone, Package, Settings, Store, Upload, Users } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCatalog } from "@/hooks/useCatalog";
import { type SavedOrder } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

const orderTabs = [
  { id: "real", label: "Real orders" },
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "paid", label: "Paid" },
  { id: "cod", label: "COD" },
  { id: "pending", label: "Pending Payment" },
  { id: "failed", label: "Failed/Cancelled" }
];

const sectionCopy: Record<string, { title: string; text: string; icon: typeof ClipboardList }> = {
  orders: { title: "Orders", text: "Orders will appear here after customers complete checkout.", icon: ClipboardList },
  collections: { title: "Collections", text: "Group products into collections once your catalog is ready.", icon: Package },
  inventory: { title: "Inventory", text: "Track stock levels from the product editor and product table.", icon: Boxes },
  "purchase-orders": { title: "Purchase orders", text: "Purchase orders will appear here when supplier buying is connected.", icon: ClipboardList },
  transfers: { title: "Transfers", text: "Inventory transfers between locations will appear here.", icon: Boxes },
  "gift-cards": { title: "Gift cards", text: "Gift card products and balances will appear here.", icon: CreditCard },
  customers: { title: "Customers", text: "Customer records will appear here after orders are placed.", icon: Users },
  content: { title: "Content", text: "Store pages, blog content, and media planning can live here.", icon: FileText },
  analytics: { title: "Analytics", text: "Sales and traffic reports will appear after live store activity.", icon: BarChart3 },
  marketing: { title: "Marketing", text: "Campaigns and promotions can be planned here.", icon: Megaphone },
  discounts: { title: "Discounts", text: "Discount codes and automatic discounts can be added later.", icon: CreditCard },
  "online-store": { title: "Online Store", text: "Active products are already published to the public storefront.", icon: Store },
  "point-of-sale": { title: "Point of Sale", text: "Point of Sale is ready as a publishing channel when needed.", icon: Store },
  apps: { title: "Apps", text: "Connected tools and integrations will appear here.", icon: Package },
  settings: { title: "Settings", text: "Store settings, staff access, and integrations can be expanded here.", icon: Settings },
  payments: { title: "Payments", text: "Payment records will appear after live orders are placed.", icon: CreditCard }
};

function slugToTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CatalogMigrationTools() {
  const { products, importProducts } = useCatalog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  function exportProducts() {
    const legacyCatalog = localStorage.getItem("podscentra-catalog-products");
    const exportProducts = legacyCatalog ? JSON.parse(legacyCatalog) : products;
    const blob = new Blob([JSON.stringify(exportProducts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalog-products.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(legacyCatalog ? "Exported legacy browser products JSON." : "Exported database products JSON.");
  }

  async function importProductsJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          setMessage("Import failed. The JSON file must contain an array of products.");
          return;
        }

        await importProducts(parsed);
        setMessage(`Imported ${parsed.length} product${parsed.length === 1 ? "" : "s"} into the database catalog.`);
      } catch {
        setMessage("Import failed. Check that the file is valid JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">Catalog migration</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        Products now live in the shared PostgreSQL catalog. Export old browser products if needed, then import the JSON here to save them into the database.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={exportProducts} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
          <Download size={16} /> Export products JSON
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-bold hover:bg-neutral-50">
          <Upload size={16} /> Import products JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={importProductsJson} className="hidden" />
      </div>
      {message ? <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{message}</p> : null}
    </section>
  );
}

function OrdersTable({ orders, filterLabel }: { orders: SavedOrder[]; filterLabel: string }) {
  if (!orders.length) {
    return (
      <section className="mt-6 rounded-xl border border-dashed border-black/15 bg-white p-8 text-center shadow-sm">
        <ClipboardList className="mx-auto text-neutral-400" size={36} />
        <h2 className="mt-4 text-lg font-bold">No {filterLabel.toLowerCase()} orders</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">Confirmed orders appear in the default view. Pending payment attempts stay separate.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-4">
        <h2 className="text-base font-bold">{filterLabel} orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Delivery Address</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Payment Method</th>
              <th className="px-4 py-3">Payment Status</th>
              <th className="px-4 py-3">Gateway IDs</th>
              <th className="px-4 py-3">Delivery Method</th>
              <th className="px-4 py-3">Delivery Charge</th>
              <th className="px-4 py-3">Order Status</th>
              <th className="px-4 py-3 text-right">Grand Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <p className="font-bold text-neutral-950">{order.id}</p>
                  <p className="text-xs text-neutral-500">{new Date(order.date).toLocaleString("en-IN")}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{order.customerName || "Customer"}</p>
                  <p className="text-xs text-neutral-500">{order.customerMobile || "No mobile"}</p>
                  <p className="text-xs text-neutral-500">{order.customerEmail || "No email"}</p>
                </td>
                <td className="max-w-[240px] px-4 py-3 text-xs leading-5 text-neutral-600">{order.fullAddress || "No address"}</td>
                <td className="px-4 py-3">
                  <div className="grid gap-1">
                    {order.items.map((item) => (
                      <p key={item.id} className="text-xs text-neutral-600">
                        {item.name} x {item.quantity}{item.size ? ` · ${item.size}` : ""}
                      </p>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{order.paymentMethod}</td>
                <td className="px-4 py-3 font-semibold">{order.paymentStatus}</td>
                <td className="max-w-[180px] px-4 py-3 text-xs text-neutral-500">
                  <p>{order.gatewayOrderId || "-"}</p>
                  <p>{order.gatewayPaymentId || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{order.deliveryMethod}</p>
                  <p className="text-xs text-neutral-500">{order.deliveryTime}</p>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(order.deliveryCharge)}</td>
                <td className="px-4 py-3 font-semibold">{order.orderStatus}</td>
                <td className="px-4 py-3 text-right text-base font-black">{formatCurrency(order.finalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminSectionPage() {
  const params = useParams<{ section: string }>();
  const section = params.section;
  const copy = sectionCopy[section] || { title: slugToTitle(section), text: "This admin section is ready to be expanded.", icon: Package };
  const Icon = copy.icon;
  const { products } = useCatalog();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState("real");
  const [cleanupMessage, setCleanupMessage] = useState("");
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.cost, 0);
  const selectedOrderFilter = orderTabs.find((tab) => tab.id === orderFilter) || orderTabs[0];

  useEffect(() => {
    async function refreshOrders() {
      const response = await fetch(`/api/orders?view=${encodeURIComponent(orderFilter)}`, { cache: "no-store" });
      if (!response.ok) return;
      setOrders((await response.json()) as SavedOrder[]);
    }

    void refreshOrders();
  }, [orderFilter]);

  async function cleanupPendingOrders() {
    setCleanupMessage("");
    const response = await fetch("/api/orders?cleanup=pending", { method: "DELETE" });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setCleanupMessage(result.error || "Could not clean pending payment records.");
      return;
    }

    setCleanupMessage(`Marked ${result.cleaned || 0} abandoned pending payment record${result.cleaned === 1 ? "" : "s"} as cancelled.`);
    const refreshed = await fetch(`/api/orders?view=${encodeURIComponent(orderFilter)}`, { cache: "no-store" });
    if (refreshed.ok) setOrders((await refreshed.json()) as SavedOrder[]);
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <p className="text-sm font-semibold text-neutral-500">Admin</p>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        {section === "orders" ? (
          <>
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {orderTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderFilter(tab.id)}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                      orderFilter === tab.id ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">Default view shows only confirmed, paid, and COD orders.</p>
                <button
                  type="button"
                  onClick={cleanupPendingOrders}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-black/10 px-4 text-sm font-bold hover:bg-neutral-50"
                >
                  Clean old pending payments
                </button>
              </div>
              {cleanupMessage ? <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{cleanupMessage}</p> : null}
            </div>
            <OrdersTable orders={orders} filterLabel={selectedOrderFilter.label} />
          </>
        ) : null}
        {section === "settings" ? <CatalogMigrationTools /> : null}
        {section !== "orders" && section !== "settings" ? (
        <section className="mt-6 rounded-xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <Icon className="mx-auto text-neutral-400" size={36} />
          <h2 className="mt-4 text-lg font-bold">{copy.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{copy.text}</p>
        </section>
        ) : null}
        {section === "inventory" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-neutral-500">Products tracked</p>
              <p className="mt-2 text-2xl font-bold">{products.length}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-neutral-500">Inventory value</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(inventoryValue)}</p>
            </div>
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-neutral-500">Low stock</p>
              <p className="mt-2 text-2xl font-bold">{products.filter((product) => product.stock <= product.reorderLevel).length}</p>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
