// FriendlyTeaching.cl — EPUB reader (library)
//
// Full-screen reader overlay backed by epub.js. Loads the book via
// its Firebase Storage mirror (pre-uploaded) or the Standard Ebooks
// direct URL as a fallback. Student progress (CFI + percent) is
// written to Firestore through saveLibraryProgress — debounced so a
// fast tap-through doesn't hammer the DB.
//
// We dynamic-import epub.js so the ~200KB library stays out of the
// main bundle; students who never open a book never pay the cost.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Minus, Plus, Loader2, AlertTriangle,
} from 'lucide-react';
import { saveLibraryProgress } from '@/hooks/useLibraryProgress';
import type { LibraryBook } from '@/lib/data/library/novels';
import { pageToStandardEbooksEpub } from '@/lib/data/library/novels';

interface Props {
  book:         LibraryBook;
  studentId:    string;
  initialCfi?:  string | null;
  onClose:      () => void;
}

// Minimal structural typings for the subset of epub.js we touch.
// epub.js' own types are shaky; this keeps the compiler happy without
// pulling a wrong @types.
type Location = {
  start: { cfi: string; percentage?: number; href?: string };
  end?:  { cfi: string };
};
interface Rendition {
  display:   (target?: string) => Promise<unknown>;
  prev:      () => Promise<unknown>;
  next:      () => Promise<unknown>;
  on:        (event: 'relocated' | 'rendered', fn: (loc: Location) => void) => void;
  themes:    { fontSize: (size: string) => void };
  destroy:   () => void;
}
interface EpubBook {
  renderTo:  (el: HTMLElement, opts: Record<string, unknown>) => Rendition;
  locations: { generate: (len: number) => Promise<unknown>; percentageFromCfi: (cfi: string) => number };
  destroy:   () => void;
  ready:     Promise<unknown>;
}

const FONT_MIN = 80, FONT_MAX = 180, FONT_STEP = 10;
const LS_FONT  = 'ft-library:fontSize:v1';

