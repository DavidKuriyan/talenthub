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

/**
 * @feature SUPABASE_CLIENT
 * @aiNote Robust browser client initialization.
 * Uses @supabase/ssr for seamless session sync with Next.js.
 */
export const supabase = createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "talenthub-session", // Custom key to avoid collisions
        }
    }
);

/**
 * Utility to forcefully clear all auth-related storage
 * Use this only if session recovery is failing due to corrupted storage.
 */
export const clearAuthStorage = () => {
    if (typeof window === 'undefined') return;
    try {
        const keys = ['talenthub-session', 'supabase.auth.token', 'sb-access-token', 'sb-refresh-token'];
        keys.forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        // Clear all cookies as well
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    } catch (e) {
        console.error("Failed to clear auth storage", e);
    }
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
