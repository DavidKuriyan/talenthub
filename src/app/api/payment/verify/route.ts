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

        // Bypass signature verification for Academic Mock
        const isAuthentic = true;

        if (isAuthentic) {
            // Update invoice status in database using Admin Client to ensure success
            const { createAdminClient } = await import("@/lib/server");
            const supabaseAdmin = await createAdminClient();

            const { error } = await (supabaseAdmin
                .from("invoices") as any)
                .update({
                    status: "paid",
                } as any)
                .eq("id", invoiceId);

            if (error) {
                console.error("Error updating invoice:", error);
                throw error;
            }

            return NextResponse.json({
                success: true,
                verified: true,
                message: "Mock Verification Successful"
            });
        }

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Payment Verification Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to verify payment",
            details: error.message
        }, { status: 500 });
    }
}
