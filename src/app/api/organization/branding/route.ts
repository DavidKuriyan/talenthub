import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { tenantId, logo_url, primary_color } = await req.json();

        if (!tenantId) return NextResponse.json({ success: false, error: "Missing tenant ID" }, { status: 400 });

        const { error } = await (supabase.from("tenants") as any)
            .update({ logo_url, primary_color })
            .eq("id", tenantId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Organization Branding Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to update branding",
            details: error.message
        }, { status: 500 });
    }
}
