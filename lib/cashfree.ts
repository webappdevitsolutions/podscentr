import { assertServerEnv } from "@/lib/env";

const cashfreeApiVersion = "2025-01-01";
const safeIdPattern = /^[A-Za-z0-9_-]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const indianMobilePattern = /^[6-9]\d{9}$/;

export function cashfreeEnvironment() {
  const env = (process.env.CASHFREE_ENV || "SANDBOX").trim().toUpperCase();
  return env === "PRODUCTION" || env === "PROD" || env === "LIVE" ? "PRODUCTION" : "SANDBOX";
}

function cashfreeBaseUrl() {
  return cashfreeEnvironment() === "PRODUCTION"
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

export function toCashfreeOrderId(value: string) {
  const safeId = value
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  return safeId || `order_${Date.now()}`;
}

export class CashfreeOrderError extends Error {
  details: string;
  status?: number;
  body?: unknown;

  constructor(message: string, options?: { status?: number; body?: unknown }) {
    super(message);
    this.name = "CashfreeOrderError";
    this.details = message;
    this.status = options?.status;
    this.body = options?.body;
  }
}

function validateCashfreePayload(payload: {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_email: string;
    customer_phone: string;
  };
}) {
  const errors: string[] = [];

  if (!safeIdPattern.test(payload.order_id)) errors.push("Cashfree order_id must contain only letters, numbers, underscores, or hyphens.");
  if (!safeIdPattern.test(payload.customer_details.customer_id)) errors.push("Cashfree customer_id must contain only letters, numbers, underscores, or hyphens.");
  if (!indianMobilePattern.test(payload.customer_details.customer_phone)) errors.push("Please enter a valid 10-digit phone number.");
  if (!emailPattern.test(payload.customer_details.customer_email)) errors.push("Email is invalid.");
  if (!(payload.order_amount > 0)) errors.push("Order amount must be greater than 0.");
  if (payload.order_currency !== "INR") errors.push("Order currency must be INR.");

  return errors;
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
  const cashfreeOrderId = toCashfreeOrderId(input.orderId);
  const cashfreeCustomerId = toCashfreeCustomerId(input.customer.id);
  const requestBody = {
    order_id: cashfreeOrderId,
    order_amount: Number(input.amount.toFixed(2)),
    order_currency: "INR",
    customer_details: {
      customer_id: cashfreeCustomerId,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone
    },
    order_meta: {
      return_url: input.returnUrl
    },
    order_note: input.note || "Podscentra order"
  };
  const validationErrors = validateCashfreePayload(requestBody);

  if (validationErrors.length) {
    throw new CashfreeOrderError(validationErrors.join(" "));
  }

  console.info("Cashfree order request", {
    emailPresent: Boolean(input.customer.email),
    phoneLength: input.customer.phone.length,
    orderAmount: requestBody.order_amount,
    orderId: requestBody.order_id,
    customerId: requestBody.customer_details.customer_id,
    cashfreeEnv: cashfreeEnvironment()
  });

  const response = await fetch(`${cashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(),
    body: JSON.stringify(requestBody)
  });

  const responseText = await response.text();
  let result: CashfreeCreateOrderResponse & { message?: string; error?: string };
  try {
    result = JSON.parse(responseText) as CashfreeCreateOrderResponse & { message?: string; error?: string };
  } catch {
    result = { order_id: cashfreeOrderId, payment_session_id: "", message: responseText };
  }

  console.info("Cashfree order response", {
    status: response.status,
    ok: response.ok,
    body: result
  });

  if (!response.ok) {
    const message = result.message || result.error || "Cashfree order creation failed.";
    throw new CashfreeOrderError(message, { status: response.status, body: result });
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
