"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { PackageCheck, Smartphone, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LinkButton } from "@/components/Button";
import { useCart } from "@/hooks/useCart";
import { trackMetaEvent } from "@/lib/meta-client";
import { deliveryChargeTable, deliveryMethodDetails, type DeliveryMethodId, type PaymentMethod } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

const paymentMethods: Array<{ Icon: typeof Smartphone; label: PaymentMethod }> = [
  { Icon: Smartphone, label: "Online Payment" },
  { Icon: PackageCheck, label: "Cash on Delivery" }
];

const deliveryMethods = [
  { id: "standard", title: "Standard Delivery" },
  { id: "express", title: "Express Delivery" }
];

type RazorpayScriptStatus = "loading" | "ready" | "failed";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: "payment.failed", callback: (response: unknown) => void) => void;
    };
  }
}

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
};

const indianStates = ["Delhi", "Maharashtra", "Uttar Pradesh", "Karnataka", "Gujarat", "Tamil Nadu", "Rajasthan", "West Bengal", "Telangana", "Kerala"];

type ShippingAddress = {
  country: string;
  fullName: string;
  phone: string;
  email: string;
  pinCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
};

type AddressErrors = Partial<Record<keyof ShippingAddress, string>>;

const initialAddress: ShippingAddress = {
  country: "India",
  fullName: "",
  phone: "",
  email: "",
  pinCode: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: ""
};

