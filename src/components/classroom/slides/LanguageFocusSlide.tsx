// FriendlyTeaching.cl — Language Focus slide (shared)
//
// Two-layout component:
//   · Cinematic Mystery (FriendlyTales dark) — magenta-outlined banner
//     + two comparative timeline cards (gold vs cyan) + gold-outlined
//     formula banner.
//   · Original light — Friendlyrics gamified layout, kept intact.
'use client';
import { useMemo, useState } from 'react';
import type { Slide } from '@/types/firebase';
import SlideThemeToggle from '../SlideThemeToggle';
import { useSlideThemeMode } from '@/lib/hooks/useSlideThemeMode';

interface Props {
  slide: Slide;
  brand?: 'Friendlyrics' | 'FriendlyTales' | 'Friendlyflix';
}

function splitContent(raw: string): { intro: string; bullets: string[]; outro: string } {
  if (!raw) return { intro: '', bullets: [], outro: '' };
  const lines = raw.split('\n');
  const introLines: string[] = [];
  const bullets: string[] = [];
  const outroLines: string[] = [];
  let phase: 'intro' | 'bullets' | 'outro' = 'intro';
  for (const ln of lines) {
    const t = ln.trim();
    const isBullet = /^[•\-*]\s+/.test(t);
    if (isBullet) {
      bullets.push(t.replace(/^[•\-*]\s+/, ''));
      phase = 'bullets';
    } else if (phase === 'bullets' && t) {
      outroLines.push(t);
      phase = 'outro';
    } else if (phase === 'outro' && t) {
      outroLines.push(t);
    } else if (t) {
      introLines.push(t);
    }
  }
  return {
    intro: introLines.join(' '),
    bullets,
    outro: outroLines.join(' '),
  };
}

function splitBullet(b: string): { pattern: string; explain: string } {
  const sep = /\s+(?:→|::|·|–|—|-|:)\s+/.exec(b);
  if (!sep) return { pattern: b, explain: '' };
  const i = sep.index;
  return { pattern: b.slice(0, i).trim(), explain: b.slice(i + sep[0].length).trim() };
}

