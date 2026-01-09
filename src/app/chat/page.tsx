"use client";

import ChatRoom from "@/components/chat/Room";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChatPage() {
    // @aiNote In a real app, these values would come from the auth context.
    // For the bootcamp, we use hardcoded IDs for demonstration.
    const [demoSession, setDemoSession] = useState<{
        roomId: string;
        senderId: string;
        tenantId: string;
    } | null>(null);

    useEffect(() => {
        const setupDemoData = async () => {
            // Fetch the first tenant and user to simulate a session
            const { data: tenant } = await supabase.from("tenants").select("id").limit(1).single();
            const { data: user } = await supabase.from("users").select("id").limit(1).single();

            if (tenant && user) {
                setDemoSession({
                    roomId: `${tenant.id}:demo_room`,
                    senderId: user.id,
                    tenantId: tenant.id,
                });
            }
        };

        setupDemoData();
    }, []);

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
                @aiNote This demo uses the first available tenant/user from the database.
                In production, RLS policies enforce that users only see messages from their own tenant.
            </div>
        </div>
    );
}