function validateAddress(address: ShippingAddress) {
  const errors: AddressErrors = {};

  if (!address.country) errors.country = "Country is required";
  if (!address.fullName.trim()) errors.fullName = "Full name is required";
  if (!address.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^[6-9]\d{9}$/.test(address.phone)) errors.phone = "Please enter a valid 10-digit phone number.";
  if (!address.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) errors.email = "Enter a valid email address";
  if (!/^\d{6}$/.test(address.pinCode)) errors.pinCode = "PIN code must be 6 digits";
  if (!address.addressLine1.trim()) errors.addressLine1 = "Address line 1 is required";
  if (!address.city.trim()) errors.city = "City is required";
  if (!address.state) errors.state = "State is required";

  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, isReady } = useCart();
  const redirectedForEmptyCart = useRef(false);
  const trackedInitiateCheckout = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Online Payment");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>("standard");
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [addressTouched, setAddressTouched] = useState<Partial<Record<keyof ShippingAddress, boolean>>>({});
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isOrderCreating, setIsOrderCreating] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [razorpayScriptStatus, setRazorpayScriptStatus] = useState<RazorpayScriptStatus>("loading");
  const activePaymentRequest = useRef(false);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = deliveryChargeTable[deliveryMethod][paymentMethod];
  const selectedDelivery = deliveryMethodDetails[deliveryMethod];
  const tax = 0;
  const discount = 0;
  const total = Math.max(0, subtotal + deliveryCharge + tax - discount);
  const addressErrors = useMemo(() => validateAddress(address), [address]);
  const cartHydrating = !isReady;
  const canPlaceOrder =
    isReady &&
    items.length > 0 &&
    Object.keys(addressErrors).length === 0 &&
    Boolean(paymentMethod) &&
    !isPaymentProcessing &&
    !isOrderCreating;
  const contentIds = useMemo(() => items.map((item) => item.product.id), [items]);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isCheckoutBusy = isPaymentProcessing || isOrderCreating;

  const checkoutPayload = useMemo(
    () => ({
      customer: {
        name: address.fullName,
        email: address.email,
        phone: address.phone
      },
      shippingAddress: {
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pinCode: address.pinCode,
        country: address.country
      },
      cart: items.map((item) => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        size: item.size,
        color: item.color
      })),
      paymentMethod,
      deliveryMethod,
      tax,
      discount
    }),
    [address, deliveryMethod, discount, items, paymentMethod, tax]
  );

  function markAllAddressTouched() {
    setAddressTouched({
      country: true,
      fullName: true,
      phone: true,
      email: true,
      pinCode: true,
      addressLine1: true,
      city: true,
      state: true
    });
  }

  async function createCodOrder() {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not place COD order.");
    }

    return result.order?.id as string | undefined;
  }

  async function createRazorpayOrder() {
    const response = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload)
    });
    const result = await response.json();

    if (!response.ok || !result.razorpayOrderId || !result.orderId || !result.key) {
      throw new Error(result.error || "Payment could not be started. Please check your details and try again.");
    }

    console.info("Razorpay order created", {
      orderId: result.orderId,
      razorpayOrderId: result.razorpayOrderId
    });

    return result as { orderId: string; razorpayOrderId: string; amount: number; currency: string; key: string };
  }

  async function verifyRazorpayPayment(orderId: string, payment: RazorpayCheckoutResponse) {
    const response = await fetch("/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...payment })
    });
    const result = await response.json();

    if (!response.ok || !result.verified) {
      throw new Error(result.error || "Payment verification failed.");
    }

    return true;
  }

  async function waitForRazorpaySdk() {
    if (window.Razorpay) {
      setRazorpayScriptStatus("ready");
      return;
    }

    await new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (window.Razorpay) {
          window.clearInterval(timer);
          setRazorpayScriptStatus("ready");
          resolve();
          return;
        }
        if (attempts >= 32) {
          window.clearInterval(timer);
          reject(new Error("Payment gateway is still loading. Please try again in a moment."));
        }
      }, 250);
    });
  }

  async function openRazorpayCheckout(order: { orderId: string; razorpayOrderId: string; amount: number; currency: string; key: string }) {
    setIsPaymentProcessing(true);
    await waitForRazorpaySdk();

    if (!window.Razorpay) {
      throw new Error("Payment gateway is still loading. Please try again in a moment.");
    }

    const Razorpay = window.Razorpay;

    return new Promise<"verified" | "dismissed">((resolve, reject) => {
      const razorpay = new Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "Podscentra",
        description: `Order ${order.orderId}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone
        },
        theme: {
          color: "#7c3aed"
        },
        modal: {
          ondismiss: () => resolve("dismissed")
        },
        handler: (response) => {
          verifyRazorpayPayment(order.orderId, response)
            .then(() => resolve("verified"))
            .catch(() => reject(new Error("Payment verification failed.")));
        }
      });

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed", response);
        reject(new Error("Payment failed. Your cart is still saved."));
      });

      razorpay.open();
    });
  }

  async function handlePlaceOrder() {
    setPaymentError("");
    markAllAddressTouched();

    if (!canPlaceOrder) return;

    activePaymentRequest.current = true;
    setIsOrderCreating(true);
    try {
      void trackMetaEvent(
        "AddPaymentInfo",
        {
          content_ids: contentIds,
          content_type: "product",
          value: total,
          currency: "INR",
          num_items: itemCount,
          payment_method: paymentMethod
        },
        {
          customer: {
            email: address.email,
            phone: address.phone
          }
        }
      );

      if (paymentMethod === "Cash on Delivery") {
        const orderId = await createCodOrder();
        redirectedForEmptyCart.current = true;
        clearCart();
        router.push(`/order-success${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`);
        return;
      }

      const razorpayOrder = await createRazorpayOrder();
      setIsOrderCreating(false);
      const checkoutResult = await openRazorpayCheckout(razorpayOrder);

      if (checkoutResult === "dismissed") {
        setPaymentError("Payment window closed. Your cart is still saved.");
        return;
      }

      redirectedForEmptyCart.current = true;
      clearCart();
      router.push(`/order-success?orderId=${encodeURIComponent(razorpayOrder.orderId)}`);
    } catch (error) {
      console.error("Checkout error:", error);
      setPaymentError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      activePaymentRequest.current = false;
      setIsOrderCreating(false);
      setIsPaymentProcessing(false);
    }
  }

  useEffect(() => {
    if (isCheckoutBusy) return;
    if (!isReady || items.length > 0 || redirectedForEmptyCart.current) return;
    redirectedForEmptyCart.current = true;
    sessionStorage.setItem("podscentra-cart-message", "Your cart is empty");
    router.replace("/cart");
  }, [isCheckoutBusy, isReady, items.length, router]);

  useEffect(() => {
    activePaymentRequest.current = false;
    setIsOrderCreating(false);
    setIsPaymentProcessing(false);
    setPaymentError("");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayScriptStatus("ready");
    }
  }, []);

  useEffect(() => {
    if (!isPaymentProcessing) return;

    const timer = window.setTimeout(() => {
      if (activePaymentRequest.current) return;
      setIsPaymentProcessing(false);
      setPaymentError("Payment could not be started. Please try again.");
    }, 15000);

    return () => window.clearTimeout(timer);
  }, [isPaymentProcessing]);

  useEffect(() => {
    if (!isReady || !items.length || trackedInitiateCheckout.current) return;
    trackedInitiateCheckout.current = true;
    void trackMetaEvent("InitiateCheckout", {
      content_ids: contentIds,
      content_type: "product",
      value: total,
      currency: "INR",
      num_items: itemCount
    });
  }, [contentIds, isReady, itemCount, items.length, total]);

  function setAddressField(field: keyof ShippingAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  function markAddressTouched(field: keyof ShippingAddress) {
    setAddressTouched((current) => ({ ...current, [field]: true }));
  }

  function shouldShowAddressError(field: keyof ShippingAddress) {
    const hasTypedValue = Boolean(address[field]);
    const validatesWhileTyping = field === "phone" || field === "pinCode" || field === "email";
    return Boolean(addressErrors[field] && (addressTouched[field] || (validatesWhileTyping && hasTypedValue)));
  }

  function addressInputClass(field: keyof ShippingAddress) {
    const hasError = shouldShowAddressError(field);
    return `focus-ring min-h-12 rounded-2xl border bg-transparent px-4 ${
      hasError ? "border-red-500" : "border-black/10 dark:border-white/10"
    }`;
  }

  function addressError(field: keyof ShippingAddress) {
    return shouldShowAddressError(field) ? <p className="text-xs font-bold text-red-600">{addressErrors[field]}</p> : null;
  }

  function checkoutButtonLabel() {
    if (cartHydrating) return "Loading cart...";
    if (isOrderCreating) return "Creating order...";
    if (isPaymentProcessing) {
      return razorpayScriptStatus === "loading" ? "Preparing secure payment..." : "Processing payment...";
    }
    return paymentMethod === "Cash on Delivery" ? "Place order" : `Pay ${formatCurrency(total)}`;
  }

  if (!isReady) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-black">Loading cart...</h1>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Getting your items ready for checkout.</p>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-28 pt-12 sm:px-6 lg:grid-cols-[1fr_400px] lg:px-8 lg:pb-12">
      <div>
        <img src="/img/podcentalogo.png" alt="Podscentra logo" className="mb-5 h-12 w-auto max-w-[160px] object-contain" />
        <h1 className="text-5xl font-black">Checkout</h1>
        <div className="mt-6 grid gap-6">
          <div className="rounded-3xl bg-white p-6 dark:bg-white/5">
            <h2 className="text-2xl font-black">Contact and shipping</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <input value={address.fullName} onChange={(event) => setAddressField("fullName", event.target.value)} onBlur={() => markAddressTouched("fullName")} placeholder="Full name" className={addressInputClass("fullName")} />
                {addressError("fullName")}
              </div>
              <div className="grid gap-1">
                <input value={address.email} onChange={(event) => setAddressField("email", event.target.value)} onBlur={() => markAddressTouched("email")} type="email" placeholder="Email address" className={addressInputClass("email")} />
                {addressError("email")}
              </div>
              <div className="grid gap-1">
                <input value={address.phone} onChange={(event) => setAddressField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} onBlur={() => markAddressTouched("phone")} inputMode="numeric" placeholder="Phone number" className={addressInputClass("phone")} />
                {addressError("phone")}
              </div>
              <div className="grid gap-1">
                <input value={address.pinCode} onChange={(event) => setAddressField("pinCode", event.target.value.replace(/\D/g, "").slice(0, 6))} onBlur={() => markAddressTouched("pinCode")} inputMode="numeric" placeholder="PIN code" className={addressInputClass("pinCode")} />
                {addressError("pinCode")}
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <input value={address.addressLine1} onChange={(event) => setAddressField("addressLine1", event.target.value)} onBlur={() => markAddressTouched("addressLine1")} placeholder="Address line 1" className={addressInputClass("addressLine1")} />
                {addressError("addressLine1")}
              </div>
              <input value={address.addressLine2} onChange={(event) => setAddressField("addressLine2", event.target.value)} placeholder="Address line 2 (optional)" className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" />
              <div className="grid gap-1">
                <input value={address.city} onChange={(event) => setAddressField("city", event.target.value)} onBlur={() => markAddressTouched("city")} placeholder="City" className={addressInputClass("city")} />
                {addressError("city")}
              </div>
              <div className="grid gap-1">
                <select value={address.state} onChange={(event) => setAddressField("state", event.target.value)} onBlur={() => markAddressTouched("state")} className={addressInputClass("state")}>
                  <option value="">State</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {addressError("state")}
              </div>
              <div className="grid gap-1">
                <select value={address.country} onChange={(event) => setAddressField("country", event.target.value)} onBlur={() => markAddressTouched("country")} className={addressInputClass("country")}>
                  <option value="India">India</option>
                </select>
                {addressError("country")}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 dark:bg-white/5">
            <h2 className="text-2xl font-black">Delivery method</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {deliveryMethods.map(({ id, title }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDeliveryMethod(id as DeliveryMethodId)}
                  className={`focus-ring cursor-pointer rounded-2xl border p-4 text-left transition hover:border-accent dark:border-white/10 ${
                    deliveryMethod === id ? "border-accent bg-violet-50 shadow-lg shadow-violet-500/10 dark:bg-white/10" : "border-black/10"
                  }`}
                >
                  <Truck className="mb-3 text-accent" />
                  <p className="font-black">{title}</p>
                  <p className="text-sm text-neutral-500">{deliveryMethodDetails[id as DeliveryMethodId].time}</p>
                  <div className="mt-4 rounded-2xl bg-neutral-50 p-3 text-sm leading-6 dark:bg-white/5">
                    <p className="font-black">Delivery Charge</p>
                    <div className="mt-1 flex justify-between gap-3">
                      <span>Online Payment:</span>
                      <b>{formatCurrency(deliveryChargeTable[id as DeliveryMethodId]["Online Payment"])}</b>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Cash on Delivery:</span>
                      <b>{formatCurrency(deliveryChargeTable[id as DeliveryMethodId]["Cash on Delivery"])}</b>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 dark:bg-white/5">
            <h2 className="text-2xl font-black">Payment</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {paymentMethods.map(({ Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPaymentMethod(label)}
                  className={`focus-ring rounded-2xl border p-4 text-left font-bold transition hover:border-accent dark:border-white/10 ${
                    paymentMethod === label ? "border-accent bg-violet-50 text-accent dark:bg-white/10" : "border-black/10"
                  }`}
                >
                  <Icon className="mb-3 text-accent" /> {label}
                </button>
              ))}
            </div>
            {paymentMethod === "Online Payment" ? (
              <div className="mt-5 rounded-2xl border border-black/10 p-4 text-sm leading-6 text-neutral-500 transition dark:border-white/10 dark:text-neutral-400">
                Payments are securely processed by Razorpay. Podscentra never stores card, UPI or netbanking details.
              </div>
            ) : null}
            {paymentMethod === "Cash on Delivery" ? (
              <div className="mt-5 rounded-2xl border border-black/10 p-4 text-sm leading-6 text-neutral-500 transition dark:border-white/10 dark:text-neutral-400">
                Pay when your order arrives. COD delivery charges update automatically in the summary.
              </div>
            ) : null}
            {paymentError ? (
              <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-500/10">{paymentError}</p>
            ) : null}
            <p className="mt-4 text-sm font-bold text-neutral-600 dark:text-neutral-300">
              Need help? Contact us at <a className="text-accent" href="tel:+9101204217372">+91 0120 421 7372</a>.
            </p>
          </div>
        </div>
      </div>

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayScriptStatus("ready")}
        onError={(error) => {
          console.error("Razorpay SDK failed to load", error);
          activePaymentRequest.current = false;
          setRazorpayScriptStatus("failed");
          setIsOrderCreating(false);
          setIsPaymentProcessing(false);
          setPaymentError("Payment gateway could not load. Please refresh and try again.");
        }}
      />
      <aside className="h-fit rounded-3xl bg-white p-6 shadow-luxury dark:bg-white/5">
        <h2 className="text-2xl font-black">Order summary</h2>
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm">
              <span>{item.product.name} x {item.quantity}</span>
              <b>{formatCurrency(item.product.price * item.quantity)}</b>
            </div>
          ))}
        </div>
        <input placeholder="Promo code" className="focus-ring mt-5 min-h-12 w-full rounded-full border border-black/10 bg-transparent px-4 dark:border-white/10" />
        <div className="mt-5 grid gap-3 border-t border-black/10 pt-4 text-sm dark:border-white/10">
          <div className="flex justify-between"><span>Subtotal</span><b>{formatCurrency(subtotal)}</b></div>
          <div className="flex justify-between"><span>Delivery</span><b>{formatCurrency(deliveryCharge)}</b></div>
          <div className="flex justify-between"><span>Tax</span><b>{formatCurrency(tax)}</b></div>
          <div className="flex justify-between"><span>Discount</span><b>{discount ? `-${formatCurrency(discount)}` : formatCurrency(0)}</b></div>
          <div className="border-t border-black/10 pt-3 dark:border-white/10" />
          <div className="flex justify-between text-lg font-black"><span>Grand Total</span><b>{formatCurrency(total)}</b></div>
          <p className="text-xs text-neutral-400">{selectedDelivery.title}: {selectedDelivery.time}. Delivery updates automatically for {paymentMethod}.</p>
        </div>
        <button
          type="button"
          disabled={!canPlaceOrder}
          onClick={handlePlaceOrder}
          className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkoutButtonLabel()}
        </button>
        <LinkButton href="/cart" variant="ghost" className="mt-3 w-full">Back to cart</LinkButton>
        <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-xs leading-6 text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
          <p className="font-bold text-ink dark:text-white">Need help? Contact us at +91 0120 421 7372.</p>
          <p className="mt-1">Payments are securely processed by Razorpay. Podscentra never stores card, UPI or netbanking details.</p>
        </div>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink lg:hidden">
        <button
          type="button"
          disabled={!canPlaceOrder}
          onClick={handlePlaceOrder}
          className="focus-ring flex min-h-12 w-full items-center justify-center rounded-full bg-accent font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkoutButtonLabel()}
        </button>
      </div>
    </section>
  );
}
