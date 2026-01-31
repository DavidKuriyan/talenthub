"use client";
// Force rebuild

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

/**
 * @feature NAVBAR
 * @aiNote Navigation bar with auth-aware logout button.
 * Shows logout when user is logged in, login link when not.
 */
export default function NavBar() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const isEngineerPage = pathname?.startsWith('/engineer');
    const isOrganizationPage = pathname?.startsWith('/organization');
    const isAuthPage = isEngineerPage || isOrganizationPage;

    useEffect(() => {
        // Check current session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setIsInitialLoad(false);
        };
        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user || null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        if (loading) return;
        setLoading(true);

        try {
            console.log('[NavBar] 🚪 Logging out...');

            // Clean up all realtime subscriptions
            await supabase.removeAllChannels();

            // Check if session exists before signing out
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // Only attempt sign out if there's an active session
                const { error } = await supabase.auth.signOut();

                if (error && !error.message.includes('Auth session missing')) {
                    console.error('[NavBar] Logout error:', error);
                    throw error; // Re-throw non-session errors for proper handling
                }
            } else {
                console.log('[NavBar] No active session, skipping signOut');
            }

            // Clear local storage and session state
            if (typeof window !== 'undefined') {
                localStorage.removeItem('supabase.auth.token');
                // Clear any cached session data
                sessionStorage.clear();
            }

            // Explicitly clear user state
            setUser(null);

            // Context-aware redirect using replace() to prevent back navigation
            const redirectPath = isOrganizationPage
                ? '/organization/login'
                : isEngineerPage
                    ? '/login'
                    : '/login';

            console.log('[NavBar] ✅ Logged out, redirecting to:', redirectPath);

            // Use replace() instead of push() to prevent back button navigation
            router.replace(redirectPath);

            // Small delay to ensure state is cleared before refresh
            setTimeout(() => {
                router.refresh();
            }, 100);
        } catch (error: any) {
            // Gracefully handle auth session errors (session already cleared)
            if (error?.message?.includes('Auth session missing')) {
                console.log('[NavBar] ℹ️ Session already cleared');
            } else {
                console.error('[NavBar] Logout failure:', error?.message || error);
            }

            // Clear user state even on error
            setUser(null);

            // Always redirect even if error occurs
            const fallbackPath = isOrganizationPage ? '/organization/login' : '/login';
            router.replace(fallbackPath);

            setTimeout(() => {
                router.refresh();
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    if (isInitialLoad) return <div className="w-16 h-8 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>;

    return (
        <div className="flex items-center gap-4">
            {user ? (
                <>
                    <span className="text-sm text-zinc-500 hidden md:inline">
                        {user.email}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            console.log('[NavBar] 🖱️ Button clicked!');
                            handleLogout();
                        }}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                        {loading ? "..." : "Logout"}
                    </button>
                </>
            ) : (
                // Only show Login button if NOT on an authenticated page
                !isAuthPage && (
                    <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
                    >
                        Login
                    </Link>
                )
            )}
        </div>
    );
}
