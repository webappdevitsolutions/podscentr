import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verifies the signature Razorpay returns after a successful payment.
// This proves the payment actually happened and wasn't forged client-side.
export async function POST(request: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay key secret is not configured on the server." },
        { status: 500 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json({ verified: false, error: "Signature mismatch." }, { status: 400 });
    }

    // At this point the payment is confirmed genuine.
    // TODO: Save the order (items, address, payment id) to your database here,
    // and optionally send a confirmation email/SMS to the customer.

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
