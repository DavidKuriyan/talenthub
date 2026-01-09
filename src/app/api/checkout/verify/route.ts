import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/server";
import { logAction } from "@/lib/audit";

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
        const tenantId = session.user.app_metadata.tenant_id || "talenthub";

        // Step 3: Calculate total from items (never trust client-side total)
        const total = items.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
        );

        // Step 4: Create order record in database
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                tenant_id: tenantId,
                user_id: userId,
                total,
                status: "paid",
                razorpay_order_id: orderId,
            })
            .select()
            .single();

        if (orderError) {
            console.error("Failed to create order:", orderError);
            return NextResponse.json(
                { error: "Failed to save order" },
                { status: 500 }
            );
        }

        // Step 5: Log payment event for audit trail
        await logAction("payment_success", {
            order_id: order.id,
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            amount: total,
            items: items.map((i: any) => ({ id: i.id, name: i.name, qty: i.quantity })),
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
        });
    } catch (error: any) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { error: error.message || "Verification failed" },
            { status: 500 }
        );
    }
}
