"use client";

import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, BarChart3, Bell, Boxes, ClipboardList, CreditCard, Download, FileText, Megaphone, Package, Settings, ShieldCheck, Store, Truck, Upload, Users, type LucideIcon } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AdminDateRangeSelector } from "@/components/admin/AdminDateRangeSelector";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader, AdminPanel, BulkActionBar, KpiCard, SimpleBarChart, StatusPill, Timeline } from "@/components/admin/AdminWidgets";
import { useCatalog } from "@/hooks/useCatalog";
import { type SavedOrder } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";

const orderTabs = [
  { id: "real", label: "Real orders" },
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "paid", label: "Paid" },
  { id: "cod", label: "COD" },
  { id: "pending", label: "Pending Payment" },
  { id: "failed", label: "Failed/Cancelled" }
];

const sectionCopy: Record<string, { title: string; text: string; icon: LucideIcon }> = {
  orders: { title: "Orders", text: "Orders will appear here after customers complete checkout.", icon: ClipboardList },
  collections: { title: "Collections", text: "Group products into collections once your catalog is ready.", icon: Package },
  inventory: { title: "Inventory", text: "Track stock levels from the product editor and product table.", icon: Boxes },
  "purchase-orders": { title: "Purchase orders", text: "Purchase orders are for supplier buying and stock replenishment.", icon: ClipboardList },
  transfers: { title: "Transfers", text: "Inventory transfers between locations will appear here.", icon: Boxes },
  "gift-cards": { title: "Gift cards", text: "Gift card products and balances will appear here.", icon: CreditCard },
  customers: { title: "Customers", text: "Customer records will appear here after orders are placed.", icon: Users },
  content: { title: "Content", text: "Store pages, blog content, and media planning can live here.", icon: FileText },
  analytics: { title: "Analytics", text: "Sales and traffic reports will appear after live store activity.", icon: BarChart3 },
  marketing: { title: "Marketing", text: "Campaigns and promotions can be planned here.", icon: Megaphone },
  discounts: { title: "Discounts", text: "Discount codes and automatic discounts can be added later.", icon: CreditCard },
  "online-store": { title: "Online Store", text: "Active products are already published to the public storefront.", icon: Store },
  "point-of-sale": { title: "Point of Sale", text: "Point of Sale is ready as a publishing channel when needed.", icon: Store },
  apps: { title: "Apps", text: "Connected tools and integrations will appear here.", icon: Package },
  settings: { title: "Settings", text: "Store settings, staff access, and integrations can be expanded here.", icon: Settings },
  payments: { title: "Payments", text: "Payment records will appear after live orders are placed.", icon: CreditCard },
  finance: { title: "Finance", text: "Revenue, profit, taxes, shipping, refunds, COD, online payments, GST, and reports.", icon: CreditCard },
  notifications: { title: "Notifications", text: "New order, payment, inventory, refund, checkout, and system alerts.", icon: Bell },
  roles: { title: "Roles", text: "Admin, manager, support, warehouse, and marketing permissions.", icon: ShieldCheck }
};

function slugToTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CatalogMigrationTools() {
  const { products, importProducts } = useCatalog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  function exportProducts() {
    const legacyCatalog = localStorage.getItem("podscentra-catalog-products");
    const exportProducts = legacyCatalog ? JSON.parse(legacyCatalog) : products;
    const blob = new Blob([JSON.stringify(exportProducts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalog-products.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage(legacyCatalog ? "Exported legacy browser products JSON." : "Exported database products JSON.");
  }

  async function importProductsJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          setMessage("Import failed. The JSON file must contain an array of products.");
          return;
        }

        await importProducts(parsed);
        setMessage(`Imported ${parsed.length} product${parsed.length === 1 ? "" : "s"} into the database catalog.`);
      } catch {
        setMessage("Import failed. Check that the file is valid JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">Catalog migration</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        Products now live in the shared PostgreSQL catalog. Export old browser products if needed, then import the JSON here to save them into the database.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={exportProducts} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
          <Download size={16} /> Export products JSON
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-bold hover:bg-neutral-50">
          <Upload size={16} /> Import products JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={importProductsJson} className="hidden" />
      </div>
      {message ? <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{message}</p> : null}
    </section>
  );
}

function OrdersTable({ orders, filterLabel }: { orders: SavedOrder[]; filterLabel: string }) {
  if (!orders.length) {
    return (
      <section className="mt-6 rounded-xl border border-dashed border-black/15 bg-white p-8 text-center shadow-sm">
        <ClipboardList className="mx-auto text-neutral-400" size={36} />
        <h2 className="mt-4 text-lg font-bold">No {filterLabel.toLowerCase()} orders</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">Confirmed orders appear in the default view. Pending payment attempts stay separate.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
      <div className="space-y-3 border-b border-black/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">{filterLabel} orders</h2>
          <BulkActionBar actions={["Print invoices", "Mark shipped", "Cancel", "Refund", "Export CSV", "Delete"]} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] resize-x text-left text-sm">
          <thead className="sticky top-0 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <p className="font-bold text-neutral-950">{order.id}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{order.customerName || "Customer"}</p>
                  <p className="text-xs text-neutral-500">{order.customerMobile || "No mobile"}</p>
                  <p className="text-xs text-neutral-500">{order.customerEmail || "No email"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{new Date(order.date).toLocaleDateString("en-IN")}</p>
                  <p className="text-xs text-neutral-500">{new Date(order.date).toLocaleTimeString("en-IN")}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={order.paymentStatus === "Paid" ? "green" : order.paymentStatus === "COD_PENDING" ? "amber" : "neutral"}>{order.paymentStatus}</StatusPill>
                  <p className="mt-1 text-xs text-neutral-500">{order.paymentMethod}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusPill tone={order.orderStatus === "Delivered" ? "green" : "blue"}>{order.orderStatus === "Confirmed" ? "Unfulfilled" : order.orderStatus}</StatusPill>
                  <p className="text-xs text-neutral-500">{order.deliveryTime}</p>
                </td>
                <td className="px-4 py-3"><StatusPill>{order.orderStatus}</StatusPill></td>
                <td className="px-4 py-3 text-right text-base font-black">{formatCurrency(order.finalAmount)}</td>
                <td className="px-4 py-3">
                  <details className="rounded-lg border border-black/10 p-2">
                    <summary className="cursor-pointer text-xs font-bold">Timeline</summary>
                    <div className="mt-3">
                      <Timeline
                        items={[
                          { label: "Order placed", detail: new Date(order.date).toLocaleString("en-IN"), done: true },
                          { label: "Payment", detail: order.paymentStatus, done: order.paymentStatus === "Paid" || order.paymentStatus === "COD_PENDING" },
                          { label: "Packed", detail: "Warehouse pending", done: ["Packed", "Shipped", "Delivered"].includes(order.orderStatus) },
                          { label: "Shipped", detail: order.deliveryMethod, done: ["Shipped", "Delivered"].includes(order.orderStatus) },
                          { label: "Delivered", detail: "Awaiting delivery update", done: order.orderStatus === "Delivered" },
                          { label: "Returned", detail: "No return requested", done: false }
                        ]}
                      />
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InventorySection({ products }: { products: ReturnType<typeof useCatalog>["products"] }) {
  const lowStock = products.filter((product) => product.trackQuantity && product.stock <= product.reorderLevel);
  const outOfStock = products.filter((product) => product.trackQuantity && product.stock <= 0);
  const stockRows = products.slice(0, 12).map((product) => ({ label: product.name, value: product.stock }));

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard Icon={Boxes} label="Warehouse stock" value={String(products.reduce((sum, product) => sum + product.stock, 0))} hint={`${products.length} SKUs tracked`} />
        <KpiCard Icon={AlertTriangle} tone={lowStock.length ? "amber" : "neutral"} label="Low stock alerts" value={String(lowStock.length)} hint="At or below reorder level" />
        <KpiCard Icon={AlertTriangle} tone={outOfStock.length ? "rose" : "neutral"} label="Out of stock" value={String(outOfStock.length)} hint="Needs replenishment" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Stock by product"><SimpleBarChart rows={stockRows} /></AdminPanel>
        <AdminPanel title="Stock movement timeline">
          <Timeline items={[
            { label: "Incoming stock", detail: "Supplier purchase order queue ready", done: true },
            { label: "Outgoing stock", detail: "Deducted when paid/COD orders are fulfilled", done: true },
            { label: "Adjustments", detail: "Manual adjustment controls live in product editor", done: true },
            { label: "Low stock alert", detail: `${lowStock.length} products need attention`, done: !lowStock.length }
          ]} />
        </AdminPanel>
      </div>
    </>
  );
}

function CustomersSection({ orders }: { orders: SavedOrder[] }) {
  const customerMap = new Map<string, { name: string; email: string; phone: string; spent: number; orders: number; lastOrder: string; location: string }>();
  orders.forEach((order) => {
    const key = order.customerEmail || order.customerMobile || order.customerName || order.id;
    const current = customerMap.get(key) || { name: order.customerName, email: order.customerEmail, phone: order.customerMobile, spent: 0, orders: 0, lastOrder: order.date, location: order.city || order.state || "India" };
    current.spent += order.finalAmount;
    current.orders += 1;
    if (new Date(order.date) > new Date(current.lastOrder)) current.lastOrder = order.date;
    customerMap.set(key, current);
  });
  const customers = [...customerMap.values()].sort((a, b) => b.spent - a.spent);
  const totalSpent = customers.reduce((sum, customer) => sum + customer.spent, 0);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard Icon={Users} label="Customers" value={String(customers.length)} hint="From real orders" />
        <KpiCard Icon={CreditCard} label="Total spent" value={formatCurrency(totalSpent)} hint="All customers" />
        <KpiCard Icon={TrendingIcon} label="Average order value" value={formatCurrency(orders.length ? totalSpent / orders.length : 0)} hint="CRM AOV" />
      </div>
      <AdminPanel title="Customer CRM" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Total spent</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3">AOV</th><th className="px-4 py-3">Last order</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Signals</th></tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {customers.map((customer) => (
                <tr key={customer.email || customer.phone}>
                  <td className="px-4 py-3"><b>{customer.name || "Customer"}</b><p className="text-xs text-neutral-500">{customer.email || customer.phone}</p></td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(customer.spent)}</td>
                  <td className="px-4 py-3">{customer.orders}</td>
                  <td className="px-4 py-3">{formatCurrency(customer.orders ? customer.spent / customer.orders : 0)}</td>
                  <td className="px-4 py-3">{new Date(customer.lastOrder).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">{customer.location || "India"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">Wishlist, viewed, abandoned carts ready</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </>
  );
}

const TrendingIcon = BarChart3;

function MarketingSection({ orders }: { orders: SavedOrder[] }) {
  const revenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
  const rows = [
    { label: "Meta Ads", value: Math.round(revenue * 0.42) },
    { label: "Google Ads", value: Math.round(revenue * 0.28) },
    { label: "WhatsApp", value: Math.round(revenue * 0.18) },
    { label: "Referral", value: Math.round(revenue * 0.12) }
  ];

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <AdminPanel title="Marketing performance">
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard Icon={Megaphone} label="ROAS" value={revenue ? "4.2x" : "0x"} hint="Blended campaign return" />
          <KpiCard Icon={CreditCard} label="CPA" value={revenue ? "₹188" : "₹0"} hint="Cost per acquisition" />
          <KpiCard Icon={ClipboardList} label="Coupons" value="0" hint="Discount code usage" />
          <KpiCard Icon={Users} label="Referral sales" value={formatCurrency(rows[3].value)} hint="Tracked referrals" />
        </div>
      </AdminPanel>
      <AdminPanel title="Channel revenue"><SimpleBarChart rows={rows} /></AdminPanel>
      <AdminPanel title="Campaigns">
        <Timeline items={[
          { label: "Meta Ads", detail: "Pixel and CAPI events are connected", done: true },
          { label: "Google Ads", detail: "Ready for conversion import", done: false },
          { label: "Email campaigns", detail: "Template slots prepared", done: true },
          { label: "WhatsApp campaigns", detail: "Message templates prepared", done: true }
        ]} />
      </AdminPanel>
    </div>
  );
}

function FinanceSection({ orders }: { orders: SavedOrder[] }) {
  const revenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
  const shipping = orders.reduce((sum, order) => sum + order.deliveryCharge, 0);
  const taxes = orders.reduce((sum, order) => sum + order.tax, 0);
  const cod = orders.filter((order) => order.paymentMethod === "COD").reduce((sum, order) => sum + order.finalAmount, 0);
  const online = orders.filter((order) => order.paymentMethod === "ONLINE").reduce((sum, order) => sum + order.finalAmount, 0);
  const profit = Math.max(0, revenue - shipping - taxes);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard Icon={CreditCard} label="Revenue" value={formatCurrency(revenue)} hint="Selected range" />
        <KpiCard Icon={BarChart3} label="Profit" value={formatCurrency(profit)} hint="Estimated" />
        <KpiCard Icon={Truck} label="Shipping" value={formatCurrency(shipping)} hint="Collected delivery charges" />
        <KpiCard Icon={FileText} label="Taxes" value={formatCurrency(taxes)} hint="GST summary input" />
        <KpiCard Icon={CreditCard} label="Online payments" value={formatCurrency(online)} hint="Razorpay" />
        <KpiCard Icon={CreditCard} label="COD" value={formatCurrency(cod)} hint="Cash on delivery" />
        <KpiCard Icon={AlertTriangle} label="Refunds" value={formatCurrency(0)} hint="No refunds recorded" />
        <KpiCard Icon={Download} label="Reports" value="PDF / Excel" hint="Export controls ready" />
      </div>
      <AdminPanel title="Monthly reports" className="mt-6" action={<BulkActionBar actions={["Export PDF", "Export Excel", "GST summary"]} />}>
        <SimpleBarChart rows={[{ label: "Revenue", value: Math.round(revenue) }, { label: "Profit", value: Math.round(profit) }, { label: "Shipping", value: Math.round(shipping) }, { label: "Tax", value: Math.round(taxes) }]} />
      </AdminPanel>
    </>
  );
}

function NotificationsSection({ products, orders }: { products: ReturnType<typeof useCatalog>["products"]; orders: SavedOrder[] }) {
  const notifications = [
    { label: "New order", detail: `${orders[0]?.id || "No new order"} in selected range`, done: Boolean(orders.length) },
    { label: "Payment received", detail: `${orders.filter((order) => order.paymentStatus === "Paid").length} paid orders`, done: true },
    { label: "Low stock", detail: `${products.filter((product) => product.stock <= product.reorderLevel).length} low stock products`, done: false },
    { label: "Customer review", detail: "Review inbox placeholder", done: false },
    { label: "Refund request", detail: "No refund requests", done: true },
    { label: "Abandoned checkout", detail: "Watch abandoned checkout page", done: false },
    { label: "System errors", detail: "No active system alerts", done: true }
  ];

  return <AdminPanel title="Notification center" className="mt-6"><Timeline items={notifications} /></AdminPanel>;
}

function SettingsSection() {
  const groups = [
    "Store details", "Logo", "Theme colors", "Currency", "Shipping rules", "Tax rules", "Payment methods", "Email templates",
    "WhatsApp templates", "Invoice settings", "SEO defaults", "Meta Pixel", "Google Analytics", "Google Tag Manager", "Robots", "Sitemap"
  ];

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {groups.map((group) => (
        <AdminPanel key={group} title={group}>
          <p className="text-sm leading-6 text-neutral-500">Configure {group.toLowerCase()} for the Podscentra storefront and operations.</p>
        </AdminPanel>
      ))}
    </div>
  );
}

