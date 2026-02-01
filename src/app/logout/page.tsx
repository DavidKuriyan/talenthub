"use client";

import { useEffect } from 'react';
import { supabase, clearAuthStorage } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/**
 * @feature AUTH_LOGOUT
 * @aiNote Client-side logout page that forcefully clears all session data.
 * Fixes logout redirect loop bug by ensuring complete session cleanup.
 */
export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        async function performLogout() {
            try {
                console.log('[Logout] Starting logout process...');

                // Step 1: Clear all client-side storage
                clearAuthStorage();

                // Step 2: Sign out from Supabase (global scope)
                await supabase.auth.signOut({ scope: 'global' });

                // Step 3: Small delay to ensure cookies propagate
                await new Promise(resolve => setTimeout(resolve, 200));

                console.log('[Logout] Session cleared successfully');

                // Step 4: Redirect to login
                router.push('/login?logout=true');
            } catch (error) {
                console.error('Logout error:', error);
                // Force redirect even on error
                router.push('/login?logout=true');
            }
        }

        performLogout();
    }, [router]);

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-zinc-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-lg font-bold">Logging out...</p>
                <p className="text-zinc-500 text-sm mt-2">Clearing your session securely</p>
            </div>
        </div>
    );
}
