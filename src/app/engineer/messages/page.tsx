"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChatWindow from "@/components/chat/ChatWindow";

/**
 * @feature REALTIME_MESSAGING
 * @aiNote Real-time chat between organization and engineer
 */
export default function MessagesPage() {
    const [session, setSession] = useState<any>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [selectedConversationData, setSelectedConversationData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login");
            return;
        }
        setSession({ user });
        loadConversations(user.id);
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

            // Fetch matches (conversations) - Manual fetch to avoid missing FK errors
            const { data: matchesData, error: matchesError } = await supabase
                .from("matches")
                .select("id, requirement_id")
                .eq("profile_id", (profile as any).id);

            if (matchesError) throw matchesError;

            // Manual join for requirements
            const reqIds = matchesData.map((m: any) => m.requirement_id).filter(Boolean);
            let reqsMap: Record<string, any> = {};

            if (reqIds.length > 0) {
                const { data: reqs } = await supabase
                    .from("requirements")
                    .select("id, title, tenant_id")
                    .in("id", reqIds);

                if (reqs) {
                    reqsMap = reqs.reduce((acc: any, r: any) => ({ ...acc, [r.id]: r }), {});
                }
            }

            // Fetch tenant names separately to avoid schema cache issues
            const tenantIds = Object.values(reqsMap).map((r: any) => r.tenant_id).filter(Boolean);
            let tenantsMap: Record<string, string> = {};

            if (tenantIds.length > 0) {
                const { data: tenants } = await supabase.from("tenants").select("id, name").in("id", tenantIds);
                if (tenants) {
                    tenantsMap = tenants.reduce((acc: any, t: any) => ({ ...acc, [t.id]: t.name }), {});
                }
            }

            // Format conversations with fallback title
            const formattedConversations = (matchesData || []).map((m: any) => {
                const req = reqsMap[m.requirement_id];
                const tenantId = req?.tenant_id;
                return {
                    id: m.id,
                    name: req?.title || `Job Match #${m.id?.slice(0, 8)}`,
                    company: tenantsMap[tenantId] || "TalentHub Partner",
                    lastMessage: "Chat about this role",
                    roomName: `tenant_${tenantId}_match_${m.id}`
                };
            });

            setConversations(formattedConversations);
            setLoading(false);
        } catch (error: any) {
            console.error("Error loading conversations:", error?.message || error);
            setConversations([]);
            setLoading(false);
        }
    };

    const handleSelectConversation = (conv: any) => {
        setSelectedConversation(conv.id);
        setSelectedConversationData(conv);
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
                <Link href="/engineer/profile" className="text-emerald-300 hover:text-emerald-100 text-sm mb-4 inline-block font-bold">
                    ← Back to Profile
                </Link>

                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-emerald-700/30 overflow-hidden h-[calc(100vh-12rem)]">
                    <div className="flex h-full">
                        {/* Conversations Sidebar */}
                        <div className="w-80 border-r border-emerald-700/30 overflow-y-auto">
                            <div className="p-4 border-b border-emerald-700/30">
                                <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
                            </div>
                            <div className="divide-y divide-emerald-700/30">
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${selectedConversation === conv.id ? 'bg-white/10' : ''
                                            }`}
                                    >
                                        <p className="font-bold text-white mb-1 leading-tight">{conv.name}</p>
                                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">{conv.company}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 flex flex-col bg-black/20">
                            {selectedConversation ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-5xl mb-6">🚀</div>
                                    <h3 className="text-2xl font-black tracking-tight mb-2 text-white">Opening Channel</h3>
                                    <p className="text-emerald-300/60 max-w-xs text-sm font-medium mb-6">Connecting to the real-time hub for {selectedConversationData?.company}.</p>
                                    <button
                                        onClick={() => router.push(`/messages/${selectedConversation}`)}
                                        className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                        Enter Chat
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center opacity-50">
                                        <div className="text-6xl mb-4">💬</div>
                                        <p className="text-white text-lg font-bold">Select a conversation</p>
                                        <p className="text-emerald-300 text-sm">Choose from the list to start chatting</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                    <p className="text-emerald-200 text-sm flex items-center gap-2">
                        <span className="text-xs">💡</span> <strong>Real-time enabled:</strong> Messages sync automatically using Supabase Realtime
                    </p>
                </div>
            </div>
        </div>
    );
}
