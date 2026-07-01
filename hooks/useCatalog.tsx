"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type Product, type ProductVariant } from "@/data/products";

export type ProductStatus = "Active" | "Draft" | "Archived";
export type Marketplace = "Amazon" | "Flipkart" | "Meesho" | "Myntra" | "Other" | "Manual";

export type CatalogProduct = Product & {
  status: ProductStatus;
  sku: string;
  barcode: string;
  stock: number;
  reorderLevel: number;
  cost: number;
  supplier: string;
  vendor: string;
  productType: string;
  collections: string;
  tags: string;
  marketplace: Marketplace;
  sourceUrl: string;
  externalId: string;
  chargeTax: boolean;
  trackQuantity: boolean;
  continueSelling: boolean;
  hasSkuBarcode: boolean;
  physicalProduct: boolean;
  weight: number;
  weightUnit: "kg" | "g" | "lb" | "oz";
  originCountry: string;
  hsCode: string;
  onlineStore: boolean;
  pointOfSale: boolean;
  marketIndia: boolean;
  marketInternational: boolean;
  seoTitle: string;
  metaDescription: string;
  optionName: string;
  optionValues: string;
  variants: ProductVariant[];
  notes: string;
};

type CatalogContextValue = {
  products: CatalogProduct[];
  activeProducts: CatalogProduct[];
  categories: string[];
  isLoading: boolean;
  error: string;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Partial<CatalogProduct>) => Promise<CatalogProduct>;
  updateProduct: (id: string, updates: Partial<CatalogProduct>) => Promise<CatalogProduct>;
  deleteProduct: (id: string) => Promise<void>;
  setProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  adjustStock: (id: string, stock: number) => Promise<void>;
  importProducts: (products: Partial<CatalogProduct>[]) => Promise<CatalogProduct[]>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

async function parseProductResponse(response: Response) {
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result?.error || "Catalog request failed.");
  }
  return result as CatalogProduct;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      const result = (await response.json()) as CatalogProduct[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) {
        throw new Error(!Array.isArray(result) ? result.error : "Could not load products.");
      }
      setProducts(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load products.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const addProduct = useCallback(async (product: Partial<CatalogProduct>) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    });
    const savedProduct = await parseProductResponse(response);
    setProducts((current) => [savedProduct, ...current.filter((item) => item.id !== savedProduct.id)]);
    window.dispatchEvent(new CustomEvent("podscentra-catalog-updated"));
    return savedProduct;
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<CatalogProduct>) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const savedProduct = await parseProductResponse(response);
    setProducts((current) => current.map((product) => (product.id === id ? savedProduct : product)));
    window.dispatchEvent(new CustomEvent("podscentra-catalog-updated"));
    return savedProduct;
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Could not delete product." }));
      throw new Error(result.error || "Could not delete product.");
    }
    setProducts((current) => current.filter((product) => product.id !== id));
    window.dispatchEvent(new CustomEvent("podscentra-catalog-updated"));
  }, []);

  const setProductStatus = useCallback(
    async (id: string, status: ProductStatus) => {
      await updateProduct(id, { status });
    },
    [updateProduct]
  );

  const adjustStock = useCallback(
    async (id: string, stock: number) => {
      await updateProduct(id, { stock: Math.max(0, stock) });
    },
    [updateProduct]
  );

  const importProducts = useCallback(
    async (nextProducts: Partial<CatalogProduct>[]) => {
      const savedProducts = await Promise.all(nextProducts.map((product) => addProduct(product)));
      await refreshProducts();
      return savedProducts;
    },
    [addProduct, refreshProducts]
  );

  const value = useMemo<CatalogContextValue>(() => {
    const activeProducts = products.filter((product) => product.status === "Active");
    const categories = ["All", ...Array.from(new Set(activeProducts.map((product) => product.category).filter(Boolean)))];

    return {
      products,
      activeProducts,
      categories,
      isLoading,
      error,
      refreshProducts,
      addProduct,
      updateProduct,
      deleteProduct,
      setProductStatus,
      adjustStock,
      importProducts
    };
  }, [addProduct, adjustStock, deleteProduct, error, importProducts, isLoading, products, refreshProducts, setProductStatus, updateProduct]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used within CatalogProvider");
  return value;
}
