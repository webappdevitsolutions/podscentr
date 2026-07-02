import { NextResponse } from "next/server";
import { AbandonedCheckoutStatus, OrderStatus } from "@/lib/generated/prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { orderInclude } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CountRow = {
  label: string;
  count: number;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
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

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [events, realOrders, abandonedCheckouts] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: 15000
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { status: OrderStatus.Paid },
          { paymentStatus: "Paid" },
          { paymentStatus: "COD_PENDING" },
          {
            status: OrderStatus.Confirmed,
            paymentStatus: { notIn: ["Pending", "Failed", "Cancelled"] }
          }
        ]
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" }
    }),
    prisma.abandonedCheckout.findMany({
      where: {
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

  return NextResponse.json({
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
