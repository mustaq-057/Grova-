import { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";

export function AudioMessage({ audioData, isMe }: { audioData: string; isMe: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [waveform, setWaveform] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bars = [3, 5, 8, 6, 9, 7, 5, 8, 6, 4, 7, 5, 3, 6, 8, 5, 7, 4, 6, 3];

  const toggle = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioData);
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress(audio.currentTime / audio.duration);
        }
      };
      // Generate waveform when audio loads
      generateWaveform(audio);
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error("Audio playback failed:", err));
      setPlaying(true);
    }
  };

  const generateWaveform = async (audio: HTMLAudioElement) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const response = await fetch(audioData);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 50; // Number of bars in waveform
      const blockSize = Math.floor(channelData.length / samples);
      const waveformBars: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        const average = sum / blockSize;
        waveformBars.push(Math.min(average * 10, 1)); // Scale to 0-1 range
      }
      
      setWaveform(waveformBars);
    } catch (error) {
      console.error("Failed to generate waveform:", error);
      // Fallback to random bars if waveform generation fails
      setWaveform(bars.map(() => Math.random()));
    }
  };

  const transcribeAudio = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

    setTranscribing(true);
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      let finalTranscript = '';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setTranscribing(false);
      };

      recognition.onend = () => {
        setTranscribing(false);
      };

      // Play audio while transcribing
      if (!audioRef.current) {
        const audio = new Audio(audioData);
        audioRef.current = audio;
      }
      audioRef.current.play();
      setPlaying(true);

      recognition.start();

      // Stop recognition when audio ends
      audioRef.current.onended = () => {
        recognition.stop();
        setPlaying(false);
        setProgress(0);
      };
    } catch (error) {
      console.error("Transcription failed:", error);
      setTranscribing(false);
    }
  };

  // Cleanup on unmount to prevent memory leaks and sound leaks
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={toggle}
        className={`flex items-center gap-3 px-3 py-2.5 min-w-[170px] transition-all hover:bg-black/5 active:scale-[0.98] ${
          isMe ? "text-white/95" : "text-foreground"
        }`}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        <style>{`
          @keyframes waveAnimation {
            0%, 100% { transform: scaleY(0.4); }
            50% { transform: scaleY(1.1); }
          }
        `}</style>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${
            isMe ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          } ${playing ? "scale-105" : ""}`}
        >
          {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </div>
        <div className="flex gap-0.5 items-center h-6 shrink-0">
          {waveform.length > 0 ? (
            waveform.map((amplitude, i) => {
              const isActive = progress > 0 && (i / waveform.length) <= progress;
              return (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-colors duration-150 ${
                    isMe
                      ? isActive
                        ? "bg-white"
                        : "bg-white/40"
                      : isActive
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                  style={{
                    height: `${Math.max(4, amplitude * 24)}px`,
                    transformOrigin: "center",
                    animation: playing ? "waveAnimation 1.2s ease-in-out infinite" : "none",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              );
            })
          ) : (
            bars.map((h, i) => {
              const isActive = progress > 0 && (i / bars.length) <= progress;
              return (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-colors duration-150 ${
                    isMe
                      ? isActive
                        ? "bg-white"
                        : "bg-white/40"
                      : isActive
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                  style={{
                    height: `${h}px`,
                    transformOrigin: "center",
                    animation: playing ? "waveAnimation 1.2s ease-in-out infinite" : "none",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              );
            })
          )}
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase opacity-70 shrink-0">Voice</span>
      </button>
      <button
        onClick={transcribeAudio}
        disabled={transcribing}
        className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all ${
          transcribing
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-black/5 active:scale-[0.98]"
        } ${isMe ? "text-white/80" : "text-foreground/70"}`}
        aria-label="Transcribe voice message"
      >
        <Mic className="w-3.5 h-3.5" />
        {transcribing ? "Transcribing..." : "Transcribe"}
      </button>
      {transcript && (
        <p className="text-xs px-3 py-2 bg-black/5 rounded-lg max-w-[250px]">
          {transcript}
        </p>
      )}
    </div>
  );
}
