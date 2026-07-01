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
  addProduct: (product: Partial<CatalogProduct>) => CatalogProduct;
  updateProduct: (id: string, updates: Partial<CatalogProduct>) => void;
  deleteProduct: (id: string) => void;
  setProductStatus: (id: string, status: ProductStatus) => void;
  adjustStock: (id: string, stock: number) => void;
};

const catalogStorageKey = "podscentra-catalog-products";
const oldCrmStorageKey = "podscentra-crm-data";
const placeholderImage = "/product-placeholder.svg";

const CatalogContext = createContext<CatalogContextValue | null>(null);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `product-${Date.now()}`;
}

function makeId() {
  return `PRD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function normalizeProduct(input: Partial<CatalogProduct>): CatalogProduct {
  const name = input.name?.trim() || "Untitled Product";
  const gallery = input.gallery?.filter(Boolean).length ? input.gallery.filter(Boolean) : [];
  const image = gallery[0] || input.image || input.imageUrl || placeholderImage;
  const price = Number(input.price ?? 0);
  const oldPrice = Number(input.oldPrice ?? input.compareAtPrice ?? 0) || undefined;
  const supplier = input.supplier || input.vendor || "";

  return {
    id: input.id || makeId(),
    slug: input.slug || slugify(name),
    name,
    category: input.category || "Uncategorized",
    price,
    oldPrice,
    compareAtPrice: oldPrice,
    cost: Number(input.cost || 0),
    stock: Number(input.stock || 0),
    reorderLevel: Number(input.reorderLevel || 5),
    sku: input.sku || `${slugify(name).slice(0, 12).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    barcode: input.barcode || "",
    status: input.status || "Draft",
    supplier,
    vendor: input.vendor || supplier,
    productType: input.productType || "",
    collections: input.collections || "",
    tags: input.tags || "",
    marketplace: input.marketplace || "Manual",
    sourceUrl: input.sourceUrl || "",
    externalId: input.externalId || "",
    imageUrl: input.imageUrl || image,
    chargeTax: input.chargeTax ?? true,
    trackQuantity: input.trackQuantity ?? true,
    continueSelling: input.continueSelling ?? false,
    hasSkuBarcode: input.hasSkuBarcode ?? Boolean(input.sku || input.barcode),
    physicalProduct: input.physicalProduct ?? true,
    weight: Number(input.weight || 0),
    weightUnit: input.weightUnit || "kg",
    originCountry: input.originCountry || "",
    hsCode: input.hsCode || "",
    onlineStore: input.onlineStore ?? true,
    pointOfSale: input.pointOfSale ?? false,
    marketIndia: input.marketIndia ?? true,
    marketInternational: input.marketInternational ?? false,
    seoTitle: input.seoTitle || name,
    metaDescription: input.metaDescription || input.description || "",
    optionName: input.optionName || "",
    optionValues: input.optionValues || "",
    variants: input.variants?.length ? input.variants : [],
    notes: input.notes || "",
    rating: Number(input.rating || 5),
    reviews: Number(input.reviews || 0),
    badge: input.badge,
    colors: input.colors?.length ? input.colors : ["Default"],
    sizes: input.sizes?.length ? input.sizes : ["Default"],
    image,
    gallery: gallery.length ? gallery : [image],
    description: input.description || input.notes || "Product details will be updated soon."
  };
}

function loadInitialProducts() {
  if (typeof window === "undefined") return [];

  const saved = localStorage.getItem(catalogStorageKey);
  if (saved) return (JSON.parse(saved) as Partial<CatalogProduct>[]).map(normalizeProduct);

  const oldCrm = localStorage.getItem(oldCrmStorageKey);
  if (!oldCrm) return [];

  try {
    const parsed = JSON.parse(oldCrm) as { products?: Partial<CatalogProduct>[] };
    return (parsed.products || []).map(normalizeProduct);
  } catch {
    return [];
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setProducts(loadInitialProducts());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(catalogStorageKey, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("podscentra-catalog-updated"));
  }, [isReady, products]);

  const addProduct = useCallback((product: Partial<CatalogProduct>) => {
    const next = normalizeProduct(product);
    setProducts((current) => [next, ...current]);
    return next;
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<CatalogProduct>) => {
    setProducts((current) =>
      current.map((product) => (product.id === id ? normalizeProduct({ ...product, ...updates, id: product.id }) : product))
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((current) => current.filter((product) => product.id !== id));
  }, []);

  const setProductStatus = useCallback((id: string, status: ProductStatus) => {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, status } : product)));
  }, []);

  const adjustStock = useCallback((id: string, stock: number) => {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, stock: Math.max(0, stock) } : product)));
  }, []);

  const value = useMemo<CatalogContextValue>(() => {
    const activeProducts = products.filter((product) => product.status === "Active");
    const categories = ["All", ...Array.from(new Set(activeProducts.map((product) => product.category).filter(Boolean)))];

    return {
      products,
      activeProducts,
      categories,
      addProduct,
      updateProduct,
      deleteProduct,
      setProductStatus,
      adjustStock
    };
  }, [addProduct, adjustStock, deleteProduct, products, setProductStatus, updateProduct]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used within CatalogProvider");
  return value;
}
