#!/usr/bin/env node

/**
 * Test message sending functionality
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

async function testMessageSending() {
    console.log('🧪 Testing message sending...\n');

    // Get a tenant
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
        console.error('❌ No tenants found');
        process.exit(1);
    }
    const tenantId = tenants[0].id;
    console.log(`✓ Using tenant: ${tenantId}`);

    // Get a match
    const { data: matches } = await supabase.from('matches').select('id').eq('tenant_id', tenantId).limit(1);
    if (!matches || matches.length === 0) {
        console.error('❌ No matches found');
        process.exit(1);
    }
    const matchId = matches[0].id;
    console.log(`✓ Using match: ${matchId}`);

    // Get a profile/user
    const { data: profiles } = await supabase.from('profiles').select('user_id').eq('tenant_id', tenantId).limit(1);
    if (!profiles || profiles.length === 0) {
        console.error('❌ No profiles found');
        process.exit(1);
    }
    const userId = profiles[0].user_id;
    console.log(`✓ Using user: ${userId}`);

    // Try to send a message
    console.log('\n📤 Attempting to insert message...');
    const payload = {
        match_id: matchId,
        sender_id: userId,
        content: 'Test message ' + Date.now(),
        tenant_id: tenantId,
        is_system_message: false
    };

    const { data, error } = await supabase
        .from('messages')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error('❌ INSERT FAILED:', error.message);
        console.error('   Details:', error);
        process.exit(1);
    }

    console.log('✅ Message sent successfully!');
    console.log('   Message ID:', data.id);
    console.log('   Content:', data.content);

    process.exit(0);
}

testMessageSending();
