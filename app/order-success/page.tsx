"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { LinkButton } from "@/components/Button";
import { type SerializedOrder } from "@/lib/checkout-db";
import { resetAnalyticsCartId, trackAnalyticsEvent } from "@/lib/analytics-client";
import { trackMetaEvent } from "@/lib/meta-client";
import { formatCurrency } from "@/lib/utils";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-black/10 py-3 last:border-b-0 dark:border-white/10 sm:flex-row sm:justify-between sm:gap-6">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="text-sm font-bold text-ink dark:text-white sm:text-right">{value}</span>
    </div>
  );
}

function isConfirmedOrder(order: SerializedOrder) {
  return (
    order.paymentStatus === "Paid" ||
    order.paymentStatus === "COD_PENDING" ||
    order.orderStatus === "Paid" ||
    (order.orderStatus === "Confirmed" && !["Pending", "Failed", "Cancelled"].includes(order.paymentStatus))
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("order_id") || "";
  const [order, setOrder] = useState<SerializedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      setError("Order ID is missing.");
      return;
    }

    let isCurrent = true;

    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const result = await response.json();

        if (!response.ok || !result.order) {
          throw new Error(result.error || "Could not load order.");
        }

        if (isCurrent) setOrder(result.order as SerializedOrder);
      } catch (loadError) {
        if (isCurrent) {
          console.error("Order confirmation lookup failed", loadError);
          setError("We could not load your order details. Please contact support with your order ID.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadOrder();

    return () => {
      isCurrent = false;
    };
  }, [orderId]);

  useEffect(() => {
    if (!order || !isConfirmedOrder(order)) return;

    const storageKey = `podscentra-meta-purchase-${order.id}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");

    void trackMetaEvent(
      "Purchase",
      {
        content_ids: order.items.map((item) => item.productId || item.id).filter(Boolean),
        content_type: "product",
        value: order.finalAmount,
        currency: "INR",
        num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
        order_id: order.id
      },
      {
        orderId: order.id,
        customer: {
          email: order.customerEmail,
          phone: order.customerMobile
        }
      }
    );
    void trackAnalyticsEvent("purchase_completed", {
      orderId: order.id,
      value: order.finalAmount,
      numItems: order.items.reduce((sum, item) => sum + item.quantity, 0)
    }).finally(() => {
      resetAnalyticsCartId();
    });
  }, [order]);

  if (isLoading) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <h1 className="mt-6 text-3xl font-black">Loading your order</h1>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-black">Order confirmation</h1>
        <p className="mt-4 max-w-xl text-neutral-500 dark:text-neutral-400">{error || "Order details are unavailable."}</p>
        {orderId ? <p className="mt-3 text-sm font-bold">Order ID: {orderId}</p> : null}
        <LinkButton href="/shop" className="mt-8">Continue shopping</LinkButton>
      </section>
    );
  }

  if (!isConfirmedOrder(order)) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-600">
          <AlertCircle size={34} />
        </div>
        <h1 className="mt-6 text-4xl font-black">Payment not completed</h1>
        <p className="mt-4 max-w-xl text-neutral-500 dark:text-neutral-400">
          This order is not confirmed yet. Your cart is still saved if the payment was cancelled or failed.
        </p>
        <p className="mt-3 break-all text-sm font-bold">Order ID: {order.id}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/checkout">Back to checkout</LinkButton>
          <LinkButton href="/cart" variant="ghost">View cart</LinkButton>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-white p-6 shadow-luxury dark:bg-white/5 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Thank you for your order</h1>
            <p className="mt-3 text-neutral-500 dark:text-neutral-400">Your order has been received and is being prepared.</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 px-5 py-4 text-left dark:bg-white/5 sm:text-right">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Order ID</p>
            <p className="mt-1 break-all text-lg font-black">{order.id}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-black/10 p-5 dark:border-white/10">
            <h2 className="text-xl font-black">Customer details</h2>
            <div className="mt-3">
              <DetailRow label="Customer name" value={order.customerName} />
              <DetailRow label="Phone" value={order.customerMobile} />
              <DetailRow label="Email" value={order.customerEmail} />
              <DetailRow label="Shipping address" value={order.fullAddress} />
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 p-5 dark:border-white/10">
            <h2 className="text-xl font-black">Payment and delivery</h2>
            <div className="mt-3">
              <DetailRow label="Payment method" value={order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"} />
              <DetailRow label="Payment status" value={order.paymentStatus} />
              <DetailRow label="Delivery method" value={order.deliveryMethod} />
              <DetailRow label="Delivery charge" value={formatCurrency(order.deliveryCharge)} />
              <DetailRow label="Total" value={formatCurrency(order.finalAmount)} />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-black/10 p-5 dark:border-white/10">
          <h2 className="text-xl font-black">Items</h2>
          <div className="mt-3 grid gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-1 rounded-2xl bg-neutral-50 p-4 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="text-sm text-neutral-500">
                    Qty {item.quantity}
                    {item.size ? ` / ${item.size}` : ""}
                    {item.color ? ` / ${item.color}` : ""}
                  </p>
                </div>
                <p className="font-black">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/shop">Continue shopping</LinkButton>
          <LinkButton href="/" variant="ghost">Back home</LinkButton>
        </div>
      </div>
    </section>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 text-center">Loading order...</section>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
