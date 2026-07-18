// FriendlyTeaching.cl — Friendlyrics: Predictions (Before You Listen)
//
// Hero-centred predictions slide for song lessons. Mirrors the
// gamification pattern introduced by ClipPredictionsSlide (eyebrow chip,
// floating emoji, numbered cards with stagger, word-count meter,
// edit-after-submit) and rebrands for Friendlyrics — 🎧 cue, "listen to
// the song" CTA. Reads the same slide.title / slide.prompt / slide.content
// fields as the legacy version, so existing lessons keep working.
'use client';
import { useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';
import { pickTextTheme } from './reflection/textThemes';

interface Props { slide: Slide }

export default function PredictionsSlide({ slide }: Props) {
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

  // Detect Friendlytext lessons — they carry textData. Music lessons keep
  // the original purple Friendlyrics look; text lessons get one of three
  // themes chosen deterministically from the title.
  const isText = Boolean(slide.textData);
  const theme  = pickTextTheme(slide.textData?.title ?? slide.title ?? '');

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

  const gridCols = questions.length <= 1 ? 'grid-cols-1'
    : questions.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : questions.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  const wordCount = prediction.trim().split(/\s+/).filter(Boolean).length;

  const wrapperBg   = isText ? theme.bgWrapper : 'bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0]';
  const wrapperText = isText ? theme.textColor : 'text-[#2D1B4E]';

  return (
    <div className={`relative h-full overflow-y-auto ${wrapperBg} ${wrapperText}`}>
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

        {/* ── Eyebrow + floating hero ─────────────────────────────── */}
        <div className="relative flex flex-col items-center gap-3">
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full backdrop-blur border ${
            isText
              ? `${theme.eyebrowText} ${theme.eyebrowBg} ${theme.eyebrowBorder}`
              : 'text-[#5A3D7A]/60 bg-white/60 border-[#C8A8DC]/40'
          }`}>
            {isText ? `${theme.brandLabel} · ${titleText}` : `Friendlyrics · ${titleText}`}
          </span>
          {/* Floaters behind the hero emoji — theme-driven for text lessons */}
          <div className="relative">
            <span
              className="text-7xl inline-block"
              style={{ animation: 'frpFloat 4s ease-in-out infinite' }}
            >
              {isText ? theme.heroPredictions : '🎧'}
            </span>
            {(isText ? theme.floaters : (['♪', '♫', '♬'] as const)).map((n, i) => (
              <span
                key={i}
                aria-hidden
                className={`absolute text-2xl select-none pointer-events-none ${isText ? theme.floaterColor : 'text-[#9B7CB8]/40'}`}
                style={{
                  left: `${30 + i * 18}%`,
                  top: '60%',
                  // CSS vars consumed by frpNoteFloat
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

        {/* ── Hero prompt ─────────────────────────────────────────── */}
        <h1 className={`font-serif font-bold text-4xl md:text-5xl leading-tight max-w-3xl ${isText ? theme.headingColor : 'text-[#2D1B4E]'}`}>
          {promptText}
        </h1>

        {questions.length > 0 && (
          <p className={`text-sm font-medium uppercase tracking-widest ${isText ? theme.mutedText : 'text-[#5A3D7A]/70'}`}>
            Think about these {questions.length} questions
          </p>
        )}

        {/* ── Question cards ──────────────────────────────────────── */}
        {questions.length > 0 && (
          <div className={`grid ${gridCols} gap-5 w-full max-w-4xl mt-2`}>
            {questions.map((q, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-3xl shadow-xl border border-white p-7 flex flex-col items-center text-center gap-3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${
                  isText ? theme.cardShadow : 'shadow-[#C8A8DC]/20'
                }`}
                style={{
                  animation: `frpCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: `${i * 120}ms`,
                }}
              >
                <span className={`absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full text-white font-bold text-base flex items-center justify-center shadow-lg ${
                  isText ? theme.badgeGradient : 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8]'
                }`}>
                  {i + 1}
                </span>
                <p className={`font-semibold text-lg md:text-xl leading-snug pt-2 max-w-sm ${isText ? theme.headingColor : 'text-[#2D1B4E]'}`}>
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

        {/* ── Prediction textarea or confirmation ─────────────────── */}
        {!submitted ? (
          <div className="w-full max-w-3xl mt-4 space-y-3">
            <button
              onClick={focusTextarea}
              className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                isText ? `${theme.mutedText} ${theme.mutedHover}` : 'text-[#5A3D7A]/70 hover:text-[#5A3D7A]'
              }`}
            >
              ✏ Write your prediction
            </button>
            <textarea
              ref={textareaRef}
              value={prediction}
              onChange={e => setPrediction(e.target.value)}
              rows={5}
              placeholder={isText ? 'I think this text is about…' : 'I think this song is about…'}
              className={`w-full p-5 rounded-3xl border-2 border-white bg-white/80 backdrop-blur shadow-xl focus:outline-none focus:bg-white text-base md:text-lg resize-none leading-relaxed placeholder:text-gray-400 ${
                isText ? `${theme.cardShadow} ${theme.focusBorder}` : 'shadow-[#C8A8DC]/15 focus:border-[#9B7CB8]'
              }`}
            />
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${wordCount >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} {wordCount >= 20 && '· nice depth'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!prediction.trim()}
                className={`px-7 py-3 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0 ${
                  isText ? `${theme.ctaGradient} ${theme.ctaShadow}` : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] shadow-[#5A3D7A]/30'
                }`}
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
            <p className={`text-lg md:text-xl leading-relaxed italic ${isText ? theme.headingColor : 'text-[#2D1B4E]'}`}>
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
