import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { fetchCashfreeOrder, fetchCashfreePayments } from "@/lib/cashfree";
import { orderInclude, serializeOrder } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { order_id } = (await request.json()) as { order_id?: string };

    if (!order_id) {
      return NextResponse.json({ error: "Cashfree order_id is required." }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: order_id },
      include: orderInclude
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const cashfreeOrderId = existingOrder.payment?.gatewayOrderId || order_id;
    const [cashfreeOrder, cashfreePayments] = await Promise.all([
      fetchCashfreeOrder(cashfreeOrderId),
      fetchCashfreePayments(cashfreeOrderId).catch(() => [])
    ]);
    const successfulPayment = cashfreePayments.find((payment) => payment.payment_status === "SUCCESS");
    const isPaid = cashfreeOrder.order_status === "PAID" || Boolean(successfulPayment);

    const order = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: isPaid ? OrderStatus.Paid : OrderStatus.New,
        paymentStatus: isPaid ? "Paid" : cashfreeOrder.order_status,
        payment: {
          update: {
            status: isPaid ? PaymentStatus.Paid : PaymentStatus.Pending,
            gatewayOrderId: cashfreeOrder.order_id,
            cfOrderId: cashfreeOrder.cf_order_id,
            gatewayPaymentId: successfulPayment?.cf_payment_id ? String(successfulPayment.cf_payment_id) : existingOrder.payment?.gatewayPaymentId,
            rawStatus: successfulPayment?.payment_status || cashfreeOrder.order_status
          }
        }
      },
      include: orderInclude
    });

    if (isPaid && existingOrder.paymentStatus !== "Paid" && order.customerId) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: { totalSpent: { increment: order.finalAmount } }
      });
    }

    return NextResponse.json({
      verified: isPaid,
      status: cashfreeOrder.order_status,
      payment_status: successfulPayment?.payment_status || null,
      order: serializeOrder(order)
    });
  } catch (error) {
    console.error("Cashfree verify failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify payment." }, { status: 400 });
  }
}
