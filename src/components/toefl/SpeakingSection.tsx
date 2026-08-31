// FriendlyTeaching.cl — TOEFL Speaking recorder
//
// Reusable Speaking runner used by both the live full-mock (`/toefl-mock/…`)
// and the assigned-mock student flow (`/dashboard/student/toefl-speaking/…`).
// Flow per task: read → prep (15s) → speak (45s, MediaRecorder) → saving
// (blob upload to Storage). Mid-recording is intentionally NOT snapshotted —
// the browser can't resume a MediaRecorder chunk stream across a page reload.

'use client';
import { useEffect, useRef, useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import type {
  TOEFLSpeakingPrompt, SpeakingRecording, TOEFLLiveSnapshot,
} from '@/types/toefl';
import { useCountdown } from '@/hooks/useCountdown';

const B = {
  purple:      '#5A3D7A',
  purpleMed:   '#9B7CB8',
};

type MicStatus = 'unknown' | 'checking' | 'ok' | 'denied' | 'unsupported';

export interface SpeakingSectionProps {
  prompts:    TOEFLSpeakingPrompt[];
  teacherId:  string;
  /** Groups uploaded audios in Storage under a stable id (session or assignment). */
  sessionId:  string;
  onDone:     (recordings: SpeakingRecording[]) => void;
  initial?:   { outerIdx: number; recordings?: SpeakingRecording[] };
  onSnapshot?: (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
  /** Copy shown while uploading the final task's audio. The default mentions
   *  auto AI grading, which is only true in the live full-mock flow. Assigned
   *  mocks override this so students don't expect immediate feedback. */
  finalTaskSavingMessage?: string;
}

export function SpeakingSection({
  prompts, teacherId, sessionId, onDone, initial, onSnapshot,
  finalTaskSavingMessage,
}: SpeakingSectionProps) {
  const [pIdx, setPIdx] = useState(initial?.outerIdx ?? 0);
  const [phase, setPhase] = useState<'read' | 'prep' | 'speak' | 'saving'>('read');
  const [recordings, setRecordings] = useState<SpeakingRecording[]>(initial?.recordings ?? []);
  const [error, setError] = useState('');
  const [micStatus, setMicStatus] = useState<MicStatus>('unknown');
  const chunks = useRef<Blob[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const prompt = prompts[pIdx];

  const prepLeft = useCountdown(prompt.prepSec, phase === 'prep', () => startSpeaking());
  const speakLeft = useCountdown(prompt.speakSec, phase === 'speak', () => stopSpeaking());

  // Emit snapshot on every task advance (not mid-recording).
  useEffect(() => {
    if (!onSnapshot) return;
    onSnapshot({
      outerIdx:           pIdx,
      innerIdx:           0,
      timeLeftSec:        0,
      speakingRecordings: recordings,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pIdx, recordings]);

  // Pre-flight mic check on mount — surface permission problems BEFORE the
  // student burns a task on a denied prompt.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicStatus('unsupported'); return;
    }
    setMicStatus('checking');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((s) => {
        s.getTracks().forEach(t => t.stop());
        setMicStatus('ok');
      })
      .catch((err) => {
        console.warn('[speaking] mic preflight denied:', err);
        setMicStatus('denied');
      });
  }, []);

  async function startRecording() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      // Chrome/Firefox/Edge speak webm+opus; Safari (iPhone/iPad/macOS) only
      // supports mp4/aac. Fall through the list until one hits.
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
      ];
      const mimeType = candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
      const rec = mimeType ? new MediaRecorder(s, { mimeType }) : new MediaRecorder(s);
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.start();
      recorder.current = rec;
    } catch (err) {
      console.error('[speaking] mic error:', err);
      setError('No se pudo acceder al micrófono. Revisá permisos del navegador.');
      setPhase('read');
      setMicStatus('denied');
    }
  }

  function startPrep() {
    setError('');
    setPhase('prep');
  }
  function startSpeaking() {
    setPhase('speak');
    startRecording();
  }

  async function stopSpeaking() {
    if (!recorder.current) { setPhase('saving'); return; }
    setPhase('saving');
    await new Promise<void>((resolve) => {
      const rec = recorder.current!;
      rec.onstop = () => resolve();
      rec.stop();
    });
    stream.current?.getTracks().forEach(t => t.stop());
    const recMime = recorder.current!.mimeType || 'audio/webm';
    // Storage rules regex matches on the bare mime — strip any ;codecs=…
    // parameter so audio/webm;codecs=opus still passes the audio/.* rule.
    const bareMime = recMime.split(';')[0].trim() || 'audio/webm';
    const blob = new Blob(chunks.current, { type: recMime });
    if (blob.size === 0) {
      console.error('[speaking] empty recording — no audio chunks');
      setError('La grabación quedó vacía. Revisá el micrófono y probá de nuevo.');
      setPhase('speak');
      return;
    }
    // Extension must match the actual codec so Storage / Whisper can decode it.
    const ext = bareMime.includes('mp4') ? 'mp4' : bareMime.includes('wav') ? 'wav' : 'webm';
    // Path uses real segments (not a flat filename) so Storage rules can
    // match it unambiguously without regex.
    const path = `audio/toefl-speaking/${teacherId}/${sessionId}/${prompt.id}-${Date.now()}.${ext}`;
    try {
      const sref = storageRef(storage, path);
      await uploadBytes(sref, blob, { contentType: bareMime });
      const url = await getDownloadURL(sref);
      const rec: SpeakingRecording = {
        promptId:    prompt.id,
        storagePath: path,
        audioUrl:    url,
        durationSec: prompt.speakSec - speakLeft,
      };
      const next = [...recordings, rec];
      setRecordings(next);
      if (pIdx < prompts.length - 1) {
        setPIdx(i => i + 1);
        setPhase('read');
      } else {
        onDone(next);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? 'unknown';
      const msg  = err instanceof Error ? err.message : String(err);
      console.error('[speaking] upload error:', code, msg, err);
      setError(`Error subiendo el audio (${code}). Probá de nuevo o saltá la task.`);
      setPhase('speak');
    }
  }

  function skip() {
    const placeholder: SpeakingRecording = {
      promptId:    prompt.id,
      storagePath: '',
      audioUrl:    '',
      durationSec: 0,
    };
    const next = [...recordings, placeholder];
    setRecordings(next);
    setError('');
    if (pIdx < prompts.length - 1) {
      setPIdx(i => i + 1);
      setPhase('read');
    } else {
      onDone(next);
    }
  }

  const doneIds = new Set(recordings.map(r => r.promptId));
  const finalMsg = finalTaskSavingMessage ?? 'Última task. Al terminar arranca la calificación con AI (~1-2 min).';

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Speaking · Task {pIdx + 1} of {prompts.length} · {prompt.category}
          </span>
          <div className="flex gap-1.5">
            {prompts.map((p, i) => {
              const done = doneIds.has(p.id);
              const active = i === pIdx;
              return (
                <span
                  key={p.id}
                  title={`Task ${i + 1}${done ? ' · grabada' : active ? ' · actual' : ' · pendiente'}`}
                  className={`w-6 h-6 rounded text-[10px] font-bold border-2 flex items-center justify-center ${
                    active ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white'
                    : done  ? 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A]'
                    :         'border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        </div>
        <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl p-4 mb-4">
          <p className="text-sm text-[#2D1B4E] leading-relaxed">{prompt.prompt}</p>
        </div>

        {phase !== 'speak' && phase !== 'saving' && micStatus !== 'ok' && (
          <div className={`mb-3 rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2 border ${
            micStatus === 'checking'    ? 'bg-blue-50 border-blue-200 text-blue-800'
            : micStatus === 'denied'    ? 'bg-red-50 border-red-200 text-red-700'
            : micStatus === 'unsupported' ? 'bg-red-50 border-red-200 text-red-700'
            :                              'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span>
              {micStatus === 'checking'    && '🎙 Verificando micrófono…'}
              {micStatus === 'denied'      && '⚠ Micrófono bloqueado. Habilitá permisos en el candado de la barra de direcciones y recargá.'}
              {micStatus === 'unsupported' && '⚠ Tu navegador no soporta grabación. Usá Chrome/Edge/Firefox actualizado.'}
              {micStatus === 'unknown'     && '⚠ Estado del micrófono desconocido.'}
            </span>
            {micStatus === 'denied' && (
              <button
                onClick={() => {
                  setMicStatus('checking');
                  navigator.mediaDevices.getUserMedia({ audio: true })
                    .then((s) => { s.getTracks().forEach(t => t.stop()); setMicStatus('ok'); })
                    .catch(() => setMicStatus('denied'));
                }}
                className="text-red-700 underline whitespace-nowrap"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {phase === 'read' && (
          <div className="text-center space-y-3">
            <p className="text-[11px] text-gray-500">
              Vas a tener <strong>{prompt.prepSec}s de preparación</strong>, y después <strong>{prompt.speakSec}s para grabar</strong> tu respuesta.
            </p>
            <button
              onClick={startPrep}
              disabled={micStatus !== 'ok'}
              className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: B.purple }}
            >
              ▶ Empezar preparación
            </button>
            {recordings.length > 0 && (
              <p className="text-[10px] text-gray-400">
                {recordings.length} de {prompts.length} tasks completadas.
              </p>
            )}
            <button
              onClick={skip}
              className="text-[10px] text-gray-400 hover:text-red-500 underline block mx-auto mt-2"
            >
              Saltar esta task
            </button>
          </div>
        )}

        {phase === 'prep' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-6xl font-black tabular-nums" style={{ color: B.purple }}>{prepLeft}</div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: B.purpleMed }}>Preparación</p>
            <p className="text-[11px] text-gray-500">Pensá tu respuesta. La grabación arranca sola.</p>
            <button onClick={startSpeaking} className="text-xs text-gray-400 hover:text-gray-600 mt-2">Empezar a grabar ahora →</button>
          </div>
        )}

        {phase === 'speak' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-6xl font-black tabular-nums text-red-500 animate-pulse">{speakLeft}</div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">🔴 Grabando</p>
            <p className="text-[11px] text-gray-500">Hablá con claridad. La grabación se corta sola al llegar a 0.</p>
            <button
              onClick={stopSpeaking}
              className="px-5 py-2 rounded-full text-xs font-bold border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Terminar ahora
            </button>
          </div>
        )}

        {phase === 'saving' && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold" style={{ color: B.purple }}>Guardando audio…</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {pIdx < prompts.length - 1
                ? 'Cuando termine, pasamos a la próxima task.'
                : finalMsg}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={skip} className="text-red-600 underline whitespace-nowrap">Saltar task →</button>
          </div>
        )}
      </div>
    </div>
  );
}
