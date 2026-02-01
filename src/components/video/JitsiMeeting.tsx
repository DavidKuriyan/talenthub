"use client";

import { useEffect, useRef, useState } from "react";

interface JitsiMeetingProps {
  roomId: string;
  width?: string | number;
  height?: string | number;
  userName?: string;
  displayName?: string;
  email?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeeting({
  roomId,
  width = "100%",
  height = 600,
  userName = "Guest",
  displayName,
  email,
  onReady,
  onError,
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current || !roomId) {
      return;
    }

    const initJitsi = async () => {
      try {
        // Check if Jitsi API is already loaded
        if (!window.JitsiMeetExternalAPI) {
          // Load Jitsi Meet external API
          const script = document.createElement("script");
          script.src = "https://meet.jit.si/external_api.js";
          script.async = true;

          script.onload = () => {
            createJitsiMeeting();
          };

          script.onerror = () => {
            const error = new Error("Failed to load Jitsi Meet API");
            setError("Failed to load Jitsi Meet. Please try again.");
            onError?.(error);
          };

          document.body.appendChild(script);
        } else {
          createJitsiMeeting();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError("Failed to initialize video call");
        onError?.(error);
      }
    };

    const createJitsiMeeting = () => {
      if (!window.JitsiMeetExternalAPI || !containerRef.current) {
        return;
      }

      try {
        const options = {
          roomName: roomId,
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          parentNode: containerRef.current,
          configOverwrite: {
            startWithVideoMuted: false,
            startAudioMuted: false,
            prejoinPageEnabled: false,
            enableClosePage: true,
            disableInviteFunctions: false,
            toolbarButtons: [
              "microphone",
              "camera",
              "closedcaptions",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "hangup",
              "profile",
              "chat",
              "recording",
              "livestreaming",
              "etherpad",
              "sharedvideo",
              "settings",
              "raisehand",
              "videoquality",
              "filmstrip",
              "feedback",
              "stats",
              "shortcuts",
              "tileview",
              "toggle-camera",
              "videoquality",
            ],
          },
          interfaceConfigOverwrite: {
            DEFAULT_BACKGROUND: "#1f2937",
            HIDE_INVITE_MORE_HEADER: true,
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: true,
            JITSI_WATERMARK_LINK: "https://jitsi.org",
          },
          userInfo: {
            displayName: displayName || userName,
            email: email,
          },
        };

        // Initialize Jitsi Meet API
        apiRef.current = new window.JitsiMeetExternalAPI(
          "meet.jit.si",
          options,
        );

        // Event listeners
        apiRef.current.addEventListener("videoConferenceJoined", () => {
          setIsReady(true);
          onReady?.();
        });

        apiRef.current.addEventListener(
          "videoConferenceFailed",
          (error: any) => {
            setError(`Conference failed: ${error?.message || "Unknown error"}`);
            onError?.(new Error(`Conference failed: ${error?.message}`));
          },
        );

        apiRef.current.addEventListener("readyToClose", () => {
          if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
            setIsReady(false);
          }
        });

        apiRef.current.addEventListener("errorOccurred", (error: any) => {
          console.error("Jitsi error:", error);
          setError(`Error: ${error?.message || "Unknown error occurred"}`);
        });
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to create Jitsi meeting");
        setError("Failed to create meeting room");
        onError?.(error);
      }
    };

    initJitsi();

    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.error("Error disposing Jitsi API:", e);
        }
        apiRef.current = null;
      }
    };
  }, [
    isClient,
    roomId,
    width,
    height,
    userName,
    displayName,
    email,
    onReady,
    onError,
  ]);

  if (!isClient) {
    return null;
  }

  if (error) {
    return (
      <div
        style={{
          width,
          height: typeof height === "number" ? `${height}px` : height,
        }}
        className="rounded-lg overflow-hidden border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 flex flex-col items-center justify-center p-8"
      >
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            Failed to Load Video Call
          </h3>
          <p className="text-red-700 dark:text-red-200 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-900"
    />
  );
}
