import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
    skills: z.array(z.string()),
    experience_years: z.number().min(0).max(50),
    resume_url: z.string().optional().or(z.literal("")),
});

/**
 * @feature ENGINEER_PROFILE
 * @aiNote Handles creating/updating engineer profiles.
 */
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || {});

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const result = profileSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { skills, experience_years, resume_url } = result.data;
        const tenantId = session.user.app_metadata.tenant_id || 'talenthub';

        // Upsert profile
        const { data, error } = await supabase
            .from("profiles")
            .upsert({
                user_id: session.user.id,
                tenant_id: tenantId,
                skills,
                experience_years,
                resume_url: resume_url || null
            } as any, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error("Profile Upsert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
