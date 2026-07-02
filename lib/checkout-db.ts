import { OrderStatus, PaymentStatus, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { deliveryChargeTable, deliveryMethodDetails, type DeliveryMethodId, type PaymentMethod } from "@/lib/orders";

type CheckoutCartItem = {
  id?: string;
  productId: string;
  name?: string;
  quantity: number;
  price?: number;
  size?: string;
  color?: string;
};

export type CheckoutPayload = {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    country?: string;
  };
  cart: CheckoutCartItem[];
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethodId;
  discount?: number;
  tax?: number;
};

export type SerializedOrder = {
  id: string;
  date: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  fullAddress: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  paymentMethod: string;
  paymentGateway: string;
  paymentStatus: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  deliveryMethod: string;
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const indianMobilePattern = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(value?: string | null) {
  const compact = (value || "").trim().replace(/[\s-]/g, "");
  const withoutCountryCode = compact.replace(/^(\+91|91)/, "");
  return withoutCountryCode.replace(/\D/g, "");
}

export function makeDatabaseOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function validateCheckoutPayload(payload: CheckoutPayload) {
  const errors: string[] = [];
  const customer = payload.customer || {};
  const address = payload.shippingAddress || {};

  if (!customer.name?.trim()) errors.push("Name is required.");
  const normalizedPhone = normalizeIndianPhone(customer.phone);

  if (!customer.phone?.trim()) errors.push("Phone is required.");
  else if (!indianMobilePattern.test(normalizedPhone)) errors.push("Please enter a valid 10-digit phone number.");
  if (!customer.email?.trim()) errors.push("Email is required.");
  else if (!emailPattern.test(customer.email)) errors.push("Email is invalid.");
  if (!address.addressLine1?.trim()) errors.push("Address line 1 is required.");
  if (!address.city?.trim()) errors.push("City is required.");
  if (!address.state?.trim()) errors.push("State is required.");
  if (!address.pinCode?.trim()) errors.push("PIN code is required.");
  else if ((address.country || "India") === "India" && !/^\d{6}$/.test(address.pinCode)) {
    errors.push("PIN code must be 6 digits for India.");
  }
  if (!payload.cart?.length) errors.push("Cart is empty.");
  if (!payload.deliveryMethod || !deliveryChargeTable[payload.deliveryMethod]) errors.push("Delivery method is invalid.");
  if (!payload.paymentMethod || !["Online Payment", "Cash on Delivery"].includes(payload.paymentMethod)) {
    errors.push("Payment method is invalid.");
  }

  return errors;
}

export async function buildOrderAmounts(payload: CheckoutPayload) {
  const productIds = payload.cart.map((item) => item.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true }
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const items = payload.cart.map((item) => {
    const product = productMap.get(item.productId);
    const quantity = Math.max(1, Number(item.quantity || 1));
    const price = Number(product?.price ?? item.price ?? 0);
    return {
      id: item.id,
      productId: item.productId,
      name: product?.name || item.name || "Product",
      quantity,
      price,
      size: item.size,
      color: item.color
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharge = deliveryChargeTable[payload.deliveryMethod][payload.paymentMethod];
  const tax = Math.max(0, Number(payload.tax || 0));
  const discount = Math.max(0, Number(payload.discount || 0));
  const total = Math.max(0, subtotal + deliveryCharge + tax - discount);
  const selectedDelivery = deliveryMethodDetails[payload.deliveryMethod];

  return { items, subtotal, deliveryCharge, tax, discount, total, selectedDelivery };
}

export async function createCheckoutOrder(
  payload: CheckoutPayload,
  options: {
    id?: string;
    paymentMethodCode: "ONLINE" | "COD";
    paymentGateway: "RAZORPAY" | "COD";
    paymentStatus: "Pending" | "COD_PENDING" | "Paid" | "Failed";
    orderStatus: OrderStatus;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
  }
) {
  const errors = validateCheckoutPayload(payload);
  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  const { items, subtotal, deliveryCharge, tax, discount, total, selectedDelivery } = await buildOrderAmounts(payload);
  const address = payload.shippingAddress;
  const customer = payload.customer;
  const customerPhone = normalizeIndianPhone(customer.phone);
  const country = address.country || "India";
  const fullAddress = [address.addressLine1, address.addressLine2, address.city, address.state, address.pinCode, country]
    .filter(Boolean)
    .join(", ");

  const existingCustomer = await prisma.customer.findFirst({
    where: { email: customer.email }
  });
  const savedCustomer = existingCustomer
    ? await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: customer.name,
          phone: customerPhone,
          city: address.city
        }
      })
    : await prisma.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customerPhone,
        city: address.city
      }
    });

  const order = await prisma.order.create({
    data: {
      id: options.id || makeDatabaseOrderId(),
      customerId: savedCustomer.id,
      customerName: customer.name,
      customerMobile: customerPhone,
      customerEmail: customer.email,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      country,
      fullAddress,
      status: options.orderStatus,
      paymentMethod: options.paymentMethodCode,
      paymentGateway: options.paymentGateway,
      paymentStatus: options.paymentStatus,
      deliveryMethod: selectedDelivery.title,
      deliveryTime: selectedDelivery.time,
      deliveryCharge,
      subtotal,
      tax,
      discount,
      total,
      finalAmount: total,
      items: {
        create: items.map((item) => ({
          productId: item.productId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color
        }))
      },
      payment: {
        create: {
          method: options.paymentMethodCode,
          gateway: options.paymentGateway,
          amount: total,
          status:
            options.paymentStatus === "COD_PENDING"
              ? PaymentStatus.COD_PENDING
              : options.paymentStatus === "Paid"
                ? PaymentStatus.Paid
                : options.paymentStatus === "Failed"
                  ? PaymentStatus.Failed
                  : PaymentStatus.Pending,
          gatewayOrderId: options.gatewayOrderId,
          gatewayPaymentId: options.gatewayPaymentId,
          rawStatus: options.paymentStatus
        }
      }
    },
    include: orderInclude
  });

  if (options.paymentStatus === "Paid") {
    await prisma.customer.update({
      where: { id: savedCustomer.id },
      data: { totalSpent: { increment: total } }
    });
  }

  return order;
}

export const orderInclude = {
  items: true,
  payment: true,
  customer: true
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function serializeOrder(order: OrderWithRelations): SerializedOrder {
  return {
    id: order.id,
    date: order.createdAt.toISOString(),
    customerName: order.customerName,
    customerMobile: order.customerMobile,
    customerEmail: order.customerEmail,
    fullAddress: order.fullAddress,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    city: order.city,
    state: order.state,
    pinCode: order.pinCode,
    country: order.country,
    paymentMethod: order.paymentMethod,
    paymentGateway: order.paymentGateway,
    paymentStatus: order.paymentStatus,
    gatewayOrderId: order.payment?.gatewayOrderId || "",
    gatewayPaymentId: order.payment?.gatewayPaymentId || "",
    deliveryMethod: order.deliveryMethod,
    deliveryTime: order.deliveryTime,
    deliveryCharge: order.deliveryCharge,
    subtotal: order.subtotal,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    finalAmount: order.finalAmount,
    orderStatus: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId || "",
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color
    }))
  };
}
