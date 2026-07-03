import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { listAdminOrders } from "@/lib/admin-orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await listAdminOrders(new URL(request.url)));
  } catch (error) {
    console.error("Admin orders list failed", error);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}
