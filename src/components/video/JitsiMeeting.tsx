'use client';

import { useEffect, useRef } from 'react';

interface JitsiMeetingProps {
    roomId: string;
    width?: string | number;
    height?: string | number;
    userName?: string;
}

export default function JitsiMeeting({ roomId, width = '100%', height = 600, userName }: JitsiMeetingProps) {
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const jitsiApiRef = useRef<any>(null);

    useEffect(() => {
        // Load Jitsi script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = initJitsi;
        document.body.appendChild(script);

        return () => {
            if (jitsiApiRef.current) {
                jitsiApiRef.current.dispose();
            }
            document.body.removeChild(script);
        };
    }, [roomId]);

    const initJitsi = () => {
        if (!window.JitsiMeetExternalAPI) return;

        const domain = 'meet.jit.si';
        const options = {
            roomName: roomId,
            width: width,
            height: height,
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: userName || 'User',
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
            },
        };

        // @ts-ignore
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    };

    return <div ref={jitsiContainerRef} className="rounded-lg overflow-hidden border shadow-sm" />;
}

// Add types for Jitsi global
declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}