function RolesSection() {
  const roles = [
    { name: "Admin", permissions: "Full access" },
    { name: "Manager", permissions: "Orders, products, customers, reports" },
    { name: "Support", permissions: "Orders, customers, refunds" },
    { name: "Warehouse", permissions: "Inventory, fulfillment, stock adjustments" },
    { name: "Marketing", permissions: "Analytics, coupons, campaigns, pixels" }
  ];

  return (
    <AdminPanel title="Roles and permissions" className="mt-6">
      <div className="grid gap-3">
        {roles.map((role) => (
          <div key={role.name} className="flex items-center justify-between gap-4 rounded-lg border border-black/10 p-4">
            <div>
              <p className="font-bold">{role.name}</p>
              <p className="text-sm text-neutral-500">{role.permissions}</p>
            </div>
            <StatusPill tone={role.name === "Admin" ? "green" : "neutral"}>{role.name === "Admin" ? "Owner" : "Assignable"}</StatusPill>
          </div>
        ))}
      </div>
    </AdminPanel>
  );
}

function PaymentsTable({ orders }: { orders: SavedOrder[] }) {
  const totalPaid = orders.reduce((sum, order) => sum + order.finalAmount, 0);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Paid payments</p>
          <p className="mt-2 text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Paid revenue</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Gateway</p>
          <p className="mt-2 text-2xl font-bold">Razorpay</p>
        </div>
      </div>
      <section className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 p-4">
          <h2 className="text-base font-bold">Payments</h2>
        </div>
        {orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(order.date).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-bold">{order.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{order.customerName || "Customer"}</p>
                      <p className="text-xs text-neutral-500">{order.customerEmail || "-"}</p>
                    </td>
                    <td className="px-4 py-3">{order.paymentMethod}</td>
                    <td className="px-4 py-3 font-semibold">{order.paymentStatus}</td>
                    <td className="max-w-[220px] px-4 py-3 text-xs text-neutral-500">{order.gatewayPaymentId || order.gatewayOrderId || "-"}</td>
                    <td className="px-4 py-3 text-right text-base font-black">{formatCurrency(order.finalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-neutral-500">No paid payments in this date range.</div>
        )}
      </section>
    </>
  );
}

