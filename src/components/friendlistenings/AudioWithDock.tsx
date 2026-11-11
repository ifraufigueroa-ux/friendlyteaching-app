// Friendlistenings® — audio player with speed pills + floating dock.
//
// Lifted from the IELTS Listening mock's `AudioWithSpeed` + `FloatingAudioDock`
// pair and reskinned to the Friendlistenings purple/pink palette. Three
// things the native <audio controls> alone can't give us:
//
//   1. Playback-speed pills (0.75× / 0.85× / 1×). Students who find the
//      native dialogue too fast step it down without opening the browser's
//      three-dot menu.
//
//   2. Reliable seeking for the dialogue MP3s that come out of our
//      ElevenLabs concat pipeline. Those lack a Xing/Info header for the
//      full file, so the browser's time→byte mapping restarts at 0 on
//      seek. We transcode the MP3 to WAV in the browser (via Web Audio)
//      — WAV is linear PCM, so seek becomes pure math.
//
//   3. A compact floating dock that materialises when the inline card
//      scrolls past the viewport's top. Keeps play/pause, scrub, time
//      readout and speed within reach while the student answers the
//      gist/detail questions further down.
//
// Shared single source of truth is the <audio> element; the dock mirrors
// its state and pushes control calls back through props.

'use client';

import { useEffect, useRef, useState } from 'react';

const SPEED_OPTIONS: { label: string; rate: number }[] = [
  { label: '0.75×', rate: 0.75 },
  { label: '0.85×', rate: 0.85 },
  { label: '1×',    rate: 1.0  },
];

// Serialise an AudioBuffer (decoded in-browser) to a WAV blob with linear
// PCM 16-bit LE samples. See the component doc above for why WAV.
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels    = buffer.numberOfChannels;
  const sampleRate     = buffer.sampleRate;
  const numFrames      = buffer.length;
  const bytesPerSample = 2;
  const blockAlign     = numChannels * bytesPerSample;
  const byteRate       = sampleRate * blockAlign;
  const dataSize       = numFrames * blockAlign;
  const headerSize     = 44;

  const ab   = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(ab);
  const write = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  write(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  write(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));
  let offset = headerSize;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

