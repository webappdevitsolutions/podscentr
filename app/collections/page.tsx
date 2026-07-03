"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

function fallbackImage(name: string) {
  return `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop&collection=${encodeURIComponent(name)}`;
}

export default function CollectionsPage() {
  const { activeCollections, isLoading } = useCollections();
  const collections = [...activeCollections].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Collections</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">Shop by collection</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
          Curated edits for every drop, category, and deal.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl bg-white p-10 text-center text-sm font-semibold text-neutral-500 shadow-sm dark:bg-white/5">Loading collections...</div>
      ) : collections.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              onClick={() => void trackAnalyticsEvent("collection_click", { collectionId: collection.id })}
              className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-luxury dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                <img src={collection.image || fallbackImage(collection.name)} alt={collection.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">{collection.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-neutral-500">{collection.productCount} products</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition group-hover:bg-accent dark:bg-white dark:text-ink">
                    <ArrowRight size={18} />
                  </span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{collection.description || "Explore the latest products in this curated collection."}</p>
                <span className="mt-5 inline-flex min-h-10 items-center rounded-full bg-neutral-100 px-4 text-sm font-black text-ink dark:bg-white/10 dark:text-white">
                  Shop Collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-white/5">
          <h2 className="text-xl font-black">No active collections yet.</h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Publish collections from the admin panel to show them here.</p>
        </div>
      )}
    </section>
  );
}
