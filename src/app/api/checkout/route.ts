import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/server";

/**
 * @feature PAYMENTS
 * @aiNote Creates Razorpay order and persists to database with 'pending' status
 * @dpdp Stores order amount and user_id for payment tracking
 */

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const { items, total } = await req.json();

        // Get authenticated user
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

        // Validate total matches items (prevent tampering)
        const calculatedTotal = items.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        );

        if (calculatedTotal !== total) {
            return NextResponse.json(
                { error: "Total mismatch" },
                { status: 400 }
            );
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: total, // in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        // Save order to database with 'pending' status
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                tenant_id: tenantId,
                user_id: userId,
                total,
                status: "pending",
                razorpay_order_id: razorpayOrder.id,
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

        return NextResponse.json({
            ...razorpayOrder,
            orderId: order.id,
        });
    } catch (error: any) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
