import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectData() {
    console.log("--- PROFILES ---");
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, tenant_id, full_name, skills');

    if (pErr) console.error(pErr);
    else console.table(profiles);

    console.log("\n--- REQUIREMENTS ---");
    const { data: reqs, error: rErr } = await supabase
        .from('requirements')
        .select('id, tenant_id, title, client_id');

    if (rErr) console.error(rErr);
    else console.table(reqs);

    console.log("\n--- TENANTS ---");
    const { data: tenants, error: tErr } = await supabase
        .from('tenants')
        .select('id, name');

    if (tErr) console.error(tErr);
    else console.table(tenants);

    console.log("\n--- USERS (PUBLIC) ---");
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, tenant_id, role');

    if (uErr) console.error(uErr);
    else console.table(users);
}

inspectData();
