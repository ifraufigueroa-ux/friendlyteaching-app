// FriendlyTeaching.cl — AudioPlayer
// Reusable audio player component for slides with play/pause/seek/speed controls.
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  src: string;
  label?: string;
  compact?: boolean;
}

export default function AudioPlayer({ src, label, compact = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => { setDuration(audio.duration); setLoaded(true); };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onError = () => setLoaded(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [src]);

  // Reset when src changes
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setLoaded(false);
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {/* blocked by browser */});
    }
    setPlaying(!playing);
  }, [playing]);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = parseFloat(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, [speed]);

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <audio ref={audioRef} src={src} preload="metadata" />
        <button
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[#C8A8DC] text-white hover:bg-[#9B7CB8] transition-colors text-sm flex-shrink-0"
        >
          {playing ? '⏸' : '▶'}
        </button>
        {loaded && (
          <span className="text-[11px] text-gray-400 font-mono">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#F0E5FF] to-[#FFFCF7] rounded-2xl p-3 border border-[#E0D5FF]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {label && (
        <p className="text-xs font-semibold text-[#5A3D7A] mb-2">{label}</p>
      )}

      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!loaded}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#C8A8DC] text-white hover:bg-[#9B7CB8] transition-colors disabled:opacity-40 flex-shrink-0 text-lg shadow-sm"
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Progress */}
        <div className="flex-1 space-y-1">
          <div className="relative h-2 bg-[#E0D5FF] rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[#9B7CB8] rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={seek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#9B7CB8] font-mono">
            <span>{fmt(currentTime)}</span>
            <span>{loaded ? fmt(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="px-2 py-1 text-[10px] font-bold text-[#5A3D7A] bg-white/60 rounded-lg hover:bg-white transition-colors flex-shrink-0"
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}
