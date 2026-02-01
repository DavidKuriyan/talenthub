# Jitsi Video Call - Issues Analysis Report

## Executive Summary

Analysis of the Jitsi video call implementation in TalentHub reveals **5 critical issues** and **7 medium-severity issues** that could impact video conferencing reliability, security, and user experience.

---

## 🔴 CRITICAL ISSUES

### 1. **Missing Jitsi React SDK Import in VideoCallContainer**

**Location:** [src/components/video/VideoCallContainer.tsx](src/components/video/VideoCallContainer.tsx#L8)

**Issue:**

```tsx
// Line 7-8: Attempting to import JitsiMeeting from @jitsi/react-sdk
const JitsiMeeting = dynamic(
    () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
```

**Problem:**

- The `@jitsi/react-sdk` package (version 1.4.4) likely does NOT export a named export `JitsiMeeting`
- This will cause a **runtime error**: `Cannot read property 'JitsiMeeting' of undefined`
- Fallback loading component will never resolve properly

**Impact:**

- 🚫 Video calls will fail silently on engineer interviews page
- ❌ Users will see infinite loading spinner
- 🔒 No error feedback to diagnose the issue

**Solution:**
Use `JitsiMeetExternalAPI` instead or properly initialize Jitsi Meet via iframe/script tag.

---

### 2. **Inconsistent Room ID Generation Methods**

**Locations:**

- [src/lib/jitsi.ts#81](src/lib/jitsi.ts#L81) - API interviews
- [src/components/video/JitsiMeeting.tsx#16](src/components/video/JitsiMeeting.tsx#L16) - Client matches
- [src/components/video/VideoCallContainer.tsx#126](src/components/video/VideoCallContainer.tsx#L126) - Engineer interviews

**Issue:**

```typescript
// Method 1: API (non-deterministic)
const jitsiRoomId = `interview-${tenantId}-${match_id}-${Date.now().toString(36)}`;

// Method 2: JitsiMeeting component (hardcoded)
roomId={`talenthub-${match.id}`}

// Method 3: Should use secure HMAC but doesn't
```

**Problem:**

- **Same meeting participants cannot join the same room** if refreshed
- Timestamps ensure different IDs each time, breaking room persistence
- Security utilities in [src/lib/jitsi.ts](src/lib/jitsi.ts) are never used
- Participants in different client/engineer apps get different room IDs for same match

**Impact:**

- 🔄 Engineers and clients cannot actually meet in the same room
- 🚫 Reload = new room = lose existing call
- 🔐 Room IDs are predictable and time-based (security risk)

**Solution:**
Use deterministic HMAC-based room generation: `generateJitsiRoomId(userId, tenantId, "interview")` consistently everywhere.

---

### 3. **Jitsi Configuration Mismatch Between Components**

**Locations:**

- [src/components/video/VideoCallContainer.tsx#130-145](src/components/video/VideoCallContainer.tsx#L130-L145)
- [src/components/video/JitsiMeeting.tsx](src/components/video/JitsiMeeting.tsx)

**Issue:**

```tsx
// VideoCallContainer uses Jitsi React SDK config
configOverwrite={{
    startWithAudioMuted: true,
    startWithVideoMuted: false,
    disableModeratorIndicator: true,
    startScreenSharing: false,
}}

// JitsiMeeting uses public URL (no config)
const jitsiUrl = `https://meet.jit.si/${roomId}`;
```

**Problem:**

- Different initialization methods = different behavior
- JitsiMeeting component has NO configuration (uses Jitsi defaults)
- Audio starts muted in VideoCallContainer but unmuted in JitsiMeeting
- Inconsistent user experience across client and engineer apps

**Impact:**

- 😕 Confusing UX - some calls start muted, others don't
- 🔧 Cannot enforce organization policies uniformly
- 👥 Different participants have different feature access

---

### 4. **SSR Hydration Mismatch - Double Rendering Issue**

**Location:** [src/components/video/VideoCallContainer.tsx#50-63](src/components/video/VideoCallContainer.tsx#L50-L63)

**Issue:**

```tsx
// Component renders SSR loading state
if (!isMounted) {
  return <div>...</div>; // SSR renders this
}
// Then useEffect mounts and re-renders
useEffect(() => {
  setIsMounted(true); // Triggers re-render
}, []);
```

**Problem:**

- This is the correct pattern BUT:
- Initial SSR content differs from client-side content
- Next.js will show yellow warnings about hydration mismatch
- iframeRef style changes happen AFTER mount (potential flicker)

**Impact:**

- ⚠️ Next.js hydration warnings in console
- 📹 Video container may flicker or resize on load
- 🐢 Slower perceived load time

---

### 5. **No Error Handling for Jitsi API Initialization Failures**

**Location:** [src/components/video/VideoCallContainer.tsx#156-163](src/components/video/VideoCallContainer.tsx#L156-L163)

**Issue:**

```tsx
onApiReady={(externalApi) => {
    externalApi.on('readyToClose', () => {
        setCallActive(false);
        if (onReadyToClose) onReadyToClose();
    });
}}
```

**Problem:**

- No try-catch around externalApi operations
- No timeout if API never becomes ready
- No error state if Jitsi initialization fails
- Silent failures with no user feedback

**Impact:**

- 🎯 "readyToClose" event may never fire
- ❌ No way to recover from failed calls
- 😕 Users stuck in call UI with no exit mechanism

---

## 🟠 MEDIUM-SEVERITY ISSUES

### 6. **WebRTC Detection Logic is Incomplete**

**Location:** [src/components/video/VideoCallContainer.tsx#43-48](src/components/video/VideoCallContainer.tsx#L43-L48)

**Issue:**

```typescript
const webRTCAvailable = !!(
  window.RTCPeerConnection ||
  (window as any).webkitRTCPeerConnection ||
  (window as any).mozRTCPeerConnection
);
```

**Problems:**

- Missing Safari support: `RTCIceServer` vs `rtcIceServer` differences
- Doesn't check for media device permissions
- Browser might have WebRTC but camera/mic disabled
- No detection of network issues (NAT, firewalls)

**Impact:**

- 🔧 False positives on Safari
- 🚫 Shows "join" button but call fails silently
- 📱 Mobile browser detection may fail

---

### 7. **API Interview Route Missing Validation**

**Location:** [src/app/api/interviews/route.ts#70-88](src/app/api/interviews/route.ts#L70-L88)

**Issue:**

```typescript
const { match_id, scheduled_at, notes } = body;

if (!match_id || !scheduled_at) {
  return NextResponse.json({ error: "..." }, { status: 400 });
}

const tenantId =
  session.user.user_metadata?.tenant_id || session.user.app_metadata?.tenant_id;
// ❌ What if tenantId is undefined?

const jitsiRoomId = `interview-${tenantId}-${match_id}-${Date.now().toString(36)}`;
```

**Problems:**

- No validation that tenantId exists
- No validation that match_id belongs to this tenant
- No check if user has permission to create interviews
- Timestamp-based room ID (mentioned in Issue #2)

**Impact:**

- 🔓 Privilege escalation: users could create interviews for other tenants
- 🐛 Invalid room IDs stored in database
- 🚨 No audit trail

---

### 8. **Missing Environment Configuration for Jitsi**

**Location:** [src/lib/jitsi.ts#15-16](src/lib/jitsi.ts#L15-L16)

**Issue:**

```typescript
const secret =
  secretKey || process.env.JITSI_SECRET_KEY || "default-secret-key";
```

**Problems:**

- Falls back to hardcoded "default-secret-key" in production ❌
- No JITSI domain configuration (hardcoded to meet.jit.si)
- No Jitsi server configuration options
- Can't customize Jitsi instance or use self-hosted version

**Impact:**

- 🔓 All room IDs are predictable with default secret
- 🔒 Cannot meet compliance requirements for self-hosted video
- 🌍 Dependent on public Jitsi server availability

---

### 9. **No Timeout on Jitsi React SDK Dynamic Import**

**Location:** [src/components/video/VideoCallContainer.tsx#7-18](src/components/video/VideoCallContainer.tsx#L7-L18)

**Issue:**

```tsx
const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
    // ❌ No timeout specified
  },
);
```

**Problems:**

- If import fails, loading spinner shows forever
- No fallback if module load fails
- No error boundary
- Browser might hang/freeze

**Impact:**

- 🕐 Users see infinite loading spinner
- ❌ No way to recover or report error
- 😡 Poor user experience

---

### 10. **JitsiMeeting Component is Not Actually Using Jitsi**

**Location:** [src/components/video/JitsiMeeting.tsx#12-80](src/components/video/JitsiMeeting.tsx#L12-L80)

**Issue:**

```tsx
export default function JitsiMeeting({ roomId, ... }) {
    const jitsiUrl = `https://meet.jit.si/${roomId}`;

    const openInBrowser = () => {
        window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
    };

    // Just shows UI with buttons, doesn't embed Jitsi!
    return (
        <div>
            <button onClick={openInBrowser}>🎥 Join Meeting</button>
            <button onClick={copyLink}>📋 Copy Link</button>
        </div>
    );
}
```

**Problems:**

- Component is misnamed - doesn't use Jitsi SDK
- Only provides URL and "open in browser" buttons
- No embedded video conferencing in the app
- Users must leave app to join meeting

**Impact:**

- 👎 Poor UX - requires opening new tab
- 🔗 Users lose app context during call
- 📊 Cannot track call metrics in app
- 🎯 Defeats purpose of in-app video

---

### 11. **No Permission Checks for Interview Viewing**

**Location:** [src/app/engineer/interviews/page.tsx#28-45](src/app/engineer/interviews/page.tsx#L28-L45)

**Issue:**

```typescript
// Fetches all interviews without tenant check
const { data: interviewsData, error } = await supabase
  .from("interviews")
  .select("*") // ❌ No .eq("tenant_id", tenantId)
  .order("scheduled_at", { ascending: true });
```

**Problems:**

- Engineer might see interviews from other tenants
- No Row-Level Security (RLS) enforced at query level
- Manual filtering in JS instead of DB-level security
- Scope creep for malicious users

**Impact:**

- 🔓 Information disclosure vulnerability
- 👀 Engineers see competitors' interview data
- 🚨 GDPR/compliance violations

---

## 📋 SUMMARY TABLE

| Issue                       | Severity    | Component             | Category       | Status         |
| --------------------------- | ----------- | --------------------- | -------------- | -------------- |
| Jitsi SDK Import Error      | 🔴 Critical | VideoCallContainer    | Runtime        | ❌ Blocking    |
| Room ID Inconsistency       | 🔴 Critical | Multiple              | Logic          | ❌ Blocking    |
| Config Mismatch             | 🔴 Critical | Both Video Components | UX/Config      | ❌ Blocking    |
| Hydration Mismatch          | 🔴 Critical | VideoCallContainer    | SSR            | ⚠️ Warning     |
| No Error Handling           | 🔴 Critical | VideoCallContainer    | Error Handling | ⚠️ Silent Fail |
| Incomplete WebRTC Detection | 🟠 Medium   | VideoCallContainer    | Browser        | ✅ Known       |
| API Validation Missing      | 🟠 Medium   | interviews/route.ts   | Security       | ⚠️ Risk        |
| Missing Env Config          | 🟠 Medium   | jitsi.ts              | Config         | ⚠️ Risk        |
| No Import Timeout           | 🟠 Medium   | VideoCallContainer    | Performance    | ⚠️ Risk        |
| JitsiMeeting Not Using SDK  | 🟠 Medium   | JitsiMeeting.tsx      | Design         | ❌ Wrong       |
| No Permission Checks        | 🟠 Medium   | interviews/page.tsx   | Security       | 🔓 Leak        |

---

## 🚀 RECOMMENDED FIXES (Priority Order)

### Phase 1: Unblock Video Calls (Critical)

1. Fix Jitsi React SDK import or use proper initialization
2. Implement consistent HMAC-based room ID generation
3. Add error handling and recovery mechanisms

### Phase 2: Improve Security (High)

4. Add tenant/permission validation to API
5. Use environment variables for Jitsi configuration
6. Implement RLS at database query level

### Phase 3: Polish UX (Medium)

7. Fix hydration warnings
8. Improve WebRTC detection
9. Add timeouts and error boundaries
10. Embed Jitsi properly instead of external link

---

## 📌 NOTES

- Tests in [**tests**/lib/jitsi.test.ts](/__tests__/lib/jitsi.test.ts) are comprehensive but test utility functions, not actual component integration
- Security utilities in [src/lib/jitsi.ts](src/lib/jitsi.ts) are well-designed but unused
- Need integration tests for actual Jitsi API behavior
