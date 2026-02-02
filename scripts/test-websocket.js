#!/usr/bin/env node

/**
 * Test WebSocket realtime connection
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

async function testWebSocket() {
    console.log('🔌 Testing WebSocket connection...\n');

    // Get a tenant and match
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants?.[0]?.id;

    const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1);

    const matchId = matches?.[0]?.id;

    if (!matchId || !tenantId) {
        console.log('⚠️ No test data available');
        console.log('Creating a test subscription anyway...');
    }

    console.log(`📡 Subscribing to messages...`);
    console.log(`   Match ID: ${matchId || 'ANY'}`);
    console.log(`   Tenant ID: ${tenantId || 'ANY'}`);

    const filterString = matchId
        ? `match_id=eq.${matchId}`
        : 'id=neq.00000000-0000-0000-0000-000000000000'; // Match all

    const channel = supabase
        .channel('test-websocket-' + Date.now())
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: filterString
            },
            (payload) => {
                console.log('\n✅ REALTIME EVENT RECEIVED!');
                console.log('   Event:', payload.eventType);
                console.log('   New message:', payload.new);
                console.log('\n🎉 WebSocket is working!');
                process.exit(0);
            }
        )
        .subscribe((status, err) => {
            console.log(`\n📊 Channel status: ${status}`);

            if (status === 'SUBSCRIBED') {
                console.log('✅ WebSocket CONNECTED!');
                console.log('\n⏳ Waiting for message events...');
                console.log('   (Try sending a message in the app)');
            }

            if (err) {
                console.error('❌ Subscription error:', err);
                process.exit(1);
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('❌ Connection failed:', status);
                process.exit(1);
            }
        });

    // Keep alive
    setTimeout(() => {
        console.log('\n⏱️ Timeout - no events received in 30 seconds');
        console.log('This could mean:');
        console.log('  - No messages were sent during test');
        console.log('  - Filter is too restrictive');
        console.log('  - Realtime is not enabled on the table');
        process.exit(0);
    }, 30000);
}

testWebSocket();
