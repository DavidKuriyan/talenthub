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

  // CLEANUP: Remove any existing channel for this match to prevent duplicates
  const channelName = `realtime:chat:${matchId}`;
  const existingChannel = supabase.getChannels().find(c => c.topic === channelName);
  if (existingChannel) {
    console.log(`[Realtime] Cleaning up existing channel for ${matchId}`);
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        console.log("[Realtime] New Message Received:", payload.new);
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
        console.log("[Realtime] Message Updated:", payload.new);
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
        console.log("[Realtime] Message Deleted:", payload.old);
        if (onMessageDelete && payload.old) {
          onMessageDelete((payload.old as any).id);
        }
      }
    )
    .subscribe((status, err) => {
      const idStr = matchId ? String(matchId) : 'unknown';
      console.log(`[Realtime] Sync Status for match ${idStr.slice(0, 8)}: ${status}`);
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
      .select(`
        *,
        sender:sender_id(
          full_name
        )
      `)
      .eq("match_id", matchId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter out messages deleted for the current user
    if (userId) {
      query = query.not("deleted_for", "cs", `{${userId}}`);
    }

    const { data, error } = await query;
    // ... (keep existing error handling if needed, but simplified for clarity in replacement)
    if (error) {
      console.error("[Realtime] Error fetching message history:", error);
      throw error;
    }

    return data || [];
  } catch (err: any) {
    console.error("[Realtime] Exception in fetchMessageHistory:", err?.message || err);
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

  // Attempt to get tenant_id - this is CRITICAL for RLS
  const { data: { session } } = await supabase.auth.getSession();
  const tenantId = session?.user?.app_metadata?.tenant_id || session?.user?.user_metadata?.tenant_id;

  const payload: any = {
    match_id: matchId,
    sender_id: senderId,
    sender_role: senderRole,
    content: content.trim(),
    is_system_message: isSystemMessage
  };

  // Only add tenant_id if present, but for orgs it MUST be present
  if (tenantId) {
    payload.tenant_id = tenantId;
  }

  const { data, error } = await (supabase
    .from("messages") as any)
    .insert(payload)
    .select(`
      *,
      sender:sender_id(
        full_name
      )
    `)
    .single();

  if (error) {
    console.error("[Realtime] Error sending message:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a message (soft delete by marking as deleted for the current user)
 */
export async function deleteMessage(messageId: string, userId: string) {
  if (!messageId || !userId) {
    throw new Error("Message ID and User ID are required for deletion");
  }

  // 1. Fetch current array safely
  const { data: current, error: fetchError } = await (supabase
    .from('messages')
    .select('deleted_for')
    .eq('id', messageId)
    .single() as any);

  if (fetchError) throw fetchError;

  const currentDeletedFor = (current as any)?.deleted_for || [];

  // 2. Prevent duplicate entries
  if (Array.isArray(currentDeletedFor) && currentDeletedFor.includes(userId)) {
    return true;
  }

  const newDeletedFor = Array.isArray(currentDeletedFor)
    ? [...currentDeletedFor, userId]
    : [userId];

  // 3. Update
  const { error: updateError } = await (supabase as any)
    .from('messages')
    .update({ deleted_for: newDeletedFor })
    .eq('id', messageId);

  if (updateError) throw updateError;
  return true;
}

// ================================
// GLOBAL REALTIME SYNC
// ================================

export type TableName =
  | "matches"
  | "interviews"
  | "requirements"
  | "profiles"
  | "messages";

/**
 * Subscribe to global table changes for real-time sync across the app
 */
export function subscribeToTable(
  tableName: TableName,
  filterValue: string,
  onInsert?: (record: any) => void,
  onUpdate?: (record: any) => void,
  onDelete?: (recordId: string) => void,
  filterColumn: string = "tenant_id",
) {
  console.log(
    `[GlobalSync] Subscribing to ${tableName} where ${filterColumn}=${filterValue}`,
  );

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
        console.log(
          `[GlobalSync] ${tableName} change:`,
          payload.eventType,
          payload,
        );

        switch (payload.eventType) {
          case "INSERT":
            if (onInsert) onInsert(payload.new);
            break;
          case "UPDATE":
            if (onUpdate) onUpdate(payload.new);
            break;
          case "DELETE":
            if (onDelete && payload.old) onDelete((payload.old as any).id);
            break;
        }
      },
    )
    .subscribe((status) => {
      console.log(`[GlobalSync] ${tableName} subscription status:`, status);
    });

  return async () => {
    console.log(`[GlobalSync] Unsubscribing from ${tableName}`);
    await supabase.removeChannel(channel);
  };
}
