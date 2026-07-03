import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { applyBulkOrderAction } from "@/lib/admin-orders";
import { orderInclude, serializeOrder } from "@/lib/checkout-db";
import { sendFulfillmentEmail, sendOrderCancelledEmail, sendRefundProcessedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { action?: string; ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (!body.action || !ids.length) {
      return NextResponse.json({ error: "Select at least one order." }, { status: 400 });
    }

    const result = await applyBulkOrderAction(body.action, ids);
    const orders = await prisma.order.findMany({ where: { id: { in: ids } }, include: orderInclude });
    const serializedOrders = orders.map(serializeOrder);

    if (body.action === "mark_shipped") {
      await Promise.all(serializedOrders.map((order) => sendFulfillmentEmail(order, "Shipped")));
    }
    if (body.action === "cancel") {
      await Promise.all(serializedOrders.map(sendOrderCancelledEmail));
    }
    if (body.action === "refund") {
      await Promise.all(serializedOrders.map(sendRefundProcessedEmail));
    }

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("Admin order bulk action failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update orders." }, { status: 400 });
  }
}
