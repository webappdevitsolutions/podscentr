import { type CatalogPayload } from "@/lib/catalog-db";

export const productDataTooLargeMessage = "Product data is too large. Please reduce image size or use an image URL.";

const maxProductPayloadChars = 3_000_000;

export async function readProductPayload(request: Request) {
  const text = await request.text();
  if (text.length > maxProductPayloadChars) {
    throw new Error(productDataTooLargeMessage);
  }

  try {
    return JSON.parse(text) as CatalogPayload;
  } catch {
    throw new Error("Invalid product data. Please refresh and try again.");
  }
}

export function productErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
