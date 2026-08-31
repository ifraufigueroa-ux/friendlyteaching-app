// FriendlyTeaching.cl — TOEFL Speaking Simulator
//
// Practica controlada, un prompt a la vez, con feedback inmediato del AI.
// Reutiliza el banco de prompts de los 4 mocks y el pipeline
// transcribe-speech → ai-grade-toefl-speaking.
//
// A diferencia del mock: no persiste sesiones, no sube audio a Storage
// (multipart directo al endpoint de transcribe), y muestra rubric + feedback
// después de cada grabación con opciones "reintentar" y "próximo prompt".

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import type { TOEFLSpeakingPrompt } from '@/types/toefl';
import {
  speakingPromptsMock1,
  speakingPromptsMock2,
  speakingPromptsMock3,
  speakingPromptsMock4,
} from '@/lib/data/toefl/speaking/independent-prompts';
import { useCountdown } from '@/hooks/useCountdown';

const B = {
  purple:      '#5A3D7A',
  purpleDark:  '#3D2558',
  purpleMed:   '#9B7CB8',
  purpleLight: '#C8A8DC',
  lavender:    '#F0E5FF',
};

// Flat bank across all mocks. Categories currently in the bank: personal,
// opinion, choice. Order-preserving so "shuffle off" gives deterministic order.
const ALL_PROMPTS: TOEFLSpeakingPrompt[] = [
  ...speakingPromptsMock1,
  ...speakingPromptsMock2,
  ...speakingPromptsMock3,
  ...speakingPromptsMock4,
];

type Category = 'all' | 'personal' | 'opinion' | 'choice';

const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  all:      { label: 'Todas',    emoji: '🎯' },
  personal: { label: 'Personal', emoji: '👤' },
  opinion:  { label: 'Opinión',  emoji: '💭' },
  choice:   { label: 'Elección', emoji: '⚖️' },
};

type Phase =
  | 'idle'
  | 'prep'
  | 'speak'
  | 'saving'
  | 'transcribing'
  | 'grading'
  | 'result'
  | 'error';

interface AIResult {
  rawScore04:   number;
  rubric:       { delivery: number; languageUse: number; topicDevelopment: number };
  feedback:     string;
  strengths:    string[];
  improvements: string[];
  transcript:   string;
  durationSec:  number;
}

