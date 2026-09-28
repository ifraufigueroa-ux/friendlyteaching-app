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
import { TaskRibbon, BrandCard, SubmitButton, B } from './MockShell';

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
      setError('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
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
      setError('La grabación quedó vacía. Revisa el micrófono y prueba de nuevo.');
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
      const server = (err as { serverResponse?: string })?.serverResponse ?? '';
      console.error('[speaking] upload error:', { code, msg, server, path, mime: bareMime, size: blob.size, err });
      setError(`Error subiendo audio (${code}). Path: ${path.slice(0, 60)}… · ${server.slice(0, 80)}`);
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
    <div className="w-full max-w-2xl space-y-4">
      <TaskRibbon
        eyebrow={`TOEFL · Speaking · Task ${pIdx + 1} of ${prompts.length} · ${prompt.category}`}
        emoji="🎤"
        title={
          phase === 'read'   ? 'Lee el prompt, ordena tu idea.' :
          phase === 'prep'   ? 'Preparación — 15s para pensar.' :
          phase === 'speak'  ? 'Grabando — habla con claridad.' :
                               'Guardando tu grabación…'
        }
        subtitle={`${prompt.prepSec}s prep · ${prompt.speakSec}s speak`}
        right={
          <div className="flex gap-1.5">
            {prompts.map((p, i) => {
              const done = doneIds.has(p.id);
              const active = i === pIdx;
              return (
                <span
                  key={p.id}
                  title={`Task ${i + 1}${done ? ' · grabada' : active ? ' · actual' : ' · pendiente'}`}
                  className="w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center"
                  style={{
                    background: active
                      ? '#FFFFFF'
                      : done
                        ? 'rgba(255,255,255,0.35)'
                        : 'rgba(255,255,255,0.10)',
                    color:  active ? B.purple : '#FFFFFF',
                    border: active ? 'none' : `1px solid rgba(255,255,255,${done ? '0.5' : '0.25'})`,
                  }}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        }
      />

      <BrandCard>
        {/* Prompt card */}
        <div
          className="rounded-2xl p-4 mb-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${B.lavenderBg} 0%, #E8DBFF 100%)`,
            border:     `1px solid ${B.purpleMed}33`,
          }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: B.gold }}>
            Prompt · {prompt.category}
          </p>
          <p className="text-[15px] leading-relaxed" style={{ color: B.purpleDeep }}>
            {prompt.prompt}
          </p>
        </div>

        {phase !== 'speak' && phase !== 'saving' && micStatus !== 'ok' && (
          <div className="mb-3 rounded-2xl px-3 py-2 text-xs flex items-center justify-between gap-2"
            style={{
              background: micStatus === 'checking' ? 'rgba(59,130,246,0.10)'
                : (micStatus === 'denied' || micStatus === 'unsupported') ? 'rgba(220,38,38,0.10)'
                : 'rgba(245,158,11,0.10)',
              border: micStatus === 'checking' ? '1px solid rgba(59,130,246,0.35)'
                : (micStatus === 'denied' || micStatus === 'unsupported') ? '1px solid rgba(220,38,38,0.35)'
                : '1px solid rgba(245,158,11,0.35)',
              color: micStatus === 'checking' ? '#1E40AF'
                : (micStatus === 'denied' || micStatus === 'unsupported') ? '#B91C1C'
                : '#92400E',
            }}
          >
            <span>
              {micStatus === 'checking'    && '🎙 Verificando micrófono…'}
              {micStatus === 'denied'      && '⚠ Micrófono bloqueado. Habilita permisos en el candado de la barra y recarga.'}
              {micStatus === 'unsupported' && '⚠ Tu navegador no soporta grabación. Usa Chrome/Edge/Firefox actualizado.'}
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
                className="text-red-700 underline whitespace-nowrap font-bold"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {phase === 'read' && (
          <div className="text-center space-y-4 py-2">
            <p className="text-[12px] text-gray-600">
              Vas a tener <strong style={{ color: B.purple }}>{prompt.prepSec}s de preparación</strong>,
              y después <strong style={{ color: B.purple }}>{prompt.speakSec}s para grabar</strong>.
            </p>
            <SubmitButton onClick={startPrep} disabled={micStatus !== 'ok'}>
              ▶ Empezar preparación
            </SubmitButton>
            {recordings.length > 0 && (
              <p className="text-[10px] text-gray-400">
                {recordings.length} de {prompts.length} tasks completadas.
              </p>
            )}
            <button
              onClick={skip}
              className="text-[10px] text-gray-400 hover:text-red-500 underline block mx-auto"
            >
              Saltar esta task
            </button>
          </div>
        )}

        {phase === 'prep' && (
          <div className="text-center py-8 space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center relative"
                style={{
                  background: `conic-gradient(${B.purpleMed} ${(prepLeft / prompt.prepSec) * 360}deg, ${B.lavenderBg} 0deg)`,
                }}
              >
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                  <span className="text-5xl font-black tabular-nums" style={{ color: B.purpleDeep }}>{prepLeft}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em]" style={{ color: B.purpleMed }}>Preparación</p>
            <p className="text-[12px] text-gray-500">Piensa tu respuesta. La grabación arranca sola.</p>
            <button onClick={startSpeaking} className="text-xs text-gray-400 hover:text-gray-600 underline">
              Empezar a grabar ahora →
            </button>
          </div>
        )}

        {phase === 'speak' && (
          <div className="text-center py-8 space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full animate-ping"
                style={{ background: 'rgba(239,68,68,0.15)' }} />
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center relative"
                style={{
                  background: `conic-gradient(#EF4444 ${(speakLeft / prompt.speakSec) * 360}deg, #FEE2E2 0deg)`,
                }}
              >
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                  <span className="text-5xl font-black tabular-nums text-red-500">{speakLeft}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-red-600 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Grabando
            </p>
            <p className="text-[12px] text-gray-500">Habla con claridad. Se corta sola al llegar a 0.</p>
            <button
              onClick={stopSpeaking}
              className="px-5 py-2 rounded-2xl text-xs font-bold transition-colors"
              style={{ border: '1.5px solid #E5E7EB', color: '#4B5563', background: 'white' }}
            >
              Terminar ahora
            </button>
          </div>
        )}

        {phase === 'saving' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-3"
              style={{ borderColor: B.purpleMed, borderTopColor: 'transparent' }} />
            <p className="text-sm font-black" style={{ color: B.purpleDeep }}>Guardando audio…</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {pIdx < prompts.length - 1
                ? 'Cuando termine, pasamos a la próxima task.'
                : finalMsg}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-2xl px-3 py-2 text-xs flex items-center justify-between gap-2"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.35)', color: '#B91C1C' }}
          >
            <span>{error}</span>
            <button onClick={skip} className="text-red-600 underline whitespace-nowrap font-bold">Saltar task →</button>
          </div>
        )}
      </BrandCard>
    </div>
  );
}
