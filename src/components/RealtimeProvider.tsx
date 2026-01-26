"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTable, GlobalTable } from "@/lib/realtime/global";
import { useRouter } from "next/navigation";

const RealtimeContext = createContext<number>(0);
export const useRealtime = () => useContext(RealtimeContext);

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const unsubscribesRef = useRef<(() => void)[]>([]);

    useEffect(() => {
        const setupGlobalSync = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const user = session.user;
                const tenantId = user?.app_metadata?.tenant_id || user?.user_metadata?.tenant_id;
                const role = user?.app_metadata?.role || user?.user_metadata?.role;

                // 1. Cleanup existing subscriptions
                unsubscribesRef.current.forEach(unsub => unsub());
                unsubscribesRef.current = [];

                const triggerUpdate = (payload: any) => {
                    console.log(`[EventBus] Global Update: ${payload.table} (${payload.eventType})`);
                    setLastUpdate(Date.now());
                    router.refresh();
                };

                if (tenantId) {
                    console.log(`[EventBus] Active: Syncing for Tenant ${tenantId.slice(0, 8)}`);

                    const tables: GlobalTable[] = ['matches', 'interviews', 'requirements', 'profiles', 'messages'];
                    unsubscribesRef.current = tables.map(table =>
                        subscribeToTable({
                            table,
                            filterColumn: 'tenant_id',
                            filterValue: tenantId,
                            onChange: triggerUpdate
                        })
                    );
                } else if (role === 'provider' || role === 'engineer') {
                    // Engineers need their profile ID to sync
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('user_id', user.id)
                        .single() as { data: { id: string } | null };

                    if (profile?.id) {
                        console.log(`[EventBus] Active: Syncing for Engineer ${profile.id.slice(0, 8)}`);

                        const tables: GlobalTable[] = ['matches', 'interviews', 'messages'];
                        unsubscribesRef.current = tables.map(table =>
                            subscribeToTable({
                                table,
                                filterColumn: table === 'messages' ? 'sender_id' : 'profile_id',
                                filterValue: table === 'messages' ? user.id : profile.id,
                                onChange: triggerUpdate
                            })
                        );
                    }
                }
            } catch (error) {
                console.error("[EventBus] Fault:", error);
            }
        };

        setupGlobalSync();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (['SIGNED_IN', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
                setupGlobalSync();
            } else if (event === 'SIGNED_OUT') {
                unsubscribesRef.current.forEach(unsub => unsub());
                unsubscribesRef.current = [];
            }
        });

        return () => {
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
