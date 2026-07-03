"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bold,
  ChevronDown,
  GripVertical,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  Plus,
  Underline
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { type ProductVariant } from "@/data/products";
import { useCatalog, type CatalogProduct, type Marketplace, type ProductStatus } from "@/hooks/useCatalog";
import { useCollections } from "@/hooks/useCollections";
import { formatCurrency } from "@/lib/utils";

type EditorMode = "new" | "edit";
type WeightUnit = "kg" | "g" | "lb" | "oz";

type EditorState = {
  title: string;
  description: string;
  status: ProductStatus;
  media: string[];
  mediaUrlDraft: string;
  price: string;
  compareAtPrice: string;
  chargeTax: boolean;
  cost: string;
  trackQuantity: boolean;
  stock: string;
  continueSelling: boolean;
  hasSkuBarcode: boolean;
  sku: string;
  barcode: string;
  physicalProduct: boolean;
  weight: string;
  weightUnit: WeightUnit;
  showCustoms: boolean;
  originCountry: string;
  hsCode: string;
  optionName: string;
  optionValues: string;
  variants: ProductVariant[];
  seoTitle: string;
  metaDescription: string;
  urlHandle: string;
  category: string;
  productType: string;
  vendor: string;
  collections: string;
  collectionIds: string[];
  tags: string;
  onlineStore: boolean;
  pointOfSale: boolean;
  marketIndia: boolean;
  marketInternational: boolean;
  sourceUrl: string;
  marketplace: Marketplace;
  externalId: string;
};

const emptyState: EditorState = {
  title: "",
  description: "",
  status: "Draft",
  media: [],
  mediaUrlDraft: "",
  price: "",
  compareAtPrice: "",
  chargeTax: true,
  cost: "",
  trackQuantity: true,
  stock: "0",
  continueSelling: false,
  hasSkuBarcode: false,
  sku: "",
  barcode: "",
  physicalProduct: true,
  weight: "0",
  weightUnit: "kg",
  showCustoms: false,
  originCountry: "",
  hsCode: "",
  optionName: "",
  optionValues: "",
  variants: [],
  seoTitle: "",
  metaDescription: "",
  urlHandle: "",
  category: "",
  productType: "",
  vendor: "",
  collections: "",
  collectionIds: [],
  tags: "",
  onlineStore: true,
  pointOfSale: false,
  marketIndia: true,
  marketInternational: false,
  sourceUrl: "",
  marketplace: "Manual",
  externalId: ""
};

const marketplaces: Marketplace[] = ["Manual", "Amazon", "Flipkart", "Meesho", "Myntra", "Other"];
const maxOriginalImageBytes = 6 * 1024 * 1024;
const maxCompressedImageBytes = 900 * 1024;
const maxInlineMediaBytes = 2.5 * 1024 * 1024;
const productDataTooLargeMessage = "Product data is too large. Please reduce image size or use an image URL.";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function currencyNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dataUrlSize(value: string) {
  if (!value.startsWith("data:")) return 0;
  const base64 = value.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function compressImageFile(file: File) {
  if (file.size > maxOriginalImageBytes) {
    throw new Error(productDataTooLargeMessage);
  }

  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    if (file.size > maxCompressedImageBytes) throw new Error(productDataTooLargeMessage);
    return blobToDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image upload failed. Try a smaller image.");
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
    if (!blob || blob.size > maxCompressedImageBytes) {
      throw new Error(productDataTooLargeMessage);
    }

    return blobToDataUrl(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function readAdminResponse(response: Response, fallbackError: string) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.error("Admin API returned non-JSON response", {
      status: response.status,
      body: text.slice(0, 160)
    });

    if (response.status === 413 || text.toLowerCase().startsWith("request entity too large") || text.toLowerCase().includes("request entity")) {
      return { error: productDataTooLargeMessage };
    }

    return { error: fallbackError };
  }
}

function productToState(product: CatalogProduct): EditorState {
  return {
    ...emptyState,
    title: product.name,
    description: product.description,
    status: product.status,
    media: product.gallery?.length ? product.gallery : [product.image],
    price: String(product.price || ""),
    compareAtPrice: String(product.compareAtPrice || product.oldPrice || ""),
    chargeTax: product.chargeTax,
    cost: String(product.cost || ""),
    trackQuantity: product.trackQuantity,
    stock: String(product.stock || 0),
    continueSelling: product.continueSelling,
    hasSkuBarcode: product.hasSkuBarcode,
    sku: product.sku,
    barcode: product.barcode,
    physicalProduct: product.physicalProduct,
    weight: String(product.weight || 0),
    weightUnit: product.weightUnit,
    originCountry: product.originCountry,
    hsCode: product.hsCode,
    optionName: product.optionName,
    optionValues: product.optionValues,
    variants: product.variants,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    urlHandle: product.slug,
    category: product.category === "Uncategorized" ? "" : product.category,
    productType: product.productType,
    vendor: product.vendor || product.supplier,
    collections: product.collections,
    collectionIds: product.collectionIds || [],
    tags: product.tags,
    onlineStore: product.onlineStore,
    pointOfSale: product.pointOfSale,
    marketIndia: product.marketIndia,
    marketInternational: product.marketInternational,
    sourceUrl: product.sourceUrl,
    marketplace: product.marketplace,
    externalId: product.externalId
  };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-neutral-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        placeholder={placeholder}
        className="min-h-10 rounded-lg border border-black/20 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
      />
    </label>
  );
}

