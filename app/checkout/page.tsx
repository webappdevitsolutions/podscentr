"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { PackageCheck, Smartphone, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LinkButton } from "@/components/Button";
import { useCart } from "@/hooks/useCart";
import {
  deliveryChargeTable,
  deliveryMethodDetails,
  makeOrderId,
  saveOrder,
  toOrderItems,
  type DeliveryMethodId,
  type PaymentMethod
} from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

const paymentMethods: Array<{ Icon: typeof Smartphone; label: PaymentMethod }> = [
  { Icon: Smartphone, label: "Online Payment" },
  { Icon: PackageCheck, label: "Cash on Delivery" }
];

const deliveryMethods = [
  { id: "standard", title: "Standard Delivery", text: "3-5 business days", price: "Free over ₹999" },
  { id: "express", title: "Express Delivery", text: "1-2 business days", price: "₹99" }
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const indianStates = ["Delhi", "Maharashtra", "Uttar Pradesh", "Karnataka", "Gujarat", "Tamil Nadu", "Rajasthan", "West Bengal", "Telangana", "Kerala"];

type ShippingAddress = {
  country: string;
  fullName: string;
  mobile: string;
  email: string;
  pinCode: string;
  building: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  fullAddress: string;
};

type AddressErrors = Partial<Record<keyof ShippingAddress, string>>;

const initialAddress: ShippingAddress = {
  country: "India",
  fullName: "",
  mobile: "",
  email: "",
  pinCode: "",
  building: "",
  area: "",
  landmark: "",
  city: "",
  state: "",
  fullAddress: ""
};

function validateAddress(address: ShippingAddress) {
  const errors: AddressErrors = {};

  if (!address.country) errors.country = "Country is required";
  if (!address.fullName.trim()) errors.fullName = "Full name is required";
  if (!/^\d{10}$/.test(address.mobile)) errors.mobile = "Enter valid mobile number";
  if (!address.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) errors.email = "Enter valid email address";
  if (!/^\d{6}$/.test(address.pinCode)) errors.pinCode = "PIN code must be 6 digits";
  if (!address.building.trim()) errors.building = "Flat / house details are required";
  if (!address.area.trim()) errors.area = "Area / street is required";
  if (!address.city.trim()) errors.city = "Town / city is required";
  if (!address.state) errors.state = "State is required";
  if (!address.fullAddress.trim()) errors.fullAddress = "Full address is required";

  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, isReady } = useCart();
  const redirectedForEmptyCart = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Online Payment");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>("standard");
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [addressTouched, setAddressTouched] = useState<Partial<Record<keyof ShippingAddress, boolean>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = deliveryChargeTable[deliveryMethod][paymentMethod];
  const selectedDelivery = deliveryMethodDetails[deliveryMethod];
  const tax = 0;
  const discount = 0;
  const total = Math.max(0, subtotal + deliveryCharge + tax - discount);
  const addressErrors = useMemo(() => validateAddress(address), [address]);
  const canPlaceOrder = items.length > 0 && Object.keys(addressErrors).length === 0 && Boolean(paymentMethod) && !isProcessing;

  function createSavedOrder() {
    return {
      id: makeOrderId(),
      date: new Date().toISOString(),
      customerName: address.fullName,
      customerMobile: address.mobile,
      paymentMethod,
      deliveryMethod: selectedDelivery.title,
      deliveryTime: selectedDelivery.time,
      deliveryCharge,
      subtotal,
      tax,
      discount,
      total,
      finalAmount: total,
      items: toOrderItems(items)
    };
  }

  async function handlePlaceOrder() {
    setPaymentError("");

    if (paymentMethod === "Cash on Delivery") {
      saveOrder(createSavedOrder());
      clearCart();
      router.push("/order-success");
      return;
    }

    setIsProcessing(true);
    try {
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          notes: {
            customerName: address.fullName,
            mobile: address.mobile,
            paymentMethod,
            deliveryMethod: selectedDelivery.title,
            deliveryCharge,
            finalAmount: total
          }
        })
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.order) {
        setPaymentError(orderData.error || "Could not start payment. Please try again.");
        setIsProcessing(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: "INR",
        name: "Podscentra",
        description: "Order payment",
        order_id: orderData.order.id,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.mobile
        },
        theme: { color: "#7c3aed" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyResponse = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response)
          });
          const verifyData = await verifyResponse.json();

          if (verifyData.verified) {
            saveOrder(createSavedOrder());
            clearCart();
            router.push("/order-success");
          } else {
            setPaymentError("Payment could not be verified. If money was deducted, it will be refunded automatically.");
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => setIsProcessing(false)
        }
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      setPaymentError("Something went wrong starting payment. Please try again.");
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    if (!isReady || items.length > 0 || redirectedForEmptyCart.current) return;
    redirectedForEmptyCart.current = true;
    sessionStorage.setItem("podscentra-cart-message", "Your cart is empty");
    router.replace("/cart");
  }, [isReady, items.length, router]);

  function setAddressField(field: keyof ShippingAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  function markAddressTouched(field: keyof ShippingAddress) {
    setAddressTouched((current) => ({ ...current, [field]: true }));
  }

  function shouldShowAddressError(field: keyof ShippingAddress) {
    const hasTypedValue = Boolean(address[field]);
    const validatesWhileTyping = field === "mobile" || field === "pinCode" || field === "email";
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

  if (!isReady || items.length === 0) return null;

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-28 pt-12 sm:px-6 lg:grid-cols-[1fr_400px] lg:px-8 lg:pb-12">
      <div>
        <img src="/img/podcentalogo.png" alt="Podscentra logo" className="mb-5 h-12 w-auto max-w-[160px] object-contain" />
        <h1 className="text-5xl font-black">Checkout</h1>
        <div className="mt-6 grid gap-6">
          <div className="rounded-3xl bg-white p-6 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">Shipping address</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <select value={address.country} onChange={(event) => setAddressField("country", event.target.value)} onBlur={() => markAddressTouched("country")} className={addressInputClass("country")}>
                  <option value="India">India</option>
                </select>
                {addressError("country")}
              </div>
              <div className="grid gap-1">
                <input value={address.fullName} onChange={(event) => setAddressField("fullName", event.target.value)} onBlur={() => markAddressTouched("fullName")} placeholder="Full Name" className={addressInputClass("fullName")} />
                {addressError("fullName")}
              </div>
              <div className="grid gap-1">
                <input value={address.mobile} onChange={(event) => setAddressField("mobile", event.target.value.replace(/\D/g, "").slice(0, 10))} onBlur={() => markAddressTouched("mobile")} inputMode="numeric" placeholder="Mobile Number" className={addressInputClass("mobile")} />
                {addressError("mobile")}
              </div>
              <div className="grid gap-1">
                <input value={address.email} onChange={(event) => setAddressField("email", event.target.value)} onBlur={() => markAddressTouched("email")} type="email" placeholder="Email Address" className={addressInputClass("email")} />
                {addressError("email")}
              </div>
              <div className="grid gap-1">
                <input value={address.pinCode} onChange={(event) => setAddressField("pinCode", event.target.value.replace(/\D/g, "").slice(0, 6))} onBlur={() => markAddressTouched("pinCode")} inputMode="numeric" placeholder="PIN Code" className={addressInputClass("pinCode")} />
                {addressError("pinCode")}
              </div>
              <div className="grid gap-1">
                <input value={address.building} onChange={(event) => setAddressField("building", event.target.value)} onBlur={() => markAddressTouched("building")} placeholder="Flat / House No / Building / Apartment" className={addressInputClass("building")} />
                {addressError("building")}
              </div>
              <div className="grid gap-1">
                <input value={address.area} onChange={(event) => setAddressField("area", event.target.value)} onBlur={() => markAddressTouched("area")} placeholder="Area / Street / Sector / Village" className={addressInputClass("area")} />
                {addressError("area")}
              </div>
              <div className="grid gap-1">
                <input value={address.landmark} onChange={(event) => setAddressField("landmark", event.target.value)} placeholder="Landmark (Optional)" className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" />
              </div>
              <div className="grid gap-1">
                <input value={address.city} onChange={(event) => setAddressField("city", event.target.value)} onBlur={() => markAddressTouched("city")} placeholder="Town / City" className={addressInputClass("city")} />
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
              <div className="grid gap-1 sm:col-span-2">
                <textarea value={address.fullAddress} onChange={(event) => setAddressField("fullAddress", event.target.value)} onBlur={() => markAddressTouched("fullAddress")} placeholder="Full Address" className={`focus-ring min-h-28 rounded-2xl border bg-transparent p-4 ${shouldShowAddressError("fullAddress") ? "border-red-500" : "border-black/10 dark:border-white/10"}`} />
                {addressError("fullAddress")}
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 dark:bg-white/5">
            <h2 className="text-2xl font-black">Billing address</h2>
            <label className="mt-4 flex items-center gap-3 text-sm font-bold">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-violet-600" /> Same as shipping address
            </label>
          </div>
          <div className="rounded-3xl bg-white p-6 dark:bg-white/5">
            <h2 className="text-2xl font-black">Delivery method</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {deliveryMethods.map(({ id, title }) => (
                <button
                  key={id}
                  type="button"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDeliveryMethod(id as DeliveryMethodId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setDeliveryMethod(id as DeliveryMethodId);
                    }
                  }}
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
            <h2 className="text-2xl font-black">Payment section</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                You&apos;ll be securely redirected to Razorpay to pay by UPI, card, netbanking, or wallet. Podscentra never sees or stores your card details.
              </div>
            ) : null}
            {paymentMethod === "Cash on Delivery" ? (
              <div className="mt-5 rounded-2xl border border-black/10 p-4 text-sm leading-6 text-neutral-500 transition dark:border-white/10 dark:text-neutral-400">
                Pay safely when your order arrives. Keep the exact amount ready for a faster handoff.
              </div>
            ) : null}
            {paymentError ? (
              <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 dark:bg-red-500/10">{paymentError}</p>
            ) : null}
          </div>
        </div>
      </div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <aside className="h-fit rounded-3xl bg-white p-6 shadow-luxury dark:bg-white/5">
        <h2 className="text-2xl font-black">Order summary</h2>
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm">
              <span>{item.product.name} × {item.quantity}</span>
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
          {isProcessing ? "Processing…" : paymentMethod === "Cash on Delivery" ? "Place order" : `Pay ${formatCurrency(total)}`}
        </button>
        <LinkButton href="/cart" variant="ghost" className="mt-3 w-full">Back to cart</LinkButton>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink lg:hidden">
        <button
          type="button"
          disabled={!canPlaceOrder}
          onClick={handlePlaceOrder}
          className="focus-ring flex min-h-12 w-full items-center justify-center rounded-full bg-accent font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? "Processing…" : paymentMethod === "Cash on Delivery" ? "Place order" : `Pay ${formatCurrency(total)}`}
        </button>
      </div>
    </section>
  );
}
