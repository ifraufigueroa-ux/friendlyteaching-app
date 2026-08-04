// FriendlyTeaching.cl — Friendlyrics: Wrap Up (Reflection after listening)
//
// Post-listening reflection slide. Mirrors PredictionsSlide's gamified
// pattern (eyebrow chip, floating emoji hero, numbered cards with
// stagger, word-count meter, edit-after-submit) so the deck feels
// visually consistent. Reads slide.title / slide.prompt / slide.content
// like the legacy version.
'use client';
import { useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';
import { pickTextTheme, pickMusicTheme } from './reflection/reflectionThemes';

interface Props {
  slide: Slide;
  brand?: 'Friendlyrics' | 'FriendlyTales' | 'Friendlyflix';
}

export default function WrapupSlide({ slide, brand }: Props) {
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const questions = useMemo(
    () => (slide.content ?? '')
      .split('\n')
      .map(l => l.replace(/^[•→\-*]\s*/, '').trim())
      .filter(Boolean),
    [slide.content],
  );

  const isText  = brand ? brand === 'FriendlyTales' : Boolean(slide.textData);
  const isTales = isText;
  const seed   = (isText ? slide.textData?.title : slide.songData?.title) ?? slide.title ?? '';
  const theme  = isText ? pickTextTheme(seed) : pickMusicTheme(seed);

  const promptText = slide.prompt ?? (isText ? 'What stayed with you from this text?' : 'What stayed with you from this song?');
  const titleText  = slide.title  ?? 'Wrap Up';

  function focusTextarea() {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleSubmit() {
    if (!reflection.trim()) return;
    setSubmitted(true);
  }

  const gridCols = questions.length <= 1 ? 'grid-cols-1'
    : questions.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : questions.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  const wordCount = reflection.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className={`relative h-full overflow-y-auto ${theme.bgWrapper} ${theme.textColor}`}>
      <style>{`
        @keyframes fwuCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes fwuFloat {
          0%, 100% { transform: translateY(0)    rotate(-2deg); }
          50%      { transform: translateY(-6px) rotate(2deg);  }
        }
        @keyframes fwuCheckPop {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          70%  { transform: scale(1.15) rotate(0);   opacity: 1; }
          100% { transform: scale(1)    rotate(0);   opacity: 1; }
        }
        @keyframes fwuHeartFloat {
          0%   { transform: translate(0, 0) rotate(0);   opacity: 0; }
          15%  { opacity: 0.7; }
          100% { transform: translate(var(--dx), -160px) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-[2cm] py-[3cm] flex flex-col items-center text-center gap-8">

        {/* ── Eyebrow + floating hero ─────────────────────────────── */}
        <div className="relative flex flex-col items-center gap-3">
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full backdrop-blur border ${theme.eyebrowText} ${theme.eyebrowBg} ${theme.eyebrowBorder}`}>
            {theme.brandLabel} · {titleText}
          </span>
          {/* Floaters behind the hero emoji — theme-driven */}
          <div className="relative">
            <span
              className="text-7xl inline-block"
              style={{ animation: 'fwuFloat 4s ease-in-out infinite' }}
            >
              {theme.heroWrapup}
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
                  animation: `fwuHeartFloat 3.5s ease-out ${i * 0.6}s infinite`,
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>

        {/* ── Hero prompt ─────────────────────────────────────────── */}
        <h1 className={`font-serif font-bold text-4xl md:text-5xl leading-tight max-w-3xl ${theme.headingColor}`}>
          {promptText}
        </h1>

        {questions.length > 0 && (
          <p className={`text-sm font-medium uppercase tracking-widest ${theme.mutedText}`}>
            Reflect on these {questions.length} questions
          </p>
        )}

        {/* ── Question cards ──────────────────────────────────────── */}
        {questions.length > 0 && (
          <div className={`grid ${gridCols} gap-5 w-full max-w-4xl mt-2`}>
            {questions.map((q, i) => (
              <div
                key={i}
                className={`relative rounded-3xl p-7 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-all duration-300 ${
                  isTales
                    ? 'ft-glass-card hover:shadow-[0_20px_45px_rgba(236,0,140,0.35)]'
                    : `bg-white shadow-xl border border-white hover:shadow-2xl ${theme.cardShadow}`
                }`}
                style={{
                  animation: `fwuCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: `${i * 120}ms`,
                }}
              >
                <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full text-white font-bold text-base flex items-center justify-center shadow-lg ${
                  isTales ? 'ft-badge-magenta' : theme.badgeGradient
                }`}>
                  {i + 1}
                </span>
                <p className={`font-semibold text-lg md:text-xl leading-snug pt-2 max-w-sm ${
                  isTales ? 'text-[#F8F5FC]' : theme.headingColor
                }`}>
                  {q}
                </p>
                {submitted && (
                  <span
                    className={`absolute top-3 right-3 w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center ${
                      isTales ? 'bg-[#7ED6E0] text-[#0F0A1C]' : 'bg-green-500'
                    }`}
                    style={{ animation: 'fwuCheckPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Wrap-up takeaways (Grammar · Vocab · Speaking) — FriendlyTales only ── */}
        {isTales && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-4xl mt-2">
            {[
              { icon: '📚', label: 'Grammar',  copy: 'The pattern you noticed' },
              { icon: '🔤', label: 'Vocab',    copy: 'New words made yours'    },
              { icon: '🗣️', label: 'Speaking', copy: 'The line you can steal'  },
            ].map((t, i) => (
              <div
                key={i}
                className="ft-glass-card px-4 py-4 text-center"
                style={{ animation: `fwuCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 100 + 300}ms both` }}
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#F9F0A8]">{t.label}</p>
                <p className="text-xs text-[#A69BB8] mt-1">{t.copy}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Reflection textarea or confirmation ─────────────────── */}
        {!submitted ? (
          <div className="w-full max-w-3xl mt-4 space-y-3">
            <button
              onClick={focusTextarea}
              className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${theme.mutedText} ${theme.mutedHover}`}
            >
              ✏ Write your reflection
            </button>
            <textarea
              ref={textareaRef}
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              rows={5}
              placeholder={isText ? 'After reading, I felt…' : 'After listening, I felt…'}
              className={`w-full p-5 rounded-3xl border-2 text-base md:text-lg resize-none leading-relaxed ${
                isTales
                  ? 'ft-focus-input placeholder:text-[#A69BB8]/60'
                  : `border-white bg-white/80 backdrop-blur shadow-xl focus:outline-none focus:bg-white placeholder:text-gray-400 ${theme.cardShadow} ${theme.focusBorder}`
              }`}
            />
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${
                wordCount >= 20
                  ? isTales ? 'text-[#7ED6E0]' : 'text-green-600'
                  : isTales ? 'text-[#A69BB8]/60' : 'text-gray-400'
              }`}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} {wordCount >= 20 && '· nice depth'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!reflection.trim()}
                className={`px-7 py-3 rounded-full text-white font-bold text-sm hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 ${
                  isTales ? 'ft-cta' : `shadow-lg hover:shadow-xl ${theme.ctaGradient} ${theme.ctaShadow}`
                }`}
              >
                Save reflection ✓
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`w-full max-w-3xl mt-2 rounded-3xl p-6 space-y-3 ${
              isTales
                ? 'ft-glass-card'
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-xl'
            }`}
            style={{ animation: 'fwuCardIn 600ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className={`text-xs font-bold uppercase tracking-widest ${isTales ? 'text-[#7ED6E0]' : 'text-green-700'}`}>Your reflection</p>
              <button
                onClick={() => setSubmitted(false)}
                className={`text-[11px] font-bold uppercase tracking-widest ${
                  isTales ? 'text-[#A69BB8] hover:text-[#F9F0A8]' : 'text-green-700/70 hover:text-green-700'
                }`}
              >
                ✎ Edit
              </button>
            </div>
            <p className={`text-lg md:text-xl leading-relaxed italic ${isTales ? 'text-[#F8F5FC]' : theme.headingColor}`}>
              &ldquo;{reflection}&rdquo;
            </p>
            <p className={`text-sm font-medium pt-1 border-t ${
              isTales ? 'text-[#F9F0A8] border-[#F9F0A8]/25' : 'text-green-700 border-green-200'
            }`}>
              {isText ? '📖 Beautifully done — carry this one with you.' : '🎵 Beautifully done — carry this one with you.'}
            </p>
            {isTales && (
              <div className="flex justify-center mt-2">
                <span
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] ft-badge-magenta px-4 py-2 rounded-full"
                >
                  🏅 Story completed
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
