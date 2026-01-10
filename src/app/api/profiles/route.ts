import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
    skills: z.array(z.string()),
    experience_years: z.number().min(0).max(50),
    resume_url: z.string().optional().or(z.literal("")),
    availability: z.enum(["available", "busy", "unavailable"]).optional(),
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

        const { skills, experience_years, resume_url, availability } = result.data;

        // Get tenant_id - prefer from user metadata, fall back to first available tenant
        let tenantId = session.user.app_metadata?.tenant_id || session.user.user_metadata?.tenant_id;

        if (!tenantId) {
            // Fetch first available tenant as default
            const { data: defaultTenant } = await supabase
                .from("tenants")
                .select("id")
                .eq("is_active", true)
                .limit(1)
                .single();

            tenantId = defaultTenant?.id;
        }

        if (!tenantId) {
            return NextResponse.json({ error: "No tenant available. Please contact admin." }, { status: 400 });
        }

        // Build profile data - try with availability first, fallback without
        const baseProfileData = {
            user_id: session.user.id,
            tenant_id: tenantId,
            skills,
            experience_years,
            resume_url: resume_url || null
        };

        // Try upsert with availability column first
        let { data, error } = await supabase
            .from("profiles")
            .upsert({
                ...baseProfileData,
                availability: availability || "available"
            } as any, { onConflict: 'user_id' })
            .select()
            .single();

        // If availability column doesn't exist, retry without it
        if (error && error.message.includes('availability')) {
            console.log("Availability column not found, retrying without it");
            const result = await supabase
                .from("profiles")
                .upsert(baseProfileData as any, { onConflict: 'user_id' })
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) {
            console.error("Profile Upsert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

