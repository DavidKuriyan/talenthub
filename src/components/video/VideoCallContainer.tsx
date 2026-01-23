"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import JitsiMeeting with SSR disabled
const JitsiMeeting = dynamic(
    () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
    { ssr: false }
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
 * Uses dynamic import to prevent "WebRTC not available" SSR errors.
 */
export default function VideoCallContainer({
    roomName,
    userName,
    onReadyToClose,
    height = "100%"
}: VideoCallContainerProps) {
    const [loading, setLoading] = useState(true);

    if (typeof window === "undefined") return null; // Double check for SSR

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
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                        'security'
                    ]
                }}
                userInfo={{
                    displayName: userName,
                    email: `${userName.toLowerCase().replace(/\s/g, '.')}@talenthub.ai`
                }}
                onApiReady={(externalApi) => {
                    setLoading(false);
                    externalApi.on('readyToClose', () => {
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
