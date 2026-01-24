const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Manually parse .env.local because we are in a raw node script
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error("CRITICAL: .env.local file NOT found at", envPath);
        process.exit(1);
    }

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
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error("CRITICAL: Missing credentials in .env.local");
        console.log("URL:", url ? "Found" : "Missing");
        console.log("Key:", key ? "Found" : "Missing");
        process.exit(1);
    }

    console.log("Testing connection to:", url);

    // 2. Initialize Client
    const supabase = createClient(url, key);

    // 3. Simple Query
    supabase.from('messages').select('*').limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.error("CONNECTION FAILED:");
                console.error(error);
                process.exit(1);
            } else {
                console.log("CONNECTION SUCCESSFUL!");
                console.log("Data received:", data);
                process.exit(0);
            }
        })
        .catch(err => {
            console.error("NETWORK/FETCH ERROR:");
            console.error(err);
            process.exit(1);
        });

} catch (err) {
    console.error("SCRIPT ERROR:", err);
    process.exit(1);
}
