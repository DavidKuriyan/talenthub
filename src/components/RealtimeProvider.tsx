"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTable, TableName } from "@/lib/realtime";
import { useRouter } from "next/navigation";

// Context to share the update signal
const RealtimeContext = createContext<number>(0);

export const useRealtime = () => useContext(RealtimeContext);

/**
 * @feature GLOBAL_SYNC
 * @aiNote High-level provider that manages real-time subscriptions for global tables.
 * It broadcasts a 'lastUpdate' signal that client components can use to re-fetch data.
 */
export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const unsubscribesRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        const setupGlobalSync = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const tenantId = session?.user?.app_metadata?.tenant_id;

                // Cleanup any existing subscriptions first, regardless of tenantId
                unsubscribesRef.current.forEach(unsub => unsub());
                unsubscribesRef.current = [];

                if (tenantId) {
                    console.log(`[RealtimeProvider] Active: Syncing for Tenant ${tenantId.slice(0, 8)}`);

                    // Define generic refresh handler
                    const handleUpdate = (payload: any) => {
                        console.log(`[RealtimeProvider] Change in ${payload.table}: ${payload.eventType}`);
                        setLastUpdate(Date.now()); // Trigger useRealtime hooks
                        router.refresh();          // Trigger server component revalidation
                    };

                    // Sync Matches, Interviews, Requirements, Profiles, and Messages
                    const tables: TableName[] = ['matches', 'interviews', 'requirements', 'profiles', 'messages'];

                    unsubscribesRef.current = tables.map(table =>
                        subscribeToTable(table, tenantId, handleUpdate, handleUpdate, handleUpdate)
                    );
                } else {
                    console.log("[RealtimeProvider] Idle: No tenantId found yet");
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

    return (
        <RealtimeContext.Provider value={lastUpdate}>
            {children}
        </RealtimeContext.Provider>
    );
}
