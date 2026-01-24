import { supabase, Tables } from "./supabase";

type Message = Tables<"messages">;

// Track active subscriptions and polling intervals
const activePollingIntervals = new Map<string, NodeJS.Timeout>();
const seenMessageIds = new Map<string, Set<string>>();

/**
 * @feature REALTIME_MESSAGING
 * @aiNote Enhanced realtime messaging with INSERT/UPDATE/DELETE support and auto-reconnect
 */
export function subscribeToMessages(
    matchId: string,
    onNewMessage: (message: Message) => void,
    options: {
        onMessageUpdate?: (message: Message) => void;
        onMessageDelete?: (messageId: string) => void;
        onError?: (error: Error) => void;
        currentUserId?: string;
    } = {}
) {
    const { onMessageUpdate, onMessageDelete, onError, currentUserId } = options;

    // Initialize seen messages set for this match
    if (!seenMessageIds.has(matchId)) {
        seenMessageIds.set(matchId, new Set());
    }

    console.log(`[Realtime] Subscribing to match:${matchId} (currentUserId: ${currentUserId})`);

    // Start polling fallback IMMEDIATELY as a safety net
    startPolling(matchId, onNewMessage);

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
                console.log("[Realtime] INSERT received:", payload.new);
                if (payload.new) {
                    const msg = payload.new as Message;
                    let seen = seenMessageIds.get(matchId);
                    if (!seen) {
                        // Subscription might have been cleaned up or not ready
                        return;
                    }
                    if (!seen.has(msg.id)) {
                        seen.add(msg.id);
                        onNewMessage(msg);
                    }
                }
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
                console.log("[Realtime] UPDATE received:", payload.new);
                if (payload.new && (onMessageUpdate || onMessageDelete)) {
                    const msg = payload.new as Message;
                    // If message was deleted for this user, trigger a delete instead of update
                    if (msg.deleted_by && currentUserId && msg.deleted_by.includes(currentUserId)) {
                        if (onMessageDelete) onMessageDelete(msg.id);
                    } else if (onMessageUpdate) {
                        onMessageUpdate(msg);
                    }
                }
            }
        )
        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "messages",
                filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
                console.log("[Realtime] DELETE received:", payload.old);
                if (payload.old && onMessageDelete) {
                    onMessageDelete((payload.old as any).id);
                }
            }
        )
        .subscribe((status, err) => {
            console.log(`[Realtime] Subscription status for match:${matchId}: ${status}`);

            if (status === 'SUBSCRIBED') {
                console.log(`[Realtime] Successfully subscribed to match:${matchId}`);
                // We keep polling active as a safety net, but maybe slow it down or rely on realtime
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
                console.warn("[Realtime] Realtime channel error, legacy polling active", err);
                if (onError) onError(err || new Error(status));
            }
        });

    // Return unsubscribe function
    return async () => {
        console.log(`[Realtime] Unsubscribing from match:${matchId}`);
        stopPolling(matchId);
        seenMessageIds.delete(matchId);
        await supabase.removeChannel(channel);
    };
}

/**
 * Start polling fallback for when realtime fails
 */
function startPolling(matchId: string, onNewMessage: (message: Message) => void) {
    // Don't start duplicate polling
    if (activePollingIntervals.has(matchId)) return;

    console.log(`[Realtime] Starting polling fallback for match:${matchId}`);

    if (!seenMessageIds.has(matchId)) {
        seenMessageIds.set(matchId, new Set());
    }

    const interval = setInterval(async () => {
        try {
            const latestMessages = await fetchMessageHistory(matchId, 20, 0);
            if (latestMessages && latestMessages.length > 0) {
                let seen = seenMessageIds.get(matchId);
                // Re-initialize if missing (rare race condition)
                if (!seen) {
                    seen = new Set();
                    seenMessageIds.set(matchId, seen);
                }

                latestMessages.forEach((msg: any) => {
                    if (msg.id && !seen!.has(msg.id)) {
                        seen!.add(msg.id);
                        onNewMessage(msg as Message);
                    }
                });
            }
        } catch (err) {
            console.error("[Realtime] Polling error:", err);
        }
    }, 3000); // Poll every 3 seconds

    activePollingIntervals.set(matchId, interval);
}

/**
 * Stop polling for a specific match
 */
function stopPolling(matchId: string) {
    const interval = activePollingIntervals.get(matchId);
    if (interval) {
        clearInterval(interval);
        activePollingIntervals.delete(matchId);
        console.log(`[Realtime] Stopped polling for match:${matchId}`);
    }
}

/**
 * Fetch message history for a match with pagination
 */
