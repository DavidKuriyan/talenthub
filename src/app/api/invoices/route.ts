import { createClient } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * @feature INVOICES_API
 * @aiNote API routes for invoices CRUD operations.
 */

// GET - Fetch invoices
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
        const engineerId = req.nextUrl.searchParams.get("engineer_id");

        let query = supabase.from("invoices").select("*");

        if (engineerId) {
            query = query.eq("engineer_id", engineerId);
        } else if (tenantId) {
            query = query.eq("tenant_id", tenantId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Create a new invoice
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { match_id, engineer_id, amount, description } = body;

        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

        const { data, error } = await supabase
            .from("invoices")
            .insert({
                tenant_id: tenantId,
                match_id,
                engineer_id,
                amount,
                description,
                status: "pending"
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH - Update invoice status (after payment)
export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status, razorpay_order_id, razorpay_payment_id } = body;

        if (!id) {
            return NextResponse.json({ error: "Invoice id is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (razorpay_order_id) updateData.razorpay_order_id = razorpay_order_id;
        if (razorpay_payment_id) updateData.razorpay_payment_id = razorpay_payment_id;

        const { data, error } = await supabase
            .from("invoices")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
