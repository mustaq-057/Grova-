import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX, SwitchCamera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const DEFAULT_RTC: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Instagram-style ringtone synthesizer
const playRingtone = (audioContext: AudioContext, isConnecting: boolean) => {
  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Modern dual-tone ring (European style, sounds elegant)
  if (isConnecting) {
    // Ringback tone (what caller hears) - 400Hz + 450Hz
    osc1.frequency.setValueAtTime(400, audioContext.currentTime);
    osc2.frequency.setValueAtTime(450, audioContext.currentTime);
    
    // 1 second on, 3 seconds off
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 1.0);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.1);
  } else {
    // Ringing tone (what callee hears) - Marimba style rapid sequence
    osc1.type = "sine";
    osc2.type = "triangle";
    
    const notes = [659.25, 523.25, 659.25, 783.99, 659.25]; // E5, C5, E5, G5, E5
    let startTime = audioContext.currentTime;
    
    notes.forEach((freq, i) => {
      osc1.frequency.setValueAtTime(freq, startTime + (i * 0.15));
      osc2.frequency.setValueAtTime(freq * 2, startTime + (i * 0.15)); // octave higher
      
      gainNode.gain.setValueAtTime(0, startTime + (i * 0.15));
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + (i * 0.15) + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + (i * 0.15) + 0.12);
    });
  }

  osc1.start(audioContext.currentTime);
  osc2.start(audioContext.currentTime);
  osc1.stop(audioContext.currentTime + (isConnecting ? 1.1 : 1.0));
  osc2.stop(audioContext.currentTime + (isConnecting ? 1.1 : 1.0));
};

export type CallType = "audio" | "video";
export type CallStatus = "incoming" | "outgoing" | "active";

