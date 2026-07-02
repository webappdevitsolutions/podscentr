import crypto from "node:crypto";
import { assertServerEnv } from "@/lib/env";

const razorpayOrdersUrl = "https://api.razorpay.com/v1/orders";

function razorpayAuthHeader() {
  assertServerEnv(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]);
  const credentials = `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

export function amountToPaise(amount: number) {
  return Math.round(Math.max(0, Number(amount || 0)) * 100);
}

export type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
};

export async function createRazorpayOrder(input: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}) {
  assertServerEnv(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID"]);
  const amount = amountToPaise(input.amount);

  if (amount <= 0) {
    throw new Error("Order amount must be greater than zero.");
  }

  const response = await fetch(razorpayOrdersUrl, {
    method: "POST",
    headers: {
      Authorization: razorpayAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: input.orderId,
      notes: {
        orderId: input.orderId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone
      }
    })
  });

  const result = (await response.json().catch(() => ({}))) as RazorpayOrderResponse & { error?: { description?: string }; message?: string };

  if (!response.ok || !result.id) {
    throw new Error(result.error?.description || result.message || "Razorpay order creation failed.");
  }

  return result;
}

export function verifyRazorpaySignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  assertServerEnv(["RAZORPAY_KEY_SECRET"]);
  const body = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(body).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.razorpaySignature));
  } catch {
    return false;
  }
}
