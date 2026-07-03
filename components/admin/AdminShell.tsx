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
  Command,
  DollarSign,
  FileText,
  FolderOpen,
  Gift,
  Home,
  LogOut,
  Megaphone,
  Moon,
  Search,
  ShieldCheck,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sun,
  Bell,
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
  { label: "Finance", href: "/admin/finance", Icon: DollarSign },
  { label: "Notifications", href: "/admin/notifications", Icon: Bell },
  { label: "Roles", href: "/admin/roles", Icon: ShieldCheck },
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
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(sessionKey) === "active");
    setDarkMode(localStorage.getItem("podscentra-admin-dark") === "1");
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleDarkMode() {
    setDarkMode((current) => {
      const next = !current;
      localStorage.setItem("podscentra-admin-dark", next ? "1" : "0");
      return next;
    });
  }

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
    <div className={cn("min-h-screen text-neutral-950", darkMode ? "bg-neutral-950" : "bg-[#f1f1f1]")}>
      {searchOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 p-4 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="mx-auto mt-24 max-w-2xl rounded-xl border border-black/10 bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <label className="flex min-h-12 items-center gap-3 rounded-lg bg-neutral-50 px-4 text-sm text-neutral-500">
              <Search size={18} />
              <input autoFocus placeholder="Search orders, products, customers, settings..." className="w-full bg-transparent outline-none" />
              <span className="rounded-md border border-black/10 px-2 py-1 text-xs font-bold">Esc</span>
            </label>
            <div className="mt-3 grid gap-1">
              {[...primaryItems, ...salesItems, { label: "Settings", href: "/admin/settings", Icon: Settings }, { label: "Roles", href: "/admin/roles", Icon: ShieldCheck }].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-neutral-50">
                  <item.Icon size={16} /> {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden w-64 border-r px-2 py-4 lg:flex lg:flex-col", darkMode ? "border-white/10 bg-neutral-900 text-white" : "border-black/10 bg-[#ececec]")}>
        <div className="mb-3 px-3">
          <img src="/img/podcentalogo.png" alt="Podscentra logo" className="h-10 w-auto max-w-[140px] object-contain" />
          <p className="text-xs text-neutral-500">Admin</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
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
        </div>
        <div className="border-t border-black/10 pt-2">
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
      <div className="hidden border-b border-black/10 bg-white/80 px-5 py-3 backdrop-blur lg:block lg:pl-64">
        <div className="flex items-center justify-between gap-4">
          <button onClick={() => setSearchOpen(true)} className="flex min-h-10 w-full max-w-xl items-center gap-3 rounded-lg border border-black/10 bg-neutral-50 px-4 text-sm font-semibold text-neutral-500 hover:bg-white">
            <Search size={17} /> Search admin
            <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-black/10 bg-white px-2 py-1 text-xs font-bold">
              <Command size={12} /> K
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 bg-white hover:bg-neutral-50" aria-label="Toggle dark mode">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link href="/admin/notifications" className="grid h-10 w-10 place-items-center rounded-lg border border-black/10 bg-white hover:bg-neutral-50" aria-label="Notifications">
              <Bell size={17} />
            </Link>
          </div>
        </div>
      </div>
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}
