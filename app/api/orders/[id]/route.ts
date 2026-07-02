import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { orderInclude, serializeOrder } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: orderInclude
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error("Order lookup failed", error);
    return NextResponse.json({ error: "Could not load order." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = (await request.json()) as { action?: string };

    if (body.action !== "cancel-pending-payment") {
      return NextResponse.json({ error: "Unsupported order action." }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: orderInclude
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (existingOrder.paymentStatus === "Paid" || existingOrder.paymentStatus === "COD_PENDING") {
      return NextResponse.json({ order: serializeOrder(existingOrder) });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.Cancelled,
        paymentStatus: "Cancelled",
        payment: {
          update: {
            status: PaymentStatus.Failed,
            rawStatus: "CUSTOMER_CANCELLED_PAYMENT"
          }
        }
      },
      include: orderInclude
    });

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error("Order update failed", error);
    return NextResponse.json({ error: "Could not update order." }, { status: 500 });
  }
}
