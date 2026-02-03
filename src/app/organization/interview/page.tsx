"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function OrganizationInterviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const interviewId = searchParams.get("id");
    const matchId = searchParams.get("match_id");

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [candidateName, setCandidateName] = useState<string>("Candidate");
    const [organizationName, setOrganizationName] = useState<string>("Organization");
    const [roomName, setRoomName] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [inCall, setInCall] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/organization/login");
                return;
            }
            setUser(session.user);

            // Generate unique room name
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 8);
            const generatedRoom = `TalentHubInterview${timestamp}${random}`;
            setRoomName(generatedRoom);

            // Get organization info
            const tenantId = session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
            if (tenantId) {
                const { data: tenant } = await supabase
                    .from("tenants")
                    .select("name")
                    .eq("id", tenantId)
                    .single() as any;
                if (tenant) setOrganizationName(tenant.name);
            }

            // If match ID provided, get candidate name
            if (matchId) {
                const { data: matchData } = await supabase
                    .from("matches")
                    .select("profiles (full_name)")
                    .eq("id", matchId)
                    .single() as any;
                if (matchData?.profiles?.full_name) {
                    setCandidateName(matchData.profiles.full_name);
                }
            }

            setLoading(false);
        };

        checkAuth();
    }, [router, matchId, interviewId]);

    const copyRoomLink = () => {
        const engineerLink = `${window.location.origin}/engineer/interview?room=${roomName}`;
        navigator.clipboard.writeText(engineerLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const startCall = () => {
        // Open Jitsi in a new tab with full permissions
        const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=${encodeURIComponent(organizationName)}`;
        window.open(jitsiUrl, '_blank');
        setInCall(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-indigo-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-indigo-300 font-medium">Setting up interview room...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-indigo-950">
            {/* Header */}
            <header className="border-b border-indigo-800/30 bg-slate-900/50 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/organization/dashboard" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Video Interview</h1>
                            <p className="text-sm text-indigo-300">{organizationName}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto p-6">
                <div className="bg-slate-900/50 border border-indigo-500/20 rounded-3xl p-8 mb-6">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Interview Room Ready</h2>
                        <p className="text-slate-400">Room: <code className="text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{roomName}</code></p>
                    </div>

                    {/* Instructions */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-800/50 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                Share Room Link
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">Copy the link below and send it to {candidateName}</p>
                            <button
                                onClick={copyRoomLink}
                                className={`w-full px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${copied
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Link Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy Room Link for {candidateName}
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                Start Video Call
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">Opens in a new tab with full camera/mic access</p>
                            <button
                                onClick={startCall}
                                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {inCall ? 'Rejoin Video Call' : 'Start Video Call'}
                            </button>
                        </div>
                    </div>

                    {inCall && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
                            <p className="text-emerald-300 font-medium">
                                ✅ Video call opened in new tab. Keep this page open for the room link.
                            </p>
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white mb-3">💡 Tips</h3>
                    <ul className="text-xs text-slate-400 space-y-2">
                        <li>• The video call opens in a new tab with full permissions</li>
                        <li>• Allow camera and microphone when prompted</li>
                        <li>• Share the room link with the candidate via email or messages</li>
                        <li>• Both parties will join the same room automatically</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

export default function OrganizationInterviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        }>
            <OrganizationInterviewContent />
        </Suspense>
    );
}
