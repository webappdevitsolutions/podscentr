import { Prisma } from "@/lib/generated/prisma/client";
import { type Product, type ProductVariant } from "@/data/products";

const placeholderImage = "/product-placeholder.svg";

const productInclude = {
  images: { orderBy: { position: "asc" as const } },
  variants: true,
  inventory: true,
  collectionLinks: {
    orderBy: [{ sortOrder: "asc" as const }, { name: "asc" as const }],
    select: { id: true, name: true, slug: true }
  }
};

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export type CatalogPayload = Partial<Product> & {
  status?: "Active" | "Draft" | "Archived";
  marketplace?: "Amazon" | "Flipkart" | "Meesho" | "Myntra" | "Other" | "Manual";
  gallery?: string[];
  variants?: ProductVariant[];
  collectionIds?: string[];
};

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `product-${Date.now()}`
  );
}

function cleanStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const next = value.map((item) => String(item).trim()).filter(Boolean);
  return next.length ? next : fallback;
}

function cleanImageList(payload: CatalogPayload) {
  const list = [
    ...(Array.isArray(payload.gallery) ? payload.gallery : []),
    payload.image,
    payload.imageUrl
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return Array.from(new Set(list));
}

function cleanCollectionIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item || "").trim()).filter(Boolean)));
}

export function serializeProduct(product: ProductWithRelations): Product {
  const relationImages = product.images.map((image) => image.url).filter(Boolean);
  const gallery = relationImages.length ? relationImages : [product.image || product.imageUrl || placeholderImage];
  const image = gallery[0] || product.image || product.imageUrl || placeholderImage;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice ?? undefined,
    compareAtPrice: product.compareAtPrice ?? product.oldPrice ?? undefined,
    cost: product.cost,
    stock: product.inventory?.quantity ?? product.stock,
    reorderLevel: product.inventory?.reorderLevel ?? product.reorderLevel,
    sku: product.sku,
    barcode: product.barcode,
    status: product.status,
    supplier: product.supplier,
    vendor: product.vendor,
    productType: product.productType,
    collections: product.collectionLinks.length ? product.collectionLinks.map((collection) => collection.name).join(", ") : product.collections,
    collectionIds: product.collectionLinks.map((collection) => collection.id),
    collectionList: product.collectionLinks,
    tags: product.tags,
    marketplace: product.marketplace,
    sourceUrl: product.sourceUrl,
    externalId: product.externalId,
    imageUrl: product.imageUrl || image,
    chargeTax: product.chargeTax,
    trackQuantity: product.trackQuantity,
    continueSelling: product.continueSelling,
    hasSkuBarcode: product.hasSkuBarcode,
    physicalProduct: product.physicalProduct,
    weight: product.weight,
    weightUnit: product.weightUnit as Product["weightUnit"],
    originCountry: product.originCountry,
    hsCode: product.hsCode,
    onlineStore: product.onlineStore,
    pointOfSale: product.pointOfSale,
    marketIndia: product.marketIndia,
    marketInternational: product.marketInternational,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    optionName: product.optionName,
    optionValues: product.optionValues,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      stock: variant.stock,
      sku: variant.sku
    })),
    notes: product.notes,
    rating: product.rating,
    reviews: product.reviews,
    badge: product.badge ?? undefined,
    colors: product.colors.length ? product.colors : ["Default"],
    sizes: product.sizes.length ? product.sizes : ["Default"],
    image,
    gallery,
    description: product.description,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

