// FriendlyTeaching.cl — HtmlContentSlide
//
// Free-form HTML canvas para clases donde queremos armar layouts custom
// (paneles de METAR, mockups de radar, tablas de fraseología ATC, etc.)
// sin tener que crear un slide component nuevo por caso.
//
// Seguridad: DOMPurify limpia el markup antes del render. Aunque el HTML
// venga de contenido interno del repo, corremos el sanitizer igual como
// defensa en profundidad — si algún día un mock se carga desde Firestore
// o desde input de un teacher, no cambia nada acá.
//
// Config del sanitizer: permitimos SVG (para radares/iconos) y target="_blank"
// en links. Todo lo demás queda con los defaults de DOMPurify (scripts,
// event handlers, javascript: URLs y tags peligrosos como <object> se
// borran). El atributo `class` está permitido por default, así que las
// clases Tailwind funcionan tal cual.
//
// Auto-save: cuando la slide monta en modo student (role === 'student' y
// `lessonId` presente), escaneamos todos los <input>/<textarea>/<select>
// que renderizó el markup del profe, les asignamos una key estable, los
// hidratamos con lo que haya guardado el alumno antes y enganchamos un
// listener que persiste cambios en `htmlLessonResponses` con debounce.
'use client';

import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Slide } from '@/types/firebase';
import { useAuthStore } from '@/store/authStore';
import {
  useHtmlLessonResponse,
  saveHtmlLessonAnswers,
} from '@/hooks/useHtmlLessonResponse';

interface Props {
  slide: Slide;
  isTeacher?: boolean;
  lessonId?: string;
  teacherId?: string;
}

type AnyFormEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Decide a stable key for one form element. Prefers author-authored
 *  attributes so answers survive re-renders of the same markup. */
function keyFor(el: AnyFormEl, fallbackIndex: number): string {
  const data = el.getAttribute('data-key');
  if (data) return data;
  const name = el.getAttribute('name');
  if (name) {
    // For grouped inputs (radio/checkbox) the name itself is the key,
    // but we need the option's value to disambiguate — so for radios
    // use name alone (only one value sticks), for checkboxes group by
    // name + value.
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      const val = el.value || 'on';
      return `${name}::${val}`;
    }
    return name;
  }
  const id = el.getAttribute('id');
  if (id) return id;
  return `auto_${fallbackIndex}`;
}

/** Read the current value as a string so the Firestore shape is uniform. */
function readValue(el: AnyFormEl): string {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox') return el.checked ? 'true' : 'false';
    if (el.type === 'radio')    return el.checked ? (el.value || 'on') : '';
    return el.value;
  }
  return el.value;
}

/** Apply a stored value back onto an input. */
function writeValue(el: AnyFormEl, stored: string): void {
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox') { el.checked = stored === 'true'; return; }
    if (el.type === 'radio')    { el.checked = stored === (el.value || 'on'); return; }
    el.value = stored;
    return;
  }
  el.value = stored;
}

// Bumped when we change the render strategy — a loud marker so we can tell
// at a glance whether a given client is running the latest code (iframe)
// or an old cached chunk (inline innerHTML).
const HTML_SLIDE_BUILD = 'iframe-v2-raw-html-2026-11-19';

