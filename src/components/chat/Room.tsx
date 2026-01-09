"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/lib/types";

type Message = Tables<"messages">;

interface ChatRoomProps {
    roomId: string;
    senderId: string;
    tenantId: string;
}

export default function ChatRoom({ roomId, senderId, tenantId }: ChatRoomProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Fetch existing messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("room_id", roomId)
                .order("created_at", { ascending: true });

            if (data) setMessages(data);
        };

        fetchMessages();

        // 2. Subscribe to new messages
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const { error } = await supabase.from("messages").insert({
            room_id: roomId,
            sender_id: senderId,
            tenant_id: tenantId,
            content: newMessage,
        });

        if (!error) setNewMessage("");
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Support Chat</h2>
                    <p className="text-xs text-zinc-500">Fast-tracking your placement</p>
                </div>
                <button
                    onClick={() => setIsVideoOpen(!isVideoOpen)}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
                >
                    {isVideoOpen ? "Close Video" : "Join Video Call"}
                </button>
            </div>

            {/* Video Area (Jitsi) */}
            {isVideoOpen && (
                <div className="h-64 bg-black border-b border-zinc-800">
                    <iframe
                        src={`https://meet.jit.si/${roomId}`}
                        allow="camera; microphone; fullscreen; display-capture"
                        className="w-full h-full"
                    />
                </div>
            )}

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === senderId ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender_id === senderId
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 dark:bg-zinc-50 px-6 py-3 text-sm font-bold text-white dark:text-zinc-900 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
