import { createAdminClient } from "@/lib/server";
import { NextResponse } from "next/server";

/**
 * @feature TENANT_FIX
 * @aiNote API to fix user tenant assignment
 */
export async function POST(req: Request) {
    try {
        const supabase = await createAdminClient();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // Get first active tenant
        const { data: defaultTenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id, name")
            .eq("is_active", true)
            .limit(1)
            .single();

        if (tenantError || !defaultTenant) {
            return NextResponse.json({ success: false, error: "No active tenant found" }, { status: 404 });
        }

        // Get user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            return NextResponse.json({ error: listError.message }, { status: 500 });
        }

        const user = users?.find(u => u.email === email);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: {
                    ...user.user_metadata,
                    tenant_id: (defaultTenant as any).id
                }
            }
        );

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `User ${email} assigned to tenant ${(defaultTenant as any).name}`,
            tenant_id: (defaultTenant as any).id
        });

    } catch (e: any) {
        console.error("Fix Tenant Error:", e);
        return NextResponse.json({
            success: false,
            error: "Failed to fix tenant",
            details: e.message
        }, { status: 500 });
    }
}
