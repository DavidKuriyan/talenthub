
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Database } from "@/lib/types";

export async function GET(req: Request) {
    // Use Service Role Key to bypass RLS for seeding
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Check if tables exist
        const { error: checkError } = await supabase.from('requirements').select('id').limit(1);
        if (checkError) {
            if (checkError.message.includes('relation "requirements" does not exist')) {
                return NextResponse.json({
                    error: "Tables Missing",
                    message: "The matching schema has not been applied. Please run the SQL migration manually in Supabase Dashboard."
                }, { status: 500 });
            }
            // Other error
        }

        // 2. Seed Data
        // Get Tenants
        const { data: tenantsData } = await supabase.from('tenants').select('*');
        if (!tenantsData || tenantsData.length === 0) {
            return NextResponse.json({ error: "No tenants found" }, { status: 500 });
        }
        const tenants = tenantsData as any[];
        const tenantId = tenants.find(t => t.slug === 'talenthub')?.id || tenants[0].id;

        // Get a user to act as Client and Engineer (or create placeholders)
        // For simplicity, we just look for any existing users or prompt error if none.
        const { data: users } = await (supabase.from('users') as any).select('*').eq('tenant_id', tenantId);
        let clientUser, engineerUser;

        if (!users || users.length === 0) {
            // Create a demo user if none exist
            const { data: newUser, error: createError } = await (supabase.from('users') as any).insert({
                tenant_id: tenantId,
                email: 'demo@talenthub.com',
                role: 'subscriber'
            }).select().single();

            if (createError) {
                console.error("Failed to create demo user:", createError);
                // Verify if error is RLS related or other
                return NextResponse.json({
                    error: "Seed Failed",
                    message: "No users found and failed to create demo user: " + createError.message
                }, { status: 500 });
            }
            clientUser = newUser;
            engineerUser = newUser; // Self-match for demo
        } else {
            // Use available users
            clientUser = users[0];
            engineerUser = users.length > 1 ? users[1] : users[0];
        }

        // Delete existing test data to avoid duplicates if run multiple times
        // (Optional, or just insert)

        // Insert Requirement
        const { data: req, error: reqError } = await (supabase.from('requirements') as any).insert({
            tenant_id: tenantId,
            client_id: clientUser.id,
            title: "Seed: Senior React Developer",
            skills: ["React", "TypeScript", "Node.js"],
            budget: 150000,
            status: 'open'
        }).select().single();

        if (reqError) throw reqError;

        // Insert Profile
        const { data: profile, error: profError } = await (supabase.from('profiles') as any).upsert({
            user_id: engineerUser.id,
            tenant_id: tenantId,
            skills: ["React", "TypeScript", "Tailwind"],
            experience_years: 5,
            resume_url: "https://linkedin.com/in/demo"
        }, { onConflict: 'user_id' }).select().single();

        if (profError) throw profError;

        return NextResponse.json({
            success: true,
            message: "Seeding Complete",
            details: {
                requirement: (req as any).id,
                profile: (profile as any).id
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
