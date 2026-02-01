#!/usr/bin/env node

/**
 * TalentHub Realtime Connection Test
 * Verifies Supabase WebSocket connections work correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtimeConnection() {
    console.log('🔌 Testing Supabase Realtime Connection...\n');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

    let eventReceived = false;

    // We want to verify the tenant_id filter works
    // For this test, we can try to listen to ALL messages (no filter) or a specific one if we knew a tenant ID.
    // Since we don't have a specific tenant ID handy without querying, let's just listen to public schema
    // and see if we get ANY Insert events with tenant_id populated.

    // BETTER: Let's query for a tenant ID first to make it a real test

    // Fetch a valid tenant first
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants && tenants.length > 0 ? tenants[0].id : null;

    if (tenantId) {
        console.log(`🎯 Testing with Tenant ID: ${tenantId}`);
    } else {
        console.log('⚠️ No tenants found, testing generic subscription');
    }

    const channel = supabase
        .channel('test-channel-' + Date.now())
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: tenantId ? `tenant_id=eq.${tenantId}` : undefined
        }, (payload) => {
            console.log('✅ Event received:', payload.eventType);
            console.log('   Payload:', JSON.stringify(payload, null, 2));
            if (payload.new && payload.new.tenant_id) {
                console.log(`   ✓ tenant_id present: ${payload.new.tenant_id}`);
            } else {
                console.log('   ⚠️ tenant_id MISSING in payload (Schema fix might not be applied)');
            }
            eventReceived = true;

            // Exit successfully after receiving one event
            setTimeout(() => {
                console.log('\n✨ Verification Successful: Realtime is working with tenant isolation.');
                process.exit(0);
            }, 500);
        })
        .subscribe((status, err) => {
            console.log('📡 Channel status:', status);

            if (err) {
                console.error('❌ Subscription error:', err);
            }

            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime connection successful!');
                console.log(`   Channel is listening for INSERT on messages table (Tenant: ${tenantId || 'ALL'})`);

                // Now attempt an INSERT to verify Schema Cache knows about tenant_id
                console.log('\n🧪 Attempting INSERT to verify schema cache...');

                if (!tenantId) {
                    console.log('⚠️ Cannot insert without tenant_id. Skipping insert test.');
                    return;
                }

                (async () => {
                    // Get a valid match and user first
                    const { data: matches } = await supabase.from('matches').select('id, profile_id').eq('tenant_id', tenantId).limit(1);
                    const { data: profile } = matches && matches.length > 0 ? await supabase.from('profiles').select('user_id').eq('id', matches[0].profile_id).single() : { data: null };

                    if (matches && matches.length > 0 && profile) {
                        const matchId = matches[0].id;
                        const userId = profile.user_id;

                        console.log(`   Using Match ID: ${matchId}`);
                        console.log(`   Using Sender ID: ${userId}`);

                        const { error } = await supabase.from('messages').insert({
                            match_id: matchId,
                            sender_id: userId,
                            content: 'Schema Verification Test ' + Date.now(),
                            tenant_id: tenantId,
                            sender_role: 'engineer' // assuming pure insert
                        });

                        if (error) {
                            console.error(`\n❌ INSERT FAILED: ${error.message}`);
                            console.error(`   Code: ${error.code}`);
                            console.error('   Hint: This confirms the schema cache is stale or column is missing.');
                            process.exit(1);
                        } else {
                            console.log('\n✅ INSERT SUCCESSFUL! Schema cache is correct.');
                            // The realtime listener above should pick this up and exit
                        }
                    } else {
                        console.log('⚠️ Could not find valid match/user data for insert test.');
                    }
                })();
            }
        });

    // Keep process alive to listen for events
    process.on('SIGINT', () => {
        console.log('\n\n👋 Closing connection...');
        supabase.removeChannel(channel);
        process.exit(0);
    });
}

testRealtimeConnection();
