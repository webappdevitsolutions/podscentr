import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId, password } = (await request.json()) as { userId?: string; password?: string };
  const adminUsername = process.env.ADMIN_USERNAME || "podscentra_1";
  const adminPassword = process.env.ADMIN_PASSWORD || "Secure@123";

  if (userId === adminUsername && password === adminPassword) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid admin ID or password." }, { status: 401 });
}
