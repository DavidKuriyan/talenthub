const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function listTables() {
    console.log("🔍 Listing Tables in Database...");

    // Load .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Instead of RPC, try a dummy select on common names to see what exists
    const tables = ['requirements', 'requirement', 'matches', 'match', 'profiles', 'profile', 'tenants', 'tenant'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: Exists (Count: ${data?.count || 0})`);
        }
    }
}

listTables();
