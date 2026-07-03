import type { SerializedOrder } from "@/lib/checkout-db";
import {
  adminContactAlertTemplate,
  adminNewOrderAlertTemplate,
  contactConfirmationTemplate,
  fulfillmentTemplate,
  orderCancelledTemplate,
  orderConfirmationTemplate,
  paymentSuccessfulTemplate,
  refundProcessedTemplate,
  type ContactMessage
} from "@/lib/email-templates";
import resend from "@/lib/resend";

const supportEmail = "support@podscentra.com";
const adminEmail = "podscentra@gmail.com";

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL || (process.env.NODE_ENV === "production" ? "orders@podscentra.com" : "onboarding@resend.dev");
}

async function sendTransactionalEmail(input: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  if (!resend) {
    console.warn(`RESEND_API_KEY is missing. Skipped email: ${input.subject}`);
    return { skipped: true };
  }

  try {
    return await resend.emails.send({
      from: `Podscentra <${fromAddress()}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo || supportEmail
    });
  } catch (error) {
    console.error("Resend email failed", {
      subject: input.subject,
      to: Array.isArray(input.to) ? input.to.join(",") : input.to,
      error: error instanceof Error ? error.message : String(error)
    });
    return { error: true };
  }
}

function hasCustomerEmail(order: SerializedOrder) {
  return Boolean(order.customerEmail && order.customerEmail.includes("@"));
}

export async function sendOrderConfirmationEmail(order: SerializedOrder) {
  if (!hasCustomerEmail(order)) return { skipped: true };
  return sendTransactionalEmail({
    to: order.customerEmail,
    subject: "Order Confirmed - Podscentra",
    html: orderConfirmationTemplate(order)
  });
}

export async function sendPaymentSuccessfulEmail(order: SerializedOrder) {
  if (!hasCustomerEmail(order)) return { skipped: true };
  return sendTransactionalEmail({
    to: order.customerEmail,
    subject: "Payment Successful - Podscentra",
    html: paymentSuccessfulTemplate(order)
  });
}

export async function sendFulfillmentEmail(order: SerializedOrder, status: string) {
  if (!hasCustomerEmail(order)) return { skipped: true };
  const subject =
    status === "Packed"
      ? "Your order has been packed - Podscentra"
      : status === "Shipped"
        ? "Your order has shipped - Podscentra"
        : status === "Out for Delivery"
          ? "Your order is out for delivery - Podscentra"
          : status === "Delivered"
            ? "Order Delivered - Podscentra"
            : status === "Returned"
              ? "Return Approved - Podscentra"
              : `Order Update - Podscentra`;

  return sendTransactionalEmail({
    to: order.customerEmail,
    subject,
    html: fulfillmentTemplate(order, status)
  });
}

export async function sendOrderCancelledEmail(order: SerializedOrder) {
  if (!hasCustomerEmail(order)) return { skipped: true };
  return sendTransactionalEmail({
    to: order.customerEmail,
    subject: "Order Cancelled - Podscentra",
    html: orderCancelledTemplate(order)
  });
}

export async function sendRefundProcessedEmail(order: SerializedOrder) {
  if (!hasCustomerEmail(order)) return { skipped: true };
  return sendTransactionalEmail({
    to: order.customerEmail,
    subject: "Refund Processed - Podscentra",
    html: refundProcessedTemplate(order)
  });
}

export async function sendAdminNewOrderAlert(order: SerializedOrder) {
  return sendTransactionalEmail({
    to: adminEmail,
    subject: `New order received - ${order.id}`,
    html: adminNewOrderAlertTemplate(order)
  });
}

export async function sendContactEmails(contact: ContactMessage) {
  await Promise.all([
    sendTransactionalEmail({
      to: contact.email,
      subject: "We received your message - Podscentra",
      html: contactConfirmationTemplate(contact)
    }),
    sendTransactionalEmail({
      to: adminEmail,
      subject: `New Podscentra contact message from ${contact.name}`,
      html: adminContactAlertTemplate(contact),
      replyTo: contact.email
    })
  ]);
}

export async function sendOrderUpdateEmails(previous: SerializedOrder | null, next: SerializedOrder, requestBody: Record<string, unknown>) {
  const emails: Promise<unknown>[] = [];
  const fulfillmentStatus = String(requestBody.fulfillmentStatus || "");
  const orderStatus = String(requestBody.orderStatus || "");
  const paymentStatus = String(requestBody.paymentStatus || "");

  if (fulfillmentStatus && fulfillmentStatus !== previous?.fulfillmentStatus) {
    if (["Packed", "Shipped", "Out for Delivery", "Delivered", "Returned"].includes(fulfillmentStatus)) {
      emails.push(sendFulfillmentEmail(next, fulfillmentStatus));
    }
  }

  if (orderStatus === "Cancelled" && next.orderStatus !== previous?.orderStatus) {
    emails.push(sendOrderCancelledEmail(next));
  }

  if ((orderStatus === "Refunded" || paymentStatus === "Refunded" || paymentStatus === "REFUNDED") && next.paymentStatus !== previous?.paymentStatus) {
    emails.push(sendRefundProcessedEmail(next));
  }

  await Promise.all(emails);
}
