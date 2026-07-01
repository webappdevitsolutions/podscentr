import { assertServerEnv } from "@/lib/env";

const cashfreeApiVersion = "2025-01-01";

function cashfreeBaseUrl() {
  const env = (process.env.CASHFREE_ENV || "").toLowerCase();
  return env === "production" || env === "prod" || env === "live"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeHeaders() {
  assertServerEnv(["CASHFREE_APP_ID", "CASHFREE_SECRET_KEY", "CASHFREE_ENV"]);

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-api-version": cashfreeApiVersion,
    "x-client-id": process.env.CASHFREE_APP_ID || "",
    "x-client-secret": process.env.CASHFREE_SECRET_KEY || ""
  };
}

export function toCashfreeCustomerId(value?: string | null) {
  const safeId = (value || `customer_${Date.now()}`)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  return safeId || `customer_${Date.now()}`;
}

export type CashfreeCreateOrderResponse = {
  cf_order_id?: string;
  order_id: string;
  payment_session_id: string;
  order_status?: string;
  order_amount?: number;
};

export type CashfreeOrderResponse = {
  cf_order_id?: string;
  order_id: string;
  order_status: string;
  order_amount?: number;
};

export type CashfreePaymentResponse = {
  cf_payment_id?: string;
  payment_status?: string;
  order_id?: string;
  payment_amount?: number;
};

export async function createCashfreeOrder(input: {
  orderId: string;
  amount: number;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  returnUrl: string;
  note?: string;
}) {
  const response = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: toCashfreeCustomerId(input.customer.id),
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone
      },
      order_meta: {
        return_url: input.returnUrl
      },
      order_note: input.note || "Podscentra order"
    })
  });

  const result = (await response.json()) as CashfreeCreateOrderResponse & { message?: string; error?: string };
  if (!response.ok) {
    console.error("Cashfree order API failed", {
      status: response.status,
      statusText: response.statusText,
      result
    });
    throw new Error(result.message || result.error || "Cashfree order creation failed.");
  }

  return result;
}

export async function fetchCashfreeOrder(orderId: string) {
  const response = await fetch(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: cashfreeHeaders(),
    cache: "no-store"
  });

  const result = (await response.json()) as CashfreeOrderResponse & { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(result.message || result.error || "Cashfree order verification failed.");
  }

  return result;
}

export async function fetchCashfreePayments(orderId: string) {
  const response = await fetch(`${cashfreeBaseUrl()}/orders/${encodeURIComponent(orderId)}/payments`, {
    method: "GET",
    headers: cashfreeHeaders(),
    cache: "no-store"
  });

  const result = (await response.json()) as CashfreePaymentResponse[] | { message?: string; error?: string };
  if (!response.ok) {
    throw new Error(!Array.isArray(result) ? result.message || result.error || "Cashfree payment lookup failed." : "Cashfree payment lookup failed.");
  }

  return Array.isArray(result) ? result : [];
}
