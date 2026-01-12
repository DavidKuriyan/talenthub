import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * @feature RAZORPAY_PAYMENT
 * @aiNote Create Razorpay order for engineer payment
 */
export async function POST(req: Request) {
    try {
        const { amount, engineerId, invoiceId } = await req.json();

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
            return NextResponse.json({
                error: "Razorpay not configured. Add API keys to environment."
            }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_SECRET!,
        });

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `invoice_${invoiceId}`,
            notes: {
                engineer_id: engineerId,
                invoice_id: invoiceId
            }
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error("Razorpay order creation error:", error);
        return NextResponse.json({
            error: error.message || "Failed to create payment order"
        }, { status: 500 });
    }
}
