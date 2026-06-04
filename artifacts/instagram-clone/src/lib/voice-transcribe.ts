/** Live mic dictation + normalized playback for file-based transcription (best-effort). */

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type TranscriptionResult = {
  text: string;
  segments: TranscriptSegment[];
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0?: { transcript?: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function isTranscriptionSupported(): boolean {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

function getSpeechRecognition(): SpeechRecognitionLike {
  const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
    .SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  if (!Ctor) throw new Error("Speech recognition not supported in this browser");
  return new Ctor();
}

/** Speak into the mic — accurate transcription for secret notes / compose fields. */
export function transcribeFromMicrophone(
  onPartial: (text: string, segments: TranscriptSegment[]) => void,
  lang = "en-US",
): { stop: () => void; promise: Promise<TranscriptionResult> } {
  const recognition = getSpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = "";
  const segments: TranscriptSegment[] = [];
  const startedAt = Date.now();
  let resolvePromise!: (value: TranscriptionResult) => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<TranscriptionResult>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0]?.transcript ?? "";
      if (event.results[i].isFinal) {
        const start = (Date.now() - startedAt) / 1000;
        finalText += chunk;
        const end = (Date.now() - startedAt) / 1000;
        const text = chunk.trim();
        if (text) segments.push({ start, end: Math.max(end, start + 0.3), text });
      } else interim += chunk;
    }
    onPartial((finalText + interim).trim(), [...segments]);
  };

  recognition.onerror = (event) => {
    if (event.error !== "aborted") rejectPromise(new Error(event.error));
  };

  recognition.onend = () => {
    resolvePromise({ text: finalText.trim(), segments });
  };

  recognition.start();

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    },
    promise,
  };
}

/** Normalize loud/quiet voice clips before playback (stable volume). */
export async function createNormalizedAudioUrl(sourceUrl: string): Promise<string> {
  const response = await fetch(sourceUrl);
  const arrayBuffer = await response.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const peak = decoded.getChannelData(0).reduce((max, s) => Math.max(max, Math.abs(s)), 0);
    const targetPeak = 0.85;
    const gain = peak > 0.01 ? Math.min(targetPeak / peak, 4) : 1.5;

    const offline = new OfflineAudioContext(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;

    const compressor = offline.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    const gainNode = offline.createGain();
    gainNode.gain.value = gain;

    source.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();
    const wavBlob = audioBufferToWav(rendered);
    return URL.createObjectURL(wavBlob);
  } finally {
    await ctx.close().catch(() => {});
  }
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length, true);

  let offset = 44;
  const channels = Array.from({ length: numChannels }, (_, i) => buffer.getChannelData(i));
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

/** Best-effort: play normalized audio while listening via mic (browser limitation). */
export async function transcribeFromAudioUrl(
  audioUrl: string,
  onPartial: (text: string, segments: TranscriptSegment[]) => void,
  lang = "en-US",
): Promise<TranscriptionResult> {
  if (!isTranscriptionSupported()) {
    throw new Error("Speech recognition not supported");
  }

  const normalizedUrl = await createNormalizedAudioUrl(audioUrl);
  const recognition = getSpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  let finalText = "";
  const segments: TranscriptSegment[] = [];
  let finished = false;

  return new Promise<TranscriptionResult>((resolve, reject) => {
    const audio = new Audio(normalizedUrl);
    audio.volume = 1;
    audio.setAttribute("playsinline", "true");

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          const t = audio.currentTime;
          const text = chunk.trim();
          if (text) {
            const last = segments[segments.length - 1];
            segments.push({
              start: last ? last.end : Math.max(0, t - 0.5),
              end: t,
              text,
            });
          }
          finalText += chunk;
        } else interim += chunk;
      }
      onPartial((finalText + interim).trim(), [...segments]);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") reject(new Error(event.error));
    };

    let timeout = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      URL.revokeObjectURL(normalizedUrl);
      resolve({ text: finalText.trim(), segments });
    };

    const fail = (err: unknown) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      URL.revokeObjectURL(normalizedUrl);
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      reject(err instanceof Error ? err : new Error("Transcription failed"));
    };

    timeout = window.setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        finish();
      }
    }, 90_000);

    recognition.onend = () => finish();

    audio.onended = () => {
      try {
        recognition.stop();
      } catch {
        finish();
      }
    };

    audio.onerror = () => fail(new Error("Could not play audio for transcription"));

    recognition.start();
    void audio.play().catch(fail);
  });
}
