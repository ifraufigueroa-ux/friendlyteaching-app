// FriendlyTeaching.cl — Predictions slide (shared)
//
// Rendered by three brands. FriendlyTales gets a per-slide theme toggle:
//   · dark  → Cinematic Mystery layout (hero card + column question
//             cards with magenta index chip + gold textarea).
//   · light → Original gamified layout with white cards and gradient
//             CTAs (kept intact for Friendlyrics / Friendlyflix).
'use client';
import { useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';
import { pickTextTheme, pickMusicTheme } from './reflection/reflectionThemes';
import SlideThemeToggle from '../SlideThemeToggle';
import { useSlideThemeMode } from '@/lib/hooks/useSlideThemeMode';

interface Props {
  slide: Slide;
  brand?: 'Friendlyrics' | 'FriendlyTales' | 'Friendlyflix';
}

// Split "Title — question" (em dash, hyphen or ' :: ' or ': '). If the
// question does not carry a label, fall back to "Question N" so the
// cinematic layout still renders three headers cleanly.
function parseQuestion(raw: string, fallbackIndex: number): { title: string; body: string } {
  const t = raw.trim();
  const sep = /\s+(?:—|::|–)\s+/.exec(t);
  if (sep) {
    const title = t.slice(0, sep.index).trim();
    const body  = t.slice(sep.index + sep[0].length).trim();
    if (title && body && title.length <= 40) return { title, body };
  }
  const colon = /^(.{2,40}?):\s+(.+)$/.exec(t);
  if (colon) return { title: colon[1].trim(), body: colon[2].trim() };
  return { title: `Question ${fallbackIndex + 1}`, body: t };
}

export default function PredictionsSlide({ slide, brand }: Props) {
  const [prediction, setPrediction] = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const questions = useMemo(
    () => (slide.content ?? '')
      .split('\n')
      .map(l => l.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean),
    [slide.content],
  );

  const isText = brand ? brand === 'FriendlyTales' : Boolean(slide.textData);
  const { mode } = useSlideThemeMode('predictions', brand);
  const useCinematic = isText && mode === 'dark';

  const seed  = (isText ? slide.textData?.title : slide.songData?.title) ?? slide.title ?? '';
  const theme = isText ? pickTextTheme(seed) : pickMusicTheme(seed);

  const promptText = slide.prompt ?? (isText ? 'What do you think this text is about?' : 'What do you think this song is about?');
  const titleText  = slide.title  ?? (isText ? 'Before you read' : 'Before you listen');

  function focusTextarea() {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleSubmit() {
    if (!prediction.trim()) return;
    setSubmitted(true);
  }

  const wordCount = prediction.trim().split(/\s+/).filter(Boolean).length;

  // ═══════════════════════════════════════════════════════════════
  //  CINEMATIC MYSTERY LAYOUT  (FriendlyTales · dark)
  // ═══════════════════════════════════════════════════════════════

  if (useCinematic) {
    const parsed = questions.map((q, i) => parseQuestion(q, i));
    return (
      <div className="relative h-full overflow-y-auto bg-transparent text-[#F8F5FC]">
        <SlideThemeToggle slideType="predictions" brand={brand} />

        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-6">

          {/* Hero card — gold outlined banner with detective title + prompt */}
          <div
            className="relative rounded-2xl overflow-hidden px-6 md:px-10 py-6 md:py-8 text-center"
            style={{
              background: 'linear-gradient(90deg, rgba(75,45,110,0.6) 0%, rgba(15,10,28,0.85) 60%, rgba(15,10,28,0.9) 100%)',
              border: '1.5px solid rgba(249, 240, 168, 0.55)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 40px rgba(249,240,168,0.10) inset',
            }}
          >
            <h1
              className="text-2xl md:text-3xl lg:text-4xl font-black tracking-wide leading-tight"
              style={{
                fontFamily: 'var(--font-cinzel), Cinzel, Georgia, serif',
                color: '#F9F0A8',
                textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 32px rgba(249,240,168,0.18)',
                letterSpacing: '0.06em',
              }}
            >
              <span className="inline-block mr-2">🔍</span>
              {titleText}
            </h1>
            <p className="mt-2 text-sm md:text-base text-[#D9CFE6] max-w-3xl mx-auto leading-relaxed">
              {promptText}
            </p>
          </div>

          {/* 3 question cards side by side */}
          {parsed.length > 0 && (
            <div className={`grid gap-4 ${
              parsed.length === 1 ? 'grid-cols-1'
                : parsed.length === 2 ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-3'
            }`}>
              {parsed.map((q, i) => {
                // Accent alternation: default magenta index chip; the last card
                // in a 3-column layout gets a cyan sub-chip for the "theory" beat.
                const isTheory = parsed.length === 3 && i === parsed.length - 1;
                return (
                  <div
                    key={i}
                    className="relative rounded-2xl px-5 py-5 pt-8"
                    style={{
                      background: 'rgba(30, 20, 50, 0.65)',
                      border: '1px solid rgba(155, 114, 184, 0.35)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    <span
                      className="absolute -top-3 left-4 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white"
                      style={{
                        background: '#EC008C',
                        boxShadow: '0 0 18px rgba(236,0,140,0.7)',
                      }}
                    >
                      {i + 1}
                    </span>
                    {isTheory && (
                      <span
                        className="absolute -top-3 left-12 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                        style={{
                          background: '#7ED6E0',
                          color: '#0F0A1C',
                          boxShadow: '0 0 16px rgba(126,214,224,0.65)',
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                    <h3
                      className="font-bold text-[15px] md:text-base mb-1.5"
                      style={{
                        fontFamily: 'var(--font-jakarta), sans-serif',
                        color: isTheory ? '#F9F0A8' : '#F9F0A8',
                      }}
                    >
                      {q.title}
                    </h3>
                    <p className="text-[13px] md:text-sm text-[#C7BCE0] leading-relaxed">
                      {q.body}
                    </p>
                    {submitted && (
                      <span
                        className="absolute top-2 right-2 w-6 h-6 rounded-full text-[#0F0A1C] flex items-center justify-center text-xs font-bold"
                        style={{ background: '#7ED6E0', boxShadow: '0 0 12px rgba(126,214,224,0.7)' }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Gold-outlined textarea */}
          {!submitted ? (
            <div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(15, 10, 28, 0.75)',
                  border: '1.5px solid rgba(249, 240, 168, 0.6)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-center gap-2 px-5 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#F9F0A8]">
                  ✍️ <span className="text-[#F9F0A8]/80 normal-case tracking-normal font-medium text-[13px]">
                    Write your theory here: &ldquo;I think {slide.textData?.title?.match(/([A-Z][a-z]+ [A-Z][a-z]+)/)?.[1] ?? 'the character'} disappeared because…&rdquo;
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={prediction}
                  onChange={e => setPrediction(e.target.value)}
                  onFocus={focusTextarea}
                  rows={4}
                  placeholder="Type your theory…"
                  className="w-full bg-transparent text-[#F8F5FC] text-base leading-relaxed px-5 py-3 pb-5 outline-none resize-none placeholder:text-[#A69BB8]/45"
                />
              </div>
              <div className="flex items-center justify-between gap-3 mt-3">
                <span className={`text-xs font-bold uppercase tracking-widest ${wordCount >= 20 ? 'text-[#7ED6E0]' : 'text-[#A69BB8]/60'}`}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} {wordCount >= 20 && '· nice depth'}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!prediction.trim()}
                  className="ft-cta text-[11px]"
                >
                  Submit prediction ✓
                </button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 space-y-3"
              style={{
                background: 'rgba(30, 20, 50, 0.75)',
                border: '1.5px solid rgba(126, 214, 224, 0.55)',
                boxShadow: '0 16px 40px rgba(126, 214, 224, 0.10)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#7ED6E0]">Your theory</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[11px] font-bold uppercase tracking-widest text-[#A69BB8] hover:text-[#F9F0A8]"
                >
                  ✎ Edit
                </button>
              </div>
              <p className="text-lg leading-relaxed italic text-[#F8F5FC]">&ldquo;{prediction}&rdquo;</p>
              <p className="text-sm font-medium pt-2 border-t border-[#F9F0A8]/25 text-[#F9F0A8]">
                📖 Now start reading — see how close you were.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  ORIGINAL LIGHT LAYOUT (Friendlyrics / Friendlyflix / opt-out)
  // ═══════════════════════════════════════════════════════════════

  const gridCols = questions.length <= 1 ? 'grid-cols-1'
    : questions.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : questions.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`relative h-full overflow-y-auto ${theme.bgWrapper} ${theme.textColor}`}>
      <SlideThemeToggle slideType="predictions" brand={brand} />
      <style>{`
        @keyframes frpCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes frpFloat {
          0%, 100% { transform: translateY(0)    rotate(-2deg); }
          50%      { transform: translateY(-6px) rotate(2deg);  }
        }
        @keyframes frpCheckPop {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          70%  { transform: scale(1.15) rotate(0);   opacity: 1; }
          100% { transform: scale(1)    rotate(0);   opacity: 1; }
        }
        @keyframes frpNoteFloat {
          0%   { transform: translate(0, 0) rotate(0);   opacity: 0; }
          15%  { opacity: 0.7; }
          100% { transform: translate(var(--dx), -160px) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-[2cm] py-[3cm] flex flex-col items-center text-center gap-8">
        <div className="relative flex flex-col items-center gap-3">
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full backdrop-blur border ${theme.eyebrowText} ${theme.eyebrowBg} ${theme.eyebrowBorder}`}>
            {theme.brandLabel} · {titleText}
          </span>
          <div className="relative">
            <span
              className="text-7xl inline-block"
              style={{ animation: 'frpFloat 4s ease-in-out infinite' }}
            >
              {theme.heroPredictions}
            </span>
            {theme.floaters.map((n, i) => (
              <span
                key={i}
                aria-hidden
                className={`absolute text-2xl select-none pointer-events-none ${theme.floaterColor}`}
                style={{
                  left: `${30 + i * 18}%`,
                  top: '60%',
                  ['--dx' as string]: `${(i - 1) * 14}px`,
                  ['--rot' as string]: `${(i - 1) * 12}deg`,
                  animation: `frpNoteFloat 3.5s ease-out ${i * 0.6}s infinite`,
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        <h1 className={`font-serif font-bold text-4xl md:text-5xl leading-tight max-w-3xl ${theme.headingColor}`}>
          {promptText}
        </h1>

        {questions.length > 0 && (
          <p className={`text-sm font-medium uppercase tracking-widest ${theme.mutedText}`}>
            Think about these {questions.length} questions
          </p>
        )}

        {questions.length > 0 && (
          <div className={`grid ${gridCols} gap-5 w-full max-w-4xl mt-2`}>
            {questions.map((q, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-3xl shadow-xl border border-white p-7 flex flex-col items-center text-center gap-3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${theme.cardShadow}`}
                style={{
                  animation: `frpCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: `${i * 120}ms`,
                }}
              >
                <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full text-white font-bold text-base flex items-center justify-center shadow-lg ${theme.badgeGradient}`}>
                  {i + 1}
                </span>
                <p className={`font-semibold text-lg md:text-xl leading-snug pt-2 max-w-sm ${theme.headingColor}`}>
                  {q}
                </p>
                {submitted && (
                  <span
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center"
                    style={{ animation: 'frpCheckPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!submitted ? (
          <div className="w-full max-w-3xl mt-4 space-y-3">
            <button
              onClick={focusTextarea}
              className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${theme.mutedText} ${theme.mutedHover}`}
            >
              ✏ Write your prediction
            </button>
            <textarea
              ref={textareaRef}
              value={prediction}
              onChange={e => setPrediction(e.target.value)}
              rows={5}
              placeholder={isText ? 'I think this text is about…' : 'I think this song is about…'}
              className={`w-full p-5 rounded-3xl border-2 border-white bg-white/80 backdrop-blur shadow-xl focus:outline-none focus:bg-white text-base md:text-lg resize-none leading-relaxed placeholder:text-gray-400 ${theme.cardShadow} ${theme.focusBorder}`}
            />
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${wordCount >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} {wordCount >= 20 && '· nice depth'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!prediction.trim()}
                className={`px-7 py-3 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 ${theme.ctaGradient} ${theme.ctaShadow}`}
              >
                Submit prediction ✓
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full max-w-3xl mt-2 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-6 shadow-xl space-y-3"
            style={{ animation: 'frpCardIn 600ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-green-700">Your prediction</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-[11px] font-bold uppercase tracking-widest text-green-700/70 hover:text-green-700"
              >
                ✎ Edit
              </button>
            </div>
            <p className={`text-lg md:text-xl leading-relaxed italic ${theme.headingColor}`}>
              &ldquo;{prediction}&rdquo;
            </p>
            <p className="text-sm font-medium text-green-700 pt-1 border-t border-green-200">
              {isText ? '📖 Now start reading and see how close you were!' : '🎵 Now press play and see how close you were!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
