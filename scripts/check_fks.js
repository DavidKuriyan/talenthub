const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkRelationships() {
    console.log("🔍 Checking Database Relationships for 'matches'...");

    // Load .env.local
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Query information_schema for foreign keys
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: `
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'matches';
        `
    });

    if (error) {
        console.error("❌ Error checking relationships:", error.message);
        // Fallback: try to see if we can get it via a simple query
        console.log("Attempting fallback check...");
        const { data: fkData, error: fkError } = await supabase
            .from('matches')
            .select(`
                id,
                requirement_id
            `)
            .limit(1);

        if (fkError) {
            console.error("❌ Fallback query failed:", fkError.message);
        } else {
            console.log("✅ Basic query on 'matches' works. Data:", fkData);
        }
    } else {
        console.log("✅ Foreign Keys for 'matches':");
        console.table(data);
    }
}

checkRelationships();
