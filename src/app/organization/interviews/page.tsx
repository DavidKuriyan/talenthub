"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import JitsiMeeting from "@/components/video/JitsiMeeting";

/**
 * @feature ORGANIZATION_INTERVIEWS
 * @aiNote Portal for organizations to manage and join scheduled video interviews.
 */
export default function OrganizationInterviewsPage() {
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInterview, setSelectedInterview] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const filterMatchId = searchParams.get("matchId");

    useEffect(() => {
        fetchInterviews();
    }, [filterMatchId]);

    const fetchInterviews = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/organization/login");
                return;
            }
            setUser(session.user);

            const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;

            let query = supabase
                .from("interviews")
                .select(`
                    *,
                    matches (
                        id,
                        requirements (title),
                        profiles (user_id)
                    )
                `)
                .eq("tenant_id", tenantId)
                .order("scheduled_at", { ascending: true });

            if (filterMatchId) {
                query = query.eq("match_id", filterMatchId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setInterviews(data || []);

            // Auto-select if a matchId is provided and an interview exists
            if (filterMatchId && data && data.length > 0) {
                setSelectedInterview(data[0]);
            }

        } catch (error: any) {
            console.error("Error fetching interviews:", JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInterview = async () => {
        if (!filterMatchId) return;

        try {
            const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;
            const roomId = `talenthub-${filterMatchId}-${Math.random().toString(36).substring(7)}`;

            const { data, error } = await supabase
                .from("interviews")
                .insert({
                    tenant_id: tenantId,
                    match_id: filterMatchId,
                    scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
                    jitsi_room_id: roomId,
                    status: 'scheduled'
                })
                .select()
                .single();

            if (error) throw error;

            setInterviews(prev => [data, ...prev]);
            setSelectedInterview(data);
        } catch (error) {
            console.error("Error creating interview:", error);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <Link href="/organization/dashboard" className="text-zinc-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 mb-4">
                            ← Back to Command Center
                        </Link>
                        <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Interview Command
                        </h1>
                    </div>
                    {filterMatchId && (
                        <button
                            onClick={handleCreateInterview}
                            className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            📅 Schedule Instant Interview
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-16rem)]">
                    {/* List */}
                    <div className="lg:col-span-1 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5">
                            <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-500">Upcoming Sessions</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                            {interviews.length === 0 ? (
                                <div className="p-8 text-center text-zinc-600 text-sm italic">
                                    No interviews scheduled
                                </div>
                            ) : (
                                interviews.map((int) => (
                                    <button
                                        key={int.id}
                                        onClick={() => setSelectedInterview(int)}
                                        className={`w-full p-6 text-left hover:bg-white/5 transition-all ${selectedInterview?.id === int.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
                                            }`}
                                    >
                                        <p className="font-bold text-white mb-1">{int.matches?.requirements?.title || "Video Interview"}</p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <span>📅 {new Date(int.scheduled_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>🕒 {new Date(int.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="mt-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${int.status === 'scheduled' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                {int.status}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Room */}
                    <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
                        {selectedInterview ? (
                            <div className="flex-1 flex flex-col">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedInterview.matches?.requirements?.title}</h3>
                                        <p className="text-xs text-zinc-500">Secure Session ID: {selectedInterview.jitsi_room_id}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-4 py-2 bg-zinc-800 text-white rounded-xl font-bold text-xs hover:bg-zinc-700 transition-all"
                                        >
                                            🔄 Reconnect
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 p-6">
                                    <JitsiMeeting
                                        roomId={selectedInterview.jitsi_room_id}
                                        userName={user?.user_metadata?.full_name || "Recruiter"}
                                        height="100%"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-5xl mb-6">📹</div>
                                <h3 className="text-2xl font-black tracking-tight mb-2">Video Command</h3>
                                <p className="text-zinc-500 max-w-xs text-sm font-medium">Select an interview to enter the secure video room or schedule a new one from a match.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
