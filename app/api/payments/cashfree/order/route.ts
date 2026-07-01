import { NextResponse } from "next/server";
import { OrderStatus } from "@/lib/generated/prisma/client";
import { CashfreeOrderError, cashfreeEnvironment, createCashfreeOrder, toCashfreeCustomerId } from "@/lib/cashfree";
import { createCheckoutOrder, makeDatabaseOrderId, normalizeIndianPhone, orderInclude, serializeOrder, validateCheckoutPayload, type CheckoutPayload } from "@/lib/checkout-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CheckoutPayload;
    const customer = payload.customer || { name: "", email: "", phone: "" };
    const normalizedPhone = normalizeIndianPhone(customer.phone);
    const normalizedPayload = {
      ...payload,
      customer: {
        ...customer,
        phone: normalizedPhone
      }
    };
    const errors = validateCheckoutPayload(normalizedPayload);

    if (normalizedPayload.paymentMethod !== "Online Payment") {
      errors.push("Cashfree can only be used for online payment.");
    }

    if (errors.length) {
      return NextResponse.json({ error: errors.join(" "), details: errors.join(" ") }, { status: 400 });
    }

    const orderId = makeDatabaseOrderId();
    const order = await createCheckoutOrder(normalizedPayload, {
      id: orderId,
      paymentMethodCode: "ONLINE",
      paymentGateway: "CASHFREE",
      paymentStatus: "Pending",
      orderStatus: OrderStatus.New
    });
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://podscentra.vercel.app";
    const safeCustomerId = toCashfreeCustomerId(`customer_${order.customer?.id || order.customerId || order.id || normalizedPayload.customer.phone}`);
    console.info("Cashfree order route prepared", {
      emailPresent: Boolean(normalizedPayload.customer.email),
      phoneLength: normalizedPayload.customer.phone.length,
      orderAmount: order.finalAmount,
      orderId,
      customerId: safeCustomerId,
      cashfreeEnv: cashfreeEnvironment(),
      publicCashfreeMode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "not-set"
    });
    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount: order.finalAmount,
      customer: {
        id: safeCustomerId,
        name: normalizedPayload.customer.name,
        email: normalizedPayload.customer.email,
        phone: normalizedPayload.customer.phone
      },
      returnUrl: `${origin}/order-success?orderId={order_id}`,
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
    console.info("Cashfree order creation response", {
      orderId: updatedOrder.id,
      cashfreeOrderId: cashfreeOrder.order_id,
      hasPaymentSessionId: Boolean(cashfreeOrder.payment_session_id),
      status: cashfreeOrder.order_status || "ACTIVE"
    });

    return NextResponse.json({
      order_id: updatedOrder.id,
      cashfree_order_id: cashfreeOrder.order_id,
      payment_session_id: cashfreeOrder.payment_session_id,
      order: serializeOrder(updatedOrder)
    });
  } catch (error) {
    console.error("Cashfree order creation failed", error);
    const details = error instanceof CashfreeOrderError
      ? error.details
      : error instanceof Error
        ? error.message
        : "Cashfree payment could not be initialized.";

    return NextResponse.json(
      {
        error: "Payment could not be started.",
        details
      },
      { status: 400 }
    );
  }
}