export async function fetchMessageHistory(
    matchId: string,
    limit: number = 50,
    offset: number = 0
): Promise<any[]> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        let query = (supabase.from("messages") as any)
            .select("*")
            .eq("match_id", matchId)
            .order("created_at", { ascending: true })
            .range(offset, offset + limit - 1);

        // Filter out messages deleted by the current user
        if (userId) {
            query = query.not("deleted_by", "cs", `{${userId}}`);
        }

        const { data, error } = await query;

        if (error) {
            // If column doesn't exist or cache stale, retry without the filter
            if ((error.code === '42703' || error.code === 'PGRST204') && userId) {
                console.warn("[Realtime] 'deleted_by' column missing or cache stale, retrying without filter...");
                const fallbackQuery = (supabase.from("messages") as any)
                    .select("*")
                    .eq("match_id", matchId)
                    .order("created_at", { ascending: true })
                    .range(offset, offset + limit - 1);
                const { data: fbData, error: fbError } = await fallbackQuery;
                if (!fbError) return fbData || [];
                // If fallback also fails, log that error
                console.error("[Realtime] Fallback query failed:", fbError.message, fbError.code);
            } else {
                console.error("[Realtime] Error fetching message history:", error.message, error.code, error.details);
            }

            throw error;
        }

        // Mark all fetched messages as seen
        if (data && !seenMessageIds.has(matchId)) {
            seenMessageIds.set(matchId, new Set());
        }
        if (data) {
            let seen = seenMessageIds.get(matchId);
            if (!seen) {
                seen = new Set();
                seenMessageIds.set(matchId, seen);
            }
            data.forEach((msg: any) => seen!.add(msg.id));
        }

        return data || [];
    } catch (err: any) {
        console.error("[Realtime] Exception in fetchMessageHistory:", err?.message || err);

        // Diagnostic check for common env issues
        if (err?.message?.includes("Failed to fetch")) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            console.error(`[Realtime] Network error detected. checking env: URL_PRESENT=${!!supabaseUrl}`);
            if (!supabaseUrl) {
                console.error("[Realtime] CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not set in environment!");
            }
        }
        return [];
    }
}

/**
 * Send a message with error handling
 */
export async function sendMessage(
    matchId: string,
    senderId: string,
    content: string,
    senderRole: 'organization' | 'engineer' = 'organization',
    isSystemMessage: boolean = false
) {
    if (!content.trim()) {
        throw new Error("Message content cannot be empty");
    }

    // Attempt to get tenant_id from current session
    const { data: { session } } = await supabase.auth.getSession();
    const tenantId = session?.user?.app_metadata?.tenant_id;

    const { data, error } = await (supabase
        .from("messages") as any)
        .insert({
            match_id: matchId,
            sender_id: senderId,
            sender_role: senderRole,
            content: content.trim(),
            is_system_message: isSystemMessage,
            tenant_id: tenantId
        })
        .select()
        .single();

    if (error) {
        // If column doesn't exist or cache stale, retry with minimal fields
        if (error.code === '42703' || error.code === 'PGRST204') {
            console.warn("[Realtime] One or more columns missing or cache stale, retrying minimal insert...");
            const { data: fbData, error: fbError } = await (supabase
                .from("messages") as any)
                .insert({
                    match_id: matchId,
                    sender_id: senderId,
                    content: content.trim(),
                    is_system_message: isSystemMessage
                })
                .select()
                .single();

            if (!fbError) return fbData;

            // If fallback also fails, log that error
            console.error("[Realtime] Fallback insert failed:", fbError.message, fbError.code);
            throw fbError;
        }

        console.error("[Realtime] Error sending message:", error.message, error.code, error.details);
        throw error;
    }

    return data;
}

/**
 * Delete a message (soft delete by marking as deleted for the current user)
 */
export async function deleteMessage(messageId: string, userId: string) {
    const { error } = await (supabase as any)
        .rpc("soft_delete_message", {
            message_id: messageId,
            user_id: userId
        });

    if (error) {
        console.error("[Realtime] Error deleting message:", error);
        throw error;
    }

    return true;
}

// ================================
// GLOBAL REALTIME SYNC
// ================================

type TableName = 'matches' | 'interviews' | 'requirements' | 'profiles';

/**
 * Subscribe to global table changes for real-time sync across the app
 */
export function subscribeToTable(
    tableName: TableName,
    tenantId: string,
    onInsert?: (record: any) => void,
    onUpdate?: (record: any) => void,
    onDelete?: (recordId: string) => void
) {
    console.log(`[GlobalSync] Subscribing to ${tableName} for tenant:${tenantId}`);

    const channel = supabase
        .channel(`global:${tableName}:${tenantId}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: tableName,
                filter: `tenant_id=eq.${tenantId}`,
            },
            (payload) => {
                console.log(`[GlobalSync] ${tableName} change:`, payload.eventType, payload);

                switch (payload.eventType) {
                    case 'INSERT':
                        if (onInsert) onInsert(payload.new);
                        break;
                    case 'UPDATE':
                        if (onUpdate) onUpdate(payload.new);
                        break;
                    case 'DELETE':
                        if (onDelete && payload.old) onDelete((payload.old as any).id);
                        break;
                }
            }
        )
        .subscribe((status) => {
            console.log(`[GlobalSync] ${tableName} subscription status:`, status);
        });

    return async () => {
        console.log(`[GlobalSync] Unsubscribing from ${tableName}`);
        await supabase.removeChannel(channel);
    };
}
