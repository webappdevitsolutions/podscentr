"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/hot-items", label: "Hot Items" },
  { href: "/deals", label: "Deals" }
];

export function Navbar() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-black/5 bg-white/78 backdrop-blur-2xl dark:border-white/10 dark:bg-ink/78">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <div className="flex min-w-0 flex-1 items-center">
          <Link href="/" className="inline-flex shrink-0 items-center overflow-hidden" aria-label="Podscentra home">
            <img
              src="/img/podcentalogo.png"
              alt="Podscentra logo"
              className="h-9 w-auto max-w-[100px] object-contain sm:h-10 sm:max-w-[120px] lg:h-12 lg:max-w-[160px]"
            />
          </Link>
        </div>

        <div className="hidden items-center justify-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 text-sm font-semibold text-neutral-700 transition hover:text-accent dark:text-neutral-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end">
          <Link
            href="/cart"
            className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-luxury dark:bg-white dark:text-ink dark:hover:bg-accent dark:hover:text-white sm:px-5"
            aria-label={count ? `Open cart page, ${count} items` : "Open cart page"}
          >
            <ShoppingCart size={18} strokeWidth={1.9} />
            <span>{count ? `Cart • ${count}` : "Cart"}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
