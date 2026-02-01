# Jitsi Issues - Quick Reference Card

## 🔴 3 CRITICAL ISSUES (FIX FIRST)

### Issue #1: SDK Import Broken

**File:** `src/components/video/VideoCallContainer.tsx:8`  
**Problem:** `import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting)` fails  
**Symptom:** Infinite loading spinner  
**Fix:** Use `JitsiMeetExternalAPI` from CDN

```typescript
// ❌ Remove this
const JitsiMeeting = dynamic(() => import('@jitsi/react-sdk')...)

// ✅ Use this instead
<script src="https://meet.jit.si/external_api.js"></script>
const api = new window.JitsiMeetExternalAPI('meet.jit.si', options)
```

---

### Issue #2: Room IDs Not Consistent

**Files:** 3 different implementations  
**Problem:** Timestamp-based generation = different room each time  
**Symptom:** Can't rejoin same call after refresh  
**Fix:** Use HMAC-based `generateInterviewRoomId(matchId, tenantId)`

```typescript
// ❌ Current (timestamp = non-deterministic)
const roomId = `interview-${tenantId}-${match_id}-${Date.now()}`;

// ✅ Fixed (HMAC = deterministic)
const roomId = generateInterviewRoomId(match_id, tenantId, secret);
// Result: Same participants = Same room ID = Same video call ✅
```

---

### Issue #3: No Error Handling

**File:** `src/components/video/VideoCallContainer.tsx:156`  
**Problem:** No try-catch, no timeout, no error state  
**Symptom:** Silent failures, users stuck in loading  
**Fix:** Add error boundaries and recovery UI

```typescript
// ❌ Current
onApiReady={(api) => {
    api.on('readyToClose', () => setCallActive(false))
}}

// ✅ Fixed
try {
    if (!api) throw new Error('API not ready')
    api.on('error', (err) => setError(err.message))
    api.on('readyToClose', () => setCallActive(false))

    // Add timeout
    setTimeout(() => {
        if (!callStarted) setError('Call initialization timeout')
    }, 5000)
} catch (err) {
    setError('Failed to start call')
}
```

---

## 🟠 3 SECURITY ISSUES (FIX THIS WEEK)

### Issue #4: No API Validation

**File:** `src/app/api/interviews/route.ts:70-88`  
**Problem:** Can create interviews for other tenants  
**Risk:** 🔓 Privilege escalation  
**Fix:** Verify tenant ownership

```typescript
// Add these checks
if (!tenantId) return error("Tenant missing");

// Verify user owns this match
const { data: match } = await supabase
  .from("matches")
  .select("id")
  .eq("id", match_id)
  .eq("tenant_id", tenantId) // ← KEY: Check tenant match
  .single();

if (!match) return error("No permission", 403);
```

---

### Issue #5: No Permission Checks

**File:** `src/app/engineer/interviews/page.tsx:35`  
**Problem:** Engineers see ALL system interviews  
**Risk:** 🔓 Information disclosure  
**Fix:** Filter by tenant

```typescript
// ❌ Current - returns everything
const { data: interviews } = await supabase.from("interviews").select("*");

// ✅ Fixed - returns only user's tenant
const { data: interviews } = await supabase
  .from("interviews")
  .select("*")
  .eq("tenant_id", tenantId); // ← ADD THIS
```

---

### Issue #6: Hardcoded Secret

**File:** `src/lib/jitsi.ts:15`  
**Problem:** Falls back to `"default-secret-key"`  
**Risk:** 🔓 All room IDs predictable  
**Fix:** Require environment variable

```typescript
// ❌ Current - dangerous fallback
const secret =
  secretKey || process.env.JITSI_SECRET_KEY || "default-secret-key";

// ✅ Fixed - require real secret
const secret = process.env.JITSI_SECRET_KEY;
if (!secret) throw new Error("JITSI_SECRET_KEY not configured");
```

---

## 🟡 5 MEDIUM ISSUES (POLISH LATER)

