"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type RealtimeContextType = {
    isConnected: boolean;
};

const RealtimeContext = createContext<RealtimeContextType>({ isConnected: false });

export const useRealtime = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setIsConnected(false);
                // Ensure channels are cleaned up
                supabase.removeAllChannels();
            }
        });

        // Global User Channel for profile updates, notifications etc.
        const setupGlobalSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userId = session.user.id;
            const tenantId = session.user.app_metadata?.tenant_id;

            console.log(`[GlobalRealtime] Initializing for user: ${userId}`);

            const channel = supabase.channel(`global:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('[GlobalRealtime] Notification:', payload);
                        // In a real app, trigger a toast or update separate context
                    }
                )
                .subscribe((status) => {
                    console.log(`[GlobalRealtime] Status: ${status}`);
                    setIsConnected(status === 'SUBSCRIBED');
                });

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanupPromise = setupGlobalSubscription();

        return () => {
            subscription.unsubscribe();
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, []);

    return (
        <RealtimeContext.Provider value={{ isConnected }}>
            {children}
        </RealtimeContext.Provider>
    );
}
