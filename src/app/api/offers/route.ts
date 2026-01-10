import { createClient } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * @feature OFFERS_API
 * @aiNote API routes for offer letters CRUD operations.
 */

// GET - Fetch offer letters
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const matchId = req.nextUrl.searchParams.get("match_id");

        let query = supabase.from("offer_letters").select(`
            id,
            salary,
            start_date,
            document_url,
            status,
            created_at,
            matches (
                id,
                profiles (
                    skills,
                    experience_years
                ),
                requirements (
                    title
                )
            )
        `);

        if (matchId) {
            query = query.eq("match_id", matchId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST - Create a new offer letter
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { match_id, salary, start_date, document_url } = body;

        if (!match_id || !salary || !start_date) {
            return NextResponse.json({ error: "match_id, salary, and start_date are required" }, { status: 400 });
        }

        const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

        const { data, error } = await supabase
            .from("offer_letters")
            .insert({
                tenant_id: tenantId,
                match_id,
                salary,
                start_date,
                document_url,
                status: "pending"
            })
            .select()
            .single();

        if (error) throw error;

        // Update match status to hired
        await supabase
            .from("matches")
            .update({ status: "hired" })
            .eq("id", match_id);

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH - Update offer status (accept/reject)
export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Offer id and status are required" }, { status: 400 });
        }

        if (!["pending", "accepted", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("offer_letters")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
