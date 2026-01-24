"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTable } from "@/lib/realtime";
import { useRouter } from "next/navigation";

/**
 * @feature GLOBAL_SYNC
 * @aiNote High-level provider that manages real-time subscriptions for global tables
 * like matches, interviews, and requirements to keep the UI in sync without refreshes.
 */
export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const unsubscribesRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        const setupGlobalSync = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const tenantId = session?.user?.app_metadata?.tenant_id;

                if (tenantId) {
                    console.log(`[RealtimeProvider] Setting up global sync for tenant: ${tenantId}`);

                    // Cleanup any existing subscriptions first
                    unsubscribesRef.current.forEach(unsub => unsub());
                    unsubscribesRef.current = [];

                    // Define generic refresh handler
                    const handleUpdate = (payload: any) => {
                        console.log("[RealtimeProvider] Global update detected, refreshing data...", payload);
                        router.refresh();
                    };

                    // Sync Matches
                    const unsubMatches = subscribeToTable('matches', tenantId, handleUpdate, handleUpdate, handleUpdate);

                    // Sync Interviews
                    const unsubInterviews = subscribeToTable('interviews', tenantId, handleUpdate, handleUpdate, handleUpdate);

                    // Sync Requirements
                    const unsubRequirements = subscribeToTable('requirements', tenantId, handleUpdate, handleUpdate, handleUpdate);

                    // Sync Profiles (for engineers)
                    const unsubProfiles = subscribeToTable('profiles', tenantId, handleUpdate, handleUpdate, handleUpdate);

                    unsubscribesRef.current = [
                        () => { unsubMatches(); },
                        () => { unsubInterviews(); },
                        () => { unsubRequirements(); },
                        () => { unsubProfiles(); }
                    ];
                }
            } catch (error) {
                console.error("[RealtimeProvider] Setup error:", error);
            }
        };

        setupGlobalSync();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`[RealtimeProvider] Auth event: ${event}`);
            if (event === 'SIGNED_IN') {
                setupGlobalSync();
            } else if (event === 'SIGNED_OUT') {
                unsubscribesRef.current.forEach(unsub => unsub());
                unsubscribesRef.current = [];
            }
        });

        return () => {
            console.log("[RealtimeProvider] Cleaning up global subscriptions");
            unsubscribesRef.current.forEach(unsub => unsub());
            subscription.unsubscribe();
        };
    }, [router]);

    return <>{children}</>;
}
