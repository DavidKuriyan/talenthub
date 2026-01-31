'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useRealtime } from '@/providers/RealtimeProvider';

export type MessageEvent = {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    message?: any;
    messageId?: string;
};

export function useMessagesRealtime({
    matchId,
    tenantId,
    onEvent,
}: {
    matchId: string;
    tenantId?: string;
    onEvent: (event: MessageEvent) => void;
}) {
    const { subscribe, unsubscribe } = useRealtime();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!matchId) return;

        // Use the global provider to subscribe
        // IMPORTANT: We must use the correct filter as per requirements
        // "match_id=eq.${matchId},tenant_id=eq.${tenantId}"

        // Since the current RealtimeProvider 'subscribe' helper is a bit generic, 
        // we might need to construct the filter carefully.
        // The provider accepts `filter` string.

        let filterString = `match_id=eq.${matchId}`;
        if (tenantId) {
            filterString += `,tenant_id=eq.${tenantId}`;
        }

        const channelKey = subscribe({
            table: 'messages',
            filter: filterString,
            event: '*',
            onChange: (payload) => {
                // Map supabase payload to our event format
                const type = payload.eventType; // INSERT, UPDATE, DELETE
                if (type === 'DELETE') {
                    onEvent({ type, messageId: payload.old.id });
                } else {
                    onEvent({ type, message: payload.new });
                }
            }
        });

        setIsConnected(true);

        return () => {
            unsubscribe(channelKey);
            setIsConnected(false);
        };
    }, [matchId, tenantId, subscribe, unsubscribe, onEvent]);

    return { isConnected, error };
}
