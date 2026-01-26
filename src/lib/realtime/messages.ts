import { supabase } from "@/lib/supabase"

export function subscribeToMessages({
    matchId,
    onInsert,
}: {
    matchId: string
    onInsert: (payload: any) => void
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
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
}
