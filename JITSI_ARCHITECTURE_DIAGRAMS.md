# Jitsi Video Call - Architecture & Flow Analysis

## Current Architecture (Broken)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TalentHub Application                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Engineer   │ │    Client    │ │  API Route   │
        │  Interviews  │ │   Matches    │ │  interviews  │
        │   Page       │ │     Page     │ │   route.ts   │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │                   │
                └─────────────┼───────────────────┘
                              │
                ┌─────────────▼─────────────┐
                │  VideoCallContainer       │ ❌ Issue #1: SDK import fails
                │  JitsiMeeting             │ ❌ Issue #3: Config mismatch
                │  (Browser API)            │ ❌ Issue #4: Hydration issues
                └────────┬──────────────────┘
                         │
        ❌ Issue #2:    │  Room ID inconsistent
        Different room  │  (timestamp-based)
        for each try    │
                         │
                ┌────────▼──────────────┐
                │   meet.jit.si         │
                │   Public Jitsi        │
                │   (No authentication) │
                └───────────────────────┘

Problems:
- Room ID generation: 3 different methods
- No deterministic room IDs (timestamp-based)
- SDK import always fails
- Configuration varies by component
- SSR hydration mismatch
- No error handling
- Security: Predictable room IDs
```

---

## Fixed Architecture (Proposed)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TalentHub Application                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Engineer   │ │    Client    │ │  API Route   │
        │  Interviews  │ │   Matches    │ │  interviews  │
        │   Page       │ │     Page     │ │   route.ts   │
        └──────────────┘ └──────────────┘ └──────────────┘
                │             │                   │
                └─────────────┼───────────────────┘
                              │
        ✅ All use same  ┌────▼────────────────────┐
           room ID       │  generateInterviewRoomId │  ← HMAC-based
           generator     │  generateMatchRoomId      │  ← Deterministic
                         └────┬────────────────────┘
                              │
                ┌─────────────▼─────────────┐
                │  VideoCallContainer       │ ✅ JitsiMeetExternalAPI
                │  (JitsiMeeting)           │ ✅ Consistent config
                │  (Properly mounted)       │ ✅ Error handling
                └────────┬──────────────────┘
                         │
        ✅ Deterministic │  Room ID generated from:
           room ID       │  - Match ID
           (HMAC)        │  - Tenant ID
                         │  - JITSI_SECRET_KEY (env)
                         │
                ┌────────▼──────────────────┐
                │   meet.jit.si             │
                │   or self-hosted          │
                │   Jitsi Instance          │
                └───────────────────────────┘

Benefits:
- Single source of truth for room ID generation
- Same participants always in same room
- Secure: HMAC-based room IDs
- Consistent configuration
- Proper error handling
- Tenant/permission validation
```

---

## Room ID Generation Flow

### ❌ CURRENT (BROKEN)

```
Interview Created (API)
    │
    ├─ Tenant ID: "acme-inc"
    ├─ Match ID: "match-123"
    ├─ Timestamp: 1704067200000
    │
    └─► Room ID = "interview-acme-inc-match-123-1zv8p"
                                                    ↑
                                            Timestamp (CHANGES!)

User joins interview at 2:00 PM:
    └─► Uses room ID: "interview-acme-inc-match-123-1zv8p"

User refreshes page at 2:01 PM:
    └─► NEW timestamp generates DIFFERENT room
    └─► Room ID: "interview-acme-inc-match-123-1zv8q"

Result: ❌ Two different video rooms for same meeting!
```

### ✅ FIXED (PROPOSED)

```
Interview Created (API)
    │
    ├─ Tenant ID: "acme-inc"
    ├─ Match ID: "match-123"
    ├─ Secret Key: process.env.JITSI_SECRET_KEY
    │
    └─► HMAC-SHA256 (interview:match-123:acme-inc)
        └─► Hash: "a7f2b4e1c9d3f8" (deterministic!)

Room ID = "interview-matc-a7f2b4e1c9d3"
          ↑ Short ID prefix  ↑ HMAC hash

User joins interview at 2:00 PM:
    └─► Uses room ID: "interview-matc-a7f2b4e1c9d3"

User refreshes page at 2:01 PM:
    └─► Same inputs generate SAME hash
    └─► Room ID: "interview-matc-a7f2b4e1c9d3" (IDENTICAL!)

Result: ✅ Same room regardless of refreshes!
```

---

## Permission/Security Flow

### ❌ CURRENT (INSECURE)

```
Engineer requests interviews
    │
    └─► SELECT * FROM interviews
        │
        └─► Returns ALL interviews in system
            (No tenant filtering!)

Result: Engineer sees competitors' interview data! 🔓
```

### ✅ FIXED (SECURE)

```
Engineer requests interviews
    │
    ├─ Extract tenant_id from session: "acme-inc"
    │
    └─► SELECT * FROM interviews
        WHERE tenant_id = 'acme-inc'
        AND match_id IN (
            SELECT id FROM matches
            WHERE profile_id = engineer_profile_id
        )
        │
        └─► Returns ONLY their own interviews

Result: Proper isolation between tenants ✅
```

