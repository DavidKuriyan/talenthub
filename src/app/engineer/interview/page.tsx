"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function EngineerInterviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomName = searchParams.get("room");

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [engineerName, setEngineerName] = useState<string>("Engineer");
    const [inCall, setInCall] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/engineer/login");
                return;
            }
            setUser(session.user);

            // Get engineer name from profile or email
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", session.user.id)
                .single() as any;

            const name = profile?.full_name || session.user.email?.split("@")[0] || "Engineer";
            setEngineerName(name);

            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const joinCall = () => {
        if (!roomName) return;
        // Open Jitsi in a new tab with full permissions
        const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=${encodeURIComponent(engineerName)}`;
        window.open(jitsiUrl, '_blank');
        setInCall(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-emerald-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-emerald-300 font-medium">Loading interview room...</p>
                </div>
            </div>
        );
    }

    // No room specified
    if (!roomName) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-emerald-950 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Room Link</h2>
                    <p className="text-slate-400 mb-6">You need an interview room link from the recruiter to join the call.</p>
                    <Link href="/engineer/profile" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors inline-block">
                        Back to Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-emerald-950">
            {/* Header */}
            <header className="border-b border-emerald-800/30 bg-slate-900/50 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/engineer/profile" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Interview Room</h1>
                            <p className="text-sm text-emerald-300">{engineerName}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-8 text-center">
                    <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Ready to Join Interview</h2>
                    <p className="text-slate-400 mb-2">Room: <code className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">{roomName}</code></p>
                    <p className="text-slate-500 text-sm mb-8">Hello {engineerName}! Click below to join the video call.</p>

                    <button
                        onClick={joinCall}
                        className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {inCall ? 'Rejoin Video Call' : 'Join Video Call'}
                    </button>

                    {inCall && (
                        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                            <p className="text-emerald-300 font-medium">
                                ✅ Video call opened in new tab. Allow camera/microphone when prompted.
                            </p>
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="mt-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-3">💡 Interview Tips</h3>
                    <ul className="text-xs text-slate-400 space-y-2">
                        <li>• Allow camera and microphone access when prompted</li>
                        <li>• Find a quiet, well-lit location</li>
                        <li>• Test your audio before the interviewer joins</li>
                        <li>• Keep this page open for reference</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

export default function EngineerInterviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        }>
            <EngineerInterviewContent />
        </Suspense>
    );
}
