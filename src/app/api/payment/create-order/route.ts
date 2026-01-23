import { NextResponse } from "next/server";

/**
 * @feature RAZORPAY_PAYMENT
 * @aiNote Create Razorpay order for engineer payment
 */
export async function POST(req: Request) {
    try {
        const { amount, engineerId, invoiceId } = await req.json();

        // Return Mock Order for Academic Submission
        return NextResponse.json({
            orderId: `order_mock_${Math.random().toString(36).substring(7)}`,
            amount: amount * 100,
            currency: "INR",
            keyId: "rzp_test_mock_key",
            message: "Academic Mock Implementation Active"
        });

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Payment Order Creation Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to create payment order",
            details: error.message
        }, { status: 500 });
    }
}
