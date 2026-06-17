// FriendlyTeaching.cl — Friendlyflix: Predictions (Before You Watch)
//
// Replaces the small, left-aligned Friendlyrics predictions card with a
// hero-centred layout: large prompt, 2-up question cards with subtle
// lift on hover, big text area for the student's prediction, and a
// satisfying "submitted" reveal once they share their answer.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

export default function ClipPredictionsSlide({ slide }: Props) {
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

  const promptText = slide.prompt ?? 'What do you think this clip is about?';
  const titleText  = slide.title  ?? 'Before you watch';

  function focusTextarea() {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleSubmit() {
    if (!prediction.trim()) return;
    setSubmitted(true);
  }

  // Choose grid columns based on question count for a balanced layout.
  const gridCols = questions.length <= 1 ? 'grid-cols-1'
    : questions.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : questions.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  // Subtle entrance stagger so cards animate in one after another.
  useEffect(() => {
    // noop — relies on CSS animation defined inline below.
  }, []);

  const wordCount = prediction.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="relative h-full overflow-y-auto bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0] text-[#2D1B4E]">
      <style>{`
        @keyframes fpCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes fpFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes fpCheckPop {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          70%  { transform: scale(1.15) rotate(0);   opacity: 1; }
          100% { transform: scale(1)    rotate(0);   opacity: 1; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-[2cm] py-[3cm] flex flex-col items-center text-center gap-8">

        {/* ── Top eyebrow + hero ───────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#5A3D7A]/60 bg-white/60 border border-[#C8A8DC]/40 px-3 py-1 rounded-full backdrop-blur">
            Friendlyflix · {titleText}
          </span>
          <span
            className="text-7xl"
            style={{ animation: 'fpFloat 4s ease-in-out infinite' }}
          >
            🔮
          </span>
        </div>

        {/* ── Hero prompt — large, serif, centred ──────────────── */}
        <h1 className="font-serif font-bold text-[#2D1B4E] text-4xl md:text-5xl leading-tight max-w-3xl">
          {promptText}
        </h1>

        {questions.length > 0 && (
          <p className="text-sm text-[#5A3D7A]/70 font-medium uppercase tracking-widest">
            Think about these {questions.length} questions
          </p>
        )}

        {/* ── Question cards ──────────────────────────────────── */}
        {questions.length > 0 && (
          <div className={`grid ${gridCols} gap-5 w-full max-w-4xl mt-2`}>
            {questions.map((q, i) => (
              <div
                key={i}
                className="relative bg-white rounded-3xl shadow-xl shadow-[#C8A8DC]/20 border border-white p-7 flex flex-col items-center text-center gap-3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                style={{
                  animation: `fpCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: `${i * 120}ms`,
                }}
              >
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white font-bold text-base flex items-center justify-center shadow-lg">
                  {i + 1}
                </span>
                <p className="text-[#2D1B4E] font-semibold text-lg md:text-xl leading-snug pt-2 max-w-sm">
                  {q}
                </p>
                {submitted && (
                  <span
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center"
                    style={{ animation: 'fpCheckPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Prediction text area or confirmation ─────────────── */}
        {!submitted ? (
          <div className="w-full max-w-3xl mt-4 space-y-3">
            <button
              onClick={focusTextarea}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5A3D7A]/70 hover:text-[#5A3D7A] transition-colors"
            >
              ✏ Write your prediction
            </button>
            <textarea
              ref={textareaRef}
              value={prediction}
              onChange={e => setPrediction(e.target.value)}
              rows={5}
              placeholder="I think this scene is about…"
              className="w-full p-5 rounded-3xl border-2 border-white bg-white/80 backdrop-blur shadow-xl shadow-[#C8A8DC]/15 focus:outline-none focus:border-[#9B7CB8] focus:bg-white text-base md:text-lg resize-none leading-relaxed placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${wordCount >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} {wordCount >= 20 && '· nice depth'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!prediction.trim()}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white font-bold text-sm shadow-lg shadow-[#5A3D7A]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                Submit prediction ✓
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full max-w-3xl mt-2 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-6 shadow-xl space-y-3"
            style={{ animation: 'fpCardIn 600ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
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
            <p className="text-lg md:text-xl text-[#2D1B4E] leading-relaxed italic">&ldquo;{prediction}&rdquo;</p>
            <p className="text-sm font-medium text-green-700 pt-1 border-t border-green-200">
              🎬 Now watch the clip and see how close you were!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
