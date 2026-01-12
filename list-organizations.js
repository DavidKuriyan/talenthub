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

async function listOrganizations() {
    console.log('='.repeat(80));
    console.log('REGISTERED ORGANIZATIONS IN TALENTHUB');
    console.log('='.repeat(80));
    console.log();

    // Get all tenants (organizations)
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

    if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
        return;
    }

    console.log(`Total Organizations: ${tenants.length}\n`);

    for (const tenant of tenants) {
        console.log('─'.repeat(80));
        console.log(`📊 ORGANIZATION: ${tenant.name}`);
        console.log('─'.repeat(80));
        console.log(`   ID:           ${tenant.id}`);
        console.log(`   Slug:         ${tenant.slug}`);
        console.log(`   Active:       ${tenant.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created:      ${new Date(tenant.created_at).toLocaleString()}`);

        // Get admin users for this organization
        const { data: adminUsers, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('role', 'admin');

        if (!usersError && adminUsers && adminUsers.length > 0) {
            console.log(`\n   👥 ADMIN USERS (${adminUsers.length}):`);
            adminUsers.forEach((user, index) => {
                console.log(`      ${index + 1}. Email: ${user.email}`);
                console.log(`         User ID: ${user.id}`);
                console.log(`         Created: ${new Date(user.created_at).toLocaleString()}`);
                console.log(`         🔒 Password: [ENCRYPTED - Cannot be retrieved]`);
            });
        } else {
            console.log(`\n   ⚠️  No admin users found`);
        }

        // Get all users for this organization
        const { data: allUsers, error: allUsersError } = await supabase
            .from('users')
            .select('*')
            .eq('tenant_id', tenant.id);

        if (!allUsersError && allUsers && allUsers.length > 0) {
            const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
            if (nonAdminUsers.length > 0) {
                console.log(`\n   👤 OTHER USERS (${nonAdminUsers.length}):`);
                nonAdminUsers.forEach((user, index) => {
                    console.log(`      ${index + 1}. ${user.email} - ${user.role}`);
                });
            }
        }

        console.log();
    }

    console.log('='.repeat(80));
    console.log('\n⚠️  IMPORTANT SECURITY NOTE:');
    console.log('Passwords are encrypted using bcrypt/scrypt hashing and CANNOT be retrieved.');
    console.log('This is a security best practice to protect user accounts.');
    console.log('If you need to access an account, you have two options:');
    console.log('  1. Use password reset functionality');
    console.log('  2. Create a new test account with known credentials');
    console.log('='.repeat(80));
}

listOrganizations().catch(console.error);
