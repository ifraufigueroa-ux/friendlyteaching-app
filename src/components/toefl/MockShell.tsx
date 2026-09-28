// FriendlyTeaching.cl — Shared visual atoms for TOEFL & IELTS mock runners
//
// Every section of every mock (TOEFL Reading/Listening/Speaking/Writing,
// IELTS Reading/Listening/Writing) used to look flat and anonymous. This
// module gives them ONE shared visual identity — brand purples, gold
// accents, animated status pills — without collapsing their layouts, so
// each section can still tune its own prompt panel.

'use client';
import type { ReactNode } from 'react';

export const B = {
  purple:      '#5A3D7A',
  purpleDeep:  '#3D2558',
  purpleMed:   '#9B7CB8',
  lavenderBg:  '#F0E5FF',
  lavenderLt:  '#FDFAFF',
  gold:        '#E8B547',
  goldDeep:    '#B8860B',
} as const;

/** Big header ribbon shared across every mock section. Emoji + eyebrow + title. */
export function TaskRibbon({
  eyebrow, title, subtitle, emoji, right, taskNumber, taskName,
}: {
  /** Eyebrow line in gold caps. Fully custom — takes precedence over
   *  taskNumber/taskName. Use it for "Reading · Passage 1 of 2",
   *  "Listening · Lecture 1", "IELTS · Writing Task 1", etc. */
  eyebrow?:   string;
  /** Back-compat with the Writing tasks: pass taskNumber + taskName and the
   *  eyebrow becomes "Writing · Task N · <taskName>". */
  taskNumber?: 1 | 2 | 3;
  taskName?:   string;
  title:       string;   // one-line human hook, warm
  subtitle?:   string;   // small helper copy under the title
  emoji:       string;   // 🧱 / 📧 / 💬 / 📖 / 🎧 / 🎤
  right?:      ReactNode;
}) {
  const eyebrowText =
    eyebrow ??
    (taskNumber && taskName ? `Writing · Task ${taskNumber} · ${taskName}` : '');
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-5 md:px-6 py-4 md:py-5 flex items-center gap-4"
      style={{
        background: `linear-gradient(135deg, ${B.purpleDeep} 0%, ${B.purple} 55%, ${B.purpleMed} 100%)`,
        boxShadow:  '0 18px 40px -18px rgba(61,37,88,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      {/* subtle blobs so it doesn't look flat */}
      <div aria-hidden className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
        style={{ background: 'rgba(232,181,71,0.15)', filter: 'blur(20px)' }} />
      <div aria-hidden className="absolute -bottom-6 left-24 w-20 h-20 rounded-full"
        style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(14px)' }} />

      <div
        className="relative shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{
          background: 'rgba(255,255,255,0.15)',
          border:     '1px solid rgba(255,255,255,0.25)',
        }}
      >
        {emoji}
      </div>

      <div className="relative flex-1 min-w-0 text-white">
        {eyebrowText && (
          <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: B.gold }}>
            {eyebrowText}
          </p>
        )}
        <p className="font-serif text-lg md:text-xl leading-tight mt-0.5 truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-white/70 mt-1 leading-snug">{subtitle}</p>}
      </div>

      {right && <div className="relative shrink-0 flex items-center gap-2 flex-wrap justify-end">{right}</div>}
    </div>
  );
}

/** Pill that displays the countdown with a colour-changing dot. Hidden in practice mode. */
export function TimerPill({ leftSec, practiceMode }: { leftSec: number; practiceMode?: boolean }) {
  if (practiceMode) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
        style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', border: '1px solid rgba(16,185,129,0.35)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Práctica · sin timer
      </span>
    );
  }
  const min = Math.floor(leftSec / 60);
  const sec = String(leftSec % 60).padStart(2, '0');
  const state =
    leftSec <= 30  ? { bg: 'rgba(220,38,38,0.18)',  color: '#B91C1C', dot: 'bg-red-500'    } :
    leftSec <= 120 ? { bg: 'rgba(245,158,11,0.18)', color: '#B45309', dot: 'bg-amber-400'  } :
                     { bg: 'rgba(255,255,255,0.15)', color: '#FFFFFF', dot: 'bg-emerald-300' };
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black tabular-nums"
      style={{ background: state.bg, color: state.color, border: `1px solid ${state.color}33` }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${state.dot} ${leftSec <= 30 ? 'animate-ping' : 'animate-pulse'}`} />
      {min}:{sec}
    </span>
  );
}

/** Word-count meter — small horizontal progress bar with target ratio. */
export function WordCountMeter({
  count, min, label = 'palabras',
}: {
  count: number;
  min:   number;
  label?: string;
}) {
  const meets = count >= min;
  const pct = Math.min(100, Math.round((count / Math.max(1, min)) * 100));
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border"
      style={{
        background: meets ? 'rgba(16,185,129,0.10)' : '#FFFFFF',
        borderColor: meets ? 'rgba(16,185,129,0.45)' : '#E8D5F0',
      }}
    >
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#F0E5FF' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: meets ? 'linear-gradient(90deg,#22C55E,#059669)' : 'linear-gradient(90deg,#9B7CB8,#5A3D7A)',
          }}
        />
      </div>
      <span
        className="text-[11px] font-black tabular-nums"
        style={{ color: meets ? '#059669' : B.purple }}
      >
        {count}<span className="text-[9px] font-bold opacity-60">/{min} {label}</span>
        {meets && ' ✓'}
      </span>
    </div>
  );
}

/** Autosave chip — shown when a snapshot callback is wired. */
export function AutosaveChip() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700"
      style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.35)',
               borderRadius: 999, padding: '2px 8px' }}>
      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
      Autoguardado
    </span>
  );
}

/** Rich brand submit button — replaces the flat emerald default. */
export function SubmitButton({
  children, onClick, disabled,
}: {
  children: ReactNode;
  onClick:  () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative overflow-hidden px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      style={{
        background:  `linear-gradient(135deg, ${B.purpleDeep} 0%, ${B.purple} 55%, ${B.purpleMed} 100%)`,
        boxShadow:   '0 10px 24px -10px rgba(90,61,122,0.55), inset 0 1px 0 rgba(255,255,255,0.2)',
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(120px 60px at 50% 100%, ${B.gold}55, transparent 70%)` }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}

/** Content card with the shared Friendly look — top gradient bar + double shadow. */
export function BrandCard({
  children, className = '', scroll = false,
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl bg-white overflow-hidden ${scroll ? 'max-h-[80vh] overflow-y-auto' : ''} ${className}`}
      style={{
        boxShadow:
          '0 24px 48px -20px rgba(61,37,88,0.20),' +
          '0 4px 12px -6px rgba(61,37,88,0.10),' +
          'inset 0 1px 0 rgba(255,255,255,0.9)',
        border: '1px solid rgba(200,168,220,0.35)',
      }}
    >
      <div aria-hidden className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${B.purpleDeep} 0%, ${B.purpleMed} 55%, ${B.gold} 100%)` }} />
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}
