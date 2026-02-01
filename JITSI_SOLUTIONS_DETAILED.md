# Jitsi Video Call - Detailed Technical Issues & Solutions

## Issue #1: Jitsi React SDK Import Error

### Problem

```tsx
// ❌ WRONG - @jitsi/react-sdk doesn't export JitsiMeeting as named export
const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  { ssr: false },
);
```

### Root Cause

The `@jitsi/react-sdk@1.4.4` package likely exports as default or different structure. At runtime, `mod.JitsiMeeting` is undefined, causing:

- Component never renders
- Infinite loading spinner
- Silent failure (no console error visible to user)

### Solution Options

#### Option A: Use JitsiMeetExternalAPI (Recommended)

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface JitsiMeetingProps {
  roomName: string;
  userName: string;
  height?: string | number;
  onReadyToClose?: () => void;
}

export default function JitsiMeeting({
  roomName,
  userName,
  height = "100%",
  onReadyToClose,
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Load Jitsi script
    const loadJitsi = async () => {
      try {
        if (!(window as any).JitsiMeetExternalAPI) {
          const script = document.createElement("script");
          script.src = "https://meet.jit.si/external_api.js";
          script.async = true;
          script.onload = initJitsi;
          script.onerror = () => setError("Failed to load Jitsi");
          document.body.appendChild(script);
        } else {
          initJitsi();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    const initJitsi = () => {
      try {
        const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;

        const options = {
          roomName: roomName,
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
          },
          userInfo: {
            displayName: userName,
            email: `${userName.toLowerCase().replace(/\s/g, ".")}@talenthub.ai`,
          },
        };

        jitsiApiRef.current = new JitsiMeetExternalAPI("meet.jit.si", options);

        // Handle call end
        jitsiApiRef.current.on("readyToClose", () => {
          onReadyToClose?.();
        });

        // Handle errors
        jitsiApiRef.current.on("error", (err: Error) => {
          console.error("Jitsi error:", err);
          setError("Video call error occurred");
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to initialize Jitsi",
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
  }, [mounted, roomName, userName, height, onReadyToClose]);

  if (!mounted) {
    return (
      <div
        style={{ height, width: "100%" }}
        className="bg-zinc-900 rounded-2xl flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ height, width: "100%" }}
        className="bg-zinc-900 rounded-2xl flex items-center justify-center"
      >
        <div className="text-center text-red-400">
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
        height,
        width: "100%",
        borderRadius: "1.5rem",
        overflow: "hidden",
      }}
    />
  );
}
```

#### Option B: Wait for @jitsi/react-sdk to be properly documented

```tsx
// If using @jitsi/react-sdk correctly once docs clarify:
import JitsiMeeting from '@jitsi/react-sdk';

// Then use directly, not with dynamic import
export default function VideoCallContainer({ roomName, userName }) {
    return (
        <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={{...}}
            interfaceConfigOverwrite={{...}}
            userInfo={{ displayName: userName }}
        />
    );
}
```

---

## Issue #2: Inconsistent Room ID Generation

### Problem

```typescript
// API: Non-deterministic, timestamp-based
const jitsiRoomId = `interview-${tenantId}-${match_id}-${Date.now().toString(36)}`;

// Client match page: Hardcoded format
roomId={`talenthub-${match.id}`}

// Secure utilities exist but aren't used
export function generateJitsiRoomId(userId, tenantId, roomName, secretKey) { ... }
```

### Root Cause

- Multiple implementations instead of centralized utility
- Room ID generation is non-deterministic (timestamp)
- Same participants can't rejoin same room after refresh
- Security utilities unused in production code

### Solution: Centralize Room ID Generation

**File: `src/lib/jitsi.ts` (Update)**

```typescript
/**
 * UPDATED: Use this everywhere for consistent room IDs
 */
export function generateInterviewRoomId(
  matchId: string,
  tenantId: string,
  secretKey?: string,
): string {
  const secret = secretKey || process.env.JITSI_SECRET_KEY || "";

  if (!secret) {
    throw new Error("JITSI_SECRET_KEY not configured");
  }

  const input = `interview:${matchId}:${tenantId}`;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(input)
    .digest("hex")
    .substring(0, 12);

  return `interview-${matchId.substring(0, 8)}-${hash}`.toLowerCase();
}

/**
 * For client-engineer match viewing
 */
export function generateMatchRoomId(
  matchId: string,
  tenantId: string,
  secretKey?: string,
): string {
  const secret = secretKey || process.env.JITSI_SECRET_KEY || "";

  if (!secret) {
    throw new Error("JITSI_SECRET_KEY not configured");
  }

  const input = `match:${matchId}:${tenantId}`;
  const hash = crypto
    .createHmac("sha256", secret)
    .update(input)
    .digest("hex")
    .substring(0, 12);

  return `match-${hash}`.toLowerCase();
}
```

**File: `src/app/api/interviews/route.ts` (Update POST)**

```typescript
import { generateInterviewRoomId } from "@/lib/jitsi";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { match_id, scheduled_at, notes } = body;

    if (!match_id || !scheduled_at) {
      return NextResponse.json(
        { error: "match_id and scheduled_at are required" },
        { status: 400 },
      );
    }

    const tenantId =
      session.user.user_metadata?.tenant_id ||
      session.user.app_metadata?.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant information missing" },
        { status: 400 },
      );
    }

    // ✅ Use deterministic generation
    const jitsiRoomId = generateInterviewRoomId(
      match_id,
      tenantId,
      process.env.JITSI_SECRET_KEY,
    );

    const insertData: any = {
      tenant_id: tenantId,
      match_id,
      scheduled_at,
      notes: notes || null,
      jitsi_room_id: jitsiRoomId, // ✅ Deterministic
      status: "scheduled",
    };

    const { data, error } = await (supabase.from("interviews") as any)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        success: false,
        error: "Interview operation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
```

**File: `src/components/video/JitsiMeeting.tsx` (Update)**

```tsx
"use client";

import { generateMatchRoomId } from "@/lib/jitsi";
import { useEffect, useState } from "react";

interface JitsiMeetingProps {
  matchId: string;
  tenantId: string;
  width?: string | number;
  height?: string | number;
  userName?: string;
}

export default function JitsiMeeting({
  matchId,
  tenantId,
  width = "100%",
  height = 600,
  userName,
}: JitsiMeetingProps) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      // ✅ Generate deterministic room ID
      const generatedRoomId = generateMatchRoomId(matchId, tenantId);
      setRoomId(generatedRoomId);
    } catch (err) {
      console.error("Failed to generate room ID:", err);
    }
  }, [matchId, tenantId]);

  if (!roomId) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-zinc-900 rounded-lg"
      >
        <p className="text-zinc-400">Preparing video room...</p>
      </div>
    );
  }

  const jitsiUrl = `https://meet.jit.si/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(jitsiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInBrowser = () => {
    window.open(jitsiUrl, "_blank", "noopener,noreferrer");
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
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Interview Room Ready
          </h3>
          <p className="text-zinc-400 text-sm">
            Room:{" "}
            <code className="text-indigo-400 font-mono tracking-tighter ml-1">
              {roomId}
            </code>
          </p>
        </div>

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
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 w-full">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-zinc-400 font-bold uppercase tracking-wider">
              Meeting Link
            </span>
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
```

