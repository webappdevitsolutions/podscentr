import { NextResponse } from "next/server";
import { AbandonedCheckoutStatus } from "@/lib/generated/prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function serialize(checkout: Awaited<ReturnType<typeof prisma.abandonedCheckout.findMany>>[number]) {
  return {
    id: checkout.id,
    sessionId: checkout.sessionId,
    cartId: checkout.cartId,
    customerName: checkout.customerName,
    customerEmail: checkout.customerEmail,
    customerPhone: checkout.customerPhone,
    items: checkout.items,
    subtotal: checkout.subtotal,
    deliveryCharge: checkout.deliveryCharge,
    grandTotal: checkout.grandTotal,
    status: checkout.status,
    checkoutStartedAt: checkout.checkoutStartedAt.toISOString(),
    lastActivityAt: checkout.lastActivityAt.toISOString(),
    convertedOrderId: checkout.convertedOrderId
  };
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const where =
    status && status !== "all"
      ? { status: status as AbandonedCheckoutStatus }
      : {};

  const checkouts = await prisma.abandonedCheckout.findMany({
    where,
    orderBy: { lastActivityAt: "desc" },
    take: 250
  });

  return NextResponse.json(checkouts.map(serialize));
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const result = await prisma.abandonedCheckout.updateMany({
    where: {
      status: AbandonedCheckoutStatus.STARTED,
      lastActivityAt: { lt: cutoff }
    },
    data: {
      status: AbandonedCheckoutStatus.ABANDONED
    }
  });

  return NextResponse.json({ updated: result.count });
}
