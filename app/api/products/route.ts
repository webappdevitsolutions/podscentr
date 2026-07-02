import { NextResponse } from "next/server";
import { getDatabaseUrlDiagnostics, prisma } from "@/lib/prisma";
import { productCreateInput, productInclude, productUpdateInput, serializeProduct } from "@/lib/catalog-db";
import { productDataTooLargeMessage, productErrorMessage, readProductPayload } from "@/lib/product-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(products.map(serializeProduct));
  } catch (error) {
    console.error("Product list failed", error);
    return NextResponse.json(
      {
        error: "Could not load products.",
        details: getDatabaseUrlDiagnostics().message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readProductPayload(request);
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
    const message = productErrorMessage(error, "Could not save product.");
    return NextResponse.json({ error: message }, { status: message === productDataTooLargeMessage ? 413 : 400 });
  }
}
