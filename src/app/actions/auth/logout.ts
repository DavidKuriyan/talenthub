"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Database } from "@/lib/types";

export async function logoutAction() {
    const cookieStore = await cookies();

    // 1. Initialize Supabase Server Client to perform standard signOut
    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storageKey: 'talenthub-session',
                persistSession: true,
                detectSessionInUrl: true,
            },
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Ignored
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: "", ...options });
                    } catch (error) {
                        // Ignored
                    }
                },
            },
        }
    );

    // 2. Perform Supabase SignOut (global scope for complete invalidation)
    await supabase.auth.signOut({ scope: 'global' });

    // 3. CRITICAL: Explicitly delete cookies at the source
    // This removes the custom session cookie
    cookieStore.delete("talenthub-session");

    // Also remove standard Supabase tokens if they exist (just in case)
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");

    // Remove any generic supabase auth token
    cookieStore.delete("supabase.auth.token");

    // 4. Force redirect to login with logout flag
    redirect("/login?logout=true");
}
