const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fixSchema() {
    // 1. Load Env
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envConfig.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            env[key.trim()] = values.join('=').trim();
        }
    });

    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        console.error("Missing credentials.");
        process.exit(1);
    }

    const supabase = createClient(url, serviceKey);

    console.log("Fixing Chat Schema...");

    // 2. Add 'deleted_by' column
    // We can't run raw ALTER TABLE easily via JS client without SQL function usually.
    // But we can check if we can run a postgres function if it exists, or typically we rely on users running SQL.
    // HOWEVER, this environment seems to have 'rpc' enabled.
    // If we can't run raw SQL, we are stuck unless we provide the SQL to the user.
    // BUT WAIT. The 'postgres_changes' suggests we have some DB access.
    // If we can't execute SQL, we can try to use standard APIs to insert dummy data to force column creation in some dev setups? No, that's not reliable.

    // Actually, many Supabase instances come with a `exec_sql` or similar if configured, but standard usage doesn't.
    // If I cannot run SQL, I must ask the user to run it.

    // Plan B: Do client-side update for deletions?
    // "messages" table has to have "deleted_by". If it's missing, we MUST modify schema.

    // Let's TRY to print the SQL instructions for the user as a fallback, 
    // but if we happen to have a special rpc for exec (rare), use it.

    // Assuming I cannot run arbitrary SQL. I will checking if columns exist first via 'columns' logic or just inspection.

    const { error: inspectError } = await supabase.from('messages').select('deleted_by').limit(1);
    if (inspectError && inspectError.code === '42703') { // Undefined column
        console.log("Column 'deleted_by' is MISSING.");
        console.log("---------------------------------------------------");
        console.log("PLEASE RUN THIS SQL IN SUPABASE DASHBOARD -> SQL EDITOR:");
        console.log("---------------------------------------------------");
        console.log(`
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by text[] DEFAULT '{}';
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role text DEFAULT 'organization';
        
        CREATE OR REPLACE FUNCTION soft_delete_message(message_id uuid, user_id text)
        RETURNS void AS $$
        BEGIN
          UPDATE messages
          SET deleted_by = array_append(deleted_by, user_id)
          WHERE id = message_id AND NOT (deleted_by @> ARRAY[user_id]);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
        console.log("---------------------------------------------------");
    } else {
        console.log("Column 'deleted_by' exists. Checking RPC...");
        // Check RPC? Hard to check if RPC exists easily via JS.
        // But if delete is failing, RPC is likely missing.
        console.log("If delete is failing, the RPC 'soft_delete_message' is likely missing.");
        console.log("Please Run the SQL above to optionally recreate it.");
    }
}

fixSchema();
