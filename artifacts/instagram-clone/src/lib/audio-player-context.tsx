import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Play, Pause, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type PlaybackRate = 1 | 1.5 | 2;

interface AudioPlayerContextType {
  currentUrl: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  playbackRate: PlaybackRate;
  metadata: {
    senderId?: string;
    title?: string;
  } | null;
  play: (url: string, metadata?: AudioPlayerContextType["metadata"]) => void;
  pause: () => void;
  toggle: (url: string, metadata?: AudioPlayerContextType["metadata"]) => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState<PlaybackRate>(1);
  const [metadata, setMetadata] = useState<AudioPlayerContextType["metadata"]>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (Number.isFinite(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration === Infinity) {
        // Chrome bug workaround for webm duration
        audio.currentTime = 1e101;
        const onTimeUpdate = () => {
          audio.removeEventListener("timeupdate", onTimeUpdate);
          if (Number.isFinite(audio.duration)) {
            setDuration(audio.duration);
          }
          audio.currentTime = 0;
        };
        audio.addEventListener("timeupdate", onTimeUpdate);
      } else if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => setPlaying(false);
    const handlePlay = () => setPlaying(true);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, []);

  const play = (url: string, newMetadata?: AudioPlayerContextType["metadata"]) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentUrl !== url) {
      audio.src = url;
      audio.playbackRate = playbackRate;
      setCurrentUrl(url);
      setMetadata(newMetadata || null);
      setCurrentTime(0);
      setDuration(0);
    }
    audio.play().catch(console.error);
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const toggle = (url: string, newMetadata?: AudioPlayerContextType["metadata"]) => {
    if (currentUrl === url && playing) {
      pause();
    } else {
      play(url, newMetadata);
    }
  };

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Math.max(0, Math.min(seconds, audio.duration || seconds));
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const setPlaybackRate = (rate: PlaybackRate) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const closePlayer = () => {
    pause();
    setCurrentUrl(null);
  };

  const inChatView = window.location.pathname.startsWith("/chat");
  const showMiniPlayer = currentUrl && !inChatView;

  return (
    <AudioPlayerContext.Provider
      value={{
        currentUrl,
        playing,
        currentTime,
        duration,
        playbackRate,
        metadata,
        play,
        pause,
        toggle,
        seekTo,
        setPlaybackRate,
      }}
    >
      {children}
      <AnimatePresence>
        {showMiniPlayer && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-3 bg-secondary/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl"
          >
            <button
              onClick={() => toggle(currentUrl, metadata)}
              className="w-10 h-10 shrink-0 bg-primary/20 text-primary rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">
                {metadata?.title || "Voice Note"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/50 tabular-nums shrink-0">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
            <button
              onClick={closePlayer}
              className="p-2 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AudioPlayerContext.Provider>
  );
}
