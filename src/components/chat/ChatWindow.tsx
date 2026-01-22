'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchMessageHistory, sendMessage, subscribeToMessages } from '@/lib/realtime';
import { createBrowserClient } from '@supabase/ssr';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_system_message: boolean;
}

interface ChatWindowProps {
    matchId: string;
    currentUserId: string;
}

export default function ChatWindow({ matchId, currentUserId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch initial history
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const history = await fetchMessageHistory(matchId);
                setMessages(history as Message[]);
            } catch (err: unknown) {
                const error = err as Error;
                console.error("Failed to load chat history", error);
                setError("Failed to load messages");
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, [matchId]);

    // Subscribe to realtime updates
    useEffect(() => {
        const unsubscribe = subscribeToMessages(matchId, (newMsg) => {
            setMessages((prev) => [...prev, newMsg as Message]);
        });

        return () => {
            unsubscribe();
        };
    }, [matchId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Optimistic update? No, let's wait for ack or realtime.
            // Actually, realtime will add it. But for better UX, we can clear input immediately.
            const content = newMessage;
            setNewMessage('');
            await sendMessage(matchId, currentUserId, content);
        } catch (err: unknown) {
            const error = err as Error;
            console.error("Failed to send message", error);
            setError("Failed to send message");
        }
    };

    if (isLoading) return <div className="p-4">Loading chat...</div>;

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="p-4 border-b bg-zinc-50 flex justify-between items-center">
                <h3 className="font-semibold text-zinc-800">Chat</h3>
                {error && <span className="text-red-500 text-sm">{error}</span>}
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-zinc-400 mt-10">No messages yet. Say hello!</div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-zinc-100 text-zinc-800 rounded-bl-none'
                                        }`}
                                >
                                    {msg.content}
                                    <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-zinc-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t bg-zinc-50 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
