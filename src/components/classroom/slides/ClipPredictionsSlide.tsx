// FriendlyTeaching.cl — Friendlyflix: Predictions / Production (Twilight Reel)
//
// Cinematic layout shared by clip_predictions (Before You Watch) and
// clip_production (Over To You). Deep twilight purple base + spotlight
// gold hero + 3-column question cards with magenta index chips + gold-
// bordered textarea. Sits inside the .theme-friendly-flix scope from
// the FriendlyFlix player mount.
'use client';
import { useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

// Split "Title — question" or "Title: question" into a header + body so
// the 3-column layout can show a short label above the full question.
function parseQuestion(raw: string, fallbackIndex: number): { title: string; body: string } {
  const t = raw.trim();
  const dash = /\s+(?:—|::|–)\s+/.exec(t);
  if (dash) {
    const title = t.slice(0, dash.index).trim();
    const body  = t.slice(dash.index + dash[0].length).trim();
    if (title && body && title.length <= 42) return { title, body };
  }
  const colon = /^(.{2,42}?):\s+(.+)$/.exec(t);
  if (colon) return { title: colon[1].trim(), body: colon[2].trim() };
  return { title: `Question ${fallbackIndex + 1}`, body: t };
}

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
  const parsed = questions.map((q, i) => parseQuestion(q, i));

  const promptText = slide.prompt ?? 'What do you think this clip is about?';
  const titleText  = slide.title  ?? 'Before you watch';

  // Detect production vs prediction from the slide type so copy adapts.
  const isProduction = slide.type === 'clip_production';
  const eyebrowText  = isProduction ? 'Friendlyflix · Over to you' : 'Friendlyflix · Before you watch';
  const heroIcon     = isProduction ? '🎬' : '🔮';
  const ctaLabel     = isProduction ? 'Share your answer' : 'Submit prediction';
  const followUp     = isProduction
    ? '🎬 Great — carry this line into the next scene of your day.'
    : '🎬 Now watch the clip and see how close you were.';

  function focusTextarea() {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function handleSubmit() {
    if (!prediction.trim()) return;
    setSubmitted(true);
  }
  const wordCount = prediction.trim().split(/\s+/).filter(Boolean).length;

  const gridCols = parsed.length <= 1 ? 'grid-cols-1'
    : parsed.length === 2 ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className="relative h-full overflow-y-auto bg-transparent text-[#F8F5FC]">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-6">

        {/* Hero card — spotlight-outlined banner */}
        <div
          className="relative rounded-2xl overflow-hidden px-6 md:px-10 py-6 md:py-8 text-center"
          style={{
            background: 'linear-gradient(90deg, rgba(75,45,110,0.6) 0%, rgba(15,10,28,0.85) 60%, rgba(15,10,28,0.9) 100%)',
            border: '1.5px solid rgba(240, 192, 64, 0.55)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 40px rgba(252,238,33,0.10) inset',
          }}
        >
          <span
            className="inline-block text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] mb-3 px-3 py-1 rounded-full"
            style={{
              background: 'rgba(45, 27, 78, 0.75)',
              border: '1px solid rgba(240, 192, 64, 0.35)',
              color: '#FCEE21',
            }}
          >
            {eyebrowText}
          </span>
          <div>
            <span
              className="text-5xl md:text-6xl inline-block"
              style={{ animation: 'ffHeroFloat 4s ease-in-out infinite' }}
            >
              {heroIcon}
            </span>
          </div>
          <h1
            className="mt-3 text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-wide max-w-4xl mx-auto"
            style={{
              fontFamily: 'var(--font-cinzel), Cinzel, Georgia, serif',
              color: '#FCEE21',
              textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 32px rgba(252,238,33,0.18)',
              letterSpacing: '0.05em',
            }}
          >
            {titleText}
          </h1>
          <p className="mt-3 text-sm md:text-base text-[#D9CFE6] max-w-3xl mx-auto leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* 3-column question cards */}
        {parsed.length > 0 && (
          <div className={`grid ${gridCols} gap-4`}>
            {parsed.map((q, i) => (
              <div
                key={i}
                className="relative rounded-2xl px-5 py-5 pt-8"
                style={{
                  background: 'rgba(45, 27, 78, 0.65)',
                  border: '1px solid rgba(155, 124, 184, 0.35)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                  animation: `ffCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: `${i * 120}ms`,
                }}
              >
                <span
                  className="absolute -top-3 left-4 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white"
                  style={{
                    background: '#EC008C',
                    boxShadow: '0 0 18px rgba(236,0,140,0.55)',
                  }}
                >
                  {i + 1}
                </span>
                <h3
                  className="font-bold text-[15px] md:text-base mb-1.5"
                  style={{
                    fontFamily: 'var(--font-jakarta), sans-serif',
                    color: '#FCEE21',
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
                    style={{ background: '#7BC67E', boxShadow: '0 0 12px rgba(123,198,126,0.65)' }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Textarea — gold-outlined */}
        {!submitted ? (
          <div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(26, 15, 46, 0.75)',
                border: '1.5px solid rgba(240, 192, 64, 0.55)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex items-center gap-2 px-5 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#FCEE21]">
                ✍️ <span className="text-[#FCEE21]/85 normal-case tracking-normal font-medium text-[13px]">
                  {isProduction ? 'Write your idea…' : 'I think this scene is about…'}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={prediction}
                onChange={e => setPrediction(e.target.value)}
                onFocus={focusTextarea}
                rows={4}
                placeholder={isProduction ? 'Say it in your own words…' : 'Type your theory…'}
                className="w-full bg-transparent text-[#F8F5FC] text-base leading-relaxed px-5 py-3 pb-5 outline-none resize-none placeholder:text-[#B8A9D4]/45"
              />
            </div>
            <div className="flex items-center justify-between gap-3 mt-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${wordCount >= 20 ? 'text-[#7BC67E]' : 'text-[#B8A9D4]/60'}`}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} {wordCount >= 20 && '· nice depth'}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!prediction.trim()}
                className="ff-cta text-[11px]"
              >
                {ctaLabel} ✓
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{
              background: 'rgba(45, 27, 78, 0.75)',
              border: '1.5px solid rgba(76, 216, 204, 0.55)',
              boxShadow: '0 16px 40px rgba(123,198,126,0.10)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7BC67E]">
                {isProduction ? 'Your answer' : 'Your theory'}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-[11px] font-bold uppercase tracking-widest text-[#B8A9D4] hover:text-[#FCEE21]"
              >
                ✎ Edit
              </button>
            </div>
            <p className="text-lg leading-relaxed italic text-[#F8F5FC]">&ldquo;{prediction}&rdquo;</p>
            <p className="text-sm font-medium pt-2 border-t border-[#FCEE21]/25 text-[#FCEE21]">
              {followUp}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ffCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes ffHeroFloat {
          0%, 100% { transform: translateY(0)    rotate(-2deg); }
          50%      { transform: translateY(-6px) rotate(2deg);  }
        }
      `}</style>
    </div>
  );
}
