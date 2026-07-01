import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productCreateInput, productInclude, productUpdateInput, serializeProduct, type CatalogPayload } from "@/lib/catalog-db";

export const runtime = "nodejs";

export async function GET() {
  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(products.map(serializeProduct));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CatalogPayload;
    const createInput = productCreateInput(payload);
    const existing = await prisma.product.findUnique({
      where: { slug: createInput.slug },
      include: productInclude
    });

    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: productUpdateInput({ ...serializeProduct(existing), ...payload, id: existing.id }),
          include: productInclude
        })
      : await prisma.product.create({
          data: createInput,
          include: productInclude
        });

    return NextResponse.json(serializeProduct(product), { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Product create failed", error);
    return NextResponse.json({ error: "Could not save product." }, { status: 400 });
  }
}
