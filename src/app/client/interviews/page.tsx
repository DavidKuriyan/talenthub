"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/**
 * @feature CLIENT_INTERVIEWS
 * @aiNote Schedule and manage interviews with matched engineers.
 * Includes Jitsi video call integration.
 */
export default function ClientInterviewsPage() {
    const [interviews, setInterviews] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<string>("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [notes, setNotes] = useState("");
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch interviews
            const { data: interviewData } = await supabase
                .from("interviews")
                .select(`
                    id,
                    scheduled_at,
                    jitsi_room_id,
                    status,
                    notes,
                    matches (
                        id,
                        profiles (
                            skills,
                            experience_years
                        ),
                        requirements (
                            title
                        )
                    )
                `)
                .order("scheduled_at", { ascending: true });

            if (interviewData) {
                setInterviews(interviewData);
            }

            // Fetch pending matches for scheduling
            const { data: matchData } = await supabase
                .from("matches")
                .select(`
                    id,
                    score,
                    status,
                    requirements!inner (
                        title,
                        client_id
                    ),
                    profiles (
                        skills,
                        experience_years
                    )
                `)
                .eq("requirements.client_id", session.user.id)
                .eq("status", "pending");

            if (matchData) {
                setMatches(matchData);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const generateJitsiRoomId = () => {
        return `talenthub-interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    const scheduleInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatch || !scheduledAt) return;

        setScheduling(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Not authenticated");

            const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
            const jitsiRoomId = generateJitsiRoomId();

            const { error } = await (supabase
                .from("interviews") as any)
                .insert({
                    tenant_id: tenantId,
                    match_id: selectedMatch,
                    scheduled_at: scheduledAt,
                    jitsi_room_id: jitsiRoomId,
                    notes: notes,
                    status: "scheduled"
                });

            if (error) throw error;

            // Update match status
            await (supabase
                .from("matches") as any)
                .update({ status: "interview_scheduled" })
                .eq("id", selectedMatch);

            setShowScheduleModal(false);
            setSelectedMatch("");
            setScheduledAt("");
            setNotes("");
            fetchData();
        } catch (err: any) {
            console.error("Error scheduling interview:", err);
            alert(err.message);
        } finally {
            setScheduling(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    const upcomingInterviews = interviews.filter(i => i.status === 'scheduled' && new Date(i.scheduled_at) >= new Date());
    const pastInterviews = interviews.filter(i => i.status !== 'scheduled' || new Date(i.scheduled_at) < new Date());

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Interviews</h1>
                        <p className="text-zinc-500 mt-1">Schedule and manage candidate interviews</p>
                    </div>
                    <div className="flex gap-3">
                        {matches.length > 0 && (
                            <button
                                onClick={() => setShowScheduleModal(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                            >
                                + Schedule Interview
                            </button>
                        )}
                        <Link
                            href="/client/dashboard"
                            className="border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Upcoming Interviews */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Upcoming Interviews</h2>
                    {upcomingInterviews.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingInterviews.map((interview) => (
                                <div key={interview.id} className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/30 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                                {interview.matches?.requirements?.title || "Interview"}
                                            </h3>
                                            <p className="text-zinc-500 text-sm mt-1">
                                                📅 {new Date(interview.scheduled_at).toLocaleString()}
                                            </p>
                                            {interview.notes && (
                                                <p className="text-zinc-400 text-sm mt-2">💬 {interview.notes}</p>
                                            )}
                                        </div>
                                        <a
                                            href={`https://meet.jit.si/${interview.jitsi_room_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                        >
                                            🎥 Start Video Call
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                            <p className="text-zinc-500">No upcoming interviews</p>
                            {matches.length > 0 && (
                                <button
                                    onClick={() => setShowScheduleModal(true)}
                                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Schedule an interview →
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Past Interviews */}
                {pastInterviews.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Interview History</h2>
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {pastInterviews.map((interview) => (
                                    <div key={interview.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-50">
                                                {interview.matches?.requirements?.title || "Interview"}
                                            </p>
                                            <p className="text-zinc-400 text-sm">{new Date(interview.scheduled_at).toLocaleString()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${interview.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            interview.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}>
                                            {interview.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule Modal */}
                {showScheduleModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Schedule Interview</h2>
                            <form onSubmit={scheduleInterview} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Select Candidate</label>
                                    <select
                                        value={selectedMatch}
                                        onChange={(e) => setSelectedMatch(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        required
                                    >
                                        <option value="">Select a matched candidate...</option>
                                        {matches.map((match) => (
                                            <option key={match.id} value={match.id}>
                                                {match.requirements.title} - {match.score}% match
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Notes (optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                                        rows={3}
                                        placeholder="Interview agenda, topics to cover..."
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowScheduleModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={scheduling}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {scheduling ? "Scheduling..." : "Schedule"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
