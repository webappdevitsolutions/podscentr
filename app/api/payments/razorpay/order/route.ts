import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { createCheckoutOrder, serializeOrder, type CheckoutPayload } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let createdOrderId = "";

  try {
    const payload = (await request.json()) as CheckoutPayload;

    if (payload.paymentMethod !== "Online Payment") {
      return NextResponse.json({ error: "Razorpay can only be used for online payments." }, { status: 400 });
    }

    const order = await createCheckoutOrder(payload, {
      paymentMethodCode: "ONLINE",
      paymentGateway: "RAZORPAY",
      paymentStatus: "Pending",
      orderStatus: OrderStatus.New
    });
    createdOrderId = order.id;

    const razorpayOrder = await createRazorpayOrder({
      orderId: order.id,
      amount: order.finalAmount,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerMobile
    });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        gatewayOrderId: razorpayOrder.id,
        rawStatus: razorpayOrder.status || "created"
      }
    });

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order: serializeOrder(order)
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);

    if (createdOrderId) {
      await prisma.order.update({
        where: { id: createdOrderId },
        data: {
          paymentStatus: "Failed",
          payment: {
            update: {
              status: PaymentStatus.Failed,
              rawStatus: "ORDER_CREATION_FAILED"
            }
          }
        }
      }).catch(() => null);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment could not be started. Please check your details and try again." },
      { status: 400 }
    );
  }
}
