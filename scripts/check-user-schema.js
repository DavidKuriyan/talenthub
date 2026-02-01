#!/usr/bin/env node

/**
 * Check what columns exist in users and profiles tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking users and profiles table schemas...\n');

    // Check users table
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (!usersError && users) {
        console.log('✅ Users table columns:', Object.keys(users[0] || {}));
    } else {
        console.log('⚠️ Users table:', usersError?.message || 'No data');
    }

    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (!profilesError && profiles) {
        console.log('✅ Profiles table columns:', Object.keys(profiles[0] || {}));
    } else {
        console.log('⚠️ Profiles table:', profilesError?.message || 'No data');
    }
}

checkSchema();
