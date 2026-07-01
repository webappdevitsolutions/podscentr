import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const columns = [
  {
    title: "Shop",
    links: ["New Arrivals", "Best Sellers", "Classic Polos", "Premium Polos", "Buy 1 Get 1", "Sale"]
  },
  {
    title: "Hot Items",
    links: ["Navy Polo", "White Polo", "Black Polo", "Maroon Polo", "Green Polo", "Grey Polo"]
  },
  {
    title: "Company",
    links: ["About Us", "Contact Us", "Journal"]
  },
  {
    title: "Support",
    links: ["FAQ", "Shipping Policy", "Return & Refund Policy", "Track Order"]
  },
  {
    title: "Policies",
    links: ["Privacy Policy", "Terms & Conditions", "Cancellation Policy"]
  }
];

function hrefFor(label: string) {
  const map: Record<string, string> = {
    "New Arrivals": "/shop",
    "Best Sellers": "/shop",
    "Classic Polos": "/shop",
    "Premium Polos": "/shop",
    "Buy 1 Get 1": "/deals",
    Sale: "/deals",
    "Navy Polo": "/hot-items",
    "White Polo": "/hot-items",
    "Black Polo": "/hot-items",
    "Maroon Polo": "/hot-items",
    "Green Polo": "/hot-items",
    "Grey Polo": "/hot-items",
    "About Us": "/about",
    "Contact Us": "/contact",
    Journal: "/blog",
    FAQ: "/faq",
    "Shipping Policy": "/shipping-policy",
    "Return & Refund Policy": "/return-refund-policy",
    "Track Order": "/track-order",
    "Privacy Policy": "/privacy-policy",
    "Terms & Conditions": "/terms-and-conditions",
    "Cancellation Policy": "/cancellation-policy"
  };

  return map[label] ?? "/";
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-black/5 bg-gradient-to-br from-white via-slate-50 to-violet-50 text-ink">
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-black/10 py-14 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Exclusive drops. Early access.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-500">
              Join the private Podscentra list for first looks, restock alerts, and members-only BOGO offers.
            </p>
          </div>
          <form className="flex flex-col gap-3 rounded-[1.75rem] border border-black/10 bg-white/70 p-2 shadow-[0_24px_70px_rgba(15,15,20,0.08)] backdrop-blur-xl sm:flex-row sm:rounded-full">
            <input
              aria-label="Email address"
              type="email"
              placeholder="Enter your email"
              className="focus-ring min-h-12 flex-1 rounded-full bg-transparent px-5 text-sm outline-none"
            />
            <button className="focus-ring rounded-full bg-accent px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-violet-500/35">
              Subscribe
            </button>
          </form>
        </div>

        <div className="grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <h3 className="text-3xl font-black tracking-tight">Podscentra</h3>
            <p className="mt-4 text-sm leading-7 text-neutral-500">
              Premium cotton polo t-shirts for everyday wear - always buy one, get one.
            </p>
            <p className="mt-3 text-sm leading-7 text-neutral-500">
              Need help? Call <a className="font-bold text-ink hover:text-accent" href="tel:+9101204217372">+91 0120 421 7372</a> or email{" "}
              <a className="font-bold text-ink hover:text-accent" href="mailto:support@podscentra.com">support@podscentra.com</a>.
            </p>
            <div className="mt-5 flex gap-2">
              {[Instagram, Facebook, Youtube, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/70 text-neutral-700 transition hover:-translate-y-1 hover:text-accent hover:shadow-lg hover:shadow-violet-500/10"
                  aria-label="Social media"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">{column.title}</h3>
              <div className="mt-5 grid gap-3">
                {column.links.map((link) => (
                  <Link
                    key={link}
                    href={hrefFor(link)}
                    className="group w-fit text-sm text-neutral-500 transition hover:translate-x-1 hover:text-ink"
                  >
                    {link}
                    <span className="mt-1 block h-px w-0 bg-accent transition-all group-hover:w-full" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-black/10 py-5 text-xs text-neutral-500 lg:flex-row lg:items-center lg:justify-between">
          <p>Copyright 2026 Podscentra. All rights reserved.</p>
          <div className="flex flex-wrap gap-2">
            {["VISA", "MC", "UPI", "PAY"].map((item) => (
              <span key={item} className="rounded-lg border border-black/10 bg-white px-3 py-1 font-black text-neutral-600">
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-accent">Privacy</Link>
            <Link href="/terms-and-conditions" className="hover:text-accent">Terms</Link>
            <Link href="/contact" className="hover:text-accent">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
