// FriendlyTeaching.cl — Student: Mis Lecciones (assigned material only)
//
// Antes esta grilla vivía inline en /dashboard/student y mostraba TODAS
// las lecciones publicadas hasta el nivel del estudiante — el student
// veía lecciones que su profe nunca le había asignado. Ahora la página
// solo muestra material efectivamente asignado, mergeando 4 fuentes:
//
//   1. studentAssignments (Librería FT interna) — source='lesson'
//   2. studentAssignments (external — Off2Class / Ellii / Drive / etc.)
//   3. movieLessons donde assignedTo contiene al uid del estudiante
//   4. musicLessons idem
//   5. textLessons idem
'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { BookMarked, BookOpen, Link2, Clapperboard, Music, Check, Clock, Inbox, Search, Headphones, PenLine, LayoutGrid, List as ListIcon, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStudentAssignments } from '@/hooks/useStudentAssignments';
import { useStudentMovieLessons } from '@/hooks/useMovieLessons';
import { useStudentMusicLessons } from '@/hooks/useMusicLessons';
import { useStudentTextLessons } from '@/hooks/useTextLessons';
import { useStudentProgress } from '@/hooks/useProgress';
import { useStudentListeningAssignments } from '@/hooks/useFriendlisteningAssignments';
import { useStudentWritingAssignments } from '@/hooks/useFriendlywritingAssignments';
import { detectMaterialType } from '@/components/planner/bookingUtils';
import { FRIENDLISTENINGS_LESSONS } from '@/lib/data/friendlistenings';
import { FRIENDLYWRITING_LESSONS } from '@/lib/data/friendlywriting';
import type { MusicLesson, TextLesson, LessonLevel } from '@/types/firebase';

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-600',
  A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

const LEVELS_ORDER = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

// ─── Unified card model ─────────────────────────────────────────
type CardKind = 'ft-lesson' | 'ft-movie' | 'ft-music' | 'ft-text' | 'ft-listening' | 'ft-writing' | 'external';
interface UnifiedCard {
  key: string;
  kind: CardKind;
  title: string;
  code?: string;
  level?: LessonLevel | string;
  href: string;         // internal href for FT cards
  externalUrl?: string; // for external cards (open in new tab)
  badgeIcon: ReactNode;
  badgeLabel: string;
  progressPct?: number; // 0-100 for in-progress
  isCompleted?: boolean;
  isStarted?: boolean;
  assignedAtMs: number; // for sorting
}

interface CardShellProps {
  href?: string;
  externalUrl?: string;
  title: string;
  code?: string;
  level?: string;
  badgeIcon: ReactNode;
  badgeLabel: string;
  isStarted?: boolean;
  isCompleted?: boolean;
  pct?: number | null;
  notes?: string;
  variant?: 'grid' | 'list';
}

