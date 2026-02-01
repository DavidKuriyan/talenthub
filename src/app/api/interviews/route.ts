import { createClient } from "@/lib/server";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/types";
import { generateInterviewRoomId } from "@/lib/jitsi";

type InterviewInsert = Database["public"]["Tables"]["interviews"]["Insert"];
type InterviewUpdate = Database["public"]["Tables"]["interviews"]["Update"];
type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];

/**
 * @feature INTERVIEWS_API
 * @aiNote API routes for interview CRUD operations with full validation and security checks.
 */

// GET - Fetch interviews (optionally by match_id)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId =
      session.user.user_metadata?.tenant_id ||
      session.user.app_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant information missing" },
        { status: 400 },
      );
    }

    const matchId = req.nextUrl.searchParams.get("match_id");

    let query = supabase
      .from("interviews")
      .select(
        `
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
        `,
      )
      .eq("tenant_id", tenantId);

    if (matchId) {
      query = query.eq("match_id", matchId);
    }

    const { data, error } = await query.order("scheduled_at", {
      ascending: true,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        success: false,
        error: "Interview operation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// POST - Create a new interview
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { match_id, scheduled_at, notes } = body;

    // Validate required fields
    if (!match_id || !scheduled_at) {
      return NextResponse.json(
        { error: "match_id and scheduled_at are required" },
        { status: 400 },
      );
    }

    // Validate scheduled_at format
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduled_at format" },
        { status: 400 },
      );
    }

    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot schedule interviews in the past" },
        { status: 400 },
      );
    }

    // Get and validate tenant
    const tenantId =
      session.user.user_metadata?.tenant_id ||
      session.user.app_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant information missing" },
        { status: 400 },
      );
    }

    // Verify user has access to this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, requirement_id")
      .eq("id", match_id)
      .eq("tenant_id", tenantId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: "Match not found or access denied" },
        { status: 403 },
      );
    }

    // Check if interview already exists
    const { data: existing } = await supabase
      .from("interviews")
      .select("id")
      .eq("match_id", match_id)
      .eq("status", "scheduled");

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Interview already scheduled for this match" },
        { status: 409 },
      );
    }

    // Generate deterministic room ID
    let jitsiRoomId: string;
    try {
      jitsiRoomId = generateInterviewRoomId(
        match_id,
        tenantId,
        process.env.JITSI_SECRET_KEY,
      );
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to generate meeting room" },
        { status: 500 },
      );
    }

    const insertData: InterviewInsert = {
      tenant_id: tenantId,
      match_id,
      scheduled_at,
      notes: notes || null,
      jitsi_room_id: jitsiRoomId,
      status: "scheduled",
    };

    const { data, error } = await (supabase.from("interviews") as any)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Update match status
    await (supabase.from("matches") as any)
      .update({ status: "interview_scheduled" } as MatchUpdate)
      .eq("id", match_id);

    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Interview creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Interview operation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// PATCH - Update interview status
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: "User tenant not found" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Interview id is required" },
        { status: 400 },
      );
    }

    // Verify interview belongs to user's tenant before updating
    const { data: interview } = await supabase
      .from("interviews")
      .select("id, tenant_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found or access denied" },
        { status: 404 },
      );
    }

    const updateData: InterviewUpdate = {};
    if (status)
      updateData.status = status as "scheduled" | "completed" | "cancelled";
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await (supabase.from("interviews") as any)
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      {
        success: false,
        error: "Interview operation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
