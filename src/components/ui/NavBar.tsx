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
            console.log("[NavBar] Initiating global logout...");

            // 1. Sign out from Supabase
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // 2. Clear state and storage
            if (typeof window !== 'undefined') {
                window.localStorage.clear();
                window.sessionStorage.clear();

                // Clear all cookies (best effort)
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            }

            // 3. Role-based redirect using replace for clean history
            let targetUrl = "/";
            if (pathname?.startsWith("/organization")) {
                targetUrl = "/organization/login";
            } else if (pathname?.startsWith("/engineer")) {
                targetUrl = "/login";
            }

            console.log(`[NavBar] Redirecting to ${targetUrl}`);
            window.location.replace(targetUrl);
        } catch (error: any) {
            console.error("Logout failure:", error?.message || error);
            // Fallback redirect even on failure to ensure user isn't stuck
            window.location.replace("/");
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
