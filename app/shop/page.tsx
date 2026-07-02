"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useCatalog } from "@/hooks/useCatalog";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { trackMetaEvent } from "@/lib/meta-client";

export default function ShopPage() {
  const { activeProducts, categories } = useCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const filtered = useMemo(() => {
    const next = activeProducts
      .filter((product) => category === "All" || product.category === category)
      .filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === "low") return [...next].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...next].sort((a, b) => b.price - a.price);
    if (sort === "rating") return [...next].sort((a, b) => b.rating - a.rating);
    return next;
  }, [activeProducts, category, query, sort]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchString = query.trim();
    if (!searchString) return;
    void trackMetaEvent("Search", {
      search_string: searchString,
      currency: "INR"
    });
    void trackAnalyticsEvent("search", {
      searchString
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Shop Podscentra</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">Premium collection</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={submitSearch} className="focus-within:ring-2 focus-within:ring-accent flex min-h-12 items-center gap-2 rounded-full border border-black/10 bg-white px-4 dark:border-white/10 dark:bg-white/5">
            <button type="submit" aria-label="Search products">
              <Search size={18} />
            </button>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="w-full bg-transparent text-sm outline-none" />
          </form>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="focus-ring min-h-12 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold dark:border-white/10 dark:bg-neutral-950">
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>
      <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
        <span className="flex items-center gap-2 rounded-full bg-neutral-200 px-4 py-2 text-sm font-bold dark:bg-white/10">
          <SlidersHorizontal size={16} /> Filters
        </span>
        {categories.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`focus-ring rounded-full px-4 py-2 text-sm font-bold ${category === item ? "bg-accent text-white" : "bg-white dark:bg-white/5"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {!filtered.length ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-lg font-black">No products available.</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Add products to the catalog to make them visible in the shop.</p>
        </div>
      ) : null}
      {filtered.length ? (
        <div className="mt-10 flex justify-center gap-2">
          {[1, 2, 3].map((page) => (
            <button key={page} className={`focus-ring h-11 w-11 rounded-full font-bold ${page === 1 ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-white dark:bg-white/5"}`}>
              {page}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