---

## Component State Machine

### VideoCallContainer - Current (Broken)

```
                    ┌─────────────┐
                    │   MOUNTED   │ ← useEffect sets isMounted=true
                    │             │
                    └─────┬───────┘
                          │
                    ┌─────▼──────────┐
                    │ CHECK WebRTC   │
                    │                │ (Incomplete detection)
                    └─────┬──────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
       ✅ YES                       ❌ NO
            │                           │
            ▼                           ▼
    ┌──────────────┐          ┌──────────────┐
    │ SHOW JOIN    │          │ FALLBACK UI  │
    │ BUTTON       │          │              │
    └──────┬───────┘          └──────────────┘
           │
      Click "Join"
           │
           ▼
    ┌──────────────────────┐
    │ DYNAMIC IMPORT       │
    │ JitsiMeeting SDK     │ ❌ FAILS HERE!
    └──────┬───────────────┘
           │
      ❌ IMPORT ERROR
           │
           ▼
    ┌──────────────────┐
    │ INFINITE LOADING │ ← User sees spinning wheel forever!
    └──────────────────┘
```

### VideoCallContainer - Fixed (Proposed)

```
         ┌──────────────┐
         │ RENDER NULL  │ ← Prevents hydration mismatch
         │ (SSR)        │
         └──────┬───────┘
                │
      useEffect
         mounts
                │
         ┌──────▼──────────┐
         │ SET isMounted   │
         │                 │
         └──────┬──────────┘
                │
         ┌──────▼──────────────┐
         │ CHECK WebRTC        │
         │ (Comprehensive)     │
         └──────┬──────────────┘
                │
       ┌────────┴────────┐
       │                 │
    ✅ YES           ❌ NO
       │                 │
       ▼                 ▼
   ┌────────┐      ┌──────────┐
   │ JOIN   │      │ FALLBACK │
   │BUTTON  │      │ + LINK   │
   └────┬───┘      └──────────┘
        │
   Click
        │
        ▼
   ┌──────────────────┐
   │ LOAD JitsiMeet   │
   │ ExternalAPI      │ ✅ Loads properly
   │ from CDN         │
   └────┬─────────────┘
        │
        ├─ setTimeout(5000)
        │  Check if loaded
        │  else show error
        │
        ▼
   ┌──────────────────┐
   │ INIT JITSI       │
   │ Config + Room    │ ✅ Proper config
   │ ID               │
   └────┬─────────────┘
        │
        ├─ onApiReady
        │  onError handler
        │  onReadyToClose
        │
        ▼
   ┌──────────────────┐
   │ EMBEDDED VIDEO   │
   │ CALL             │ ✅ User can call!
   │                  │
   └──────────────────┘
```

---

## API Flow - Interview Creation

### ❌ CURRENT

```
POST /api/interviews
├─ Check authentication ✅
├─ Parse body
├─ Validate match_id & scheduled_at
├─ Get tenantId from session ← ❌ Can be undefined
├─ Generate room ID
│  └─ jitsiRoomId = `interview-${tenantId}-${match_id}-${Date.now()}`
│     └─ ❌ Non-deterministic!
└─ Insert into database
   └─ ❌ No check if user owns this match
```

### ✅ FIXED

```
POST /api/interviews
├─ Check authentication ✅
├─ Check authorization ✅ (must be logged in)
├─ Parse & validate body
│  ├─ match_id (required)
│  ├─ scheduled_at (required, not in past)
│  └─ notes (optional)
├─ Extract & validate tenantId ✅
│  └─ Reject if missing
├─ Verify user owns match ✅
│  └─ SELECT match WHERE id=X AND tenant_id=Y
│  └─ Reject if not found
├─ Check interview doesn't exist ✅
│  └─ Prevent duplicates
├─ Generate room ID ✅
│  └─ generateInterviewRoomId(match_id, tenantId, secret)
│  └─ ✅ Deterministic!
└─ Insert into database
   └─ With all validations passed
```

---

## Data Flow - Room ID Assignment

```
┌──────────────────┐
│ Interview        │
│ scheduled_at:    │
│ 2024-01-04 2:00PM│
└────────┬─────────┘
         │
    API accepts
    POST request
         │
         ▼
┌──────────────────────────────────┐
│ generateInterviewRoomId()         │
│                                  │
│ Input:                           │
│  - matchId: "match-123"          │
│  - tenantId: "acme-inc"          │
│  - secret: "super-secret-key"    │
│                                  │
│ Process:                         │
│  1. Create string:               │
│     "interview:match-123:acme..."│
│  2. HMAC-SHA256 with secret      │
│  3. Take first 12 chars          │
│  4. Format: "interview-matc-..." │
└──────────┬───────────────────────┘
           │
    ✅ Deterministic
    ✅ Secure (HMAC)
    ✅ Consistent
           │
           ▼
┌──────────────────────────────┐
│ Database Insert              │
│ interviews table             │
│                              │
│ id: uuid                     │
│ match_id: "match-123"        │
│ tenant_id: "acme-inc"        │
│ jitsi_room_id: "interview-..."
│ scheduled_at: 2024-01-04...  │
│ status: "scheduled"          │
└──────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Engineer/Client Joins         │
│                              │
│ Queries: SELECT interviews   │
│ WHERE match_id = X           │
│                              │
│ Gets: jitsi_room_id          │
│ Same ID every time! ✅        │
│                              │
│ Connects to Jitsi with       │
│ room_name = "interview-..."  │
└──────────────────────────────┘
```

