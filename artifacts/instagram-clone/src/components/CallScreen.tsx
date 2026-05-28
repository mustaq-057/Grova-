import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type CallType = "audio" | "video";
type CallStatus = "incoming" | "outgoing" | "active";

interface CallState {
  status: CallStatus;
  type: CallType;
  incomingOffer?: RTCSessionDescriptionInit;
}

interface Props {
  call: CallState;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  myId: string;
  onSendSignal: (data: { type: string; senderId: string; [k: string]: unknown }) => void;
  onEnd: () => void;
  incomingSignal?: { type: "answer" | "ice"; data: unknown };
}

export default function CallScreen({
  call,
  partnerId: _partnerId,
  partnerName,
  partnerAvatar,
  myId,
  onSendSignal,
  onEnd,
  incomingSignal,
}: Props) {
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<number>(0);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Timer
  useEffect(() => {
    if (!connected) return;
    startTimeRef.current = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [connected]);

  // Setup WebRTC on mount
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: call.type === "video",
        });
        if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        stream.getTracks().forEach(t => pc.addTrack(t, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          setConnected(true);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            onSendSignal({ type: "ice", senderId: myId, candidate: e.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            handleEnd();
          }
        };

        if (call.status === "outgoing") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          onSendSignal({ type: "offer", senderId: myId, sdp: offer, callType: call.type });
        } else if (call.status === "incoming" && call.incomingOffer) {
          await pc.setRemoteDescription(call.incomingOffer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          onSendSignal({ type: "answer", senderId: myId, sdp: answer });
          setConnected(true);
        }
      } catch {
        // Permission denied or other error
        handleEnd();
      }
    };

    if (call.status !== "incoming" || call.incomingOffer) {
      setup();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEnd = () => {
    onSendSignal({ type: "end", senderId: myId });
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    onEnd();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff; });
    setVideoOff(v => !v);
  };

  // Apply incoming WebRTC signals (answer / ice candidates) to the peer connection
  useEffect(() => {
    if (!incomingSignal || !pcRef.current) return;
    const pc = pcRef.current;
    if (incomingSignal.type === "answer") {
      pc.setRemoteDescription(new RTCSessionDescription(incomingSignal.data as RTCSessionDescriptionInit)).catch(() => {});
      setConnected(true);
    } else if (incomingSignal.type === "ice") {
      pc.addIceCandidate(new RTCIceCandidate(incomingSignal.data as RTCIceCandidateInit)).catch(() => {});
    }
  }, [incomingSignal]);

  const isVideo = call.type === "video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      data-testid="call-screen"
    >
      {/* Video streams (video call) */}
      {isVideo && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-4 right-4 w-28 h-40 object-cover rounded-2xl border-2 border-white/20 z-10" />
        </>
      )}

      {/* Audio call UI */}
      {!isVideo && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <motion.div
            animate={{ scale: connected ? [1, 1.05, 1] : [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`rounded-full p-2 ${connected ? "ring-4 ring-green-500/30" : "ring-4 ring-primary/30"}`}
          >
            <img src={partnerAvatar} alt="" className="w-32 h-32 rounded-full object-cover" />
          </motion.div>
          <div className="text-center">
            <p className="text-white font-bold text-2xl">{partnerName}</p>
            <p className="text-white/60 text-sm mt-1">
              {call.status === "outgoing" ? "Calling..." : connected ? fmt(elapsed) : "Connecting..."}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={`flex items-center justify-center gap-5 pb-12 pt-6 ${isVideo ? "bg-gradient-to-t from-black/80 to-transparent" : ""}`}>
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${muted ? "bg-white/20" : "bg-white/10"}`}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={handleEnd}
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center"
          data-testid="button-end-call"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>

        {isVideo ? (
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${videoOff ? "bg-white/20" : "bg-white/10"}`}
          >
            {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        ) : (
          <button
            onClick={() => setSpeakerOff(s => !s)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${speakerOff ? "bg-white/20" : "bg-white/10"}`}
          >
            {speakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Incoming call overlay
export function IncomingCallOverlay({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
}: {
  callerName: string;
  callerAvatar: string;
  callType: CallType;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-4 right-4 z-50 bg-card/95 backdrop-blur border border-border rounded-2xl p-4 shadow-2xl"
      data-testid="incoming-call"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="ring-4 ring-green-500/40 rounded-full"
        >
          <img src={callerAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        </motion.div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{callerName}</p>
          <p className="text-xs text-muted-foreground">
            Incoming {callType === "video" ? "📹 video" : "📞 voice"} call...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className="w-11 h-11 bg-red-500/80 rounded-full flex items-center justify-center"
            data-testid="button-reject-call"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onAccept}
            className="w-11 h-11 bg-green-500/80 rounded-full flex items-center justify-center"
            data-testid="button-accept-call"
          >
            <Phone className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
