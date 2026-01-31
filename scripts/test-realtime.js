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

    const channel = supabase
        .channel('test-channel-' + Date.now())
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages'
        }, (payload) => {
            console.log('✅ Event received:', payload.eventType);
            console.log('   Payload:', JSON.stringify(payload, null, 2));
            eventReceived = true;
        })
        .subscribe((status, err) => {
            console.log('📡 Channel status:', status);

            if (err) {
                console.error('❌ Subscription error:', err);
            }

            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime connection successful!');
                console.log('   Channel is listening for changes on messages table');
                console.log('\n💡 Try inserting a message in Supabase Dashboard to test');
                console.log('   Press Ctrl+C to exit\n');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('❌ Channel error - check Supabase Realtime settings');
                console.error('   Ensure Realtime is enabled for messages table');
                process.exit(1);
            } else if (status === 'TIMED_OUT') {
                console.error('❌ Connection timed out');
                console.error('   Check network connectivity and Supabase status');
                process.exit(1);
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
