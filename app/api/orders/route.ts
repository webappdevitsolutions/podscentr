import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus, Prisma } from "@/lib/generated/prisma/client";
import { createCheckoutOrder, orderInclude, serializeOrder, type CheckoutPayload } from "@/lib/checkout-db";
import { resolveDateRange } from "@/lib/date-range";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function orderWhereForView(view: string): Prisma.OrderWhereInput {
  switch (view) {
    case "all":
      return {};
    case "paid":
      return {
        OR: [{ status: OrderStatus.Paid }, { paymentStatus: "Paid" }]
      };
    case "cod":
      return { paymentStatus: "COD_PENDING" };
    case "confirmed":
      return {
        status: OrderStatus.Confirmed,
        paymentStatus: { notIn: ["Pending", "Failed", "Cancelled"] }
      };
    case "pending":
      return {
        OR: [{ status: OrderStatus.New }, { paymentStatus: { in: ["Pending", "PENDING_PAYMENT"] } }]
      };
    case "failed":
      return {
        OR: [{ status: OrderStatus.Cancelled }, { paymentStatus: { in: ["Failed", "Cancelled"] } }]
      };
    case "real":
    default:
      return {
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
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "real";
  const range = resolveDateRange(url);

  const orders = await prisma.order.findMany({
    where: {
      ...orderWhereForView(view),
      createdAt: { gte: range.from, lt: range.to }
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(orders.map(serializeOrder));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;

    if (payload.paymentMethod !== "Cash on Delivery") {
      return NextResponse.json({ error: "Use Razorpay route for online payments." }, { status: 400 });
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

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const cleanup = url.searchParams.get("cleanup");

  if (cleanup !== "pending") {
    return NextResponse.json({ error: "Unsupported cleanup action." }, { status: 400 });
  }

  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const result = await prisma.order.updateMany({
    where: {
      createdAt: { lt: cutoff },
      OR: [{ status: OrderStatus.New }, { paymentStatus: { in: ["Pending", "PENDING_PAYMENT"] } }]
    },
    data: {
      status: OrderStatus.Cancelled,
      paymentStatus: "Cancelled"
    }
  });

  await prisma.payment.updateMany({
    where: {
      order: {
        createdAt: { lt: cutoff },
        OR: [{ status: OrderStatus.Cancelled }, { paymentStatus: "Cancelled" }]
      },
      status: PaymentStatus.Pending
    },
    data: {
      status: PaymentStatus.Failed,
      rawStatus: "ABANDONED_CHECKOUT_CANCELLED"
    }
  });

  return NextResponse.json({ cleaned: result.count });
}
