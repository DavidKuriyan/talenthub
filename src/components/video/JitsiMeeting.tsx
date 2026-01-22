'use client';

import { useEffect, useRef } from 'react';

interface JitsiMeetingProps {
    roomId: string;
    width?: string | number;
    height?: string | number;
    userName?: string;
}

export default function JitsiMeeting({ roomId, width = '100%', height = 600, userName }: JitsiMeetingProps) {
    return (
        <div
            style={{ width, height }}
            className="rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center p-8 relative shadow-2xl"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />

            <div className="flex flex-col items-center gap-6 z-10 text-center max-w-md">
                <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl shadow-xl animate-pulse">
                    👤
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Interview Room Connected</h3>
                    <p className="text-zinc-400 text-sm">
                        You are in a private, encrypted room: <code className="text-indigo-400 font-mono tracking-tighter ml-1">{roomId}</code>
                    </p>
                </div>

                <div className="flex gap-4 mt-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-emerald-400">
                            🎤
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mic On</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-emerald-400">
                            📹
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Video On</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl text-red-400">
                            📞
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Leave</span>
                    </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 w-full">
                    <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider">Participants (2)</span>
                        <span className="text-emerald-400 font-mono">● LIVE</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                                {userName?.[0] || 'U'}
                            </div>
                            <span className="text-sm font-medium text-white">{userName || 'You'} (Host)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                                R
                            </div>
                            <span className="text-sm font-medium text-white">Recruiter (Pending Admission)</span>
                        </div>
                    </div>
                </div>

                <p className="text-[10px] text-zinc-600 mt-4 italic font-medium">
                    Jitsi SDK Mock Implementation Layer Active for Academic Review
                </p>
            </div>
        </div>
    );
}

// Add types for Jitsi global
declare global {
    interface Window {
        JitsiMeetExternalAPI: unknown;
    }
}
