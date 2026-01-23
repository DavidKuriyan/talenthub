import { createAdminClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function GET() {
    // Use Admin Client to bypass RLS for seeding
    const supabase = await createAdminClient();

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
        const tenants = tenantsData as { id: string; slug: string; name: string }[];
        const tenantId = tenants.find(t => t.slug === 'talenthub')?.id || tenants[0].id;

        // Get a user to act as Client and Engineer (or create placeholders)
        // For simplicity, we just look for any existing users or prompt error if none.
        const { data: usersData } = await supabase.from('users').select('*').eq('tenant_id', tenantId);
        const users = usersData as { id: string; tenant_id: string; email: string; role: string }[] | null;
        let clientUser: { id: string } | null = null;
        let engineerUser: { id: string } | null = null;

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
            client_id: clientUser?.id,
            title: "Seed: Senior React Developer",
            skills: ["React", "TypeScript", "Node.js"],
            budget: 150000,
            status: 'open'
        }).select().single();

        if (reqError) throw reqError;

        // Insert Profile
        const { data: profile, error: profError } = await (supabase.from('profiles') as any).upsert({
            user_id: engineerUser?.id,
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
                requirement: (req as any)?.id,
                profile: (profile as any)?.id
            }
        });

    } catch (e: unknown) {
        const error = e as Error;
        console.error("Seed API Error:", error);
        return NextResponse.json({
            success: false,
            error: "Seeding failed",
            details: error.message
        }, { status: 500 });
    }
}
