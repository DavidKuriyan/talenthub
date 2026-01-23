'use client';

import { useEffect, useRef, useState } from 'react';

interface JitsiMeetingProps {
    roomId: string;
    width?: string | number;
    height?: string | number;
    userName?: string;
}

export default function JitsiMeeting({ roomId, width = '100%', height = 600, userName }: JitsiMeetingProps) {
    const [copied, setCopied] = useState(false);
    const jitsiUrl = `https://meet.jit.si/${roomId}`;

    const copyLink = () => {
        navigator.clipboard.writeText(jitsiUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openInBrowser = () => {
        window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
    };

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
                    <h3 className="text-2xl font-bold text-white tracking-tight">Interview Room Ready</h3>
                    <p className="text-zinc-400 text-sm">
                        Room: <code className="text-indigo-400 font-mono tracking-tighter ml-1">{roomId}</code>
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={openInBrowser}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        🎥 Join Meeting
                    </button>
                    <button
                        onClick={copyLink}
                        className="px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                        {copied ? '✓ Copied!' : '📋 Copy Link'}
                    </button>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 w-full">
                    <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-zinc-400 font-bold uppercase tracking-wider">Meeting Link</span>
                        <span className="text-emerald-400 font-mono">● READY</span>
                    </div>
                    <p className="text-xs text-indigo-400 font-mono break-all bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        {jitsiUrl}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        Share this link with the engineer to join the same meeting
                    </p>
                </div>

                <p className="text-[10px] text-zinc-600 mt-4 italic font-medium">
                    Powered by Jitsi Meet - Free &amp; Secure Video Conferencing
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
