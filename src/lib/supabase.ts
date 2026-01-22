import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

// Diagnostic logging for development
if (typeof window !== 'undefined') {
    console.log('--- Supabase Config Loading ---');
    console.log('Project URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Anon Key Present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('------------------------------');
}

export const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            storage: {
                getItem: (key: string) => {
                    if (typeof window === 'undefined') return null;
                    return localStorage.getItem(key);
                },
                setItem: (key: string, value: string) => {
                    if (typeof window !== 'undefined') localStorage.setItem(key, value);
                },
                removeItem: (key: string) => {
                    if (typeof window !== 'undefined') localStorage.removeItem(key);
                }
            }
        }
    }
);


export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
