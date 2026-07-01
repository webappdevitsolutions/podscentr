"use client";

import Link from "next/link";
import { LockKeyhole, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { deliveryChargeTable } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

function EmptyCartState() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-violet-50 text-accent">
        <ShoppingBag size={34} />
      </div>
      <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Your cart is empty</h1>
      <p className="mt-4 max-w-md text-base leading-7 text-neutral-500 dark:text-neutral-400">
        Add your favorite products and they will appear here before checkout.
      </p>
      <Link
        href="/shop"
        className="focus-ring mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-7 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-accent dark:bg-white dark:text-ink dark:hover:bg-accent dark:hover:text-white"
      >
        Start shopping
      </Link>
    </section>
  );
}

export default function CartPage() {
  const { items, notify, removeItem, updateQuantity } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = items.length ? deliveryChargeTable.standard["Online Payment"] : 0;
  const tax = 0;
  const discount = 0;
  const estimatedTotal = Math.max(0, subtotal + shipping + tax - discount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const message = sessionStorage.getItem("podscentra-cart-message");
    if (!message) return;
    sessionStorage.removeItem("podscentra-cart-message");
    notify(message);
  }, [notify]);

  function applyPromo() {
    if (!promoCode.trim()) {
      setPromoError("Enter a promo code.");
      return;
    }

    setPromoError("Invalid promo code.");
  }

  if (!items.length) {
    return <EmptyCartState />;
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 lg:pb-14">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Podscentra cart</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Shopping cart</h1>
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
              {itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout.
            </p>
          </div>
          <Link
            href="/shop"
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-black text-ink transition hover:border-ink hover:bg-ink hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            Continue shopping
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="space-y-4">
            {items.map((item) => {
              const lineTotal = item.product.price * item.quantity;
              const selectedMeta = [item.size, item.color].filter(Boolean).join(" / ");

              return (
                <article key={item.id} className="grid gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:grid-cols-[128px_1fr] sm:p-5">
                  <Link href={`/product/${item.product.slug}`} className="block aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  </Link>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">{item.product.category}</p>
                      <Link href={`/product/${item.product.slug}`} className="mt-2 block text-xl font-black leading-tight tracking-tight hover:text-accent">
                        {item.product.name}
                      </Link>
                      {selectedMeta ? <p className="mt-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">{selectedMeta}</p> : null}
                      <p className="mt-3 truncate text-sm text-neutral-500 dark:text-neutral-400">{item.product.description}</p>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <div className="inline-flex h-11 items-center rounded-full border border-black/10 bg-neutral-50 dark:border-white/10 dark:bg-white/5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
                            aria-label={`Decrease ${item.product.name} quantity`}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="min-w-9 text-center text-sm font-black">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
                            aria-label={`Increase ${item.product.name} quantity`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-neutral-500 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-4 lg:flex-col lg:items-end">
                      <div className="text-left lg:text-right">
                        <p className="text-lg font-black">{formatCurrency(item.product.price)}</p>
                        {item.quantity > 1 ? (
                          <p className="mt-1 text-sm font-semibold text-neutral-500">Line total: {formatCurrency(lineTotal)}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-3xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 lg:sticky lg:top-28">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Summary</p>
                <h2 className="mt-2 text-3xl font-black">Order summary</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-accent dark:bg-white/10">
                <LockKeyhole size={20} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
              <input
                value={promoCode}
                onChange={(event) => {
                  setPromoCode(event.target.value);
                  setPromoError("");
                }}
                placeholder="Promo code"
                className="focus-ring min-h-12 rounded-full border border-black/10 bg-transparent px-4 text-sm outline-none dark:border-white/10"
              />
              <button
                type="button"
                onClick={applyPromo}
                className="focus-ring min-h-12 rounded-full border border-ink px-5 text-sm font-black transition hover:bg-ink hover:text-white dark:border-white"
              >
                Apply
              </button>
            </div>
            {promoError ? <p className="mt-2 text-sm font-bold text-rose-600">{promoError}</p> : null}

            <div className="mt-6 divide-y divide-black/10 text-sm dark:divide-white/10">
              <div className="flex justify-between py-3">
                <span className="text-neutral-500">Subtotal</span>
                <b>{formatCurrency(subtotal)}</b>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-500">Shipping</span>
                <span className="text-right">
                  <b>{formatCurrency(shipping)}</b>
                  <span className="mt-1 block text-xs text-neutral-400">Standard Online estimate</span>
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-500">Tax</span>
                <b>{formatCurrency(tax)}</b>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-500">Discount</span>
                <b>{discount ? `-${formatCurrency(discount)}` : formatCurrency(0)}</b>
              </div>
              <div className="flex justify-between py-5 text-xl font-black">
                <span>Estimated total</span>
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="focus-ring mt-2 flex min-h-13 items-center justify-center rounded-full bg-accent px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:bg-violet-700"
            >
              Secure checkout
            </Link>
            <Link
              href="/shop"
              className="focus-ring mt-3 flex min-h-12 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-black transition hover:border-ink hover:bg-ink hover:text-white dark:border-white/10"
            >
              Continue shopping
            </Link>

            <div className="mt-6 grid gap-3 rounded-2xl bg-neutral-50 p-4 text-sm dark:bg-white/10">
              <p className="flex items-center gap-2 font-bold"><ShieldCheck size={17} className="text-accent" /> Secure encrypted payment</p>
              <p className="flex items-center gap-2 font-bold"><Truck size={17} className="text-accent" /> Shipping finalized at checkout</p>
            </div>
          </aside>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 p-4 backdrop-blur dark:border-white/10 dark:bg-ink/95 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Estimated total</p>
            <p className="font-black">{formatCurrency(estimatedTotal)}</p>
          </div>
          <Link href="/checkout" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-black text-white">
            Secure checkout
          </Link>
        </div>
      </div>
    </>
  );
}
