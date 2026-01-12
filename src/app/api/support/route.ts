import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { subject, description } = await req.json();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
        if (!tenantId) return NextResponse.json({ error: "No tenant context" }, { status: 400 });

        const { data, error } = await (supabase.from("support_tickets") as any).insert({
            user_id: session.user.id,
            tenant_id: tenantId,
            subject,
            description,
            status: 'open'
        }).select().single();

        if (error) throw error;

        return NextResponse.json({ success: true, ticket: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data, error } = await (supabase.from("support_tickets") as any)
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ success: true, tickets: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
