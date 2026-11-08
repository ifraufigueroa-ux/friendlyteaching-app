// FriendlyTeaching.cl — shared corporate roster table
//
// Extracted from /dashboard/corporate/page.tsx so the group detail page
// and any other corporate view can render the same row style. Keeping
// one source of truth for how a RosterEntry looks under the Master
// Account.

'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { RosterEntry } from '@/types/organization';
import type { LessonLevel } from '@/types/firebase';

// grid-template-columns written inline (Tailwind v4 collapses mixed
// fr/px arbitrary values into one column).
const ROSTER_GRID = '2.4fr 0.8fr 0.9fr 1.4fr 1.3fr 60px';

export function RosterTable({ entries }: { entries: RosterEntry[] }) {
  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (!a.lastClassDate && !b.lastClassDate) return a.fullName.localeCompare(b.fullName);
      if (!a.lastClassDate) return 1;
      if (!b.lastClassDate) return -1;
      return b.lastClassDate.localeCompare(a.lastClassDate);
    });
  }, [entries]);

  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm overflow-hidden">
      <div
        className="hidden md:grid gap-5 px-7 py-4 bg-[#F6EBFF] border-b border-[#E8D5F0]"
        style={{ gridTemplateColumns: ROSTER_GRID }}
      >
        <HeaderCell>Empleado</HeaderCell>
        <HeaderCell>Nivel</HeaderCell>
        <HeaderCell>Última clase</HeaderCell>
        <HeaderCell>Asistencia 30d</HeaderCell>
        <HeaderCell>Daily Practice</HeaderCell>
        <span />
      </div>
      <div>
        {sorted.map((entry, i) => (
          <RosterRow key={entry.uid} entry={entry} isLast={i === sorted.length - 1} />
        ))}
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9B7CB8]">
      {children}
    </p>
  );
}

function RosterRow({ entry, isLast }: { entry: RosterEntry; isLast: boolean }) {
  const initials = entry.fullName
    .split(' ').filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '').join('');
  const avatarBg = avatarGradient(entry.uid);

  return (
    <Link
      href={`/dashboard/corporate/students/${entry.uid}`}
      className={`group flex md:grid gap-5 px-7 py-5 hover:bg-[#FAF5FF] transition-colors items-center ${isLast ? '' : 'border-b border-gray-100'}`}
      style={{ gridTemplateColumns: ROSTER_GRID }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow" style={{ background: avatarBg }}>
          {initials || '·'}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-[#2D1B4E] truncate leading-tight">{entry.fullName}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{entry.email}</p>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-end">
        <ArrowRight className="w-4 h-4 text-[#9B7CB8] group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
      </div>

      <div className="hidden md:flex items-center">
        <LevelPill level={entry.currentLevel} />
      </div>
      <div className="hidden md:flex items-center">
        <p className="text-sm text-[#2D1B4E] font-medium">
          {entry.lastClassDate ? formatDate(entry.lastClassDate) : <span className="text-gray-400">Sin clases</span>}
        </p>
      </div>
      <div className="hidden md:flex items-center">
        <AttendanceBar pct={entry.attendancePct} classes={entry.classesLast30Days} />
      </div>
      <div className="hidden md:flex items-center gap-2">
        {entry.practiceStreak > 0 ? (
          <>
            <span className="text-xl leading-none" aria-hidden>🔥</span>
            <span className="text-base font-bold text-[#2D1B4E] tabular-nums">{entry.practiceStreak}</span>
            <span className="text-sm text-gray-400">-</span>
            <span className="text-sm text-gray-600 tabular-nums">{entry.practiceXp} XP</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">Sin práctica</span>
        )}
      </div>
      <div className="hidden md:flex items-center justify-end">
        <div className="w-10 h-10 rounded-full bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center group-hover:bg-[#5A3D7A] group-hover:text-white transition-colors">
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  );
}

export function LevelPill({ level }: { level: LessonLevel | null }) {
  if (!level) return <span className="text-xs text-gray-400">Sin nivel</span>;
  const tone =
    level === 'A0' ? 'bg-slate-50 text-slate-700 border-slate-200'
  : level === 'A1' ? 'bg-sky-50 text-sky-700 border-sky-200'
  : level === 'A2' ? 'bg-teal-50 text-teal-700 border-teal-200'
  : level === 'B1' || level === 'B1+' ? 'bg-violet-50 text-violet-700 border-violet-200'
  : level === 'B2' ? 'bg-rose-50 text-rose-700 border-rose-200'
                   : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-flex items-center text-[13px] font-black px-3.5 py-1.5 rounded-full border ${tone}`}>
      {level}
    </span>
  );
}

function AttendanceBar({ pct, classes }: { pct: number; classes: number }) {
  if (classes === 0 && pct === 0) return <span className="text-xs text-gray-400">—</span>;
  const tone = pct >= 90 ? '#10B981' : pct >= 70 ? '#F59E0B' : '#F43F5E';
  return (
    <div className="w-full min-w-[140px]">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-bold text-[#2D1B4E] tabular-nums">{pct}%</span>
        <span className="text-xs text-gray-500">{classes} {classes === 1 ? 'clase' : 'clases'}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: tone }} />
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/** Deterministic violet-palette avatar gradient per uid. */
function avatarGradient(uid: string): string {
  const palettes = [
    'linear-gradient(135deg, #5A3D7A 0%, #9B7CB8 100%)',
    'linear-gradient(135deg, #4C1D95 0%, #7E22CE 100%)',
    'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    'linear-gradient(135deg, #7B2CBF 0%, #C77DFF 100%)',
    'linear-gradient(135deg, #312E81 0%, #6366F1 100%)',
  ];
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) - h + uid.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
}
