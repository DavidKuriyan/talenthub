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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
    console.log('=== Testing Organization Login ===\n');

    const email = 'davidkuriyan20@gmail.com';
    const password = 'David@123';

    console.log('Attempting to sign in with:');
    console.log('Email:', email);
    console.log('Password: ********\n');

    // Test login
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('❌ Login failed:');
        console.error('Error:', error.message);
        return;
    }

    console.log('✅ Login successful!\n');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Role:', data.user.user_metadata?.role);
    console.log('Tenant ID:', data.user.user_metadata?.tenant_id);
    console.log('Industry:', data.user.user_metadata?.industry);

    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out successfully');
}

testLogin().catch(console.error);
