"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { useCatalog } from "@/hooks/useCatalog";
import { useCollections } from "@/hooks/useCollections";

export default function CollectionPage() {
  const params = useParams<{ slug: string }>();
  const { activeProducts, isLoading: productsLoading } = useCatalog();
  const { activeCollections, isLoading: collectionsLoading } = useCollections();
  const collection = activeCollections.find((item) => item.slug === params.slug);
  const products = activeProducts.filter((product) => product.collectionList?.some((item) => item.slug === params.slug));
  const isLoading = productsLoading || collectionsLoading;

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-neutral-500 shadow-sm dark:bg-white/5">
          Loading collection...
        </div>
      </section>
    );
  }

  if (!collection) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black tracking-tight">Collection not found</h1>
        <p className="mx-auto mt-3 max-w-lg text-neutral-500 dark:text-neutral-400">This collection is not published yet or may have been removed.</p>
        <Link href="/shop" className="focus-ring mt-8 inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm font-bold text-white hover:bg-accent dark:bg-white dark:text-ink">
          Back to shop
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {collection.image ? (
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-neutral-100">
          <img src={collection.image} alt={collection.name} className="h-64 w-full object-cover sm:h-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.22em]">Collection</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">{collection.name}</h1>
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Collection</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">{collection.name}</h1>
        </div>
      )}

      {collection.description ? <p className="mb-8 max-w-3xl text-base leading-7 text-neutral-600 dark:text-neutral-300">{collection.description}</p> : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {!products.length ? (
        <div className="rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-lg font-black">No products in this collection yet.</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Assign active products to this collection from the admin product editor.</p>
        </div>
      ) : null}
    </section>
  );
}