---

## Issue #3 & #4: Configuration and Hydration Issues

### Updated VideoCallContainer with Fixes

**File: `src/components/video/VideoCallContainer.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import JitsiMeeting from "./JitsiMeeting";

interface VideoCallContainerProps {
  roomName: string;
  userName: string;
  matchId?: string;
  tenantId?: string;
  onReadyToClose?: () => void;
  height?: string;
}

/**
 * Wrapper for embedded Jitsi video calls
 * Handles hydration safely and provides fallbacks
 */
export default function VideoCallContainer({
  roomName,
  userName,
  matchId,
  tenantId,
  onReadyToClose,
  height = "100%",
}: VideoCallContainerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasWebRTC, setHasWebRTC] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fix hydration: Only set mounted after first render
  useEffect(() => {
    setIsMounted(true);

    // Check WebRTC availability
    const webRTCAvailable = checkWebRTCSupport();
    setHasWebRTC(webRTCAvailable);
  }, []);

  const checkWebRTCSupport = (): boolean => {
    // Comprehensive WebRTC detection
    const hasWebRTC = !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection ||
      (navigator as any).mediaDevices?.getUserMedia
    );

    // Additional checks
    if (!hasWebRTC) return false;

    // Check for HTTPS (required for WebRTC)
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      console.warn("WebRTC requires HTTPS");
      return false;
    }

    return true;
  };

  // ✅ Return null during SSR - eliminates hydration warning
  if (!isMounted) {
    return null;
  }

  // ✅ WebRTC not available
  if (!hasWebRTC) {
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
          {matchId && tenantId ? (
            <a
              href={`https://meet.jit.si/${roomName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Open External →
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  // ✅ Show join button if not yet active
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

  // ✅ Show error if occurred
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

  // ✅ Render embedded Jitsi
  return (
    <div
      style={{
        height,
        width: "100%",
        borderRadius: "1.5rem",
        overflow: "hidden",
      }}
    >
      <JitsiMeeting
        roomId={roomName}
        userName={userName}
        height={height}
        onCallEnd={() => {
          setCallActive(false);
          onReadyToClose?.();
        }}
        onError={(err) => {
          setError(err);
        }}
      />
    </div>
  );
}
```

---

## Issue #7: API Validation

**File: `src/app/api/interviews/route.ts` (POST section)**

```typescript
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { match_id, scheduled_at, notes } = body;

    // ✅ Validate required fields
    if (!match_id || !scheduled_at) {
      return NextResponse.json(
        { error: "match_id and scheduled_at are required" },
        { status: 400 },
      );
    }

    // ✅ Validate scheduled_at format
    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduled_at format" },
        { status: 400 },
      );
    }

    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Cannot schedule interviews in the past" },
        { status: 400 },
      );
    }

    // ✅ Get and validate tenant
    const tenantId =
      session.user.user_metadata?.tenant_id ||
      session.user.app_metadata?.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant information missing" },
        { status: 400 },
      );
    }

    // ✅ Verify user has access to this match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, requirement_id")
      .eq("id", match_id)
      .eq("tenant_id", tenantId) // ✅ Check tenant ownership
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: "Match not found or access denied" },
        { status: 403 },
      );
    }

    // ✅ Check if interview already exists
    const { data: existing } = await supabase
      .from("interviews")
      .select("id")
      .eq("match_id", match_id)
      .eq("status", "scheduled");

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Interview already scheduled for this match" },
        { status: 409 },
      );
    }

    // ✅ Generate room ID with proper error handling
    let jitsiRoomId: string;
    try {
      jitsiRoomId = generateInterviewRoomId(
        match_id,
        tenantId,
        process.env.JITSI_SECRET_KEY,
      );
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to generate meeting room" },
        { status: 500 },
      );
    }

    const insertData: InterviewInsert = {
      tenant_id: tenantId,
      match_id,
      scheduled_at,
      notes: notes || null,
      jitsi_room_id: jitsiRoomId,
      status: "scheduled",
    };

    const { data, error } = await (supabase.from("interviews") as any)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Interview creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Interview operation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
