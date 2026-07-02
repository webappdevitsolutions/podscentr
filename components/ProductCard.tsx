"use client";

import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <motion.article whileHover={{ y: -6 }} className="group overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition dark:border-white/10 dark:bg-white/5">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-neutral-100">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        {product.badge ? <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-black backdrop-blur">{product.badge}</span> : null}
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">{product.category}</p>
            <Link href={`/product/${product.slug}`} className="mt-1 block font-black hover:text-accent">
              {product.name}
            </Link>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black">{formatCurrency(product.price)}</span>
            {product.oldPrice ? <span className="text-sm text-neutral-400 line-through">{formatCurrency(product.oldPrice)}</span> : null}
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-neutral-500">
            <Star size={15} className="fill-accent text-accent" /> {product.rating}
          </span>
        </div>
        <button onClick={() => addItem(product)} className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-accent dark:bg-white dark:text-ink dark:hover:bg-accent dark:hover:text-white">
          <ShoppingCart size={17} strokeWidth={1.9} /> Add to cart
        </button>
      </div>
    </motion.article>
  );
}
