# Jitsi Video Call - Quick Reference & Action Items

## 🔴 CRITICAL - Must Fix Immediately

### 1. Jitsi SDK Import Failing

- **File:** [src/components/video/VideoCallContainer.tsx](src/components/video/VideoCallContainer.tsx#L7)
- **Current:** `import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting)`
- **Status:** ❌ Causes infinite loading spinner
- **Action:** Replace with `JitsiMeetExternalAPI` implementation
- **Impact:** Video calls completely broken
- **Timeline:** URGENT - Day 1

### 2. Room IDs Not Consistent

- **Files:**
  - [src/app/api/interviews/route.ts#L81](src/app/api/interviews/route.ts#L81)
  - [src/components/video/JitsiMeeting.tsx#L16](src/components/video/JitsiMeeting.tsx#L16)
- **Current:** Different methods, non-deterministic (timestamp-based)
- **Status:** ❌ Same participants can't rejoin after refresh
- **Action:** Use `generateInterviewRoomId()` everywhere
- **Impact:** Video meetings fail on reload
- **Timeline:** URGENT - Day 1

### 3. No Error Handling

- **File:** [src/components/video/VideoCallContainer.tsx#L156](src/components/video/VideoCallContainer.tsx#L156)
- **Current:** `onApiReady` with no try-catch
- **Status:** ❌ Silent failures, no user feedback
- **Action:** Add error boundaries and user messaging
- **Impact:** Users can't exit failed calls
- **Timeline:** HIGH - Day 1-2

---

## 🟠 HIGH PRIORITY - Fix This Week

### 4. API Security Validation Missing

- **File:** [src/app/api/interviews/route.ts](src/app/api/interviews/route.ts)
- **Current:** No tenant verification, no access control
- **Status:** 🔓 Users can access other tenants' interviews
- **Action:** Add `.eq("tenant_id", tenantId)` to queries
- **Impact:** Data leak, privilege escalation
- **Timeline:** HIGH - Day 2-3

### 5. Missing Environment Configuration

- **File:** [src/lib/jitsi.ts#L15](src/lib/jitsi.ts#L15)
- **Current:** Falls back to "default-secret-key"
- **Status:** 🔓 All room IDs predictable
- **Action:** Set `JITSI_SECRET_KEY` in `.env.local`
- **Impact:** Security vulnerability
- **Timeline:** HIGH - Day 2

### 6. Interview Page Has No Permission Checks

- **File:** [src/app/engineer/interviews/page.tsx#L35](src/app/engineer/interviews/page.tsx#L35)
- **Current:** Fetches all interviews without tenant filter
- **Status:** 🔓 Engineers see all interviews across system
- **Action:** Add `.eq("tenant_id", tenantId)` to query
- **Impact:** Information disclosure
- **Timeline:** HIGH - Day 2-3

---

## 🟡 MEDIUM PRIORITY - Improve Quality

### 7. Configuration Mismatch

- **Files:** Both video components use different Jitsi configs
- **Status:** ⚠️ Inconsistent user experience
- **Action:** Centralize configuration
- **Timeline:** MEDIUM - Day 3-4

### 8. WebRTC Detection Incomplete

- **File:** [src/components/video/VideoCallContainer.tsx#L43](src/components/video/VideoCallContainer.tsx#L43)
- **Current:** Checks RTCPeerConnection only
- **Status:** ⚠️ May show join button but fail on Safari
- **Action:** Add media device checks, HTTPS validation
- **Timeline:** MEDIUM - Day 4

### 9. Hydration Warnings

- **File:** [src/components/video/VideoCallContainer.tsx#L50](src/components/video/VideoCallContainer.tsx#L50)
- **Current:** Returns different content in SSR vs client
- **Status:** ⚠️ Next.js warnings in console
- **Action:** Return `null` during SSR (fixed in solution)
- **Timeline:** MEDIUM - Day 4

### 10. JitsiMeeting Component Not Embedded

- **File:** [src/components/video/JitsiMeeting.tsx](src/components/video/JitsiMeeting.tsx)
- **Current:** Only shows "Open in Browser" button
- **Status:** ⚠️ Users leave app for calls
- **Action:** Embed Jitsi directly with JitsiMeetExternalAPI
- **Timeline:** MEDIUM - Day 5 (Optional)

---

## 📋 Implementation Checklist

### Phase 1: Unblock Video (Days 1-2)

- [ ] Replace Jitsi React SDK import with JitsiMeetExternalAPI
- [ ] Implement `generateInterviewRoomId()` function
- [ ] Update API to use deterministic room ID generation
- [ ] Update VideoCallContainer to use new room ID function
- [ ] Add error handling and fallbacks
- [ ] Add loading state with timeout
- [ ] Test: Can two users join same video call?
- [ ] Test: Call persists after page reload?

### Phase 2: Security (Days 2-3)

- [ ] Set up `.env.local` with `JITSI_SECRET_KEY`
- [ ] Add tenant validation to interview API
- [ ] Add access control to interview GET endpoint
- [ ] Add tenant filter to engineer interviews query
- [ ] Add permission checks before creating interviews
- [ ] Test: Engineer sees only their tenant's interviews?
- [ ] Test: Cannot create interview for other tenant?

### Phase 3: Polish (Days 4-5)

- [ ] Fix hydration warnings
- [ ] Improve WebRTC detection
- [ ] Centralize Jitsi configuration
- [ ] Add comprehensive error messages
- [ ] Test across browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Performance testing

---

## 🧪 Testing Checklist

### Functional Tests

```typescript
// Test 1: Same room ID generated consistently
const roomId1 = generateInterviewRoomId("match-123", "tenant-abc", secret);
const roomId2 = generateInterviewRoomId("match-123", "tenant-abc", secret);
assert(roomId1 === roomId2); // ✅ Should be true

// Test 2: Different matches get different rooms
const roomId3 = generateInterviewRoomId("match-456", "tenant-abc", secret);
assert(roomId1 !== roomId3); // ✅ Should be true

// Test 3: Different tenants get different rooms
const roomId4 = generateInterviewRoomId("match-123", "tenant-xyz", secret);
assert(roomId1 !== roomId4); // ✅ Should be true
```

### Security Tests

- [ ] Can user A see user B's interviews? (Should be NO)
- [ ] Can user create interview for different tenant? (Should be NO)
- [ ] Are room IDs predictable with known secret? (Should be NO)
- [ ] Can unauthenticated user view interviews? (Should be NO)

### User Experience Tests

- [ ] Video loads within 5 seconds
- [ ] No console errors/warnings
- [ ] Works on slow networks (throttle to 3G)
- [ ] Handles WebRTC unavailable gracefully
- [ ] Shows meaningful error messages
- [ ] Can successfully exit call and rejoin
- [ ] Audio/video permissions work correctly

---

## 📁 File Reference

### Main Video Components

- [src/components/video/VideoCallContainer.tsx](src/components/video/VideoCallContainer.tsx) - Main wrapper (NEEDS FIX)
- [src/components/video/JitsiMeeting.tsx](src/components/video/JitsiMeeting.tsx) - Link-based component (NEEDS UPDATE)

### Jitsi Utilities

- [src/lib/jitsi.ts](src/lib/jitsi.ts) - Room ID generation (Utilities exist but unused)
- [**tests**/lib/jitsi.test.ts](__tests__/lib/jitsi.test.ts) - Tests for utilities

### API Routes

- [src/app/api/interviews/route.ts](src/app/api/interviews/route.ts) - Interview CRUD (NEEDS VALIDATION)

### Pages Using Jitsi

- [src/app/engineer/interviews/page.tsx](src/app/engineer/interviews/page.tsx) - Engineer interviews view (NEEDS PERMISSION CHECKS)
- [src/app/client/matches/[id]/page.tsx](src/app/client/matches/[id]/page.tsx#L91) - Match video interview

### Configuration

- [package.json](package.json) - Has `@jitsi/react-sdk@1.4.4`
- [.env.local](/.env.local) - (NEEDS JITSI_SECRET_KEY)

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] `JITSI_SECRET_KEY` set in production `.env`
- [ ] All tests passing (unit + integration)
- [ ] No console warnings/errors in browser
- [ ] Video calls tested in production environment
- [ ] Monitored for errors: Sentry/LogRocket configured
- [ ] Rate limiting on interview API
- [ ] Database RLS policies enforced
- [ ] Load tested: 10+ concurrent calls supported

---

## 📞 Support / Q&A

### Q: Why do video calls show infinite loading?

**A:** The Jitsi React SDK import is failing. See Issue #1.

### Q: Why can't I rejoin the same call after refresh?

**A:** Room IDs are non-deterministic (timestamp-based). See Issue #2.

### Q: How do I fix the "hydration mismatch" warning?

**A:** Return `null` during SSR instead of a placeholder. See Issue #4.

### Q: Can I use self-hosted Jitsi instead of meet.jit.si?

**A:** Not yet configured. Add `JITSI_DOMAIN` and `JITSI_SELF_HOSTED_URL` to support this.

### Q: What if WebRTC is blocked by corporate firewall?

**A:** Falls back to external link. Users can join in browser tab instead.

---

## 📊 Risk Assessment

| Risk                          | Probability | Impact   | Mitigation                     |
| ----------------------------- | ----------- | -------- | ------------------------------ |
| Video calls completely fail   | HIGH        | CRITICAL | Fix Issue #1 immediately       |
| Users can't rejoin calls      | HIGH        | CRITICAL | Fix Issue #2 immediately       |
| Security data leak            | MEDIUM      | CRITICAL | Fix Issues #4, #7 this week    |
| Silent failures confuse users | MEDIUM      | HIGH     | Add error handling + messaging |
| Users see console errors      | HIGH        | MEDIUM   | Fix hydration warnings         |
| WebRTC fails on Safari        | LOW         | MEDIUM   | Improve detection + fallback   |

---

## 📈 Success Metrics

After fixes implemented:

- ✅ Video calls load within 3 seconds
- ✅ Can rejoin same meeting without issues
- ✅ Zero console errors/warnings
- ✅ 100% call success rate (test with 20 calls)
- ✅ Works on Chrome, Firefox, Safari, Edge
- ✅ No data leaks between tenants
- ✅ All API endpoints require valid auth + tenant check
- ✅ Error messages are user-friendly and actionable
