"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadJitsiScript } from "@/lib/jitsi/jitsiLoader";
import { BASE_JITSI_CONFIG } from "@/lib/jitsi/jitsiRoles";

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

export interface JitsiRoomProps {
    roomName: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    roleConfig: {
        TOOLBAR_BUTTONS: string[];
        SETTINGS_SECTIONS?: string[];
        DISABLE_JOIN_LEAVE_NOTIFICATIONS?: boolean;
        MOBILE_APP_PROMO?: boolean;
        SHOW_CHROME_EXTENSION_BANNER?: boolean;
    };
    subject?: string;
    onParticipantJoined?: (participant: any) => void;
    onParticipantLeft?: (participant: any) => void;
    onMeetingEnd?: () => void;
    onError?: (error: any) => void;
}

/**
 * @feature JITSI_ROOM
 * @aiNote Core Jitsi Meet component with role-based configuration
 */
export default function JitsiRoom({
    roomName,
    displayName,
    email,
    avatarUrl,
    roleConfig,
    subject = "TalentHub Interview",
    onParticipantJoined,
    onParticipantLeft,
    onMeetingEnd,
    onError,
}: JitsiRoomProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [participantCount, setParticipantCount] = useState(1);
    const [isAudioMuted, setIsAudioMuted] = useState(true);
    const [isVideoMuted, setIsVideoMuted] = useState(false);

    const initJitsi = useCallback(async () => {
        if (!containerRef.current) return;

        try {
            await loadJitsiScript();

            if (!window.JitsiMeetExternalAPI) {
                throw new Error("Jitsi API not available");
            }

            // Clean up previous instance
            if (apiRef.current) {
                apiRef.current.dispose();
            }

            const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
                roomName,
                parentNode: containerRef.current,
                width: "100%",
                height: "100%",
                userInfo: {
                    displayName,
                    email: email || "",
                    avatarURL: avatarUrl || "",
                },
                configOverwrite: {
                    ...BASE_JITSI_CONFIG,
                    subject,
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: roleConfig.TOOLBAR_BUTTONS,
                    SETTINGS_SECTIONS: roleConfig.SETTINGS_SECTIONS || ["devices", "language"],
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: roleConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS || false,
                    MOBILE_APP_PROMO: roleConfig.MOBILE_APP_PROMO || false,
                    SHOW_CHROME_EXTENSION_BANNER: roleConfig.SHOW_CHROME_EXTENSION_BANNER || false,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    BRAND_WATERMARK_LINK: "",
                    DEFAULT_BACKGROUND: "#0f172a",
                    DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
                    JITSI_WATERMARK_LINK: "",
                    HIDE_INVITE_MORE_HEADER: true,
                    DISABLE_TRANSCRIPTION_SUBTITLES: true,
                    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                    FILM_STRIP_MAX_HEIGHT: 120,
                    VERTICAL_FILMSTRIP: true,
                    CLOSE_PAGE_GUEST_HINT: false,
                    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
                    DISPLAY_WELCOME_PAGE_CONTENT: false,
                    APP_NAME: "TalentHub Interview",
                    NATIVE_APP_NAME: "TalentHub",
                    PROVIDER_NAME: "TalentHub",
                    LANG_DETECTION: true,
                    INVITATION_POWERED_BY: false,
                },
            });

            apiRef.current = api;

            // CRITICAL: Set iframe permissions for camera/microphone
            // The Jitsi API creates an iframe, we need to ensure it has proper permissions
            setTimeout(() => {
                const iframe = containerRef.current?.querySelector('iframe');
                if (iframe) {
                    iframe.setAttribute('allow', 'camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock');
                    iframe.setAttribute('allowfullscreen', 'true');
                    console.log('[Jitsi] Iframe permissions set successfully');
                }
            }, 500);

            // Event listeners
            api.addEventListener("participantJoined", (participant: any) => {
                console.log("[Jitsi] Participant joined:", participant);
                setParticipantCount(prev => prev + 1);
                onParticipantJoined?.(participant);
            });

            api.addEventListener("participantLeft", (participant: any) => {
                console.log("[Jitsi] Participant left:", participant);
                setParticipantCount(prev => Math.max(1, prev - 1));
                onParticipantLeft?.(participant);
            });

            api.addEventListener("audioMuteStatusChanged", (status: any) => {
                setIsAudioMuted(status.muted);
            });

            api.addEventListener("videoMuteStatusChanged", (status: any) => {
                setIsVideoMuted(status.muted);
            });

            api.addEventListener("readyToClose", () => {
                console.log("[Jitsi] Meeting ended");
                onMeetingEnd?.();
            });

            api.addEventListener("videoConferenceJoined", () => {
                console.log("[Jitsi] Successfully joined conference");
                setLoading(false);
            });

            api.addEventListener("errorOccurred", (errorEvent: any) => {
                // Only log meaningful errors, ignore empty/undefined error objects
                const errorMessage = errorEvent?.error?.message || errorEvent?.message;
                if (errorMessage) {
                    console.error("[Jitsi] Error:", errorMessage);
                    setError(errorMessage);
                    onError?.(errorEvent);
                }
                // Ignore empty error events (common with Jitsi, not always critical)
            });

            // Set initial state after a short delay
            setTimeout(() => setLoading(false), 2000);

        } catch (err: any) {
            const errorMsg = err?.message || "Failed to initialize video call";
            console.error("[Jitsi] Init error:", errorMsg);
            setError(errorMsg);
            setLoading(false);
            if (err?.message) onError?.(err);
        }
    }, [roomName, displayName, email, avatarUrl, roleConfig, subject, onParticipantJoined, onParticipantLeft, onMeetingEnd, onError]);

    useEffect(() => {
        initJitsi();

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
        };
    }, [initJitsi]);

    // Control functions
    const toggleAudio = () => apiRef.current?.executeCommand("toggleAudio");
    const toggleVideo = () => apiRef.current?.executeCommand("toggleVideo");
    const hangUp = () => apiRef.current?.executeCommand("hangup");

    if (error) {
        return (
            <div className="w-full h-[80vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <button
                        onClick={initJitsi}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[80vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 bg-indigo-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Connecting to Interview Room</h3>
                        <p className="text-slate-400 text-sm">Setting up video and audio...</p>
                    </div>
                </div>
            )}

            {/* Jitsi Container */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Status Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="text-white text-xs font-medium">
                            {loading ? 'Connecting...' : 'Live'}
                        </span>
                    </div>
                    <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-2">
                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-white text-xs font-medium">{participantCount}</span>
                    </div>
                </div>
                <div className="px-4 py-1.5 bg-indigo-600/80 backdrop-blur-md rounded-full">
                    <span className="text-white text-xs font-bold tracking-wider">TalentHub Interview</span>
                </div>
            </div>

            {/* Quick Controls (Optional overlay) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto z-20 opacity-0 hover:opacity-100 transition-opacity">
                <button
                    onClick={toggleAudio}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700/80 hover:bg-slate-600/80'}`}
                >
                    {isAudioMuted ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700/80 hover:bg-slate-600/80'}`}
                >
                    {isVideoMuted ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={hangUp}
                    className="w-14 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
