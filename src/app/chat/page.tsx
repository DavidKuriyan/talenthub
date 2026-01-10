"use client";

import ChatRoom from "@/components/chat/Room";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * @feature CHAT_PAGE
 * @aiNote Fixed: Uses authenticated session directly instead of querying users table.
 * Previous version caused 406 error due to RLS blocking users table query.
 */
export default function ChatPage() {
    const [demoSession, setDemoSession] = useState<{
        roomId: string;
        senderId: string;
        tenantId: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const setupSession = async () => {
            try {
                // Get authenticated user session
                const { data: { session }, error: authError } = await supabase.auth.getSession();

                if (authError || !session?.user) {
                    setError("Please login to access chat");
                    return;
                }

                // Get user's tenant from metadata or fetch first available tenant
                let tenantId = session.user.user_metadata?.tenant_id;

                if (!tenantId) {
                    // Fallback: Get first active tenant for demo
                    const { data: tenantData, error: tenantError } = await supabase
                        .from("tenants")
                        .select("id")
                        .eq("is_active", true)
                        .limit(1)
                        .single();

                    if (tenantError || !tenantData) {
                        setError("No active tenant found. Please contact admin.");
                        return;
                    }
                    tenantId = (tenantData as { id: string }).id;
                }

                setDemoSession({
                    roomId: `${tenantId}:chat_${session.user.id}`,
                    senderId: session.user.id,
                    tenantId: tenantId,
                });
            } catch (err: any) {
                setError(err.message || "Failed to initialize chat");
            }
        };

        setupSession();
    }, []);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <div className="text-center p-8">
                    <p className="text-red-500 font-medium">{error}</p>
                    <a href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    if (!demoSession) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <p className="text-zinc-500 animate-pulse">Initializing chat session...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 flex flex-col items-center">
            <header className="mb-12 text-center">
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Real-time Coordination</h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2 max-w-md mx-auto">
                    Connect with providers and candidates instantly via secure chat and video.
                </p>
            </header>

            <ChatRoom
                roomId={demoSession.roomId}
                senderId={demoSession.senderId}
                tenantId={demoSession.tenantId}
            />

            <div className="mt-8 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 max-w-lg text-center">
                @aiNote This uses authenticated session for chat. RLS policies enforce tenant isolation.
            </div>
        </div>
    );
}