function CheckboxField({ label, checked, onChange, helper }: { label: string; checked: boolean; onChange: (value: boolean) => void; helper?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm font-medium text-neutral-800">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 rounded border-black/20 accent-neutral-950" />
      <span>
        {label}
        {helper ? <span className="mt-1 block text-xs font-normal leading-5 text-neutral-500">{helper}</span> : null}
      </span>
    </label>
  );
}

export function ProductEditor({ mode, productId }: { mode: EditorMode; productId?: string }) {
  const router = useRouter();
  const { products, addProduct, updateProduct, isLoading } = useCatalog();
  const { collections: storeCollections } = useCollections();
  const existingProduct = useMemo(() => products.find((product) => product.id === productId), [productId, products]);
  const [state, setState] = useState<EditorState>(emptyState);
  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && existingProduct) {
      setState(productToState(existingProduct));
    }
  }, [existingProduct, mode]);

  function patch(updates: Partial<EditorState>) {
    setState((current) => ({ ...current, ...updates }));
  }

  const profit = Math.max(0, currencyNumber(state.price) - currencyNumber(state.cost));
  const margin = currencyNumber(state.price) > 0 ? Math.round((profit / currencyNumber(state.price)) * 100) : 0;
  const handle = state.urlHandle || slugify(state.title);
  const seoTitle = state.seoTitle || state.title || "Product title";
  const seoDescription = state.metaDescription || state.description || "Product description preview will appear here.";

  function readImageFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    Promise.all(files.map((file) => compressImageFile(file)))
      .then((images) => {
        const nextMedia = [...state.media, ...images];
        const inlineMediaBytes = nextMedia.reduce((sum, image) => sum + dataUrlSize(image), 0);
        if (inlineMediaBytes > maxInlineMediaBytes) {
          setMessage(productDataTooLargeMessage);
          return;
        }
        patch({ media: nextMedia });
        setMessage("Image uploaded and optimized.");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : productDataTooLargeMessage));

    event.target.value = "";
  }

  function addMediaUrl() {
    const url = state.mediaUrlDraft.trim();
    if (!url) return;
    patch({ media: [...state.media, url], mediaUrlDraft: "" });
  }

  function removeMedia(index: number) {
    patch({ media: state.media.filter((_, mediaIndex) => mediaIndex !== index) });
  }

  function moveMedia(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= state.media.length) return;
    const next = [...state.media];
    const item = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = item;
    patch({ media: next });
  }

  function generateVariants() {
    const values = state.optionValues
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    patch({
      variants: values.map((value, index) => ({
        id: `VAR-${index + 1}-${slugify(value) || Date.now()}`,
        name: state.optionName ? `${state.optionName}: ${value}` : value,
        price: currencyNumber(state.price),
        stock: Number(state.stock || 0),
        sku: state.sku ? `${state.sku}-${value.replace(/\s+/g, "").toUpperCase()}` : value.replace(/\s+/g, "-").toUpperCase()
      }))
    });
  }

  function updateVariant(index: number, updates: Partial<ProductVariant>) {
    patch({
      variants: state.variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...updates } : variant))
    });
  }

  function toggleCollection(collectionId: string) {
    patch({
      collectionIds: state.collectionIds.includes(collectionId)
        ? state.collectionIds.filter((id) => id !== collectionId)
        : [...state.collectionIds, collectionId]
    });
  }

  async function importFromMarketplace() {
    if (!state.sourceUrl.trim()) {
      setMessage("Paste an Amazon, Flipkart, Meesho, Myntra, or other product URL first.");
      return;
    }

    setIsImporting(true);
    setMessage("");

    try {
      const response = await fetch("/api/product-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.sourceUrl })
      });
      const result = (await readAdminResponse(response, "Could not read that marketplace link.")) as {
        name?: string;
        imageUrl?: string;
        price?: number;
        marketplace?: Marketplace;
        externalId?: string;
        sourceUrl?: string;
        warning?: string;
        error?: string;
      };

      if (!response.ok) {
        setMessage(result.error || "Could not read that marketplace link.");
        return;
      }

      patch({
        title: state.title || result.name || "",
        price: state.price || (result.price ? String(result.price) : ""),
        media: result.imageUrl && !state.media.includes(result.imageUrl) ? [...state.media, result.imageUrl] : state.media,
        marketplace: result.marketplace || "Other",
        externalId: result.externalId || "",
        sourceUrl: result.sourceUrl || state.sourceUrl
      });
      setMessage(result.warning || "Marketplace details added. Review and save the product.");
    } catch {
      setMessage("Could not import this product link right now.");
    } finally {
      setIsImporting(false);
    }
  }

  async function saveProduct() {
    const title = state.title.trim();
    if (!title) {
      setMessage("Add a product title before saving.");
      return;
    }

    const gallery = state.media.length ? state.media : ["/product-placeholder.svg"];
    const inlineMediaBytes = gallery.reduce((sum, image) => sum + dataUrlSize(image), 0);
    if (inlineMediaBytes > maxInlineMediaBytes) {
      setMessage(productDataTooLargeMessage);
      return;
    }

    const payload: Partial<CatalogProduct> = {
      name: title,
      slug: handle || slugify(title),
      description: state.description || "Product details will be updated soon.",
      status: state.status,
      gallery,
      image: gallery[0],
      imageUrl: gallery[0],
      price: currencyNumber(state.price),
      oldPrice: currencyNumber(state.compareAtPrice) || undefined,
      compareAtPrice: currencyNumber(state.compareAtPrice) || undefined,
      chargeTax: state.chargeTax,
      cost: currencyNumber(state.cost),
      trackQuantity: state.trackQuantity,
      stock: Number(state.stock || 0),
      continueSelling: state.continueSelling,
      hasSkuBarcode: state.hasSkuBarcode,
      sku: state.sku,
      barcode: state.barcode,
      physicalProduct: state.physicalProduct,
      weight: Number(state.weight || 0),
      weightUnit: state.weightUnit,
      originCountry: state.originCountry,
      hsCode: state.hsCode,
      optionName: state.optionName,
      optionValues: state.optionValues,
      variants: state.variants,
      seoTitle: seoTitle,
      metaDescription: state.metaDescription,
      category: state.category || "Uncategorized",
      productType: state.productType,
      supplier: state.vendor,
      vendor: state.vendor,
      collections: state.collections,
      collectionIds: state.collectionIds,
      tags: state.tags,
      onlineStore: state.onlineStore,
      pointOfSale: state.pointOfSale,
      marketIndia: state.marketIndia,
      marketInternational: state.marketInternational,
      sourceUrl: state.sourceUrl,
      marketplace: state.marketplace,
      externalId: state.externalId,
      notes: state.description
    };

    setIsSaving(true);
    setMessage("");

    try {
      if (mode === "edit" && existingProduct) {
        await updateProduct(existingProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      router.push("/admin/products");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save product.");
    } finally {
      setIsSaving(false);
    }
  }

  if (mode === "edit" && productId && isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-black/10 bg-white p-8 text-center text-sm font-semibold text-neutral-500 shadow-sm">
          Loading product...
        </div>
      </div>
    );
  }

  if (mode === "edit" && productId && !existingProduct) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-700">
          <ArrowLeft size={18} /> Products
        </Link>
        <div className="mt-6 rounded-xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">Product not found</h1>
          <p className="mt-2 text-sm text-neutral-500">This product may have been deleted from this browser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 lg:px-8">
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-black/10 bg-[#f1f1f1]/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white" aria-label="Back to products">
              <ArrowLeft size={19} />
            </Link>
            <h1 className="text-xl font-bold tracking-tight">{mode === "new" ? "Add product" : "Edit product"}</h1>
          </div>
          <button onClick={saveProduct} disabled={isSaving} className="min-h-9 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {message ? <p className="mb-4 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow-sm">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,760px)_320px]">
        <div className="space-y-4">
          <Card title="Basic">
            <div className="space-y-4">
              <TextField label="Title" value={state.title} onChange={(title) => patch({ title, seoTitle: state.seoTitle || title })} placeholder="Short sleeve t-shirt" />
              <label className="grid gap-1 text-sm font-medium text-neutral-700">
                Description
                <div className="overflow-hidden rounded-lg border border-black/20 bg-white">
                  <div className="flex min-h-10 items-center gap-1 border-b border-black/10 bg-neutral-50 px-2 text-neutral-600">
                    {[Bold, Italic, Underline, List, LinkIcon].map((Icon, index) => (
                      <button type="button" key={index} className="grid h-8 w-8 place-items-center rounded-md hover:bg-white" aria-label="Formatting tool">
                        <Icon size={16} />
                      </button>
                    ))}
                    <button type="button" className="ml-1 flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold hover:bg-white">
                      Paragraph <ChevronDown size={14} />
                    </button>
                  </div>
                  <textarea
                    value={state.description}
                    onChange={(event) => patch({ description: event.target.value, metaDescription: state.metaDescription || event.target.value.slice(0, 150) })}
                    rows={8}
                    className="w-full resize-y border-0 p-3 text-sm outline-none"
                  />
                </div>
              </label>
            </div>
          </Card>

          <Card title="Media">
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-black/25 p-5 text-center">
                <ImagePlus className="mx-auto text-neutral-500" size={28} />
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <label className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-bold shadow-sm hover:bg-neutral-50">
                    Upload new
                    <input type="file" accept="image/*" multiple onChange={readImageFiles} className="hidden" />
                  </label>
                  <button type="button" onClick={addMediaUrl} className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-bold shadow-sm hover:bg-neutral-50">
                    Add from URL
                  </button>
                </div>
                <input
                  value={state.mediaUrlDraft}
                  onChange={(event) => patch({ mediaUrlDraft: event.target.value })}
                  placeholder="Paste image URL"
                  className="mx-auto mt-3 min-h-9 w-full max-w-md rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-neutral-950"
                />
              </div>

              {state.media.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {state.media.map((image, index) => (
                    <div key={`${image}-${index}`} className="group relative overflow-hidden rounded-lg border border-black/10 bg-neutral-100">
                      <img src={image} alt={`Product media ${index + 1}`} className="aspect-square w-full object-cover" />
                      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-lg bg-white/90 px-2 py-1 text-xs font-bold opacity-0 shadow-sm transition group-hover:opacity-100">
                        <button type="button" onClick={() => moveMedia(index, -1)} disabled={index === 0} className="disabled:opacity-30">Up</button>
                        <button type="button" onClick={() => moveMedia(index, 1)} disabled={index === state.media.length - 1} className="disabled:opacity-30">Down</button>
                        <button type="button" onClick={() => removeMedia(index)} className="text-rose-600">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-500">No media yet. Upload an image or add an image URL.</p>
              )}
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Price" value={state.price} onChange={(price) => patch({ price })} type="number" placeholder="0.00" />
              <TextField label="Compare-at price" value={state.compareAtPrice} onChange={(compareAtPrice) => patch({ compareAtPrice })} type="number" placeholder="0.00" />
              <div className="sm:col-span-2">
                <CheckboxField label="Charge tax on this product" checked={state.chargeTax} onChange={(chargeTax) => patch({ chargeTax })} />
              </div>
              <TextField label="Cost per item" value={state.cost} onChange={(cost) => patch({ cost })} type="number" placeholder="0.00" />
              <div className="grid gap-1 text-sm font-medium text-neutral-700">
                Profit
                <div className="flex min-h-10 items-center rounded-lg border border-black/15 bg-neutral-50 px-3 text-sm font-semibold">{formatCurrency(profit)}</div>
              </div>
              <div className="grid gap-1 text-sm font-medium text-neutral-700">
                Margin
                <div className="flex min-h-10 items-center rounded-lg border border-black/15 bg-neutral-50 px-3 text-sm font-semibold">{margin}%</div>
              </div>
            </div>
          </Card>

          <Card title="Inventory">
            <div className="space-y-4">
              <CheckboxField label="Track quantity" checked={state.trackQuantity} onChange={(trackQuantity) => patch({ trackQuantity })} />
              <TextField label="Quantity / shop location" value={state.stock} onChange={(stock) => patch({ stock })} type="number" />
              <CheckboxField
                label="Continue selling when out of stock"
                checked={state.continueSelling}
                onChange={(continueSelling) => patch({ continueSelling })}
                helper="Customers can complete sales even when inventory reaches zero."
              />
              <CheckboxField label="This product has a SKU or barcode" checked={state.hasSkuBarcode} onChange={(hasSkuBarcode) => patch({ hasSkuBarcode })} />
              {state.hasSkuBarcode ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="SKU" value={state.sku} onChange={(sku) => patch({ sku })} />
                  <TextField label="Barcode" value={state.barcode} onChange={(barcode) => patch({ barcode })} />
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Shipping">
            <div className="space-y-4">
              <CheckboxField label="This is a physical product" checked={state.physicalProduct} onChange={(physicalProduct) => patch({ physicalProduct })} />
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <TextField label="Weight" value={state.weight} onChange={(weight) => patch({ weight })} type="number" />
                <label className="grid gap-1 text-sm font-medium text-neutral-700">
                  Unit
                  <select value={state.weightUnit} onChange={(event) => patch({ weightUnit: event.target.value as WeightUnit })} className="min-h-10 rounded-lg border border-black/20 bg-white px-3 text-sm outline-none">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </label>
              </div>
              <button type="button" onClick={() => patch({ showCustoms: !state.showCustoms })} className="text-sm font-bold text-blue-700">
                {state.showCustoms ? "Hide customs information" : "+ Add customs information"}
              </button>
              {state.showCustoms ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Country/region of origin" value={state.originCountry} onChange={(originCountry) => patch({ originCountry })} />
                  <TextField label="HS tariff code" value={state.hsCode} onChange={(hsCode) => patch({ hsCode })} />
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Variants">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Option name" value={state.optionName} onChange={(optionName) => patch({ optionName })} placeholder="Size or color" />
                <TextField label="Option values" value={state.optionValues} onChange={(optionValues) => patch({ optionValues })} placeholder="Small, Medium, Large" />
              </div>
              <button type="button" onClick={generateVariants} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/15 px-3 text-sm font-bold hover:bg-neutral-50">
                <Plus size={16} /> Generate variant rows
              </button>
              {state.variants.length ? (
                <div className="overflow-hidden rounded-lg border border-black/10">
                  <div className="grid grid-cols-[1fr_100px_90px_140px] bg-neutral-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                    <span>Variant</span>
                    <span>Price</span>
                    <span>Stock</span>
                    <span>SKU</span>
                  </div>
                  {state.variants.map((variant, index) => (
                    <div key={variant.id} className="grid grid-cols-[1fr_100px_90px_140px] items-center gap-2 border-t border-black/10 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <GripVertical size={15} className="text-neutral-400" /> {variant.name}
                      </div>
                      <input value={variant.price} onChange={(event) => updateVariant(index, { price: Number(event.target.value || 0) })} type="number" className="min-h-9 rounded-lg border border-black/15 px-2 text-sm" />
                      <input value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value || 0) })} type="number" className="min-h-9 rounded-lg border border-black/15 px-2 text-sm" />
                      <input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} className="min-h-9 rounded-lg border border-black/15 px-2 text-sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-500">Add options like size or color, then generate variant rows.</p>
              )}
            </div>
          </Card>

          <Card title="Search engine listing">
            <div className="space-y-4">
              <div className="rounded-lg border border-black/10 p-4">
                <p className="text-sm font-semibold text-blue-700">{seoTitle}</p>
                <p className="mt-1 break-all text-xs text-emerald-700">https://podscentra.in/products/{handle || "product-handle"}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-neutral-600">{seoDescription}</p>
              </div>
              <TextField label="SEO title" value={state.seoTitle} onChange={(seoTitle) => patch({ seoTitle })} />
              <label className="grid gap-1 text-sm font-medium text-neutral-700">
                Meta description
                <textarea value={state.metaDescription} onChange={(event) => patch({ metaDescription: event.target.value })} rows={3} className="rounded-lg border border-black/20 p-3 text-sm outline-none focus:border-neutral-950" />
              </label>
              <TextField label="URL handle" value={state.urlHandle} onChange={(urlHandle) => patch({ urlHandle: slugify(urlHandle) })} placeholder={slugify(state.title)} />
            </div>
          </Card>

          <Card title="Marketplace source">
            <div className="space-y-4">
              <TextField label="Source URL" value={state.sourceUrl} onChange={(sourceUrl) => patch({ sourceUrl })} placeholder="Amazon, Flipkart, Meesho, Myntra, or other URL" />
              <button type="button" onClick={importFromMarketplace} disabled={isImporting} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-black/15 px-3 text-sm font-bold hover:bg-neutral-50 disabled:opacity-60">
                <LinkIcon size={16} /> {isImporting ? "Reading link..." : "Add by marketplace link"}
              </button>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium text-neutral-700">
                  Marketplace name
                  <select value={state.marketplace} onChange={(event) => patch({ marketplace: event.target.value as Marketplace })} className="min-h-10 rounded-lg border border-black/20 bg-white px-3 text-sm outline-none">
                    {marketplaces.map((marketplace) => (
                      <option key={marketplace} value={marketplace}>{marketplace}</option>
                    ))}
                  </select>
                </label>
                <TextField label="Marketplace product ID" value={state.externalId} onChange={(externalId) => patch({ externalId })} />
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card title="Status">
            <select value={state.status} onChange={(event) => patch({ status: event.target.value as ProductStatus })} className="min-h-10 w-full rounded-lg border border-black/20 bg-white px-3 text-sm font-semibold outline-none">
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </Card>

          <Card title="Publishing">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Sales channels</p>
              <CheckboxField label="Online Store" checked={state.onlineStore} onChange={(onlineStore) => patch({ onlineStore })} />
              <CheckboxField label="Point of Sale" checked={state.pointOfSale} onChange={(pointOfSale) => patch({ pointOfSale })} />
              <p className="pt-2 text-sm font-semibold">Markets</p>
              <CheckboxField label="India" checked={state.marketIndia} onChange={(marketIndia) => patch({ marketIndia })} />
              <CheckboxField label="International" checked={state.marketInternational} onChange={(marketInternational) => patch({ marketInternational })} />
            </div>
          </Card>

          <Card title="Product organization">
            <div className="space-y-4">
              <TextField label="Category" value={state.category} onChange={(category) => patch({ category })} />
              <TextField label="Product type" value={state.productType} onChange={(productType) => patch({ productType })} />
              <TextField label="Vendor" value={state.vendor} onChange={(vendor) => patch({ vendor })} />
              <div className="grid gap-2 text-sm font-medium text-neutral-700">
                Collections
                {storeCollections.length ? (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-black/10 p-3">
                    {storeCollections.map((collection) => (
                      <label key={collection.id} className="flex items-center justify-between gap-3 text-sm font-semibold text-neutral-800">
                        <span>{collection.name}</span>
                        <input
                          type="checkbox"
                          checked={state.collectionIds.includes(collection.id)}
                          onChange={() => toggleCollection(collection.id)}
                          className="h-4 w-4 accent-neutral-950"
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-neutral-50 p-3 text-xs font-normal leading-5 text-neutral-500">Create collections from Admin - Collections, then assign this product.</p>
                )}
                <input
                  value={state.collections}
                  onChange={(event) => patch({ collections: event.target.value })}
                  placeholder="Legacy collection labels"
                  className="min-h-10 rounded-lg border border-black/20 bg-white px-3 text-sm text-neutral-950 outline-none transition focus:border-neutral-950"
                />
              </div>
              <TextField label="Tags" value={state.tags} onChange={(tags) => patch({ tags })} />
            </div>
          </Card>

          <button onClick={saveProduct} disabled={isSaving} className="sticky bottom-4 min-h-11 w-full rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? "Saving product..." : "Save product"}
          </button>
        </aside>
      </div>
    </div>
  );
}
