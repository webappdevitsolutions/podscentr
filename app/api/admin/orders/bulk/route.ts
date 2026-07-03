import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { applyBulkOrderAction } from "@/lib/admin-orders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { action?: string; ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (!body.action || !ids.length) {
      return NextResponse.json({ error: "Select at least one order." }, { status: 400 });
    }

    const result = await applyBulkOrderAction(body.action, ids);
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("Admin order bulk action failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update orders." }, { status: 400 });
  }
}
