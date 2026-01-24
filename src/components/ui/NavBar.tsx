"use client";

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
        setLoading(true);
        try {
            // Check if there's an active session first
            const { data: { session } } = await supabase.auth.getSession();

            // Only sign out if there's an active session
            if (session) {
                const { error } = await supabase.auth.signOut();

                if (error) {
                    console.error("Logout error:", error);
                    throw error;
                }
            }

            // Clear user state regardless
            setUser(null);

            // Navigate to home page and force a full reload to clear state
            window.location.href = "/";

        } catch (error: any) {
            // Handle AuthSessionMissingError gracefully - user is already logged out
            if (error?.name === 'AuthSessionMissingError' || error?.message?.includes('session missing')) {
                console.log("No active session, redirecting to home");
                setUser(null);
                window.location.href = "/";
            } else {
                console.error("Logout failed:", error);
                alert("Failed to logout. Please try again.");
            }
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
                        onClick={handleLogout}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
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
