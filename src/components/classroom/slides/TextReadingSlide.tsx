// FriendlyTeaching.cl — Friendlytext®: Reading slide
//
// The workhorse of a text lesson. Shows the source text in a book-like
// pane; optionally embeds a YouTube video above (takes precedence) or
// renders a custom audio player against `textData.audioUrl`. When timings
// are present + hosted audio is playing, the current line highlights in
// warm amber like a karaoke sing-along.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; youtubeUrl?: string }

function toEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1`;
  return url;
}

function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TextReadingSlide({ slide, youtubeUrl }: Props) {
  const txt = slide.textData;
  const text = slide.content ?? txt?.text ?? '';
  const timings = txt?.timings;

  const lines = useMemo(() => text.split('\n'), [text]);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showTips, setShowTips] = useState(false);

  const embedUrl = (youtubeUrl ?? txt?.youtubeUrl) ? toEmbedUrl(youtubeUrl ?? txt!.youtubeUrl!) : null;
  const hostedAudioUrl = !embedUrl ? txt?.audioUrl : null;

  // Track hosted audio playhead → highlight active line + drive progress bar.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const offset = txt?.syncOffsetSeconds ?? 0;
    let raf = 0;
    const tick = () => {
      const t = el.currentTime + offset;
      setProgress(el.currentTime);
      if (timings && timings.length > 0) {
        let idx = -1;
        for (let i = 0; i < timings.length; i++) {
          if (timings[i] <= t) idx = i;
          else break;
        }
        setCurrentIdx(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    const onPlay  = () => { setPlaying(true);  raf = requestAnimationFrame(tick); };
    const onPause = () => { setPlaying(false); cancelAnimationFrame(raf); };
    const onLoaded = () => setDuration(el.duration || 0);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onPause);
    el.addEventListener('loadedmetadata', onLoaded);
    // First frame in case the audio auto-plays.
    if (!el.paused) onPlay();
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onPause);
      el.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [hostedAudioUrl, timings, txt?.syncOffsetSeconds]);

  // Auto-scroll the reading pane to keep the active line in view.
  useEffect(() => {
    if (currentIdx < 0) return;
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIdx]);

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => { /* browser blocked */ });
    else el.pause();
  }

  function scrub(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * duration;
  }

  const totalLabel = duration ? fmtTime(duration) : '';
  const progressPct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-[#F5EFE1]">
      {/* Paper-texture wash so the background feels warmer than flat */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 25%, rgba(232,181,71,0.12) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(75,106,133,0.08) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 flex flex-col h-full overflow-auto p-4 md:p-6 gap-4">

        {/* ── Header card ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-[#E8D9BE]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E8B547] to-[#C89234] text-[#3A2A0F] flex items-center justify-center text-xl shadow-md flex-shrink-0">
              📖
            </div>
            <div className="min-w-0">
              <p className="font-serif font-bold text-[#1B2C3F] text-lg leading-tight truncate">
                {txt?.title ?? slide.title ?? 'Reading'}
              </p>
              <p className="text-[#4B6A85] text-sm truncate italic">{txt?.source ?? ''}</p>
            </div>
          </div>
          <span className="flex-shrink-0 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#3A2A0F] bg-[#E8B547] border border-[#C89234] px-3 py-1.5 rounded-full shadow-sm">
            Friendlytext®
          </span>
        </div>

        {/* ── Media: YouTube embed OR custom audio player ────────── */}
        {embedUrl && (
          <div className="rounded-2xl overflow-hidden shadow-lg aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {hostedAudioUrl && (
          <div className="rounded-2xl bg-gradient-to-r from-[#1B2C3F] to-[#2C4159] shadow-lg px-4 py-3 text-white">
            <audio ref={audioRef} src={hostedAudioUrl} preload="metadata" className="hidden" />
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-[#E8B547] text-[#3A2A0F] flex items-center justify-center text-lg font-bold shadow-md hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? '❚❚' : '▶'}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
                  <span>
                    {txt?.audioSource === 'tts' ? '🎙 ElevenLabs voice' : 'Audio narration'}
                  </span>
                  <span className="text-white/90 font-mono normal-case tracking-normal">
                    {fmtTime(progress)}{totalLabel ? ` / ${totalLabel}` : ''}
                  </span>
                </div>
                <div
                  onClick={scrub}
                  className="relative h-2 bg-white/15 rounded-full cursor-pointer group"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#E8B547] to-[#F4CC6C] transition-[width] duration-100"
                    style={{ width: `${progressPct}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progressPct}% - 6px)` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Reading pane ────────────────────────────────────────── */}
        <div className="relative bg-white rounded-2xl border border-[#E8D9BE] shadow-md">
          {/* Left margin decorative rule so it reads like a book page */}
          <div aria-hidden className="absolute left-6 top-6 bottom-6 w-px bg-[#E8B547]/40 hidden md:block" />
          <div className="flex items-center justify-between px-5 md:px-8 pt-5">
            <p className="text-[10px] font-extrabold text-[#4B6A85] uppercase tracking-[0.25em]">
              Reading
            </p>
            <button
              onClick={() => setShowTips(v => !v)}
              className="text-[11px] font-semibold text-[#4B6A85] hover:text-[#1B2C3F] transition-colors"
            >
              {showTips ? 'Ocultar tips ▲' : 'Reading tips ▼'}
            </button>
          </div>
          <div className="px-5 md:px-8 pb-8 pt-4">
            <div className="font-serif text-[16px] md:text-[18px] text-[#1F2937] leading-[1.85] whitespace-pre-wrap">
              {lines.map((line, i) => {
                const isBlank = line.trim() === '';
                const isActive = i === currentIdx;
                const wasActive = timings && timings.length > 0 && i < currentIdx;
                return (
                  <div
                    key={i}
                    ref={isActive ? activeLineRef : null}
                    className={[
                      'transition-all duration-300 rounded-lg px-2 -mx-2',
                      isBlank ? 'h-3' : '',
                      isActive
                        ? 'bg-gradient-to-r from-[#FFF6D6] via-[#FEF3C7] to-[#FFF6D6] text-[#1B2C3F] font-semibold shadow-[inset_3px_0_0_#E8B547]'
                        : wasActive
                          ? 'text-[#4B6A85]/85'
                          : '',
                    ].join(' ')}
                  >
                    {isBlank ? ' ' : line}
                  </div>
                );
              })}
            </div>

            {showTips && (
              <div className="mt-6 p-4 rounded-xl bg-[#F5EFE1] border border-[#E8D9BE] text-[13px] text-[#4B6A85] leading-relaxed">
                💡 <span className="font-semibold text-[#1B2C3F]">Read it twice.</span>{' '}
                First pass — for the gist and the emotional shape. Second pass — mark
                any word you don&apos;t know, then guess its meaning from context before
                you check it. Notice what the writer chose to <em>show</em> vs <em>tell</em>.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
