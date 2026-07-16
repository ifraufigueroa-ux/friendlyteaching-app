// FriendlyTeaching.cl — Text Lesson Editor (Friendlytext® CLT)
//
// Modal-based generator/editor for text-based CLT lessons. Flow:
//  1. Teacher pastes a piece of text + title/source/level.
//  2. Chooses audio: paste a YouTube URL, or generate TTS via ElevenLabs and
//     have it uploaded to Firebase Storage, or leave silent.
//  3. Hits "Generate CLT lesson with AI" → /api/text-lesson returns 10 slides.
//  4. Teacher previews, tweaks, and saves.
//
// The audio flow supports three sources per lesson (kept exclusive):
//  · youtube   → paste an existing URL, iframe embeds in the reading slide.
//  · tts       → ElevenLabs API generates MP3, uploaded to Firebase Storage.
//  · hosted    → teacher provides an already-uploaded direct URL.
//
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { createTextLesson, updateTextLesson } from '@/hooks/useTextLessons';
import type {
  TextLesson, Slide, LessonLevel, TextData, TextAudioSource, ComprehensionMode,
} from '@/types/firebase';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface Voice { id: string; name: string; accent: string; gender: 'f' | 'm' }

interface Props {
  teacherId: string;
  initial?: TextLesson;
  onClose: () => void;
}

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

