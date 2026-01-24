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
            // Get engineer's profile - must have full_name
            const { data: profile } = await (supabase
                .from("profiles") as any)
                .select("id, full_name")
                .eq("user_id", userId)
                .single();

            if (!profile || !(profile as any).full_name) {
                console.warn("Profile incomplete - redirecting to setup");
                router.push("/engineer/profile");
                return;
            }

            // Fetch matches (conversations) - Simple query without nested tenant join
            const { data: matchesData, error } = await (supabase
                .from("matches") as any)
                .select(`
                    id,
                    requirement_id,
                    requirements (
                        title,
                        tenant_id
                    )
                `)
                .eq("profile_id", (profile as any).id);

            if (error) throw error;

            // Fetch tenant names separately to avoid schema cache issues
            const tenantIds = [...new Set((matchesData || []).map((m: any) => m.requirements?.tenant_id).filter(Boolean))];
            let tenantsMap: Record<string, string> = {};

            if (tenantIds.length > 0) {
                const { data: tenants } = await supabase.from("tenants").select("id, name").in("id", tenantIds);
                if (tenants) {
                    tenantsMap = tenants.reduce((acc: any, t: any) => ({ ...acc, [t.id]: t.name }), {});
                }
            }

            // Format conversations with fallback title
            const formattedConversations = (matchesData || []).map((m: any) => ({
                id: m.id,
                name: m.requirements?.title || `Job Match #${m.id?.slice(0, 8)}`,
                company: tenantsMap[m.requirements?.tenant_id] || "TalentHub Partner",
                lastMessage: "Chat about this role",
                roomName: `${m.requirements?.tenant_id}_${m.id}`
            }));

            setConversations(formattedConversations);
            setLoading(false);
        } catch (error: any) {
            console.error("Error loading conversations:", error?.message || error);
            setConversations([]);
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
                                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">{conv.company}</p>
                                        <p className="text-sm text-emerald-300 truncate opacity-60">{conv.lastMessage}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 flex flex-col">
                            {selectedConversation ? (
                                <>
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                        <div>
                                            <h3 className="font-bold text-white text-lg">
                                                {conversations.find(c => c.id === selectedConversation)?.name}
                                            </h3>
                                            <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                                                {conversations.find(c => c.id === selectedConversation)?.company}
                                            </p>
                                        </div>
                                        <Link
                                            href="/engineer/interviews"
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                                        >
                                            📹 Join Interview
                                        </Link>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/10">
                                        {messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full opacity-40">
                                                <div className="text-6xl mb-4">💬</div>
                                                <p className="text-white text-lg font-bold">No messages yet</p>
                                                <p className="text-emerald-300 text-sm">Start the conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, idx) => {
                                                const isMe = msg.sender_id === session?.user.id;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                                    >
                                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                                            {!isMe && (
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 ml-1">
                                                                    Recruiter
                                                                </span>
                                                            )}
                                                            <div className={`px-5 py-3 shadow-xl ${isMe
                                                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl rounded-tr-sm'
                                                                : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm border border-emerald-700/20'
                                                                }`}>
                                                                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                                <div className={`flex items-center gap-2 mt-2 ${isMe ? 'text-emerald-100/60' : 'text-zinc-500'}`}>
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    {isMe && <span className="text-[9px] font-black">DELIVERED</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
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