export default function EpubReader({ book, studentId, initialCfi, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState<number>(() => {
    if (typeof window === 'undefined') return 100;
    const stored = Number(window.localStorage?.getItem(LS_FONT));
    return Number.isFinite(stored) && stored >= FONT_MIN && stored <= FONT_MAX ? stored : 100;
  });

  const url = book.epubUrl ?? pageToStandardEbooksEpub(book.pageUrl) ?? '';

  // ── Mount epub.js when the overlay opens ───────────────────────
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!url || !containerRef.current) return;
      setLoading(true);
      setErr(null);
      try {
        // Dynamic import keeps epub.js out of the main bundle.
        const mod = await import('epubjs');
        const ePub = (mod as unknown as { default: (src: string) => EpubBook }).default
                  ?? (mod as unknown as (src: string) => EpubBook);
        if (cancelled) return;
        const b = ePub(url) as EpubBook;
        bookRef.current = b;
        const rendition = b.renderTo(containerRef.current!, {
          width:  '100%',
          height: '100%',
          flow:   'paginated',
          spread: 'none',
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;
        rendition.themes.fontSize(`${fontScale}%`);
        // Jump to the student's last location, or start from the beginning.
        await rendition.display(initialCfi ?? undefined);
        // Generate locations index in the background so percent works
        // once it's ready; the first page can be read before this
        // resolves.
        void b.locations.generate(1024).catch(() => undefined);
        rendition.on('relocated', (loc: Location) => {
          const cfi = loc?.start?.cfi;
          if (!cfi) return;
          let percent = loc?.start?.percentage ?? 0;
          if (!percent && bookRef.current) {
            try { percent = bookRef.current.locations.percentageFromCfi(cfi) ?? 0; } catch { /* ignore */ }
          }
          scheduleSave(cfi, percent);
        });
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        console.warn('[EpubReader] load failed:', e);
        setErr('No pudimos abrir este libro. Podés descargarlo directo desde la fuente original.');
        setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      try { renditionRef.current?.destroy(); } catch { /* ignore */ }
      try { bookRef.current?.destroy(); } catch { /* ignore */ }
      renditionRef.current = null;
      bookRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, url]);

  // ── Debounced progress writer ──────────────────────────────────
  const scheduleSave = useCallback((cfi: string, percent: number) => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const finished = percent >= 0.98;
      void saveLibraryProgress(studentId, book.id, { cfi, percent, finished });
    }, 1200);
  }, [studentId, book.id]);

  // ── Font controls ──────────────────────────────────────────────
  function applyFont(next: number) {
    const clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, next));
    setFontScale(clamped);
    try { window.localStorage?.setItem(LS_FONT, String(clamped)); } catch { /* ignore */ }
    try { renditionRef.current?.themes.fontSize(`${clamped}%`); } catch { /* ignore */ }
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft')  { renditionRef.current?.prev(); return; }
      if (e.key === 'ArrowRight') { renditionRef.current?.next(); return; }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Lector · ${book.title}`}
      className="fixed inset-0 z-50 bg-[#FBF8F3] flex flex-col"
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-[#ECE6DD] px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#5A3D7A] bg-[#F7EFFF] border border-[#E5D9F2] hover:bg-[#EEDFFB] transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-fun font-bold text-[#3D1F6B] text-sm truncate leading-tight">{book.title}</p>
          <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => applyFont(fontScale - FONT_STEP)}
            disabled={fontScale <= FONT_MIN}
            className="w-8 h-8 rounded-lg border border-[#E5D9F2] bg-white text-[#5A3D7A] hover:bg-[#F7EFFF] disabled:opacity-40 inline-flex items-center justify-center transition-colors"
            aria-label="Letra más chica"
            title="Letra más chica"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-10 text-center">{fontScale}%</span>
          <button
            type="button"
            onClick={() => applyFont(fontScale + FONT_STEP)}
            disabled={fontScale >= FONT_MAX}
            className="w-8 h-8 rounded-lg border border-[#E5D9F2] bg-white text-[#5A3D7A] hover:bg-[#F7EFFF] disabled:opacity-40 inline-flex items-center justify-center transition-colors"
            aria-label="Letra más grande"
            title="Letra más grande"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 w-8 h-8 rounded-lg border border-[#E5D9F2] bg-white text-slate-400 hover:text-[#5A3D7A] hover:bg-[#F7EFFF] inline-flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* ── Reader surface ──────────────────────────────────────── */}
      <main className="flex-1 relative overflow-hidden">
        {loading && !err && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#5A3D7A] bg-[#FBF8F3]">
            <Loader2 className="w-8 h-8 animate-spin" strokeWidth={2.25} />
            <div className="text-center">
              <p className="font-fun font-bold text-sm">Cargando libro…</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Primera vez puede tardar unos segundos mientras baja el ePub.
              </p>
            </div>
          </div>
        )}
        {err && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 bg-[#FBF8F3]">
            <AlertTriangle className="w-8 h-8 text-amber-500" strokeWidth={2.25} />
            <p className="font-fun font-bold text-[#3D1F6B] text-sm">No pudimos abrir este libro</p>
            <p className="text-xs text-slate-500 text-center max-w-md">{err}</p>
            <a
              href={book.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#5A3D7A] hover:text-[#3D1F6B]"
            >
              Abrir en Standard Ebooks ↗
            </a>
          </div>
        )}
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ visibility: loading || err ? 'hidden' : 'visible' }}
        />

        {/* Nav arrows */}
        {!err && !loading && (
          <>
            <button
              type="button"
              onClick={() => renditionRef.current?.prev()}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#E5D9F2] text-[#5A3D7A] shadow-sm hover:bg-[#F7EFFF] flex items-center justify-center transition-colors"
              aria-label="Página anterior"
              title="Página anterior (←)"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => renditionRef.current?.next()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-[#E5D9F2] text-[#5A3D7A] shadow-sm hover:bg-[#F7EFFF] flex items-center justify-center transition-colors"
              aria-label="Página siguiente"
              title="Página siguiente (→)"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </>
        )}
      </main>
    </div>
  );
}
