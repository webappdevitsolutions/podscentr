"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CollectionStatus = "Active" | "Draft";

export type StoreCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: CollectionStatus;
  showInNavbar: boolean;
  featured: boolean;
  isAutomatic: boolean;
  rules: {
    type?: string;
    value?: string;
  };
  sortOrder: number;
  productCount: number;
  views?: number;
  clicks?: number;
  productsSold?: number;
  revenue?: number;
  conversionRate?: number;
  topProducts?: Array<{ name: string; quantity: number; revenue: number }>;
  createdAt: string;
  updatedAt: string;
};

type CollectionsContextValue = {
  collections: StoreCollection[];
  activeCollections: StoreCollection[];
  navbarCollections: StoreCollection[];
  isLoading: boolean;
  error: string;
  refreshCollections: () => Promise<void>;
  addCollection: (collection: Partial<StoreCollection>) => Promise<StoreCollection>;
  updateCollection: (id: string, updates: Partial<StoreCollection>) => Promise<StoreCollection>;
  deleteCollection: (id: string) => Promise<void>;
};

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

async function readCollectionResponse(response: Response, fallbackError: string) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: fallbackError };
  }
}

async function parseCollectionResponse(response: Response) {
  const result = (await readCollectionResponse(response, "Collection request failed.")) as StoreCollection | { error?: string };
  if (!response.ok) {
    throw new Error("error" in result ? result.error || "Collection request failed." : "Collection request failed.");
  }
  return result as StoreCollection;
}

export function CollectionsProvider({ children }: { children: React.ReactNode }) {
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCollections = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/collections?analytics=1", { cache: "no-store" });
      const result = (await readCollectionResponse(response, "Could not load collections.")) as StoreCollection[] | { error?: string };
      if (!response.ok || !Array.isArray(result)) {
        throw new Error(!Array.isArray(result) ? result.error : "Could not load collections.");
      }
      setCollections(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load collections.");
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCollections();
  }, [refreshCollections]);

  const addCollection = useCallback(async (collection: Partial<StoreCollection>) => {
    const response = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collection)
    });
    const saved = await parseCollectionResponse(response);
    setCollections((current) => [saved, ...current.filter((item) => item.id !== saved.id)].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
    return saved;
  }, []);

  const updateCollection = useCallback(async (id: string, updates: Partial<StoreCollection>) => {
    const response = await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const saved = await parseCollectionResponse(response);
    setCollections((current) => current.map((item) => (item.id === id ? saved : item)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
    return saved;
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    const response = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await readCollectionResponse(response, "Could not delete collection.")) as { error?: string };
      throw new Error(result.error || "Could not delete collection.");
    }
    setCollections((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<CollectionsContextValue>(() => {
    const activeCollections = collections.filter((collection) => collection.status === "Active");
    const navbarCollections = activeCollections.filter((collection) => collection.showInNavbar).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    return {
      collections,
      activeCollections,
      navbarCollections,
      isLoading,
      error,
      refreshCollections,
      addCollection,
      updateCollection,
      deleteCollection
    };
  }, [addCollection, collections, deleteCollection, error, isLoading, refreshCollections, updateCollection]);

  return <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>;
}

export function useCollections() {
  const value = useContext(CollectionsContext);
  if (!value) throw new Error("useCollections must be used within CollectionsProvider");
  return value;
}
