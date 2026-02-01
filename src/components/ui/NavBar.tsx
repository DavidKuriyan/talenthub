"use client";
// Force rebuild

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth/logout";

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
            console.log('[NavBar] 🚪 Logging out via Server Action...');

            // Optional: Clear client-side storage just in case (audit requirement)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('talenthub-session');
                localStorage.removeItem('supabase.auth.token');
                sessionStorage.clear();
            }

            // Call Server Action
            // 1. Client-side cleanup
            await supabase.auth.signOut();

            // 2. Server-side cleanup (cookie removal)
            await logoutAction();

            // 3. Force hard redirect to login to clear all memory/state
            window.location.href = '/login/';
        } catch (error: any) {
            console.error('[NavBar] Logout exception:', error);
            // Fallback redirect if server action fails somehow (rare)
            window.location.href = '/login/';
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
                    <form action={logoutAction}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                            {loading ? "..." : "Logout"}
                        </button>
                    </form>
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