export default function SpeakingSimulatorPage() {
  const [category, setCategory] = useState<Category>('all');
  const [shuffled, setShuffled] = useState(true);
  const [orderSeed, setOrderSeed] = useState(0);

  const promptPool = useMemo(() => {
    const base = category === 'all' ? ALL_PROMPTS : ALL_PROMPTS.filter(p => p.category === category);
    if (!shuffled) return base;
    // Deterministic shuffle per seed so re-renders don't reshuffle.
    const arr = [...base];
    let r = orderSeed * 9301 + 49297;
    for (let i = arr.length - 1; i > 0; i--) {
      r = (r * 9301 + 49297) % 233280;
      const j = Math.floor((r / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [category, shuffled, orderSeed]);

  const [pIdx, setPIdx] = useState(0);
  const prompt = promptPool[pIdx % Math.max(1, promptPool.length)];

  useEffect(() => { setPIdx(0); reset(); /* new pool → restart */ }, [category, orderSeed]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<AIResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const chunks = useRef<Blob[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const finalBlob = useRef<Blob | null>(null);

  const prepLeft  = useCountdown(prompt?.prepSec ?? 15,  phase === 'prep',  () => startSpeaking());
  const speakLeft = useCountdown(prompt?.speakSec ?? 45, phase === 'speak', () => stopSpeaking());

  type MicStatus = 'unknown' | 'checking' | 'ok' | 'denied' | 'unsupported';
  const [micStatus, setMicStatus] = useState<MicStatus>('unknown');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicStatus('unsupported'); return;
    }
    setMicStatus('checking');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((s) => { s.getTracks().forEach(t => t.stop()); setMicStatus('ok'); })
      .catch(() => setMicStatus('denied'));
  }, []);

  function reset() {
    setPhase('idle');
    setResult(null);
    setErrorMsg('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    finalBlob.current = null;
    chunks.current = [];
    stream.current?.getTracks().forEach(t => t.stop());
    stream.current = null;
    recorder.current = null;
  }

  function startPrep() {
    reset();
    setPhase('prep');
  }

  async function startRecording() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(s, { mimeType });
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.start();
      recorder.current = rec;
    } catch (err) {
      console.error('[simulator] mic error:', err);
      setErrorMsg('No se pudo acceder al micrófono. Revisá permisos del navegador.');
      setPhase('error');
      setMicStatus('denied');
    }
  }

  function startSpeaking() {
    setPhase('speak');
    startRecording();
  }

  async function stopSpeaking() {
    if (!recorder.current) { setPhase('idle'); return; }
    setPhase('saving');
    await new Promise<void>((resolve) => {
      const rec = recorder.current!;
      rec.onstop = () => resolve();
      rec.stop();
    });
    stream.current?.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks.current, { type: recorder.current.mimeType });
    finalBlob.current = blob;
    setAudioUrl(URL.createObjectURL(blob));
    const durationSec = prompt.speakSec - speakLeft;
    await gradeRecording(blob, durationSec);
  }

  async function gradeRecording(blob: Blob, durationSec: number) {
    try {
      setPhase('transcribing');
      const form = new FormData();
      form.append('audio', blob, `simulator-${prompt.id}-${Date.now()}.webm`);
      form.append('language', 'en');
      const tRes = await fetch('/api/transcribe-speech', { method: 'POST', body: form });
      const tJson = await tRes.json().catch(() => ({}));
      if (!tRes.ok) throw new Error(`Transcribe ${tRes.status}: ${tJson?.error ?? 'sin respuesta'}`);
      const transcript = String(tJson.text ?? '').trim();
      if (!transcript) {
        setResult({
          rawScore04: 0,
          rubric: { delivery: 0, languageUse: 0, topicDevelopment: 0 },
          feedback: 'No se detectó voz en la grabación. Revisá el micrófono y probá de nuevo.',
          strengths: [],
          improvements: ['Verificá que el micrófono esté captando audio', 'Hablá más cerca del micrófono'],
          transcript: '',
          durationSec,
        });
        setPhase('result');
        return;
      }

      setPhase('grading');
      const gRes = await fetch('/api/ai-grade-toefl-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.prompt, transcript, durationSec }),
      });
      const gJson = await gRes.json().catch(() => ({}));
      if (!gRes.ok) throw new Error(`Grade ${gRes.status}: ${gJson?.error ?? 'sin respuesta'}`);

      setResult({
        rawScore04:   Number(gJson.rawScore04 ?? 0),
        rubric:       gJson.rubric ?? { delivery: 0, languageUse: 0, topicDevelopment: 0 },
        feedback:     String(gJson.feedback ?? ''),
        strengths:    Array.isArray(gJson.strengths)    ? gJson.strengths.map(String)    : [],
        improvements: Array.isArray(gJson.improvements) ? gJson.improvements.map(String) : [],
        transcript,
        durationSec,
      });
      setPhase('result');
    } catch (err) {
      console.error('[simulator] grading error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado');
      setPhase('error');
    }
  }

  function nextPrompt() {
    reset();
    setPIdx(i => (i + 1) % promptPool.length);
  }
  function retrySame() {
    reset();
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% -10%, rgba(200,168,220,0.35) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 10% 90%, rgba(232,181,71,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="Speaking Simulator"
          subtitle="Practica un task a la vez con feedback inmediato de IA"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools',     href: '/dashboard/teacher/tools' },
            { label: 'TOEFL',     href: '/dashboard/teacher/toefl' },
            { label: 'Speaking Simulator' },
          ]}
        />

        <div className="max-w-3xl mx-auto mt-8 space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B547] animate-pulse" />
              Independent Speaking · Practice
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              Speaking Simulator
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-xl mx-auto">
              Elegí una categoría, grabá tu respuesta con timing real (15s prep + 45s speak),
              y recibí score 0-4 con rubric + tips del AI en el momento.
            </p>
          </div>

          {/* Category picker + shuffle — hidden while recording so the timer
              takes centre stage. */}
          {phase === 'idle' && (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4">
              <div>
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">
                  Categoría
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
                    const meta = CATEGORY_META[c];
                    const active = category === c;
                    const count = c === 'all' ? ALL_PROMPTS.length : ALL_PROMPTS.filter(p => p.category === c).length;
                    return (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`text-left rounded-xl p-3 border-2 transition-all ${
                          active ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-gray-200 bg-white hover:border-[#C8A8DC]'
                        }`}
                      >
                        <div className="text-lg mb-0.5">{meta.emoji}</div>
                        <p className="text-sm font-bold text-[#2D1B4E]">{meta.label}</p>
                        <p className="text-[10px] text-gray-500 tabular-nums">{count} prompts</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-[#5A3D7A]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffled}
                    onChange={(e) => { setShuffled(e.target.checked); setOrderSeed(s => s + 1); }}
                    className="w-4 h-4 accent-[#5A3D7A]"
                  />
                  Orden aleatorio
                </label>
                <button
                  onClick={() => setOrderSeed(s => s + 1)}
                  disabled={!shuffled}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-[#C8A8DC] text-[#5A3D7A] hover:bg-[#F0E5FF] transition-colors disabled:opacity-40"
                >
                  🎲 Barajar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* Prompt card */}
          <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-6">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
                Prompt {pIdx + 1} / {promptPool.length} · {prompt?.category}
              </span>
              <span className="text-[10px] text-gray-400 tabular-nums">
                {prompt?.prepSec}s prep · {prompt?.speakSec}s speak
              </span>
            </div>

            <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl p-4 mb-4">
              <p className="text-sm text-[#2D1B4E] leading-relaxed">{prompt?.prompt}</p>
            </div>

            {/* Mic status */}
            {phase !== 'speak' && phase !== 'saving' && micStatus !== 'ok' && (
              <div className={`mb-3 rounded-xl px-3 py-2 text-xs border ${
                micStatus === 'checking'    ? 'bg-blue-50 border-blue-200 text-blue-800'
                : micStatus === 'denied'    ? 'bg-red-50 border-red-200 text-red-700'
                : micStatus === 'unsupported' ? 'bg-red-50 border-red-200 text-red-700'
                :                              'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {micStatus === 'checking'    && '🎙 Verificando micrófono…'}
                {micStatus === 'denied'      && '⚠ Micrófono bloqueado. Habilitá permisos y recargá la página.'}
                {micStatus === 'unsupported' && '⚠ Tu navegador no soporta grabación. Usá Chrome/Edge/Firefox actualizado.'}
                {micStatus === 'unknown'     && '⚠ Estado del micrófono desconocido.'}
              </div>
            )}

            {phase === 'idle' && (
              <div className="text-center space-y-3">
                <p className="text-[11px] text-gray-500">
                  Vas a tener <strong>{prompt?.prepSec}s de preparación</strong>,
                  luego <strong>{prompt?.speakSec}s para grabar</strong>. Al terminar, la IA califica al instante.
                </p>
                <button
                  onClick={startPrep}
                  disabled={micStatus !== 'ok'}
                  className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: B.purple }}
                >
                  ▶ Empezar preparación
                </button>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={nextPrompt}
                    className="text-[11px] text-gray-500 hover:text-[#5A3D7A] underline"
                  >
                    Saltar a otro prompt →
                  </button>
                </div>
              </div>
            )}

            {phase === 'prep' && (
              <div className="text-center py-4 space-y-3">
                <div className="text-6xl font-black tabular-nums" style={{ color: B.purple }}>{prepLeft}</div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: B.purpleMed }}>Preparación</p>
                <p className="text-[11px] text-gray-500">Pensá tu respuesta. La grabación arranca sola.</p>
                <button onClick={startSpeaking} className="text-xs text-gray-400 hover:text-gray-600 mt-2">
                  Empezar a grabar ahora →
                </button>
              </div>
            )}

            {phase === 'speak' && (
              <div className="text-center py-4 space-y-3">
                <div className="text-6xl font-black tabular-nums text-red-500 animate-pulse">{speakLeft}</div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-600">🔴 Grabando</p>
                <p className="text-[11px] text-gray-500">Hablá con claridad. Se corta sola al llegar a 0.</p>
                <button
                  onClick={stopSpeaking}
                  className="px-5 py-2 rounded-full text-xs font-bold border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Terminar ahora
                </button>
              </div>
            )}

            {(phase === 'saving' || phase === 'transcribing' || phase === 'grading') && (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold" style={{ color: B.purple }}>
                  {phase === 'saving'       && 'Procesando audio…'}
                  {phase === 'transcribing' && 'Transcribiendo con Whisper…'}
                  {phase === 'grading'      && 'Calificando con AI…'}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">Esto toma unos 5-15 segundos.</p>
              </div>
            )}

            {phase === 'error' && (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
                  {errorMsg || 'Ocurrió un error. Probá de nuevo.'}
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={retrySame}
                    className="px-5 py-2 rounded-full text-xs font-bold border border-[#5A3D7A] text-[#5A3D7A] hover:bg-[#F0E5FF] transition-colors"
                  >
                    ↻ Reintentar
                  </button>
                  <button
                    onClick={nextPrompt}
                    className="px-5 py-2 rounded-full text-xs font-bold text-white shadow"
                    style={{ background: B.purple }}
                  >
                    Próximo prompt →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Result panel */}
          {phase === 'result' && result && (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-6 space-y-5">
              {/* Score header */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
                    AI Score
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-black tabular-nums" style={{ color: B.purple }}>
                      {result.rawScore04}
                    </span>
                    <span className="text-lg text-gray-400 font-bold">/ 4</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-gray-500 tabular-nums">
                  <p>Duración: {result.durationSec.toFixed(1)}s</p>
                  <p>{result.transcript.split(/\s+/).filter(Boolean).length} palabras</p>
                </div>
              </div>

              {/* Rubric */}
              <div className="grid grid-cols-3 gap-2">
                {(['delivery', 'languageUse', 'topicDevelopment'] as const).map((k) => {
                  const label = k === 'delivery' ? 'Delivery' : k === 'languageUse' ? 'Language' : 'Development';
                  const val = result.rubric[k] ?? 0;
                  return (
                    <div key={k} className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70">{label}</p>
                      <p className="text-2xl font-black tabular-nums text-[#5A3D7A] mt-1">{val}<span className="text-xs text-gray-400 font-bold">/4</span></p>
                    </div>
                  );
                })}
              </div>

              {/* Feedback */}
              {result.feedback && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5A3D7A] mb-1">Feedback</p>
                  <p className="text-sm text-[#2D1B4E] leading-relaxed">{result.feedback}</p>
                </div>
              )}

              {/* Strengths + improvements */}
              <div className="grid md:grid-cols-2 gap-3">
                {result.strengths.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">✓ Fortalezas</p>
                    <ul className="text-xs text-emerald-900 space-y-1 list-disc pl-4">
                      {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {result.improvements.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">→ A mejorar</p>
                    <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
                      {result.improvements.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Transcript + playback */}
              {(audioUrl || result.transcript) && (
                <details className="rounded-xl border border-gray-200 bg-gray-50">
                  <summary className="cursor-pointer text-[11px] font-bold text-gray-600 px-3 py-2 select-none">
                    Ver transcript y reproducir grabación
                  </summary>
                  <div className="px-3 pb-3 space-y-2">
                    {audioUrl && <audio src={audioUrl} controls className="w-full" />}
                    {result.transcript && (
                      <p className="text-xs text-gray-700 italic leading-relaxed whitespace-pre-wrap">
                        &ldquo;{result.transcript}&rdquo;
                      </p>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <button
                  onClick={retrySame}
                  className="px-5 py-2 rounded-full text-xs font-bold border border-[#5A3D7A] text-[#5A3D7A] hover:bg-[#F0E5FF] transition-colors"
                >
                  ↻ Reintentar el mismo prompt
                </button>
                <button
                  onClick={nextPrompt}
                  className="px-5 py-2 rounded-full text-xs font-bold text-white shadow"
                  style={{ background: B.purple }}
                >
                  Próximo prompt →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
