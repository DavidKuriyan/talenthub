import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabase } from "@/lib/supabase";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const { items, total } = await req.json();

        // @aiNote In production, we would verify the tenant_id and user_id from the session.
        // Here we create the order using the Razorpay SDK.
        const order = await razorpay.orders.create({
            amount: total, // in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        // Log the order creation in the audit_logs (optional but recommended)
        // await supabase.from('audit_logs').insert({ ... })

        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