export interface CallState {
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
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);
  const [isPipDragged, setIsPipDragged] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const startTimeRef = useRef<number>(0);
  const rtcConfigRef = useRef<RTCConfiguration>(DEFAULT_RTC);
  const onConnectedFiredRef = useRef(false);

  // Queue for ICE candidates that arrive before Remote Description is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const isRemoteDescriptionSet = useRef(false);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current && call.type === "video") {
      remoteVideoRef.current.srcObject = stream;
      void remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = speakerOff;
      void remoteAudioRef.current.play().catch(() => {});
    }
  }, [call.type, speakerOff]);

  // Audio Context Setup
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    return () => { void ctx.close(); };
  }, []);

  // Ringing logic
  useEffect(() => {
    if (connected || !audioCtxRef.current) {
      if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
      return;
    }
    
    const play = () => playRingtone(audioCtxRef.current!, call.status === "outgoing");
    play(); // Play immediately
    ringingIntervalRef.current = setInterval(play, call.status === "outgoing" ? 4000 : 2000);
    
    return () => {
      if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
    };
  }, [call.status, connected]);

  useEffect(() => {
    if (connected && !onConnectedFiredRef.current) {
      onConnectedFiredRef.current = true;
      onConnected?.();
      // Play a short connected beep
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.1);
        osc.start(audioCtxRef.current.currentTime);
        osc.stop(audioCtxRef.current.currentTime + 0.1);
      }
    }
  }, [connected, onConnected]);

  // Timer
  useEffect(() => {
    if (!connected) return;
    startTimeRef.current = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [connected]);

  // Speaker sync
  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.muted = speakerOff;
  }, [speakerOff]);

  const cleanupMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  const handleEnd = useCallback(() => {
    if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
    onSendSignal({ type: "end", senderId: myId });
    cleanupMedia();
    onEnd();
  }, [myId, onEnd, onSendSignal, cleanupMedia]);

  // WebRTC Setup
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const rtc = await api.getCallRtcConfig().catch(() => DEFAULT_RTC);
        if (isMounted && rtc.iceServers?.length) rtcConfigRef.current = rtc;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: call.type === "video" ? { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        
        localStreamRef.current = stream;
        if (localVideoRef.current && call.type === "video") {
          localVideoRef.current.srcObject = stream;
        }

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
          isRemoteDescriptionSet.current = true;
          
          // Flush ICE candidates queue
          while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          onSendSignal({ type: "answer", senderId: myId, sdp: answer });
        }
      } catch (err) {
        console.error("WebRTC setup failed:", err);
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
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !nextMuted; });
    setMuted(nextMuted);
  };

  const toggleVideo = () => {
    const nextOff = !videoOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !nextOff; });
    setVideoOff(nextOff);
  };

  const flipCamera = async () => {
    if (call.type !== "video" || !localStreamRef.current) return;
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false
      });
      const videoTrack = newStream.getVideoTracks()[0];
      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (pcRef.current && videoTrack && oldTrack) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);
        
        localStreamRef.current.removeTrack(oldTrack);
        localStreamRef.current.addTrack(videoTrack);
        oldTrack.stop();
        
        setCameraFacing(nextFacing);
      }
    } catch (err) {
      console.error("Failed to flip camera", err);
    }
  };

  // Signal Handling
  useEffect(() => {
    const pc = pcRef.current;
    if (!incomingSignal || !pc) return;
    
    if (incomingSignal.type === "answer") {
      void pc
        .setRemoteDescription(new RTCSessionDescription(incomingSignal.data as RTCSessionDescriptionInit))
        .then(() => {
          isRemoteDescriptionSet.current = true;
          setConnected(true);
          while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift();
            if (candidate) void pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        })
        .catch(() => {});
    } else if (incomingSignal.type === "ice") {
      const candidateInit = incomingSignal.data as RTCIceCandidateInit;
      if (isRemoteDescriptionSet.current) {
        void pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(() => {});
      } else {
        iceCandidateQueue.current.push(candidateInit);
      }
    }
  }, [incomingSignal?.seq]);

  const isVideo = call.type === "video";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden"
      data-testid="call-screen"
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="sr-only" aria-hidden />

      {isVideo ? (
        // --- VIDEO CALL UI (Instagram Style) ---
        <div className="relative w-full h-full flex flex-col">
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0 bg-zinc-900">
            {!connected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full overflow-hidden animate-pulse ring-4 ring-white/10">
                  <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity duration-500 ${connected ? 'opacity-100' : 'opacity-0'}`} 
            />
          </div>

          {/* Top Bar overlay */}
          <div className="absolute top-0 inset-x-0 pt-safe px-4 pb-12 bg-gradient-to-b from-black/60 to-transparent z-20 flex justify-between items-start pointer-events-none">
            <div className="mt-4 flex items-center gap-3 drop-shadow-md">
              <button 
                className="pointer-events-auto p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur"
                onClick={handleEnd}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </button>
              <div>
                <h2 className="text-white font-semibold text-lg leading-tight">{partnerName}</h2>
                <p className="text-white/80 text-sm font-medium">{connected ? formatTime(elapsed) : "Calling..."}</p>
              </div>
            </div>
            {/* Local Video PiP */}
            <motion.div 
              drag 
              dragConstraints={{ top: 0, left: -200, right: 0, bottom: 400 }}
              onDragStart={() => setIsPipDragged(true)}
              onDragEnd={() => setTimeout(() => setIsPipDragged(false), 200)}
              className="mt-4 pointer-events-auto rounded-[20px] overflow-hidden w-[100px] h-[150px] shadow-2xl bg-zinc-800 border-2 border-white/20 z-30"
            >
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''} ${videoOff ? 'opacity-0' : 'opacity-100'}`} 
              />
              {videoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <VideoOff className="w-8 h-8 text-white/50" />
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 inset-x-0 pb-safe pt-24 bg-gradient-to-t from-black/80 to-transparent z-20 flex justify-center items-end pb-8 gap-6 px-6">
            <ControlButton icon={videoOff ? <VideoOff /> : <Video />} onClick={toggleVideo} active={videoOff} label="Video" />
            <ControlButton icon={muted ? <MicOff /> : <Mic />} onClick={toggleMute} active={muted} label="Mute" />
            <ControlButton icon={<SwitchCamera />} onClick={flipCamera} label="Flip" />
            <button
              onClick={handleEnd}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 hover:bg-red-600 shadow-lg"
            >
              <PhoneOff fill="currentColor" stroke="none" className="w-7 h-7" />
            </button>
          </div>
        </div>
      ) : (
        // --- AUDIO CALL UI (Instagram Style) ---
        <div className="relative w-full h-full flex flex-col justify-between">
          {/* Frosted glass background */}
          <div className="absolute inset-0 z-0">
            <img src={partnerAvatar} alt="" className="w-full h-full object-cover opacity-50 blur-xl scale-110" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
          </div>

          <div className="relative z-10 flex flex-col items-center pt-safe mt-16 px-6 text-center">
            <motion.div
              animate={{ scale: connected ? 1 : [1, 1.05, 1] }}
              transition={{ repeat: connected ? 0 : Infinity, duration: 2 }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/10 mb-6"
            >
              <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
            </motion.div>
            <h2 className="text-white font-bold text-3xl mb-2 drop-shadow-md">{partnerName}</h2>
            <p className="text-white/80 text-lg font-medium drop-shadow-md">
              {call.status === "outgoing" ? "Calling..." : connected ? formatTime(elapsed) : "Connecting..."}
            </p>
          </div>

          {/* Bottom Controls */}
          <div className="relative z-10 pb-safe pb-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-6 mb-8">
              <ControlButton icon={speakerOff ? <VolumeX /> : <Volume2 />} onClick={() => setSpeakerOff(!speakerOff)} active={!speakerOff} label="Speaker" />
              <ControlButton icon={muted ? <MicOff /> : <Mic />} onClick={toggleMute} active={muted} label="Mute" />
            </div>
            <button
              onClick={handleEnd}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 hover:bg-red-600 shadow-lg shadow-red-500/20"
            >
              <PhoneOff fill="currentColor" stroke="none" className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ControlButton({ icon, onClick, active, label }: { icon: React.ReactNode, onClick: () => void, active?: boolean, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={onClick}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 backdrop-blur-md ${
          active ? "bg-white text-black" : "bg-white/15 text-white hover:bg-white/25"
        }`}
      >
        {icon}
      </button>
      <span className="text-white/80 text-xs font-medium">{label}</span>
    </div>
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
    <AnimatePresence>
      <motion.div
        initial={{ y: -150, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -150, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-safe mt-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[200] bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 rounded-[28px] p-4 shadow-2xl"
        data-testid="incoming-call"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 px-2">
            <div className="relative">
              <img src={callerAvatar} alt={callerName} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10" />
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 ring-2 ring-[#1c1c1e]">
                {callType === "video" ? <Video className="w-3 h-3 text-white" /> : <Phone className="w-3 h-3 text-white" fill="currentColor" />}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-lg leading-tight">{callerName}</p>
              <p className="text-white/60 text-sm">{callType === "video" ? "Incoming video call..." : "Incoming audio call..."}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onReject}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <PhoneOff className="w-5 h-5" /> Decline
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={!canAccept}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Phone className="w-5 h-5" fill="currentColor" /> Accept
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
