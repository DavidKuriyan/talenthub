import { createClient } from "@supabase/supabase-js";

async function fixUserTenant() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking user davidkuriyan20@gmail.com...");

    // Get the user from Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("Auth error:", authError);
        return;
    }

    const targetUser = users.find(u => u.email === 'davidkuriyan20@gmail.com');

    if (!targetUser) {
        console.log("User not found.");
        return;
    }

    console.log("User found:", targetUser.id);

    // Get the first available tenant
    const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);

    if (!tenants || tenants.length === 0) {
        console.log("No tenants found to assign.");
        return;
    }

    const tenantId = tenants[0].id;
    console.log("Assigning to tenant:", tenants[0].name, "(", tenantId, ")");

    // Update Auth Metadata
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        {
            user_metadata: { ...targetUser.user_metadata, tenant_id: tenantId },
            app_metadata: { ...targetUser.app_metadata, tenant_id: tenantId }
        }
    );

    if (updateAuthError) {
        console.error("Update auth error:", updateAuthError);
    } else {
        console.log("Auth metadata updated.");
    }

    // Update public.users table if it exists
    const { error: publicUpdateError } = await (supabase.from('profiles') as any).upsert({
        user_id: targetUser.id,
        tenant_id: tenantId,
    }, { onConflict: 'user_id' });

    if (publicUpdateError) {
        console.log("Profile upsert skipped or failed (might not exist yet):", publicUpdateError.message);
    } else {
        console.log("Profile updated with tenant_id.");
    }
}

fixUserTenant();
