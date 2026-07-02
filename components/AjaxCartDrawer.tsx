"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";

export function AjaxCartDrawer() {
  const {
    closeCartDrawer,
    isDrawerOpen,
    isReady,
    itemCount,
    items,
    removeItem,
    subtotal,
    updateQuantity
  } = useCart();

  useEffect(() => {
    if (!isDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isDrawerOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${isDrawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!isDrawerOpen}>
      <button
        type="button"
        onClick={closeCartDrawer}
        className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart drawer"
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col bg-white shadow-[0_24px_90px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out dark:bg-neutral-950 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-4 dark:border-white/10 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Cart</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-ink transition hover:border-ink hover:bg-ink hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-ink"
            aria-label="Close cart drawer"
          >
            <X size={19} strokeWidth={2.2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {!isReady ? (
            <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5 text-sm font-bold text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
              Loading cart...
            </div>
          ) : items.length ? (
            <div className="space-y-4">
              {items.map((item) => {
                const selectedMeta = [item.size, item.color].filter(Boolean).join(" / ");
                const lineTotal = item.product.price * item.quantity;

                return (
                  <article key={item.id} className="grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <Link
                      href={`/product/${item.product.slug}`}
                      onClick={closeCartDrawer}
                      className="aspect-square overflow-hidden rounded-xl bg-neutral-100"
                    >
                      <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                    </Link>

                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.product.slug}`}
                        onClick={closeCartDrawer}
                        className="line-clamp-2 text-sm font-black leading-snug hover:text-accent"
                      >
                        {item.product.name}
                      </Link>
                      {selectedMeta ? (
                        <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">{selectedMeta}</p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-black">{formatCurrency(item.product.price)}</p>
                        {item.quantity > 1 ? (
                          <p className="text-xs font-semibold text-neutral-500">{formatCurrency(lineTotal)}</p>
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="inline-flex h-9 items-center rounded-full border border-black/10 bg-neutral-50 dark:border-white/10 dark:bg-white/5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
                            aria-label={`Decrease ${item.product.name} quantity`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-7 text-center text-xs font-black">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
                            aria-label={`Increase ${item.product.name} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-xs font-bold text-neutral-500 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-3xl border border-dashed border-black/15 bg-neutral-50 p-8 text-center dark:border-white/10 dark:bg-white/5">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-violet-50 text-accent dark:bg-white/10">
                <ShoppingBag size={28} />
              </div>
              <h3 className="mt-5 text-2xl font-black tracking-tight">Your cart is empty</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Start shopping and your selected products will appear here.</p>
              <Link
                href="/shop"
                onClick={closeCartDrawer}
                className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-accent dark:bg-white dark:text-ink dark:hover:bg-accent dark:hover:text-white"
              >
                Start shopping
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-black/10 bg-white px-5 py-5 dark:border-white/10 dark:bg-neutral-950 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400">Subtotal</span>
            <span className="text-xl font-black">{formatCurrency(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">Shipping, tax, and discounts are finalized at checkout.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/cart"
              onClick={closeCartDrawer}
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-black transition hover:border-ink hover:bg-ink hover:text-white dark:border-white/10"
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={closeCartDrawer}
              className={`focus-ring inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-black text-white transition ${
                items.length
                  ? "bg-accent shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 hover:bg-violet-700"
                  : "pointer-events-none bg-neutral-300 dark:bg-white/20"
              }`}
              aria-disabled={!items.length}
            >
              Checkout
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