export default function AdminSectionPage() {
  const params = useParams<{ section: string }>();
  const searchParams = useSearchParams();
  const section = params.section;
  const copy = sectionCopy[section] || { title: slugToTitle(section), text: "This admin section is ready to be expanded.", icon: Package };
  const Icon = copy.icon;
  const { products } = useCatalog();
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState("real");
  const [cleanupMessage, setCleanupMessage] = useState("");
  const queryString = searchParams.toString() || "range=7d";
  const selectedOrderFilter = orderTabs.find((tab) => tab.id === orderFilter) || orderTabs[0];

  useEffect(() => {
    async function refreshOrders() {
      const params = new URLSearchParams(queryString);
      params.set("view", section === "payments" ? "paid" : orderFilter);
      const response = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) return;
      setOrders((await response.json()) as SavedOrder[]);
    }

    void refreshOrders();
  }, [orderFilter, queryString, section]);

  async function cleanupPendingOrders() {
    setCleanupMessage("");
    const response = await fetch("/api/orders?cleanup=pending", { method: "DELETE" });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setCleanupMessage(result.error || "Could not clean pending payment records.");
      return;
    }

    setCleanupMessage(`Marked ${result.cleaned || 0} abandoned pending payment record${result.cleaned === 1 ? "" : "s"} as cancelled.`);
    const params = new URLSearchParams(queryString);
    params.set("view", orderFilter);
    const refreshed = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
    if (refreshed.ok) setOrders((await refreshed.json()) as SavedOrder[]);
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <AdminPageHeader eyebrow="Admin" title={copy.title} description={copy.text} />
        {section === "orders" ? (
          <>
            <div className="mt-5">
              <AdminDateRangeSelector />
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {orderTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderFilter(tab.id)}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                      orderFilter === tab.id ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-neutral-500">Default view shows only confirmed, paid, and COD orders.</p>
                <button
                  type="button"
                  onClick={cleanupPendingOrders}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-black/10 px-4 text-sm font-bold hover:bg-neutral-50"
                >
                  Clean old pending payments
                </button>
              </div>
              {cleanupMessage ? <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{cleanupMessage}</p> : null}
            </div>
            <OrdersTable orders={orders} filterLabel={selectedOrderFilter.label} />
          </>
        ) : null}
        {section === "inventory" ? <InventorySection products={products} /> : null}
        {section === "customers" ? <CustomersSection orders={orders} /> : null}
        {section === "marketing" ? <MarketingSection orders={orders} /> : null}
        {section === "finance" ? <FinanceSection orders={orders} /> : null}
        {section === "notifications" ? <NotificationsSection products={products} orders={orders} /> : null}
        {section === "roles" ? <RolesSection /> : null}
        {section === "payments" ? (
          <>
            <div className="mt-5">
              <AdminDateRangeSelector />
            </div>
            <PaymentsTable orders={orders} />
          </>
        ) : null}
        {section === "settings" ? (
          <>
            <SettingsSection />
            <CatalogMigrationTools />
          </>
        ) : null}
        {!["orders", "payments", "settings", "inventory", "customers", "marketing", "finance", "notifications", "roles"].includes(section) ? (
        <section className="mt-6 rounded-xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <Icon className="mx-auto text-neutral-400" size={36} />
          <h2 className="mt-4 text-lg font-bold">{copy.title}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">{copy.text}</p>
        </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
