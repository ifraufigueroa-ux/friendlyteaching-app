// FriendlyTeaching.cl — Friendlyflix: Language Focus
//
// Centred, hero-style replacement for the cramped Friendlyrics
// LanguageFocusSlide. Light cream-purple gradient background, big
// serif title, pattern cards in a 2x2 grid that animate in with a
// stagger, and example cards that highlight the linker phrase in
// each quote from the clip.
'use client';
import { useMemo, useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

// Split content into a leading prose paragraph + a list of bullet
// lines. We treat any line that starts with one of • - * as a bullet.
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

// Heuristic — split a bullet on the "→", ":", "·" or " - " separator so
// we can render the structure on the left (a pill) and the explanation
// on the right of each pattern card.
function splitBullet(b: string): { pattern: string; explain: string } {
  const sep = /\s+(?:→|::|·|–|—|-|:)\s+/.exec(b);
  if (!sep) return { pattern: b, explain: '' };
  const i = sep.index;
  return { pattern: b.slice(0, i).trim(), explain: b.slice(i + sep[0].length).trim() };
}

// Highlight the linker phrase inside a quote by parsing "Pattern: X"
// out of slide.words[i].example.
function extractPattern(example?: string): string | null {
  if (!example) return null;
  const m = example.match(/Pattern:\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

// Bold the pattern fragment inside the quote (case-insensitive, first
// match). Returns segments so React can wrap the highlighted part.
function highlightInQuote(quote: string, pattern: string | null): Array<{ text: string; highlight: boolean }> {
  if (!pattern) return [{ text: quote, highlight: false }];
  // Strip metavariables (X, Y, …) so a phrase like "If X, X will only Y"
  // matches the spirit of the structure even without exact wording.
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

export default function ClipLanguageFocusSlide({ slide }: Props) {
  const { intro, bullets, outro } = useMemo(() => splitContent(slide.content ?? ''), [slide.content]);
  const examples = slide.words ?? [];
  const [openExample, setOpenExample] = useState<number | null>(null);

  const titleText = slide.title ?? 'Language focus';

  // Pick grid layout based on bullet count for balance.
  const gridCols = bullets.length <= 1 ? 'grid-cols-1'
    : bullets.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : bullets.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="relative h-full overflow-y-auto bg-gradient-to-br from-[#F9F5FF] via-[#FBF8F0] to-[#FFE8F0] text-[#2D1B4E]">
      <style>{`
        @keyframes lfCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes lfHeroFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-[2cm] py-[3cm] flex flex-col items-center text-center gap-7">

        {/* Eyebrow + hero icon */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#5A3D7A]/60 bg-white/60 border border-[#C8A8DC]/40 px-3 py-1 rounded-full backdrop-blur">
            Friendlyflix · Language focus
          </span>
          <span
            className="text-6xl"
            style={{ animation: 'lfHeroFloat 4s ease-in-out infinite' }}
          >
            🔬
          </span>
        </div>

        {/* Centred title */}
        <h1 className="font-serif font-bold text-[#2D1B4E] text-4xl md:text-5xl leading-tight max-w-3xl">
          {titleText}
        </h1>

        {/* Intro paragraph */}
        {intro && (
          <p className="text-base md:text-lg text-[#5A3D7A]/85 leading-relaxed max-w-2xl">
            {intro}
          </p>
        )}

        {/* Pattern cards (the bullets) */}
        {bullets.length > 0 && (
          <div className="w-full max-w-4xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A3D7A]/60">
              {bullets.length === 1 ? 'The pattern' : `${bullets.length} patterns to notice`}
            </p>
            <div className={`grid ${gridCols} gap-4`}>
              {bullets.map((b, i) => {
                const { pattern, explain } = splitBullet(b);
                return (
                  <div
                    key={i}
                    className="relative bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/20 border border-white p-5 flex flex-col items-start text-left gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                    style={{
                      animation: 'lfCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    <span className="absolute -top-3 left-4 px-2 py-0.5 bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow">
                      #{i + 1}
                    </span>
                    <p className="font-mono font-bold text-[#5A3D7A] text-base md:text-lg leading-tight pt-2">
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

        {/* Optional closing paragraph */}
        {outro && (
          <p className="text-sm text-[#5A3D7A]/70 leading-relaxed max-w-2xl">
            {outro}
          </p>
        )}

        {/* Examples from the clip */}
        {examples.length > 0 && (
          <div className="w-full max-w-4xl space-y-3 mt-2">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A3D7A]/60">
              Examples from the clip
            </p>
            <div className="grid grid-cols-1 gap-3">
              {examples.map((w, i) => {
                const pattern = extractPattern(w.example);
                const segs    = highlightInQuote(w.word, pattern);
                const isOpen  = openExample === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpenExample(isOpen ? null : i)}
                    className={`text-left bg-white rounded-2xl border border-[#E8D5F0] shadow-md p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.005]
                      ${isOpen ? 'ring-2 ring-[#9B7CB8]' : ''}`}
                    style={{
                      animation: 'lfCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${(bullets.length + i) * 100}ms`,
                    }}
                  >
                    <p className="text-base md:text-lg font-serif italic text-[#2D1B4E] leading-relaxed">
                      &ldquo;
                      {segs.map((seg, si) => (
                        <span
                          key={si}
                          className={seg.highlight ? 'not-italic font-bold bg-[#F0E5FF] text-[#5A3D7A] px-1 rounded' : ''}
                        >
                          {seg.text}
                        </span>
                      ))}
                      &rdquo;
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#5A3D7A]/70">
                        {w.translation}
                      </span>
                      {pattern && (
                        <span className="text-[11px] font-mono bg-[#5A3D7A] text-white px-2 py-0.5 rounded-full">
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

        {/* Teacher notes (rendered as a soft footnote so the student sees a tip too) */}
        {slide.teacherNotes && (
          <div className="w-full max-w-2xl mt-2 bg-amber-50/80 border border-amber-200 rounded-2xl px-5 py-3 text-sm text-amber-800 leading-relaxed">
            <span className="font-bold">📌 Tip · </span>{slide.teacherNotes}
          </div>
        )}

      </div>
    </div>
  );
}
