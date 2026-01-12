import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * @feature RAZORPAY_VERIFICATION
 * @aiNote Verify Razorpay payment signature
 */
export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId } = await req.json();

        if (!process.env.RAZORPAY_SECRET) {
            return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update invoice status in database
            const supabase = await createClient();
            const { error } = await (supabase
                .from("invoices") as any)
                .update({
                    status: "paid",
                    payment_id: razorpay_payment_id,
                    paid_at: new Date().toISOString()
                })
                .eq("id", invoiceId);

            if (error) {
                console.error("Error updating invoice:", error);
            }

            return NextResponse.json({ success: true, verified: true });
        } else {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
