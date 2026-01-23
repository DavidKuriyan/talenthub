const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testJoin() {
    console.log("🚀 Testing Joined Query...");

    // Load .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("1. Testing standard join...");
    const { data: d1, error: e1 } = await supabase
        .from('matches')
        .select(`
            id,
            requirements (
                id,
                title
            )
        `)
        .limit(1);

    if (e1) {
        console.error("❌ Standard join failed:", e1.message);
    } else {
        console.log("✅ Standard join worked!", d1);
    }

    console.log("\n2. Testing explicit join (using requirement_id)...");
    const { data: d2, error: e2 } = await supabase
        .from('matches')
        .select(`
            id,
            requirements!requirement_id (
                id,
                title
            )
        `)
        .limit(1);

    if (e2) {
        console.error("❌ Explicit join failed:", e2.message);
    } else {
        console.log("✅ Explicit join worked!", d2);
    }

    console.log("\n3. Testing explicit join (using FK name - guess: matches_requirement_id_fkey)...");
    const { data: d3, error: e3 } = await supabase
        .from('matches')
        .select(`
            id,
            requirements!matches_requirement_id_fkey (
                id,
                title
            )
        `)
        .limit(1);

    if (e3) {
        console.error("❌ FK Name join failed:", e3.message);
    } else {
        console.log("✅ FK Name join worked!", d3);
    }
}

testJoin();
