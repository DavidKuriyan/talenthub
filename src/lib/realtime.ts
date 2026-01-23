import { supabase, Tables } from "./supabase";

type Message = Tables<"messages">;

/**
 * Subscribe to real-time message updates for a specific match (chat room)
 */
export function subscribeToMessages(
    matchId: string,
    onNewMessage: (message: Message) => void,
    onError?: (error: Error) => void
) {
    const channel = supabase
        .channel(`match:${matchId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
                if (payload.new) {
                    onNewMessage(payload.new as Message);
                }
            }
        )
        .subscribe((status, err) => {
            console.log(`Subscription to match:${matchId} status:`, status);

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
                console.warn("Realtime error, switching to polling fallback...", err);
                if (onError) onError(err || new Error(status));

                // Fallback to polling
                startPolling(matchId, onNewMessage);
            }
        });

    // Return unsubscribe function
    return async () => {
        clearInterval(pollingInterval);
        await supabase.removeChannel(channel);
    };
}

let pollingInterval: NodeJS.Timeout;

function startPolling(matchId: string, onNewMessage: (message: Message) => void) {
    if (pollingInterval) clearInterval(pollingInterval);

    // Simple set of seen message IDs to avoid duplicates
    let seenIds = new Set<string>();

    pollingInterval = setInterval(async () => {
        // Fetch only last 5 messages to check for new ones
        const latestInfo = await fetchMessageHistory(matchId, 5, 0);
        if (latestInfo && latestInfo.length > 0) {
            latestInfo.forEach(msg => {
                // If the message is newer than valid threshold (e.g. 5 seconds) and we haven't processed it
                // Actually, simplest is just to emit all distinct ones and let UI dedup
                // but fetchMessageHistory returns history.
                // We rely on the UI to deduplicate based on ID.
                onNewMessage(msg as Message);
            });
        }
    }, 2000);
}

/**
 * Fetch message history for a match with pagination
 */
export async function fetchMessageHistory(
    matchId: string,
    limit: number = 50,
    offset: number = 0
) {
    try {
        const { data, error } = await (supabase
            .from("messages") as any)
            .select("*")
            .eq("match_id", matchId)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("Error fetching message history:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });

            // If it's an RLS error or permission error, return empty array instead of throwing
            if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('policy')) {
                console.warn("Permission denied for messages - user may need to login again or match may not exist");
                return [];
            }

            throw error;
        }

        return data?.reverse() || [];
    } catch (err) {
        console.error("Exception in fetchMessageHistory:", err);
        return []; // Return empty array on error to prevent UI crash
    }
}

/**
 * Send a message with error handling
 */
export async function sendMessage(
    matchId: string,
    senderId: string,
    content: string,
    isSystemMessage: boolean = false
) {
    if (!content.trim()) {
        throw new Error("Message content cannot be empty");
    }

    const { data, error } = await (supabase
        .from("messages") as any)
        .insert({
            match_id: matchId,
            sender_id: senderId,
            content: content.trim(),
            is_system_message: isSystemMessage
        })
        .select()
        .single();

    if (error) {
        console.error("Error sending message:", error);
        throw error;
    }

    return data;
}
