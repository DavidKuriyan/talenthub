const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('🔍 Checking `messages` table schema...');

    // Method 1: Try to select tenant_id from messages
    const { data, error } = await supabase
        .from('messages')
        .select('tenant_id')
        .limit(1);

    if (error) {
        console.error('❌ COLUMN CHECK FAILED!');
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error code: ${error.code}`);
        console.error('   Interpretation: The `tenant_id` column DOES NOT EXIST in the API schema cache.');
        console.log('\n👉 REMEDY: logic dictates the migration file needs to be run or schema cache reloaded.');
    } else {
        console.log('✅ COLUMN FOUND! `tenant_id` is selectable.');
        console.log('   This means the schema cache IS up to date.');
    }

    // Method 2: Insert Check (if column found, double check write)
    if (!error) {
        console.log('\n🧪 Testing dummy insert capability...');
        // We can't really insert without valid match/user FKs easily, 
        // but if we fail on Foreign Key, that means column Exists!
        // If we fail on "column does not exist", that's the issue.
        const { error: insertError } = await supabase.from('messages').insert({
            match_id: '00000000-0000-0000-0000-000000000000', // Dummy
            sender_id: '00000000-0000-0000-0000-000000000000',
            content: 'Probe',
            tenant_id: '00000000-0000-0000-0000-000000000000'
        });

        if (insertError) {
            console.log(`\n   Insert Result: ${insertError.message}`);
            if (insertError.message.includes('foreign key constraint')) {
                console.log('✅ PASS: Insert failed on FK, which means tenant_id column EXISTS.');
            } else if (insertError.message.includes('Could not find the param')) {
                console.error('❌ FAIL: PostgREST rejected tenant_id param.');
            }
        }
    }
}

checkColumns();