export function productCreateInput(payload: CatalogPayload): Prisma.ProductCreateInput {
  const name = payload.name?.trim() || "Untitled Product";
  const slug = payload.slug?.trim() || slugify(name);
  const gallery = cleanImageList(payload);
  const image = gallery[0] || payload.image || payload.imageUrl || placeholderImage;
  const stock = Math.max(0, Number(payload.stock ?? 0));
  const reorderLevel = Math.max(0, Number(payload.reorderLevel ?? 5));
  const compareAtPrice = Number(payload.compareAtPrice ?? payload.oldPrice ?? 0) || null;
  const collectionIds = cleanCollectionIds(payload.collectionIds);

  return {
    ...(payload.id ? { id: payload.id } : {}),
    slug,
    name,
    category: payload.category || "Uncategorized",
    price: Number(payload.price ?? 0),
    oldPrice: compareAtPrice,
    compareAtPrice,
    cost: Number(payload.cost ?? 0),
    stock,
    reorderLevel,
    sku: payload.sku || `${slug.slice(0, 12).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    barcode: payload.barcode || "",
    status: payload.status || "Draft",
    supplier: payload.supplier || payload.vendor || "",
    vendor: payload.vendor || payload.supplier || "",
    productType: payload.productType || "",
    collections: payload.collections || "",
    tags: payload.tags || "",
    marketplace: payload.marketplace || "Manual",
    sourceUrl: payload.sourceUrl || "",
    externalId: payload.externalId || "",
    imageUrl: payload.imageUrl || image,
    notes: payload.notes || "",
    rating: Number(payload.rating ?? 5),
    reviews: Number(payload.reviews ?? 0),
    badge: payload.badge || null,
    colors: cleanStringArray(payload.colors, ["Default"]),
    sizes: cleanStringArray(payload.sizes, ["Default"]),
    image,
    description: payload.description || payload.notes || "Product details will be updated soon.",
    chargeTax: payload.chargeTax ?? true,
    trackQuantity: payload.trackQuantity ?? true,
    continueSelling: payload.continueSelling ?? false,
    hasSkuBarcode: payload.hasSkuBarcode ?? Boolean(payload.sku || payload.barcode),
    physicalProduct: payload.physicalProduct ?? true,
    weight: Number(payload.weight ?? 0),
    weightUnit: payload.weightUnit || "kg",
    originCountry: payload.originCountry || "",
    hsCode: payload.hsCode || "",
    onlineStore: payload.onlineStore ?? true,
    pointOfSale: payload.pointOfSale ?? false,
    marketIndia: payload.marketIndia ?? true,
    marketInternational: payload.marketInternational ?? false,
    seoTitle: payload.seoTitle || name,
    metaDescription: payload.metaDescription || payload.description || "",
    optionName: payload.optionName || "",
    optionValues: payload.optionValues || "",
    images: {
      create: gallery.length ? gallery.map((url, position) => ({ url, position })) : [{ url: image, position: 0 }]
    },
    variants: {
      create: (payload.variants || []).map((variant) => ({
        name: variant.name,
        price: Number(variant.price ?? payload.price ?? 0),
        stock: Math.max(0, Number(variant.stock ?? stock)),
        sku: variant.sku || ""
      }))
    },
    inventory: {
      create: {
        quantity: stock,
        reorderLevel
      }
    },
    ...(collectionIds.length
      ? {
          collectionLinks: {
            connect: collectionIds.map((id) => ({ id }))
          }
        }
      : {})
  };
}

export function productUpdateInput(payload: CatalogPayload): Prisma.ProductUpdateInput {
  const createInput = productCreateInput(payload);
  const hasMediaUpdate = "gallery" in payload || "image" in payload || "imageUrl" in payload;
  const hasVariantUpdate = "variants" in payload;
  const hasInventoryUpdate = "stock" in payload || "reorderLevel" in payload;
  const hasCollectionUpdate = "collectionIds" in payload;

  const { id, images, variants, inventory, ...scalarInput } = createInput;
  void id;
  void images;
  void variants;
  void inventory;

  return {
    ...scalarInput,
    ...(hasMediaUpdate
      ? {
          images: {
            deleteMany: {},
            create: createInput.images?.create
          }
        }
      : {}),
    ...(hasVariantUpdate
      ? {
          variants: {
            deleteMany: {},
            create: createInput.variants?.create
          }
        }
      : {}),
    ...(hasInventoryUpdate
      ? {
          inventory: {
            upsert: {
              create: {
                quantity: Number(payload.stock ?? 0),
                reorderLevel: Number(payload.reorderLevel ?? 5)
              },
              update: {
                quantity: Number(payload.stock ?? 0),
                reorderLevel: Number(payload.reorderLevel ?? 5)
              }
            }
          }
        }
      : {}),
    ...(hasCollectionUpdate
      ? {
          collectionLinks: {
            set: cleanCollectionIds(payload.collectionIds).map((id) => ({ id }))
          }
        }
      : {})
  };
}

export { productInclude };
