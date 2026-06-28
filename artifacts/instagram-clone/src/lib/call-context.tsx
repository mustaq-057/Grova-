import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import CallScreen, { IncomingCallOverlay } from "@/components/CallScreen";
import { isChatBlocked } from "./client-memory";
import { readSessionSnapshot } from "./profile-cache";
import { callStartedText, callEndedText, missedCallText, canceledCallText, declinedCallText } from "./call-chat-log";
import { openLiveChannel, type LiveChannel } from "./sse-client";

export type CallType = "audio" | "video";

export type CallState = {
  status: "outgoing" | "incoming" | "active";
  type: CallType;
  incomingOffer?: RTCSessionDescriptionInit;
} | null;

interface CallContextValue {
  callState: CallState;
  startCall: (type: CallType) => void;
  endCall: () => void;
  handleCallSignal: (type: string, data: any) => void;
  callConnectedAt: number;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user, partner: authPartner } = useAuth();
  
  const [callState, setCallState] = useState<CallState>(null);
  const [incomingCall, setIncomingCall] = useState<{ type: CallType; offer?: RTCSessionDescriptionInit } | null>(null);
  const [callSignals, setCallSignals] = useState<{ type: "answer" | "ice" | "offer"; data: unknown; seq: number }[]>([]);
  
  const callSignalSeq = useRef(0);
  const callConnectedAtRef = useRef(0);
  const callLoggedStartRef = useRef(false);
  const activeCallTypeRef = useRef<CallType>("audio");
  const callRoleRef = useRef<"outgoing" | "incoming" | "none">("none");
  const lastEndedCallAtRef = useRef<number>(0);

  const partnerId = user?.id === "me" ? "wife" : "me";
  const partnerName = authPartner?.name ?? readSessionSnapshot()?.partner?.name ?? "Partner";
  const partnerAvatar = authPartner?.avatar ?? readSessionSnapshot()?.partner?.avatar ?? "";

  const pushCallSignal = useCallback((type: "answer" | "ice" | "offer", data: unknown) => {
    callSignalSeq.current += 1;
    setCallSignals(prev => [...prev, { type, data, seq: callSignalSeq.current }]);
  }, []);

  const sendCallLogMsg = useCallback(async (text: string) => {
    if (!user) return;
    try {
      await api.sendMessage({
        senderId: user.id,
        type: "text",
        text,
      });
    } catch (err) {
      console.error("Failed to log call:", err);
    }
  }, [user]);

  const endCall = useCallback((opts?: { fromRemote?: boolean; reason?: "timeout" }) => {
    const type = activeCallTypeRef.current;
    const startedAt = callConnectedAtRef.current;
    const hadSession = callLoggedStartRef.current;
    const role = callRoleRef.current;
    
    // Crucial: reset role so we don't log multiple times if endCall is called repeatedly
    callRoleRef.current = "none";
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    lastEndedCallAtRef.current = Date.now();
    setCallState(null);
    setCallSignals([]);
    setIncomingCall(null);
    
    if (role === "outgoing") {
      if (hadSession) {
        const durationSec = startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;
        void sendCallLogMsg(callEndedText(type, durationSec));
      } else {
        if (opts?.reason === "timeout") {
          void sendCallLogMsg(missedCallText(type));
        } else if (opts?.fromRemote) {
          void sendCallLogMsg(declinedCallText(type));
        } else {
          void sendCallLogMsg(canceledCallText(type));
        }
      }
    }
  }, [sendCallLogMsg]);

  const onCallConnected = useCallback(() => {
    if (callLoggedStartRef.current) return;
    callLoggedStartRef.current = true;
    callConnectedAtRef.current = Date.now();
    if (callRoleRef.current === "outgoing") {
      void sendCallLogMsg(callStartedText(activeCallTypeRef.current));
    }
  }, [sendCallLogMsg]);

  const startCall = useCallback(async (type: CallType) => {
    if (!user) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      console.error("Call permissions denied:", err);
      alert("Please allow Camera and Microphone permissions in your browser settings to make a call.");
      return;
    }

    activeCallTypeRef.current = type;
    callRoleRef.current = "outgoing";
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallSignals([]);
    setCallState({ status: "outgoing", type });
    setIncomingCall(null);
    
    api.sendCallNotification(user.id, type).catch(err => console.error("Failed to send call notification:", err));
  }, [user]);

  const acceptCall = useCallback(() => {
    if (!incomingCall?.offer) return;
    activeCallTypeRef.current = incomingCall.type;
    callRoleRef.current = "incoming";
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallSignals([]);
    setCallState({ status: "incoming", type: incomingCall.type, incomingOffer: incomingCall.offer });
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (user) {
      api.sendCallSignal({ type: "reject", senderId: user.id }).catch(() => { });
    }
    lastEndedCallAtRef.current = Date.now();
    setIncomingCall(null);
  }, [user]);

  const handleCallSignal = useCallback((type: string, data: any) => {
    if (!user) return;
    
    // Safety check for old signals: if we already have an active call and we get an offer, ignore it.
    if (callState?.status === "active" && type === "call-offer") return;
    
    // Block incoming calls in Library Focus Mode
    const isLibraryMode = window.localStorage.getItem("libraryMode") === "true";

    if (type === "call-offer") {
      if (Date.now() - lastEndedCallAtRef.current < 5000) return;
      const d = data as { from: string; callType: CallType; sdp?: RTCSessionDescriptionInit };
      if (d.from !== partnerId || !d.sdp) return;
      if (callState) {
        // We already have a call (likely an ICE restart renegotiation) - push the offer to the screen
        pushCallSignal("offer", d.sdp);
        return;
      }
      setIncomingCall({ type: d.callType, offer: d.sdp });
      if (Notification.permission === "granted") {
        new Notification(`${partnerName} is calling`, {
          body: d.callType === "video" ? "Video call" : "Audio call",
          icon: partnerAvatar,
        });
      }
    } else if (type === "call-ring") {
      if (Date.now() - lastEndedCallAtRef.current < 5000) return;
      const d = data as { from: string; callType: CallType };
      if (d.from !== partnerId) return;
      setIncomingCall((prev) => prev ?? { type: d.callType });
    } else if (type === "call-answer") {
      const d = data as { from: string; sdp: RTCSessionDescriptionInit };
      if (d.from !== partnerId || !d.sdp) return;
      pushCallSignal("answer", d.sdp);
    } else if (type === "call-ice") {
      const d = data as { from: string; candidate: RTCIceCandidateInit };
      if (d.from !== partnerId || !d.candidate) return;
      pushCallSignal("ice", d.candidate);
    } else if (type === "call-end" || type === "call-reject") {
      endCall({ fromRemote: true });
    }
  }, [user, partnerId, partnerName, partnerAvatar, pushCallSignal, endCall, callState]);

  // Auto-hangup for unanswered outgoing calls (60 seconds)
  useEffect(() => {
    if (callState?.status !== "outgoing") return;
    
    const timer = setTimeout(() => {
      endCall({ reason: "timeout" });
    }, 60000);
    
    return () => clearTimeout(timer);
  }, [callState?.status, endCall]);

  // Fetch pending call signals on mount/login (one-shot)
  useEffect(() => {
    if (!user) return;
    api.getCallSignals().then((signals) => {
      for (const sig of signals) {
        handleCallSignal(sig.event, sig.data);
      }
    }).catch(err => console.error("Failed to fetch pending call signals:", err));
  }, [user, handleCallSignal]);

  // Real-time signaling channel (SSE or polling fallback)
  useEffect(() => {
    if (!user) return;
    let active = true;
    let channel: LiveChannel | null = null;

    const poll = async () => {
      if (!active) return;
      try {
        const signals = await api.getCallSignals();
        if (!active) return;
        for (const sig of signals) {
          handleCallSignal(sig.event, sig.data);
        }
      } catch { /* ignore network errors */ }
    };

    openLiveChannel(user.id, poll).then((ch) => {
      if (!active) {
        if (ch?.mode === "poll") ch.stop();
        if (ch?.mode === "sse") ch.eventSource.close();
        return;
      }
      channel = ch;
      if (channel?.mode === "sse") {
        const es = channel.eventSource;
        const handler = (e: MessageEvent) => {
          if (!active) return;
          try {
            handleCallSignal(e.type, JSON.parse(e.data));
          } catch {}
        };
        es.addEventListener("call-offer", handler);
        es.addEventListener("call-answer", handler);
        es.addEventListener("call-ice", handler);
        es.addEventListener("call-end", handler);
        es.addEventListener("call-reject", handler);
        es.addEventListener("call-ring", handler);
      }
    });

    return () => { 
      active = false; 
      if (channel?.mode === "poll") channel.stop();
      if (channel?.mode === "sse") channel.eventSource.close();
    };
  }, [user, handleCallSignal]);

  return (
    <CallContext.Provider value={{
      callState,
      startCall,
      endCall,
      handleCallSignal,
      callConnectedAt: callConnectedAtRef.current,
    }}>
      {children}
      
      {/* Global Call Overlays */}
      {!callState && incomingCall && !isChatBlocked() && (
        <IncomingCallOverlay
          callerName={partnerName}
          callerAvatar={partnerAvatar}
          callType={incomingCall.type}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
      
      {callState && user && (
        <CallScreen
          call={callState}
          partnerId={partnerId}
          partnerName={partnerName}
          partnerAvatar={partnerAvatar}
          myId={user.id}
          onSendSignal={(data) => {
            api.sendCallSignal(data).catch((err) => console.error("Signal fail:", err));
          }}
          onEnd={endCall}
          onConnected={onCallConnected}
          incomingSignals={callSignals}
        />
      )}
    </CallContext.Provider>
  );
}
