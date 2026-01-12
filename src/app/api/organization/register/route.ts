import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

const registrationSchema = z.object({
    organizationName: z.string().min(3).max(100),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    adminEmail: z.string().email(),
    password: z.string().min(6),
    industry: z.string(),
    role: z.string()
});

/**
 * @feature ORGANIZATION_REGISTRATION register new organizations
 * @aiNote Creates tenant and admin user for new organization registration
 * Uses service role key for admin.createUser
 */
export async function POST(req: Request) {
    try {
        // Use service role key for admin operations
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
            return NextResponse.json({
                error: "Server configuration error. Please contact administrator."
            }, { status: 500 });
        }

        const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const body = await req.json();

        const result = registrationSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { organizationName, slug, adminEmail, password, industry } = result.data;

        // Check if user already exists in auth (do this BEFORE creating tenant)
        const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = existingAuthUsers.find(u => u.email === adminEmail);

        if (existingAuthUser) {
            return NextResponse.json({
                error: "A user with this email address has already been registered. If you forgot your password, please use the password reset option. If you need to create an organization account, please use a different email address or contact support."
            }, { status: 400 });
        }

        // Check if slug already exists
        const { data: existingTenant } = await supabaseAdmin
            .from("tenants")
            .select("id")
            .eq("slug", slug)
            .single();

        if (existingTenant) {
            return NextResponse.json({
                error: "Organization name already taken. Please choose a different name."
            }, { status: 400 });
        }

        // Create tenant
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from("tenants")
            .insert({
                name: organizationName,
                slug: slug,
                is_active: true
            })
            .select()
            .single();

        if (tenantError) {
            console.error("Tenant creation error:", tenantError);
            return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
        }

        // Create admin user with Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                tenant_id: tenant.id,
                role: "admin",
                industry: industry
            }
        });

        if (authError) {
            console.error("User creation error:", authError);

            // Rollback: delete the tenant
            await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);

            // Provide more helpful error message
            if (authError.message.includes('already been registered')) {
                return NextResponse.json({
                    error: "This email is already registered. Please sign in instead or use a different email."
                }, { status: 400 });
            }

            return NextResponse.json({
                error: authError.message || "Failed to create admin user"
            }, { status: 500 });
        }

        // Create user record in public.users table (Using upsert to handle potential trigger overlaps)
        const { error: userInsertError } = await supabaseAdmin
            .from("users")
            .upsert({
                id: authData.user.id,
                tenant_id: tenant.id,
                email: adminEmail,
                role: "admin"
            }, {
                onConflict: 'id'
            });

        if (userInsertError) {
            console.error("User record creation error:", userInsertError);

            // Rollback: delete auth user and tenant
            // Note: In high-traffic scenarios, manual rollbacks like this are risky.
            // Using a DB function for registration would be more atomic.
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);

            return NextResponse.json({
                error: "Failed to initialize your user account record. Please try again or contact support."
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug
            },
            user: {
                id: authData.user.id,
                email: authData.user.email
            }
        });

    } catch (e: any) {
        console.error("Registration error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
