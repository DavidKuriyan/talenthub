import { supabase, Tables } from "./supabase";

type Message = Tables<"messages">;

// Track active subscriptions
const activeChannels = new Map<string, any>();

/**
 * @feature REALTIME_MESSAGING
 * @aiNote Pure realtime messaging using Supabase postgres_changes. 
 * Removed polling fallback as requested.
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

    console.log(`[Realtime] Subscribing to match:${matchId} (currentUserId: ${currentUserId})`);

    const channel = supabase
        .channel(`realtime:chat:${matchId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `match_id=eq.${matchId}`,
            },
            (payload) => {
                console.log("[Realtime] New Message Received");
                onNewMessage(payload.new as Message);
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
                console.log("[Realtime] Message Updated");
                if (onMessageUpdate) onMessageUpdate(payload.new as Message);
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
                console.log("[Realtime] Message Deleted");
                if (onMessageDelete && payload.old) {
                    onMessageDelete((payload.old as any).id);
                }
            }
        )
        .subscribe((status, err) => {
            console.log(`[Realtime] Sync Status for match ${matchId.slice(0, 8)}: ${status}`);
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
                console.error("[Realtime] Subscription Error Details:", err?.message || status);
                if (onError) onError(err || new Error(status));
            }
        });

    return async () => {
        console.log(`[Realtime] Unsubscribing from match:${matchId}`);
        await supabase.removeChannel(channel);
    };
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
    if (!messageId || !userId) {
        console.error("[Realtime] deleteMessage: Missing params", { messageId, userId });
        throw new Error("Message ID and User ID are required for deletion");
    }

    const { error } = await (supabase as any)
        .rpc("soft_delete_message", {
            message_id: messageId,
            user_id: userId
        });

    if (error) {
        console.error("[Realtime] Error deleting message:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        throw error;
    }

    return true;
}

// ================================
// GLOBAL REALTIME SYNC
// ================================

export type TableName = 'matches' | 'interviews' | 'requirements' | 'profiles' | 'messages';

/**
 * Subscribe to global table changes for real-time sync across the app
 */
export function subscribeToTable(
    tableName: TableName,
    filterValue: string,
    onInsert?: (record: any) => void,
    onUpdate?: (record: any) => void,
    onDelete?: (recordId: string) => void,
    filterColumn: string = 'tenant_id'
) {
    console.log(`[GlobalSync] Subscribing to ${tableName} where ${filterColumn}=${filterValue}`);

    const channel = supabase
        .channel(`global:${tableName}:${filterValue}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: tableName,
                filter: `${filterColumn}=eq.${filterValue}`,
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
