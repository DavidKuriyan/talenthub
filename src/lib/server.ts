import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./types";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async get(name: string) {
                    const cookie = await cookieStore.get(name);
                    return cookie?.value;
                },
                async set(name: string, value: string, options: CookieOptions) {
                    try {
                        await cookieStore.set({ name, value, ...options });
                    } catch {
                        // Handle server action / router context
                    }
                },
                async remove(name: string, options: CookieOptions) {
                    try {
                        await cookieStore.set({ name, value: "", ...options });
                    } catch {
                        // Handle server action / router context
                    }
                },
            },
        }
    );
}

/**
 * Creates a Supabase client with the service role key to bypass RLS.
 * Use only for administrative tasks and server-side background processes.
 */
export async function createAdminClient() {
    const { createClient } = await import("@supabase/supabase-js");

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}
