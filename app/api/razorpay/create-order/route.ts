import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// This route runs on the server only. The key secret is never sent to the browser.
export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const amountInRupees = Number(body?.amount);

    if (!amountInRupees || amountInRupees <= 0) {
      return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Razorpay expects the amount in the smallest currency unit (paise for INR).
    const order = await razorpay.orders.create({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt: `podscentra_${Date.now()}`,
      notes: body?.notes ?? {}
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
