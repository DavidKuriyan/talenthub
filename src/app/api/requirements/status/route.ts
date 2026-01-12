import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { id, status } = await req.json();

        if (!id || !status) return NextResponse.json({ error: "Missing ID or status" }, { status: 400 });

        const { error } = await (supabase.from("requirements") as any)
            .update({ status })
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
