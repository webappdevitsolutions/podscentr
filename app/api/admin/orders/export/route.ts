import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { listAdminOrders } from "@/lib/admin-orders";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const selectedIds = (url.searchParams.get("ids") || "").split(",").filter(Boolean);
  const orders = (await listAdminOrders(url)).filter((order) => !selectedIds.length || selectedIds.includes(order.id));
  const rows = [
    ["Order ID", "Date", "Customer", "Phone", "Email", "Address", "Products", "Quantities", "Payment Status", "Fulfillment", "Order Status", "Total"],
    ...orders.map((order) => [
      order.id,
      order.date,
      order.customerName,
      order.customerMobile,
      order.customerEmail,
      order.fullAddress,
      order.items.map((item) => item.name).join("; "),
      order.items.map((item) => `${item.name} x ${item.quantity}`).join("; "),
      order.paymentStatus,
      order.fulfillmentStatus || "Unfulfilled",
      order.orderStatus,
      order.finalAmount
    ])
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="podscentra-orders-${Date.now()}.csv"`
    }
  });
}