function fmtClock(t: number): string {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export interface AudioWithDockProps {
  src:            string;
  /** Chip shown inside the floating dock so the student stays oriented
   *  (e.g. the lesson title). */
  floatingLabel?: string;
  autoPlay?:      boolean;
}

export default function AudioWithDock({
  src, floatingLabel, autoPlay,
}: AudioWithDockProps) {
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const anchorRef = useRef<HTMLDivElement  | null>(null);

  const [rate,        setRate]        = useState(1);
  const [playableSrc, setPlayableSrc] = useState<string | null>(null);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);

  // Telemetry mirrored from <audio>, consumed by the floating dock.
  const [playing,     setPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [showDock,    setShowDock]    = useState(false);

  // Transcode MP3 → WAV via the same-origin audio proxy. This bypasses
  // Firebase Storage's restrictive CORS and gives us seek that works.
  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;
    setPlayableSrc(null);
    setLoadError(null);
    setLoading(true);

    const proxied = `/api/audio-proxy?url=${encodeURIComponent(src)}`;
    (async () => {
      try {
        const res = await fetch(proxied);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const mp3Buffer = await res.arrayBuffer();
        if (cancelled) return;
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        try {
          const audioBuffer = await ctx.decodeAudioData(mp3Buffer.slice(0));
          if (cancelled) return;
          const wavBlob = audioBufferToWavBlob(audioBuffer);
          createdUrl = URL.createObjectURL(wavBlob);
          setPlayableSrc(createdUrl);
        } finally {
          ctx.close().catch(() => {});
        }
      } catch (err) {
        if (cancelled) return;
        // Fallback to the proxied URL — seek may misbehave but at least
        // playback keeps working.
        console.warn('[AudioWithDock] transcode to WAV failed, using proxied URL:', err);
        setPlayableSrc(proxied);
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [src]);

  // Keep the audio element in sync with the chosen rate.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, playableSrc]);

  // Playback telemetry wiring.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !playableSrc) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onDur  = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    el.addEventListener('timeupdate',     onTime);
    el.addEventListener('loadedmetadata', onDur);
    el.addEventListener('durationchange', onDur);
    return () => {
      el.removeEventListener('timeupdate',     onTime);
      el.removeEventListener('loadedmetadata', onDur);
      el.removeEventListener('durationchange', onDur);
    };
  }, [playableSrc]);

  // Dock materialises only once the inline card has scrolled off the top.
  useEffect(() => {
    if (!floatingLabel) return;
    const el = anchorRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setShowDock(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { root: null, threshold: 0, rootMargin: '0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [floatingLabel]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };
  const seek = (t: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(duration) || duration <= 0) return;
    el.currentTime = Math.max(0, Math.min(duration, t));
  };

  return (
    <>
      <div ref={anchorRef}>
        {playableSrc ? (
          <audio
            ref={audioRef}
            src={playableSrc}
            controls
            className="w-full"
            autoPlay={autoPlay}
            preload="auto"
            onLoadedMetadata={(e) => { (e.currentTarget as HTMLAudioElement).playbackRate = rate; }}
            onPlay={()  => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#4A2060]">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-[#9B72B8] border-t-transparent animate-spin" />
            {loading ? 'Preparing audio (decoding so seek works)…' : 'Loading audio…'}
          </div>
        )}
        {loadError && (
          <p className="text-[10px] mt-1 text-[#B23A5E]">
            We couldn&apos;t transcode the audio ({loadError}). It will still play, but seek may fail.
          </p>
        )}

        {/* Speed pills — always visible, students pick what matches their ear. */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#9B72B8]">
            Speed
          </span>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.rate}
                onClick={() => setRate(opt.rate)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors ${
                  rate === opt.rate
                    ? 'bg-[#9B72B8] text-white'
                    : 'bg-white text-[#4A2060] hover:bg-[#F0E5FF] border border-[#E8D8F5]'
                }`}
                aria-pressed={rate === opt.rate}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {floatingLabel && playableSrc && (
        <FloatingAudioDock
          label={floatingLabel}
          visible={showDock}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          rate={rate}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onRateChange={setRate}
        />
      )}
    </>
  );
}

function FloatingAudioDock({
  label, visible, playing, currentTime, duration, rate,
  onTogglePlay, onSeek, onRateChange,
}: {
  label:        string;
  visible:      boolean;
  playing:      boolean;
  currentTime:  number;
  duration:     number;
  rate:         number;
  onTogglePlay: () => void;
  onSeek:       (t: number) => void;
  onRateChange: (r: number) => void;
}) {
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const barRef = useRef<HTMLDivElement | null>(null);

  const handleSeek = (clientX: number) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div
      className={`fixed top-4 left-0 right-0 z-30 flex justify-center px-3 sm:px-4 pointer-events-none transition-all duration-150 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 invisible'
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto flex items-center gap-3 w-full max-w-3xl rounded-full border border-[#C8A8DC]/70 bg-[#F0E5FF]/95 shadow-xl ring-1 ring-black/5 backdrop-blur-md pl-1.5 pr-3 sm:pr-4 py-1.5">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? 'Pause audio' : 'Play audio'}
          className="w-9 h-9 rounded-full bg-[#9B72B8] text-white flex items-center justify-center shrink-0 hover:bg-[#4A2060] active:scale-95 transition"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <rect x="7"    y="5" width="3.5" height="14" rx="1" fill="currentColor" />
              <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
            </svg>
          )}
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-[10px] tabular-nums text-[#4A2060] shrink-0 w-8 text-right">
            {fmtClock(currentTime)}
          </span>
          <div
            ref={barRef}
            onClick={(e) => handleSeek(e.clientX)}
            onKeyDown={(e) => {
              if (duration <= 0) return;
              if (e.key === 'ArrowLeft')  { e.preventDefault(); onSeek(Math.max(0, currentTime - 5)); }
              if (e.key === 'ArrowRight') { e.preventDefault(); onSeek(Math.min(duration, currentTime + 5)); }
            }}
            role="slider"
            tabIndex={0}
            aria-label="Seek audio position"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.round(duration))}
            aria-valuenow={Math.round(currentTime)}
            className="relative flex-1 h-2 rounded-full bg-[#9B72B8]/20 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#9B72B8]/40"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#9B72B8]"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#9B72B8] shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${pct}% - 6px)` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[10px] tabular-nums text-[#4A2060]/70 shrink-0 w-8">
            {fmtClock(duration)}
          </span>
        </div>

        <span className="hidden md:inline-block text-[9px] font-black uppercase tracking-widest text-[#4A2060]/80 shrink-0 max-w-[14rem] truncate">
          {label}
        </span>

        <div className="hidden sm:flex gap-1 shrink-0">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.rate}
              onClick={() => onRateChange(opt.rate)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors ${
                rate === opt.rate
                  ? 'bg-[#9B72B8] text-white'
                  : 'bg-white text-[#4A2060] hover:bg-[#E0C8F0]'
              }`}
              aria-pressed={rate === opt.rate}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
