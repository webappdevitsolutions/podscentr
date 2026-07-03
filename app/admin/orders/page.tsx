"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Printer, RefreshCw, Truck, X } from "lucide-react";
import { AdminDateRangeSelector } from "@/components/admin/AdminDateRangeSelector";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader, StatusPill, Timeline } from "@/components/admin/AdminWidgets";
import { type SavedOrder } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

const orderTabs = [
  { id: "real", label: "Orders" },
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "paid", label: "Paid" },
  { id: "cod", label: "COD" },
  { id: "pending", label: "Pending Payment" },
  { id: "failed", label: "Failed/Cancelled" }
];

const fulfillmentOptions = ["Unfulfilled", "Packed", "Shipped", "Out for Delivery", "Delivered", "Returned"];
const orderStatusOptions = ["Confirmed", "Cancelled", "Refunded"];
const paymentStatusOptions = ["COD_PENDING", "Paid", "Failed", "Refunded"];

function paymentTone(status: string) {
  if (status === "Paid") return "green" as const;
  if (status === "COD_PENDING" || status === "Pending") return "amber" as const;
  if (["Failed", "Refunded", "Cancelled"].includes(status)) return "rose" as const;
  return "neutral" as const;
}

function fulfillmentTone(status?: string) {
  if (status === "Delivered") return "green" as const;
  if (status === "Shipped" || status === "Out for Delivery") return "blue" as const;
  if (status === "Returned") return "rose" as const;
  return "amber" as const;
}

function orderStatusTone(status: string) {
  if (["Paid", "Confirmed", "Delivered"].includes(status)) return "green" as const;
  if (["Cancelled", "Refunded", "Returned"].includes(status)) return "rose" as const;
  return "neutral" as const;
}

function productSummary(order: SavedOrder) {
  const first = order.items[0];
  if (!first) return "No products";
  return order.items.length === 1 ? `${first.name} x ${first.quantity}` : `${first.name} + ${order.items.length - 1} more`;
}

function timelineItems(order: SavedOrder) {
  const fulfillment = order.fulfillmentStatus || "Unfulfilled";
  return [
    { label: "Order placed", detail: new Date(order.date).toLocaleString("en-IN"), done: true },
    { label: "Payment status", detail: order.paymentStatus, done: ["Paid", "COD_PENDING"].includes(order.paymentStatus) },
    { label: "Packed", detail: order.packedAt ? new Date(order.packedAt).toLocaleString("en-IN") : "Not packed yet", done: ["Packed", "Shipped", "Out for Delivery", "Delivered"].includes(fulfillment) },
    { label: "Shipped", detail: order.shippedAt ? new Date(order.shippedAt).toLocaleString("en-IN") : "Not shipped yet", done: ["Shipped", "Out for Delivery", "Delivered"].includes(fulfillment) },
    { label: "Out for delivery", detail: order.outForDeliveryAt ? new Date(order.outForDeliveryAt).toLocaleString("en-IN") : "Not out for delivery", done: ["Out for Delivery", "Delivered"].includes(fulfillment) },
    { label: "Delivered", detail: order.deliveredAt ? new Date(order.deliveredAt).toLocaleString("en-IN") : "Not delivered yet", done: fulfillment === "Delivered" },
    { label: "Returned / Cancelled", detail: order.cancelledAt || order.refundedAt ? new Date(order.cancelledAt || order.refundedAt || "").toLocaleString("en-IN") : "No return or cancellation", done: ["Cancelled", "Refunded", "Returned"].includes(order.orderStatus) }
  ];
}

