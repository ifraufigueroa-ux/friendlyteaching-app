// FriendlyTeaching.cl — Friendlyrics: Language Focus
//
// Music-branded mirror of ClipLanguageFocusSlide with the Friendlyrics
// pink/magenta accent instead of the Friendlyflix purple. Same CLT
// structure: eyebrow chip · floating hero · serif title · intro prose ·
// pattern cards (from bullets) · expandable example cards with the
// pattern fragment highlighted inside the lyric quote.
'use client';
import { useMemo, useState } from 'react';
import type { Slide } from '@/types/firebase';

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

export default function LanguageFocusSlide({ slide, brand = 'Friendlyrics' }: Props) {
  const { intro, bullets, outro } = useMemo(() => splitContent(slide.content ?? ''), [slide.content]);
  const examples = slide.words ?? [];
  const [openExample, setOpenExample] = useState<number | null>(null);
  const isTales = brand === 'FriendlyTales';

  const titleText = slide.title ?? 'Language awareness';

  const gridCols = bullets.length <= 1 ? 'grid-cols-1'
    : bullets.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : bullets.length === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`relative h-full overflow-y-auto ${
      isTales
        ? 'bg-transparent text-[#F8F5FC]'
        : 'bg-gradient-to-br from-[#F9F5FF] via-[#FFF0F7] to-[#FFE8F0] text-[#2D1B4E]'
    }`}>
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
          <span className={`text-[11px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full backdrop-blur border ${
            isTales
              ? 'text-[#F9F0A8] bg-[rgba(30,20,50,0.75)] border-[#F9F0A8]/40'
              : 'text-[#EC4899]/80 bg-white/70 border-[#F472B6]/40'
          }`}>
            {brand} · {titleText}
          </span>
          <span
            className="text-6xl"
            style={{ animation: 'lfrHeroFloat 4s ease-in-out infinite' }}
          >
            {isTales ? '🕯️' : '🎼'}
          </span>
        </div>

        <h1 className={`font-bold text-4xl md:text-5xl leading-tight max-w-3xl ${
          isTales ? 'ft-title-gold' : 'font-serif text-[#2D1B4E]'
        }`}>
          {titleText}
        </h1>

        {intro && (
          <p className={`text-base md:text-lg leading-relaxed max-w-2xl ${
            isTales ? 'text-[#F8F5FC]/90' : 'text-[#5A3D7A]/85'
          }`}>
            {intro}
          </p>
        )}

        {bullets.length > 0 && (
          <div className="w-full max-w-4xl space-y-3">
            <p className={`text-xs font-bold uppercase tracking-[0.25em] ${
              isTales ? 'text-[#F9F0A8]' : 'text-[#EC4899]/70'
            }`}>
              {bullets.length === 1 ? 'The pattern' : `${bullets.length} patterns to notice`}
            </p>
            <div className={`grid ${gridCols} gap-4`}>
              {bullets.map((b, i) => {
                const { pattern, explain } = splitBullet(b);
                // Alternate gold / cyan accent in the timeline for FriendlyTales.
                const talesAccent = i % 2 === 0
                  ? { border: 'border-[#F9F0A8]/50', tagBg: 'ft-badge-magenta', patternText: 'text-[#F9F0A8]' }
                  : { border: 'border-[#7ED6E0]/50', tagBg: 'ft-badge-cyan',    patternText: 'text-[#7ED6E0]' };
                return (
                  <div
                    key={i}
                    className={`relative rounded-2xl p-5 flex flex-col items-start text-left gap-2 hover:-translate-y-0.5 transition-all duration-300 ${
                      isTales
                        ? `ft-glass-card ${talesAccent.border} hover:shadow-[0_16px_36px_rgba(236,0,140,0.25)]`
                        : 'bg-white shadow-md shadow-[#F472B6]/20 border border-white hover:shadow-xl'
                    }`}
                    style={{
                      animation: 'lfrCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${i * 100}ms`,
                    }}
                  >
                    <span className={`absolute -top-3 left-4 px-2 py-0.5 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow ${
                      isTales ? talesAccent.tagBg : 'bg-gradient-to-br from-[#EC4899] to-[#F472B6]'
                    }`}>
                      #{i + 1}
                    </span>
                    <p className={`font-mono font-bold text-base md:text-lg leading-tight pt-2 ${
                      isTales ? talesAccent.patternText : 'text-[#EC4899]'
                    }`}>
                      {pattern}
                    </p>
                    {explain && (
                      <p className={`text-sm leading-snug ${isTales ? 'text-[#F8F5FC]/80' : 'text-[#2D1B4E]/70'}`}>
                        {explain}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {isTales && bullets.length > 0 && (
              // Formula banner as specified — dotted magenta border on tinted bg.
              <div
                className="mt-2 text-center text-xs md:text-sm font-mono tracking-wide rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(236, 0, 140, 0.15)',
                  border: '1.5px dashed rgba(236, 0, 140, 0.55)',
                  color: '#F9F0A8',
                }}
              >
                ✨ Notice the shift · language in motion
              </div>
            )}
          </div>
        )}

        {outro && (
          <p className={`text-sm leading-relaxed max-w-2xl ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/70'}`}>
            {outro}
          </p>
        )}

        {examples.length > 0 && (
          <div className="w-full max-w-4xl space-y-3 mt-2">
            <p className={`text-xs font-bold uppercase tracking-[0.25em] ${isTales ? 'text-[#F9F0A8]' : 'text-[#EC4899]/70'}`}>
              {isTales ? 'Passages that use this pattern' : 'Lyrics that use this pattern'}
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
                    className={`text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.005] ${
                      isTales
                        ? `ft-glass-card ${isOpen ? 'ring-2 ring-[#F9F0A8]' : ''}`
                        : `bg-white border border-[#F472B6]/30 shadow-md hover:shadow-xl ${isOpen ? 'ring-2 ring-[#EC4899]' : ''}`
                    }`}
                    style={{
                      animation: 'lfrCardIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${(bullets.length + i) * 100}ms`,
                    }}
                  >
                    <p className={`text-base md:text-lg italic leading-relaxed ${
                      isTales ? 'text-[#F8F5FC]' : 'font-serif text-[#2D1B4E]'
                    }`}>
                      {isTales ? '📖' : '🎵'} &ldquo;
                      {segs.map((seg, si) => (
                        <span
                          key={si}
                          className={seg.highlight
                            ? isTales
                              ? 'not-italic font-bold ft-grammar-hit'
                              : 'not-italic font-bold bg-[#FFE8F0] text-[#EC4899] px-1 rounded'
                            : ''}
                        >
                          {seg.text}
                        </span>
                      ))}
                      &rdquo;
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <span className={`text-xs font-bold uppercase tracking-widest ${
                        isTales ? 'text-[#F9F0A8]' : 'text-[#EC4899]/80'
                      }`}>
                        {w.translation}
                      </span>
                      {pattern && (
                        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                          isTales ? 'ft-badge-magenta' : 'bg-[#EC4899] text-white'
                        }`}>
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
          <div className={`w-full max-w-2xl mt-2 rounded-2xl px-5 py-3 text-sm leading-relaxed ${
            isTales
              ? 'bg-[rgba(249,240,168,0.10)] border border-[#F9F0A8]/40 text-[#F9F0A8]'
              : 'bg-amber-50/80 border border-amber-200 text-amber-800'
          }`}>
            <span className="font-bold">📌 Tip · </span>{slide.teacherNotes}
          </div>
        )}

      </div>
    </div>
  );
}