| #   | File                  | Problem                       | Fix                      |
| --- | --------------------- | ----------------------------- | ------------------------ |
| 7   | Both video components | Config mismatch               | Centralize settings      |
| 8   | VideoCallContainer    | SSR hydration                 | Return `null` on SSR     |
| 9   | VideoCallContainer:43 | Incomplete WebRTC detection   | Add media + HTTPS checks |
| 10  | JitsiMeeting.tsx      | Component doesn't embed Jitsi | Use JitsiMeetExternalAPI |
| 11  | VideoCallContainer:7  | No import timeout             | Add error boundary       |

---

## 🛠️ Implementation Order

```
Day 1: Critical
├─ Fix Issue #1: Replace SDK import
├─ Fix Issue #2: Implement deterministic room IDs
└─ Fix Issue #3: Add error handling

Days 2-3: Security
├─ Fix Issue #4: Add API validation
├─ Fix Issue #5: Add permission checks
└─ Fix Issue #6: Set JITSI_SECRET_KEY in .env

Days 4-5: Polish
├─ Fix Issues #7-11: UX improvements
├─ Cross-browser testing
└─ Deploy to staging
```

---

## 🧪 Quick Test Checklist

```
✓ Can two users see each other in video?
✓ Can user rejoin call after page refresh?
✓ Can user exit call gracefully?
✓ Does error show if WebRTC unavailable?
✓ Does engineer only see their interviews?
✓ Can user create interview for other tenant? (should be NO)
✓ Works in Chrome, Firefox, Safari, Edge?
✓ No console errors/warnings?
```

---

## 📊 Files Impacted

```
NEEDS FIX:
├─ src/components/video/VideoCallContainer.tsx (Issues #1, #3-5, #8-9, #11)
├─ src/components/video/JitsiMeeting.tsx (Issues #2, #10)
├─ src/app/api/interviews/route.ts (Issues #2, #4)
├─ src/app/engineer/interviews/page.tsx (Issue #5)
├─ src/lib/jitsi.ts (Issues #2, #6)
└─ .env.local (Issue #6)

GOOD (No changes needed):
├─ __tests__/lib/jitsi.test.ts ✅
└─ package.json ✅
```

---

## 🚨 Red Flags

If you see these, issues are NOT fixed:

- 🔴 Loading spinner that never completes
- 🔴 Video page works first time but breaks on reload
- 🔴 Different room URLs when refreshing
- 🔴 Errors only in browser console (not shown to user)
- 🟠 Engineer can access interviews from other organizations
- 🟠 No error on missing JITSI_SECRET_KEY
- 🟡 "Hydration mismatch" warnings in Next.js console
- 🟡 Video works in Chrome but not Safari

---

## ✅ Signs Issues Are Fixed

- ✅ Video calls load within 3 seconds
- ✅ Same room URL persists across page refreshes
- ✅ Two users in same room can see each other
- ✅ Clear error messages when issues occur
- ✅ Engineers see only their tenant's interviews
- ✅ JITSI_SECRET_KEY required in .env
- ✅ No hydration warnings
- ✅ Works on all major browsers

---

## 📞 Debug Commands

```bash
# Check if JITSI_SECRET_KEY is set
echo $JITSI_SECRET_KEY

# Test room ID generation
node -e "
const crypto = require('crypto');
const secret = 'test-secret';
const hash = crypto.createHmac('sha256', secret)
    .update('interview:match-123:tenant-abc')
    .digest('hex')
    .substring(0, 12);
console.log('Room ID: interview-matc-' + hash);
"

# Check Jitsi API loading
curl -I https://meet.jit.si/external_api.js

# Monitor video call in browser console
window.JitsiMeetExternalAPI.on('readyToClose', () => console.log('Ready to close'))
```

---

## 📚 Full Documentation

- **Detailed Analysis:** `JITSI_ISSUES_ANALYSIS.md`
- **Code Solutions:** `JITSI_SOLUTIONS_DETAILED.md`
- **Implementation:** `JITSI_ACTION_ITEMS.md`
- **Architecture:** `JITSI_ARCHITECTURE_DIAGRAMS.md`
- **Executive Summary:** `JITSI_ANALYSIS_SUMMARY.md`
- **This Card:** `JITSI_QUICK_REFERENCE.md`

---

**Print this card and keep it handy during implementation!**
