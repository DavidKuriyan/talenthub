"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchMessageHistory, subscribeToMessages, sendMessage as sendRealtimeMessage } from "@/lib/realtime";

/**
 * @feature ORGANIZATION_MESSAGING
 * @aiNote Real-time messaging portal for organizations to chat with matched engineers.
 */
export default function OrganizationMessagesPage() {
    const [session, setSession] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
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
            router.push("/organization/login");
            return;
        }
        setSession(currentSession);
        loadConversations(currentSession.user);
    };

    const loadConversations = async (user: any) => {
        try {
            const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;
            if (!tenantId) {
                console.error("No tenant ID found");
                setLoading(false);
                return;
            }

            // Fetch all matches for this organization - removed invalid FK joins
            const { data: matchesData, error } = await supabase
                .from("matches")
                .select(`
                    id,
                    requirement_id,
                    profile_id
                `)
                .eq("tenant_id", tenantId);

            if (error) throw error;

            // Format conversations with fallback values
            const formattedConversations = (matchesData || []).map((m: any) => ({
                id: m.id,
                title: `Match #${m.id?.slice(0, 8) || "Unknown"}`,
                engineerId: m.profile_id || "Unknown",
                lastMessage: "Click to start chatting"
            }));

            setConversations(formattedConversations);
            setLoading(false);
        } catch (error: any) {
            console.error("Error loading conversations:", error?.message || error);
            setConversations([]);
            setLoading(false);
        }
    };

    const selectConversation = async (conv: any) => {
        try {
            setSelectedConversation(conv);
            const history = await fetchMessageHistory(conv.id);
            setMessages(history);

            // Cleanup previous subscription if any
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }

            // Subscribe to real-time updates
            const unsubscribe = subscribeToMessages(conv.id, (msg) => {
                setMessages(prev => {
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

    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !session || !selectedConversation) return;

        try {
            await sendRealtimeMessage(
                selectedConversation.id,
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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <Link href="/organization/dashboard" className="text-zinc-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 mb-4">
                        ← Back to Command Center
                    </Link>
                    <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Messaging Center
                    </h1>
                </header>

                <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden h-[calc(100vh-16rem)] flex">
                    {/* Sidebar */}
                    <div className="w-80 border-r border-white/5 flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-500">Active Matches</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center text-zinc-600 text-sm italic">
                                    No active matches yet
                                </div>
                            ) : (
                                conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConversation(conv)}
                                        className={`w-full p-6 text-left hover:bg-white/5 transition-all ${selectedConversation?.id === conv.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
                                            }`}
                                    >
                                        <p className="font-bold text-white mb-1">{conv.title}</p>
                                        <p className="text-xs text-zinc-500 truncate">Engineer ID: {conv.engineerId.slice(0, 8)}...</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-xl">
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedConversation.title}</h3>
                                        <p className="text-xs text-zinc-500">Direct channel to engineer</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => router.push(`/organization/interviews?matchId=${selectedConversation.id}`)}
                                            className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold text-xs hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            📹 Start Video Call
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                    {messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.sender_id === session?.user.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-md p-4 rounded-2xl ${msg.sender_id === session?.user.id
                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                : 'bg-zinc-800 text-zinc-100'
                                                }`}>
                                                <p className="text-sm font-medium">{msg.content}</p>
                                                <p className="text-[10px] opacity-40 mt-2 font-bold uppercase tracking-widest">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 bg-zinc-900/50">
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a secure message..."
                                            className="flex-1 px-6 py-4 rounded-2xl bg-zinc-800 border border-white/5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                        <button
                                            type="submit"
                                            className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-5xl mb-6">💬</div>
                                <h3 className="text-2xl font-black tracking-tight mb-2">Platform Comms</h3>
                                <p className="text-zinc-500 max-w-xs text-sm font-medium">Select an active match from the sidebar to start a real-time conversation.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
