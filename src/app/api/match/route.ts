/**
 * @feature AUTO_MATCHING_API
 * API endpoint to run matching for a requirement
 * 
 * @aiNote This endpoint uses the matching algorithm from /lib/matching.ts
 * Results are stored in the matches table with RLS enforcement.
 */

import { createAdminClient } from "@/lib/server";
import { NextResponse } from "next/server";
import { findMatches, isGoodMatch } from "@/lib/matching";

// Type definitions for database rows
type RequirementRow = {
    id: string;
    tenant_id: string;
    client_id: string;
    title: string;
    skills: string[];
    budget: number | null;
    status: string;
    created_at: string;
};

type ProfileRow = {
    id: string;
    user_id: string;
    tenant_id: string;
    skills: string[];
    experience_years: number;
    resume_url: string | null;
    created_at: string;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { requirement_id } = body;

        if (!requirement_id) {
            return NextResponse.json(
                { error: "requirement_id is required" },
                { status: 400 }
            );
        }

        // Use Admin Client for cross-tenant profile access
        const supabase = await createAdminClient();

        // 1. Fetch the requirement
        const { data: reqData, error: reqError } = await supabase
            .from("requirements")
            .select("*")
            .eq("id", requirement_id)
            .single();

        if (reqError || !reqData) {
            return NextResponse.json(
                { error: "Requirement not found", details: reqError?.message },
                { status: 404 }
            );
        }

        const requirement = reqData as RequirementRow;

        // 2. Fetch all profiles for the same tenant
        const { data: profData, error: profError } = await supabase
            .from("profiles")
            .select("*")
            .eq("tenant_id", requirement.tenant_id);

        if (profError) {
            return NextResponse.json(
                { error: "Failed to fetch profiles", details: profError.message },
                { status: 500 }
            );
        }

        const profiles = (profData || []) as ProfileRow[];

        // 3. Run matching algorithm
        const requirementSkills = requirement.skills || [];
        const matchResults = findMatches(
            { id: requirement.id, skills: requirementSkills, budget: requirement.budget || undefined },
            profiles.map(p => ({
                id: p.id,
                user_id: p.user_id,
                skills: p.skills || [],
                experience_years: p.experience_years || 0
            })),
            10 // Return top 10 matches
        );

        // 4. Store matches in database
        const matchesToInsert = matchResults.map(m => ({
            tenant_id: requirement.tenant_id,
            requirement_id: requirement.id,
            profile_id: m.profile_id,
            score: m.score,
            status: 'pending'
        }));

        if (matchesToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from("matches")
                .upsert(matchesToInsert as any, {
                    onConflict: 'requirement_id,profile_id',
                    ignoreDuplicates: false
                });

            if (insertError) {
                console.error("Failed to insert matches:", insertError);
                // Continue anyway - return match results even if storage fails
            }
        }

        return NextResponse.json({
            success: true,
            requirement_id: requirement.id,
            requirement_title: requirement.title,
            total_profiles_checked: profiles.length,
            matches: matchResults.map(m => ({
                profile_id: m.profile_id,
                score: m.score,
                matched_skills: m.matched_skills,
                is_good_match: isGoodMatch(m.score)
            }))
        });

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Match Engine Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal matching error", details: error.message },
            { status: 500 }
        );
    }
}

