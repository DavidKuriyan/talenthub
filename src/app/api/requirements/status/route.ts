import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { id, status } = await req.json();

        if (!id || !status) return NextResponse.json({ success: false, error: "Missing ID or status" }, { status: 400 });

        const { error } = await (supabase.from("requirements") as any)
            .update({ status })
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Requirement Status Update Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to update requirement status",
            details: error.message
        }, { status: 500 });
    }
}
