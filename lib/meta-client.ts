"use client";

export type MetaEventName =
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase";

export type MetaCustomData = {
  content_ids?: string[];
  content_type?: "product" | string;
  value?: number;
  currency?: string;
  num_items?: number;
  search_string?: string;
  order_id?: string;
  payment_method?: string;
};

type MetaCustomerData = {
  email?: string;
  phone?: string;
};

declare global {
  interface Window {
    fbq?: (
      action: "track" | "init",
      eventNameOrPixelId: MetaEventName | string,
      parameters?: MetaCustomData,
      options?: { eventID?: string }
    ) => void;
  }
}

export function createMetaEventId(eventName: MetaEventName) {
  return `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function trackMetaEvent(
  eventName: MetaEventName,
  customData: MetaCustomData,
  options: {
    eventId?: string;
    orderId?: string;
    customer?: MetaCustomerData;
  } = {}
) {
  const eventId = options.eventId || createMetaEventId(eventName);
  const payload = {
    eventName,
    eventId,
    customData: {
      currency: "INR",
      ...customData
    },
    orderId: options.orderId,
    customer: options.customer,
    eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined
  };

  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, payload.customData, { eventID: eventId });
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[Meta Pixel]", eventName, { eventId, customData: payload.customData });
  }

  try {
    await fetch("/api/meta/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (error) {
    console.warn("Meta Conversions API event failed", error);
  }

  return eventId;
}
