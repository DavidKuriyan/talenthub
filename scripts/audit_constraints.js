const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function auditConstraints() {
    console.log("🔍 Auditing Constraints for Singular vs Plural Tables...");

    // Load .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const tables = ['matches', 'match', 'requirements', 'requirement'];

    for (const table of tables) {
        console.log(`\n--- TABLE: ${table} ---`);

        // 1. Check if it actually exists and has rows
        const { data: countData, error: countError } = await supabase.from(table).select('id', { count: 'exact', head: true });
        if (countError) {
            console.log(`❌ Table check failed: ${countError.message}`);
            continue;
        }
        console.log(`✅ Exists with ${countData?.count || 0} rows.`);

        // 2. Try a join and see if it works
        const joinTarget = table.startsWith('m') ? (table === 'matches' ? 'requirements' : 'requirement') : (table === 'requirements' ? 'matches' : 'match');

        console.log(`Testing join to ${joinTarget}...`);
        const { data: joinData, error: joinError } = await supabase.from(table).select(`id, ${joinTarget}(id)`).limit(1);

        if (joinError) {
            console.log(`❌ Join to ${joinTarget} FAILED: ${joinError.message}`);
        } else {
            console.log(`✅ Join to ${joinTarget} WORKS!`);
        }
    }
}

auditConstraints();
