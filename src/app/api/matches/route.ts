import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

/**
 * @feature MATCHING_ENGINE
 * @aiNote Triggers matching algorithm. Finds overlapping skills between Open Requirements and Profiles within the same Tenant.
 * @businessRule Matches are scored 0-100 based on skill overlap percentage.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authorization (Admin only ideally, or anyone for demo)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return NextResponse.json({
            success: false,
            error: "Unauthorized"
        }, { status: 401 });

        // 2. Fetch all Open Requirements (for current tenant if RLS enabled, or all if admin)
        // Note: RLS will filter this by tenant automatically if set up correctly.
        const { data: reqsData, error: reqError } = await supabase
            .from("requirements")
            .select("*")
            .eq("status", "open");

        if (reqError) throw new Error("Failed to fetch requirements: " + reqError.message);
        if (!reqsData || reqsData.length === 0) {
            return NextResponse.json({ message: "No open requirements found" });
        }

        // 3. Fetch all Profiles
        const { data: profsData, error: profError } = await supabase
            .from("profiles")
            .select("*");

        if (profError) throw new Error("Failed to fetch profiles: " + profError.message);

        const requirements = (reqsData || []) as any[];
        const profiles = (profsData || []) as any[];

        // 4. Run Matching Algorithm
        const matchesToInsert: any[] = [];

        // Fetch existing matches to prevent duplicates (since unique constraint might be missing)
        // Optimization: Fetch only IDs for this tenant
        const { data: existingMatches } = await supabase
            .from("matches")
            .select("requirement_id, profile_id")
            .eq("tenant_id", session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id);

        const existingSet = new Set((existingMatches || []).map((m: any) => `${m.requirement_id}_${m.profile_id}`));

        for (const req of requirements) {
            // Ensure schema compatibility (skills is JSONB, assumed string array)
            const reqSkills = (Array.isArray(req.skills) ? req.skills : []) as string[];

            for (const prof of profiles) {
                // Tenant Constraint: Must match tenant
                if (req.tenant_id !== prof.tenant_id) continue;

                // Check for duplicate
                if (existingSet.has(`${req.id}_${prof.id}`)) continue;

                const profSkills = (Array.isArray(prof.skills) ? prof.skills : []) as string[];

                // Calculate Overlap
                const intersection = reqSkills.filter(s => profSkills.includes(s));

                if (intersection.length > 0) {
                    const score = Math.round((intersection.length / reqSkills.length) * 100);

                    // Add to insertion list
                    matchesToInsert.push({
                        tenant_id: req.tenant_id,
                        requirement_id: req.id,
                        profile_id: prof.id,
                        score: score,
                        status: 'pending'
                    });

                    // Add to set to prevent double insertion in same run if data faulty
                    existingSet.add(`${req.id}_${prof.id}`);
                }
            }
        }

        // 5. Bulk Insert Matches (Safe)
        if (matchesToInsert.length > 0) {
            // Chunking not needed for small scale, but good practice
            const { error: matchError } = await supabase
                .from("matches")
                .insert(matchesToInsert as any); // Regular insert now safe due to pre-check

            if (matchError) throw new Error("Match batch insert failed: " + matchError.message);
        }

        return NextResponse.json({
            success: true,
            matches_found: matchesToInsert.length,
            details: matchesToInsert.map(m => ({ req: m.requirement_id, score: m.score }))
        });

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Matching Algorithm Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to run matching algorithm",
            details: error.message
        }, { status: 500 });
    }
}
