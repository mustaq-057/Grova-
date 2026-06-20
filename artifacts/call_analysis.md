# WebRTC Audio & Video Call Analysis

Based on a detailed review of the `api-server` and `instagram-clone` (frontend) codebases, here are the critical issues preventing the audio and video call features from working reliably.

## 1. Missed Calls on SSE Connections (Signaling Drop)
**Location:** `Messages.tsx` and `call.ts`
**Problem:** The frontend only fetches pending call signals (like `call-offer`) when operating in "poll" mode (which is used when deployed on Vercel). However, when using Server-Sent Events (SSE) (e.g., in a local or non-serverless environment), the client never calls `api.getCallSignals()` on initial load. 
**Impact:** If a user is momentarily disconnected or offline when a partner initiates a call, the `call-offer` signal is saved to the database (`call_signals` table) but **never retrieved** when the user reconnects via SSE. The call is completely missed.

## 2. Broken TURN Server Authentication
**Location:** `api-server/src/lib/webrtc.ts`
**Problem:** The `getTurnServers()` function directly injects static `TURN_USERNAME` and `TURN_CREDENTIAL` environment variables into the WebRTC configuration. Most modern TURN servers (like Coturn using the REST API) require dynamically generated, time-limited credentials using an HMAC signature. 
**Impact:** While a `generateTurnCredentials()` function exists in the file to handle this, it is **never used**. As a result, WebRTC connections will fail on strict networks (e.g., cellular data or corporate networks with symmetric NATs) because the static TURN credentials will be rejected.

## 3. Scoped Call Listeners (Missed Calls on Other Pages)
**Location:** `Messages.tsx` and `Home.tsx`
**Problem:** The `CallScreen`, `IncomingCallOverlay`, and all WebRTC event listeners (`call-offer`, `call-ring`, etc.) are entirely scoped to `Messages.tsx`. 
**Impact:** If a user is actively browsing the `Home` page, `Notifications`, or `Memories`, they are disconnected from the call event streams. They will not receive any incoming calls, ringing audio, or visual overlays until they explicitly navigate to the Chat interface.

## 4. WebRTC ICE Candidate Race Condition
**Location:** `CallScreen.tsx`
**Problem:** WebRTC frequently generates and transmits ICE candidates before the remote session description (`answer`) is fully received and processed. 
**Impact:** In `CallScreen.tsx`, if an `incomingSignal.type === "ice"` arrives before the remote description is set, `pc.addIceCandidate()` will fail and throw an error. Because these candidates are not queued and retried, the peer connection will often fail to establish a direct media path, resulting in a failed call or "Connecting..." hanging forever.

## 5. Stale Call Signals / Database Leaks
**Location:** `api-server/src/routes/call.ts`
**Problem:** When `api.getCallSignals()` is triggered, it blindly executes a `DELETE FROM call_signals RETURNING *` query. There is no expiration mechanism or timestamp check on these signals.
**Impact:** If a user closes the app and returns 5 hours later, they will suddenly fetch a 5-hour-old `call-offer` and the app will display a phantom "Incoming Call" overlay. Additionally, there is no cleanup for stale signals if the user never connects to fetch them.

---

### Suggested Action Plan
If you'd like, I can begin fixing these issues sequentially. A good starting point would be:
1. **Fixing the TURN server credentials** to ensure connections don't drop on cellular networks.
2. **Queuing ICE candidates** in `CallScreen.tsx` to fix the connection race conditions.
3. **Refactoring the Call Listeners** to a global context so calls ring no matter what page you are on.
