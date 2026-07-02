import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productInclude, productUpdateInput, serializeProduct } from "@/lib/catalog-db";
import { productDataTooLargeMessage, productErrorMessage, readProductPayload } from "@/lib/product-api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const payload = await readProductPayload(request);
    const existing = await prisma.product.findUnique({
      where: { id },
      include: productInclude
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: productUpdateInput({ ...serializeProduct(existing), ...payload, id }),
      include: productInclude
    });

    return NextResponse.json(serializeProduct(product));
  } catch (error) {
    console.error("Product update failed", error);
    const message = productErrorMessage(error, "Could not update product.");
    return NextResponse.json({ error: message }, { status: message === productDataTooLargeMessage ? 413 : 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Product delete failed", error);
    return NextResponse.json({ error: productErrorMessage(error, "Could not delete product.") }, { status: 400 });
  }
}
