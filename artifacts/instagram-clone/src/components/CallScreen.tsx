import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, Volume1, VolumeX, SwitchCamera, ChevronDown, AlertCircle, MonitorUp, PictureInPicture, Gauge } from "lucide-react";
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [poorConnection, setPoorConnection] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [audioOutput, setAudioOutput] = useState<"speaker" | "earpiece">("speaker");
  const [lowDataMode, setLowDataMode] = useState(false);
  
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringbackAudioRef = useRef<HTMLAudioElement | null>(null);
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
    
    // Attempt to load real MP3 ringtones
    const ringtone = new Audio("/sounds/ringtone.mp3");
    const ringback = new Audio("/sounds/ringback.mp3");
    ringtone.loop = true;
    ringback.loop = true;
    ringtoneAudioRef.current = ringtone;
    ringbackAudioRef.current = ringback;
    
    return () => { 
      void ctx.close(); 
      ringtone.pause();
      ringtone.src = "";
      ringback.pause();
      ringback.src = "";
    };
  }, []);

  // Ringing logic
  useEffect(() => {
    if (connected || !audioCtxRef.current) {
      if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
      ringtoneAudioRef.current?.pause();
      ringbackAudioRef.current?.pause();
      return;
    }
    
    const isOutgoing = call.status === "outgoing";
    let mp3Playing = false;
    
    // Try to play MP3
    const audioEl = isOutgoing ? ringbackAudioRef.current : ringtoneAudioRef.current;
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.play().then(() => {
        mp3Playing = true;
      }).catch((err) => {
        console.log("MP3 ringtone missing or failed to play, falling back to synthesizer.", err);
        // Fallback to synthesizer
        const play = () => playRingtone(audioCtxRef.current!, isOutgoing);
        play(); // Play immediately
        ringingIntervalRef.current = setInterval(play, isOutgoing ? 4000 : 2000);
      });
    }

    return () => {
      if (ringingIntervalRef.current) clearInterval(ringingIntervalRef.current);
      audioEl?.pause();
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

  // Timer and Network Stats
  useEffect(() => {
    if (!connected) return;
    startTimeRef.current = Date.now();
    
    // Timer
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    
    // Network Stats Polling
    const statsIv = setInterval(() => {
      if (!pcRef.current) return;
      pcRef.current.getStats().then((stats) => {
        let hasPoorConnection = false;
        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            // Check RTT (Round Trip Time)
            if (report.currentRoundTripTime > 0.5) { // 500ms
              hasPoorConnection = true;
            }
          }
          if (report.type === "inbound-rtp" && report.kind === "video") {
            // Spikes in packet loss
            if (report.packetsLost > 50) { // arbitrary threshold for recent spikes
              hasPoorConnection = true;
            }
          }
        });
        setPoorConnection(hasPoorConnection);
      }).catch(() => {});
    }, 3000);

    return () => {
      clearInterval(iv);
      clearInterval(statsIv);
      setPoorConnection(false);
    };
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

  // Orphaned call prevention: Send end signal if the tab is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      const blob = new Blob([JSON.stringify({ type: "end", senderId: myId })], { type: "application/json" });
      navigator.sendBeacon("/api/call/signal", blob);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [myId]);

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
          if (pc.connectionState === "connected") {
            setConnected(true);
            setIsReconnecting(false);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          }
          if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
            void handleIceRestart();
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
        if (isMounted) {
          alert("Failed to access camera or microphone. The call could not be established.");
          handleEnd();
        }
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

  const toggleScreenShare = async () => {
    if (call.type !== "video" || !localStreamRef.current) return;
    try {
      if (isScreenSharing) {
        // Stop screen share, go back to camera
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing },
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
          
          setIsScreenSharing(false);
        }
      } else {
        // Start screen share
        const newStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        const videoTrack = newStream.getVideoTracks()[0];
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        
        videoTrack.onended = () => {
          // If user stops sharing via browser UI, revert
          void toggleScreenShare();
        };

        if (pcRef.current && videoTrack && oldTrack) {
          const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(videoTrack);
          
          localStreamRef.current.removeTrack(oldTrack);
          localStreamRef.current.addTrack(videoTrack);
          oldTrack.stop();
          
          setIsScreenSharing(true);
        }
      }
    } catch (err) {
      console.error("Failed to toggle screen share", err);
    }
  };

  const handleIceRestart = useCallback(async () => {
    if (!pcRef.current) return;
    setIsReconnecting(true);
    try {
      if (typeof pcRef.current.restartIce === "function") {
        pcRef.current.restartIce();
        const offer = await pcRef.current.createOffer({ iceRestart: true });
        await pcRef.current.setLocalDescription(offer);
        onSendSignal({ type: "offer", senderId: myId, sdp: offer, callType: call.type });
      }
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        handleEnd();
      }, 15000);
    } catch (e) {
      console.error("ICE Restart failed", e);
      handleEnd();
    }
  }, [myId, call.type, onSendSignal, handleEnd]);

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (remoteVideoRef.current && document.pictureInPictureEnabled) {
        await remoteVideoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP failed", err);
    }
  };

  const toggleAudioOutput = async () => {
    const nextMode = audioOutput === "speaker" ? "earpiece" : "speaker";
    setAudioOutput(nextMode);
    
    if (remoteAudioRef.current && typeof (remoteAudioRef.current as any).setSinkId === "function") {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === "audiooutput");
        const earpiece = outputs.find(d => d.deviceId === "communications" || d.label.toLowerCase().includes("earpiece"));
        const speaker = outputs.find(d => d.deviceId === "default" || d.label.toLowerCase().includes("speaker"));
        
        const targetId = nextMode === "earpiece" ? (earpiece?.deviceId || "") : (speaker?.deviceId || "");
        await (remoteAudioRef.current as any).setSinkId(targetId);
      } catch (err) {
        console.error("Failed to set audio output", err);
      }
    }
  };

  const toggleLowDataMode = async () => {
    if (!pcRef.current || call.type !== "video") return;
    const nextMode = !lowDataMode;
    setLowDataMode(nextMode);
    
    try {
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
      if (sender && sender.track) {
        const params = sender.getParameters();
        if (!params.encodings) params.encodings = [{}];
        
        if (nextMode) {
          params.encodings[0].maxBitrate = 150000;
          params.encodings[0].scaleResolutionDownBy = 2;
        } else {
          delete params.encodings[0].maxBitrate;
          params.encodings[0].scaleResolutionDownBy = 1;
        }
        await sender.setParameters(params);
      }
    } catch (err) {
      console.error("Failed to set Low Data Mode", err);
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

  if (isMinimized) {
    return (
      <motion.div
        drag
        dragConstraints={{ top: 20, left: 20, right: window.innerWidth - 140, bottom: window.innerHeight - 180 }}
        className="fixed top-20 right-4 z-[200] w-[120px] h-[160px] rounded-[24px] overflow-hidden shadow-2xl bg-zinc-900 border-2 border-white/20 cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <audio ref={remoteAudioRef} autoPlay playsInline className="sr-only" aria-hidden />
        {isVideo ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 backdrop-blur-md">
            <img src={partnerAvatar} alt="" className="w-12 h-12 rounded-full object-cover mb-2 ring-2 ring-white/20" />
            <p className="text-white text-[10px] font-medium">{formatTime(elapsed)}</p>
          </div>
        )}
        {poorConnection && (
          <div className="absolute top-2 right-2 bg-red-500/90 p-1 rounded-full shadow-sm">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden"
      data-testid="call-screen"
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="sr-only" aria-hidden />

      {isReconnecting && (
        <div className="absolute inset-0 z-[250] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white font-medium text-lg drop-shadow-lg">Reconnecting...</p>
        </div>
      )}

      {poorConnection && !isReconnecting && (
        <div className="absolute top-[80px] inset-x-0 z-[200] flex justify-center pointer-events-none">
          <div className="bg-red-500/90 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm animate-pulse">
            <AlertCircle className="w-4 h-4" />
            Poor connection...
          </div>
        </div>
      )}

      {isVideo ? (
        // --- VIDEO CALL UI (Instagram Style) ---
        <div className="relative w-full h-full flex flex-col">
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0 bg-zinc-900">
            {!connected && (
              <div className="relative w-full h-full flex flex-col items-center justify-center z-10 pt-10">
                <div className="absolute top-safe left-4 mt-4 z-20">
                  <button 
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
                    onClick={() => setIsMinimized(true)}
                    title="Minimize Call"
                  >
                    <ChevronDown className="w-6 h-6 text-white" />
                  </button>
                </div>
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 ring-4 ring-white/10 shadow-2xl z-10 relative">
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
                onClick={() => setIsMinimized(true)}
                title="Minimize Call"
              >
                <ChevronDown className="w-6 h-6 text-white" />
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
          <div className="absolute bottom-0 inset-x-0 pb-safe pt-24 bg-gradient-to-t from-black/80 to-transparent z-20 flex justify-center items-end pb-8 gap-4 px-2 overflow-x-auto snap-x no-scrollbar">
            <div className="flex gap-4 px-4 snap-center items-end">
              <ControlButton icon={videoOff ? <VideoOff /> : <Video />} onClick={toggleVideo} active={videoOff} label="Video" />
              <ControlButton icon={muted ? <MicOff /> : <Mic />} onClick={toggleMute} active={muted} label="Mute" />
              <ControlButton icon={<SwitchCamera />} onClick={flipCamera} label="Flip" />
              <ControlButton icon={<MonitorUp />} onClick={toggleScreenShare} active={isScreenSharing} label="Share" />
              <ControlButton icon={<PictureInPicture />} onClick={togglePiP} label="PiP" />
              <ControlButton icon={<Gauge />} onClick={toggleLowDataMode} active={lowDataMode} label={lowDataMode ? "Data Saver" : "HD"} />
              <button
                onClick={handleEnd}
                className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 hover:bg-red-600 shadow-lg shrink-0 ml-2"
              >
                <PhoneOff fill="currentColor" stroke="none" className="w-6 h-6" />
              </button>
            </div>
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
              <ControlButton icon={audioOutput === "speaker" ? <Volume2 /> : <Volume1 />} onClick={toggleAudioOutput} active={audioOutput === "speaker"} label={audioOutput === "speaker" ? "Speaker" : "Earpiece"} />
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
