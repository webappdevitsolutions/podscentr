import { execFileSync } from "node:child_process";
import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL || "";
const isLocalDatabase = /localhost|127\.0\.0\.1|USER:PASSWORD|HOST:PORT/i.test(databaseUrl);
const shouldSync = Boolean(process.env.VERCEL && databaseUrl && !isLocalDatabase);
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

if (!shouldSync) {
  console.log("Skipping production database sync outside Vercel.");
  process.exit(0);
}

if (databaseUrl.includes("railway.internal")) {
  console.warn("DATABASE_URL uses Railway's private internal host. Skipping DB sync; set Railway's public TCP proxy/Postgres URL in Vercel for database-backed APIs.");
  process.exit(0);
}

function runPrisma(args) {
  execFileSync(npxCommand, ["prisma", ...args], { stdio: "inherit" });
}

try {
  runPrisma(["migrate", "deploy"]);
} catch {
  console.warn("Prisma migrate deploy failed; falling back to prisma db push.");
  runPrisma(["db", "push"]);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined
});

try {
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM "Product"');
  const productCount = Number(result.rows[0]?.count || 0);

  if (productCount === 0) {
    runPrisma(["db", "seed"]);
  } else {
    console.log(`Skipping seed; database already has ${productCount} product(s).`);
  }
} finally {
  await pool.end();
}
