import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const requirementSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    skills: z.array(z.string()).min(1, "Select at least one skill"),
    budget: z.number().min(100, "Budget must be at least ₹100"),
});

/**
 * @feature MATCHING_ENGINE
 * @aiNote Handles creation of new job requirements. Enforces RLS via Supabase client.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validation
        const result = requirementSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
        }

        const { title, skills, budget } = result.data;
        const tenantId = session.user.app_metadata.tenant_id || 'talenthub';

        const { data, error } = await supabase
            .from("requirements")
            .insert({
                tenant_id: tenantId,
                client_id: session.user.id,
                title,
                skills,
                budget,
                status: 'open'
            } as any) // Type assertion until types.ts is fully propagated/picked up
            .select()
            .single();

        if (error) {
            console.error("Requirement Insert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
