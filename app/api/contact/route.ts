import { NextResponse } from "next/server";
import { sendContactEmails } from "@/lib/email";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    const name = body.name?.trim() || "";
    const email = body.email?.trim() || "";
    const phone = body.phone?.trim() || "";
    const message = body.message?.trim() || "";

    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!email || !emailPattern.test(email)) return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

    await sendContactEmails({ name, email, phone, message });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form email failed", error);
    return NextResponse.json({ error: "Could not send your message. Please call or email support." }, { status: 500 });
  }
}
