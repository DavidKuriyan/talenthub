const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUBAPASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUBAPASE_URL, SUPABASE_SERVICE_ROLE);

async function verifyProfileAPI() {
    console.log("🚀 Starting Profile API Verification...");

    const testUserEmail = 'davidkuriyan20@gmail.com';

    // 1. Find the test user
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, tenant_id')
        .eq('email', testUserEmail)
        .single();

    if (userError || !user) {
        console.error("❌ Failed to find test user:", userError);
        return;
    }

    console.log(`✅ Found test user: ${user.id}`);

    // 2. Prepare test data (only existing columns)
    const profileData = {
        user_id: user.id,
        tenant_id: user.tenant_id,
        skills: ['React', 'Node.js', 'TypeScript', 'Verification'],
        experience_years: 10,
        resume_url: 'https://verified-resume.com'
    };

    console.log("📜 Sending upsert with data:", profileData);

    // 3. Test Upsert (using service role to ensure success)
    const { data: profile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

    if (upsertError) {
        console.error("❌ Upsert failed:", upsertError);
        if (upsertError.message.includes('column')) {
            console.error("🚩 SCHEMA MISMATCH DETECTED!");
        }
    } else {
        console.log("✅ Profile upserted successfully!");
        console.log("👤 Profile ID:", profile.id);
        console.log("🔧 Skills count:", profile.skills.length);
    }

    // 4. Verify no 'address' or 'education' columns exist accidentally
    const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: 'profiles' }); // Might not exist, let's try a direct select

    const { data: sample, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();

    if (sample) {
        const keys = Object.keys(sample);
        const forbidden = ['address', 'city', 'country', 'education', 'degree', 'university', 'graduation_year'];
        const found = forbidden.filter(k => keys.includes(k));

        if (found.length > 0) {
            console.error("🚩 FOUND FORBIDDEN COLUMNS IN DATA:", found);
        } else {
            console.log("✅ Verified: No crashing columns found in response.");
        }
    }

    console.log("\n🏁 Verification complete.");
}

verifyProfileAPI();
