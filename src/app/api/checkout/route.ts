import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/server";
import fs from 'fs';
import path from 'path';

/**
 * @feature PAYMENTS
 * @aiNote Creates Razorpay order and persists to database with 'pending' status
 * @dpdp Stores order amount and user_id for payment tracking
 */

const LOG_FILE = path.resolve('checkout_debug.log');

function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (e) {
        // Ignore file write errors
    }
}

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(req: Request) {
    log("💳 Checkout API called");
    try {
        // 0. Initialize keys from env (handle next_public prefix if mixed up)
        const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        // 1. Check Environment Variables
        if (!key_id || !key_secret) {
            log("❌ Missing Razorpay Keys in Environment Variables");
            return NextResponse.json(
                { error: "Server Configuration Error: Razorpay keys missing" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { items, total } = body;
        log(`📦 Processing order for ${items.length} items, Total: ${total}`);

        // Get authenticated user
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            log("❌ Unauthorized attempt");
            return NextResponse.json(
                { error: "Unauthorized: Please log in" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Resolve tenant_id: check if metadata has it, else lookup by slug 'talenthub'
        let tenantId = session.user.app_metadata.tenant_id;

        // If no tenant_id or it's not a UUID (e.g. might be a slug from old logic), resolve it
        const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        if (!tenantId || !isUuid(tenantId)) {
            // Default to 'talenthub' slug or whatever came in
            const slug = tenantId || "talenthub";
            log(`🔍 Resolving tenant slug: ${slug}`);
            const { data: tenant } = await supabase
                .from("tenants")
                .select("id")
                .eq("slug", slug)
                .single();

            if (tenant) {
                tenantId = (tenant as any).id;
                log(`✅ Resolved Tenant ID: ${tenantId}`);
            } else {
                log(`❌ Tenant not found for slug: ${slug}`);
                return NextResponse.json(
                    { error: "Configuration error: Tenant not found" },
                    { status: 500 }
                );
            }
        }

        // Validate total matches items (prevent tampering)
        const calculatedTotal = items.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
        );

        if (calculatedTotal !== total) {
            log(`❌ Total Mismatch: Expected ${calculatedTotal}, Got ${total}`);
            return NextResponse.json(
                { error: "Security Error: Cart total mismatch" },
                { status: 400 }
            );
        }

        // Create Razorpay order
        log("🔄 Creating Razorpay Order...");
        try {
            const razorpayOrder = await razorpay.orders.create({
                amount: total, // in paise
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            });
            log(`✅ Razorpay Order Created: ${razorpayOrder.id}`);

            // Save order to database with 'pending' status
            log("💾 Saving to Database...");
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    tenant_id: tenantId,
                    user_id: userId,
                    total,
                    status: "pending",
                    razorpay_order_id: razorpayOrder.id,
                } as any)
                .select()
                .single();

            if (orderError) {
                log(`❌ Database Insert Error: ${orderError.message}`);
                return NextResponse.json(
                    { error: `Database Error: ${orderError.message}` },
                    { status: 500 }
                );
            }

            log(`✅ Order Saved Successfully: ${(order as any).id}`);
            return NextResponse.json({
                ...razorpayOrder,
                orderId: (order as any).id,
            });

        } catch (rpError: any) {
            log(`❌ Razorpay API Error: ${rpError.message || JSON.stringify(rpError)}`);
            return NextResponse.json(
                { error: `Payment Gateway Error: ${rpError.message || rpError.error?.description}` },
                { status: 500 }
            );
        }

    } catch (error: any) {
        log(`❌ Unexpected Checkout Error: ${error.message}`);
        return NextResponse.json({ error: `Unexpected Error: ${error.message}` }, { status: 500 });
    }
}
