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

async function checkUser() {
    const email = 'davidkuriyan20@gmail.com';

    console.log('=== Checking for user:', email, '===\n');

    // Check users table
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    console.log('Users table:');
    if (usersError) {
        console.log('Error:', usersError);
    } else {
        console.log(JSON.stringify(users, null, 2));
    }

    // Check auth users
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.log('\nAuth Error:', authError);
    } else {
        const targetUser = authUsers?.find(u => u.email === email);
        console.log('\nAuth user:');
        if (targetUser) {
            console.log(JSON.stringify({
                id: targetUser.id,
                email: targetUser.email,
                created_at: targetUser.created_at,
                email_confirmed_at: targetUser.email_confirmed_at,
                user_metadata: targetUser.user_metadata,
                app_metadata: targetUser.app_metadata
            }, null, 2));
        } else {
            console.log('Not found in auth');
        }
    }

    // Check tenants
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .ilike('name', '%TalentHub Solutions%');

    console.log('\nTenants matching "TalentHub Solutions":');
    if (tenantsError) {
        console.log('Error:', tenantsError);
    } else {
        console.log(JSON.stringify(tenants, null, 2));
    }
}

checkUser().catch(console.error);
