import { createClient } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/types";

type InterviewInsert = Database['public']['Tables']['interviews']['Insert'];
type InterviewUpdate = Database['public']['Tables']['interviews']['Update'];
type MatchUpdate = Database['public']['Tables']['matches']['Update'];

/**
 * @feature INTERVIEWS_API
 * @aiNote API routes for interview CRUD operations.
 */

// GET - Fetch interviews (optionally by match_id)
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const matchId = req.nextUrl.searchParams.get("match_id");

        let query = supabase.from("interviews").select(`
            id,
            scheduled_at,
            jitsi_room_id,
            status,
            notes,
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

        const { data, error } = await query.order("scheduled_at", { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (err: unknown) {
        const error = err as Error;
        return NextResponse.json(
            { success: false, error: "Interview operation failed", details: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new interview
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { match_id, scheduled_at, notes } = body;

        if (!match_id || !scheduled_at) {
            return NextResponse.json({ error: "match_id and scheduled_at are required" }, { status: 400 });
        }

        const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
        const jitsiRoomId = `talenthub-interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const insertData: any = {
            tenant_id: tenantId,
            match_id,
            scheduled_at,
            notes: notes || null,
            jitsi_room_id: jitsiRoomId,
            status: "scheduled"
        };

        const { data, error } = await (supabase
            .from("interviews") as any)
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        // Update match status
        await (supabase
            .from("matches") as any)
            .update({ status: "interview_scheduled" } as MatchUpdate)
            .eq("id", match_id);

        return NextResponse.json(data);
    } catch (err: unknown) {
        const error = err as Error;
        return NextResponse.json(
            { success: false, error: "Interview operation failed", details: error.message },
            { status: 500 }
        );
    }
}

// PATCH - Update interview status
export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status, notes } = body;

        if (!id) {
            return NextResponse.json({ error: "Interview id is required" }, { status: 400 });
        }

        const updateData: InterviewUpdate = {};
        if (status) updateData.status = status as 'scheduled' | 'completed' | 'cancelled';
        if (notes !== undefined) updateData.notes = notes;

        const { data, error } = await (supabase
            .from("interviews") as any)
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: unknown) {
        const error = e as Error;
        return NextResponse.json(
            { success: false, error: "Interview operation failed", details: error.message },
            { status: 500 }
        );
    }
}
