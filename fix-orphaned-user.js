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

async function fixOrphanedUser() {
    const email = 'davidkuriyan20@gmail.com';
    const userId = 'ae609eae-6508-426a-b514-ed9a96b938bb';
    const tenantId = '930e6f70-f5cb-41be-84d2-4e5e31f1864e'; // TalentHub Solutions

    console.log('=== Fixing orphaned user ===\n');

    // Check if user already exists in users table
    const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (existing) {
        console.log('User already exists in users table:', existing);
        console.log('\nUpdating role to admin...');

        // Update to admin role
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin', tenant_id: tenantId })
            .eq('id', userId);

        if (updateError) {
            console.error('Update error:', updateError);
        } else {
            console.log('✅ Role updated to admin');
        }
    } else {
        console.log('Creating users table entry...');

        // Create user record
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                tenant_id: tenantId,
                email: email,
                role: 'admin'
            });

        if (insertError) {
            console.error('Insert error:', insertError);
        } else {
            console.log('✅ User record created');
        }
    }

    // Update auth user metadata
    console.log('\nUpdating auth user metadata...');
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
            user_metadata: {
                tenant_id: tenantId,
                role: 'admin',
                industry: 'IT/Technology'
            }
        }
    );

    if (authUpdateError) {
        console.error('Auth update error:', authUpdateError);
    } else {
        console.log('✅ Auth metadata updated');
    }

    console.log('\n=== Fix complete ===');
    console.log('You can now sign in with:');
    console.log('Email:', email);
    console.log('Password: David@123');
    console.log('Organization: TalentHub Solutions');
}

fixOrphanedUser().catch(console.error);
