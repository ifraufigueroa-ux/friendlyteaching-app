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
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useStudentAssignments } from '@/hooks/useStudentAssignments';
import { useStudentMovieLessons } from '@/hooks/useMovieLessons';
import { useStudentMusicLessons } from '@/hooks/useMusicLessons';
import { useStudentTextLessons } from '@/hooks/useTextLessons';
import { useStudentProgress } from '@/hooks/useProgress';
import { detectMaterialType } from '@/components/planner/bookingUtils';
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
type CardKind = 'ft-lesson' | 'ft-movie' | 'ft-music' | 'ft-text' | 'external';
interface UnifiedCard {
  key: string;
  kind: CardKind;
  title: string;
  code?: string;
  level?: LessonLevel | string;
  href: string;         // internal href for FT cards
  externalUrl?: string; // for external cards (open in new tab)
  badgeIcon: string;
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
  badgeIcon: string;
  badgeLabel: string;
  isStarted?: boolean;
  isCompleted?: boolean;
  pct?: number | null;
  notes?: string;
}

function CardShell({ href, externalUrl, title, code, level, badgeIcon, badgeLabel, isStarted, isCompleted, pct, notes }: CardShellProps) {
  const levelColor = LEVEL_COLORS[level ?? ''] ?? 'bg-gray-100 text-gray-600';
  const topBar = isStarted && !isCompleted && pct != null
    ? <div className="h-1.5 w-full bg-gray-100"><div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} /></div>
    : <div className={`h-1.5 w-full ${isCompleted ? 'bg-green-400' : externalUrl ? 'bg-sky-300' : 'bg-[#C8A8DC]'}`} />;

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
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full block text-center mb-2 ${
            isCompleted ? 'bg-green-100 text-green-700' :
            isStarted ? 'bg-amber-100 text-amber-700' :
            externalUrl ? 'bg-sky-100 text-sky-700' :
            'bg-[#F0E5FF] text-[#5A3D7A]'
          }`}>
            {isCompleted ? '✅ Completada' : isStarted ? '⏳ En progreso' : externalUrl ? '🔗 Externa' : '📖 Nueva'}
          </span>
          <span className="block w-full text-center px-2 py-1.5 bg-[#C8A8DC] group-hover:bg-[#9B7CB8] text-white rounded-xl text-[10px] font-bold transition-colors">
            {externalUrl ? 'Abrir ↗' : isCompleted ? 'Repasar' : isStarted ? 'Continuar' : 'Abrir'}
          </span>
        </div>
      </div>
    </div>
  );

  if (externalUrl) {
    return (
      <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="w-48 flex-shrink-0 snap-start group">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href ?? '#'} className="w-48 flex-shrink-0 snap-start group">
      {inner}
    </Link>
  );
}

export default function StudentLessonsPage() {
  const { profile, firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const teacherUid = profile?.studentData?.approvedByTeacherId ?? '';

  const { assignments, loading: aLoading } = useStudentAssignments(uid);
  const { lessons: movieLessons, loading: mLoading } = useStudentMovieLessons(uid);
  const { lessons: musicLessons, loading: mmLoading } = useStudentMusicLessons(teacherUid, uid);
  const { lessons: textLessons, loading: tLoading } = useStudentTextLessons(uid);
  const { progress } = useStudentProgress(uid);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<'all' | 'ft' | 'external'>('all');

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
        badgeIcon: isFT ? '📖' : (material?.icon || '🔗'),
        badgeLabel: isFT ? 'FT Librería' : (material?.label || 'Link externo'),
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
        badgeIcon: '🎬',
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
        title: (l.song?.title || l.title || 'Canción'),
        level: l.level,
        href: `/dashboard/student/music/${l.id}`,
        badgeIcon: '🎵',
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
        title: l.title || 'Lectura',
        level: l.level,
        href: `/dashboard/student/texts/${l.id}`,
        badgeIcon: '📖',
        badgeLabel: 'FriendlyTales',
        isCompleted: false,
        isStarted: false,
        assignedAtMs: (l as { updatedAt?: { toMillis?: () => number } }).updatedAt?.toMillis?.() ?? 0,
      });
    }

    return out.sort((a, b) => b.assignedAtMs - a.assignedAtMs);
  }, [assignments, movieLessons, musicLessons, textLessons, startedLessonIds, completedLessonIds]);

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

  const loading = aLoading || mLoading || mmLoading || tLoading;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--gradient-hero)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-[#5A3D7A]">📚 Mis lecciones</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Todo el material que tu profe te ha asignado — FriendlyTeaching + externo.
          </p>
        </div>
        <Link href="/dashboard/student/progress"
          className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors">
          Ver progreso →
        </Link>
      </div>

      {/* Filters row */}
      {cards.length > 0 && (
        <div className="space-y-2 mb-4">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lección..."
            className="w-full px-4 py-2 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white/70 backdrop-blur-sm shadow-glass"
          />
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'ft', 'external'] as const).map(k => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  kindFilter === k ? 'bg-[#5A3D7A] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'
                }`}
              >
                {k === 'all' ? 'Todos' : k === 'ft' ? 'FriendlyTeaching' : 'Externas'}
              </button>
            ))}
          </div>
          {availableLevels.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setLevelFilter('')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  !levelFilter ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'
                }`}
              >
                Todos los niveles
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
          <p className="text-4xl mb-3">📭</p>
          <p className="text-[#5A3D7A] font-bold">Aún no tienes material asignado</p>
          <p className="text-gray-500 text-sm mt-1">Tu profesor puede asignarte lecciones de FriendlyTeaching o material externo (Off2Class, Drive, YouTube, etc.).</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-gray-500 text-sm">No hay lecciones que coincidan.</p>
          <button onClick={() => { setSearch(''); setLevelFilter(''); setKindFilter('all'); }}
            className="mt-2 text-xs font-semibold text-[#9B7CB8] underline">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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

