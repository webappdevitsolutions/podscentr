import { NextResponse } from "next/server";
import { CollectionStatus, OrderStatus } from "@/lib/generated/prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { collectionCreateInput, collectionInclude, serializeCollection, type CollectionPayload } from "@/lib/collections-db";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const navbarOnly = url.searchParams.get("navbar") === "1";
  const withAnalytics = url.searchParams.get("analytics") === "1";
  const activeOnly = navbarOnly || url.searchParams.get("active") === "1";

  const collections = await prisma.collection.findMany({
    where: {
      ...(activeOnly ? { status: CollectionStatus.Active } : {}),
      ...(navbarOnly ? { showInNavbar: true } : {})
    },
    include: collectionInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });

  const serialized = collections.map(serializeCollection);

  if (!withAnalytics) {
    return NextResponse.json(serialized);
  }

  const enriched = await Promise.all(
    serialized.map(async (collection) => {
      const [views, clicks, orderItems] = await Promise.all([
        prisma.analyticsEvent.count({ where: { type: "collection_view", collectionId: collection.id } }),
        prisma.analyticsEvent.count({ where: { type: "collection_click", collectionId: collection.id } }),
        prisma.orderItem.findMany({
          where: {
            product: { collectionLinks: { some: { id: collection.id } } },
            order: {
              OR: [
                { status: OrderStatus.Paid },
                { paymentStatus: "Paid" },
                { paymentStatus: "COD_PENDING" },
                {
                  status: OrderStatus.Confirmed,
                  paymentStatus: { notIn: ["Pending", "Failed", "Cancelled"] }
                }
              ]
            }
          },
          select: {
            name: true,
            quantity: true,
            price: true
          }
        })
      ]);
      const productsSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const revenue = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
      orderItems.forEach((item) => {
        const current = productMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.quantity * item.price;
        productMap.set(item.name, current);
      });

      return {
        ...collection,
        views,
        clicks,
        productsSold,
        revenue,
        conversionRate: views ? (productsSold / views) * 100 : 0,
        topProducts: [...productMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 3)
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as CollectionPayload;
    const collection = await prisma.collection.create({
      data: await collectionCreateInput(payload),
      include: collectionInclude
    });

    return NextResponse.json(serializeCollection(collection), { status: 201 });
  } catch (error) {
    console.error("Collection create failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save collection." }, { status: 400 });
  }
}
