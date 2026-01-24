import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

// Supabase Browser Client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
        console.error("Missing Supabase environment variables. Check .env.local");
    }
}

export const supabase = createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
);


export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
