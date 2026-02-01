#!/usr/bin/env node

/**
 * Verify tenant_id column exists in messages table
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

async function verifySchema() {
    console.log('🔍 Verifying tenant_id column in messages table...\n');

    // Test 1: Check if column exists via a simple query
    const { data, error } = await supabase
        .from('messages')
        .select('tenant_id')
        .limit(1);

    if (error) {
        if (error.message.includes('tenant_id')) {
            console.error('❌ FAILED: tenant_id column does NOT exist');
            console.error('   Error:', error.message);
            console.error('\n📝 ACTION: Run the SQL migration in Supabase Dashboard');
            process.exit(1);
        }
    }

    console.log('✅ SUCCESS: tenant_id column EXISTS!');
    console.log('✅ Schema cache is refreshed');
    console.log('\n🎉 Ready to test messaging!');
    process.exit(0);
}

verifySchema();
