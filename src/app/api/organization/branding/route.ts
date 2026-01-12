import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { tenantId, logo_url, primary_color } = await req.json();

        if (!tenantId) return NextResponse.json({ error: "Missing tenant ID" }, { status: 400 });

        const { error } = await (supabase.from("tenants") as any)
            .update({ logo_url, primary_color })
            .eq("id", tenantId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
