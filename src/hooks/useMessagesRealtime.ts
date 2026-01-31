'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const onEventRef = useRef(onEvent);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Keep callback ref updated
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (!matchId) {
            console.warn('[useMessagesRealtime] ⚠️ No matchId provided');
            return;
        }

        // Validation: We need at least matchId; tenantId is optional but recommended
        const channelName = tenantId
            ? `messages:${tenantId}:${matchId}`
            : `messages:${matchId}`;

        console.log(`[useMessagesRealtime] 🔌 Subscribing to ${channelName}`);

        // Clean up any existing channel
        if (channelRef.current) {
            console.log('[useMessagesRealtime] 🧹 Removing old channel');
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    console.log('[useMessagesRealtime] 📨 INSERT:', payload.new);
                    onEventRef.current({ type: 'INSERT', message: payload.new });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    console.log('[useMessagesRealtime] 🔄 UPDATE:', payload.new);
                    onEventRef.current({ type: 'UPDATE', message: payload.new });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    console.log('[useMessagesRealtime] 🗑️ DELETE:', payload.old);
                    onEventRef.current({
                        type: 'DELETE',
                        messageId: (payload.old as any)?.id
                    });
                }
            )
            .subscribe((status, err) => {
                console.log(`[useMessagesRealtime] 📡 Status: ${status}`);

                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setError(null);
                    console.log('[useMessagesRealtime] ✅ Connected');
                } else if (status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    setError('Channel error - check Realtime settings');
                    console.error('[useMessagesRealtime] ❌ Channel error:', err);
                } else if (status === 'TIMED_OUT') {
                    setIsConnected(false);
                    setError('Connection timed out');
                    console.error('[useMessagesRealtime] ⏱️ Timeout');
                } else if (status === 'CLOSED') {
                    setIsConnected(false);
                    console.log('[useMessagesRealtime] 🔌 Connection closed');
                }
            });

        channelRef.current = channel;

        return () => {
            console.log('[useMessagesRealtime] 🧹 Cleanup: removing channel');
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            setIsConnected(false);
        };
    }, [matchId, tenantId]);

    return { isConnected, error };
}
