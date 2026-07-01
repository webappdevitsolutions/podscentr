import { NextResponse } from "next/server";
import { OrderStatus } from "@/lib/generated/prisma/client";
import { createCashfreeOrder, toCashfreeCustomerId } from "@/lib/cashfree";
import { createCheckoutOrder, makeDatabaseOrderId, orderInclude, serializeOrder, validateCheckoutPayload, type CheckoutPayload } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;
    const errors = validateCheckoutPayload(payload);

    if (payload.paymentMethod !== "Online Payment") {
      errors.push("Cashfree can only be used for online payment.");
    }

    if (errors.length) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    const orderId = makeDatabaseOrderId();
    const order = await createCheckoutOrder(payload, {
      id: orderId,
      paymentMethodCode: "ONLINE",
      paymentGateway: "CASHFREE",
      paymentStatus: "Pending",
      orderStatus: OrderStatus.New
    });
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://podscentra.vercel.app";
    const safeCustomerId = toCashfreeCustomerId(`customer_${order.customer?.id || order.customerId || order.id || payload.customer.phone}`);
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount: order.finalAmount,
      customer: {
        id: safeCustomerId,
        name: payload.customer.name,
        email: payload.customer.email,
        phone: payload.customer.phone
      },
      returnUrl: `${origin}/order-success?order_id={order_id}`,
      note: "Podscentra online order"
    });
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        payment: {
          update: {
            gatewayOrderId: cashfreeOrder.order_id,
            cfOrderId: cashfreeOrder.cf_order_id,
            rawStatus: cashfreeOrder.order_status || "ACTIVE"
          }
        }
      },
      include: orderInclude
    });

    return NextResponse.json({
      order_id: updatedOrder.id,
      cashfree_order_id: cashfreeOrder.order_id,
      payment_session_id: cashfreeOrder.payment_session_id,
      order: serializeOrder(updatedOrder)
    });
  } catch (error) {
    console.error("Cashfree order creation failed", error);
    return NextResponse.json(
      { error: "Payment could not be started. Please check your details and try again." },
      { status: 400 }
    );
  }
}
