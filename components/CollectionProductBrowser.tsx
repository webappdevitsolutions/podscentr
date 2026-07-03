"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { type Product } from "@/data/products";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

type CollectionProductBrowserProps = {
  collectionId: string;
  products: Product[];
};

function discountPercent(product: Product) {
  const compareAt = Number(product.compareAtPrice || product.oldPrice || 0);
  if (!compareAt || compareAt <= product.price) return 0;
  return Math.round(((compareAt - product.price) / compareAt) * 100);
}

export function CollectionProductBrowser({ collectionId, products }: CollectionProductBrowserProps) {
  const [sort, setSort] = useState("newest");
  const [price, setPrice] = useState("all");
  const [size, setSize] = useState("all");
  const [color, setColor] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [rating, setRating] = useState("all");
  const [visibleCount, setVisibleCount] = useState(12);
  const sizes = useMemo(() => Array.from(new Set(products.flatMap((product) => product.sizes || []).filter(Boolean))), [products]);
  const colors = useMemo(() => Array.from(new Set(products.flatMap((product) => product.colors || []).filter(Boolean))), [products]);

  useEffect(() => {
    void trackAnalyticsEvent("collection_view", { collectionId });
  }, [collectionId]);

  const filtered = useMemo(() => {
    const next = products
      .filter((product) => {
        if (price === "under_500") return product.price < 500;
        if (price === "500_999") return product.price >= 500 && product.price <= 999;
        if (price === "1000_plus") return product.price >= 1000;
        return true;
      })
      .filter((product) => size === "all" || product.sizes?.includes(size))
      .filter((product) => color === "all" || product.colors?.includes(color))
      .filter((product) => availability === "all" || (availability === "in_stock" ? Number(product.stock || 0) > 0 : Number(product.stock || 0) <= 0))
      .filter((product) => rating === "all" || product.rating >= Number(rating));

    if (sort === "price_low") return [...next].sort((a, b) => a.price - b.price);
    if (sort === "price_high") return [...next].sort((a, b) => b.price - a.price);
    if (sort === "popularity") return [...next].sort((a, b) => b.reviews - a.reviews);
    if (sort === "discount") return [...next].sort((a, b) => discountPercent(b) - discountPercent(a));
    return [...next].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [availability, color, price, products, rating, size, sort]);

  const visibleProducts = filtered.slice(0, visibleCount);

  return (
    <>
      <div className="mb-8 grid gap-3 rounded-3xl bg-white p-4 shadow-sm dark:bg-white/5 sm:grid-cols-2 lg:grid-cols-6">
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 rounded-full border border-black/10 bg-transparent px-4 text-sm font-bold dark:border-white/10">
          <option value="newest">Newest</option>
          <option value="popularity">Popularity</option>
          <option value="discount">Discount</option>
          <option value="price_low">Price low</option>
          <option value="price_high">Price high</option>
        </select>
        <select value={price} onChange={(event) => setPrice(event.target.value)} className="min-h-11 rounded-full border border-black/10 bg-transparent px-4 text-sm font-bold dark:border-white/10">
          <option value="all">All prices</option>
          <option value="under_500">Under ₹500</option>
          <option value="500_999">₹500 - ₹999</option>
          <option value="1000_plus">₹1000+</option>
        </select>
        <select value={size} onChange={(event) => setSize(event.target.value)} className="min-h-11 rounded-full border border-black/10 bg-transparent px-4 text-sm font-bold dark:border-white/10">
          <option value="all">All sizes</option>
          {sizes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={color} onChange={(event) => setColor(event.target.value)} className="min-h-11 rounded-full border border-black/10 bg-transparent px-4 text-sm font-bold dark:border-white/10">
          <option value="all">All colors</option>
          {colors.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="min-h-11 rounded-full border border-black/10 bg-transparent px-4 text-sm font-bold dark:border-white/10">
          <option value="all">Availability</option>
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
        <select value={rating} onChange={(event) => setRating(event.target.value)} className="min-h-11 rounded-full border border-black/10 bg-transparent px-4 text-sm font-bold dark:border-white/10">
          <option value="all">All ratings</option>
          <option value="4">4 stars+</option>
          <option value="4.5">4.5 stars+</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {!filtered.length ? (
        <div className="rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-lg font-black">No products match these filters.</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Try changing the filters or check back after new products are added.</p>
        </div>
      ) : null}

      {visibleCount < filtered.length ? (
        <div className="mt-10 text-center">
          <button onClick={() => setVisibleCount((current) => current + 12)} className="focus-ring min-h-12 rounded-full bg-ink px-7 text-sm font-black text-white hover:bg-accent dark:bg-white dark:text-ink">
            Load more products
          </button>
        </div>
      ) : null}
    </>
  );
}
