"use client";

import { useEffect, useState, useRef } from "react";
import { Tables } from "@/lib/types";
import {
    subscribeToMessages,
    fetchMessageHistory,
    sendMessage as sendMessageUtil,
} from "@/lib/realtime";
import { createJitsiRoomConfig } from "@/lib/jitsi";
import { uploadChatImage } from "@/lib/storage";

type Message = Tables<"messages">;

interface ChatRoomProps {
    roomId: string;
    senderId: string;
    tenantId: string;
    userName?: string;
    displayName?: string;
}

export default function ChatRoom({
    roomId,
    senderId,
    tenantId,
    userName = "chat",
    displayName,
}: ChatRoomProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [jitsiConfig, setJitsiConfig] = useState<ReturnType<typeof createJitsiRoomConfig> | null>(
        null
    );
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        // 1. Fetch existing messages
        const loadMessages = async () => {
            try {
                setIsLoading(true);
                const history = await fetchMessageHistory(roomId, 50);
                setMessages(history);
                setError(null);
            } catch (err) {
                console.error("Error loading messages:", err);
                setError("Failed to load messages");
            } finally {
                setIsLoading(false);
            }
        };

        // 2. Generate Jitsi config
        const config = createJitsiRoomConfig(senderId, tenantId, userName, displayName);
        setJitsiConfig(config);

        loadMessages();

        // 3. Subscribe to new messages in real-time
        const unsubscribe = subscribeToMessages(
            roomId,
            (newMsg) => {
                setMessages((prev) => [...prev, newMsg]);
            },
            (err) => {
                console.error("Realtime subscription error:", err);
                setError("Lost real-time connection");
            }
        );

        return () => {
            unsubscribe();
        };
    }, [roomId, senderId, tenantId, userName, displayName]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessageUtil(roomId, senderId, tenantId, newMessage);
            setNewMessage("");
            setError(null);
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Only images are supported");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be smaller than 5MB");
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const { url } = await uploadChatImage(file, tenantId, roomId);
            await sendMessageUtil(roomId, senderId, tenantId, `[Image] ${url}`);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error("Error uploading file:", err);
            setError("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
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
            {isVideoOpen && jitsiConfig && (
                <div className="h-64 bg-black border-b border-zinc-800">
                    <iframe
                        key={jitsiConfig.roomId}
                        src={jitsiConfig.url}
                        allow="camera; microphone; fullscreen; display-capture"
                        className="w-full h-full"
                        title="Jitsi Video Conference"
                    />
                </div>
            )}

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
                {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-zinc-500">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-zinc-500">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
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
                                {msg.content.startsWith("[Image]") ? (
                                    <img
                                        src={msg.content.replace("[Image] ", "")}
                                        alt="Uploaded"
                                        className="max-w-full rounded-lg"
                                        loading="lazy"
                                    />
                                ) : (
                                    msg.content
                                )}
                                <div className="text-xs opacity-70 mt-1">
                                    {new Date(msg.created_at).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-xl bg-zinc-200 dark:bg-zinc-800 px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50"
                    title="Upload image"
                >
                    {isUploading ? "📤" : "📎"}
                </button>
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
