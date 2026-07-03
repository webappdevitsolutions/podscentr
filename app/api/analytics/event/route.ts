import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { AbandonedCheckoutStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedEvents = new Set([
  "page_view",
  "product_view",
  "search",
  "add_to_cart",
  "cart_view",
  "checkout_started",
  "payment_started",
  "purchase_completed",
  "collection_view",
  "collection_click"
]);

type AnalyticsRequest = {
  type?: string;
  sessionId?: string;
  cartId?: string;
  path?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  productId?: string;
  collectionId?: string;
  orderId?: string;
  recordEvent?: boolean;
  checkout?: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    items?: unknown;
    subtotal?: number;
    deliveryCharge?: number;
    grandTotal?: number;
  };
};

function safeString(value: unknown, max = 500) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function parseDevice(userAgent: string) {
  const lower = userAgent.toLowerCase();
  if (/ipad|tablet/.test(lower)) return "tablet";
  if (/mobi|android|iphone/.test(lower)) return "mobile";
  return "desktop";
}

function parseBrowser(userAgent: string) {
  if (/edg/i.test(userAgent)) return "Edge";
  if (/opr|opera/i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  return "Other";
}

function parseOs(userAgent: string) {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os|macintosh/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
}

function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

function hashIp(ip: string) {
  if (!ip) return "";
  const salt = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "podscentra-analytics";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function syncAbandonedCheckout(body: AnalyticsRequest) {
  const checkout = body.checkout;
  const sessionId = safeString(body.sessionId, 120);
  const cartId = safeString(body.cartId, 120);

  if (!checkout || !sessionId || !cartId || !Array.isArray(checkout.items) || !checkout.items.length) return;

  await prisma.abandonedCheckout.upsert({
    where: {
      sessionId_cartId: {
        sessionId,
        cartId
      }
    },
    create: {
      sessionId,
      cartId,
      customerName: safeString(checkout.customerName, 160),
      customerEmail: safeString(checkout.customerEmail, 220),
      customerPhone: safeString(checkout.customerPhone, 30),
      items: checkout.items,
      subtotal: Number(checkout.subtotal || 0),
      deliveryCharge: Number(checkout.deliveryCharge || 0),
      grandTotal: Number(checkout.grandTotal || 0),
      status: AbandonedCheckoutStatus.STARTED
    },
    update: {
      customerName: safeString(checkout.customerName, 160),
      customerEmail: safeString(checkout.customerEmail, 220),
      customerPhone: safeString(checkout.customerPhone, 30),
      items: checkout.items,
      subtotal: Number(checkout.subtotal || 0),
      deliveryCharge: Number(checkout.deliveryCharge || 0),
      grandTotal: Number(checkout.grandTotal || 0),
      status: AbandonedCheckoutStatus.STARTED
    }
  });
}

async function markConverted(body: AnalyticsRequest) {
  const sessionId = safeString(body.sessionId, 120);
  const cartId = safeString(body.cartId, 120);
  const orderId = safeString(body.orderId, 160);

  if (!sessionId || !cartId || !orderId) return;

  await prisma.abandonedCheckout.updateMany({
    where: {
      sessionId,
      cartId,
      status: { in: [AbandonedCheckoutStatus.STARTED, AbandonedCheckoutStatus.ABANDONED, AbandonedCheckoutStatus.RECOVERED] }
    },
    data: {
      status: AbandonedCheckoutStatus.CONVERTED,
      convertedOrderId: orderId
    }
  });
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 25_000) {
      return NextResponse.json({ ok: false, error: "Analytics payload too large." }, { status: 413 });
    }

    const body = (await request.json()) as AnalyticsRequest;
    const type = safeString(body.type, 80);
    const sessionId = safeString(body.sessionId, 120);

    if (!allowedEvents.has(type) || !sessionId) {
      return NextResponse.json({ ok: true });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const referrer = safeString(body.referrer || request.headers.get("referer") || "", 800);

    if (body.recordEvent !== false) {
      await prisma.analyticsEvent.create({
        data: {
          sessionId,
          type,
          path: safeString(body.path, 800),
          referrer,
          source: safeString(body.source, 120),
          medium: safeString(body.medium, 120),
          campaign: safeString(body.campaign, 180),
          productId: safeString(body.productId, 160) || null,
          collectionId: safeString(body.collectionId, 160) || null,
          cartId: safeString(body.cartId, 160) || null,
          orderId: safeString(body.orderId, 160) || null,
          userAgent: userAgent.slice(0, 1000),
          device: parseDevice(userAgent),
          browser: parseBrowser(userAgent),
          os: parseOs(userAgent),
          country: safeString(request.headers.get("x-vercel-ip-country"), 80),
          region: safeString(request.headers.get("x-vercel-ip-country-region"), 120),
          ipHash: hashIp(requestIp(request))
        }
      });
    }

    if (type === "checkout_started") {
      await syncAbandonedCheckout(body);
    }

    if (type === "purchase_completed") {
      await markConverted(body);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Analytics event skipped", error);
    return NextResponse.json({ ok: true });
  }
}
