import { NextResponse } from "next/server";
import { OrderStatus } from "@/lib/generated/prisma/client";
import { createCheckoutOrder, orderInclude, serializeOrder, type CheckoutPayload } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(orders.map(serializeOrder));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;

    if (payload.paymentMethod !== "Cash on Delivery") {
      return NextResponse.json({ error: "Use Cashfree route for online payments." }, { status: 400 });
    }

    const order = await createCheckoutOrder(payload, {
      paymentMethodCode: "COD",
      paymentGateway: "COD",
      paymentStatus: "COD_PENDING",
      orderStatus: OrderStatus.Confirmed
    });

    return NextResponse.json({ order: serializeOrder(order) }, { status: 201 });
  } catch (error) {
    console.error("Create COD order failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not place order." }, { status: 400 });
  }
}
