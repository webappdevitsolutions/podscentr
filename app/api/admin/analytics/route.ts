import { NextResponse } from "next/server";
import { AbandonedCheckoutStatus, OrderStatus } from "@/lib/generated/prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { orderInclude } from "@/lib/checkout-db";
import { resolveDateRange } from "@/lib/date-range";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CountRow = {
  label: string;
  count: number;
};

function dayKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";
  return `${year}-${month}-${day}`;
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  const normalized = key || "Unknown";
  map.set(normalized, (map.get(normalized) || 0) + amount);
}

function topRows(map: Map<string, number>, limit = 8): CountRow[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function orderWhere(from: Date, to: Date) {
  return {
    createdAt: { gte: from, lt: to },
    OR: [
      { status: OrderStatus.Paid },
      { paymentStatus: "Paid" },
      { paymentStatus: "COD_PENDING" },
      {
        status: OrderStatus.Confirmed,
        paymentStatus: { notIn: ["Pending", "Failed", "Cancelled"] }
      }
    ]
  };
}

function percentChange(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return ((current - previous) / previous) * 100;
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = resolveDateRange(new URL(request.url));
  const [events, previousEvents, realOrders, previousOrders, abandonedCheckouts, previousAbandonedCheckouts] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: range.from, lt: range.to } },
      orderBy: { createdAt: "asc" },
      take: 15000
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: range.previousFrom, lt: range.previousTo } },
      orderBy: { createdAt: "asc" },
      take: 15000
    }),
    prisma.order.findMany({
      where: orderWhere(range.from, range.to),
      include: orderInclude,
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.findMany({
      where: orderWhere(range.previousFrom, range.previousTo),
      include: orderInclude
    }),
    prisma.abandonedCheckout.findMany({
      where: {
        lastActivityAt: { gte: range.from, lt: range.to },
        status: { in: [AbandonedCheckoutStatus.STARTED, AbandonedCheckoutStatus.ABANDONED] }
      }
    }),
    prisma.abandonedCheckout.findMany({
      where: {
        lastActivityAt: { gte: range.previousFrom, lt: range.previousTo },
        status: { in: [AbandonedCheckoutStatus.STARTED, AbandonedCheckoutStatus.ABANDONED] }
      }
    })
  ]);

  const eventCounts = new Map<string, number>();
  const visitsByDay = new Map<string, number>();
  const sourceCounts = new Map<string, number>();
  const pageCounts = new Map<string, number>();
  const productCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const visitors = new Set<string>();

  events.forEach((event) => {
    increment(eventCounts, event.type);
    if (event.type === "page_view") {
      visitors.add(event.sessionId);
      increment(visitsByDay, dayKey(event.createdAt));
      increment(sourceCounts, event.source || "direct");
      increment(pageCounts, event.path || "/");
      increment(deviceCounts, event.device);
      increment(browserCounts, event.browser);
      increment(countryCounts, event.country || "Unknown");
    }

    if (event.type === "product_view" && event.productId) {
      increment(productCounts, event.productId);
    }
  });

  const productIds = [...productCounts.keys()];
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      })
    : [];
  const productNameMap = new Map(products.map((product) => [product.id, product.name]));
  const topProductsViewed = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([productId, count]) => ({
      productId,
      label: productNameMap.get(productId) || productId,
      count
    }));

  const pageViews = eventCounts.get("page_view") || 0;
  const productViews = eventCounts.get("product_view") || 0;
  const addToCarts = eventCounts.get("add_to_cart") || 0;
  const checkoutStarted = eventCounts.get("checkout_started") || 0;
  const purchaseCompleted = eventCounts.get("purchase_completed") || 0;
  const ordersCompleted = realOrders.length;
  const revenue = realOrders.reduce((sum, order) => sum + order.finalAmount, 0);
  const previousEventCounts = new Map<string, number>();
  const previousVisitors = new Set<string>();
  previousEvents.forEach((event) => {
    increment(previousEventCounts, event.type);
    if (event.type === "page_view") previousVisitors.add(event.sessionId);
  });
  const previousRevenue = previousOrders.reduce((sum, order) => sum + order.finalAmount, 0);
  const previousOrdersCompleted = previousOrders.length;

  return NextResponse.json({
    range: {
      key: range.range,
      label: range.label,
      from: range.fromInput,
      to: range.toInput
    },
    summary: {
      totalVisitors: visitors.size,
      pageViews,
      productViews,
      addToCarts,
      checkoutStarted,
      ordersCompleted,
      conversionRate: visitors.size ? (ordersCompleted / visitors.size) * 100 : 0,
      abandonedCheckouts: abandonedCheckouts.length,
      revenue
    },
    comparison: {
      totalVisitors: percentChange(visitors.size, previousVisitors.size),
      pageViews: percentChange(pageViews, previousEventCounts.get("page_view") || 0),
      productViews: percentChange(productViews, previousEventCounts.get("product_view") || 0),
      addToCarts: percentChange(addToCarts, previousEventCounts.get("add_to_cart") || 0),
      checkoutStarted: percentChange(checkoutStarted, previousEventCounts.get("checkout_started") || 0),
      ordersCompleted: percentChange(ordersCompleted, previousOrdersCompleted),
      abandonedCheckouts: percentChange(abandonedCheckouts.length, previousAbandonedCheckouts.length),
      revenue: percentChange(revenue, previousRevenue)
    },
    funnel: {
      cartToCheckoutRate: addToCarts ? (checkoutStarted / addToCarts) * 100 : 0,
      checkoutToPurchaseRate: checkoutStarted ? ((purchaseCompleted || ordersCompleted) / checkoutStarted) * 100 : 0
    },
    visitsByDay: [...visitsByDay.entries()].map(([date, count]) => ({ date, count })),
    topTrafficSources: topRows(sourceCounts),
    topPages: topRows(pageCounts),
    topProductsViewed,
    deviceBreakdown: topRows(deviceCounts),
    browserBreakdown: topRows(browserCounts),
    countryBreakdown: topRows(countryCounts),
    recentOrders: realOrders.slice(0, 8).map((order) => ({
      id: order.id,
      customerName: order.customerName,
      total: order.finalAmount,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString()
    }))
  });
}
