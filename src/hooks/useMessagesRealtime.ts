'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useMessagesRealtime({
    matchId,
    tenantId,
    onChange,
}: {
    matchId: string;
    tenantId: string;
    onChange: () => void;
}) {
    // Keep onChange stable ref
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!matchId || !tenantId) return;

        console.log(`[useMessagesRealtime] 🔌 Connecting to messages:${tenantId}:${matchId}`);

        const channel = supabase
            .channel(`messages:${tenantId}:${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    console.log(`[useMessagesRealtime] 📨 Event received:`, payload);
                    onChangeRef.current(); // Trigger refetch
                }
            )
            .subscribe((status) => {
                console.log(`[useMessagesRealtime] 📡 Status: ${status}`);
            });

        return () => {
            console.log(`[useMessagesRealtime] 🧹 Cleaning up channel`);
            supabase.removeChannel(channel);
        };
    }, [matchId, tenantId]);
}
