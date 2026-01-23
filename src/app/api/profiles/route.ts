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
    graduation_year: z.number().optional().or(z.literal(0)),
    desired_salary: z.number().optional().or(z.literal(0))
});

/**
 * @feature ENGINEER_PROFILE
 * @aiNote Handles creating/updating engineer profiles.
 */
export async function GET() {
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
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || {});

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Profiles GET Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch profile", details: error.message },
            { status: 500 }
        );
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
            education, degree, university, graduation_year,
            desired_salary
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

            tenantId = (defaultTenant as unknown as { id: string })?.id;
        }

        if (!tenantId) {
            return NextResponse.json({ error: "No tenant available. Please contact admin." }, { status: 400 });
        }

        // Build profile data - only fields that exist in database
        // Build standard profile data (safe fields that definitely exist)
        const safeProfileData = {
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
            graduation_year: graduation_year ? Number(graduation_year) : null,
        };

        // Data that might be missing in schema cache
        const riskyProfileData = {
            desired_salary: desired_salary ? Number(desired_salary) : 0
        };

        // Use centralized Admin Client to check if profile exists (bypass RLS)
        const { createAdminClient } = await import("@/lib/server");
        const supabaseAdmin = await createAdminClient();

        // Check columns first to avoid "cache" errors if possible, 
        // but easier to just use the data and handle specific errors.

        const { data: existingProfile, error: checkError } = await (supabaseAdmin
            .from("profiles") as any)
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (checkError) {
            console.error("Initial profile check failed:", checkError);
            return NextResponse.json({ success: false, error: checkError.message }, { status: 500 });
        }

        let data: any, error: any;

        if (existingProfile) {
            console.log(`Updating existing profile for user ${session.user.id}...`);
            // Profile exists - Attempt a full update first
            const allData = { ...safeProfileData, ...riskyProfileData };
            const updateResult = await (supabaseAdmin
                .from("profiles") as any)
                .update(allData)
                .eq("user_id", session.user.id)
                .select()
                .single();

            if (!updateResult.error) {
                data = updateResult.data;
            } else {
                console.warn("Full update failed, falling back to field-by-field update:", updateResult.error.message);

                // Fallback: Field by field so we save what we can
                const fields = Object.entries(allData);
                let currentData = { id: (existingProfile as any).id };

                for (const [key, value] of fields) {
                    const fieldUpdate = await (supabaseAdmin
                        .from("profiles") as any)
                        .update({ [key]: value })
                        .eq("user_id", session.user.id)
                        .select()
                        .single();

                    if (!fieldUpdate.error) {
                        currentData = { ...currentData, ...fieldUpdate.data };
                    } else {
                        console.error(`Failed to update field ${key}:`, fieldUpdate.error.message);
                    }
                }
                data = currentData;
                error = null; // We consider partial success as success
            }
        } else {
            console.log(`Inserting new profile for user ${session.user.id}...`);
            // Profile doesn't exist - Attempt full insert
            const fullInsertData = {
                user_id: session.user.id,
                tenant_id: tenantId,
                ...safeProfileData,
                ...riskyProfileData
            };

            let insertResult = await (supabaseAdmin
                .from("profiles") as any)
                .insert(fullInsertData)
                .select()
                .single();

            if (insertResult.error) {
                console.warn("Full insert failed, falling back to minimum viable insert:", insertResult.error.message);

                // Minimum viable insert (user_id and tenant_id)
                const minInsert = await (supabaseAdmin
                    .from("profiles") as any)
                    .insert({
                        user_id: session.user.id,
                        tenant_id: tenantId
                    })
                    .select()
                    .single();

                if (minInsert.error) {
                    error = minInsert.error;
                    data = null;
                } else {
                    // Now try to update fields one by one
                    const allData = { ...safeProfileData, ...riskyProfileData };
                    let currentData = minInsert.data;

                    for (const [key, value] of Object.entries(allData)) {
                        const fieldUpdate = await (supabaseAdmin
                            .from("profiles") as any)
                            .update({ [key]: value })
                            .eq("user_id", session.user.id)
                            .select()
                            .single();

                        if (!fieldUpdate.error) {
                            currentData = { ...currentData, ...fieldUpdate.data };
                        }
                    }
                    data = currentData;
                    error = null;
                }
            } else {
                data = insertResult.data;
                error = null;
            }
        }

        if (error) {
            console.error("Profile Operation Error:", error);
            // If error is about missing column, it might be a schema cache issue
            if (error.message?.includes("column") && error.message?.includes("not found")) {
                return NextResponse.json({
                    success: false,
                    error: "System error: Profile schema desync. Please contact support to refresh database cache.",
                    details: error.message
                }, { status: 500 });
            }
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Profile POST Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save profile", details: error.message },
            { status: 500 }
        );
    }
}

