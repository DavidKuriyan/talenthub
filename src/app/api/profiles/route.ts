import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
    full_name: z.string().optional().or(z.literal("")),
    skills: z.array(z.string()),
    experience_years: z.number().min(0).max(50),
    resume_url: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    country: z.string().optional().or(z.literal("")),
    education: z.string().optional().or(z.literal("")),
    degree: z.string().optional().or(z.literal("")),
    university: z.string().optional().or(z.literal("")),
    graduation_year: z.number().optional().or(z.literal(0))
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

        const {
            full_name, skills, experience_years, resume_url,
            address, city, country,
            education, degree, university, graduation_year
        } = result.data;

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

            tenantId = (defaultTenant as any)?.id;
        }

        if (!tenantId) {
            return NextResponse.json({ error: "No tenant available. Please contact admin." }, { status: 400 });
        }

        // Build profile data - only fields that exist in database
        const profileData = {
            full_name: full_name || session.user.user_metadata?.full_name || null,
            skills: skills || [],
            experience_years: Number(experience_years),
            resume_url: resume_url || null,
            address: address || null,
            city: city || null,
            country: country || null,
            education: education || null,
            degree: degree || null,
            university: university || null,
            graduation_year: graduation_year ? Number(graduation_year) : null
        };

        // Use service role to check if profile exists (bypass RLS)
        const { createClient: createServiceClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check columns first to avoid "cache" errors if possible, 
        // but easier to just use the data and handle specific errors.

        const { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

        let data, error;

        if (existingProfile) {
            // Profile exists - UPDATE using service role
            const updateResult = await supabaseAdmin
                .from("profiles")
                .update(profileData)
                .eq("user_id", session.user.id)
                .select()
                .single();

            data = updateResult.data;
            error = updateResult.error;
        } else {
            // Profile doesn't exist - INSERT with tenant_id using service role
            const insertResult = await supabaseAdmin
                .from("profiles")
                .insert({
                    user_id: session.user.id,
                    tenant_id: tenantId,
                    ...profileData
                })
                .select()
                .single();

            data = insertResult.data;
            error = insertResult.error;
        }

        if (error) {
            console.error("Profile Operation Error:", error);
            // If error is about missing column, it might be a schema cache issue
            if (error.message?.includes("column") && error.message?.includes("not found")) {
                return NextResponse.json({
                    error: "System error: Profile schema desync. Please contact support to refresh database cache.",
                    details: error.message
                }, { status: 500 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (e: any) {
        console.error("Profile API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

