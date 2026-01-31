'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'messages' | 'matches' | 'interviews' | 'requirements' | 'profiles';

type RealtimeContextType = {
    subscribe: (params: {
        table: string;
        filter?: string;
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        onChange: (payload: any) => void;
    }) => string;
    unsubscribe: (channelKey: string) => void;
    unsubscribeAll: () => void;
    subscribeToGlobalChanges: (params: {
        tenantId: string;
        tables: TableName[];
        onAnyChange: () => void;
    }) => () => void;
    lastUpdate: number; // Timestamp of last global update
};

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
    const [lastUpdate, setLastUpdate] = useState(0);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('[RealtimeProvider] Cleaning up all subscriptions on unmount');
            channelsRef.current.forEach((channel) => {
                supabase.removeChannel(channel);
            });
            channelsRef.current.clear();
        };
    }, []);

    const subscribe = ({
        table,
        filter,
        event = '*',
        onChange,
    }: {
        table: string;
        filter?: string;
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        onChange: (payload: any) => void;
    }) => {
        const channelKey = `${table}:${filter || 'all'}:${event}`;

        // Avoid duplicate subscriptions
        if (channelsRef.current.has(channelKey)) {
            console.log(`[Realtime] ⚠️ Already subscribed to ${channelKey}`);
            return channelKey;
        }

        console.log(`[Realtime] 🔌 Subscribing to ${channelKey}`);

        const channel = supabase
            .channel(channelKey)
            .on(
                'postgres_changes',
                { event: event as any, schema: 'public', table, filter },
                (payload) => {
                    console.log(`[Realtime] 📨 Event received for ${channelKey}:`, payload);
                    onChange(payload);
                    setLastUpdate(Date.now());
                }
            )
            .subscribe((status, err) => {
                console.log(`[Realtime] 📡 Status for ${channelKey}: ${status}`);
                if (err) {
                    console.error(`[Realtime] ❌ Error for ${channelKey}:`, err);
                }
            });

        channelsRef.current.set(channelKey, channel);
        return channelKey;
    };

    const subscribeToGlobalChanges = ({
        tenantId,
        tables,
        onAnyChange,
    }: {
        tenantId: string;
        tables: TableName[];
        onAnyChange: () => void;
    }) => {
        console.log(`[RealtimeProvider] 🌍 Subscribing to global changes for tenant ${tenantId}`);

        const channelKeys: string[] = [];

        tables.forEach(table => {
            const channelKey = subscribe({
                table,
                filter: `tenant_id=eq.${tenantId}`,
                event: '*',
                onChange: (payload) => {
                    console.log(`[GlobalSync] ${table} changed:`, payload.eventType);
                    setLastUpdate(Date.now());
                    onAnyChange();
                }
            });
            channelKeys.push(channelKey);
        });

        // Return cleanup function
        return () => {
            channelKeys.forEach(key => unsubscribe(key));
        };
    };

    const unsubscribe = (channelKey: string) => {
        const channel = channelsRef.current.get(channelKey);
        if (channel) {
            console.log(`[Realtime] Unsubscribing from ${channelKey}`);
            supabase.removeChannel(channel);
            channelsRef.current.delete(channelKey);
        }
    };

    const unsubscribeAll = () => {
        console.log('[Realtime] Unsubscribing from all channels');
        channelsRef.current.forEach((channel) => {
            supabase.removeChannel(channel);
        });
        channelsRef.current.clear();
    };

    return (
        <RealtimeContext.Provider value={{
            subscribe,
            unsubscribe,
            unsubscribeAll,
            subscribeToGlobalChanges,
            lastUpdate
        }}>
            {children}
        </RealtimeContext.Provider>
    );
}

export const useRealtime = () => {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }
    return context;
};