function CardShell({ href, externalUrl, title, code, level, badgeIcon, badgeLabel, isStarted, isCompleted, pct, notes, variant = 'grid' }: CardShellProps) {
  const levelColor = LEVEL_COLORS[level ?? ''] ?? 'bg-gray-100 text-gray-600';
  const accent = isCompleted ? 'bg-green-400' : isStarted ? 'bg-amber-400' : externalUrl ? 'bg-sky-300' : 'bg-[#C8A8DC]';
  const statusLabel = isCompleted ? 'Completed' : isStarted ? 'In progress' : externalUrl ? 'External' : 'New';
  const statusPill =
    isCompleted ? 'bg-green-100 text-green-700' :
    isStarted ? 'bg-amber-100 text-amber-700' :
    externalUrl ? 'bg-sky-100 text-sky-700' :
    'bg-[#F0E5FF] text-[#5A3D7A]';

  if (variant === 'list') {
    const listInner = (
      <div className="w-full card-interactive rounded-2xl overflow-hidden flex bg-white">
        <div className={`w-1.5 flex-shrink-0 ${accent}`} />
        <div className="flex-1 p-3 flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center flex-shrink-0">
            {badgeIcon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 font-medium truncate">
              {badgeLabel}{code ? ` · ${code}` : ''}
            </p>
            <p className="text-sm font-bold text-[#5A3D7A] truncate leading-tight">{title}</p>
            {notes && <p className="text-[10px] text-gray-500 italic truncate">{notes}</p>}
          </div>
          {pct != null && !isCompleted && (
            <span className="text-[10px] text-amber-500 font-semibold flex-shrink-0 hidden sm:inline">{pct}%</span>
          )}
          {level && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${levelColor}`}>{level}</span>
          )}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline-flex items-center gap-1 ${statusPill}`}>
            {isCompleted ? <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
              : isStarted ? <Clock className="w-2.5 h-2.5" strokeWidth={2.25} />
              : externalUrl ? <Link2 className="w-2.5 h-2.5" strokeWidth={2.25} />
              : <BookOpen className="w-2.5 h-2.5" strokeWidth={2.25} />}
            {statusLabel}
          </span>
          <ArrowRight className="w-4 h-4 text-[#9B7CB8] group-hover:text-[#5A3D7A] flex-shrink-0 transition-colors" />
        </div>
      </div>
    );
    if (externalUrl) {
      return (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="block w-full group">
          {listInner}
        </a>
      );
    }
    return (
      <Link href={href ?? '#'} className="block w-full group">
        {listInner}
      </Link>
    );
  }

  const topBar = isStarted && !isCompleted && pct != null
    ? <div className="h-1.5 w-full bg-gray-100"><div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} /></div>
    : <div className={`h-1.5 w-full ${accent}`} />;

  const inner = (
    <div className="w-full h-full card-interactive rounded-2xl overflow-hidden flex flex-col bg-white">
      {topBar}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
              <span>{badgeIcon}</span>
              <span className="truncate">{badgeLabel}{code ? ` · ${code}` : ''}</span>
            </p>
            <p className="text-xs font-bold text-[#5A3D7A] line-clamp-2 mt-0.5 leading-tight">{title}</p>
          </div>
          {level && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${levelColor}`}>{level}</span>
          )}
        </div>
        {notes && (
          <p className="text-[10px] text-gray-500 italic line-clamp-2 mb-2">{notes}</p>
        )}
        {pct != null && !isCompleted && (
          <p className="text-[10px] text-amber-500 font-semibold mb-2">{pct}% visto</p>
        )}
        <div className="mt-auto">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full block text-center mb-2 ${statusPill}`}>
            <span className="inline-flex items-center gap-1 justify-center">
              {isCompleted ? <><Check className="w-2.5 h-2.5" strokeWidth={2.5} /> Completed</>
                : isStarted ? <><Clock className="w-2.5 h-2.5" strokeWidth={2.25} /> In progress</>
                : externalUrl ? <><Link2 className="w-2.5 h-2.5" strokeWidth={2.25} /> External</>
                : <><BookOpen className="w-2.5 h-2.5" strokeWidth={2.25} /> New</>}
            </span>
          </span>
          <span className="block w-full text-center px-2 py-1.5 bg-[#C8A8DC] group-hover:bg-[#9B7CB8] text-white rounded-xl text-[10px] font-bold transition-colors">
            {externalUrl ? 'Open ↗' : isCompleted ? 'Review' : isStarted ? 'Continue' : 'Open'}
          </span>
        </div>
      </div>
    </div>
  );

  if (externalUrl) {
    return (
      <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full group">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href ?? '#'} className="block w-full h-full group">
      {inner}
    </Link>
  );
}

export default function StudentLessonsPage() {
  const { profile, firebaseUser } = useAuthStore();
  // The auth store can rehydrate to null on first paint (see
  // [[authstore-hydration-bug]]); fall back to a direct
  // onAuthStateChanged subscription so the student's uid is always
  // populated by the time useStudentAssignments subscribes, which
  // otherwise bails on an empty uid and the list renders blank.
  const [authUid, setAuthUid] = useState<string>(() => auth.currentUser?.uid ?? '');
  useEffect(() => onAuthStateChanged(auth, (u) => setAuthUid(u?.uid ?? '')), []);
  const uid = firebaseUser?.uid || authUid;
  const teacherUid = profile?.studentData?.approvedByTeacherId ?? '';

  const { assignments, loading: aLoading } = useStudentAssignments(uid);
  const { lessons: movieLessons, loading: mLoading } = useStudentMovieLessons(uid);
  const { lessons: musicLessons, loading: mmLoading } = useStudentMusicLessons(teacherUid, uid);
  const { lessons: textLessons, loading: tLoading } = useStudentTextLessons(uid);
  const { assignments: listeningAssignments, loading: lLoading } = useStudentListeningAssignments(uid);
  const { assignments: writingAssignments, loading: wLoading } = useStudentWritingAssignments(uid);
  const { progress } = useStudentProgress(uid);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<'all' | 'ft' | 'external'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Hydrate preferred view from localStorage so switching modes sticks
  // across sessions on the same device.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ft-my-lessons-view');
      if (saved === 'grid' || saved === 'list') setViewMode(saved);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem('ft-my-lessons-view', viewMode); } catch { /* ignore */ }
  }, [viewMode]);

  const startedLessonIds = new Set(progress.map(p => p.lessonId));
  const completedLessonIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.lessonId));

  function slidePercent(lessonId: string, totalSlides: number): number | null {
    if (!totalSlides) return null;
    const lp = progress.filter(p => p.lessonId === lessonId && p.status === 'in_progress');
    if (lp.length === 0) return null;
    const best = lp.reduce((a, b) => ((a.slideProgress?.length ?? 0) > (b.slideProgress?.length ?? 0) ? a : b));
    const done = best.slideProgress?.length ?? 0;
    return Math.round((done / totalSlides) * 100);
  }

  // ── Build unified cards ────────────────────────────────────────
  const cards: UnifiedCard[] = useMemo(() => {
    const out: UnifiedCard[] = [];

    // 1) studentAssignments — Librería FT + external
    for (const a of assignments) {
      const isFT = a.source === 'lesson';
      const material = isFT ? null : detectMaterialType(a.externalUrl);
      out.push({
        key: `assign-${a.id}`,
        kind: isFT ? 'ft-lesson' : 'external',
        title: a.title,
        level: a.level,
        href: isFT ? `/classroom/${a.refId}` : '',
        externalUrl: isFT ? undefined : a.externalUrl,
        badgeIcon: isFT
          ? <BookOpen className="w-2.5 h-2.5" strokeWidth={2.25} />
          : material?.Icon
            ? <material.Icon className="w-2.5 h-2.5" strokeWidth={2.25} />
            : <Link2 className="w-2.5 h-2.5" strokeWidth={2.25} />,
        badgeLabel: isFT ? 'FT Library' : (material?.label || 'External link'),
        isCompleted: a.status === 'completed' || (isFT && a.refId ? completedLessonIds.has(a.refId) : false),
        isStarted: isFT && a.refId ? startedLessonIds.has(a.refId) : false,
        assignedAtMs: a.createdAt?.toMillis?.() ?? 0,
      });
    }

    // 2) Friendlyflix (movieLessons)
    for (const l of movieLessons) {
      out.push({
        key: `movie-${l.id}`,
        kind: 'ft-movie',
        title: (l.clip?.title || l.title || 'Clip lesson'),
        level: l.level,
        href: `/dashboard/student/lessons/movie/${l.id}`,
        badgeIcon: <Clapperboard className="w-2.5 h-2.5" strokeWidth={2.25} />,
        badgeLabel: 'Friendlyflix',
        isCompleted: false,
        isStarted: false,
        assignedAtMs: (l as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() ?? 0,
      });
    }

    // 3) Friendlyrics (musicLessons)
    for (const l of musicLessons as MusicLesson[]) {
      out.push({
        key: `music-${l.id}`,
        kind: 'ft-music',
        title: (l.song?.title || l.title || 'Song'),
        level: l.level,
        href: `/dashboard/student/music/${l.id}`,
        badgeIcon: <Music className="w-2.5 h-2.5" strokeWidth={2.25} />,
        badgeLabel: 'Friendlyrics',
        isCompleted: false,
        isStarted: false,
        assignedAtMs: (l as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() ?? 0,
      });
    }

    // 4) FriendlyTales (textLessons)
    for (const l of textLessons as TextLesson[]) {
      out.push({
        key: `text-${l.id}`,
        kind: 'ft-text',
        title: l.title || 'Reading',
        level: l.level,
        href: `/dashboard/student/texts/${l.id}`,
        badgeIcon: <BookMarked className="w-2.5 h-2.5" strokeWidth={2.25} />,
        badgeLabel: 'FriendlyTales',
        isCompleted: false,
        isStarted: false,
        assignedAtMs: (l as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() ?? 0,
      });
    }

    // 5) Friendlistenings — static catalog, hydrated from lessonId snapshot
    for (const a of listeningAssignments) {
      const catalog = FRIENDLISTENINGS_LESSONS.find(x => x.id === a.lessonId);
      out.push({
        key: `listening-${a.id}`,
        kind: 'ft-listening',
        title: a.lessonTitle || catalog?.title || 'Listening',
        level: a.lessonLevel || catalog?.level,
        href: `/dashboard/student/listenings/${a.lessonId}`,
        badgeIcon: <Headphones className="w-2.5 h-2.5" strokeWidth={2.25} />,
        badgeLabel: 'Friendlistenings',
        isCompleted: a.status === 'completed',
        isStarted: a.status === 'in_progress',
        assignedAtMs: a.assignedAt?.toMillis?.() ?? 0,
      });
    }

    // 6) FriendlyWriting — static catalog, hydrated from lessonId snapshot
    for (const a of writingAssignments) {
      const catalog = FRIENDLYWRITING_LESSONS.find(x => x.id === a.lessonId);
      out.push({
        key: `writing-${a.id}`,
        kind: 'ft-writing',
        title: a.lessonTitle || catalog?.title || 'Writing',
        level: a.lessonLevel || catalog?.level,
        href: `/dashboard/student/writing/${a.lessonId}`,
        badgeIcon: <PenLine className="w-2.5 h-2.5" strokeWidth={2.25} />,
        badgeLabel: 'FriendlyWriting',
        isCompleted: a.status === 'completed',
        isStarted: a.status === 'in_progress',
        assignedAtMs: a.assignedAt?.toMillis?.() ?? 0,
      });
    }

    return out.sort((a, b) => b.assignedAtMs - a.assignedAtMs);
  }, [assignments, movieLessons, musicLessons, textLessons, listeningAssignments, writingAssignments, startedLessonIds, completedLessonIds]);

  // ── Filters ────────────────────────────────────────────────────
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards) if (c.level) set.add(String(c.level));
    return [...set].sort((a, b) => LEVELS_ORDER.indexOf(a) - LEVELS_ORDER.indexOf(b));
  }, [cards]);

  const filtered = cards.filter(c => {
    if (kindFilter === 'ft'       && c.kind === 'external') return false;
    if (kindFilter === 'external' && c.kind !== 'external') return false;
    if (levelFilter && String(c.level) !== levelFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const loading = aLoading || mLoading || mmLoading || tLoading || lLoading || wLoading;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--gradient-hero)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-[#5A3D7A] inline-flex items-center gap-2"><BookOpen className="w-5 h-5" strokeWidth={2.25} /> My lessons</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            All the material your teacher has assigned — FriendlyTeaching + external.
          </p>
        </div>
        <Link href="/dashboard/student/progress"
          className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors">
          View progress →
        </Link>
      </div>

      {/* Filters row */}
      {cards.length > 0 && (
        <div className="space-y-2 mb-4">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lessons…"
            className="w-full px-4 py-2 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white/70 backdrop-blur-sm shadow-glass"
          />
          <div className="flex gap-1.5 flex-wrap items-center">
            {(['all', 'ft', 'external'] as const).map(k => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  kindFilter === k ? 'bg-[#5A3D7A] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'
                }`}
              >
                {k === 'all' ? 'All' : k === 'ft' ? 'FriendlyTeaching' : 'External'}
              </button>
            ))}
            <div className="ml-auto inline-flex items-center gap-0.5 bg-white border border-gray-200 rounded-full p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                title="Vista mosaico"
                aria-label="Vista mosaico"
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'grid' ? 'bg-[#5A3D7A] text-white' : 'text-gray-500 hover:text-[#5A3D7A]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2.25} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Vista lista"
                aria-label="Vista lista"
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'list' ? 'bg-[#5A3D7A] text-white' : 'text-gray-500 hover:text-[#5A3D7A]'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" strokeWidth={2.25} />
              </button>
            </div>
          </div>
          {availableLevels.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setLevelFilter('')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  !levelFilter ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'
                }`}
              >
                All levels
              </button>
              {availableLevels.map(l => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(levelFilter === l ? '' : l)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    levelFilter === l ? 'bg-[#C8A8DC] text-white'
                      : `${LEVEL_COLORS[l] ?? 'bg-gray-100 text-gray-500'} opacity-80 hover:opacity-100`
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-48 flex-shrink-0 h-40 bg-white/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="mb-3 flex justify-center text-[#9B7CB8]"><Inbox className="w-10 h-10" strokeWidth={2} /></div>
          <p className="text-[#5A3D7A] font-bold">No material assigned yet</p>
          <p className="text-gray-500 text-sm mt-1">Your teacher can assign FriendlyTeaching lessons or external material (Off2Class, Drive, YouTube, etc.).</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="mb-2 flex justify-center text-gray-400"><Search className="w-6 h-6" strokeWidth={2.25} /></div>
          <p className="text-gray-500 text-sm">No matching lessons.</p>
          <button onClick={() => { setSearch(''); setLevelFilter(''); setKindFilter('all'); }}
            className="mt-2 text-xs font-semibold text-[#9B7CB8] underline">
            Clear filters
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-2 max-w-3xl">
          {filtered.map(c => {
            const pct = c.kind === 'ft-lesson'
              ? (() => {
                  const a = assignments.find(x => `assign-${x.id}` === c.key);
                  if (!a?.refId) return null;
                  return c.isStarted && !c.isCompleted ? slidePercent(a.refId, 999) : null;
                })()
              : null;
            return (
              <CardShell
                key={c.key}
                variant="list"
                href={c.href}
                externalUrl={c.externalUrl}
                title={c.title}
                level={c.level ? String(c.level) : undefined}
                badgeIcon={c.badgeIcon}
                badgeLabel={c.badgeLabel}
                isStarted={c.isStarted}
                isCompleted={c.isCompleted}
                pct={pct}
              />
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {filtered.map(c => {
            const pct = c.kind === 'ft-lesson'
              ? (() => {
                  const a = assignments.find(x => `assign-${x.id}` === c.key);
                  if (!a?.refId) return null;
                  return c.isStarted && !c.isCompleted ? slidePercent(a.refId, 999) : null;
                })()
              : null;
            return (
              <CardShell
                key={c.key}
                href={c.href}
                externalUrl={c.externalUrl}
                title={c.title}
                level={c.level ? String(c.level) : undefined}
                badgeIcon={c.badgeIcon}
                badgeLabel={c.badgeLabel}
                isStarted={c.isStarted}
                isCompleted={c.isCompleted}
                pct={pct}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