// Read one axis (0 = X, 1 = Y) out of a "X% Y%" objectPosition string.
// Returns null when the string is missing or malformed so the caller
// can fall back to the 50% default.
function parsePosterAxis(raw: string | undefined, axis: 0 | 1): number | null {
  if (!raw) return null;
  const parts = raw.trim().split(/\s+/);
  const n = parseFloat(parts[axis] ?? '');
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

export default function TextLessonEditor({ teacherId, initial, onClose }: Props) {
  const editing = Boolean(initial);

  // ── Metadata ────────────────────────────────────────────────────────
  const [title,  setTitle]  = useState<string>(initial?.text?.title ?? '');
  const [source, setSource] = useState<string>(initial?.text?.source ?? '');
  const [level,  setLevel]  = useState<LessonLevel>(initial?.level ?? 'B1');
  const [text,   setText]   = useState<string>(initial?.text?.text ?? '');
  const [posterUrl, setPosterUrl] = useState<string>(initial?.text?.posterUrl ?? '');
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  // objectPosition value ("X% Y%"). Kept as strings so we can pass it
  // straight to the renderer without re-parsing.
  const [posterPosX, setPosterPosX] = useState<number>(() => parsePosterAxis(initial?.text?.posterPosition, 0) ?? 50);
  const [posterPosY, setPosterPosY] = useState<number>(() => parsePosterAxis(initial?.text?.posterPosition, 1) ?? 50);
  const posterPreviewRef = useRef<HTMLDivElement | null>(null);
  const posterDragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; width: number; height: number } | null>(null);

  // ── Comprehension mode — drives audio requirements + slide presentation
  const [comprehensionMode, setComprehensionMode] = useState<ComprehensionMode>(
    initial?.text?.comprehensionMode ?? 'both',
  );

  // ── Audio ──────────────────────────────────────────────────────────
  const initialAudioSource: TextAudioSource =
    initial?.text?.audioSource ??
    (initial?.text?.youtubeUrl ? 'youtube' :
     initial?.text?.audioUrl ? 'hosted' : 'none');

  const [audioMode, setAudioMode] = useState<TextAudioSource>(initialAudioSource);
  const [youtubeUrl, setYoutubeUrl] = useState<string>(initial?.text?.youtubeUrl ?? '');
  const [hostedUrl,  setHostedUrl]  = useState<string>(
    initial?.text?.audioSource === 'hosted' ? (initial?.text?.audioUrl ?? '') : '',
  );

  // TTS state
  const [voices, setVoices] = useState<Voice[]>([]);
  const [ttsConfigured, setTtsConfigured] = useState<boolean>(false);
  const [voiceId, setVoiceId] = useState<string>(initial?.text?.ttsVoiceId ?? '');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string>(
    initial?.text?.audioSource === 'tts' ? (initial?.text?.audioUrl ?? '') : '',
  );
  const [generatingTts, setGeneratingTts] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // ── Optional per-line timings (seconds) — one value per non-empty line
  const [timingsText, setTimingsText] = useState<string>(
    initial?.text?.timings ? initial.text.timings.join('\n') : '',
  );

  // ── Slides (generated) ─────────────────────────────────────────────
  const [slides, setSlides] = useState<Slide[]>(initial?.slides ?? []);
  const [generating, setGenerating] = useState(false);
  const [generatingAlgo, setGeneratingAlgo] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSource, setGenerationSource] = useState<'ai' | 'algorithmic' | null>(
    initial?.slides?.length ? null : null,
  );

  // ── Save state ─────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [savingMsg, setSavingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load voice catalog once — cheap GET.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/tts/elevenlabs');
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;
        setVoices(data.voices ?? []);
        setTtsConfigured(Boolean(data.configured));
        if (!voiceId && data.voices?.[0]?.id) setVoiceId(data.voices[0].id);
      } catch {
        /* no-op — the TTS section will disable itself */
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timings = useMemo(() => {
    const parsed = timingsText.split('\n').map(l => parseFloat(l.trim())).filter(v => !Number.isNaN(v));
    return parsed;
  }, [timingsText]);
  const timingsValid = timings.length > 0;

  const activeAudioUrl =
    audioMode === 'tts'    ? ttsAudioUrl
    : audioMode === 'hosted' ? hostedUrl
    : '';

  async function handleGenerateTts() {
    setTtsError(null);
    // Read the uid straight from Firebase Auth — the zustand store can lag
    // on hydration and leave teacherId prop empty even when the user is
    // signed in (same trap useMovieLessons already sidesteps).
    const authUid = getAuth().currentUser?.uid || teacherId;
    if (!text.trim()) { setTtsError('Pega primero el texto que quieres narrar.'); return; }
    if (!voiceId)      { setTtsError('Elige una voz.'); return; }
    if (!authUid)      { setTtsError('Sin sesión — refresca la página.'); return; }
    if (text.length > 5000) {
      setTtsError(`Texto muy largo (${text.length} chars). ElevenLabs va tope 5000 por request; recorta o divide.`);
      return;
    }

    setGeneratingTts(true);
    // Split the pipeline into three stages so the teacher sees WHICH step
    // failed. Previously an upload error surfaced as "Error de red: Failed to
    // fetch", which pointed at ElevenLabs when the real culprit was Firebase
    // Storage (e.g. GCP billing account disabled → uploadBytes throws).
    let blob: Blob;
    try {
      const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), voiceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setTtsError('ElevenLabs: ' + (data.error ?? `HTTP ${res.status}`));
        setGeneratingTts(false);
        return;
      }
      blob = await res.blob();
    } catch (err) {
      setTtsError('ElevenLabs (red): ' + (err instanceof Error ? err.message : String(err)));
      setGeneratingTts(false);
      return;
    }

    try {
      const fileName = `friendlytext-${authUid}-${Date.now()}.mp3`;
      const path = `audio/${fileName}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, blob, { contentType: 'audio/mpeg' });
      const url = await getDownloadURL(ref);
      setTtsAudioUrl(url);
    } catch (err) {
      // Common: Firebase Storage bucket disabled, GCP billing closed, or rules
      // blocking the write. Surface the SDK code/message verbatim.
      const msg = err instanceof Error ? err.message : String(err);
      setTtsError('Firebase Storage: ' + msg);
    } finally {
      setGeneratingTts(false);
    }
  }

  // ── Poster drag-to-position ────────────────────────────────────
  // Dragging the preview shifts the object-position values so the teacher
  // can pick the crop by feel. Direction is inverted: dragging the image
  // LEFT reveals content on the RIGHT (posX increases).
  function onPosterDragStart(e: React.PointerEvent<HTMLDivElement>) {
    if (!posterPreviewRef.current) return;
    const rect = posterPreviewRef.current.getBoundingClientRect();
    posterDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: posterPosX,
      baseY: posterPosY,
      width: rect.width,
      height: rect.height,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPosterDragMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = posterDragRef.current;
    if (!drag) return;
    // A one-full-width drag maps to 100% shift, scaled by 1.5 for extra
    // fine-grained control in the small preview.
    const dx = ((e.clientX - drag.startX) / drag.width) * 100 * -1.5;
    const dy = ((e.clientY - drag.startY) / drag.height) * 100 * -1.5;
    setPosterPosX(Math.max(0, Math.min(100, drag.baseX + dx)));
    setPosterPosY(Math.max(0, Math.min(100, drag.baseY + dy)));
  }

  function onPosterDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    posterDragRef.current = null;
    if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    }
  }

  const posterPosition = `${posterPosX.toFixed(0)}% ${posterPosY.toFixed(0)}%`;

  async function handlePosterFile(file: File) {
    setPosterError(null);
    const authUid = getAuth().currentUser?.uid || teacherId;
    if (!authUid) { setPosterError('Sin sesión — refresca la página.'); return; }
    if (!file.type.startsWith('image/')) {
      setPosterError('El archivo debe ser una imagen.');
      return;
    }
    // Storage rules cap /images/ writes at 5 MB — check client-side too so
    // the teacher gets a friendly message before the round-trip.
    if (file.size > 5 * 1024 * 1024) {
      setPosterError(`Muy grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo 5 MB.`);
      return;
    }

    setPosterUploading(true);
    try {
      const ext = (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] || '.jpg').toLowerCase();
      const fileName = `friendlytext-poster-${authUid}-${Date.now()}${ext}`;
      const ref = storageRef(storage, `images/${fileName}`);
      await uploadBytes(ref, file, { contentType: file.type });
      const url = await getDownloadURL(ref);
      setPosterUrl(url);
    } catch (err) {
      // Same failure modes as TTS upload — bucket disabled, GCP billing
      // closed, rules blocking. Surface the SDK message verbatim.
      const msg = err instanceof Error ? err.message : String(err);
      setPosterError('Firebase Storage: ' + msg);
    } finally {
      setPosterUploading(false);
      // Reset the input so selecting the same file twice re-triggers change.
      if (posterInputRef.current) posterInputRef.current.value = '';
    }
  }

  async function runGeneration(useAI: boolean) {
    setGenerationError(null);
    if (!title.trim() || !source.trim() || !text.trim()) {
      setGenerationError('Completa título, fuente y texto antes de generar.');
      return;
    }
    // Audio-only lessons need an audio source — otherwise the comprehension
    // slide has nothing to play. Text-only lessons ignore the audio picker.
    if (comprehensionMode === 'audio' && !activeAudioUrl && !youtubeUrl) {
      setGenerationError('Modo audio-only: agrega un audio (TTS, YouTube o URL) antes de generar.');
      return;
    }

    const setter = useAI ? setGenerating : setGeneratingAlgo;
    setter(true);
    try {
      const res = await fetch('/api/text-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          source: source.trim(),
          text: text.trim(),
          level,
          hasAudio: Boolean(activeAudioUrl || youtubeUrl),
          comprehensionMode,
          useAI,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setGenerationError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      const data: { slides: Slide[]; source?: 'ai' | 'algorithmic' } = await res.json();
      setSlides(data.slides ?? []);
      setGenerationSource(data.source ?? (useAI ? 'ai' : 'algorithmic'));
    } catch (err) {
      setGenerationError('Error de red: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setter(false);
    }
  }

  const handleGenerate = () => runGeneration(true);
  const handleGenerateAlgo = () => runGeneration(false);

  async function handleSave() {
    setError(null);
    if (!title.trim())  { setError('Título requerido'); return; }
    if (!source.trim()) { setError('Fuente/autor requerido'); return; }
    if (!text.trim())   { setError('Texto requerido'); return; }
    if (slides.length === 0) {
      setError('Genera las slides con IA antes de guardar (o al menos deja una cover).');
      return;
    }
    if (audioMode === 'youtube' && !extractVideoId(youtubeUrl)) {
      setError('URL de YouTube inválida'); return;
    }

    // Text-only lessons don't carry audio at all — force it off so we
    // don't persist a dangling audioUrl the teacher can't hear from the UI.
    const effectiveAudioMode: TextAudioSource = comprehensionMode === 'text' ? 'none' : audioMode;

    const finalAudioUrl =
      effectiveAudioMode === 'youtube' ? undefined :
      effectiveAudioMode === 'tts'     ? ttsAudioUrl :
      effectiveAudioMode === 'hosted'  ? hostedUrl :
      undefined;

    const textData: TextData = {
      title: title.trim(),
      source: source.trim(),
      text: text.trim(),
      posterUrl: posterUrl.trim() || undefined,
      // Only persist the position when the teacher moved away from the
      // default center — keeps legacy documents clean.
      posterPosition: posterUrl.trim() && (posterPosX !== 50 || posterPosY !== 50) ? posterPosition : undefined,
      youtubeUrl: effectiveAudioMode === 'youtube' ? youtubeUrl.trim() : undefined,
      audioUrl: finalAudioUrl || undefined,
      audioSource: effectiveAudioMode,
      ttsVoiceId: effectiveAudioMode === 'tts' ? voiceId : undefined,
      timings: timingsValid ? timings : undefined,
      comprehensionMode,
    };

    // Enrich all slides so the reading/cover slides can access textData.
    const enrichedSlides: Slide[] = slides.map(s => {
      const needsTextData =
        s.type === 'text_cover' ||
        s.type === 'text_comprehension' ||
        s.type === 'text_reading' ||  // legacy
        s.type === 'friendlytext_end';
      return needsTextData ? { ...s, textData } : s;
    });

    setSaving(true);
    setSavingMsg('Guardando lección…');
    try {
      if (editing && initial?.id) {
        await updateTextLesson(initial.id, {
          text: textData,
          level,
          slides: enrichedSlides,
          title: `${textData.source} – ${textData.title}`,
        });
      } else {
        const authUid = getAuth().currentUser?.uid || teacherId;
        await createTextLesson({ teacherId: authUid, text: textData, level, slides: enrichedSlides });
      }
      onClose();
    } catch (e) {
      setError('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
      setSavingMsg('');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1B2C3F]">
              {editing ? 'Editar text lesson' : 'Crear text lesson'}
            </h2>
            <p className="text-xs text-gray-400">
              Pega un texto, elige el audio (opcional), y deja que la IA arme el deck CLT de 10 slides.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Left column — content */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Título *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4B6A85]" placeholder="The Last Bookshop..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Autor / fuente *</label>
                <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4B6A85]" placeholder="J. Doe / BBC / Original script" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nivel</label>
                <select value={level} onChange={e => setLevel(e.target.value as LessonLevel)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4B6A85]">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Poster (opcional)</label>
                <div className="flex gap-1">
                  <input
                    value={posterUrl}
                    onChange={e => setPosterUrl(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4B6A85] font-mono"
                    placeholder="https:// o sube archivo →"
                  />
                  <input
                    ref={posterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePosterFile(f); }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => posterInputRef.current?.click()}
                    disabled={posterUploading}
                    className="shrink-0 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-[#4B6A85] hover:border-[#4B6A85] disabled:opacity-50"
                    title="Subir imagen a Firebase Storage (5 MB max)"
                  >
                    {posterUploading ? '…' : '📤'}
                  </button>
                </div>
                {posterError && <p className="text-[10px] text-red-500 mt-1">{posterError}</p>}
                {posterUrl && !posterError && (
                  <>
                    {/* Draggable preview — arrastra la imagen para elegir el encuadre.
                        Same aspect ratio as the slide's right column card so what you
                        see here matches what the student sees. */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Encuadre — arrastra para ajustar
                        </p>
                        <button
                          type="button"
                          onClick={() => { setPosterPosX(50); setPosterPosY(50); }}
                          className="text-[10px] font-semibold text-[#4B6A85] hover:text-[#1B2C3F]"
                          title="Volver al centro"
                        >
                          ↺ Centrar
                        </button>
                      </div>
                      <div
                        ref={posterPreviewRef}
                        onPointerDown={onPosterDragStart}
                        onPointerMove={onPosterDragMove}
                        onPointerUp={onPosterDragEnd}
                        onPointerCancel={onPosterDragEnd}
                        className="relative w-full aspect-[4/3] rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-grab active:cursor-grabbing select-none touch-none"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={posterUrl}
                          alt="Poster preview"
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none"
                          style={{ objectPosition: posterPosition }}
                        />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                          {posterPosition}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 truncate">✓ {posterUrl.slice(0, 60)}{posterUrl.length > 60 ? '…' : ''}</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Texto * <span className="text-gray-300 font-normal normal-case">— una línea por renglón; se preserva formato</span>
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-serif leading-relaxed focus:outline-none focus:border-[#4B6A85] resize-y"
                placeholder="Paste the full text here — article, dialogue, story, script, news snippet…"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {text.length} chars · {text.split('\n').filter(Boolean).length} líneas
                {text.length > 5000 && <span className="text-amber-600 font-semibold"> — ElevenLabs es 5000 max por request</span>}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Timings por línea (opcional) <span className="text-gray-300 font-normal normal-case">— segundos, uno por renglón</span>
              </label>
              <textarea
                value={timingsText}
                onChange={e => setTimingsText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#4B6A85] resize-y"
                placeholder={'0\n2.4\n5.1\n7.8'}
              />
              {timingsText && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {timings.length} tiempos parseados{!timingsValid && ' — ninguno válido'}
                </p>
              )}
            </div>
          </div>

          {/* Right column — audio + generation */}
          <div className="space-y-3">

            {/* Comprehension mode — decides how slide 4 is presented and what audio the deck needs */}
            <div className="bg-[#FFF8EC] border border-[#F0E1BE] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-[#8A6D2A] uppercase tracking-widest mb-2">
                Modo de comprensión
              </p>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {(['text','audio','both'] as ComprehensionMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => {
                      setComprehensionMode(m);
                      // Auto-align audio picker with the mode so teachers don't
                      // have to remember to switch it manually.
                      if (m === 'text' && audioMode !== 'none') setAudioMode('none');
                      if (m === 'audio' && audioMode === 'none') setAudioMode(ttsConfigured ? 'tts' : 'youtube');
                    }}
                    className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                      comprehensionMode === m
                        ? 'bg-[#8A6D2A] text-white border-[#8A6D2A]'
                        : 'bg-white text-[#8A6D2A] border-[#E8D9BE] hover:border-[#8A6D2A]'
                    }`}
                  >
                    {m === 'text' ? '📖 Solo texto' : m === 'audio' ? '🎧 Solo audio' : '📖🎧 Ambos'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#8A6D2A]/80">
                {comprehensionMode === 'text' && 'La clase se dicta con solo texto — sin audio player.'}
                {comprehensionMode === 'audio' && 'La clase se dicta con solo audio — el texto queda oculto tras un botón.'}
                {comprehensionMode === 'both' && 'La clase muestra texto y audio en paralelo con highlight sincronizado.'}
              </p>
            </div>

            <div className={`bg-[#F5F9FC] border border-[#D9E6F0] rounded-2xl p-4 ${comprehensionMode === 'text' ? 'opacity-50 pointer-events-none' : ''}`}>
              <p className="text-[10px] font-bold text-[#4B6A85] uppercase tracking-widest mb-2">
                Audio{comprehensionMode === 'text' && ' (deshabilitado — modo solo texto)'}
              </p>
              <div className="grid grid-cols-4 gap-1 mb-3">
                {(['none','youtube','tts','hosted'] as TextAudioSource[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setAudioMode(m)}
                    className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-colors ${
                      audioMode === m
                        ? 'bg-[#1B2C3F] text-white border-[#1B2C3F]'
                        : 'bg-white text-[#4B6A85] border-gray-200 hover:border-[#4B6A85]'
                    }`}
                  >
                    {m === 'none' ? '📖 Silent' : m === 'youtube' ? '▶ YouTube' : m === 'tts' ? '🎙 TTS' : '🔊 Hosted'}
                  </button>
                ))}
              </div>

              {audioMode === 'youtube' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">URL de YouTube</label>
                  <input
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#4B6A85]"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {youtubeUrl && !extractVideoId(youtubeUrl) && (
                    <p className="text-[10px] text-red-500 mt-1">URL no reconocida</p>
                  )}
                </div>
              )}

              {audioMode === 'tts' && (
                <div className="space-y-2">
                  {!ttsConfigured && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                      ⚠ ElevenLabs no está configurado. Agrega <code className="font-mono">ELEVENLABS_API_KEY</code> en <code className="font-mono">.env.local</code> y reinicia el server.
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Voz</label>
                    <select
                      value={voiceId}
                      onChange={e => setVoiceId(e.target.value)}
                      disabled={!ttsConfigured || voices.length === 0}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4B6A85] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      {voices.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} · {v.accent} · {v.gender === 'f' ? '♀' : '♂'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleGenerateTts}
                    disabled={!ttsConfigured || generatingTts || !text.trim() || !voiceId}
                    className="w-full py-2 bg-gradient-to-r from-[#1B2C3F] to-[#4B6A85] text-white rounded-full text-xs font-bold disabled:opacity-50"
                  >
                    {generatingTts ? 'Generando + subiendo…' : '🎙 Generar audio con ElevenLabs'}
                  </button>
                  {ttsError && <p className="text-[10px] text-red-500">{ttsError}</p>}
                  {ttsAudioUrl && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400">
                        ✓ Audio hosted en Firebase Storage. Se guardará con la lección.
                      </p>
                      <audio controls src={ttsAudioUrl} className="w-full h-10 accent-[#1B2C3F]" />
                    </div>
                  )}
                </div>
              )}

              {audioMode === 'hosted' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    URL directa del audio
                  </label>
                  <input
                    value={hostedUrl}
                    onChange={e => setHostedUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#4B6A85]"
                    placeholder="https://..."
                  />
                  {hostedUrl && <audio controls src={hostedUrl} className="mt-2 w-full h-10 accent-[#1B2C3F]" />}
                </div>
              )}

              {audioMode === 'none' && (
                <p className="text-[11px] text-gray-500 italic">
                  Sin audio. La lección se hace en modo lectura silenciosa.
                </p>
              )}
            </div>

            {/* Generation section — two paths: AI (Claude) or algorithmic (no LLM) */}
            <div className="bg-gradient-to-br from-[#1B2C3F] to-[#4B6A85] rounded-2xl p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1">CLT deck</p>
              <p className="text-xs text-white/70 mb-3">
                Genera las 10 slides Friendlytext® — cover, vocab, predictions, comprehension,
                check, language focus, practice, translation, wrap-up, end.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating || generatingAlgo || !text.trim() || !title.trim()}
                  className="flex-1 py-2 bg-white text-[#1B2C3F] rounded-full text-xs font-bold disabled:opacity-50 hover:bg-white/90"
                >
                  {generating ? 'Generando con Claude…' : (slides.length > 0 ? '↺ Regenerar con IA' : '✨ Generar con IA')}
                </button>
                <button
                  onClick={handleGenerateAlgo}
                  disabled={generating || generatingAlgo || !text.trim() || !title.trim()}
                  className="flex-1 py-2 bg-transparent border border-white/40 text-white rounded-full text-xs font-bold disabled:opacity-50 hover:bg-white/10"
                  title="Genera el deck con heurísticas (sin llamada a Claude). Ideal para modo solo-texto o cuando el API está caído."
                >
                  {generatingAlgo ? 'Generando sin IA…' : '⚙ Sin IA'}
                </button>
              </div>
              {generationError && (
                <p className="text-[10px] text-red-200 mt-2">{generationError}</p>
              )}
              {slides.length > 0 && (
                <p className="text-[10px] text-white/70 mt-2">
                  ✓ {slides.length} slides listas
                  {generationSource === 'algorithmic' && <span className="ml-1 px-1.5 py-0.5 rounded bg-white/15 uppercase tracking-wider font-bold text-[9px]">algoritmo</span>}
                  {generationSource === 'ai' && <span className="ml-1 px-1.5 py-0.5 rounded bg-white/15 uppercase tracking-wider font-bold text-[9px]">ai</span>}
                  {' '}— verifica y guarda.
                </p>
              )}
            </div>

            {/* Slide list preview */}
            {slides.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Slides generadas</p>
                <ol className="space-y-1 text-xs">
                  {slides.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-50">
                      <span className="w-5 h-5 rounded-full bg-[#EEF3F8] text-[#1B2C3F] font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      <span className="text-[#1B2C3F] font-mono text-[10px]">{s.type}</span>
                      <span className="text-gray-500 truncate flex-1">{s.title ?? '—'}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs">
            {error && <span className="text-red-500">{error}</span>}
            {savingMsg && !error && <span className="text-gray-500">{savingMsg}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || slides.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-[#1B2C3F] to-[#4B6A85] text-white rounded-full text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear text lesson'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