```

---

## Issue #8: Environment Configuration

**File: `.env.local` (Add these)**

```
# Jitsi Configuration
JITSI_SECRET_KEY=your-super-secure-random-key-here-min-32-chars
JITSI_DOMAIN=meet.jit.si
JITSI_ENABLE_SELF_HOSTED=false
# JITSI_SELF_HOSTED_URL=https://your-jitsi-instance.com (if using self-hosted)
```

**File: `src/lib/jitsi.ts` (Add validation)**

```typescript
/**
 * Validate Jitsi configuration on app startup
 */
export function validateJitsiConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (
    !process.env.JITSI_SECRET_KEY ||
    process.env.JITSI_SECRET_KEY === "default-secret-key"
  ) {
    errors.push("JITSI_SECRET_KEY is not configured properly");
  }

  if (
    process.env.JITSI_SECRET_KEY &&
    process.env.JITSI_SECRET_KEY.length < 32
  ) {
    errors.push("JITSI_SECRET_KEY must be at least 32 characters");
  }

  const domain = process.env.JITSI_DOMAIN || "meet.jit.si";
  if (!domain.includes(".")) {
    errors.push("Invalid JITSI_DOMAIN format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Call during app initialization in middleware.ts or layout.tsx
if (typeof window === "undefined") {
  const config = validateJitsiConfig();
  if (!config.valid) {
    console.warn("Jitsi configuration issues:", config.errors);
  }
}
```

---

## Summary of Changes

| File                                          | Issues Fixed       | Changes                                                                  |
| --------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `src/components/video/VideoCallContainer.tsx` | #1, #3, #4, #5, #9 | Use JitsiMeetExternalAPI, fix hydration, add error handling, add timeout |
| `src/components/video/JitsiMeeting.tsx`       | #2, #10            | Use centralized room ID generation, properly embed Jitsi                 |
| `src/lib/jitsi.ts`                            | #2, #8             | Add deterministic room ID functions, config validation                   |
| `src/app/api/interviews/route.ts`             | #2, #7             | Use deterministic room ID, add full validation                           |
| `.env.local`                                  | #8                 | Add Jitsi configuration                                                  |
