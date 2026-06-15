// FriendlyTeaching.cl — Friendlyflix Phase-1 playground
// Quick teacher-only page to test ClipDialogueGameSlide without editing
// Firestore. Pre-loaded with a working demo clip; the form below lets you
// swap in any YouTube URL, dialogue, and blanks.
'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Slide, ClipData, LyricsBlank } from '@/types/firebase';
import ClipDialogueGameSlide from '@/components/classroom/slides/ClipDialogueGameSlide';
import TopBar from '@/components/layout/TopBar';

// ── Pre-loaded demo: a famous short scene with simple dialogue ─────────
// Goblet of Fire — the "constant vigilance!" line is short and clear;
// timings are approximate, designed so the polling cursor advances
// roughly in step with the scene.
const DEMO: { url: string; title: string; source: string; dialogue: string; blanks: LyricsBlank[]; timings: number[] } = {
  url: 'https://www.youtube.com/watch?v=Z0HSWGCmtbk',
  title: 'Pilot — interrogation room',
  source: 'Demo clip',
  dialogue: [
    'I want you to {{blank}} me everything you know.',
    'There is nothing more I can {{blank}} you.',
    'I think we both know that is not {{blank}}.',
  ].join('\n'),
  blanks: [
    { word: 'tell', options: ['tell', 'show', 'give', 'bring'] },
    { word: 'tell',  options: ['tell',  'say', 'speak', 'talk'] },
    { word: 'true', options: ['true', 'real', 'right', 'fair'] },
  ],
  timings: [2, 7, 12],
};

interface BlankRow { word: string; options: string }

export default function FriendlyflixTestPage() {
  const [url, setUrl]           = useState(DEMO.url);
  const [title, setTitle]       = useState(DEMO.title);
  const [source, setSource]     = useState(DEMO.source);
  const [dialogue, setDialogue] = useState(DEMO.dialogue);
  const [timingsRaw, setTimingsRaw] = useState(DEMO.timings.join(', '));
  const [blanks, setBlanks]     = useState<BlankRow[]>(
    DEMO.blanks.map(b => ({ word: b.word, options: b.options.join(', ') })),
  );
  const [renderKey, setRenderKey] = useState(0);

  // Auto-detect number of {{blank}} markers in the dialogue and resize the
  // blank rows. Keeps existing words when possible.
  const detectedBlanks = (dialogue.match(/\{\{blank\}\}/g) ?? []).length;
  useEffect(() => {
    if (detectedBlanks === blanks.length) return;
    setBlanks(prev => {
      const next: BlankRow[] = [];
      for (let i = 0; i < detectedBlanks; i++) next.push(prev[i] ?? { word: '', options: '' });
      return next;
    });
  }, [detectedBlanks, blanks.length]);

  const slide: Slide = useMemo(() => {
    const blanksData: LyricsBlank[] = blanks.map((b) => ({
      word: b.word.trim() || '___',
      options: b.options.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4),
    }));
    const timings = timingsRaw
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => Number.isFinite(n));

    const clipData: ClipData = {
      title: title.trim() || 'Sin título',
      source: source.trim() || '—',
      youtubeUrl: url.trim(),
      dialogue,
      timings: timings.length === detectedBlanks + (dialogue.split('\n').length - detectedBlanks)
        ? undefined
        : timings.length === dialogue.split('\n').length ? timings : undefined,
    };

    return {
      type: 'clip_dialogue_game',
      content: dialogue,
      blanksData,
      clipData,
    };
  // renderKey forces a refresh when "Reiniciar" is clicked.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, title, source, dialogue, blanks, timingsRaw, renderKey]);

  function loadDemo() {
    setUrl(DEMO.url);
    setTitle(DEMO.title);
    setSource(DEMO.source);
    setDialogue(DEMO.dialogue);
    setTimingsRaw(DEMO.timings.join(', '));
    setBlanks(DEMO.blanks.map(b => ({ word: b.word, options: b.options.join(', ') })));
    setRenderKey(k => k + 1);
  }

  async function fetchCaptions() {
    const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vid = m?.[1];
    if (!vid) { alert('URL de YouTube inválida'); return; }
    try {
      const res = await fetch(`/api/clip-transcript?videoId=${vid}&lang=en`);
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'No se encontraron captions'); return; }
      const lines: { start: number; text: string }[] = data.lines ?? [];
      if (lines.length === 0) { alert('Sin captions útiles'); return; }
      // Take first 8 lines so we don't overwhelm the editor
      const slice = lines.slice(0, 8);
      setDialogue(slice.map(l => l.text).join('\n'));
      setTimingsRaw(slice.map(l => l.start.toFixed(1)).join(', '));
      setBlanks([]);
      alert(`Captions cargados: ${slice.length} líneas. Agrega {{blank}} donde quieras un hueco y configura las palabras abajo.`);
    } catch (e) {
      alert('Error al traer captions: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <TopBar
        title="Friendlyflix — Test (Fase 1)"
        subtitle="Prueba el slide de clip con un demo o pega tu propio video"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Friendlyflix Test' },
        ]}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-5 mt-4">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">Clip</h2>
              <button
                onClick={loadDemo}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E0D0F5]"
              >
                ↻ Cargar demo
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">URL de YouTube</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <button
                onClick={fetchCaptions}
                className="mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              >
                ↓ Auto-fetch captions de YouTube
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Título escena</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Serie / película</label>
                <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">Diálogo</h2>
            <p className="text-[11px] text-gray-400">Usa <code className="bg-gray-100 px-1 rounded">{`{{blank}}`}</code> donde quieras un hueco. Una línea por renglón.</p>
            <textarea
              value={dialogue}
              onChange={e => setDialogue(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
              placeholder="Línea 1 con {{blank}}\nLínea 2..."
            />
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Timings por línea (segundos, separados por coma) — opcional
              </label>
              <input
                value={timingsRaw}
                onChange={e => setTimingsRaw(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
                placeholder="2, 7, 12"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Si los dejas vacíos o no calzan con # de líneas, se interpolan automáticamente.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">
              Blanks ({detectedBlanks} detectados en el diálogo)
            </h2>
            {blanks.length === 0 ? (
              <p className="text-xs text-gray-400">Agrega <code>{`{{blank}}`}</code> al diálogo para que aparezcan aquí.</p>
            ) : blanks.map((b, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <span className="col-span-1 text-xs font-bold text-gray-400">#{i + 1}</span>
                <input
                  value={b.word}
                  onChange={e => setBlanks(prev => prev.map((p, idx) => idx === i ? { ...p, word: e.target.value } : p))}
                  placeholder="Palabra correcta"
                  className="col-span-3 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#9B7CB8] font-semibold"
                />
                <input
                  value={b.options}
                  onChange={e => setBlanks(prev => prev.map((p, idx) => idx === i ? { ...p, options: e.target.value } : p))}
                  placeholder="opción1, opción2, opción3, opción4"
                  className="col-span-8 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#9B7CB8]"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => setRenderKey(k => k + 1)}
            className="w-full py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-sm font-bold shadow-md"
          >
            ⟳ Recargar preview con cambios
          </button>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-3">
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl" style={{ height: '78vh', minHeight: 560 }}>
            <ClipDialogueGameSlide key={renderKey} slide={slide} />
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Si ves &ldquo;video no permite reproducción embebida&rdquo;, prueba otro video — algunos canales restringen embed.
          </p>
        </div>
      </div>
    </div>
  );
}
