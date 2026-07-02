"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  BadgePercent,
  BarChart3,
  Blocks,
  Boxes,
  ClipboardList,
  FileText,
  FolderOpen,
  Gift,
  Home,
  LogOut,
  Megaphone,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Users,
  type LucideIcon
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sessionKey = "podscentra-admin-session";

type NavItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  nested?: boolean;
};

const primaryItems: NavItem[] = [
  { label: "Home", href: "/admin", Icon: Home },
  { label: "Orders", href: "/admin/orders", Icon: ClipboardList },
  { label: "Products", href: "/admin/products", Icon: ShoppingBag },
  { label: "Collections", href: "/admin/collections", Icon: FolderOpen, nested: true },
  { label: "Inventory", href: "/admin/inventory", Icon: Boxes, nested: true },
  { label: "Purchase orders", href: "/admin/purchase-orders", Icon: Package, nested: true },
  { label: "Transfers", href: "/admin/transfers", Icon: ArrowRightLeft, nested: true },
  { label: "Gift cards", href: "/admin/gift-cards", Icon: Gift, nested: true },
  { label: "Customers", href: "/admin/customers", Icon: Users },
  { label: "Content", href: "/admin/content", Icon: FileText },
  { label: "Analytics", href: "/admin/analytics", Icon: BarChart3 },
  { label: "Abandoned Checkouts", href: "/admin/abandoned-checkouts", Icon: ShoppingCart },
  { label: "Marketing", href: "/admin/marketing", Icon: Megaphone },
  { label: "Discounts", href: "/admin/discounts", Icon: BadgePercent }
];

const salesItems: NavItem[] = [
  { label: "Online Store", href: "/admin/online-store", Icon: Store },
  { label: "Point of Sale", href: "/admin/point-of-sale", Icon: Smartphone }
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.href === "/admin/products" ? pathname.startsWith("/admin/products") : pathname === item.href;
  const Icon = item.Icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-neutral-700 transition hover:bg-white hover:text-neutral-950",
        item.nested && "ml-5 text-neutral-500",
        active && "bg-white text-neutral-950 shadow-sm"
      )}
    >
      <Icon size={16} strokeWidth={2} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userId = String(form.get("userId") || "");
    const password = String(form.get("password") || "");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password })
    });

    if (response.ok) {
      localStorage.setItem(sessionKey, "active");
      setError("");
      onLogin();
      return;
    }

    const result = await response.json().catch(() => ({ error: "Invalid admin ID or password." }));
    setError(result.error || "Invalid admin ID or password.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f1f1] px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-6 shadow-sm">
        <img src="/img/podcentalogo.png" alt="Podscentra logo" className="h-12 w-auto max-w-[160px] object-contain" />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Podscentra admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">Log in</h1>
        <label className="mt-6 grid gap-1 text-sm font-semibold text-neutral-700">
          ID
          <input name="userId" autoComplete="username" className="min-h-10 rounded-lg border border-black/15 px-3 outline-none focus:border-neutral-950" />
        </label>
        <label className="mt-4 grid gap-1 text-sm font-semibold text-neutral-700">
          Password
          <input name="password" type="password" autoComplete="current-password" className="min-h-10 rounded-lg border border-black/15 px-3 outline-none focus:border-neutral-950" />
        </label>
        {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        <button className="mt-5 min-h-10 w-full rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white transition hover:bg-neutral-800">
          Log in
        </button>
      </form>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(sessionKey) === "active");
  }, []);

  function logout() {
    void fetch("/api/admin/logout", { method: "POST" });
    localStorage.removeItem(sessionKey);
    setIsLoggedIn(false);
    router.push("/admin");
  }

  if (isLoggedIn === null) {
    return <div className="min-h-screen bg-[#f1f1f1]" />;
  }

  if (!isLoggedIn) {
    return <LoginGate onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-black/10 bg-[#ececec] px-2 py-4 lg:block">
        <div className="mb-3 px-3">
          <img src="/img/podcentalogo.png" alt="Podscentra logo" className="h-10 w-auto max-w-[140px] object-contain" />
          <p className="text-xs text-neutral-500">Admin</p>
        </div>
        <nav className="space-y-1">
          {primaryItems.map((item) => (
            <NavLink item={item} key={item.label} />
          ))}
        </nav>
        <div className="mt-7 px-3 text-xs font-semibold text-neutral-500">Sales channels</div>
        <nav className="mt-2 space-y-1">
          {salesItems.map((item) => (
            <NavLink item={item} key={item.label} />
          ))}
        </nav>
        <div className="mt-7 px-3 text-xs font-semibold text-neutral-500">Apps</div>
        <nav className="mt-2 space-y-1">
          <NavLink item={{ label: "Apps", href: "/admin/apps", Icon: Blocks }} />
        </nav>
        <div className="absolute inset-x-2 bottom-3 space-y-1">
          <NavLink item={{ label: "Settings", href: "/admin/settings", Icon: Settings }} />
          <button onClick={logout} className="flex min-h-8 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-neutral-700 transition hover:bg-white hover:text-neutral-950">
            <LogOut size={16} strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>
      <div className="border-b border-black/10 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <img src="/img/podcentalogo.png" alt="Podscentra logo" className="h-10 w-auto max-w-[140px] object-contain" />
            <p className="text-xs text-neutral-500">Shopify-style backend</p>
          </div>
          <button onClick={logout} className="rounded-lg border border-black/10 px-3 py-2 text-sm font-bold">Logout</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[...primaryItems, ...salesItems].map((item) => (
            <Link key={item.label} href={item.href} className="whitespace-nowrap rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="lg:pl-60">{children}</main>
    </div>
  );
}
