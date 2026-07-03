import type { SerializedOrder } from "@/lib/checkout-db";

export type ContactMessage = {
  name: string;
  email: string;
  phone?: string;
  message: string;
};

const supportPhone = "+91 0120 421 7372";
const supportEmail = "support@podscentra.com";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://podscentr.vercel.app");
const logoUrl = `${siteUrl}/img/podcentalogo.png`;

function money(value: number) {
  return `&#8377;${Number(value || 0).toLocaleString("en-IN")}`;
}

function escapeHtml(value?: string | null) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function button(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;border-radius:999px;background:#111;color:#fff;text-decoration:none;padding:13px 22px;font-weight:700">${label}</a>`;
}

function layout(title: string, preview: string, body: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f6f6f6;color:#111;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f6f6f6">
      <tr>
        <td align="center" style="padding:28px 12px">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:680px;background:#fff;border-radius:22px;overflow:hidden">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #eee">
                <img src="${logoUrl}" alt="Podscentra logo" style="height:48px;width:auto;display:block" />
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px">${body}</td>
            </tr>
            <tr>
              <td style="padding:24px 28px;background:#111;color:#fff">
                <p style="margin:0 0 8px;font-weight:700">Need help?</p>
                <p style="margin:0 0 14px;color:#ddd">Call ${supportPhone} or email <a href="mailto:${supportEmail}" style="color:#fff">${supportEmail}</a>.</p>
                <p style="margin:0;color:#bbb;font-size:12px;line-height:1.7">
                  Podscentra | <a href="${siteUrl}/privacy-policy" style="color:#fff">Privacy Policy</a> |
                  <a href="${siteUrl}/terms-and-conditions" style="color:#fff">Terms</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function orderRows(order: SerializedOrder) {
  return order.items
    .map(
      (item) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee">
          <p style="margin:0;font-weight:700">${escapeHtml(item.name)}</p>
          <p style="margin:4px 0 0;color:#666;font-size:13px">${item.size ? `Size: ${escapeHtml(item.size)} ` : ""}${item.sku ? `SKU: ${escapeHtml(item.sku)}` : ""}</p>
        </td>
        <td align="center" style="padding:12px 0;border-bottom:1px solid #eee">${item.quantity}</td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #eee">${money(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");
}

function orderSummary(order: SerializedOrder) {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;border-collapse:collapse">
    <thead>
      <tr>
        <th align="left" style="padding-bottom:10px;border-bottom:1px solid #ddd">Product</th>
        <th align="center" style="padding-bottom:10px;border-bottom:1px solid #ddd">Qty</th>
        <th align="right" style="padding-bottom:10px;border-bottom:1px solid #ddd">Price</th>
      </tr>
    </thead>
    <tbody>${orderRows(order)}</tbody>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px">
    <tr><td>Subtotal</td><td align="right">${money(order.subtotal)}</td></tr>
    <tr><td style="padding-top:8px">Delivery</td><td align="right" style="padding-top:8px">${money(order.deliveryCharge)}</td></tr>
    <tr><td style="padding-top:8px">Tax</td><td align="right" style="padding-top:8px">${money(order.tax)}</td></tr>
    <tr><td style="padding-top:8px">Discount</td><td align="right" style="padding-top:8px">-${money(order.discount)}</td></tr>
    <tr><td style="padding-top:14px;font-size:18px;font-weight:800;border-top:1px solid #eee">Total</td><td align="right" style="padding-top:14px;font-size:18px;font-weight:800;border-top:1px solid #eee">${money(order.finalAmount)}</td></tr>
  </table>`;
}

function orderMeta(order: SerializedOrder) {
  return `<div style="margin-top:18px;padding:16px;border-radius:16px;background:#fafafa">
    <p style="margin:0 0 8px"><b>Order ID:</b> ${escapeHtml(order.id)}</p>
    <p style="margin:0 0 8px"><b>Customer:</b> ${escapeHtml(order.customerName)}</p>
    <p style="margin:0 0 8px"><b>Shipping address:</b> ${escapeHtml(order.fullAddress)}</p>
    <p style="margin:0 0 8px"><b>Estimated delivery:</b> ${escapeHtml(order.deliveryTime)}</p>
    <p style="margin:0"><b>Payment method:</b> ${escapeHtml(order.paymentMethod)}</p>
  </div>`;
}

export function orderConfirmationTemplate(order: SerializedOrder) {
  return layout(
    "Order Confirmed - Podscentra",
    `Your Podscentra order ${order.id} is confirmed.`,
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Order confirmed</h1>
    <p style="margin:0;color:#555;line-height:1.7">Hi ${escapeHtml(order.customerName)}, your order has been confirmed. We will notify you as it moves through packing and delivery.</p>
    ${orderMeta(order)}
    ${orderSummary(order)}
    <p style="margin:24px 0 0">${button("View order", `${siteUrl}/order-success?orderId=${encodeURIComponent(order.id)}`)}</p>`
  );
}

export function paymentSuccessfulTemplate(order: SerializedOrder) {
  return layout(
    "Payment Successful - Podscentra",
    `Payment received for order ${order.id}.`,
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Payment successful</h1>
    <p style="margin:0;color:#555;line-height:1.7">We received your payment of <b>${money(order.finalAmount)}</b> for order <b>${escapeHtml(order.id)}</b>.</p>
    ${orderMeta(order)}
    ${orderSummary(order)}`
  );
}

export function fulfillmentTemplate(order: SerializedOrder, status: string) {
  const shipped = status === "Shipped";
  const delivered = status === "Delivered";
  const outForDelivery = status === "Out for Delivery";
  const packed = status === "Packed";
  const returned = status === "Returned";
  const headline = returned ? "Return approved" : delivered ? "Order delivered" : outForDelivery ? "Your order is out for delivery" : shipped ? "Your order has shipped" : "Your order has been packed";
  const tracking = shipped
    ? `<div style="margin-top:18px;padding:16px;border-radius:16px;background:#fafafa">
        <p style="margin:0 0 8px"><b>Courier:</b> ${escapeHtml(order.courierName || "To be updated")}</p>
        <p style="margin:0 0 8px"><b>Tracking number:</b> ${escapeHtml(order.trackingNumber || "To be updated")}</p>
        <p style="margin:0 0 8px"><b>Tracking link:</b> ${
          order.trackingNumber
            ? `<a href="https://www.google.com/search?q=${encodeURIComponent(`${order.courierName || ""} ${order.trackingNumber} tracking`)}" style="color:#111">Track shipment</a>`
            : "To be updated"
        }</p>
        <p style="margin:0"><b>Expected delivery:</b> ${escapeHtml(order.deliveryTime)}</p>
      </div>`
    : "";
  const message = returned
    ? "Your return request has been approved. Our support team will share pickup or return instructions if required."
    : delivered
      ? "Your order has been delivered. We hope you love it. Please take a moment to review your product."
      : outForDelivery
        ? "Your order is out for delivery today."
        : shipped
          ? "Your order has left our facility and is on the way."
          : packed
            ? "Your order has been packed and is being prepared for dispatch."
            : `Your order status is now ${escapeHtml(status)}.`;

  return layout(
    `${headline} - Podscentra`,
    `${headline} for order ${order.id}.`,
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">${headline}</h1>
    <p style="margin:0;color:#555;line-height:1.7">${message}</p>
    ${tracking}
    ${orderMeta(order)}
    ${delivered ? `<p style="margin:24px 0 0">${button("Review product", `${siteUrl}/shop`)}</p>` : ""}`
  );
}

export function orderCancelledTemplate(order: SerializedOrder) {
  return layout(
    "Order Cancelled - Podscentra",
    `Order ${order.id} has been cancelled.`,
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Order cancelled</h1>
    <p style="margin:0;color:#555;line-height:1.7">Your order <b>${escapeHtml(order.id)}</b> has been cancelled. If any payment was captured, refund handling will follow the applicable policy.</p>
    ${orderMeta(order)}`
  );
}

export function refundProcessedTemplate(order: SerializedOrder) {
  return layout(
    "Refund Processed - Podscentra",
    `Refund processed for order ${order.id}.`,
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Refund processed</h1>
    <p style="margin:0;color:#555;line-height:1.7">A refund has been marked as processed for order <b>${escapeHtml(order.id)}</b>. Bank or payment provider timelines may apply.</p>
    ${orderMeta(order)}`
  );
}

export function contactConfirmationTemplate(contact: ContactMessage) {
  return layout(
    "We received your message - Podscentra",
    "Podscentra support received your message.",
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">We received your message</h1>
    <p style="margin:0;color:#555;line-height:1.7">Hi ${escapeHtml(contact.name)}, thanks for contacting Podscentra. Our support team will respond during business hours.</p>
    <div style="margin-top:18px;padding:16px;border-radius:16px;background:#fafafa">
      <p style="margin:0 0 8px"><b>Your email:</b> ${escapeHtml(contact.email)}</p>
      <p style="margin:0 0 8px"><b>Your phone:</b> ${escapeHtml(contact.phone || "Not provided")}</p>
      <p style="margin:0"><b>Message:</b> ${escapeHtml(contact.message)}</p>
    </div>`
  );
}

export function adminContactAlertTemplate(contact: ContactMessage) {
  return layout(
    "New Contact Message - Podscentra",
    `New message from ${contact.name}.`,
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">New contact message</h1>
    <div style="padding:16px;border-radius:16px;background:#fafafa">
      <p style="margin:0 0 8px"><b>Name:</b> ${escapeHtml(contact.name)}</p>
      <p style="margin:0 0 8px"><b>Email:</b> ${escapeHtml(contact.email)}</p>
      <p style="margin:0 0 8px"><b>Phone:</b> ${escapeHtml(contact.phone || "Not provided")}</p>
      <p style="margin:0"><b>Message:</b> ${escapeHtml(contact.message)}</p>
    </div>`
  );
}

export function adminNewOrderAlertTemplate(order: SerializedOrder) {
  return layout(
    "New Order Alert - Podscentra",
    `New order ${order.id}.`,
    `<h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">New order received</h1>
    ${orderMeta(order)}
    ${orderSummary(order)}`
  );
}
