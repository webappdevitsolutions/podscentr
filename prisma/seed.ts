import { PrismaPg } from "@prisma/adapter-pg";
import { Marketplace, PrismaClient, ProductStatus } from "../lib/generated/prisma/client";
import catalogProducts from "../data/catalog-products.json";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });
const placeholderImage = "/product-placeholder.svg";

type SeedProduct = (typeof catalogProducts)[number];
type SeedVariant = {
  name: string;
  price?: number;
  stock?: number;
  sku?: string;
};

function enumValue<T extends Record<string, string>>(values: T, value: string | undefined, fallback: T[keyof T]) {
  return Object.values(values).includes(value || "") ? (value as T[keyof T]) : fallback;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `product-${Date.now()}`
  );
}

function imageList(product: SeedProduct) {
  const list = [...(Array.isArray(product.gallery) ? product.gallery : []), product.image, product.imageUrl]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return [...new Set(list)];
}

function productData(product: SeedProduct) {
  const name = product.name || "Untitled Product";
  const slug = product.slug || slugify(name);
  const gallery = imageList(product);
  const image = gallery[0] || product.image || product.imageUrl || placeholderImage;
  const stock = Math.max(0, Number(product.stock || 0));
  const reorderLevel = Math.max(0, Number(product.reorderLevel || 5));
  const compareAtPrice = Number(product.compareAtPrice || product.oldPrice || 0) || null;

  return {
    id: product.id,
    slug,
    name,
    category: product.category || "Uncategorized",
    price: Number(product.price || 0),
    oldPrice: compareAtPrice,
    compareAtPrice,
    cost: Number(product.cost || 0),
    stock,
    reorderLevel,
    sku: product.sku || `${slug.slice(0, 12).toUpperCase()}-SEED`,
    barcode: product.barcode || "",
    status: enumValue(ProductStatus, product.status, ProductStatus.Draft),
    supplier: product.supplier || product.vendor || "",
    vendor: product.vendor || product.supplier || "",
    productType: product.productType || "",
    collections: product.collections || "",
    tags: product.tags || "",
    marketplace: enumValue(Marketplace, product.marketplace, Marketplace.Manual),
    sourceUrl: product.sourceUrl || "",
    externalId: product.externalId || "",
    imageUrl: product.imageUrl || image,
    notes: product.notes || "",
    rating: Number(product.rating || 5),
    reviews: Number(product.reviews || 0),
    badge: product.badge || null,
    colors: Array.isArray(product.colors) && product.colors.length ? product.colors : ["Default"],
    sizes: Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["Default"],
    image,
    description: product.description || product.notes || "Product details will be updated soon.",
    chargeTax: product.chargeTax ?? true,
    trackQuantity: product.trackQuantity ?? true,
    continueSelling: product.continueSelling ?? false,
    hasSkuBarcode: product.hasSkuBarcode ?? Boolean(product.sku || product.barcode),
    physicalProduct: product.physicalProduct ?? true,
    weight: Number(product.weight || 0),
    weightUnit: product.weightUnit || "kg",
    originCountry: product.originCountry || "",
    hsCode: product.hsCode || "",
    onlineStore: product.onlineStore ?? true,
    pointOfSale: product.pointOfSale ?? false,
    marketIndia: product.marketIndia ?? true,
    marketInternational: product.marketInternational ?? false,
    seoTitle: product.seoTitle || name,
    metaDescription: product.metaDescription || product.description || "",
    optionName: product.optionName || "",
    optionValues: product.optionValues || "",
    gallery,
    variants: (product.variants || []) as SeedVariant[]
  };
}

async function main() {
  for (const product of catalogProducts) {
    const data = productData(product);
    const nestedImages = data.gallery.length ? data.gallery : [data.image];
    const nestedVariants = data.variants.map((variant) => ({
      name: variant.name,
      price: Number(variant.price || data.price),
      stock: Math.max(0, Number(variant.stock || data.stock)),
      sku: variant.sku || ""
    }));

    const { gallery, variants, ...productFields } = data;
    void gallery;
    void variants;

    await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        ...productFields,
        images: {
          deleteMany: {},
          create: nestedImages.map((url, position) => ({ url, position }))
        },
        variants: {
          deleteMany: {},
          create: nestedVariants
        },
        inventory: {
          upsert: {
            create: {
              quantity: data.stock,
              reorderLevel: data.reorderLevel
            },
            update: {
              quantity: data.stock,
              reorderLevel: data.reorderLevel
            }
          }
        }
      },
      create: {
        ...productFields,
        images: {
          create: nestedImages.map((url, position) => ({ url, position }))
        },
        variants: {
          create: nestedVariants
        },
        inventory: {
          create: {
            quantity: data.stock,
            reorderLevel: data.reorderLevel
          }
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
