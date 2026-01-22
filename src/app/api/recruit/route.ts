import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

/**
 * @feature RECRUIT_ENGINEER
 * @aiNote Transition a match to 'placed' and update engineer availability
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { matchId, engineerId } = await req.json();

        if (!matchId || !engineerId) return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });

        // 1. Update match status
        const { error: matchError } = await (supabase.from("matches") as any)
            .update({ status: 'approved' }) // Or 'placed' if schema supports
            .eq("id", matchId);

        if (matchError) throw matchError;

        // 2. Update engineer availability
        const { error: profileError } = await (supabase.from("profiles") as any)
            .update({ availability: 'busy' })
            .eq("id", engineerId);

        if (profileError) throw profileError;

        // 3. Create a system notification for the engineer
        // (Optional: will implement if notifications table exists)

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Recruit POST Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}

