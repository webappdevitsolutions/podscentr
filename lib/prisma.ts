import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getDatabaseUrlDiagnostics() {
  const databaseUrl = process.env.DATABASE_URL;
  const hasPublicUrl = Boolean(process.env.DATABASE_PUBLIC_URL);

  if (!databaseUrl) {
    return {
      configured: false,
      host: "missing",
      hostType: "missing",
      message: hasPublicUrl
        ? "DATABASE_URL is missing. DATABASE_PUBLIC_URL is present, but Prisma is configured to use DATABASE_URL."
        : "DATABASE_URL is missing."
    };
  }

  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname;
    const isInternal = host.includes("railway.internal");
    const isRailwayPublicProxy = host.includes("proxy.rlwy.net") || host.includes("rlwy.net");

    return {
      configured: true,
      host,
      hostType: isInternal ? "internal" : isRailwayPublicProxy ? "railway-public-proxy" : "public-or-custom",
      message: isInternal
        ? "DATABASE_URL uses Railway's private internal host. Vercel needs Railway's public TCP proxy/Postgres URL."
        : `DATABASE_URL host is ${isRailwayPublicProxy ? "Railway public proxy" : "public/custom"}: ${host}.`
    };
  } catch {
    return {
      configured: true,
      host: "invalid",
      hostType: "invalid",
      message: "DATABASE_URL is present but is not a valid URL."
    };
  }
}

const databaseDiagnostics = getDatabaseUrlDiagnostics();
console.info(`[database] ${databaseDiagnostics.message}`);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
