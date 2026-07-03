import { OrderStatus, Prisma } from "@/lib/generated/prisma/client";
import { orderInclude, serializeOrder } from "@/lib/checkout-db";
import { resolveDateRange } from "@/lib/date-range";
import { prisma } from "@/lib/prisma";

export function orderWhereForView(view: string): Prisma.OrderWhereInput {
  const notDeleted = { deletedAt: null };

  switch (view) {
    case "all":
      return notDeleted;
    case "paid":
      return { ...notDeleted, OR: [{ status: OrderStatus.Paid }, { paymentStatus: "Paid" }] };
    case "cod":
      return { ...notDeleted, paymentStatus: "COD_PENDING" };
    case "confirmed":
      return {
        ...notDeleted,
        status: OrderStatus.Confirmed,
        paymentStatus: { notIn: ["Pending", "Failed", "Cancelled"] }
      };
    case "pending":
      return {
        ...notDeleted,
        OR: [{ status: OrderStatus.New }, { paymentStatus: { in: ["Pending", "PENDING_PAYMENT"] } }]
      };
    case "failed":
      return {
        ...notDeleted,
        OR: [{ status: OrderStatus.Cancelled }, { paymentStatus: { in: ["Failed", "Cancelled"] } }]
      };
    case "real":
    default:
      return {
        ...notDeleted,
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

export async function listAdminOrders(url: URL) {
  const view = url.searchParams.get("view") || "real";
  const range = resolveDateRange(url);
  const orders = await prisma.order.findMany({
    where: {
      ...orderWhereForView(view),
      createdAt: { gte: range.from, lt: range.to }
    },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(200, Number(url.searchParams.get("limit") || 100))
  });

  return orders.map(serializeOrder);
}

export function orderUpdateData(body: Record<string, unknown>): Prisma.OrderUpdateInput {
  const data: Prisma.OrderUpdateInput = {};
  const now = new Date();
  const fulfillment = String(body.fulfillmentStatus || "");
  const orderStatus = String(body.orderStatus || "");
  const paymentStatus = String(body.paymentStatus || "");

  if (fulfillment) {
    data.fulfillmentStatus = fulfillment;
    if (fulfillment === "Packed") data.packedAt = now;
    if (fulfillment === "Shipped") data.shippedAt = now;
    if (fulfillment === "Out for Delivery") data.outForDeliveryAt = now;
    if (fulfillment === "Delivered") data.deliveredAt = now;
    if (fulfillment === "Returned") data.status = OrderStatus.Returned;
  }

  if (orderStatus === "Confirmed") data.status = OrderStatus.Confirmed;
  if (orderStatus === "Cancelled") {
    data.status = OrderStatus.Cancelled;
    data.cancelledAt = now;
    data.paymentStatus = "Cancelled";
  }
  if (orderStatus === "Refunded") {
    data.status = OrderStatus.Refunded;
    data.refundedAt = now;
    data.paymentStatus = "Refunded";
  }

  if (paymentStatus) {
    data.paymentStatus = paymentStatus;
    if (paymentStatus === "PAID" || paymentStatus === "Paid") data.paymentStatus = "Paid";
    if (paymentStatus === "REFUNDED" || paymentStatus === "Refunded") {
      data.paymentStatus = "Refunded";
      data.refundedAt = now;
      data.status = OrderStatus.Refunded;
    }
    if (paymentStatus === "FAILED" || paymentStatus === "Failed") data.paymentStatus = "Failed";
    if (paymentStatus === "COD_PENDING") data.paymentStatus = "COD_PENDING";
  }

  if ("trackingNumber" in body) data.trackingNumber = String(body.trackingNumber || "");
  if ("courierName" in body) data.courierName = String(body.courierName || "");
  if ("adminNotes" in body) data.adminNotes = String(body.adminNotes || "");

  return data;
}

export async function applyBulkOrderAction(action: string, ids: string[]) {
  const now = new Date();
  const where = { id: { in: ids } };

  if (action === "mark_shipped") {
    return prisma.order.updateMany({ where, data: { fulfillmentStatus: "Shipped", shippedAt: now } });
  }
  if (action === "cancel") {
    return prisma.order.updateMany({ where, data: { status: OrderStatus.Cancelled, paymentStatus: "Cancelled", cancelledAt: now } });
  }
  if (action === "refund") {
    await prisma.payment.updateMany({ where: { orderId: { in: ids } }, data: { status: "Refunded", rawStatus: "MANUAL_REFUND", paidAt: undefined } });
    return prisma.order.updateMany({ where, data: { status: OrderStatus.Refunded, paymentStatus: "Refunded", refundedAt: now } });
  }
  if (action === "delete") {
    return prisma.order.updateMany({ where, data: { deletedAt: now } });
  }

  throw new Error("Unsupported order action.");
}
