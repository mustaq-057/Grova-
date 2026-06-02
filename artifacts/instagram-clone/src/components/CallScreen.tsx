import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX, MonitorUp, MonitorOff } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

const DEFAULT_RTC: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const playRingingTone = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 440;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (err) {
    console.error("Failed to play ringing tone:", err);
  }
};

const playConnectedTone = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 600;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    console.error("Failed to play tone:", err);
  }
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
  onSendSignal: (data: {
    type: "offer" | "answer" | "ice" | "end" | "reject";
    senderId: string;
    [k: string]: unknown;
  }) => void;
  onEnd: () => void;
  onConnected?: () => void;
  incomingSignal?: { type: "answer" | "ice"; data: unknown; seq: number };
}

export default function CallScreen({
  call,
  partnerName,
  partnerAvatar,
  myId,
  onSendSignal,
  onEnd,
  onConnected,
  incomingSignal,
}: Props) {
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);
  const ringingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const startTimeRef = useRef<number>(0);
  const rtcConfigRef = useRef<RTCConfiguration>(DEFAULT_RTC);
  const onConnectedFiredRef = useRef(false);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const attachRemoteStream = (stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      void remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = speakerOff;
      void remoteAudioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (call.status !== "incoming" || connected) return;
    ringingIntervalRef.current = setInterval(playRingingTone, 1000);
    return () => {
      if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
    };
  }, [call.status, connected]);

  useEffect(() => {
    if (call.status !== "outgoing" || connected) return;
    ringingIntervalRef.current = setInterval(playRingingTone, 1500);
    return () => {
      if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
    };
  }, [call.status, connected]);

  useEffect(() => {
    if (connected && ringingIntervalRef.current) {
      clearInterval(ringingIntervalRef.current);
      playConnectedTone();
    }
  }, [connected]);

  useEffect(() => {
    if (!connected || onConnectedFiredRef.current) return;
    onConnectedFiredRef.current = true;
    onConnected?.();
  }, [connected, onConnected]);

  useEffect(() => {
    if (!connected) return;
    startTimeRef.current = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [connected]);

  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.muted = speakerOff;
  }, [speakerOff]);

  const cleanupMedia = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
  };

  const handleEnd = () => {
    if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
    onSendSignal({ type: "end", senderId: myId });
    cleanupMedia();
    onEnd();
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenSharing(false);
      if (localStreamRef.current && pcRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(videoTrack);
        }
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screenStream;
        if (pcRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender && videoTrack) await sender.replaceTrack(videoTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        }
        setScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          void toggleScreenShare();
        };
      } catch (err) {
        console.error("Failed to start screen sharing:", err);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const rtc = await api.getCallRtcConfig().catch(() => DEFAULT_RTC);
        if (isMounted && rtc.iceServers?.length) rtcConfigRef.current = rtc;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: call.type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(rtcConfigRef.current);
        pcRef.current = pc;
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (e) => {
          attachRemoteStream(e.streams[0] ?? new MediaStream([e.track]));
          setConnected(true);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            onSendSignal({ type: "ice", senderId: myId, candidate: e.candidate.toJSON() });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setConnected(true);
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
        }
      } catch {
        handleEnd();
      }
    };

    if (call.status !== "incoming" || call.incomingOffer) {
      void setup();
    }

    return () => {
      isMounted = false;
      cleanupMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per call session
  }, []);

  const toggleMute = () => {
    const nextMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !nextMuted;
    });
    setMuted(nextMuted);
  };

  const toggleVideo = () => {
    const nextOff = !videoOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !nextOff;
    });
    setVideoOff(nextOff);
  };

  useEffect(() => {
    const pc = pcRef.current;
    if (!incomingSignal || !pc) return;
    if (incomingSignal.type === "answer") {
      void pc
        .setRemoteDescription(new RTCSessionDescription(incomingSignal.data as RTCSessionDescriptionInit))
        .then(() => setConnected(true))
        .catch(() => {});
    } else if (incomingSignal.type === "ice") {
      void pc
        .addIceCandidate(new RTCIceCandidate(incomingSignal.data as RTCIceCandidateInit))
        .catch(() => {});
    }
  }, [incomingSignal?.seq]);

  const isVideo = call.type === "video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      data-testid="call-screen"
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="sr-only" aria-hidden />

      {isVideo && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-4 right-4 w-28 h-40 object-cover rounded-2xl border-2 border-white/20 z-10" />
          <div className="absolute top-6 left-0 right-0 text-center z-10 pointer-events-none">
            <p className="text-white font-semibold text-lg drop-shadow">{partnerName}</p>
            <p className="text-white/70 text-sm">{connected ? fmt(elapsed) : "Connecting…"}</p>
          </div>
        </>
      )}

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
              {call.status === "outgoing" ? "Calling…" : connected ? fmt(elapsed) : "Connecting…"}
            </p>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-center gap-5 pb-12 pt-6 ${isVideo ? "bg-gradient-to-t from-black/80 to-transparent relative z-20" : ""}`}>
        <button
          type="button"
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 ${muted ? "bg-red-500/20 border-2 border-red-500/50" : "bg-white/10 hover:bg-white/20"}`}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          type="button"
          onClick={handleEnd}
          className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white transition-all hover:bg-red-600 hover:scale-110 active:scale-95 shadow-lg shadow-red-500/50"
          data-testid="button-end-call"
          title="End call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        {isVideo ? (
          <>
            <button
              type="button"
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 ${videoOff ? "bg-red-500/20 border-2 border-red-500/50" : "bg-white/10 hover:bg-white/20"}`}
              title={videoOff ? "Turn on camera" : "Turn off camera"}
            >
              {videoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
            <button
              type="button"
              onClick={() => void toggleScreenShare()}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 ${screenSharing ? "bg-blue-500 border-2 border-blue-400" : "bg-white/10 hover:bg-white/20"}`}
              data-testid="button-screen-share"
              title={screenSharing ? "Stop screen share" : "Share screen"}
            >
              {screenSharing ? <MonitorOff className="w-6 h-6" /> : <MonitorUp className="w-6 h-6" />}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setSpeakerOff((s) => !s)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 ${speakerOff ? "bg-yellow-500/20 border-2 border-yellow-500/50" : "bg-white/10 hover:bg-white/20"}`}
            title={speakerOff ? "Turn on speaker" : "Turn off speaker"}
          >
            {speakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function IncomingCallOverlay({
  callerName,
  callerAvatar,
  callType,
  canAccept = true,
  onAccept,
  onReject,
}: {
  callerName: string;
  callerAvatar: string;
  callType: CallType;
  canAccept?: boolean;
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
          <img src={callerAvatar} alt={`Profile picture of ${callerName}`} className="w-12 h-12 rounded-full object-cover" />
        </motion.div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{callerName}</p>
          <p className="text-xs text-muted-foreground">
            Incoming {callType === "video" ? "video" : "voice"} call…
            {!canAccept ? " (connecting)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReject}
            className="w-11 h-11 bg-red-500/80 rounded-full flex items-center justify-center"
            data-testid="button-reject-call"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={!canAccept}
            className="w-11 h-11 bg-green-500/80 rounded-full flex items-center justify-center disabled:opacity-40"
            data-testid="button-accept-call"
          >
            <Phone className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
