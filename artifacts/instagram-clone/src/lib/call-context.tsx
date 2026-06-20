import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import CallScreen, { IncomingCallOverlay } from "@/components/CallScreen";
import { isChatBlocked } from "./client-memory";
import { readSessionSnapshot } from "./profile-cache";
import { callStartedText, callEndedText } from "./call-chat-log";

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
  const [callSignal, setCallSignal] = useState<{ type: "answer" | "ice"; data: unknown; seq: number } | null>(null);
  
  const callSignalSeq = useRef(0);
  const callConnectedAtRef = useRef(0);
  const callLoggedStartRef = useRef(false);
  const activeCallTypeRef = useRef<CallType>("audio");
  const callRoleRef = useRef<"outgoing" | "incoming">("outgoing");

  const partnerId = user?.id === "me" ? "wife" : "me";
  const partnerName = authPartner?.name ?? readSessionSnapshot()?.partner?.name ?? "Partner";
  const partnerAvatar = authPartner?.avatar ?? readSessionSnapshot()?.partner?.avatar ?? "";

  const pushCallSignal = useCallback((type: "answer" | "ice", data: unknown) => {
    callSignalSeq.current += 1;
    setCallSignal({ type, data, seq: callSignalSeq.current });
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

  const endCall = useCallback((opts?: { fromRemote?: boolean }) => {
    const type = activeCallTypeRef.current;
    const startedAt = callConnectedAtRef.current;
    const hadSession = callLoggedStartRef.current;
    
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallState(null);
    setCallSignal(null);
    setIncomingCall(null);
    
    if (hadSession && !opts?.fromRemote) {
      const durationSec = startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;
      void sendCallLogMsg(callEndedText(type, durationSec));
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

  const startCall = useCallback((type: CallType) => {
    if (!user) return;
    activeCallTypeRef.current = type;
    callRoleRef.current = "outgoing";
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallSignal(null);
    setCallState({ status: "outgoing", type });
    setIncomingCall(null);
  }, [user]);

  const acceptCall = useCallback(() => {
    if (!incomingCall?.offer) return;
    activeCallTypeRef.current = incomingCall.type;
    callRoleRef.current = "incoming";
    callLoggedStartRef.current = false;
    callConnectedAtRef.current = 0;
    setCallSignal(null);
    setCallState({ status: "incoming", type: incomingCall.type, incomingOffer: incomingCall.offer });
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (user) {
      api.sendCallSignal({ type: "reject", senderId: user.id }).catch(() => { });
    }
    setIncomingCall(null);
  }, [user]);

  const handleCallSignal = useCallback((type: string, data: any) => {
    if (!user) return;
    
    // Safety check for old signals: if we already have an active call and we get an offer, ignore it.
    if (callState?.status === "active" && type === "call-offer") return;

    if (type === "call-offer") {
      const d = data as { from: string; callType: CallType; sdp?: RTCSessionDescriptionInit };
      if (d.from !== partnerId || !d.sdp) return;
      setIncomingCall({ type: d.callType, offer: d.sdp });
      if (Notification.permission === "granted") {
        new Notification(`${partnerName} is calling`, {
          body: d.callType === "video" ? "Video call" : "Audio call",
          icon: partnerAvatar,
        });
      }
    } else if (type === "call-ring") {
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

  // Fetch pending call signals on mount/login
  useEffect(() => {
    if (!user) return;
    api.getCallSignals().then((signals) => {
      for (const sig of signals) {
        handleCallSignal(sig.event, sig.data);
      }
    }).catch(err => console.error("Failed to fetch pending call signals:", err));
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
          incomingSignal={callSignal || undefined}
        />
      )}
    </CallContext.Provider>
  );
}
