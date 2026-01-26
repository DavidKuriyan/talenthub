import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const requirementSchema = z.object({
    title: z.string().min(3, "Title too short"),
    role: z.string().min(2, "Role required"),
    skills: z.array(z.string()).min(1, "Select at least one skill"),
    experience_min: z.number().min(0),
    experience_max: z.number().min(0),
    salary_min: z.number().min(0),
    salary_max: z.number().min(0),
});

/**
 * @feature MATCHING_ENGINE
 * @aiNote Handles creation of new job requirements.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validation
        const result = requirementSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { title, role, skills, experience_min, experience_max, salary_min, salary_max } = result.data;

        const tenantId = session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id;

        if (!tenantId) {
            return NextResponse.json({ error: "No tenant context found" }, { status: 400 });
        }

        // Security: Ensure the user is posting for THEIR tenant (if body contains tenant_id)
        // Note: The schema doesn't seem to include tenant_id in body, but if it did, we must block spoofing.
        // We rely on session tenantId for the insert.

        const { data, error } = await supabase
            .from("requirements")
            .insert({
                tenant_id: tenantId,
                client_id: session.user.id,
                posted_by: session.user.id,
                title,
                role,
                required_skills: skills,
                experience_min,
                experience_max,
                salary_min,
                salary_max,
                status: 'open'
            } as any)
            .select()
            .single();

        if (error) {
            console.error("Requirement Insert Error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Requirement POST Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}