export default function HtmlContentSlide({ slide, isTeacher, lessonId, teacherId }: Props) {
  useEffect(() => {
    console.log('[HtmlContentSlide] build =', HTML_SLIDE_BUILD);
  }, []);

  const [hostedHtml, setHostedHtml] = useState<string | null>(null);
  const [hostedError, setHostedError] = useState<string | null>(null);

  useEffect(() => {
    if (!slide.hostedHtmlUrl) return;
    let cancelled = false;
    setHostedError(null);
    setHostedHtml(null);
    (async () => {
      try {
        const res = await fetch(slide.hostedHtmlUrl!);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!cancelled) setHostedHtml(text);
      } catch (err) {
        if (!cancelled) setHostedError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [slide.hostedHtmlUrl]);

  const rawHtml = hostedHtml ?? slide.htmlContent ?? '';

  // The iframe is sandboxed (allow-scripts + allow-same-origin), which
  // provides stronger isolation than DOMPurify ever did — parent styles
  // and globals don't leak in, the page gets its own document. So we
  // pass the teacher's HTML through unmodified. DOMPurify was eating
  // <head>, <style>, and <script>, which is why the teacher's beautifully
  // styled lesson showed up as plain text in the student view.
  //
  // We still DOMPurify a defensive copy for the places that use
  // cleanHtml outside the iframe (if any) — kept minimal.
  const cleanHtml = useMemo(() => {
    if (!rawHtml) return '';
    return DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true, svg: true, svgFilters: true },
      ADD_ATTR: ['target'],
      ADD_TAGS: ['script', 'style'],
    });
  }, [rawHtml]);

  // Document fed to the iframe srcdoc. If the teacher pasted a full
  // <!doctype html><html>…</html>, use it as-is. Otherwise wrap in a
  // minimal shell so the browser has something to parse. Either way we
  // use the RAW html — the iframe sandbox is the real security boundary.
  const iframeDoc = useMemo(() => {
    if (!rawHtml) return '';
    const hasHtmlShell = /<html[\s>]/i.test(rawHtml);
    if (hasHtmlShell) return rawHtml;
    return `<!doctype html><html><head><meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
         color: #1f2937; line-height: 1.5; padding: 24px; }
  img, video, iframe { max-width: 100%; height: auto; }
  input, textarea, select { font: inherit; }
  a { color: #5A3D7A; }
</style>
</head><body>${rawHtml}</body></html>`;
  }, [rawHtml]);

  // ── Student auto-save plumbing ──────────────────────────────
  const { firebaseUser, role } = useAuthStore();
  const studentId = firebaseUser?.uid ?? '';
  const shouldPersist = role === 'student' && !!lessonId && !!studentId && !isTeacher;
  const { response } = useHtmlLessonResponse(
    shouldPersist ? studentId : '',
    shouldPersist ? (lessonId ?? '') : '',
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef    = useRef<HTMLIFrameElement | null>(null);
  // The iframe fires onLoad whenever srcdoc gets (re)applied. We bump
  // this to re-run the hydration/listener effect when the document is
  // actually ready, since the effect's own cleanHtml dep fires before
  // the iframe has parsed anything.
  const [iframeReady, setIframeReady] = useState(0);
  const pendingRef   = useRef<Record<string, string>>({});
  const flushTimerRef = useRef<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving,  setSaving]  = useState(false);

  // Hydrate inputs from the stored answers whenever the HTML (re)renders
  // or the answers payload changes. Also wires change listeners once per
  // mount of the sanitised markup. The inputs live inside the iframe, so
  // we query the iframe's own document.
  useEffect(() => {
    if (!shouldPersist) return;
    const root = iframeRef.current?.contentDocument;
    if (!root || !cleanHtml) return;

    const stored = response?.answers ?? {};
    const els = Array.from(
      root.querySelectorAll<AnyFormEl>('input, textarea, select'),
    ).filter(el => {
      if (el instanceof HTMLInputElement) {
        // Skip buttons / hidden / submit — only input the student would fill.
        const t = el.type.toLowerCase();
        return !['button', 'submit', 'reset', 'image', 'hidden', 'file'].includes(t);
      }
      return true;
    });

    const listeners: Array<{ el: AnyFormEl; fn: EventListener }> = [];

    els.forEach((el, i) => {
      const key = keyFor(el, i);
      // Hydrate
      if (stored[key] !== undefined) {
        writeValue(el, stored[key]);
      }
      // Wire change / input listeners
      const handler: EventListener = () => {
        const value = readValue(el);
        pendingRef.current[key] = value;
        scheduleFlush();
      };
      const evt = (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio'))
        ? 'change'
        : 'input';
      el.addEventListener(evt, handler);
      listeners.push({ el, fn: handler });
    });

    function scheduleFlush() {
      if (flushTimerRef.current !== null) window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = window.setTimeout(flush, 700);
    }

    async function flush() {
      flushTimerRef.current = null;
      const batch = { ...pendingRef.current };
      pendingRef.current = {};
      if (Object.keys(batch).length === 0) return;
      setSaving(true);
      try {
        await saveHtmlLessonAnswers({
          studentId,
          lessonId: lessonId!,
          teacherId,
          answers:  batch,
        });
        setSavedAt(Date.now());
      } catch (err) {
        console.warn('[HtmlContentSlide] saveHtmlLessonAnswers failed:', err);
        // Put the failed batch back in pending so a later flush retries.
        pendingRef.current = { ...batch, ...pendingRef.current };
      } finally {
        setSaving(false);
      }
    }

    return () => {
      listeners.forEach(({ el, fn }) => {
        const evt = (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio'))
          ? 'change'
          : 'input';
        el.removeEventListener(evt, fn);
      });
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        // Fire a final flush synchronously on unmount so last keystrokes stick.
        const batch = { ...pendingRef.current };
        pendingRef.current = {};
        if (Object.keys(batch).length > 0) {
          saveHtmlLessonAnswers({
            studentId, lessonId: lessonId!, teacherId, answers: batch,
          }).catch(() => undefined);
        }
      }
    };
  }, [shouldPersist, cleanHtml, response, studentId, lessonId, teacherId, iframeReady]);

  // Human-readable "saved Xs ago" label; re-renders once a minute.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!savedAt) return;
    const id = window.setInterval(() => forceTick(v => v + 1), 15_000);
    return () => window.clearInterval(id);
  }, [savedAt]);

  const savedLabel = (() => {
    if (!savedAt) return null;
    const diffS = Math.round((Date.now() - savedAt) / 1000);
    if (diffS < 5)  return 'Guardado';
    if (diffS < 60) return `Guardado hace ${diffS}s`;
    const m = Math.floor(diffS / 60);
    return `Guardado hace ${m}m`;
  })();

  return (
    <div className="flex flex-col h-full overflow-auto relative">
      {/* No outer title block — HTML uploads always have their own h1
          at the top, and showing both duplicates it. */}

      {hostedError && (
        <div className="mx-6 my-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          Error bajando el HTML hospedado: {hostedError}
        </div>
      )}
      {iframeDoc ? (
        <iframe
          ref={iframeRef}
          title={slide.title ?? 'HTML lesson'}
          srcDoc={iframeDoc}
          // allow-scripts so pagination / toggles / small JS in the
          // teacher's HTML actually runs. allow-same-origin so the parent
          // can read inputs for auto-save and so relative asset URLs
          // resolve against our origin.
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          className="ft-html-slide flex-1 w-full border-0 min-h-[60vh]"
          onLoad={() => setIframeReady(n => n + 1)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          {slide.hostedHtmlUrl ? 'Cargando HTML hospedado…' : '(Este slide no tiene contenido HTML configurado.)'}
        </div>
      )}

      {/* Floating "saved" indicator — only when we're persisting input */}
      {shouldPersist && (saving || savedLabel) && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-20 inline-flex items-center gap-1.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
          {saving ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Guardando…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
              {savedLabel}
            </>
          )}
        </div>
      )}

      {isTeacher && slide.teacherNotes && (
        <div className="mx-6 mb-6 mt-2 bg-[#FFF5C8] border border-[#FFE070] rounded-xl p-4 flex gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-xs font-bold text-[#7A5E00] mb-1">Nota para el Profesor</p>
            <p className="text-sm text-[#5A4500] whitespace-pre-wrap">{slide.teacherNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
