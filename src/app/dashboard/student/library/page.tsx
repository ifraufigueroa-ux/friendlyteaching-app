// FriendlyTeaching.cl — Student library catalogue
//
// 50 public-domain novels grouped by CEFR level. Opening a book
// mounts the EpubReader overlay; reading progress (cfi + percent)
// is persisted per-student in Firestore via useLibraryProgress and
// shown as a progress bar + "En progreso" / "Terminado" chip on the
// book row. The reader is dynamic-imported so epub.js never touches
// students who are just browsing the shelf.

'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen, ChevronDown, Search, Check, ArrowRight } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useLibraryProgress } from '@/hooks/useLibraryProgress';
import { useLibraryEpubs } from '@/hooks/useLibraryEpubs';
import {
  LIBRARY_LEVEL_NAMES,
  libraryBooksByLevel,
  type LibraryBook, type LibraryLevel,
} from '@/lib/data/library/novels';

// Keep epub.js and the reader chrome out of the main bundle.
const EpubReader = dynamic(() => import('@/components/library/EpubReader'), { ssr: false });

const LEVEL_ORDER: LibraryLevel[] = ['A', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_TONE: Record<LibraryLevel, { chip: string; ring: string; pill: string }> = {
  A:  { chip: 'bg-emerald-100 text-emerald-700', ring: 'border-emerald-200',  pill: 'bg-emerald-50 text-emerald-700' },
  B1: { chip: 'bg-sky-100 text-sky-700',          ring: 'border-sky-200',      pill: 'bg-sky-50 text-sky-700' },
  B2: { chip: 'bg-amber-100 text-amber-800',      ring: 'border-amber-200',    pill: 'bg-amber-50 text-amber-800' },
  C1: { chip: 'bg-violet-100 text-violet-700',    ring: 'border-violet-200',   pill: 'bg-violet-50 text-violet-700' },
  C2: { chip: 'bg-rose-100 text-rose-700',        ring: 'border-rose-200',     pill: 'bg-rose-50 text-rose-700' },
};

export default function LibraryPage() {
  const { profile, firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? profile?.uid ?? '';
  const studentLevel = profile?.studentData?.level;

  const { byBook } = useLibraryProgress(uid);
  const hostedEpubs = useLibraryEpubs();
  const [reading, setReading] = useState<LibraryBook | null>(null);
  const [filter, setFilter]   = useState('');

  // Fold the Firebase Storage mirror URL into each book when present.
  // Falls through to pageUrl / derived Standard Ebooks URL otherwise.
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

  // "In progress" summary chip — anything with any progress > 0 and < 98%.
  const inProgressCount = Object.values(byBook).filter(p => (p.percent ?? 0) > 0 && (p.percent ?? 0) < 0.98).length;
  const finishedCount   = Object.values(byBook).filter(p => (p.percent ?? 0) >= 0.98).length;

  return (
    <div className="min-h-screen bg-grid p-4 md:p-6">
      <div className="max-w-5xl mx-auto bg-white/85 backdrop-blur-sm rounded-3xl border border-[#e5d9f2] shadow-[0_18px_48px_-24px_rgba(90,61,122,0.35)] p-6 md:p-8">
        <TopBar
          title="Library"
          subtitle="50 public-domain English novels grouped by CEFR level. Read in the browser — your place is saved automatically."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard/student' },
            { label: 'Library' },
          ]}
        />

        {/* Summary + search */}
        <div className="mt-6 flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 bg-[#F7EFFF] border border-[#E5D9F2] rounded-full px-3 py-1.5 text-[11px] font-bold text-[#5A3D7A]">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} /> 50 novelas
          </div>
          {inProgressCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 text-[11px] font-bold text-amber-800">
              📖 {inProgressCount} en progreso
            </div>
          )}
          {finishedCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 text-[11px] font-bold text-emerald-800">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> {finishedCount} terminadas
            </div>
          )}
          <div className="ml-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2.25} />
            <input
              type="search"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Buscar título o autor…"
              className="pl-9 pr-3 py-2 rounded-xl border border-[#E5D9F2] bg-white text-sm w-full md:w-72 focus:outline-none focus:border-[#9474c4] focus:ring-2 focus:ring-[#C8A8DC]/50 transition-colors"
            />
          </div>
        </div>

        {/* Suggested for your level (if we know it) */}
        {studentLevel && (
          <SuggestedForYou
            level={studentLevel}
            books={byLevel}
            byBook={byBook}
            onOpen={b => setReading(b)}
          />
        )}

        {/* Level sections */}
        <div className="space-y-4">
          {LEVEL_ORDER.map((lvl) => {
            const books = filtered[lvl];
            if (books.length === 0) return null;
            return (
              <LevelSection
                key={lvl}
                level={lvl}
                books={books}
                byBook={byBook}
                defaultOpen={LEVEL_ORDER.indexOf(lvl) <= 1}
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

// ── Suggested shelf ──────────────────────────────────────────

function SuggestedForYou({
  level, books, byBook, onOpen,
}: {
  level: string;
  books: Record<LibraryLevel, LibraryBook[]>;
  byBook: Record<string, { percent?: number; cfi?: string }>;
  onOpen: (b: LibraryBook) => void;
}) {
  // Map the student profile level to a library band. A0/A1/A2 → 'A';
  // B1/B1+ → 'B1'; B2/B2+ → 'B2'; C1 → 'C1'; C2 → 'C2'.
  const band: LibraryLevel =
    /^A/.test(level)  ? 'A'
    : /^B1/.test(level) ? 'B1'
    : /^B2/.test(level) ? 'B2'
    : /^C1/.test(level) ? 'C1'
    : /^C2/.test(level) ? 'C2'
    : 'B1';
  const pick = books[band].slice(0, 3);
  if (pick.length === 0) return null;
  const tone = LEVEL_TONE[band];
  return (
    <div className="mb-6 bg-gradient-to-br from-[#F7EFFF] to-white rounded-2xl border border-[#E5D9F2] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tone.chip}`}>
          {LIBRARY_LEVEL_NAMES[band]}
        </span>
        <p className="text-xs font-bold text-[#3D1F6B]">Recomendado para tu nivel</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {pick.map(b => {
          const p = byBook[b.id];
          const pct = p?.percent ?? 0;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onOpen(b)}
              className="text-left bg-white rounded-xl border border-[#E5D9F2] p-3 hover:border-[#9474c4] hover:shadow-sm transition-all"
            >
              <p className="font-fun font-bold text-sm text-[#3D1F6B] leading-snug line-clamp-2">{b.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{b.author}</p>
              {pct > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(pct * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">{Math.round(pct * 100)}% leído</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Level section (collapsible shelf) ────────────────────────

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

  return (
    <section className={`bg-white rounded-2xl border-2 ${tone.ring} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-black ${tone.chip}`}>
          {books[0]?.levelLabel ?? level}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-fun font-bold text-[#3D1F6B] text-sm leading-tight">{LIBRARY_LEVEL_NAMES[level]}</p>
          <p className="text-[11px] text-slate-500">{books.length} {books.length === 1 ? 'novela' : 'novelas'}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#5A3D7A] transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.25} />
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {books.map(b => {
            const p   = byBook[b.id];
            const pct = p?.percent ?? 0;
            const finished = pct >= 0.98 || !!p?.finishedAt;
            return (
              <div key={b.id} className="px-5 py-3 flex items-center gap-4 hover:bg-[#FBF8F3] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#3D1F6B]">{b.title}</span>
                    {finished && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                        <Check className="w-3 h-3" strokeWidth={3} /> Terminado
                      </span>
                    )}
                    {!finished && pct > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">
                        📖 {Math.round(pct * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 truncate">{b.author}</p>
                  {pct > 0 && !finished && (
                    <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden max-w-sm">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(pct * 100)}%` }} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(b)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${tone.pill} border ${tone.ring} hover:opacity-80 active:scale-95 transition-all`}
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
