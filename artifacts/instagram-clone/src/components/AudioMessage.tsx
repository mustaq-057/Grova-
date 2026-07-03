import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Mic, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAudioPlayer } from "@/lib/audio-player-context";
import {
  isTranscriptionSupported,
  transcribeFromAudioUrl,
  type TranscriptSegment,
} from "@/lib/voice-transcribe";

const STATIC_BARS = [4, 6, 9, 7, 10, 8, 6, 9, 7, 5, 8, 6, 4, 7, 9, 6, 8, 5, 7, 4];

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioMessage({
  audioData,
  isMe,
  hideTranscribe = false,
}: {
  audioData: string;
  isMe: boolean;
  hideTranscribe?: boolean;
}) {
  const player = useAudioPlayer();
  const [duration, setDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [waveform, setWaveform] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const isPlayingHere = player.currentUrl === audioData && player.playing;
  const progress = isPlayingHere && player.duration ? player.currentTime / player.duration : 0;
  const currentTime = isPlayingHere ? player.currentTime : 0;
  const playing = isPlayingHere;
  const displayDuration = isPlayingHere && player.duration ? player.duration : duration;

  const toggle = () => {
    if (waveform.length === 0) void generateWaveform();
    player.toggle(audioData, { title: isMe ? "Your Voice Note" : "Voice Note" });
  };

  const seekTo = (seconds: number) => {
    if (player.currentUrl !== audioData) {
      player.play(audioData, { title: isMe ? "Your Voice Note" : "Voice Note" });
    }
    player.seekTo(seconds);
  };

  const generateWaveform = useCallback(async () => {
    if (waveform.length > 0) return;
    
    // Memory optimization: Do not decode audio data for long recordings (e.g., > 60 seconds)
    if (duration > 60) {
      const samples = 24;
      const seedStr = audioData;
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
      }
      const pseudoRandomBars = Array.from({ length: samples }).map((_, i) => {
        const val = Math.abs(Math.sin(hash + i * 1.3)) * 0.7 + 0.2;
        return val;
      });
      setWaveform(pseudoRandomBars);
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      // Note: Do not resume audio context here as it requires user gesture, 
      // decoding audio data works without resuming.
      const response = await fetch(audioData);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const samples = 24;
      const blockSize = Math.max(1, Math.floor(channelData.length / samples));
      const waveformBars: number[] = [];
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j] ?? 0);
        }
        waveformBars.push(Math.min((sum / blockSize) * 10, 1));
      }
      setWaveform(waveformBars);
      if (!duration && Number.isFinite(audioBuffer.duration)) setDuration(audioBuffer.duration);
    } catch {
      setWaveform(STATIC_BARS.map((v) => Math.min(1, (v / 10) + Math.random() * 0.2)));
    }
  }, [audioData, duration, waveform.length]);

  const transcribeAudio = async () => {
    if (!isTranscriptionSupported()) {
      toast.error("Speech recognition is not supported here. Try Chrome on Android.");
      return;
    }
    setTranscribing(true);
    setTranscript("");
    setSegments([]);
    try {
      const result = await transcribeFromAudioUrl(audioData, (text, segs) => {
        setTranscript(text);
        setSegments(segs);
      });
      if (!result.text.trim()) {
        toast.message("No speech detected", {
          description: "Try speaking closer to the mic when recording, or use Chrome.",
        });
      } else {
        setTranscript(result.text);
        setSegments(result.segments);
      }
    } catch (error) {
      console.error("Transcription failed:", error);
      toast.error("Could not transcribe this voice note", {
        description:
          "Playback transcription is limited on mobile. Record again and speak clearly, or use Chrome on desktop.",
      });
    } finally {
      setTranscribing(false);
    }
  };

  useEffect(() => {
    if (duration > 0) return;
    const audio = new Audio(audioData);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      if (audio.duration === Infinity) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration);
          audio.currentTime = 0;
        };
      } else if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
  }, [audioData, duration]);

  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (waveform.length > 0) return;
    const current = containerRef.current;
    if (!current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          void generateWaveform();
          observer.disconnect();
        }
      },
      { rootMargin: "100px 0px" } // trigger slightly before it comes into view
    );

    observer.observe(current);
    return () => observer.disconnect();
  }, [generateWaveform, waveform.length]);

  const bars = waveform.length > 0 ? waveform : STATIC_BARS;
  const barHeights = bars.map((a) => Math.max(3, Math.min(16, (typeof a === "number" ? a : 0.5) * 16)));
  const timeLabel = `${formatAudioTime(currentTime)} / ${formatAudioTime(displayDuration)}`;

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 max-w-[min(280px,88vw)]">
      <div
        className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl overflow-hidden ${
          isMe ? "bg-white/15" : "bg-primary/10"
        }`}
      >
        <button
          type="button"
          onClick={() => void toggle()}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform ${
            isMe ? "bg-white/25 text-white" : "bg-primary/15 text-primary"
          } ${playing ? "scale-105" : ""}`}
          aria-label={playing ? "Pause voice message" : "Play voice message"}
        >
          {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div 
          className="flex-1 min-w-0 flex items-center gap-0.5 h-5 overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (!displayDuration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, clickX / rect.width));
            seekTo(percentage * displayDuration);
          }}
        >
          {barHeights.map((h, i) => {
            const isActive = progress > 0 && i / barHeights.length <= progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full shrink-0 transition-all duration-300 ease-in-out ${
                  isMe
                    ? isActive
                      ? "bg-white"
                      : "bg-white/35"
                    : isActive
                      ? "bg-primary"
                      : "bg-muted-foreground/25"
                }`}
                style={{
                  height: `${h}px`,
                  transform: playing && isActive ? `scaleY(${1 + Math.sin(currentTime * 10 + i * 0.5) * 0.25})` : "scaleY(1)",
                  transformOrigin: "center",
                }}
              />
            );
          })}
        </div>

        <div className="flex flex-col items-end shrink-0 gap-0.5">
          <span className={`text-[10px] tabular-nums ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
            {timeLabel}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              player.setPlaybackRate(player.playbackRate === 1 ? 1.5 : player.playbackRate === 1.5 ? 2 : 1);
            }}
            className={`text-[9px] font-bold px-1 py-0.5 rounded transition-colors ${
              isMe 
                ? "bg-white/10 hover:bg-white/20 text-white/80" 
                : "bg-black/5 hover:bg-black/10 text-muted-foreground"
            }`}
          >
            {player.playbackRate}x
          </button>
        </div>
      </div>

      {!hideTranscribe ? (
        <button
          type="button"
          onClick={() => void transcribeAudio()}
          disabled={transcribing}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg w-fit transition-all ${
            transcribing ? "opacity-50 cursor-not-allowed" : "hover:bg-black/5 active:scale-[0.98]"
          } ${isMe ? "text-white/75" : "text-foreground/65"}`}
          aria-label="Transcribe voice message"
        >
          <Mic className="w-3.5 h-3.5" />
          {transcribing ? "Transcribing…" : "Transcribe"}
        </button>
      ) : null}

      {!hideTranscribe && segments.length > 0 ? (
        <div
          className={`text-xs rounded-lg max-w-full space-y-1 px-2 py-2 ${isMe ? "bg-white/10 text-white/90" : "bg-black/5"}`}
        >
          {segments.map((seg, i) => (
            <button
              key={`${seg.start}-${i}`}
              type="button"
              onClick={() => void seekTo(seg.start)}
              className={`flex gap-2 w-full text-left rounded-md px-1 py-0.5 transition-colors ${
                isMe ? "hover:bg-white/15" : "hover:bg-black/5"
              }`}
            >
              <span className={`tabular-nums shrink-0 font-medium ${isMe ? "text-white/60" : "text-primary/80"}`}>
                {formatAudioTime(seg.start)}
              </span>
              <span className="break-words">{seg.text}</span>
            </button>
          ))}
        </div>
      ) : !hideTranscribe && transcript ? (
        <p className={`text-xs px-3 py-2 rounded-lg max-w-full break-words ${isMe ? "bg-white/10 text-white/90" : "bg-black/5"}`}>
          {transcript}
        </p>
      ) : null}
    </div>
  );
}
