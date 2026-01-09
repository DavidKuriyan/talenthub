import { supabase } from "./supabase";
import { Tables } from "./types";

type Message = Tables<"messages">;

/**
 * Subscribe to real-time message updates for a specific chat room
 * Uses Supabase Realtime with PostgreSQL Changes
 */
export function subscribeToMessages(
    roomId: string,
    onNewMessage: (message: Message) => void,
    onError?: (error: Error) => void
) {
    const channel = supabase
        .channel(`room:${roomId}`, {
            config: {
                broadcast: { self: true },
            },
        })
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
                if (payload.new) {
                    onNewMessage(payload.new as Message);
                }
            }
        )
        .on("error", (error) => {
            console.error("Realtime subscription error:", error);
            if (onError) onError(new Error(error.message));
        })
        .subscribe((status) => {
            console.log(`Subscription to room:${roomId} status:`, status);
        });

    // Return unsubscribe function
    return async () => {
        await supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to real-time updates for all messages in a tenant
 * Useful for admin dashboards
 */
export function subscribeToTenantMessages(
    tenantId: string,
    onNewMessage: (message: Message) => void,
    onError?: (error: Error) => void
) {
    const channel = supabase
        .channel(`tenant:${tenantId}:messages`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `tenant_id=eq.${tenantId}`,
            },
            (payload) => {
                if (payload.new) {
                    onNewMessage(payload.new as Message);
                }
            }
        )
        .on("error", (error) => {
            console.error("Tenant realtime subscription error:", error);
            if (onError) onError(new Error(error.message));
        })
        .subscribe();

    return async () => {
        await supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to message updates (UPDATE events)
 * Useful for tracking edited messages or status changes
 */
export function subscribeToMessageUpdates(
    roomId: string,
    onMessageUpdate: (message: Message) => void,
    onError?: (error: Error) => void
) {
    const channel = supabase
        .channel(`room:${roomId}:updates`)
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "messages",
                filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
                if (payload.new) {
                    onMessageUpdate(payload.new as Message);
                }
            }
        )
        .on("error", (error) => {
            console.error("Message updates subscription error:", error);
            if (onError) onError(new Error(error.message));
        })
        .subscribe();

    return async () => {
        await supabase.removeChannel(channel);
    };
}

/**
 * Fetch message history for a room with pagination
 */
export async function fetchMessageHistory(
    roomId: string,
    limit: number = 50,
    offset: number = 0
) {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Error fetching message history:", error);
        throw error;
    }

    return data?.reverse() || [];
}

/**
 * Send a message with error handling
 */
export async function sendMessage(
    roomId: string,
    senderId: string,
    tenantId: string,
    content: string
) {
    if (!content.trim()) {
        throw new Error("Message content cannot be empty");
    }

    const { data, error } = await supabase
        .from("messages")
        .insert({
            room_id: roomId,
            sender_id: senderId,
            tenant_id: tenantId,
            content: content.trim(),
        })
        .select()
        .single();

    if (error) {
        console.error("Error sending message:", error);
        throw error;
    }

    return data;
}
