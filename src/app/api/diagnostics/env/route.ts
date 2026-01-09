import { NextResponse } from "next/server";

export async function GET() {
    const envCheck = {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? `✅ Set (${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...)` : "❌ Missing",
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? `✅ Set (${process.env.RAZORPAY_KEY_SECRET.substring(0, 4)}...)` : "❌ Missing",
        NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? `✅ Set (${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.substring(0, 8)}...)` : "❌ Missing",
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
        SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
        NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(envCheck);
}
