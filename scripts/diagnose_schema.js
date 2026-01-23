const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function diagnose() {
    console.log("🔍 Diagnosing Supabase Schema...");

    // Load .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("Checking 'profiles' table columns...");

    // Attempt to select one row to see keys
    const { data: sample, error } = await supabase.from('profiles').select('*').limit(1).maybeSingle();

    if (error) {
        console.error("❌ Error querying profiles:", error.message);
    } else {
        const columns = sample ? Object.keys(sample) : ["NONE"];
        console.log("✅ Columns found via sample:");
        columns.forEach(c => console.log(` - ${c}`));
    }

    // Attempt to list columns explicitly if possible (depends on postgres setup)
    const { data: colData, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
    if (colError) {
        console.warn("⚠️ get_table_columns RPC failed (expected if not defined)");
    } else {
        console.log("📊 RPC Columns:", colData);
    }
}

diagnose();
