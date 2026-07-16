// FriendlyTeaching.cl — Text Reading Slide (Friendlytext® CLT)
//
// Shows the source text. If a YouTube URL is set, embeds the video above
// the text and (when timings are present) highlights the currently-spoken
// line via the player's postMessage timing. If instead an audioUrl is set,
// renders an inline <audio> player and highlights lines against its
// currentTime. Otherwise it's a plain reading pane.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; youtubeUrl?: string }

function toEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1`;
  return url;
}

export default function TextReadingSlide({ slide, youtubeUrl }: Props) {
  const txt = slide.textData;
  const text = slide.content ?? txt?.text ?? '';
  const timings = txt?.timings;

  const lines = useMemo(() => text.split('\n'), [text]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [showTranslate, setShowTranslate] = useState<boolean>(false);

  const embedUrl = (youtubeUrl ?? txt?.youtubeUrl) ? toEmbedUrl(youtubeUrl ?? txt!.youtubeUrl!) : null;
  const hostedAudioUrl = !embedUrl ? txt?.audioUrl : null; // YT takes precedence

  // Track hosted audio playhead → highlight the active line.
  useEffect(() => {
    if (!hostedAudioUrl || !timings || timings.length === 0) return;
    const el = audioRef.current;
    if (!el) return;

    const offset = txt?.syncOffsetSeconds ?? 0;
    let raf = 0;
    const tick = () => {
      const t = el.currentTime + offset;
      // Find the last timing that is <= current time.
      let idx = -1;
      for (let i = 0; i < timings.length; i++) {
        if (timings[i] <= t) idx = i;
        else break;
      }
      setCurrentIdx(idx);
      raf = requestAnimationFrame(tick);
    };
    const start = () => { raf = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(raf); };
    el.addEventListener('play', start);
    el.addEventListener('pause', stop);
    el.addEventListener('ended', stop);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('play', start);
      el.removeEventListener('pause', stop);
      el.removeEventListener('ended', stop);
    };
  }, [hostedAudioUrl, timings, txt?.syncOffsetSeconds]);

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4 bg-gradient-to-br from-[#F5F9FC] to-[#EEF3F8]">
      {/* Header — title + source badge */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-[#D9E6F0]">
        <div className="min-w-0">
          <p className="font-bold text-[#1B2C3F] text-lg leading-tight truncate">
            {txt?.title ?? slide.title ?? 'Reading'}
          </p>
          <p className="text-[#4B6A85] text-sm truncate">{txt?.source ?? ''}</p>
        </div>
        <span className="flex-shrink-0 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4B6A85] bg-[#EEF3F8] border border-[#D9E6F0] px-3 py-1 rounded-full">
          Friendlytext®
        </span>
      </div>

      {/* YouTube embed (takes precedence over hosted audio) */}
      {embedUrl && (
        <div className="rounded-2xl overflow-hidden shadow-md aspect-video bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Hosted audio player */}
      {hostedAudioUrl && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-[#4B6A85] uppercase tracking-wider">
            Audio {txt?.audioSource === 'tts' ? '· ElevenLabs TTS' : ''}
          </p>
          <audio
            ref={audioRef}
            controls
            src={hostedAudioUrl}
            className="w-full h-10 accent-[#1B2C3F]"
          />
        </div>
      )}

      {/* Reading pane */}
      <div className="bg-white rounded-2xl border border-[#D9E6F0] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#4B6A85] uppercase tracking-wider">Text</p>
          <button
            onClick={() => setShowTranslate(v => !v)}
            className="text-[11px] font-semibold text-[#1B2C3F] hover:underline"
          >
            {showTranslate ? 'Hide help ▲' : 'Show reading tips ▼'}
          </button>
        </div>
        <div className="font-serif text-[15px] md:text-base text-[#1B2C3F] leading-[1.9] whitespace-pre-wrap">
          {lines.map((line, i) => {
            const isBlank = line.trim() === '';
            const isActive = i === currentIdx;
            const wasActive = i < currentIdx;
            return (
              <div
                key={i}
                className={[
                  'transition-all duration-300 rounded-md px-1',
                  isBlank ? 'h-2' : '',
                  isActive
                    ? 'bg-[#FFF6D6] text-[#1B2C3F] font-semibold shadow-[inset_0_-2px_0_#F1C40F]'
                    : wasActive && timings && timings.length > 0
                      ? 'text-[#4B6A85]'
                      : '',
                ].join(' ')}
              >
                {isBlank ? ' ' : line}
              </div>
            );
          })}
        </div>
        {showTranslate && (
          <div className="mt-4 p-3 rounded-xl bg-[#EEF3F8] border border-[#D9E6F0] text-[13px] text-[#4B6A85] leading-relaxed">
            💡 Read it once for the gist. Then read it again — this time
            underline any word you don&apos;t recognise, and try to guess its
            meaning from context before you check.
          </div>
        )}
      </div>
    </div>
  );
}
