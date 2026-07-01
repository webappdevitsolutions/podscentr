"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductDetails } from "@/components/ProductDetails";
import { useCatalog } from "@/hooks/useCatalog";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const { activeProducts } = useCatalog();
  const product = activeProducts.find((item) => item.slug === params.slug);

  if (!product) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black">Product not available</h1>
        <p className="mt-3 text-neutral-500 dark:text-neutral-400">This product may be in draft, archived, or deleted.</p>
        <Link href="/shop" className="focus-ring mt-8 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-sm font-bold text-white dark:bg-white dark:text-ink">
          Back to shop
        </Link>
      </section>
    );
  }

  return <ProductDetails product={product} />;
}
