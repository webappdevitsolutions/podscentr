"use client";

import { Clipboard, RefreshCw, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminDateRangeSelector } from "@/components/admin/AdminDateRangeSelector";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatCurrency } from "@/lib/utils";

type CheckoutItem = {
  name?: string;
  quantity?: number;
  price?: number;
  size?: string;
  color?: string;
};

type AbandonedCheckoutRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CheckoutItem[];
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
  status: "STARTED" | "ABANDONED" | "RECOVERED" | "CONVERTED";
  checkoutStartedAt: string;
  lastActivityAt: string;
  convertedOrderId?: string;
};

function itemSummary(items: CheckoutItem[]) {
  if (!Array.isArray(items) || !items.length) return "No items";
  return items
    .slice(0, 3)
    .map((item) => `${item.name || "Product"} x ${item.quantity || 1}`)
    .join(", ");
}

export default function AdminAbandonedCheckoutsPage() {
  const searchParams = useSearchParams();
  const [checkouts, setCheckouts] = useState<AbandonedCheckoutRow[]>([]);
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const queryString = searchParams.toString() || "range=7d";

  const loadCheckouts = useCallback(async (nextStatus = status) => {
    const params = new URLSearchParams(queryString);
    params.set("status", nextStatus);
    const response = await fetch(`/api/admin/abandoned-checkouts?${params.toString()}`, { cache: "no-store" });
    const result = await response.json().catch(() => null);

    if (!response.ok || !Array.isArray(result)) {
      setMessage("Could not load abandoned checkouts. Please log in again.");
      return;
    }

    setCheckouts(result as AbandonedCheckoutRow[]);
  }, [queryString, status]);

  useEffect(() => {
    void loadCheckouts(status);
  }, [loadCheckouts, status]);

  async function cleanupOldStarted() {
    const response = await fetch("/api/admin/abandoned-checkouts", { method: "POST" });
    const result = await response.json().catch(() => ({}));
    setMessage(`Marked ${result.updated || 0} old checkout${result.updated === 1 ? "" : "s"} as abandoned.`);
    await loadCheckouts();
  }

  async function markRecovered(id: string) {
    await fetch(`/api/admin/abandoned-checkouts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-recovered" })
    });
    setMessage("Checkout marked recovered.");
    await loadCheckouts();
  }

  async function deleteCheckout(id: string) {
    await fetch(`/api/admin/abandoned-checkouts/${encodeURIComponent(id)}`, { method: "DELETE" });
    setMessage("Checkout deleted.");
    await loadCheckouts();
  }

  async function copyRecovery(row: AbandonedCheckoutRow) {
    const text = `Hi, you left items in your Podscentra cart. Complete your order here: https://podscentr.vercel.app/cart`;
    await navigator.clipboard.writeText(text);
    setMessage(row.customerPhone ? `Recovery message copied for ${row.customerPhone}.` : "Recovery message copied.");
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Admin</p>
            <h1 className="text-2xl font-bold tracking-tight">Abandoned Checkouts</h1>
          </div>
          <button onClick={cleanupOldStarted} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
            <RefreshCw size={16} /> Mark old started as abandoned
          </button>
        </div>
        <div className="mt-5">
          <AdminDateRangeSelector />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["all", "STARTED", "ABANDONED", "RECOVERED", "CONVERTED"].map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${status === item ? "bg-neutral-950 text-white" : "bg-white text-neutral-700"}`}
            >
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>

        {message ? <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{message}</p> : null}

        <section className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Last activity</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {checkouts.map((checkout) => (
                  <tr key={checkout.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold">{checkout.customerName || "Unknown"}</td>
                    <td className="px-4 py-3">{checkout.customerPhone || "-"}</td>
                    <td className="px-4 py-3">{checkout.customerEmail || "-"}</td>
                    <td className="max-w-[320px] px-4 py-3 text-xs leading-5 text-neutral-600">{itemSummary(checkout.items)}</td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(checkout.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">{checkout.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(checkout.checkoutStartedAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(checkout.lastActivityAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => copyRecovery(checkout)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 px-3 text-xs font-bold hover:bg-neutral-50">
                          <Clipboard size={14} /> Copy
                        </button>
                        <button onClick={() => markRecovered(checkout.id)} className="min-h-9 rounded-lg border border-black/10 px-3 text-xs font-bold hover:bg-neutral-50">
                          Recovered
                        </button>
                        <button onClick={() => deleteCheckout(checkout.id)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-bold text-rose-600 hover:bg-rose-50">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!checkouts.length ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-neutral-500">
                      No abandoned checkout records yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
