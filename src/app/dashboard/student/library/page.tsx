// FriendlyTeaching.cl — Student library catalogue
//
// 50 public-domain novels grouped by CEFR level, styled to match the
// Daily Practice look-and-feel: bg-grid, game-card chrome, font-fun
// headings, purple accents. Opening a book mounts the EpubReader
// overlay; reading progress persists per-student in Firestore and
// surfaces on every book row (progress ring + chip).

'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  BookOpen, ChevronDown, Search, Check, ArrowRight,
  BookMarked, Flame, Sparkles, Highlighter,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useLibraryProgress } from '@/hooks/useLibraryProgress';
import { useLibraryEpubs } from '@/hooks/useLibraryEpubs';
import {
  LIBRARY_LEVEL_NAMES,
  libraryBooksByLevel,
  type LibraryBook, type LibraryLevel,
} from '@/lib/data/library/novels';

const EpubReader = dynamic(() => import('@/components/library/EpubReader'), { ssr: false });

const LEVEL_ORDER: LibraryLevel[] = ['A', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_TONE: Record<LibraryLevel, { chip: string; ring: string; sweep: string; pill: string; dot: string }> = {
  A:  { chip: 'bg-emerald-100 text-emerald-700', ring: 'border-l-emerald-500', sweep: 'from-emerald-50 to-white',  pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  B1: { chip: 'bg-sky-100 text-sky-700',          ring: 'border-l-sky-500',      sweep: 'from-sky-50 to-white',       pill: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
  B2: { chip: 'bg-amber-100 text-amber-800',      ring: 'border-l-amber-500',    sweep: 'from-amber-50 to-white',     pill: 'bg-amber-50 text-amber-800 border-amber-200',       dot: 'bg-amber-500' },
  C1: { chip: 'bg-violet-100 text-violet-700',    ring: 'border-l-violet-500',   sweep: 'from-violet-50 to-white',    pill: 'bg-violet-50 text-violet-700 border-violet-200',    dot: 'bg-violet-500' },
  C2: { chip: 'bg-rose-100 text-rose-700',        ring: 'border-l-rose-500',     sweep: 'from-rose-50 to-white',      pill: 'bg-rose-50 text-rose-700 border-rose-200',          dot: 'bg-rose-500' },
};

function bandFor(level: string | undefined): LibraryLevel {
  if (!level) return 'B1';
  if (/^A/.test(level))  return 'A';
  if (/^B1/.test(level)) return 'B1';
  if (/^B2/.test(level)) return 'B2';
  if (/^C1/.test(level)) return 'C1';
  if (/^C2/.test(level)) return 'C2';
  return 'B1';
}

export default function LibraryPage() {
  const { profile, firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? profile?.uid ?? '';
  const studentLevel = profile?.studentData?.level;

  const { byBook } = useLibraryProgress(uid);
  const hostedEpubs = useLibraryEpubs();
  const [reading, setReading] = useState<LibraryBook | null>(null);
  const [filter, setFilter]   = useState('');

  const byLevel = useMemo(() => {
    const raw = libraryBooksByLevel();
    const merged: Record<LibraryLevel, LibraryBook[]> = { A: [], B1: [], B2: [], C1: [], C2: [] };
    for (const lvl of Object.keys(raw) as LibraryLevel[]) {
      merged[lvl] = raw[lvl].map(b => hostedEpubs[b.id] ? { ...b, epubUrl: hostedEpubs[b.id] } : b);
    }
    return merged;
  }, [hostedEpubs]);

  const filtered = useMemo<Record<LibraryLevel, LibraryBook[]>>(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return byLevel;
    const next: Record<LibraryLevel, LibraryBook[]> = { A: [], B1: [], B2: [], C1: [], C2: [] };
    for (const lvl of LEVEL_ORDER) {
      next[lvl] = byLevel[lvl].filter(b =>
        b.title.toLowerCase().includes(needle) ||
        b.author.toLowerCase().includes(needle),
      );
    }
    return next;
  }, [byLevel, filter]);

  // Summary counts
  const inProgressCount = Object.values(byBook).filter(p => (p.percent ?? 0) > 0 && (p.percent ?? 0) < 0.98).length;
  const finishedCount   = Object.values(byBook).filter(p => (p.percent ?? 0) >= 0.98).length;

  // Most-recently read in-progress book → hero "Continue reading" card
  const continueBook = useMemo<LibraryBook | null>(() => {
    const entries = Object.values(byBook)
      .filter(p => (p.percent ?? 0) > 0 && (p.percent ?? 0) < 0.98)
      .sort((a, b) => (b.lastReadAt?.toMillis?.() ?? 0) - (a.lastReadAt?.toMillis?.() ?? 0));
    if (entries.length === 0) return null;
    const rawBook = Object.values(byLevel).flat().find(b => b.id === entries[0].bookId);
    return rawBook ?? null;
  }, [byBook, byLevel]);

  const studentBand = bandFor(studentLevel);
  const recommended = byLevel[studentBand].slice(0, 3);

  return (
    <div className="min-h-screen bg-grid p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <TopBar
          title="Library"
          subtitle="50 novelas de dominio público en inglés — tu progreso se guarda solo."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard/student' },
            { label: 'Library' },
          ]}
        />

        {/* ── Hero ───────────────────────────────────────────────── */}
        <div className="mt-6 game-card rounded-3xl p-4 sm:p-6 md:p-7 relative overflow-hidden bg-gradient-to-br from-[#f3eefc] via-white to-[#FFF4F0]">
          <div className="flex items-start gap-3 sm:gap-5 relative">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-sm border-2 border-[#e5d9f2] flex items-center justify-center flex-shrink-0">
              <BookMarked className="w-6 h-6 sm:w-7 sm:h-7 text-[#845ec2]" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-[#845ec2] text-white px-3 py-1 rounded-full text-[10px] font-fun font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" strokeWidth={2.5} /> FriendlyTeaching Library
              </span>
              <h2 className="font-fun text-xl sm:text-2xl md:text-3xl font-bold text-[#4b3869] leading-tight tracking-tight">
                Elige un libro, lee a tu ritmo.
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-snug">
                Seleccionar una palabra abre el diccionario; toca «Destacar» para marcarla y volver después.
              </p>
            </div>
          </div>

          {/* Stat chips */}
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <StatPill tone="purple"  icon={<BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} />} label="50 novelas" />
            {inProgressCount > 0 && (
              <StatPill tone="amber" icon={<Flame className="w-3.5 h-3.5" strokeWidth={2.5} />} label={`${inProgressCount} en progreso`} />
            )}
            {finishedCount > 0 && (
              <StatPill tone="emerald" icon={<Check className="w-3.5 h-3.5" strokeWidth={2.5} />} label={`${finishedCount} terminadas`} />
            )}
            {Object.values(byBook).some(h => h.cfi) && (
              <StatPill tone="rose" icon={<Highlighter className="w-3.5 h-3.5" strokeWidth={2.5} />} label="Tu último libro espera" />
            )}

            <div className="ml-auto relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2.25} />
              <input
                type="search"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Buscar título o autor…"
                className="w-full pl-9 pr-3 py-2 rounded-full border-2 border-[#e5d9f2] bg-white text-sm focus:outline-none focus:border-[#9474c4] focus:ring-2 focus:ring-[#C8A8DC]/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── Continue reading ─────────────────────────────────── */}
        {continueBook && (
          <button
            type="button"
            onClick={() => setReading(continueBook)}
            className="mt-5 w-full text-left game-card rounded-3xl p-4 sm:p-6 md:p-7 flex items-center gap-3 sm:gap-5 bg-gradient-to-r from-white to-[#FFF4F0] hover:from-[#f3eefc] transition-colors"
          >
            <ProgressRing percent={(byBook[continueBook.id]?.percent ?? 0) * 100} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-fun font-bold text-[#845ec2] uppercase tracking-widest mb-1">Seguir leyendo</p>
              <h3 className="font-fun text-lg sm:text-xl md:text-2xl font-bold text-[#4b3869] leading-tight truncate">
                {continueBook.title}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5 truncate">{continueBook.author}</p>
            </div>
            <span className="btn-game inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-fun font-bold text-xs uppercase tracking-wider shadow-md flex-shrink-0">
              <span className="hidden sm:inline">Continuar </span>
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </span>
          </button>
        )}

        {/* ── Recommended ──────────────────────────────────────── */}
        {studentLevel && recommended.length > 0 && !filter && (
          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-fun font-bold text-[#4b3869] text-lg">Recomendado para tu nivel</h3>
              <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${LEVEL_TONE[studentBand].chip}`}>
                {LIBRARY_LEVEL_NAMES[studentBand]}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommended.map(b => (
                <RecommendedCard key={b.id} book={b} progress={byBook[b.id]} onOpen={() => setReading(b)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Level sections ──────────────────────────────────── */}
        <div className="mt-6 space-y-4">
          {LEVEL_ORDER.map((lvl) => {
            const books = filtered[lvl];
            if (books.length === 0) return null;
            return (
              <LevelSection
                key={lvl}
                level={lvl}
                books={books}
                byBook={byBook}
                defaultOpen={LEVEL_ORDER.indexOf(lvl) <= 1 || !!filter}
                onOpen={b => setReading(b)}
              />
            );
          })}
        </div>

        <p className="text-[10px] text-slate-400 text-center mt-8">
          Biblioteca curada · EPUBs de dominio público vía <a className="underline hover:text-[#5A3D7A]" href="https://standardebooks.org" target="_blank" rel="noopener noreferrer">Standard Ebooks</a>
        </p>
      </div>

      {/* Reader overlay (lazy mounted) */}
      {reading && uid && (
        <EpubReader
          book={reading}
          studentId={uid}
          initialCfi={byBook[reading.id]?.cfi ?? null}
          onClose={() => setReading(null)}
        />
      )}
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────

function StatPill({ tone, icon, label }: {
  tone: 'purple' | 'emerald' | 'amber' | 'rose';
  icon: React.ReactNode;
  label: string;
}) {
  const t = {
    purple:  'bg-[#f3eefc] text-[#5A3D7A] border-[#e5d9f2]',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber:   'bg-amber-50 text-amber-800 border-amber-200',
    rose:    'bg-rose-50 text-rose-800 border-rose-200',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-[11px] font-fun font-bold ${t}`}>
      {icon} {label}
    </span>
  );
}

// ── Progress ring ────────────────────────────────────────────

function ProgressRing({ percent }: { percent: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const offset = C - (Math.min(100, Math.max(0, percent)) / 100) * C;
  return (
    <div className="relative flex-shrink-0">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={R} stroke="#f3eefc" strokeWidth="6" fill="none" />
        <circle
          cx="38" cy="38" r={R} stroke="#845ec2" strokeWidth="6" fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .5s ease' }}
          transform="rotate(-90 38 38)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-fun font-black text-sm text-[#4b3869]">
        {Math.round(percent)}%
      </span>
    </div>
  );
}

// ── Recommended book card ────────────────────────────────────

function RecommendedCard({
  book, progress, onOpen,
}: {
  book: LibraryBook;
  progress?: { percent?: number; cfi?: string };
  onOpen: () => void;
}) {
  const pct = (progress?.percent ?? 0) * 100;
  const started = pct > 0;
  const tone = LEVEL_TONE[book.level];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group game-card rounded-3xl p-5 text-left space-y-2 relative overflow-hidden bg-gradient-to-br ${tone.sweep}`}
    >
      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tone.chip}`}>
        {book.levelLabel}
      </span>
      <h4 className="font-fun text-base font-bold text-[#4b3869] leading-tight line-clamp-2">
        {book.title}
      </h4>
      <p className="text-[12px] text-slate-500 truncate">{book.author}</p>
      {started ? (
        <div>
          <div className="h-1.5 bg-white rounded-full overflow-hidden border border-[#e5d9f2]">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] font-bold text-emerald-700 mt-1">{Math.round(pct)}% leído</p>
        </div>
      ) : (
        <p className="text-[11px] font-bold text-[#9B7CB8] opacity-80 inline-flex items-center gap-1">
          Empezar <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
        </p>
      )}
    </button>
  );
}

// ── Level section (collapsible game-card shelf) ──────────────

function LevelSection({
  level, books, byBook, defaultOpen, onOpen,
}: {
  level:       LibraryLevel;
  books:       LibraryBook[];
  byBook:      Record<string, { percent?: number; cfi?: string; finishedAt?: unknown }>;
  defaultOpen: boolean;
  onOpen:      (b: LibraryBook) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tone = LEVEL_TONE[level];

  const started   = books.filter(b => (byBook[b.id]?.percent ?? 0) > 0).length;
  const total     = books.length;

  return (
    <section className={`game-card rounded-3xl overflow-hidden border-l-4 ${tone.ring}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-black ${tone.chip}`}>
          {books[0]?.levelLabel ?? level}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-fun font-bold text-[#4b3869] text-sm leading-tight">{LIBRARY_LEVEL_NAMES[level]}</p>
          <p className="text-[11px] text-slate-500">
            {total} {total === 1 ? 'novela' : 'novelas'}
            {started > 0 && <> · <span className="text-emerald-700 font-semibold">{started} empezadas</span></>}
          </p>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#5A3D7A] transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.25} />
      </button>
      {open && (
        <div className="border-t border-[#e5d9f2] divide-y divide-[#f3eefc] bg-white">
          {books.map(b => {
            const p   = byBook[b.id];
            const pct = p?.percent ?? 0;
            const finished = pct >= 0.98 || !!p?.finishedAt;
            return (
              <div key={b.id} className="px-5 py-3 flex items-center gap-4 hover:bg-[#FBF8F3] transition-colors">
                <span className={`w-2 h-2 rounded-full ${tone.dot} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-fun font-bold text-sm text-[#3D1F6B]">{b.title}</span>
                    {finished && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                        <Check className="w-3 h-3" strokeWidth={3} /> Terminado
                      </span>
                    )}
                    {!finished && pct > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                        <Flame className="w-3 h-3" strokeWidth={3} /> {Math.round(pct * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 truncate">{b.author}</p>
                  {pct > 0 && !finished && (
                    <div className="mt-1.5 h-1 bg-[#f3eefc] rounded-full overflow-hidden max-w-sm">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(pct * 100)}%` }} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(b)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-fun font-black ${tone.pill} border hover:opacity-80 active:scale-95 transition-all`}
                >
                  {pct > 0 && !finished ? 'Continuar' : 'Leer'} <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
