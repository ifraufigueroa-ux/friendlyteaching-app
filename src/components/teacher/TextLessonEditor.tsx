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
import { useEffect, useMemo, useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { createTextLesson, updateTextLesson } from '@/hooks/useTextLessons';
import type {
  TextLesson, Slide, LessonLevel, TextData, TextAudioSource,
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

export default function TextLessonEditor({ teacherId, initial, onClose }: Props) {
  const editing = Boolean(initial);

  // ── Metadata ────────────────────────────────────────────────────────
  const [title,  setTitle]  = useState<string>(initial?.text?.title ?? '');
  const [source, setSource] = useState<string>(initial?.text?.source ?? '');
  const [level,  setLevel]  = useState<LessonLevel>(initial?.level ?? 'B1');
  const [text,   setText]   = useState<string>(initial?.text?.text ?? '');
  const [posterUrl, setPosterUrl] = useState<string>(initial?.text?.posterUrl ?? '');

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
  const [generationError, setGenerationError] = useState<string | null>(null);

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
    if (!text.trim()) { setTtsError('Pega primero el texto que quieres narrar.'); return; }
    if (!voiceId)      { setTtsError('Elige una voz.'); return; }
    if (!teacherId)    { setTtsError('Sin sesión — refresca la página.'); return; }
    if (text.length > 5000) {
      setTtsError(`Texto muy largo (${text.length} chars). ElevenLabs va tope 5000 por request; recorta o divide.`);
      return;
    }

    setGeneratingTts(true);
    try {
      const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), voiceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setTtsError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      const blob = await res.blob();
      // Upload to /audio/{teacherId}-{ts}.mp3
      const fileName = `friendlytext-${teacherId}-${Date.now()}.mp3`;
      const path = `audio/${fileName}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, blob, { contentType: 'audio/mpeg' });
      const url = await getDownloadURL(ref);
      setTtsAudioUrl(url);
    } catch (err) {
      setTtsError('Error de red: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGeneratingTts(false);
    }
  }

  async function handleGenerate() {
    setGenerationError(null);
    if (!title.trim() || !source.trim() || !text.trim()) {
      setGenerationError('Completa título, fuente y texto antes de generar.');
      return;
    }

    setGenerating(true);
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
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setGenerationError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      const data: { slides: Slide[] } = await res.json();
      setSlides(data.slides ?? []);
    } catch (err) {
      setGenerationError('Error de red: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGenerating(false);
    }
  }

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

    const finalAudioUrl =
      audioMode === 'youtube' ? undefined :
      audioMode === 'tts'     ? ttsAudioUrl :
      audioMode === 'hosted'  ? hostedUrl :
      undefined;

    const textData: TextData = {
      title: title.trim(),
      source: source.trim(),
      text: text.trim(),
      posterUrl: posterUrl.trim() || undefined,
      youtubeUrl: audioMode === 'youtube' ? youtubeUrl.trim() : undefined,
      audioUrl: finalAudioUrl || undefined,
      audioSource: audioMode,
      ttsVoiceId: audioMode === 'tts' ? voiceId : undefined,
      timings: timingsValid ? timings : undefined,
    };

    // Enrich all slides so the reading/cover slides can access textData.
    const enrichedSlides: Slide[] = slides.map(s => {
      const needsTextData =
        s.type === 'text_cover' ||
        s.type === 'text_reading' ||
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
        await createTextLesson({ teacherId, text: textData, level, slides: enrichedSlides });
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
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Poster URL (opcional)</label>
                <input value={posterUrl} onChange={e => setPosterUrl(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4B6A85] font-mono" placeholder="https://..." />
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
            <div className="bg-[#F5F9FC] border border-[#D9E6F0] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-[#4B6A85] uppercase tracking-widest mb-2">Audio</p>
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

            {/* AI generation section */}
            <div className="bg-gradient-to-br from-[#1B2C3F] to-[#4B6A85] rounded-2xl p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1">CLT deck con IA</p>
              <p className="text-xs text-white/70 mb-3">
                Genera las 10 slides Friendlytext® — cover, vocab, predictions, reading,
                comprehension, language focus, practice, translation, wrap-up, end.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating || !text.trim() || !title.trim()}
                className="w-full py-2 bg-white text-[#1B2C3F] rounded-full text-xs font-bold disabled:opacity-50 hover:bg-white/90"
              >
                {generating ? 'Generando con Claude…' : (slides.length > 0 ? '↺ Regenerar deck' : '✨ Generar deck CLT')}
              </button>
              {generationError && (
                <p className="text-[10px] text-red-200 mt-2">{generationError}</p>
              )}
              {slides.length > 0 && (
                <p className="text-[10px] text-white/70 mt-2">
                  ✓ {slides.length} slides listas — verifica y guarda.
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
