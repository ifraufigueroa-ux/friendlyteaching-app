// FriendlyTeaching.cl — Friendlyflix Teacher Dashboard
// List + create + play movie clip lessons (Phase 2).
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import {
  useMovieLessons,
  createMovieLesson,
  updateMovieLesson,
  publishMovieLesson,
  assignMovieLesson,
  deleteMovieLesson,
} from '@/hooks/useMovieLessons';
import SlideRenderer from '@/components/classroom/SlideRenderer';
import TopBar from '@/components/layout/TopBar';
import { parseYouTubeTranscript } from '@/lib/utils/transcriptParser';
import type {
  MovieLesson, Slide, LessonLevel, ClipData, LyricsBlank, QuizQuestion,
} from '@/types/firebase';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-600',
  A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function ytThumbnail(url: string): string | null {
  const id = extractVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// ─── Upsert (create/edit) modal ────────────────────────────────────────

interface BlankRow { word: string; options: string }
interface QuestionRow { question: string; options: string[]; correctIdx: number }

function UpsertModal({
  teacherId,
  initial,
  onClose,
}: {
  teacherId: string;
  initial?: MovieLesson;
  onClose: () => void;
}) {
  const editing = !!initial;
  const initialSlide = initial?.slides?.[0];
  const initialComprehensionSlide = initial?.slides?.find(s => s.type === 'clip_comprehension');
  const initialBlanks = initialSlide?.blanksData ?? [];
  const initialQuestions = initialComprehensionSlide?.questions ?? [];
  const initialClip = initial?.clip;

  const [level, setLevel]       = useState<LessonLevel>(initial?.level ?? 'A2');
  const [url, setUrl]           = useState(initialClip?.youtubeUrl ?? '');
  const [title, setTitle]       = useState(initialClip?.title ?? '');
  const [source, setSource]     = useState(initialClip?.source ?? '');
  const [dialogue, setDialogue] = useState(initialClip?.dialogue ?? initialSlide?.content ?? '');
  const [timingsRaw, setTimingsRaw] = useState((initialClip?.timings ?? []).join(', '));
  const [blanks, setBlanks]     = useState<BlankRow[]>(
    initialBlanks.map(b => ({ word: b.word, options: b.options.join(', ') })),
  );
  const [questions, setQuestions] = useState<QuestionRow[]>(
    initialQuestions.length > 0
      ? initialQuestions.map(q => ({
          question: q.question,
          options: q.options.map(o => o.text),
          correctIdx: q.options.findIndex(o => o.text.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()),
        }))
      : [],
  );
  const [startTime, setStartTime] = useState(initialClip?.startTime?.toString() ?? '');
  const [endTime, setEndTime]     = useState(initialClip?.endTime?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [showTranscriptPaste, setShowTranscriptPaste] = useState(false);

  const detectedBlanks = (dialogue.match(/\{\{blank\}\}/g) ?? []).length;
  useEffect(() => {
    if (detectedBlanks === blanks.length) return;
    setBlanks(prev => {
      const next: BlankRow[] = [];
      for (let i = 0; i < detectedBlanks; i++) next.push(prev[i] ?? { word: '', options: '' });
      return next;
    });
  }, [detectedBlanks, blanks.length]);

  const numLines = dialogue.split('\n').filter(Boolean).length;
  const timings = timingsRaw.split(',').map(s => parseFloat(s.trim())).filter(n => Number.isFinite(n));
  const timingsValid = timings.length === numLines;

  function applyTranscript(raw: string) {
    const parsed = parseYouTubeTranscript(raw);
    if (parsed.length === 0) {
      setError('No pude leer el transcript. Verifica el formato (MM:SS texto, una línea por entrada).');
      return false;
    }
    setDialogue(parsed.map(l => l.text).join('\n'));
    setTimingsRaw(parsed.map(l => l.time.toFixed(1)).join(', '));
    setBlanks([]);
    setError(null);
    return true;
  }

  async function handleSave() {
    setError(null);
    if (!url.trim() || !extractVideoId(url))            { setError('URL de YouTube inválida'); return; }
    if (!title.trim())                                   { setError('Pon un título para la escena'); return; }
    if (!source.trim())                                  { setError('Pon el nombre de la serie/película'); return; }
    if (!dialogue.trim())                                { setError('El diálogo está vacío'); return; }
    if (detectedBlanks === 0)                            { setError('Agrega al menos un {{blank}} al diálogo'); return; }
    for (let i = 0; i < blanks.length; i++) {
      if (!blanks[i].word.trim())                        { setError(`Blank #${i+1}: falta la palabra correcta`); return; }
      const opts = blanks[i].options.split(',').map(s => s.trim()).filter(Boolean);
      if (opts.length < 2)                               { setError(`Blank #${i+1}: necesita al menos 2 opciones`); return; }
    }

    const blanksData: LyricsBlank[] = blanks.map(b => ({
      word: b.word.trim(),
      options: b.options.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4),
    }));

    const clip: ClipData = {
      title: title.trim(),
      source: source.trim(),
      youtubeUrl: url.trim(),
      dialogue: dialogue.trim(),
      timings: timingsValid ? timings : undefined,
      startTime: startTime ? parseFloat(startTime) : undefined,
      endTime:   endTime   ? parseFloat(endTime)   : undefined,
      captionsSource: 'manual',
    };

    // Validate questions if any provided. Skip the comprehension slide
    // entirely if the teacher left the section empty.
    const validQuestions: QuestionRow[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) continue;
      const opts = q.options.map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) { setError(`Question #${i+1}: need at least 2 options`); return; }
      if (q.correctIdx < 0 || q.correctIdx >= opts.length) { setError(`Question #${i+1}: pick the correct option`); return; }
      validQuestions.push({ question: q.question.trim(), options: opts, correctIdx: q.correctIdx });
    }

    const gameSlide: Slide = {
      type: 'clip_dialogue_game',
      content: dialogue.trim(),
      blanksData,
      clipData: clip,
    };

    const slides: Slide[] = [gameSlide];
    if (validQuestions.length > 0) {
      const quizQuestions: QuizQuestion[] = validQuestions.map((q, qi) => ({
        question: q.question,
        options: q.options.map((text, oi) => ({ id: `q${qi}o${oi}`, text, isCorrect: oi === q.correctIdx })),
        correctAnswer: q.options[q.correctIdx],
      }));
      slides.push({
        type: 'clip_comprehension',
        title: 'Comprehension',
        questions: quizQuestions,
      });
    }

    setSaving(true);
    try {
      if (editing && initial?.id) {
        await updateMovieLesson(initial.id, {
          clip,
          level,
          slides,
          title: `${clip.source} – ${clip.title}`,
        });
      } else {
        await createMovieLesson({
          teacherId,
          clip,
          level,
          slides,
        });
      }
      onClose();
    } catch (e) {
      setError('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#5A3D7A]">{editing ? 'Editar clip' : 'Crear clip lesson'}</h2>
            <p className="text-xs text-gray-400">Pega URL de YouTube + diálogo con <code className="bg-gray-100 px-1 rounded">{`{{blank}}`}</code> donde quieras un hueco.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="overflow-y-auto p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left col: clip metadata + dialogue */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">URL de YouTube *</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => setShowTranscriptPaste(true)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                >
                  📋 Pegar transcript de YouTube
                </button>
                {url && extractVideoId(url) && (
                  <a
                    href={`https://www.youtube.com/watch?v=${extractVideoId(url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-gray-500 hover:text-red-600 underline"
                  >
                    Abrir en YouTube ↗
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Título escena *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Serie / película *</label>
                <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nivel</label>
                <select value={level} onChange={e => setLevel(e.target.value as LessonLevel)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Start (s)</label>
                <input value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono" placeholder="opcional" />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">End (s)</label>
                <input value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono" placeholder="opcional" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Diálogo (una línea por renglón) *</label>
              <textarea
                value={dialogue}
                onChange={e => setDialogue(e.target.value)}
                rows={7}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
                placeholder={'I want you to {{blank}} me everything.\nThere is nothing more I can {{blank}} you.'}
              />
              <p className="text-[10px] text-gray-400 mt-1">{numLines} línea{numLines !== 1 && 's'} · {detectedBlanks} blank{detectedBlanks !== 1 && 's'} detectado{detectedBlanks !== 1 && 's'}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Timings por línea (segundos, separados por coma) {timingsValid ? <span className="text-green-600">✓</span> : timings.length > 0 && <span className="text-amber-500">(no calzan — se interpolarán)</span>}
              </label>
              <input
                value={timingsRaw}
                onChange={e => setTimingsRaw(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
                placeholder="2.0, 6.5, 11.2, 15.0"
              />
              <p className="text-[10px] text-gray-400 mt-1">Tip: usa "Auto-fetch captions" para llenar timings exactos automáticamente.</p>
            </div>
          </div>

          {/* Right col: blanks editor */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Blanks ({detectedBlanks})
            </label>
            {blanks.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Agrega <code className="bg-gray-100 px-1 rounded">{`{{blank}}`}</code> al diálogo para que aparezcan aquí.</p>
            ) : blanks.map((b, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-2 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-400">#{i + 1}</span>
                  <input
                    value={b.word}
                    onChange={e => setBlanks(prev => prev.map((p, idx) => idx === i ? { ...p, word: e.target.value } : p))}
                    placeholder="Palabra correcta"
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#9B7CB8] font-semibold bg-white"
                  />
                </div>
                <input
                  value={b.options}
                  onChange={e => setBlanks(prev => prev.map((p, idx) => idx === i ? { ...p, options: e.target.value } : p))}
                  placeholder="opción1, opción2, opción3, opción4 (la correcta debe estar incluida)"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#9B7CB8] bg-white"
                />
              </div>
            ))}
          </div>

          {/* Full-width: comprehension questions */}
          <div className="md:col-span-2 border-t border-gray-100 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  Comprehension questions ({questions.length}) · opcional
                </label>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Aparecerán como una slide aparte después del juego. Recomendado: 3-5 preguntas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuestions(prev => prev.length >= 6 ? prev : [...prev, { question: '', options: ['', '', '', ''], correctIdx: 0 }])}
                disabled={questions.length >= 6}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E50914]/10 text-[#E50914] hover:bg-[#E50914]/20 border border-[#E50914]/30 disabled:opacity-40"
              >
                + Add question
              </button>
            </div>

            {questions.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Deja vacío para que la lección termine en el juego de blanks.</p>
            ) : questions.map((q, qi) => (
              <div key={qi} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[10px] font-bold text-gray-400 mt-2">#{qi + 1}</span>
                  <textarea
                    value={q.question}
                    onChange={e => setQuestions(prev => prev.map((p, idx) => idx === qi ? { ...p, question: e.target.value } : p))}
                    placeholder="Question text — e.g. What was Pain's main motivation?"
                    rows={2}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#E50914] bg-white resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestions(prev => prev.filter((_, idx) => idx !== qi))}
                    className="text-[11px] text-gray-400 hover:text-red-500 mt-1"
                    title="Eliminar pregunta"
                  >
                    🗑
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pl-5">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                      q.correctIdx === oi ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name={`q${qi}-correct`}
                        checked={q.correctIdx === oi}
                        onChange={() => setQuestions(prev => prev.map((p, idx) => idx === qi ? { ...p, correctIdx: oi } : p))}
                        className="accent-green-600 w-3 h-3"
                      />
                      <input
                        value={opt}
                        onChange={e => setQuestions(prev => prev.map((p, idx) => idx === qi ? { ...p, options: p.options.map((o, oj) => oj === oi ? e.target.value : o) } : p))}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 px-1 py-0.5 text-xs bg-transparent focus:outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-sm font-bold disabled:opacity-50 shadow-lg">
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear clip lesson'}
          </button>
        </div>
      </div>

      {showTranscriptPaste && (
        <TranscriptPasteModal
          onApply={(raw) => {
            if (applyTranscript(raw)) setShowTranscriptPaste(false);
          }}
          onClose={() => setShowTranscriptPaste(false)}
        />
      )}
    </div>
  );
}

// ─── Transcript paste sub-modal ────────────────────────────────────────

function TranscriptPasteModal({
  onApply,
  onClose,
}: {
  onApply: (raw: string) => void;
  onClose: () => void;
}) {
  const [raw, setRaw] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[88vh]">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-[#5A3D7A] text-base mb-1">Pegar transcript de YouTube</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            En YouTube: <strong>… (3 puntos del video) → &ldquo;Mostrar transcripción&rdquo;</strong> → selecciona todo el panel y copia. Pega aquí abajo.
          </p>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">
          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={12}
            placeholder={'0:00\nHello and welcome to this video\n0:05\nLet me show you something amazing\n0:11\nIt is called...'}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#9B7CB8]"
          />
          <p className="text-[11px] text-gray-400 mt-2">
            Acepta formatos: <code className="bg-gray-100 px-1 rounded">MM:SS</code> seguido del texto (mismo o siguiente renglón), <code className="bg-gray-100 px-1 rounded">H:MM:SS</code> también funciona, y <code className="bg-gray-100 px-1 rounded">[MM:SS]</code> con corchetes.
          </p>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => onApply(raw)}
            disabled={!raw.trim()}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-sm font-bold shadow disabled:opacity-50"
          >
            Aplicar transcript
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Play modal ─────────────────────────────────────────────────────────

function PlayModal({ lesson, onClose }: { lesson: MovieLesson; onClose: () => void }) {
  const slides = lesson.slides ?? [];
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = slides[slideIdx];
  if (!slide) return null;

  const canPrev = slideIdx > 0;
  const canNext = slideIdx < slides.length - 1;

  const SLIDE_LABEL: Record<string, string> = {
    cover:              'Cover',
    vocabulary:         'Vocabulary',
    clip_vocab_match:   'Vocab match',
    predictions:        'Predictions',
    clip_dialogue_game: 'Listening game',
    clip_comprehension: 'Comprehension',
    language_focus:     'Language focus',
    language_practice:  'Controlled practice',
    clip_production:    'Free production',
    friendlyflix_end:   'Wrap-up',
  };

  const multi = slides.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top nav — sticks above the slide content with an explicit z-index */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-2 border-b border-white/10 bg-black/95">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-white/80 text-sm font-semibold truncate">{lesson.title}</div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B6B] flex-shrink-0">
            {SLIDE_LABEL[slide.type] ?? slide.type}{multi ? ` · ${slideIdx + 1}/${slides.length}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Only show navigation arrows when there is somewhere to navigate */}
          {multi && (
            <>
              <button
                onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                disabled={!canPrev}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  canPrev
                    ? 'bg-white/8 hover:bg-white/15 text-white/80 border-white/10 cursor-pointer'
                    : 'bg-white/4 text-white/25 border-white/5 cursor-not-allowed'
                }`}
                title="Previous slide"
              >
                ← Prev
              </button>
              <button
                onClick={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))}
                disabled={!canNext}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  canNext
                    ? 'bg-gradient-to-r from-[#E50914] to-[#FF6B6B] hover:opacity-90 text-white border-[#E50914] cursor-pointer'
                    : 'bg-white/4 text-white/25 border-white/5 cursor-not-allowed'
                }`}
                title="Next slide"
              >
                Next →
              </button>
            </>
          )}
          <button onClick={onClose} className="ml-2 text-white/60 hover:text-white text-2xl px-2 leading-none" title="Close">×</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative z-0 overflow-y-auto bg-white">
        <SlideRenderer slide={slide} youtubeUrl={lesson.clip?.youtubeUrl} />
      </div>
    </div>
  );
}

// ─── Assign modal ───────────────────────────────────────────────────────

function AssignModal({
  lesson,
  students,
  onClose,
}: {
  lesson: MovieLesson;
  students: { uid: string; fullName: string }[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(lesson.assignedTo ?? []);
  const [saving, setSaving] = useState(false);

  function toggle(uid: string) {
    setSelected(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  }

  async function save() {
    setSaving(true);
    await assignMovieLesson(lesson.id!, selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-[#5A3D7A]">Asignar estudiantes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {students.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">Aún no tienes estudiantes aprobados.</p>
          ) : students.map(s => (
            <label key={s.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F0E5FF]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(s.uid)}
                onChange={() => toggle(s.uid)}
                className="accent-[#5A3D7A] w-4 h-4"
              />
              <span className="text-sm text-gray-700">{s.fullName}</span>
            </label>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 bg-[#5A3D7A] text-white rounded-full text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando…' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────

export default function MoviesPage() {
  const { profile } = useAuthStore();
  const teacherId   = profile?.uid ?? '';
  const { lessons, loading } = useMovieLessons(teacherId);
  const { students } = useStudents();

  const [showCreate, setShowCreate]   = useState(false);
  const [editing, setEditing]         = useState<MovieLesson | null>(null);
  const [playing, setPlaying]         = useState<MovieLesson | null>(null);
  const [assigning, setAssigning]     = useState<MovieLesson | null>(null);

  const studentList = useMemo(
    () => students.map(s => ({ uid: s.uid, fullName: s.fullName })),
    [students],
  );

  async function togglePublish(lesson: MovieLesson) {
    await publishMovieLesson(lesson.id!, lesson.publishStatus !== 'published');
  }

  async function handleDelete(lesson: MovieLesson) {
    if (!confirm(`¿Eliminar la clip lesson "${lesson.title}"? No se puede deshacer.`)) return;
    await deleteMovieLesson(lesson.id!);
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <TopBar
        title="Friendlyflix — Clip lessons"
        subtitle={`${lessons.length} clip${lessons.length !== 1 ? 's' : ''} guardado${lessons.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Friendlyflix' },
        ]}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg flex-shrink-0"
          >
            ＋ Crear clip lesson
          </button>
        }
      />

      <div className="max-w-6xl mx-auto mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Cargando…</div>
        ) : lessons.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-5xl mb-3">🎬</p>
            <p className="text-[#5A3D7A] font-bold text-lg mb-1">Aún no hay clip lessons</p>
            <p className="text-gray-400 text-sm mb-5">Crea tu primera con un clip de YouTube y un diálogo.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-sm font-bold shadow"
            >
              ＋ Crear clip lesson
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map(lesson => {
              const thumb = ytThumbnail(lesson.clip?.youtubeUrl ?? '');
              const numBlanks = lesson.slides?.[0]?.blanksData?.length ?? 0;
              const isPub = lesson.publishStatus === 'published';
              return (
                <div key={lesson.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                  {/* Thumb */}
                  <button
                    onClick={() => setPlaying(lesson)}
                    className="relative w-full aspect-video bg-black overflow-hidden group"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={lesson.clip?.title ?? ''} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">🎬</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                      <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                    </div>
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${isPub ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-600'}`}>
                      {isPub ? 'Publicado' : 'Borrador'}
                    </span>
                  </button>
                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{lesson.clip?.title ?? lesson.title}</h3>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[lesson.level] ?? 'bg-gray-100 text-gray-500'}`}>
                        {lesson.level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-2">{lesson.clip?.source ?? '—'}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">📝 {numBlanks} blank{numBlanks !== 1 && 's'}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">👥 {lesson.assignedTo?.length ?? 0} asign.</span>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      <button onClick={() => setPlaying(lesson)} className="flex-1 py-1.5 px-2 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-full text-[11px] font-bold">▶ Probar</button>
                      <button onClick={() => setEditing(lesson)} className="py-1.5 px-2.5 border border-gray-200 hover:bg-gray-50 rounded-full text-[11px] font-semibold text-gray-600">✎</button>
                      <button onClick={() => setAssigning(lesson)} className="py-1.5 px-2.5 border border-gray-200 hover:bg-gray-50 rounded-full text-[11px] font-semibold text-gray-600" title="Asignar">👥</button>
                      <button onClick={() => togglePublish(lesson)} className={`py-1.5 px-2.5 rounded-full text-[11px] font-bold ${isPub ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {isPub ? 'Despub.' : 'Publicar'}
                      </button>
                      <button onClick={() => handleDelete(lesson)} className="py-1.5 px-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-full text-[11px] font-semibold" title="Eliminar">🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(showCreate || editing) && (
        <UpsertModal
          teacherId={teacherId}
          initial={editing ?? undefined}
          onClose={() => { setShowCreate(false); setEditing(null); }}
        />
      )}
      {playing && <PlayModal lesson={playing} onClose={() => setPlaying(null)} />}
      {assigning && (
        <AssignModal
          lesson={assigning}
          students={studentList}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  );
}