---

## Error Handling Flow

### ❌ CURRENT

```
JitsiMeeting Component
    │
    ├─ Dynamic import
    │  └─ May fail silently
    │
    ├─ onApiReady
    │  └─ No error handling
    │
    └─ If fails
       └─ User sees: (nothing)
       └─ Console: (error not shown)
       └─ Result: Infinite loading ❌
```

### ✅ FIXED

```
JitsiMeeting Component
    │
    ├─ Load script from CDN
    │  ├─ onLoad ─► initJitsi()
    │  └─ onError ─► setError("Failed to load")
    │
    ├─ Initialize Jitsi
    │  ├─ try-catch block
    │  ├─ setTimeout(5000) for timeout
    │  └─ onError handler
    │
    ├─ Event handlers
    │  ├─ onApiReady ─► Call ready
    │  ├─ on('error') ─► Show error UI
    │  └─ on('readyToClose') ─► Cleanup
    │
    └─ If fails
       ├─ User sees: Error message with "Retry" button
       ├─ Console: Detailed error logged
       └─ Result: Can recover from error ✅
```

---

## Timeline Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   IMPLEMENTATION TIMELINE                │
└─────────────────────────────────────────────────────────┘

DAY 1: Critical Fixes (Unblock Video)
├─ 🔴 Fix JitsiMeetExternalAPI import
├─ 🔴 Implement deterministic room ID generation
├─ 🔴 Add error handling & timeouts
└─ Result: Video calls work!

DAY 2-3: Security & Validation
├─ 🟠 Add tenant isolation to queries
├─ 🟠 Add permission checks to API
├─ 🟠 Set JITSI_SECRET_KEY in .env
└─ Result: No data leaks!

DAY 4-5: Polish & Testing
├─ 🟡 Fix hydration warnings
├─ 🟡 Improve WebRTC detection
├─ 🟡 Comprehensive testing
└─ Result: Production-ready!

ONGOING: Monitoring
├─ 📊 Track call success rate
├─ 📊 Monitor error rates
├─ 📊 User satisfaction
└─ 🔧 Iterate on issues
```

---

## Security Model

```
┌──────────────────────────────────────┐
│ Tenant Isolation Layer               │
├──────────────────────────────────────┤
│                                      │
│ ┌─────────────┐    ┌─────────────┐  │
│ │  Tenant A   │    │  Tenant B   │  │
│ │ (acme-inc)  │    │ (tech-corp) │  │
│ └──────┬──────┘    └──────┬──────┘  │
│        │                   │        │
│        ├─ Interviews      ├─ Interviews
│        ├─ Matches         ├─ Matches
│        ├─ Profiles        ├─ Profiles
│        └─ Room IDs        └─ Room IDs
│        (Secret A)         (Secret B)
│                                      │
└──────────────────────────────────────┘

Room ID = HMAC(interview:match_id:tenant_id, SECRET_KEY)

If Secret is the same:
    ❌ Room IDs predictable by attacker!

If Secret is different per tenant:
    ✅ Each tenant has unique room IDs!
```

---

## Recovery/Failure Scenarios

```
Scenario 1: User Browser Doesn't Support WebRTC
├─ Detection: checkWebRTCSupport() returns false
├─ UI: Shows "Video not available" message
├─ Fallback: "Open in External Tab" button
└─ User: Still can join video in browser tab

Scenario 2: Jitsi CDN Unavailable
├─ Detection: Script load fails
├─ Error Handler: onError callback triggered
├─ UI: Shows "Failed to load video" with Retry
├─ User: Can retry or use external link

Scenario 3: Network Timeout During Call
├─ Detection: No events for 30 seconds
├─ Recovery: Auto-reconnect attempt
├─ UI: Shows "Reconnecting..." message
├─ User: Call resumes or shows error

Scenario 4: JITSI_SECRET_KEY Missing
├─ Detection: validateJitsiConfig() fails
├─ Environment: Warning in console
├─ Impact: Room IDs not secure
├─ Fix: Add JITSI_SECRET_KEY to .env

Scenario 5: User A & User B Same Room Different IDs
├─ Root: Non-deterministic room ID generation
├─ Detection: Call never connects
├─ Fix: Use generateInterviewRoomId()
├─ User: Now in same room! ✅
```
