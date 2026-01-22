import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/server";
import { logPaymentEvent } from "@/lib/audit";

/**
 * @feature payments:verify
 * @aiNote This endpoint verifies Razorpay payment signature using HMAC-SHA256.
 * CRITICAL: This prevents payment fraud by ensuring payment authenticity.
 */
export async function POST(req: Request) {
    try {
        const { orderId, paymentId, signature, items } = await req.json();

        // Step 1: Verify HMAC signature
        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        if (generatedSignature !== signature) {
            console.error("Signature mismatch:", { generatedSignature, signature });
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        // Step 2: Get authenticated user session
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const tenantId = (session.user.app_metadata as any)?.tenant_id || "talenthub";

        // Step 3: Calculate total from items (never trust client-side total)
        const total = items.reduce(
            (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
            0
        );

        // Step 4: Create or update order record in database
        const { data: existingOrder } = await (supabase
            .from("orders") as any)
            .select("*")
            .eq("razorpay_order_id", orderId)
            .single();

        let order;
        if (existingOrder) {
            // Update existing order to 'paid' status
            const { data: updatedOrder, error: updateError } = await (supabase
                .from("orders") as any)
                .update({
                    status: "paid",
                    razorpay_payment_id: paymentId,
                } as any)
                .eq("razorpay_order_id", orderId)
                .select()
                .single();

            if (updateError) {
                console.error("Failed to update order:", updateError);
                return NextResponse.json(
                    { error: "Failed to update order" },
                    { status: 500 }
                );
            }
            order = updatedOrder;
        } else {
            // Create new order if doesn't exist (fallback)
            const { data: newOrder, error: orderError } = await (supabase
                .from("orders") as any)
                .insert({
                    tenant_id: tenantId,
                    user_id: userId,
                    total,
                    status: "paid",
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                } as any)
                .select()
                .single();

            if (orderError) {
                console.error("Failed to create order:", orderError);
                return NextResponse.json(
                    { error: "Failed to save order" },
                    { status: 500 }
                );
            }
            order = newOrder;
        }

        // Step 5: Log payment event for audit trail
        await logPaymentEvent("success", order.id, {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            amount: total,
            items: items.map((i: { id: string; name: string; quantity: number }) => ({ id: i.id, name: i.name, qty: i.quantity })),
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
        });
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Payment Verification Error:", error);
        return NextResponse.json(
            { success: false, error: "Payment verification failed", details: error.message },
            { status: 500 }
        );
    }
}
