"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import JitsiMeeting with SSR disabled
const JitsiMeeting = dynamic(
    () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-2xl">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400 text-sm">Loading video call...</p>
                </div>
            </div>
        )
    }
);

interface VideoCallContainerProps {
    roomName: string;
    userName: string;
    onReadyToClose?: () => void;
    height?: string;
}

/**
 * @feature VIDEO_CONFERENCING
 * @aiNote Specialized Jitsi wrapper with auto-configuration for TalentHub.
 * Uses dynamic import + useEffect to prevent hydration mismatch and SSR errors.
 */
export default function VideoCallContainer({
    roomName,
    userName,
    onReadyToClose,
    height = "100%"
}: VideoCallContainerProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [hasWebRTC, setHasWebRTC] = useState(true);
    const [callActive, setCallActive] = useState(false);

    // Only render on client after mount to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
        // Check WebRTC availability
        const webRTCAvailable = !!(
            window.RTCPeerConnection ||
            (window as any).webkitRTCPeerConnection ||
            (window as any).mozRTCPeerConnection
        );
        setHasWebRTC(webRTCAvailable);
    }, []);

    // Don't render anything during SSR or before mount
    if (!isMounted) {
        return (
            <div style={{ height, width: '100%' }} className="bg-zinc-900 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400 text-sm">Initializing video...</p>
                </div>
            </div>
        );
    }

    // WebRTC not available fallback
    if (!hasWebRTC) {
        return (
            <div style={{ height, width: '100%' }} className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">📹</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Video Call Not Available</h3>
                    <p className="text-zinc-400 text-sm mb-6">
                        Your browser doesn't support WebRTC video calls. Please try:
                    </p>
                    <ul className="text-left text-zinc-300 text-sm space-y-2 mb-6">
                        <li>• Using Chrome, Firefox, or Edge browser</li>
                        <li>• Enabling WebRTC in browser settings</li>
                        <li>• Disabling VPN or firewall blocking WebRTC</li>
                    </ul>
                    <a
                        href={`https://meet.jit.si/${roomName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                        Open in External Tab →
                    </a>
                </div>
            </div>
        );
    }

    // Show join button before starting call
    if (!callActive) {
        return (
            <div style={{ height, width: '100%' }} className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl flex items-center justify-center p-8 border border-indigo-500/20">
                <div className="text-center">
                    <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">📹</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Ready to Join?</h3>
                    <p className="text-indigo-200 text-sm mb-6">
                        Room: <span className="font-mono bg-black/30 px-2 py-1 rounded">{roomName.slice(0, 20)}...</span>
                    </p>
                    <button
                        onClick={() => setCallActive(true)}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-indigo-500/30"
                    >
                        🎥 Join Video Call
                    </button>
                    <p className="text-zinc-500 text-xs mt-4">
                        Camera and microphone access will be requested
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height, width: '100%', borderRadius: '1.5rem', overflow: 'hidden' }}>
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={roomName}
                configOverwrite={{
                    startWithAudioMuted: true,
                    startWithVideoMuted: false,
                    disableModeratorIndicator: true,
                    startScreenSharing: false,
                    enableEmailInStats: false,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_JITSI_WATERMARK: false,
                    HIDE_KICK_BUTTON_FOR_GUESTS: true,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'settings', 'raisehand', 'videoquality', 'filmstrip',
                        'tileview', 'download', 'help', 'mute-everyone'
                    ]
                }}
                userInfo={{
                    displayName: userName,
                    email: `${userName.toLowerCase().replace(/\s/g, '.')}@talenthub.ai`
                }}
                onApiReady={(externalApi) => {
                    externalApi.on('readyToClose', () => {
                        setCallActive(false);
                        if (onReadyToClose) onReadyToClose();
                    });
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                }}
            />
        </div>
    );
}
