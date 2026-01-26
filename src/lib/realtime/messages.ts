import { supabase } from "@/lib/supabase"

export function subscribeToMessages({
    matchId,
    onInsert,
    onUpdate,
}: {
    matchId: string
    onInsert: (payload: any) => void
    onUpdate?: (payload: any) => void
}) {
    const channel = supabase
        .channel(`messages:${matchId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
                onInsert(payload.new)
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "messages",
                filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
                if (onUpdate) onUpdate(payload.new)
            }
        )
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
}

/**
 * Soft deletes a message for the current user by appending their ID to deleted_for array.
 */
export async function deleteMessageForMe(messageId: string, userId: string) {
    // We use a RPC or a manual update if policies allow. 
    // Manual update with array_append if using supabase-js:
    const { data: current } = await (supabase
        .from('messages')
        .select('deleted_for')
        .eq('id', messageId)
        .single() as any);

    const deletedFor = (current as any)?.deleted_for || [];
    if (deletedFor.includes(userId)) return true;

    const { error } = await (supabase
        .from('messages')
        .update({
            deleted_for: [...deletedFor, userId]
        } as any)
        .eq('id', messageId) as any);

    if (error) {
        console.error("[Realtime] Delete failed:", error);
        throw error;
    }
    return true;
}
