'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeContextType = {
    subscribe: (params: {
        table: string;
        filter?: string;
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        onChange: (payload: any) => void;
    }) => void;
};

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());

    // Cleanup on unmount
    useEffect(() => {
        return () => {
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
            console.log(`[Realtime] Already subscribed to ${channelKey}`);
            return;
        }

        console.log(`[Realtime] Subscribing to ${channelKey}`);

        const channel = supabase
            .channel(channelKey)
            .on(
                'postgres_changes',
                { event: event as any, schema: 'public', table, filter },
                (payload) => onChange(payload)
            )
            .subscribe((status) => {
                console.log(`[Realtime] Status for ${channelKey}: ${status}`);
            });

        channelsRef.current.set(channelKey, channel);
    };

    return (
        <RealtimeContext.Provider value={{ subscribe }}>
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