function extractPattern(example?: string): string | null {
  if (!example) return null;
  const m = example.match(/Pattern:\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

function highlightInQuote(quote: string, pattern: string | null): Array<{ text: string; highlight: boolean }> {
  if (!pattern) return [{ text: quote, highlight: false }];
  const cleaned = pattern.replace(/\b[XY]\b/g, '').replace(/\.\.\./g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [{ text: quote, highlight: false }];
  const lower = quote.toLowerCase();
  const idx   = lower.indexOf(cleaned.toLowerCase());
  if (idx < 0) return [{ text: quote, highlight: false }];
  return [
    { text: quote.slice(0, idx),                              highlight: false },
    { text: quote.slice(idx, idx + cleaned.length),            highlight: true },
    { text: quote.slice(idx + cleaned.length),                 highlight: false },
  ];
}

// Return the first quote from `words` whose text mentions the given
// pattern label (case-insensitive). Falls back to the first example.
function pickExampleFor(words: Slide['words'], label: string): { quote: string; pattern: string | null } | null {
  if (!words || words.length === 0) return null;
  const lower = label.toLowerCase();
  const hit = words.find(w => (w.example ?? '').toLowerCase().includes(lower))
    ?? words.find(w => (w.translation ?? '').toLowerCase().includes(lower))
    ?? words[0];
  return { quote: hit.word || hit.example || '', pattern: extractPattern(hit.example) };
}

export default function LanguageFocusSlide({ slide, brand = 'Friendlyrics' }: Props) {
  const { intro, bullets, outro } = useMemo(() => splitContent(slide.content ?? ''), [slide.content]);
  const examples = slide.words ?? [];
  const [openExample, setOpenExample] = useState<number | null>(null);
  const { mode } = useSlideThemeMode('language_focus', brand);
  const useCinematic = brand === 'FriendlyTales' && mode === 'dark';

  const titleText = slide.title ?? 'Language awareness';

  // ═══════════════════════════════════════════════════════════════
  //  CINEMATIC MYSTERY LAYOUT
  // ═══════════════════════════════════════════════════════════════

  if (useCinematic) {
    // First two bullets become the timeline pair.
    const a1 = bullets[0] ? splitBullet(bullets[0]) : null;
    const a2 = bullets[1] ? splitBullet(bullets[1]) : null;
    const ex1 = a1 ? pickExampleFor(examples, a1.pattern) : null;
    const ex2 = a2 ? pickExampleFor(examples, a2.pattern) : null;
    const formula = outro
      || (examples[0] ? extractPattern(examples[0].example) : null)
      || 'Notice the shift · language in motion';

    return (
      <div className="relative h-full overflow-y-auto bg-transparent text-[#F8F5FC]">
        <SlideThemeToggle slideType="language_focus" brand={brand} />

        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-6">

          {/* Outer magenta-outlined container */}
          <div
            className="rounded-3xl px-6 md:px-10 py-8 md:py-10 flex flex-col gap-6"
            style={{
              background: 'rgba(30, 20, 50, 0.55)',
              border: '1.5px solid rgba(236, 0, 140, 0.55)',
              boxShadow: '0 20px 60px rgba(236, 0, 140, 0.12), 0 0 40px rgba(236, 0, 140, 0.06) inset',
            }}
          >
            <div className="text-center">
              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-black tracking-wide leading-tight"
                style={{
                  fontFamily: 'var(--font-cinzel), Cinzel, Georgia, serif',
                  color: '#F9F0A8',
                  textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 32px rgba(249,240,168,0.15)',
                  letterSpacing: '0.06em',
                }}
              >
                {titleText}
              </h1>
              {intro && (
                <p
                  className="mt-3 text-sm md:text-base text-[#D9CFE6] max-w-3xl mx-auto leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: intro
                    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#F8F5FC">$1</strong>')
                    .replace(/"([^"]+)"/g, '<span style="color:#F9F0A8">"$1"</span>') }}
                />
              )}
            </div>

            {/* Two-column timeline */}
            {(a1 || a2) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {a1 && (
                  <div
                    className="relative rounded-2xl px-5 py-5 pt-8"
                    style={{
                      background: 'rgba(15, 10, 28, 0.65)',
                      border: '1.5px solid rgba(249, 240, 168, 0.55)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    <span
                      className="absolute -top-3 left-5 text-[10px] font-extrabold uppercase tracking-[0.2em] px-3 py-1 rounded-full text-white"
                      style={{ background: '#EC008C', boxShadow: '0 0 18px rgba(236,0,140,0.5)' }}
                    >
                      Action 1 (First)
                    </span>
                    <h3
                      className="text-lg md:text-xl font-bold mb-1"
                      style={{ color: '#F9F0A8', fontFamily: 'var(--font-jakarta), sans-serif' }}
                    >
                      {a1.pattern}
                    </h3>
                    <p
                      className="text-sm md:text-[15px] text-[#EDE5F7] leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: (ex1?.quote || a1.explain || '')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/(had\s+\w+(?:\s+\w+)?)/i, '<strong>$1</strong>'),
                      }}
                    />
                  </div>
                )}
                {a2 && (
                  <div
                    className="relative rounded-2xl px-5 py-5 pt-8"
                    style={{
                      background: 'rgba(15, 10, 28, 0.65)',
                      border: '1.5px solid rgba(126, 214, 224, 0.55)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    }}
                  >
                    <span
                      className="absolute -top-3 left-5 text-[10px] font-extrabold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                      style={{ background: '#7ED6E0', color: '#0F0A1C', boxShadow: '0 0 16px rgba(126,214,224,0.6)' }}
                    >
                      Action 2 (Second)
                    </span>
                    <h3
                      className="text-lg md:text-xl font-bold mb-1"
                      style={{ color: '#7ED6E0', fontFamily: 'var(--font-jakarta), sans-serif' }}
                    >
                      {a2.pattern}
                    </h3>
                    <p
                      className="text-sm md:text-[15px] text-[#EDE5F7] leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: (ex2?.quote || a2.explain || '')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Formula banner */}
            <div
              className="text-center rounded-xl px-5 py-3 md:py-4 font-mono text-[13px] md:text-[15px] tracking-wide"
              style={{
                background: 'linear-gradient(90deg, rgba(75,45,110,0.75), rgba(90,50,130,0.6))',
                border: '1.5px dashed rgba(249, 240, 168, 0.75)',
                color: '#F9F0A8',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
            >
              <span className="font-bold uppercase tracking-[0.25em]">Formula:</span>{' '}
              {formula}
            </div>
          </div>

          {/* Extra examples (if generator produced more than 2) */}
          {examples.length > 2 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#F9F0A8]">
                More passages that use this pattern
              </p>
              <div className="grid grid-cols-1 gap-3">
                {examples.slice(2).map((w, i) => {
                  const pattern = extractPattern(w.example);
                  const quote   = w.word || w.example || '';
                  const segs    = highlightInQuote(quote, pattern);
                  const isOpen  = openExample === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setOpenExample(isOpen ? null : i)}
                      className={`text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.005] ft-glass-card ${
                        isOpen ? 'ring-2 ring-[#F9F0A8]' : ''
                      }`}
                    >
                      <p className="text-base md:text-lg italic leading-relaxed text-[#F8F5FC]">
                        📖 &ldquo;
                        {segs.map((seg, si) => (
                          <span key={si} className={seg.highlight ? 'not-italic font-bold ft-grammar-hit' : ''}>
                            {seg.text}
                          </span>
                        ))}
                        &rdquo;
                      </p>
                      <div className="flex items-center justify-between gap-3 mt-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#F9F0A8]">
                          {w.translation}
                        </span>
                        {pattern && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full ft-badge-magenta">
                            {pattern}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {slide.teacherNotes && (
            <div
              className="rounded-2xl px-5 py-3 text-sm leading-relaxed"
              style={{
                background: 'rgba(249, 240, 168, 0.10)',
                border: '1px solid rgba(249, 240, 168, 0.4)',
                color: '#F9F0A8',
              }}
            >
              <span className="font-bold">📌 Tip · </span>{slide.teacherNotes}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  //  ORIGINAL LIGHT LAYOUT
  // ═══════════════════════════════════════════════════════════════

  const gridCols = bullets.length <= 1 ? 'grid-cols-1'
    : bullets.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : bullets.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="relative h-full overflow-y-auto bg-gradient-to-br from-[#F9F5FF] via-[#FFF0F7] to-[#FFE8F0] text-[#2D1B4E]">
      <SlideThemeToggle slideType="language_focus" brand={brand} />
      <style>{`
        @keyframes lfrCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes lfrHeroFloat {
          0%, 100% { transform: translateY(0)     rotate(-3deg); }
          50%      { transform: translateY(-6px)  rotate(3deg);  }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-[2cm] py-[3cm] flex flex-col items-center text-center gap-7">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#EC4899]/80 bg-white/70 border border-[#F472B6]/40 px-3 py-1 rounded-full backdrop-blur">
            {brand} · {titleText}
          </span>
          <span
            className="text-6xl"
            style={{ animation: 'lfrHeroFloat 4s ease-in-out infinite' }}
          >
            🎼
          </span>
        </div>

        <h1 className="font-serif font-bold text-[#2D1B4E] text-4xl md:text-5xl leading-tight max-w-3xl">
          {titleText}
        </h1>

        {intro && (
          <p className="text-base md:text-lg text-[#5A3D7A]/85 leading-relaxed max-w-2xl">
            {intro}
          </p>
        )}

        {bullets.length > 0 && (
          <div className="w-full max-w-4xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#EC4899]/70">
              {bullets.length === 1 ? 'The pattern' : `${bullets.length} patterns to notice`}
            </p>
            <div className={`grid ${gridCols} gap-4`}>
              {bullets.map((b, i) => {
                const { pattern, explain } = splitBullet(b);
                return (
                  <div
                    key={i}
                    className="relative bg-white rounded-2xl shadow-md shadow-[#F472B6]/20 border border-white p-5 flex flex-col items-start text-left gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    style={{
                      animation: 'lfrCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    <span className="absolute -top-3 left-4 px-2 py-0.5 bg-gradient-to-br from-[#EC4899] to-[#F472B6] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow">
                      #{i + 1}
                    </span>
                    <p className="font-mono font-bold text-[#EC4899] text-base md:text-lg leading-tight pt-2">
                      {pattern}
                    </p>
                    {explain && (
                      <p className="text-sm text-[#2D1B4E]/70 leading-snug">
                        {explain}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {outro && (
          <p className="text-sm text-[#5A3D7A]/70 leading-relaxed max-w-2xl">
            {outro}
          </p>
        )}

        {examples.length > 0 && (
          <div className="w-full max-w-4xl space-y-3 mt-2">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#EC4899]/70">
              Lyrics that use this pattern
            </p>
            <div className="grid grid-cols-1 gap-3">
              {examples.map((w, i) => {
                const pattern = extractPattern(w.example);
                const quote   = w.word || w.example || '';
                const segs    = highlightInQuote(quote, pattern);
                const isOpen  = openExample === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpenExample(isOpen ? null : i)}
                    className={`text-left bg-white rounded-2xl border border-[#F472B6]/30 shadow-md p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.005]
                      ${isOpen ? 'ring-2 ring-[#EC4899]' : ''}`}
                    style={{
                      animation: 'lfrCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${(bullets.length + i) * 100}ms`,
                    }}
                  >
                    <p className="text-base md:text-lg font-serif italic text-[#2D1B4E] leading-relaxed">
                      🎵 &ldquo;
                      {segs.map((seg, si) => (
                        <span
                          key={si}
                          className={seg.highlight ? 'not-italic font-bold bg-[#FFE8F0] text-[#EC4899] px-1 rounded' : ''}
                        >
                          {seg.text}
                        </span>
                      ))}
                      &rdquo;
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#EC4899]/80">
                        {w.translation}
                      </span>
                      {pattern && (
                        <span className="text-[11px] font-mono bg-[#EC4899] text-white px-2 py-0.5 rounded-full">
                          {pattern}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {slide.teacherNotes && (
          <div className="w-full max-w-2xl mt-2 bg-amber-50/80 border border-amber-200 rounded-2xl px-5 py-3 text-sm text-amber-800 leading-relaxed">
            <span className="font-bold">📌 Tip · </span>{slide.teacherNotes}
          </div>
        )}
      </div>
    </div>
  );
}
