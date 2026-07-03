import { CollectionStatus, Prisma } from "@/lib/generated/prisma/client";
import { slugify } from "@/lib/catalog-db";
import { prisma } from "@/lib/prisma";

export type CollectionPayload = {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  status?: "Active" | "Draft";
  showInNavbar?: boolean;
  sortOrder?: number;
};

export const collectionInclude = {
  _count: { select: { products: true } }
} satisfies Prisma.CollectionInclude;

export type CollectionWithCount = Prisma.CollectionGetPayload<{ include: typeof collectionInclude }>;

export function serializeCollection(collection: CollectionWithCount) {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    image: collection.image,
    status: collection.status,
    showInNavbar: collection.showInNavbar,
    sortOrder: collection.sortOrder,
    productCount: collection._count.products,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString()
  };
}

export async function uniqueCollectionSlug(value: string, ignoreId?: string) {
  const base = slugify(value || "collection");
  let next = base;
  let index = 2;

  while (await prisma.collection.findFirst({ where: { slug: next, ...(ignoreId ? { id: { not: ignoreId } } : {}) } })) {
    next = `${base}-${index}`;
    index += 1;
  }

  return next;
}

export async function collectionCreateInput(payload: CollectionPayload): Promise<Prisma.CollectionCreateInput> {
  const name = payload.name?.trim() || "Untitled Collection";
  return {
    name,
    slug: await uniqueCollectionSlug(payload.slug || name),
    description: payload.description || "",
    image: payload.image || "",
    status: payload.status === "Active" ? CollectionStatus.Active : CollectionStatus.Draft,
    showInNavbar: Boolean(payload.showInNavbar),
    sortOrder: Number(payload.sortOrder || 0)
  };
}

export async function collectionUpdateInput(payload: CollectionPayload, id: string): Promise<Prisma.CollectionUpdateInput> {
  const data: Prisma.CollectionUpdateInput = {};

  if ("name" in payload) data.name = payload.name?.trim() || "Untitled Collection";
  if ("slug" in payload || "name" in payload) data.slug = await uniqueCollectionSlug(payload.slug || payload.name || "collection", id);
  if ("description" in payload) data.description = payload.description || "";
  if ("image" in payload) data.image = payload.image || "";
  if ("status" in payload) data.status = payload.status === "Active" ? CollectionStatus.Active : CollectionStatus.Draft;
  if ("showInNavbar" in payload) data.showInNavbar = Boolean(payload.showInNavbar);
  if ("sortOrder" in payload) data.sortOrder = Number(payload.sortOrder || 0);

  return data;
}
