// FriendlyTeaching.cl — TOEFL Speaking runner (ETS 2026)
//
// Runs the ETS 2026 Speaking section: 7 Listen-and-Repeat items + 4
// Take-an-Interview items (11 total, ~8 minutes). Every item is scored
// 0-5; the section band 1.0-6.0 is computed on the client from the raw sum.
//
// Flow per LR item:  intro → play (SpeechSynthesis) → speak (recordSec) → save
// Flow per TI item:  intro → play (SpeechSynthesis) → speak (45s)      → save
// Between LR and TI: a short "interview intro" card with the topic + intro
//                    line, so the student knows who is asking and about what.
//
// SpeechSynthesis (browser TTS) is used for prompt playback so no ElevenLabs
// key is required for the mock to work — quality is not perfect but voices
// are consistent, gender-neutral and English-tuned. In production we can
// swap the `speakUtterance` helper for a real audio clip URL.
//
// Reusable across the live full-mock and the assigned-mock student flow. Also
// falls back to a legacy Independent-Speaking layout when the mock only ships
// `speakingLegacy` (pre-2026 content).

'use client';
import { useEffect, useRef, useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import type {
  TOEFLSpeakingPrompt, TOEFLSpeakingSection, TOEFLSpeakingItem,
  SpeakingRecording, TOEFLLiveSnapshot,
} from '@/types/toefl';
import { speakingSectionItems } from '@/types/toefl';
import { useCountdown } from '@/hooks/useCountdown';
import { TaskRibbon, BrandCard, SubmitButton, B } from './MockShell';

type MicStatus = 'unknown' | 'checking' | 'ok' | 'denied' | 'unsupported';
type Phase =
  | 'intro'              // "Task N — listen, then repeat" (or interview intro before TI)
  | 'playing'            // browser is speaking the prompt
  | 'speak'              // recording student's answer
  | 'saving';            // uploading blob to storage

export interface SpeakingSectionProps {
  /** ETS 2026 section (preferred). */
  section?:       TOEFLSpeakingSection;
  /** Legacy Independent Speaking prompts. Used when `section` is absent. */
  sectionLegacy?: TOEFLSpeakingPrompt[];
  teacherId:  string;
  /** Groups uploaded audios in Storage under a stable id (session or assignment). */
  sessionId:  string;
  onDone:     (recordings: SpeakingRecording[]) => void;
  initial?:   { outerIdx: number; recordings?: SpeakingRecording[] };
  onSnapshot?: (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
  /** Copy shown while uploading the final task's audio. The default mentions
   *  auto AI grading, which is only true in the live full-mock flow. */
  finalTaskSavingMessage?: string;
}

/** Build a normalised item list from either the 2026 section or the legacy
 *  prompts. Legacy prompts are treated as Interview-style items so the flow
 *  stays consistent (no prep, just listen → speak). */
function itemsFor(section?: TOEFLSpeakingSection, legacy?: TOEFLSpeakingPrompt[]): {
  items: TOEFLSpeakingItem[];
  interviewTopic: string | null;
  interviewIntro: string | null;
  firstInterviewIndex: number;
} {
  if (section) {
    return {
      items: speakingSectionItems(section),
      interviewTopic: section.interviewTopic,
      interviewIntro: section.interviewIntro,
      firstInterviewIndex: section.listenAndRepeat.length,
    };
  }
  const legacyItems: TOEFLSpeakingItem[] = (legacy ?? []).map((p) => ({
    id:       p.id,
    type:     'take-an-interview',
    question: p.prompt,
    speakSec: p.speakSec,
  }));
  return {
    items: legacyItems,
    interviewTopic: null,
    interviewIntro: null,
    firstInterviewIndex: 0,
  };
}

/** Wraps SpeechSynthesis.speak in a promise that resolves when playback ends
 *  (or immediately if TTS isn't available). Cancels any in-flight utterance
 *  first so switching items mid-speech doesn't queue up leftovers. */
function speakUtterance(text: string, opts?: { rate?: number; pitch?: number }): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'en-US';
    u.rate  = opts?.rate ?? 0.95;
    u.pitch = opts?.pitch ?? 1;
    u.onend   = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function SpeakingSection({
  section, sectionLegacy, teacherId, sessionId, onDone, initial, onSnapshot,
  finalTaskSavingMessage,
}: SpeakingSectionProps) {
  const { items, interviewTopic, interviewIntro, firstInterviewIndex } =
    itemsFor(section, sectionLegacy);

  const [pIdx, setPIdx] = useState(initial?.outerIdx ?? 0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [recordings, setRecordings] = useState<SpeakingRecording[]>(initial?.recordings ?? []);
  const [error, setError] = useState('');
  const [micStatus, setMicStatus] = useState<MicStatus>('unknown');
  /** True while the student is looking at the "Interview intro" card that
   *  appears once, right before the first TI item. */
  const [interviewIntroPending, setInterviewIntroPending] = useState(
    !!interviewIntro && pIdx === firstInterviewIndex,
  );

  const chunks = useRef<Blob[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const item = items[pIdx];
  const isLR = item?.type === 'listen-and-repeat';
  const recordSec = item
    ? (item.type === 'listen-and-repeat' ? item.recordSec : item.speakSec)
    : 0;

  const speakLeft = useCountdown(recordSec, phase === 'speak', () => stopSpeaking());

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

  // Cancel any in-flight TTS if the student unmounts / navigates away.
  useEffect(() => {
    return () => {
      try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    };
  }, []);

  async function startPromptPlayback() {
    if (!item) return;
    setError('');
    setPhase('playing');
    const text = item.type === 'listen-and-repeat' ? item.targetSentence : item.question;
    await speakUtterance(text);
    // Auto-arm the recorder as soon as the prompt finishes speaking.
    startRecording();
  }

  async function startRecording() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
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
      setPhase('speak');
    } catch (err) {
      console.error('[speaking] mic error:', err);
      setError('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
      setPhase('intro');
      setMicStatus('denied');
    }
  }

  async function stopSpeaking() {
    if (!recorder.current || !item) { setPhase('saving'); return; }
    setPhase('saving');
    await new Promise<void>((resolve) => {
      const rec = recorder.current!;
      rec.onstop = () => resolve();
      rec.stop();
    });
    stream.current?.getTracks().forEach(t => t.stop());
    const recMime = recorder.current!.mimeType || 'audio/webm';
    const bareMime = recMime.split(';')[0].trim() || 'audio/webm';
    const blob = new Blob(chunks.current, { type: recMime });
    if (blob.size === 0) {
      console.error('[speaking] empty recording — no audio chunks');
      setError('La grabación quedó vacía. Revisa el micrófono y prueba de nuevo.');
      setPhase('speak');
      return;
    }
    const ext = bareMime.includes('mp4') ? 'mp4' : bareMime.includes('wav') ? 'wav' : 'webm';
    const path = `audio/toefl-speaking/${teacherId}/${sessionId}/${item.id}-${Date.now()}.${ext}`;
    try {
      const sref = storageRef(storage, path);
      await uploadBytes(sref, blob, { contentType: bareMime });
      const url = await getDownloadURL(sref);
      const rec: SpeakingRecording = {
        promptId:    item.id,
        taskType:    item.type,
        storagePath: path,
        audioUrl:    url,
        durationSec: recordSec - speakLeft,
      };
      advanceTo(rec);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? 'unknown';
      const msg  = err instanceof Error ? err.message : String(err);
      const server = (err as { serverResponse?: string })?.serverResponse ?? '';
      console.error('[speaking] upload error:', { code, msg, server, path });
      setError(`Error subiendo audio (${code}). ${server.slice(0, 80)}`);
      setPhase('speak');
    }
  }

  function skip() {
    if (!item) return;
    const placeholder: SpeakingRecording = {
      promptId:    item.id,
      taskType:    item.type,
      storagePath: '',
      audioUrl:    '',
      durationSec: 0,
    };
    advanceTo(placeholder);
  }

  function advanceTo(rec: SpeakingRecording) {
    const next = [...recordings, rec];
    setRecordings(next);
    setError('');
    if (pIdx < items.length - 1) {
      const nextIdx = pIdx + 1;
      setPIdx(nextIdx);
      // Show the interview-intro card exactly once, right before the first TI item.
      if (interviewIntro && nextIdx === firstInterviewIndex) {
        setInterviewIntroPending(true);
      }
      setPhase('intro');
    } else {
      onDone(next);
    }
  }

  if (!item) {
    return (
      <div className="w-full max-w-2xl">
        <BrandCard>
          <p className="text-sm text-[#5A3D7A]/70 text-center py-8">
            Sin tasks disponibles en esta sección.
          </p>
        </BrandCard>
      </div>
    );
  }

  const doneIds = new Set(recordings.map(r => r.promptId));
  const finalMsg = finalTaskSavingMessage ?? 'Última task. Al terminar arranca la calificación con AI (~1-2 min).';
  const totalItems = items.length;
  const humanTaskNumber = pIdx + 1;

  // Interview-intro overlay: shown ONCE, right before the first Take-an-Interview
  // item. It gives the student the topic + the "interviewer" opening line.
  if (interviewIntroPending && interviewIntro) {
    return (
      <div className="w-full max-w-2xl space-y-4">
        <TaskRibbon
          eyebrow={`TOEFL · Speaking · Interview intro`}
          emoji="🎙️"
          title={`Topic: ${interviewTopic ?? ''}`}
          subtitle="4 preguntas · 45s cada una · sin preparación"
        />
        <BrandCard>
          <div
            className="rounded-2xl p-4 mb-4"
            style={{
              background: `linear-gradient(135deg, ${B.lavenderBg} 0%, #E8DBFF 100%)`,
              border:     `1px solid ${B.purpleMed}33`,
            }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: B.gold }}>
              Interviewer
            </p>
            <p className="text-[15px] leading-relaxed" style={{ color: B.purpleDeep }}>
              &ldquo;{interviewIntro}&rdquo;
            </p>
          </div>
          <p className="text-[12px] text-gray-600 text-center mb-4">
            Vas a escuchar 4 preguntas seguidas sobre el mismo tema. Después de cada pregunta,
            arranca tu tiempo de <strong style={{ color: B.purple }}>45 segundos</strong> — sin preparación.
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={async () => { await speakUtterance(interviewIntro); }}
              className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl transition-colors"
              style={{
                background: 'transparent',
                border:     `1.5px solid ${B.purpleMed}`,
                color:      B.purple,
              }}
            >
              🔊 Escuchar intro
            </button>
            <SubmitButton onClick={() => setInterviewIntroPending(false)}>
              Empezar interview →
            </SubmitButton>
          </div>
        </BrandCard>
      </div>
    );
  }

  // Compact section eyebrow that changes with the task type.
  const eyebrow = isLR
    ? `TOEFL · Speaking · Listen & Repeat · ${humanTaskNumber}/${totalItems}`
    : `TOEFL · Speaking · Interview · ${humanTaskNumber}/${totalItems}`;

  return (
    <div className="w-full max-w-2xl space-y-4">
      <TaskRibbon
        eyebrow={eyebrow}
        emoji={isLR ? '🔁' : '🎤'}
        title={
          phase === 'intro'   ? (isLR ? 'Escucha la frase y repítela exactamente.' : 'Escucha la pregunta, luego responde.')
          : phase === 'playing' ? (isLR ? 'Escuchando frase…' : 'Escuchando pregunta…')
          : phase === 'speak'   ? (isLR ? 'Repite ahora — habla claro.' : 'Responde — 45s para tu idea.')
                                : 'Guardando tu grabación…'
        }
        subtitle={isLR ? `Ventana de grabación · ${recordSec}s` : '45s de respuesta · sin prep'}
        right={
          <div className="flex gap-1.5 flex-wrap justify-end max-w-[220px]">
            {items.map((it, i) => {
              const done = doneIds.has(it.id);
              const active = i === pIdx;
              return (
                <span
                  key={it.id}
                  title={`${it.type === 'listen-and-repeat' ? 'LR' : 'Interview'} · task ${i + 1}${done ? ' · grabada' : active ? ' · actual' : ' · pendiente'}`}
                  className="w-5 h-5 rounded text-[9px] font-black flex items-center justify-center"
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
        {/* Task-context card — shows the ETS-visible framing */}
        <div
          className="rounded-2xl p-4 mb-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${B.lavenderBg} 0%, #E8DBFF 100%)`,
            border:     `1px solid ${B.purpleMed}33`,
          }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: B.gold }}>
            {isLR ? 'Listen & Repeat' : `Interview · ${interviewTopic ?? 'question'}`}
          </p>
          {isLR
            ? (
              <p className="text-[13px] text-[#5A3D7A]/80 leading-relaxed italic">
                Vas a escuchar una frase. Repítela exactamente como la oíste, con la misma pronunciación.
              </p>
            )
            : (
              <p className="text-[15px] leading-relaxed" style={{ color: B.purpleDeep }}>
                &ldquo;{item.type === 'take-an-interview' ? item.question : ''}&rdquo;
              </p>
            )
          }
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
              {micStatus === 'denied'      && '⚠ Micrófono bloqueado. Habilita permisos y recarga.'}
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

        {phase === 'intro' && (
          <div className="text-center space-y-4 py-2">
            <p className="text-[12px] text-gray-600">
              {isLR
                ? <>Toca &ldquo;Escuchar frase&rdquo;. Cuando termine, tendrás <strong style={{ color: B.purple }}>{recordSec}s</strong> para repetirla.</>
                : <>Toca &ldquo;Escuchar pregunta&rdquo;. Cuando termine, tendrás <strong style={{ color: B.purple }}>{recordSec}s</strong> para responder.</>
              }
            </p>
            <SubmitButton onClick={startPromptPlayback} disabled={micStatus !== 'ok'}>
              🔊 {isLR ? 'Escuchar frase' : 'Escuchar pregunta'}
            </SubmitButton>
            {recordings.length > 0 && (
              <p className="text-[10px] text-gray-400">
                {recordings.length} de {totalItems} tasks completadas.
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

        {phase === 'playing' && (
          <div className="text-center py-8 space-y-3">
            <div className="inline-flex items-center justify-center gap-2">
              <span className="w-2 h-6 rounded-full animate-pulse" style={{ background: B.purpleMed }} />
              <span className="w-2 h-8 rounded-full animate-pulse" style={{ background: B.purple, animationDelay: '150ms' }} />
              <span className="w-2 h-4 rounded-full animate-pulse" style={{ background: B.purpleMed, animationDelay: '300ms' }} />
              <span className="w-2 h-10 rounded-full animate-pulse" style={{ background: B.purpleDeep, animationDelay: '450ms' }} />
              <span className="w-2 h-6 rounded-full animate-pulse" style={{ background: B.purpleMed, animationDelay: '600ms' }} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em]" style={{ color: B.purpleMed }}>
              {isLR ? 'Escuchando frase' : 'Escuchando pregunta'}
            </p>
            <p className="text-[12px] text-gray-500">La grabación arranca automáticamente al terminar.</p>
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
                  background: `conic-gradient(#EF4444 ${(speakLeft / Math.max(1, recordSec)) * 360}deg, #FEE2E2 0deg)`,
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
            <p className="text-[12px] text-gray-500">
              {isLR ? 'Repite la frase exacta que escuchaste.' : 'Se corta sola al llegar a 0.'}
            </p>
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
              {pIdx < items.length - 1
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
