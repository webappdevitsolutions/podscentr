import { createHash } from "node:crypto";
import { headers, cookies } from "next/headers";
import { NextResponse } from "next/server";
import { orderInclude, serializeOrder } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const metaPixelId = "4593208717630165";
const metaGraphVersion = "v19.0";
const allowedEvents = new Set(["ViewContent", "Search", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Purchase"]);

type MetaEventPayload = {
  eventName?: string;
  eventId?: string;
  eventSourceUrl?: string;
  orderId?: string;
  customer?: {
    email?: string;
    phone?: string;
  };
  customData?: {
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    num_items?: number;
    search_string?: string;
    order_id?: string;
    payment_method?: string;
  };
};

function sha256(value?: string | null) {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
}

function hashPhone(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return undefined;
  return sha256(digits);
}

function cleanCustomData(customData: MetaEventPayload["customData"]) {
  if (!customData) return {};

  return {
    ...customData,
    currency: customData.currency || "INR",
    value: typeof customData.value === "number" ? Number(customData.value.toFixed(2)) : undefined
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MetaEventPayload;

    if (!payload.eventName || !allowedEvents.has(payload.eventName)) {
      return NextResponse.json({ error: "Unsupported Meta event." }, { status: 400 });
    }

    if (!payload.eventId) {
      return NextResponse.json({ error: "Meta event_id is required." }, { status: 400 });
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[Meta CAPI] received", {
        eventName: payload.eventName,
        eventId: payload.eventId,
        orderId: payload.orderId || null
      });
    }

    let customData = cleanCustomData(payload.customData);
    let customerEmail = payload.customer?.email;
    let customerPhone = payload.customer?.phone;

    if (payload.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: orderInclude
      });

      if (order) {
        const serializedOrder = serializeOrder(order);
        customerEmail = customerEmail || serializedOrder.customerEmail;
        customerPhone = customerPhone || serializedOrder.customerMobile;
        customData = {
          content_ids: serializedOrder.items.map((item) => item.productId || item.id).filter(Boolean),
          content_type: "product",
          value: serializedOrder.finalAmount,
          currency: "INR",
          num_items: serializedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
          order_id: serializedOrder.id,
          ...customData
        };
      }
    }

    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn("Meta Conversions API skipped: META_CAPI_ACCESS_TOKEN is not set.");
      return NextResponse.json({ ok: false, skipped: true, reason: "META_CAPI_ACCESS_TOKEN is not set." });
    }

    const headerStore = await headers();
    const cookieStore = await cookies();
    const forwardedFor = headerStore.get("x-forwarded-for") || "";
    const clientIpAddress = forwardedFor.split(",")[0]?.trim() || headerStore.get("x-real-ip") || undefined;
    const clientUserAgent = headerStore.get("user-agent") || undefined;
    const fbp = cookieStore.get("_fbp")?.value;
    const fbc = cookieStore.get("_fbc")?.value;

    const metaEvent = {
      event_name: payload.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.eventId,
      action_source: "website",
      event_source_url: payload.eventSourceUrl,
      user_data: {
        em: sha256(customerEmail),
        ph: hashPhone(customerPhone),
        client_ip_address: clientIpAddress,
        client_user_agent: clientUserAgent,
        fbp,
        fbc
      },
      custom_data: customData
    };

    const body: Record<string, unknown> = {
      data: [metaEvent]
    };
    if (process.env.META_TEST_EVENT_CODE) {
      body.test_event_code = process.env.META_TEST_EVENT_CODE;
    }

    const response = await fetch(`https://graph.facebook.com/${metaGraphVersion}/${metaPixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Meta Conversions API failed", {
        status: response.status,
        result
      });
      return NextResponse.json({ ok: false, error: "Meta Conversions API failed.", details: result }, { status: 502 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Meta event route failed", error);
    return NextResponse.json({ ok: false, error: "Could not send Meta event." }, { status: 400 });
  }
}
