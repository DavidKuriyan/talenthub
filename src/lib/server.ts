import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./types";

export async function createClient() {
    const cookieStore = await cookies();
    const cookieNames = cookieStore.getAll().map(c => c.name).join(', ');
    console.log(`🍪 createClient Cookies: ${cookieNames}`);

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle server action / router context
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.set({ name, value: "", ...options });
                    } catch (error) {
                        // Handle server action / router context
                    }
                },
            },
        }
    );
}
