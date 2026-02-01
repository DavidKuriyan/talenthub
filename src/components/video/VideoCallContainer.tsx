"use client";

import { useEffect, useRef, useState } from "react";
import { generateInterviewRoomId } from "@/lib/jitsi";

interface VideoCallContainerProps {
  roomName: string;  // matchId
  userName: string;
  tenantId: string;  // Required for secure room naming
  onReadyToClose?: () => void;
  height?: string;
}

/**
 * @feature VIDEO_CONFERENCING
 * @aiNote Uses JitsiMeetExternalAPI for reliable Jitsi integration.
 * Handles SSR properly, includes comprehensive error handling and recovery.
 */
export default function VideoCallContainer({
  roomName,
  userName,
  tenantId,
  onReadyToClose,
  height = "100%",
}: VideoCallContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasWebRTC, setHasWebRTC] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fix SSR hydration: return null during SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !callActive) return;

    const checkWebRTCSupport = (): boolean => {
      const hasWebRTC = !!(
        window.RTCPeerConnection ||
        (window as any).webkitRTCPeerConnection ||
        (window as any).mozRTCPeerConnection ||
        (navigator as any).mediaDevices?.getUserMedia
      );

      if (!hasWebRTC) return false;

      // Check for HTTPS
      if (
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost"
      ) {
        console.warn("WebRTC requires HTTPS");
        return false;
      }

      return true;
    };

    if (!checkWebRTCSupport()) {
      setHasWebRTC(false);
      return;
    }

    setHasWebRTC(true);

    const loadJitsi = () => {
      if ((window as any).JitsiMeetExternalAPI) {
        initJitsi();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => {
        setError(
          "Failed to load video conferencing service. Please try again.",
        );
      };
      document.body.appendChild(script);
    };

    const initJitsi = () => {
      try {
        if (!containerRef.current) return;

        const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;

        // Generate secure, tenant-isolated room name
        const secureRoomName = generateInterviewRoomId(roomName, tenantId);

        const options = {
          roomName: secureRoomName,
          width: "100%",
          height: height === "100%" ? "100%" : `${height}px`,
          parentNode: containerRef.current,
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableInviteFunctions: false,
          },
          interfaceConfigOverwrite: {
            SHOW_CHROME_EXTENSION_BANNER: false,
            MOBILE_APP_PROMO: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            HIDE_KICK_BUTTON_FOR_GUESTS: true,
          },
          userInfo: {
            displayName: userName,
            email: `${userName.toLowerCase().replace(/\s/g, ".")}@talenthub.ai`,
          },
        };

        jitsiApiRef.current = new JitsiMeetExternalAPI("meet.jit.si", options);

        // Handle call ready
        jitsiApiRef.current.on("readyToClose", () => {
          setCallActive(false);
          onReadyToClose?.();
        });

        // Handle errors
        jitsiApiRef.current.on("error", (err: Error) => {
          console.error("Jitsi error:", err);
          setError("Video call error occurred. Please try again.");
        });

        // Add timeout
        const timeoutId = setTimeout(() => {
          if (
            jitsiApiRef.current &&
            !jitsiApiRef.current.isVideoConferencingActive?.()
          ) {
            setError("Video call initialization timeout. Please try again.");
          }
        }, 8000);

        return () => clearTimeout(timeoutId);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize video call",
        );
      }
    };

    loadJitsi();

    return () => {
      if (jitsiApiRef.current) {
        try {
          jitsiApiRef.current.dispose();
        } catch (err) {
          console.error("Error disposing Jitsi:", err);
        }
      }
    };
  }, [isMounted, callActive, roomName, userName, height, onReadyToClose]);

  // Return null during SSR to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // WebRTC not available fallback
  if (callActive && !hasWebRTC) {
    return (
      <div
        style={{ height, width: "100%" }}
        className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl flex items-center justify-center p-8"
      >
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📹</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Video Not Available
          </h3>
          <p className="text-zinc-400 text-sm mb-6">
            Your browser doesn't support WebRTC. Please try:
          </p>
          <ul className="text-left text-zinc-300 text-sm space-y-2 mb-6">
            <li>• Using Chrome, Firefox, or Edge</li>
            <li>• Ensuring HTTPS connection</li>
            <li>• Disabling VPN or proxy</li>
          </ul>
          <a
            href={`https://meet.jit.si/${roomName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Open in Browser →
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{ height, width: "100%" }}
        className="bg-zinc-900 rounded-2xl flex items-center justify-center p-8"
      >
        <div className="text-center text-red-400">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setCallActive(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Show join button before starting call
  if (!callActive) {
    return (
      <div
        style={{ height, width: "100%" }}
        className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl flex items-center justify-center p-8 border border-indigo-500/20"
      >
        <div className="text-center">
          <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">📹</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Ready to Join?</h3>
          <p className="text-indigo-200 text-sm mb-6">
            Room:{" "}
            <span className="font-mono bg-black/30 px-2 py-1 rounded">
              {roomName.slice(0, 20)}...
            </span>
          </p>
          <button
            onClick={() => {
              setCallActive(true);
              setError(null);
            }}
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

  // Render embedded Jitsi
  return (
    <div
      ref={containerRef}
      style={{
        height,
        width: "100%",
        borderRadius: "1.5rem",
        overflow: "hidden",
      }}
    />
  );
}
