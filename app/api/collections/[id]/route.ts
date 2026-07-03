import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { collectionInclude, collectionUpdateInput, serializeCollection, type CollectionPayload } from "@/lib/collections-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const payload = (await request.json()) as CollectionPayload;
    const collection = await prisma.collection.update({
      where: { id },
      data: await collectionUpdateInput(payload, id),
      include: collectionInclude
    });

    return NextResponse.json(serializeCollection(collection));
  } catch (error) {
    console.error("Collection update failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update collection." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Collection delete failed", error);
    return NextResponse.json({ error: "Could not delete collection." }, { status: 400 });
  }
}
