"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import { supabase } from "@/lib/supabase";

interface ChatRoomProps {
    roomId: string;
    senderId: string;
    tenantId: string;
    userName?: string;
    displayName?: string;
}

/**
 * @feature CHAT_ROOM_LEGACY_WRAPPER
 * @aiNote Wrapper for ChatWindow to maintain compatibility with existing Room.tsx usages.
 * Ensures that even legacy components benefit from the premium realtime chat UI.
 */
export default function ChatRoom({
    roomId,
    senderId,
    userName = "chat",
    displayName,
    tenantId,
}: ChatRoomProps) {
    const [userRole, setUserRole] = useState<'organization' | 'engineer'>('organization');

    useEffect(() => {
        const detectRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id === senderId) {
                // If the prompt passed the authenticated user's ID as senderId
                const role = session.user.app_metadata?.role || 'organization';
                setUserRole(role as any);
            }
        };
        detectRole();
    }, [senderId]);

    return (
        <div className="h-[600px] w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/5">
            <ChatWindow
                matchId={roomId}
                currentUserId={senderId}
                currentUserName={displayName || userName}
                otherUserName="Participant"
                currentUserRole={userRole}
                tenantId={tenantId}
            />
        </div>
    );
}
