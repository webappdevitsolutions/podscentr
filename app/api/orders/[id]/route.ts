import { NextResponse } from "next/server";
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
