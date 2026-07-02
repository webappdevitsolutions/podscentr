"use client";

import { type CartItem } from "@/hooks/useCart";

export type AnalyticsEventType =
  | "page_view"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "cart_view"
  | "checkout_started"
  | "payment_started"
  | "purchase_completed";

type AnalyticsCartItem = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
};

type AnalyticsCheckout = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: AnalyticsCartItem[];
  subtotal: number;
  deliveryCharge: number;
  grandTotal: number;
};

type AnalyticsPayload = {
  productId?: string;
  orderId?: string;
  searchString?: string;
  value?: number;
  numItems?: number;
  checkout?: AnalyticsCheckout;
};

const sessionKey = "podscentra-analytics-session";
const cartKey = "podscentra-analytics-cart";

function randomId(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 12);
  return `${prefix}_${Date.now().toString(36)}_${randomPart}`;
}

function storageId(key: string, prefix: string) {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const next = randomId(prefix);
  localStorage.setItem(key, next);
  return next;
}

export function getAnalyticsSessionId() {
  return storageId(sessionKey, "ps");
}

export function getAnalyticsCartId() {
  return storageId(cartKey, "cart");
}

export function resetAnalyticsCartId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(cartKey);
}

function utmValue(name: string) {
  if (typeof window === "undefined") return "";
  return new URL(window.location.href).searchParams.get(name) || "";
}

function inferredSource(referrer: string) {
  if (!referrer) return "direct";

  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function toAnalyticsItems(items: CartItem[]): AnalyticsCartItem[] {
  return items.map((item) => ({
    id: item.id,
    productId: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.product.price,
    size: item.size,
    color: item.color
  }));
}

export async function trackAnalyticsEvent(
  type: AnalyticsEventType,
  data: AnalyticsPayload = {},
  options: { recordEvent?: boolean } = {}
) {
  if (typeof window === "undefined") return;

  const referrer = document.referrer || "";
  const payload = {
    type,
    sessionId: getAnalyticsSessionId(),
    cartId: getAnalyticsCartId(),
    path: `${window.location.pathname}${window.location.search}`,
    referrer,
    source: utmValue("utm_source") || inferredSource(referrer),
    medium: utmValue("utm_medium"),
    campaign: utmValue("utm_campaign"),
    recordEvent: options.recordEvent !== false,
    ...data
  };

  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Analytics event failed", error);
    }
  }
}

export function syncAbandonedCheckout(checkout: AnalyticsCheckout) {
  return trackAnalyticsEvent("checkout_started", { checkout }, { recordEvent: false });
}
