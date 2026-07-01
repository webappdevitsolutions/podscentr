const requiredServerEnv = [
  "DATABASE_URL",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "NEXTAUTH_SECRET",
  "JWT_SECRET",
  "CASHFREE_APP_ID",
  "CASHFREE_SECRET_KEY",
  "CASHFREE_ENV"
] as const;

export function getMissingProductionEnv() {
  return requiredServerEnv.filter((key) => !process.env[key]);
}

export function assertServerEnv(keys: Array<(typeof requiredServerEnv)[number]>) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
