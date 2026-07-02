import { type CartItem } from "@/hooks/useCart";

export type PaymentMethod = "Online Payment" | "Cash on Delivery";
export type DeliveryMethodId = "standard";

export type SavedOrder = {
  id: string;
  date: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  fullAddress: string;
  paymentMethod: string;
  paymentGateway: string;
  paymentStatus: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  deliveryMethod: "Standard Delivery";
  deliveryTime: string;
  deliveryCharge: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  finalAmount: number;
  orderStatus: string;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    quantity: number;
    price: number;
    size?: string | null;
    color?: string | null;
  }>;
};

export const deliveryChargeTable: Record<DeliveryMethodId, Record<PaymentMethod, number>> = {
  standard: {
    "Online Payment": 0,
    "Cash on Delivery": 49
  }
};

export const deliveryMethodDetails: Record<DeliveryMethodId, { title: SavedOrder["deliveryMethod"]; time: string }> = {
  standard: {
    title: "Standard Delivery",
    time: "3-5 Business Days"
  }
};

export const realOrderStatuses = ["Confirmed", "Paid", "COD_PENDING"] as const;
export const pendingOrderStatuses = ["New", "Pending", "PENDING_PAYMENT"] as const;
export const failedOrderStatuses = ["Cancelled", "Failed", "FAILED", "CANCELLED"] as const;

export function isRealOrder(order: Pick<SavedOrder, "orderStatus" | "paymentStatus">) {
  return (
    order.paymentStatus === "Paid" ||
    order.paymentStatus === "COD_PENDING" ||
    order.orderStatus === "Paid" ||
    (order.orderStatus === "Confirmed" && !["Pending", "Failed", "Cancelled"].includes(order.paymentStatus))
  );
}

export function isPendingPaymentOrder(order: Pick<SavedOrder, "orderStatus" | "paymentStatus">) {
  return order.orderStatus === "New" || order.paymentStatus === "Pending" || order.paymentStatus === "PENDING_PAYMENT";
}

export function isFailedOrCancelledOrder(order: Pick<SavedOrder, "orderStatus" | "paymentStatus">) {
  return order.orderStatus === "Cancelled" || order.paymentStatus === "Failed" || order.paymentStatus === "Cancelled";
}

export function toOrderItems(items: CartItem[]): SavedOrder["items"] {
  return items.map((item) => ({
    id: item.id,
    productId: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.product.price,
    size: item.size,
    color: item.color
  }));
}
