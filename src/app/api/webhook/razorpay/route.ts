import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/server";

/**
 * @feature PAYMENTS
 * @aiNote Razorpay webhook handler for payment status updates
 * SECURITY: Verifies webhook signature to prevent fraud
 * @dpdp Updates order status based on payment events
 */

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Webhook signature verification failed");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const payload = JSON.parse(body);
        const event = payload.event;

        // Handle different webhook events
        switch (event) {
            case "payment.captured":
                await handlePaymentCaptured(payload.payload.payment.entity);
                break;

            case "payment.failed":
                await handlePaymentFailed(payload.payload.payment.entity);
                break;

            case "order.paid":
                await handleOrderPaid(payload.payload.order.entity);
                break;

            default:
                console.log("Unhandled webhook event:", event);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(payment: any) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({
            status: "paid",
            updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", payment.order_id);

    if (error) {
        console.error("Failed to update order status:", error);
    } else {
        console.log("Order marked as paid:", payment.order_id);
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment: any) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({
            status: "failed",
            updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", payment.order_id);

    if (error) {
        console.error("Failed to update order status:", error);
    } else {
        console.log("Order marked as failed:", payment.order_id);
    }
}

/**
 * Handle order paid event
 */
async function handleOrderPaid(order: any) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({
            status: "paid",
            updated_at: new Date().toISOString(),
        })
        .eq("razorpay_order_id", order.id);

    if (error) {
        console.error("Failed to update order status:", error);
    } else {
        console.log("Order confirmed as paid:", order.id);
    }
}
