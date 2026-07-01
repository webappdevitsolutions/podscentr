"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Product } from "@/data/products";
import { useCatalog } from "@/hooks/useCatalog";

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
};

type Toast = { id: number; message: string };

type CartContextValue = {
  items: CartItem[];
  toast: Toast | null;
  isReady: boolean;
  addItem: (product: Product, options?: Partial<CartItem>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  notify: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartLineId(product: Product, size?: string, color?: string) {
  return [product.id, size || product.sizes[0] || "Default", color || product.colors[0] || "Default"].join("__");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useCatalog();
  const [items, setItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const productIds = new Set(products.map((product) => product.id));
    const savedCart = localStorage.getItem("podscentra-cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart) as CartItem[];
      setItems(
        parsedCart
          .filter((item) => productIds.has(item.product.id))
          .map((item) => ({
            ...item,
            id: item.id || cartLineId(item.product, item.size, item.color)
          }))
      );
    }
    localStorage.removeItem("podscentra-wishlist");
    setIsReady(true);
  }, [products]);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem("podscentra-cart", JSON.stringify(items));
  }, [isReady, items]);

  const notify = useCallback((message: string) => {
    const next = { id: Date.now(), message };
    setToast(next);
    window.setTimeout(() => setToast((current) => (current?.id === next.id ? null : current)), 2400);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      toast,
      isReady,
      notify,
      addItem(product, options) {
        setItems((current) => {
          const size = options?.size ?? product.sizes[0];
          const color = options?.color ?? product.colors[0];
          const id = cartLineId(product, size, color);
          const existing = current.find((item) => item.id === id);
          if (existing) {
            return current.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + (options?.quantity ?? 1) } : item
            );
          }
          return [
            ...current,
            {
              id,
              product,
              quantity: options?.quantity ?? 1,
              size,
              color
            }
          ];
        });
        notify(`${product.name} added to cart`);
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id && item.product.id !== id));
        notify("Item removed");
      },
      updateQuantity(id, quantity) {
        setItems((current) =>
          current.map((item) => (item.id === id || item.product.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
        );
      },
      clearCart() {
        setItems([]);
      }
    }),
    [isReady, items, notify, toast]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
