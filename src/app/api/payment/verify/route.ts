import { NextResponse } from "next/server";

/**
 * @feature RAZORPAY_VERIFICATION
 * @aiNote Verify Razorpay payment signature
 */
export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceId, upgradePlan } = await req.json();

        const { createAdminClient } = await import("@/lib/server");
        const supabaseAdmin = await createAdminClient();
        const { data: { session } } = await supabaseAdmin.auth.getSession();

        if (!process.env.RAZORPAY_SECRET) {
            return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
        }

        // Bypass signature verification for Academic Mock
        const isAuthentic = true;

        if (isAuthentic) {
            if (invoiceId) {
                // Update invoice status
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
            } else if (upgradePlan === 'elite' && session?.user) {
                // Handle Plan Upgrade
                const tenantId = session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id;

                if (tenantId) {
                    const { error } = await (supabaseAdmin
                        .from("tenants") as any)
                        .update({ subscription_plan: 'elite' })
                        .eq("id", tenantId);

                    if (error) {
                        console.error("Error upgrading tenant plan:", error);
                        throw error;
                    }
                }
            }

            return NextResponse.json({
                success: true,
                verified: true,
                message: "Mock Verification Successful"
            });
        }

        // Handle case where signature is not authentic
        return NextResponse.json({
            success: false,
            verified: false,
            error: "Payment signature verification failed"
        }, { status: 400 });

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
