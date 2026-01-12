"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchMessageHistory, subscribeToMessages, sendMessage as sendRealtimeMessage } from "@/lib/realtime";

/**
 * @feature REALTIME_MESSAGING
 * @aiNote Real-time chat between organization and engineer
 */
export default function MessagesPage() {
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const unsubscribeRef = useRef<any>(null);
    const router = useRouter();

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
            router.push("/login");
            return;
        }
        setSession(currentSession);
        loadConversations(currentSession.user.id);
    };

    const loadConversations = async (userId: string) => {
        try {
            // Get engineer's profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", userId)
                .single();

            if (!profile) {
                setLoading(false);
                return;
            }

            // Fetch matches (conversations)
            const { data: matchesData, error } = await supabase
                .from("matches")
                .select(`
                    id,
                    requirements (
                        title
                    )
                `)
                .eq("profile_id", (profile as any).id);

            if (error) throw error;

            const formattedConversations = (matchesData || []).map((m: any) => ({
                id: m.id,
                name: (m.requirements as any)?.title || "Job Match",
                lastMessage: "Chat about this role"
            }));

            setConversations(formattedConversations);
            setLoading(false);
        } catch (error) {
            console.error("Error loading conversations:", error);
            setLoading(false);
        }
    };

    const loadMessages = async (matchId: string) => {
        try {
            setSelectedConversation(matchId);
            const history = await fetchMessageHistory(matchId);
            setMessages(history);

            // Cleanup previous subscription if any
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }

            // Subscribe to real-time updates
            const unsubscribe = subscribeToMessages(matchId, (msg) => {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.find(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
            });

            unsubscribeRef.current = unsubscribe;
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    // Cleanup subscription on unmount
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !session || !selectedConversation) return;

        try {
            await sendRealtimeMessage(
                selectedConversation,
                session.user.id,
                newMessage
            );
            setNewMessage("");
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center">
                <div className="text-white text-lg">Loading messages...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900">
            <div className="max-w-7xl mx-auto p-6">
                <Link href="/engineer/profile" className="text-emerald-300 hover:text-emerald-100 text-sm mb-4 inline-block">
                    ← Back to Profile
                </Link>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-emerald-700/30 overflow-hidden h-[calc(100vh-12rem)]">
                    <div className="flex h-full">
                        {/* Conversations Sidebar */}
                        <div className="w-80 border-r border-emerald-700/30 overflow-y-auto">
                            <div className="p-4 border-b border-emerald-700/30">
                                <h2 className="text-lg font-bold text-white">Messages</h2>
                            </div>
                            <div className="divide-y divide-emerald-700/30">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => loadMessages(conv.id)}
                                        className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${selectedConversation === conv.id ? 'bg-white/10' : ''
                                            }`}
                                    >
                                        <p className="font-medium text-white">{conv.name}</p>
                                        <p className="text-sm text-emerald-300 truncate">{conv.lastMessage}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 flex flex-col">
                            {selectedConversation ? (
                                <>
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="text-6xl mb-4">💬</div>
                                                <p className="text-white text-lg">No messages yet</p>
                                                <p className="text-emerald-300 text-sm">Start the conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex ${msg.sender_id === session?.user.id ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-md px-4 py-2 rounded-2xl ${msg.sender_id === session?.user.id
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-white/20 text-white'
                                                        }`}>
                                                        <p>{msg.content}</p>
                                                        <p className="text-xs opacity-70 mt-1">
                                                            {new Date(msg.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <form onSubmit={sendMessage} className="p-4 border-t border-emerald-700/30">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-emerald-700/30 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">💬</div>
                                        <p className="text-white text-lg">Select a conversation</p>
                                        <p className="text-emerald-300 text-sm">Choose from the list to start chatting</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                    <p className="text-emerald-200 text-sm">
                        💡 <strong>Real-time enabled:</strong> Messages update automatically using Supabase Realtime
                    </p>
                </div>
            </div>
        </div>
    );
}
