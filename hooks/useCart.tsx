"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Product } from "@/data/products";
import { useCatalog } from "@/hooks/useCatalog";
import { trackMetaEvent } from "@/lib/meta-client";

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
};

type Toast = { id: number; message: string };
type AddItemOptions = Partial<CartItem> & {
  openDrawer?: boolean;
};

type CartContextValue = {
  items: CartItem[];
  toast: Toast | null;
  isReady: boolean;
  isDrawerOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, options?: AddItemOptions) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  notify: (message: string) => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartLineId(product: Product, size?: string, color?: string) {
  return [product.id, size || product.sizes[0] || "Default", color || product.colors[0] || "Default"].join("__");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products, isLoading: isCatalogLoading } = useCatalog();
  const [items, setItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (isCatalogLoading) return;

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
  }, [isCatalogLoading, products]);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem("podscentra-cart", JSON.stringify(items));
  }, [isReady, items]);

  const notify = useCallback((message: string) => {
    const next = { id: Date.now(), message };
    setToast(next);
    window.setTimeout(() => setToast((current) => (current?.id === next.id ? null : current)), 2400);
  }, []);

  const openCartDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeCartDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      toast,
      isReady,
      isDrawerOpen,
      itemCount,
      subtotal,
      notify,
      openCartDrawer,
      closeCartDrawer,
      addItem(product, options) {
        const quantity = options?.quantity ?? 1;
        setItems((current) => {
          const size = options?.size ?? product.sizes[0];
          const color = options?.color ?? product.colors[0];
          const id = cartLineId(product, size, color);
          const existing = current.find((item) => item.id === id);
          if (existing) {
            return current.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + quantity } : item
            );
          }
          return [
            ...current,
            {
              id,
              product,
              quantity,
              size,
              color
            }
          ];
        });
        void trackMetaEvent("AddToCart", {
          content_ids: [product.id],
          content_type: "product",
          value: product.price * quantity,
          currency: "INR"
        });
        if (options?.openDrawer !== false) {
          openCartDrawer();
        }
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
    [closeCartDrawer, isDrawerOpen, isReady, itemCount, items, notify, openCartDrawer, subtotal, toast]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
