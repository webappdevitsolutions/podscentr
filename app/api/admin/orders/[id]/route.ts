import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { orderUpdateData } from "@/lib/admin-orders";
import { orderInclude, serializeOrder } from "@/lib/checkout-db";
import { sendOrderUpdateEmails } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order || order.deletedAt) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(serializeOrder(order));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const previousOrder = await prisma.order.findUnique({ where: { id }, include: orderInclude });
    const serializedPreviousOrder = previousOrder ? serializeOrder(previousOrder) : null;
    const order = await prisma.order.update({
      where: { id },
      data: orderUpdateData(body),
      include: orderInclude
    });
    const serializedOrder = serializeOrder(order);

    await sendOrderUpdateEmails(serializedPreviousOrder, serializedOrder, body);

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("Admin order update failed", error);
    return NextResponse.json({ error: "Could not update order." }, { status: 400 });
  }
}
