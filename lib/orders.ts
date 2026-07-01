import { type CartItem } from "@/hooks/useCart";

export type PaymentMethod = "Online Payment" | "Cash on Delivery";
export type DeliveryMethodId = "standard" | "express";

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
  cashfreeOrderId: string;
  cashfreePaymentId: string;
  deliveryMethod: "Standard Delivery" | "Express Delivery";
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
    "Online Payment": 49,
    "Cash on Delivery": 100
  },
  express: {
    "Online Payment": 99,
    "Cash on Delivery": 150
  }
};

export const deliveryMethodDetails: Record<DeliveryMethodId, { title: SavedOrder["deliveryMethod"]; time: string }> = {
  standard: {
    title: "Standard Delivery",
    time: "3-5 Business Days"
  },
  express: {
    title: "Express Delivery",
    time: "1-2 Business Days"
  }
};

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
