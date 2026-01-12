import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
    console.log("Checking profiles table...");
    const { data: profileCol, error: profileErr } = await supabase
        .from('profiles')
        .select('address')
        .limit(1);

    if (profileErr) {
        console.error("Profiles 'address' column error:", profileErr.message);
    } else {
        console.log("Profiles 'address' column exists.");
    }

    console.log("\nChecking requirements table...");
    const { data: reqCol, error: reqErr } = await supabase
        .from('requirements')
        .select('experience_max')
        .limit(1);

    if (reqErr) {
        console.error("Requirements 'experience_max' column error:", reqErr.message);
    } else {
        console.log("Requirements 'experience_max' column exists.");
    }
}

checkSchema();
