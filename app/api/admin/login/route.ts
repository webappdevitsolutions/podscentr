import { NextResponse } from "next/server";
import { adminSessionCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId, password } = (await request.json()) as { userId?: string; password?: string };
  const adminUsername = process.env.ADMIN_USERNAME || "podscentra_1";
  const adminPassword = process.env.ADMIN_PASSWORD || "Secure@123";

  if (userId === adminUsername && password === adminPassword) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminSessionCookie, "active", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid admin ID or password." }, { status: 401 });
}