function invoiceHtml(orders: SavedOrder[]) {
  const rows = orders
    .map((order) => `
      <section class="invoice">
        <header><img src="/img/podcentalogo.png" /><div><h1>Invoice</h1><p>${order.id}</p><p>${new Date(order.date).toLocaleString("en-IN")}</p></div></header>
        <div class="grid"><div><h3>Customer</h3><p>${order.customerName}</p><p>${order.customerMobile}</p><p>${order.customerEmail}</p></div><div><h3>Shipping address</h3><p>${order.fullAddress}</p></div></div>
        <table><thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
          ${order.items.map((item) => `<tr><td>${item.name}</td><td>${[item.size, item.color].filter(Boolean).join(" / ") || "-"}</td><td>${item.quantity}</td><td>₹${item.price}</td><td>₹${item.price * item.quantity}</td></tr>`).join("")}
        </tbody></table>
        <div class="totals"><p>Subtotal <b>₹${order.subtotal}</b></p><p>Delivery <b>₹${order.deliveryCharge}</b></p><p>Tax <b>₹${order.tax}</b></p><p>Discount <b>-₹${order.discount}</b></p><h2>Grand Total ₹${order.finalAmount}</h2><p>Payment: ${order.paymentMethod} / ${order.paymentStatus}</p></div>
      </section>
    `)
    .join("");
  return `<!doctype html><html><head><title>Podscentra invoices</title><style>body{font-family:Arial,sans-serif;color:#111}.invoice{page-break-after:always;padding:32px}header{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:16px}img{height:52px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:24px 0}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}.totals{margin-top:24px;margin-left:auto;max-width:320px}.totals p{display:flex;justify-content:space-between}</style></head><body>${rows}<script>window.print()</script></body></html>`;
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState("real");
  const [message, setMessage] = useState("");
  const [detailOrder, setDetailOrder] = useState<SavedOrder | null>(null);
  const queryString = searchParams.toString() || "range=7d";
  const selectedOrders = useMemo(() => orders.filter((order) => selectedIds.includes(order.id)), [orders, selectedIds]);

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams(queryString);
    params.set("view", view);
    const response = await fetch(`/api/admin/orders?${params.toString()}`, { cache: "no-store" });
    const result = await response.json().catch(() => []);
    if (response.ok && Array.isArray(result)) {
      setOrders(result as SavedOrder[]);
      setSelectedIds((current) => current.filter((id) => result.some((order: SavedOrder) => order.id === id)));
    } else {
      setMessage("Could not load orders. Please log in again.");
    }
  }, [queryString, view]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelectedIds((current) => (current.length === orders.length ? [] : orders.map((order) => order.id)));
  }

  async function updateOrder(id: string, updates: Record<string, string>) {
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const updated = await response.json().catch(() => null);
    if (!response.ok || !updated) {
      setMessage("Could not update order.");
      return;
    }
    setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
    setDetailOrder((current) => (current?.id === id ? updated : current));
  }

  async function bulkAction(action: "mark_shipped" | "cancel" | "refund" | "delete") {
    if (!selectedIds.length) {
      setMessage("Select at least one order first.");
      return;
    }
    const labels = { mark_shipped: "mark selected orders as shipped", cancel: "cancel selected orders", refund: "mark selected orders as refunded", delete: "delete selected orders" };
    if (action !== "mark_shipped" && !window.confirm(`Confirm: ${labels[action]}?`)) return;

    const response = await fetch("/api/admin/orders/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: selectedIds })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(result.error || "Bulk action failed.");
      return;
    }
    setMessage(`Updated ${result.updated || 0} order${result.updated === 1 ? "" : "s"}.`);
    await loadOrders();
  }

  function printInvoices() {
    if (!selectedOrders.length) {
      setMessage("Select at least one order to print invoices.");
      return;
    }
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      setMessage("Popup blocked. Allow popups to print invoices.");
      return;
    }
    popup.document.write(invoiceHtml(selectedOrders));
    popup.document.close();
  }

  async function exportCsv() {
    const params = new URLSearchParams(queryString);
    params.set("view", view);
    if (selectedIds.length) params.set("ids", selectedIds.join(","));
    const response = await fetch(`/api/admin/orders/export?${params.toString()}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "podscentra-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <AdminPageHeader eyebrow="Admin" title="Orders" description="Manage customer orders, products, fulfillment, payment status, invoices, CSV exports, and delivery details." />
        <div className="mt-5"><AdminDateRangeSelector /></div>
        {message ? <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{message}</p> : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {orderTabs.map((tab) => (
            <button key={tab.id} onClick={() => setView(tab.id)} className={`rounded-lg px-3 py-2 text-sm font-bold ${view === tab.id ? "bg-neutral-950 text-white" : "bg-white text-neutral-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
          <button onClick={printInvoices} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-bold"><Printer size={14} /> Print invoices</button>
          <button onClick={() => void bulkAction("mark_shipped")} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-bold"><Truck size={14} /> Mark shipped</button>
          <button onClick={() => void bulkAction("cancel")} className="min-h-9 rounded-lg border border-black/10 px-3 text-xs font-bold">Cancel</button>
          <button onClick={() => void bulkAction("refund")} className="min-h-9 rounded-lg border border-black/10 px-3 text-xs font-bold">Refund</button>
          <button onClick={exportCsv} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-bold"><Download size={14} /> Export CSV</button>
          <button onClick={() => void bulkAction("delete")} className="min-h-9 rounded-lg px-3 text-xs font-bold text-rose-600">Delete</button>
          <button onClick={() => void loadOrders()} className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/10 px-3 text-xs font-bold"><RefreshCw size={14} /> Refresh</button>
        </div>

        <section className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left text-sm">
              <thead className="sticky top-0 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" checked={orders.length > 0 && selectedIds.length === orders.length} onChange={toggleAll} className="h-4 w-4 accent-neutral-950" /></th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Shipping address</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelected(order.id)} className="h-4 w-4 accent-neutral-950" /></td>
                    <td className="px-4 py-3"><button onClick={() => setDetailOrder(order)} className="font-bold text-blue-700">{order.id}</button><p className="text-xs text-neutral-500">{new Date(order.date).toLocaleString("en-IN")}</p></td>
                    <td className="px-4 py-3"><b>{order.customerName || "Customer"}</b><p className="text-xs text-neutral-500">{order.customerMobile}</p><p className="text-xs text-neutral-500">{order.customerEmail}</p></td>
                    <td className="max-w-[260px] px-4 py-3 text-xs leading-5 text-neutral-600">{order.fullAddress || "No address"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={order.items[0]?.image || "/product-placeholder.svg"} alt="" className="h-11 w-11 rounded-lg object-cover" />
                        <div><p className="font-semibold">{productSummary(order)}</p><p className="text-xs text-neutral-500">{order.items.length} line item{order.items.length === 1 ? "" : "s"}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusPill tone={paymentTone(order.paymentStatus)}>{order.paymentStatus}</StatusPill><p className="mt-1 text-xs text-neutral-500">{order.paymentMethod} {order.paymentGateway ? `/${order.paymentGateway}` : ""}</p></td>
                    <td className="px-4 py-3"><StatusPill tone={fulfillmentTone(order.fulfillmentStatus)}>{order.fulfillmentStatus || "Unfulfilled"}</StatusPill></td>
                    <td className="px-4 py-3"><StatusPill tone={orderStatusTone(order.orderStatus)}>{order.orderStatus}</StatusPill></td>
                    <td className="px-4 py-3 text-right text-base font-black">{formatCurrency(order.finalAmount)}</td>
                    <td className="px-4 py-3"><button onClick={() => setDetailOrder(order)} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold hover:bg-white">View details</button></td>
                  </tr>
                ))}
                {!orders.length ? <tr><td colSpan={10} className="px-4 py-12 text-center text-neutral-500">No orders in this view.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        {detailOrder ? (
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setDetailOrder(null)}>
            <aside className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Order details</p><h2 className="mt-1 text-2xl font-bold">{detailOrder.id}</h2></div>
                <button onClick={() => setDetailOrder(null)} className="grid h-10 w-10 place-items-center rounded-lg border border-black/10"><X size={18} /></button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-black/10 p-4"><h3 className="font-bold">Customer info</h3><p className="mt-3 font-semibold">{detailOrder.customerName}</p><p className="text-sm text-neutral-500">{detailOrder.customerMobile}</p><p className="text-sm text-neutral-500">{detailOrder.customerEmail}</p></section>
                <section className="rounded-xl border border-black/10 p-4"><h3 className="font-bold">Shipping address</h3><p className="mt-3 text-sm leading-6 text-neutral-600">{detailOrder.fullAddress}</p><h4 className="mt-4 font-bold">Billing address</h4><p className="mt-1 text-sm text-neutral-500">Same as shipping address</p></section>
              </div>

              <section className="mt-4 rounded-xl border border-black/10 p-4">
                <h3 className="font-bold">Ordered products</h3>
                <div className="mt-4 divide-y divide-black/10">
                  {detailOrder.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[56px_1fr_auto] gap-3 py-3">
                      <img src={item.image || "/product-placeholder.svg"} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
                      <div><p className="font-semibold">{item.name}</p><p className="text-xs text-neutral-500">SKU: {item.sku || "N/A"} · Variant: {[item.size, item.color].filter(Boolean).join(" / ") || "Default"}</p><p className="text-xs text-neutral-500">Qty {item.quantity} · Unit {formatCurrency(item.price)}</p></div>
                      <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-black/10 p-4">
                  <h3 className="font-bold">Payment and totals</h3>
                  <div className="mt-3 space-y-2 text-sm"><p className="flex justify-between"><span>Subtotal</span><b>{formatCurrency(detailOrder.subtotal)}</b></p><p className="flex justify-between"><span>Delivery</span><b>{formatCurrency(detailOrder.deliveryCharge)}</b></p><p className="flex justify-between"><span>Discount</span><b>-{formatCurrency(detailOrder.discount)}</b></p><p className="flex justify-between"><span>Tax</span><b>{formatCurrency(detailOrder.tax)}</b></p><p className="flex justify-between border-t border-black/10 pt-2 text-base"><span>Grand total</span><b>{formatCurrency(detailOrder.finalAmount)}</b></p></div>
                  <p className="mt-4 text-sm text-neutral-500">Method: {detailOrder.paymentMethod} / {detailOrder.paymentGateway}</p><p className="text-xs text-neutral-500">Gateway order: {detailOrder.gatewayOrderId || "-"}</p><p className="text-xs text-neutral-500">Payment ID: {detailOrder.gatewayPaymentId || "-"}</p>
                </section>
                <section className="rounded-xl border border-black/10 p-4">
                  <h3 className="font-bold">Timeline</h3>
                  <div className="mt-4"><Timeline items={timelineItems(detailOrder)} /></div>
                </section>
              </div>

              <section className="mt-4 rounded-xl border border-black/10 p-4">
                <h3 className="font-bold">Update order</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm font-semibold">Fulfillment<select value={detailOrder.fulfillmentStatus || "Unfulfilled"} onChange={(event) => void updateOrder(detailOrder.id, { fulfillmentStatus: event.target.value })} className="min-h-10 rounded-lg border border-black/10 px-3">{fulfillmentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="grid gap-1 text-sm font-semibold">Order status<select value={["Confirmed", "Cancelled", "Refunded"].includes(detailOrder.orderStatus) ? detailOrder.orderStatus : "Confirmed"} onChange={(event) => void updateOrder(detailOrder.id, { orderStatus: event.target.value })} className="min-h-10 rounded-lg border border-black/10 px-3">{orderStatusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="grid gap-1 text-sm font-semibold">Payment status<select value={detailOrder.paymentStatus === "Paid" ? "Paid" : detailOrder.paymentStatus} onChange={(event) => void updateOrder(detailOrder.id, { paymentStatus: event.target.value })} className="min-h-10 rounded-lg border border-black/10 px-3">{paymentStatusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="grid gap-1 text-sm font-semibold">Courier<input value={detailOrder.courierName || ""} onChange={(event) => void updateOrder(detailOrder.id, { courierName: event.target.value })} className="min-h-10 rounded-lg border border-black/10 px-3" /></label>
                  <label className="grid gap-1 text-sm font-semibold">Tracking number<input value={detailOrder.trackingNumber || ""} onChange={(event) => void updateOrder(detailOrder.id, { trackingNumber: event.target.value })} className="min-h-10 rounded-lg border border-black/10 px-3" /></label>
                  <label className="grid gap-1 text-sm font-semibold md:col-span-3">Admin notes<textarea value={detailOrder.adminNotes || ""} onChange={(event) => void updateOrder(detailOrder.id, { adminNotes: event.target.value })} className="rounded-lg border border-black/10 p-3" /></label>
                </div>
              </section>
            </aside>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
