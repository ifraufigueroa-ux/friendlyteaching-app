// FriendlyTeaching.cl — EPUB reader (library)
//
// Full-screen overlay backed by epub.js with two in-reader tools the
// student can trigger by selecting text:
//
//   · Dictionary — fetches /api/dictionary/{word} and shows phonetic
//     + definitions in a popover above the selection.
//   · Highlighter — persists the selection as a yellow mark via
//     useLibraryHighlights; the mark reappears on every reopen and is
//     deleteable with one tap.
//
// Progress (cfi + percent) is debounced to Firestore via
// saveLibraryProgress — same shape as before. epub.js is dynamic-
// imported so the main bundle stays slim.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, ArrowLeft, ChevronLeft, ChevronRight,
  Minus, Plus, Loader2, AlertTriangle,
  Highlighter, BookOpen, Trash2,
} from 'lucide-react';
import { saveLibraryProgress } from '@/hooks/useLibraryProgress';
import { useLibraryHighlights, type BookHighlight } from '@/hooks/useLibraryHighlights';
import type { LibraryBook } from '@/lib/data/library/novels';
import { pageToStandardEbooksEpub } from '@/lib/data/library/novels';

interface Props {
  book:         LibraryBook;
  studentId:    string;
  initialCfi?:  string | null;
  onClose:      () => void;
}

