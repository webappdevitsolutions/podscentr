import { NextResponse } from "next/server";
import { CollectionStatus } from "@/lib/generated/prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { collectionCreateInput, collectionInclude, serializeCollection, type CollectionPayload } from "@/lib/collections-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const navbarOnly = url.searchParams.get("navbar") === "1";
  const activeOnly = navbarOnly || url.searchParams.get("active") === "1";

  const collections = await prisma.collection.findMany({
    where: {
      ...(activeOnly ? { status: CollectionStatus.Active } : {}),
      ...(navbarOnly ? { showInNavbar: true } : {})
    },
    include: collectionInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  return NextResponse.json(collections.map(serializeCollection));
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as CollectionPayload;
    const collection = await prisma.collection.create({
      data: await collectionCreateInput(payload),
      include: collectionInclude
    });

    return NextResponse.json(serializeCollection(collection), { status: 201 });
  } catch (error) {
    console.error("Collection create failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save collection." }, { status: 400 });
  }
}
