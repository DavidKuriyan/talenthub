import { createAdminClient } from "@/lib/server";
import { NextResponse } from "next/server";

/**
 * @feature ADMIN_USER_INVITATION
 * @aiNote Securely creates a new user via Supabase Auth Admin API.
 */
export async function POST(req: Request) {
    try {
        const supabaseAdmin = await createAdminClient();

        const { email, password, role, tenant_id } = await req.json();

        if (!email || !role || !tenant_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create user in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || Math.random().toString(36).slice(-12), // Generate random password if not provided
            email_confirm: true,
            user_metadata: {
                role,
                tenant_id
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // Note: The public.users record will be created automatically by the trigger in 05_users_sync.sql

        return NextResponse.json({
            success: true,
            user: authData.user
        });

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Admin Invite-User Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to invite user",
            details: error.message
        }, { status: 500 });
    }
}