// Minimal structural typings for the subset of epub.js we touch.
type Location = {
  start: { cfi: string; percentage?: number; href?: string };
  end?:  { cfi: string };
};
interface EpubContents {
  window:   Window & { getSelection?: () => Selection | null };
  document: Document;
}
interface Annotations {
  add:    (type: string, cfiRange: string, data: Record<string, unknown>, cb: (e: Event) => void, className: string, styles: Record<string, string>) => void;
  remove: (cfiRange: string, type: string) => void;
}
interface Rendition {
  display:   (target?: string) => Promise<unknown>;
  prev:      () => Promise<unknown>;
  next:      () => Promise<unknown>;
  on:        (event: string, fn: (...args: unknown[]) => void) => void;
  themes:    { fontSize: (size: string) => void };
  annotations: Annotations;
  resize:    (w?: number | string, h?: number | string) => void;
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
const HIGHLIGHT_COLOR = '#FFE083';

interface SelectionCtx {
  text:      string;
  cfiRange:  string;
  rect:      { top: number; left: number; width: number; height: number };
  existingHighlightId?: string | null;
}
interface DictEntry {
  word: string;
  found: boolean;
  phonetic?: string;
  meanings?: { partOfSpeech: string; definitions: { definition: string; example: string }[] }[];
}

export default function EpubReader({ book, studentId, initialCfi, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const contentsRef = useRef<EpubContents | null>(null);
  // Keep the latest highlights accessible from inside the epub.js
  // callbacks without re-binding them on every change.
  const highlightsRef = useRef<BookHighlight[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState<number>(() => {
    if (typeof window === 'undefined') return 100;
    const stored = Number(window.localStorage?.getItem(LS_FONT));
    return Number.isFinite(stored) && stored >= FONT_MIN && stored <= FONT_MAX ? stored : 100;
  });

  const [sel, setSel] = useState<SelectionCtx | null>(null);
  const [dict, setDict] = useState<{ loading: boolean; entry?: DictEntry; error?: string } | null>(null);

  const { items: highlights, add: addHighlight, remove: removeHighlight } = useLibraryHighlights(studentId, book.id);
  highlightsRef.current = highlights;

  const url = book.epubUrl ?? pageToStandardEbooksEpub(book.pageUrl) ?? '';

  // ── Mount epub.js when the overlay opens ───────────────────────
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (!url || !containerRef.current) return;
      setLoading(true);
      setErr(null);
      try {
        const mod = await import('epubjs');
        const ePub = (mod as unknown as { default: (src: string) => EpubBook }).default
                  ?? (mod as unknown as (src: string) => EpubBook);
        if (cancelled) return;
        const b = ePub(url) as EpubBook;
        bookRef.current = b;
        // Wait for the book package to parse BEFORE rendering — epub.js's
        // paginated flow needs the spine ready, otherwise the first few
        // front-matter sections (cover / titlepage / imprint) render but
        // the real chapters never paginate correctly and later pages come
        // out blank. Incident 2026-11-24: content disappeared after the
        // third page on every Standard Ebooks title.
        await b.ready;
        if (cancelled) return;
        // Measure the container once so epub.js gets real numeric dimensions
        // instead of the percentage strings (which can resolve to 0 while
        // the overlay animates in, poisoning the first layout).
        const containerEl = containerRef.current!;
        const rect0 = containerEl.getBoundingClientRect();
        const rendition = b.renderTo(containerEl, {
          width:  Math.max(320, Math.floor(rect0.width))  || '100%',
          height: Math.max(400, Math.floor(rect0.height)) || '100%',
          flow:   'paginated',
          spread: 'none',
          // Keep epub.js's own column-measurement scripts inside the
          // iframe enabled — setting this to `false` disables scripts
          // in the sandbox and the second spine section onwards fails
          // to paginate (blank pages).
          allowScriptedContent: true,
        });
        renditionRef.current = rendition;
        rendition.themes.fontSize(`${fontScale}%`);
        await rendition.display(initialCfi ?? undefined);
        void b.locations.generate(1024).catch(() => undefined);

        // Resize the rendition whenever the reader's content area actually
        // changes size (window resize, keyboard, orientation, dev-tools).
        // Paginated flow needs this call or the columns stay at the
        // original width and later chapters render in the wrong rect.
        const ro = new ResizeObserver(() => {
          const r = containerEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            try { rendition.resize(Math.floor(r.width), Math.floor(r.height)); }
            catch { /* ignore mid-destroy */ }
          }
        });
        ro.observe(containerEl);
        resizeObserverRef.current = ro;

        // Progress writes
        rendition.on('relocated', ((loc: Location) => {
          const cfi = loc?.start?.cfi;
          if (!cfi) return;
          let percent = loc?.start?.percentage ?? 0;
          if (!percent && bookRef.current) {
            try { percent = bookRef.current.locations.percentageFromCfi(cfi) ?? 0; } catch { /* ignore */ }
          }
          scheduleSave(cfi, percent);
          setSel(null); setDict(null);
        }) as (...args: unknown[]) => void);

        // Keep reference to the inner iframe document so we can
        // measure selections and translate iframe-relative rects
        // into window coordinates.
        rendition.on('rendered', ((_section: unknown, c: EpubContents) => {
          contentsRef.current = c;
          // Re-apply existing highlights into this section.
          for (const h of highlightsRef.current) {
            try {
              rendition.annotations.add(
                'highlight',
                h.cfiRange,
                { id: h.id },
                () => undefined,
                'ft-highlight',
                { fill: HIGHLIGHT_COLOR, 'fill-opacity': '0.4' },
              );
            } catch { /* cfi not in this spine section — skip */ }
          }
        }) as (...args: unknown[]) => void);

        // Text selection → toolbar
        rendition.on('selected', ((cfiRange: string, c: EpubContents) => {
          try {
            const selWin = c.window.getSelection?.();
            const text = (selWin?.toString() ?? '').trim();
            if (!text) return;
            const range = selWin?.rangeCount ? selWin.getRangeAt(0) : null;
            if (!range) return;
            const rects = range.getClientRects();
            const r = rects[rects.length - 1] ?? range.getBoundingClientRect();
            // Translate from iframe → window coords.
            const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement | null;
            const iframeRect = iframe?.getBoundingClientRect();
            const top  = (iframeRect?.top  ?? 0) + r.top;
            const left = (iframeRect?.left ?? 0) + r.left;
            const existing = highlightsRef.current.find(h => h.cfiRange === cfiRange);
            setSel({
              text, cfiRange,
              rect: { top, left, width: r.width, height: r.height },
              existingHighlightId: existing?.id,
            });
            setDict(null);
          } catch (e) {
            console.warn('[EpubReader] selection handler failed:', e);
          }
        }) as (...args: unknown[]) => void);

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
      try { resizeObserverRef.current?.disconnect(); } catch { /* ignore */ }
      resizeObserverRef.current = null;
      try { renditionRef.current?.destroy(); } catch { /* ignore */ }
      try { bookRef.current?.destroy(); } catch { /* ignore */ }
      renditionRef.current = null;
      bookRef.current = null;
      contentsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, url]);

  // Re-apply highlights when the live Firestore list changes for an
  // already-mounted section (e.g. the student just added one).
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    for (const h of highlights) {
      try {
        rendition.annotations.add(
          'highlight',
          h.cfiRange,
          { id: h.id },
          () => undefined,
          'ft-highlight',
          { fill: HIGHLIGHT_COLOR, 'fill-opacity': '0.4' },
        );
      } catch { /* ignore — may already be applied or outside current section */ }
    }
  }, [highlights]);

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

  // ── Dictionary lookup ──────────────────────────────────────────
  const lookupSelection = useCallback(async () => {
    if (!sel) return;
    const firstWord = sel.text.split(/\s+/)[0]?.replace(/[^a-zA-Z'-]/g, '') ?? '';
    if (!firstWord) return;
    setDict({ loading: true });
    try {
      const res = await fetch(`/api/dictionary/${encodeURIComponent(firstWord.toLowerCase())}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const entry = (await res.json()) as DictEntry;
      setDict({ loading: false, entry });
    } catch (e) {
      console.warn('[EpubReader] dict lookup failed:', e);
      setDict({ loading: false, error: 'No pudimos buscar esa palabra.' });
    }
  }, [sel]);

  // ── Highlight add / remove ─────────────────────────────────────
  const highlightSelection = useCallback(async () => {
    if (!sel) return;
    if (sel.existingHighlightId) {
      // Already highlighted — toolbar acts as "remove".
      try { renditionRef.current?.annotations.remove(sel.cfiRange, 'highlight'); } catch { /* ignore */ }
      await removeHighlight(sel.existingHighlightId);
    } else {
      try {
        renditionRef.current?.annotations.add(
          'highlight',
          sel.cfiRange,
          {},
          () => undefined,
          'ft-highlight',
          { fill: HIGHLIGHT_COLOR, 'fill-opacity': '0.4' },
        );
      } catch { /* ignore */ }
      await addHighlight({ cfiRange: sel.cfiRange, text: sel.text, color: HIGHLIGHT_COLOR });
    }
    try {
      contentsRef.current?.window.getSelection?.()?.removeAllRanges();
    } catch { /* ignore */ }
    setSel(null); setDict(null);
  }, [sel, addHighlight, removeHighlight]);

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
          <div className="hidden sm:flex items-center gap-1 pr-2 mr-1 border-r border-[#E5D9F2]">
            <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-1 text-[10px] font-black text-amber-800">
              <Highlighter className="w-3 h-3" strokeWidth={2.5} /> {highlights.length}
            </span>
          </div>
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

        {/* ── Selection toolbar ───────────────────────────────── */}
        {sel && !dict && (
          <SelectionToolbar
            rect={sel.rect}
            existing={!!sel.existingHighlightId}
            onDictionary={lookupSelection}
            onHighlight={highlightSelection}
            onDismiss={() => setSel(null)}
          />
        )}

        {/* ── Dictionary popover ──────────────────────────────── */}
        {dict && sel && (
          <DictionaryPopover
            rect={sel.rect}
            query={sel.text}
            state={dict}
            onClose={() => { setDict(null); setSel(null); }}
          />
        )}
      </main>
    </div>
  );
}

// ── Selection toolbar ─────────────────────────────────────────

function SelectionToolbar({
  rect, existing, onDictionary, onHighlight, onDismiss,
}: {
  rect:         SelectionCtx['rect'];
  existing:     boolean;
  onDictionary: () => void;
  onHighlight:  () => void;
  onDismiss:    () => void;
}) {
  // Anchor the toolbar above the selection; if it would clip the
  // window top, fall below instead.
  const TOOLBAR_HEIGHT = 44;
  const ABOVE_GAP = 8;
  const shouldFlipBelow = rect.top < TOOLBAR_HEIGHT + ABOVE_GAP + 16;
  const style: React.CSSProperties = {
    position: 'fixed',
    top:  shouldFlipBelow ? rect.top + rect.height + ABOVE_GAP : rect.top - TOOLBAR_HEIGHT - ABOVE_GAP,
    left: Math.max(12, Math.min(window.innerWidth - 220, rect.left)),
    zIndex: 60,
  };
  return (
    <div
      style={style}
      className="rounded-full bg-[#3D1F6B] shadow-xl border border-[#4b2e86] px-1 py-1 flex items-center gap-0.5 animate-ft-fade-in"
      onMouseLeave={onDismiss}
    >
      <button
        type="button"
        onClick={onDictionary}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black text-white hover:bg-white/10 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} /> Diccionario
      </button>
      <button
        type="button"
        onClick={onHighlight}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black transition-colors ${
          existing ? 'bg-rose-500 text-white hover:bg-rose-600' : 'text-white hover:bg-white/10'
        }`}
      >
        {existing
          ? <><Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Quitar</>
          : <><Highlighter className="w-3.5 h-3.5" strokeWidth={2.5} /> Destacar</>}
      </button>
    </div>
  );
}

// ── Dictionary popover ────────────────────────────────────────

function DictionaryPopover({
  rect, query, state, onClose,
}: {
  rect:   SelectionCtx['rect'];
  query:  string;
  state:  { loading: boolean; entry?: DictEntry; error?: string };
  onClose: () => void;
}) {
  const WIDTH  = 320;
  const HEIGHT = 280;
  const GAP    = 10;
  const shouldFlipBelow = rect.top < HEIGHT + GAP + 16;
  const left = Math.max(12, Math.min(window.innerWidth - WIDTH - 12, rect.left));
  const style: React.CSSProperties = {
    position: 'fixed',
    top:  shouldFlipBelow ? rect.top + rect.height + GAP : rect.top - HEIGHT - GAP,
    left,
    width: WIDTH,
    maxHeight: HEIGHT,
    zIndex: 60,
  };
  return (
    <div
      style={style}
      className="bg-white rounded-2xl shadow-2xl border-2 border-[#E5D9F2] flex flex-col overflow-hidden animate-ft-fade-in"
    >
      <div className="px-4 py-3 border-b border-[#E5D9F2] bg-[#F7EFFF] flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[#5A3D7A] flex-shrink-0" strokeWidth={2.25} />
        <div className="flex-1 min-w-0">
          <p className="font-fun font-extrabold text-sm text-[#3D1F6B] truncate">{state.entry?.word ?? query}</p>
          {state.entry?.phonetic && (
            <p className="text-[11px] text-[#5A3D7A] font-mono">{state.entry.phonetic}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white inline-flex items-center justify-center"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {state.loading && (
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> Buscando…
          </div>
        )}
        {state.error && (
          <p className="text-xs text-rose-600">{state.error}</p>
        )}
        {state.entry && state.entry.found === false && (
          <p className="text-xs text-slate-500">
            No encontramos esta palabra en el diccionario. Intentá con solo la raíz (sin plural o -ing).
          </p>
        )}
        {state.entry && state.entry.found !== false && (state.entry.meanings ?? []).map((m, i) => (
          <div key={i}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9474c4] mb-1">
              {m.partOfSpeech || '—'}
            </p>
            <ol className="space-y-1.5 text-xs text-slate-700 list-decimal list-inside">
              {m.definitions.map((d, j) => (
                <li key={j}>
                  <span>{d.definition}</span>
                  {d.example && (
                    <span className="block text-[11px] italic text-slate-500 mt-0.5 pl-3">
                      “{d.example}”
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
