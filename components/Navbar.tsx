"use client";

import Link from "next/link";
import { Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useCollections } from "@/hooks/useCollections";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/hot-items", label: "Hot Items" }
];

export function Navbar() {
  const { itemCount, openCartDrawer } = useCart();
  const { navbarCollections } = useCollections();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cartLabel = itemCount ? `Cart - ${itemCount}` : "Cart";
  const navItems = [
    ...nav,
    ...navbarCollections.map((collection) => ({ href: `/collections/${collection.slug}`, label: collection.name })),
    { href: "/deals", label: "Deals" }
  ];

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function openCartFromNav() {
    closeMenu();
    openCartDrawer();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-20 border-b border-black/5 bg-white/78 backdrop-blur-2xl dark:border-white/10 dark:bg-ink/78">
      <nav className="relative mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <div className="flex min-w-0 flex-1 items-center">
          <Link href="/" className="inline-flex shrink-0 items-center overflow-hidden" aria-label="Podscentra home" onClick={closeMenu}>
            <img
              src="/img/podcentalogo.png"
              alt="Podscentra logo"
              className="h-9 w-auto max-w-[100px] object-contain sm:h-10 sm:max-w-[120px] lg:h-12 lg:max-w-[160px]"
            />
          </Link>
        </div>

        <div className="hidden items-center justify-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 text-sm font-semibold text-neutral-700 transition hover:text-accent dark:text-neutral-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={openCartFromNav}
            className="focus-ring hidden h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-luxury dark:bg-white dark:text-ink dark:hover:bg-accent dark:hover:text-white md:inline-flex md:px-5"
            aria-label={itemCount ? `Open cart drawer, ${itemCount} items` : "Open cart drawer"}
          >
            <ShoppingCart size={18} strokeWidth={1.9} />
            <span>{cartLabel}</span>
          </button>
          <button
            type="button"
            onClick={openCartFromNav}
            className="focus-ring relative inline-grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-accent dark:bg-white dark:text-ink dark:hover:bg-accent dark:hover:text-white md:hidden"
            aria-label={itemCount ? `Open cart drawer, ${itemCount} items` : "Open cart drawer"}
          >
            <ShoppingCart size={19} strokeWidth={2} />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-black leading-none text-white ring-2 ring-white dark:ring-ink">
              {itemCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="focus-ring inline-grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:text-accent dark:border-white/10 dark:bg-white/10 dark:text-white md:hidden"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            {isMenuOpen ? <X size={21} strokeWidth={2.2} /> : <Menu size={21} strokeWidth={2.2} />}
          </button>
        </div>

        <div
          id="mobile-navigation-menu"
          className={`absolute inset-x-4 top-full overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,15,20,0.16)] transition-all duration-300 ease-out dark:border-white/10 dark:bg-neutral-950 md:hidden ${
            isMenuOpen ? "mt-3 max-h-96 translate-y-0 opacity-100" : "pointer-events-none mt-0 max-h-0 -translate-y-2 opacity-0"
          }`}
        >
          <div className="grid gap-1 p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-bold text-neutral-800 transition hover:bg-neutral-100 hover:text-accent dark:text-neutral-100 dark:hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={openCartFromNav}
              className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-bold text-neutral-800 transition hover:bg-neutral-100 hover:text-accent dark:text-neutral-100 dark:hover:bg-white/10"
            >
              {cartLabel}
              <ShoppingCart size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
