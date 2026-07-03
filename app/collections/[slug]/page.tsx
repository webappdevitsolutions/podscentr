import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionStatus, ProductStatus } from "@/lib/generated/prisma/client";
import { CollectionProductBrowser } from "@/components/CollectionProductBrowser";
import { productInclude, serializeProduct } from "@/lib/catalog-db";
import { parseCollectionRule, productMatchesCollectionRule } from "@/lib/collection-rules";
import { prisma } from "@/lib/prisma";

const siteUrl = "https://podscentr.vercel.app";

async function getCollection(slug: string) {
  return prisma.collection.findFirst({
    where: { slug, status: CollectionStatus.Active },
    include: {
      products: {
        where: { status: ProductStatus.Active },
        include: productInclude,
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

async function getCollectionProducts(collection: Awaited<ReturnType<typeof getCollection>>) {
  if (!collection) return [];
  const explicitProducts = collection.products.map(serializeProduct);

  if (!collection.isAutomatic) return explicitProducts;

  const allActiveProducts = await prisma.product.findMany({
    where: { status: ProductStatus.Active },
    include: productInclude,
    orderBy: { createdAt: "desc" }
  });
  const rule = parseCollectionRule(collection.rules);
  const productMap = new Map(explicitProducts.map((product) => [product.id, product]));
  allActiveProducts.map(serializeProduct).forEach((product) => {
    if (productMatchesCollectionRule(product, rule)) {
      productMap.set(product.id, product);
    }
  });

  return [...productMap.values()];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};

  const title = `${collection.name} | Podscentra`;
  const description = collection.description || `Shop ${collection.name} at Podscentra.`;
  const url = `${siteUrl}/collections/${collection.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: collection.image ? [{ url: collection.image, alt: collection.name }] : []
    }
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const products = await getCollectionProducts(collection);
  const title = `${collection.name} | Podscentra`;
  const description = collection.description || `Shop ${collection.name} at Podscentra.`;
  const url = `${siteUrl}/collections/${collection.slug}`;
  const heroImage = collection.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop";
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Collections", item: `${siteUrl}/collections` },
        { "@type": "ListItem", position: 3, name: collection.name, item: url }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url,
      image: heroImage
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav className="mb-5 text-sm font-semibold text-neutral-500">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span className="px-2">/</span>
        <Link href="/collections" className="hover:text-accent">Collections</Link>
        <span className="px-2">/</span>
        <span>{collection.name}</span>
      </nav>
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-neutral-100">
        <img src={heroImage} alt={collection.name} className="h-72 w-full object-cover sm:h-96" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em]">Collection</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">{collection.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{description}</p>
        </div>
      </div>

      <CollectionProductBrowser collectionId={collection.id} products={products} />
    </section>
  );
}
