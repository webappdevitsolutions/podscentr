import { NextResponse } from "next/server";
import { AbandonedCheckoutStatus } from "@/lib/generated/prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };

  if (body.action !== "mark-recovered") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const checkout = await prisma.abandonedCheckout.update({
    where: { id },
    data: { status: AbandonedCheckoutStatus.RECOVERED }
  });

  return NextResponse.json({
    id: checkout.id,
    status: checkout.status
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.abandonedCheckout.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
