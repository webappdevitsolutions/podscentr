import { NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@/lib/generated/prisma/client";
import { orderInclude, serializeOrder } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const orderId = body.orderId || "";
    const razorpayOrderId = body.razorpay_order_id || "";
    const razorpayPaymentId = body.razorpay_payment_id || "";
    const razorpaySignature = body.razorpay_signature || "";

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing Razorpay payment verification details." }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!isValid) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.Cancelled,
          paymentStatus: "Failed",
          payment: {
            update: {
              status: PaymentStatus.Failed,
              gatewayOrderId: razorpayOrderId,
              gatewayPaymentId: razorpayPaymentId,
              rawStatus: "SIGNATURE_INVALID"
            }
          }
        }
      });

      return NextResponse.json({ verified: false, error: "Payment verification failed." }, { status: 400 });
    }

    const wasAlreadyPaid = existingOrder.paymentStatus === "Paid";
    const paidOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.Paid,
        paymentStatus: "Paid",
        paymentGateway: "RAZORPAY",
        payment: {
          update: {
            gateway: "RAZORPAY",
            status: PaymentStatus.Paid,
            gatewayOrderId: razorpayOrderId,
            gatewayPaymentId: razorpayPaymentId,
            rawStatus: "PAID",
            paidAt: new Date()
          }
        }
      },
      include: orderInclude
    });

    if (!wasAlreadyPaid && paidOrder.customerId) {
      await prisma.customer.update({
        where: { id: paidOrder.customerId },
        data: { totalSpent: { increment: paidOrder.finalAmount } }
      });
    }

    return NextResponse.json({
      verified: true,
      order: serializeOrder(paidOrder)
    });
  } catch (error) {
    console.error("Razorpay verify failed", error);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}
