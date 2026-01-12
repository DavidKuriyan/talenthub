const fs = require('fs');
const path = require('path');

// Manual .env.local parsing
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
    }
});

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDuplicateTenants() {
    console.log('=== Fixing Duplicate TalentHub Solutions ===\n');

    const originalTenant = '930e6f70-f5cb-41be-84d2-4e5e31f1864e'; // talenthub
    const duplicateTenant = '041093a9-d608-4b13-a3a5-6e0edf9ed6f3'; // talenthub-solutions

    // Find users in duplicate tenant
    console.log('Finding users in duplicate tenant...');
    const { data: usersInDuplicate, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', duplicateTenant);

    if (findError) {
        console.error('Error finding users:', findError);
        return;
    }

    console.log(`Found ${usersInDuplicate.length} users in duplicate tenant:`);
    usersInDuplicate.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    if (usersInDuplicate.length > 0) {
        console.log('\nReassigning users to original tenant...');

        for (const user of usersInDuplicate) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ tenant_id: originalTenant })
                .eq('id', user.id);

            if (updateError) {
                console.error(`Error updating ${user.email}:`, updateError);
            } else {
                console.log(`✅ Reassigned ${user.email}`);
            }

            // Also update auth metadata
            const { error: authError } = await supabase.auth.admin.updateUserById(
                user.id,
                {
                    user_metadata: {
                        tenant_id: originalTenant,
                        role: user.role
                    }
                }
            );

            if (authError) {
                console.error(`Error updating auth for ${user.email}:`, authError);
            }
        }
    }

    // Now delete the duplicate tenant
    console.log('\nDeleting duplicate tenant...');
    const { error: deleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', duplicateTenant);

    if (deleteError) {
        console.error('Delete error:', deleteError);
    } else {
        console.log('✅ Duplicate tenant deleted');
    }

    console.log('\n=== Fix Complete ===');
    console.log('All users should now be under original TalentHub Solutions tenant');
}

fixDuplicateTenants().catch(console.error);
