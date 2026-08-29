// FriendlyTeaching.cl — OACI Vocabulary · class runner
//
// Renderiza una clase OACI (Slide[]) reusando el sistema de slides de
// la app. La clase vive en /src/lib/data/icao/vocabulary/ como código
// (no Firestore), así que sintetizamos un Lesson en memoria para
// alimentar SlideViewer sin tocar la colección `lessons`.
//
// El slide de listening ('radio-exchange') empieza sin audioUrl. Arriba
// del viewer aparece un panel para generar el diálogo con ElevenLabs
// (endpoint /api/tts/elevenlabs-dialogue), subirlo a Firebase Storage
// y persistir el (teacherId, classId) → audioUrl en Firestore. Una vez
// generado el audio se hidrata sobre la slide correspondiente.

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { getIcaoVocabClass } from '@/lib/data/icao/vocabulary';
import { voiceIdForRole } from '@/lib/data/icao/voices';
import { saveIcaoClassAudio, getIcaoClassAudio, deleteIcaoClassAudio } from '@/lib/data/icao/audioStore';
import SlideViewer from '@/components/classroom/SlideViewer';
import TopBar from '@/components/layout/TopBar';
import type { Lesson, Slide, LessonLevel } from '@/types/firebase';

type Phase = 'loading' | 'ready' | 'error';

export default function IcaoVocabClassRunner() {
  const params = useParams<{ classId: string }>();
  const router = useRouter();
  const classId = params?.classId ?? '';
  const cls = useMemo(() => getIcaoVocabClass(classId), [classId]);

  const [teacherId, setTeacherId] = useState<string>('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState<string>('');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const audioLoadOnce = useRef<string | null>(null);  // key `${teacherId}_${classId}` para no re-loadear

  // ── Auth subscribe (directo a onAuthStateChanged para evitar el bug
  //    de hydration del authStore).
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setTeacherId(u?.uid ?? '');
    });
    return () => unsub();
  }, []);

  // ── Hidratar audio persistido (una vez por (teacher, class)).
  useEffect(() => {
    if (!cls) { setPhase('error'); return; }
    if (!teacherId) return;
    const key = `${teacherId}_${classId}`;
    if (audioLoadOnce.current === key) return;
    audioLoadOnce.current = key;
    (async () => {
      try {
        const url = await getIcaoClassAudio(teacherId, classId);
        if (url) setAudioUrl(url);
      } catch (err) {
        console.warn('[icao-vocab] failed to hydrate audio binding:', err);
      } finally {
        setPhase('ready');
      }
    })();
  }, [cls, teacherId, classId]);

  async function handleGenerateAudio() {
    if (!cls || cls.dialogueSegments.length === 0) return;
    setGenerateError(null);
    setGenerateProgress('Preparando segmentos…');
    setGenerating(true);
    try {
      const segments = cls.dialogueSegments.map(s => ({
        voiceId: voiceIdForRole(s.speakerRole),
        text:    s.text,
      }));
      setGenerateProgress(`Generando con ElevenLabs (${segments.length} líneas · puede tomar 30–60s)…`);
      const res = await fetch('/api/tts/elevenlabs-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();

      setGenerateProgress('Subiendo a Firebase Storage…');
      const path = `audio/icao-${classId}-${teacherId}-${Date.now()}.mp3`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, blob, { contentType: 'audio/mpeg' });
      const url = await getDownloadURL(ref);

      setGenerateProgress('Guardando binding…');
      await saveIcaoClassAudio({ teacherId, classId, audioUrl: url });
      setAudioUrl(url);
      setGenerateProgress('');
    } catch (err) {
      console.error('[icao-vocab] generate audio failed:', err);
      setGenerateError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleClearAudio() {
    if (!confirm('¿Borrar el audio generado? Podés regenerarlo (consume tokens de ElevenLabs otra vez).')) return;
    setAudioUrl('');
    try {
      await deleteIcaoClassAudio(teacherId, classId);
    } catch (err) {
      console.warn('[icao-vocab] failed to delete audio binding:', err);
    }
  }

  // ── Sintetizar Lesson en memoria, hidratando audioUrl en la slide
  //    'radio-exchange' si ya lo tenemos.
  const lesson: Lesson | null = useMemo(() => {
    if (!cls) return null;
    const hydratedSlides: Slide[] = cls.slides.map(s =>
      s.id === 'radio-exchange' && audioUrl
        ? { ...s, audioUrl }
        : s,
    );
    return {
      id: `icao-${cls.id}`,
      teacherId,
      courseId: 'icao-vocabulary',
      unit: 2,
      lessonNumber: cls.classNumber,
      code: `OACI.V${cls.classNumber}`,
      title: cls.title,
      level: cls.cefrEquivalent as LessonLevel,
      duration: cls.durationMinutes,
      slides: hydratedSlides,
      objectives: [cls.focus],
    };
  }, [cls, audioUrl, teacherId]);

  // ── Estados de carga / error.
  if (!cls) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar title="Clase no encontrada" />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-6xl mb-3">🛫</p>
          <h1 className="text-2xl font-bold text-[#2D1B4E]">Clase no encontrada</h1>
          <p className="text-gray-600 mt-2">
            El id <code className="bg-gray-100 px-1.5 py-0.5 rounded">{classId}</code> no coincide con ninguna clase registrada.
          </p>
          <Link
            href="/dashboard/teacher/icao"
            className="inline-block mt-6 px-5 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold"
          >
            ← Volver al programa OACI
          </Link>
        </div>
      </div>
    );
  }

  if (cls.slides.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar title={cls?.title ?? 'OACI Class'} />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-6xl mb-3">🚧</p>
          <h1 className="text-2xl font-bold text-[#2D1B4E]">{cls.title}</h1>
          <p className="text-gray-600 mt-2">Esta clase todavía no está desarrollada.</p>
          <Link
            href="/dashboard/teacher/icao"
            className="inline-block mt-6 px-5 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold"
          >
            ← Volver al programa OACI
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'loading' || !lesson) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <span className="inline-block w-6 h-6 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 mt-3">Cargando clase…</p>
        </div>
      </div>
    );
  }

  const hasAudio = audioUrl.length > 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar title={cls?.title ?? 'OACI Class'} />

      {/* Class metadata banner */}
      <div className="border-b border-[#E8D5F0] bg-gradient-to-r from-[#F9F5FF] to-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/dashboard/teacher/icao" className="text-[11px] font-semibold text-[#5A3D7A]/70 hover:text-[#5A3D7A]">
            ← OACI Programme
          </Link>
          <span className="text-gray-300">|</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">
              Etapa 2 · Vocabulary · Class {cls.classNumber}
            </p>
            <p className="text-sm font-bold text-[#2D1B4E]">
              {cls.title} <span className="text-gray-400 font-normal">— {cls.subtitle}</span>
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#5A3D7A] bg-white border border-[#C8A8DC] rounded-full px-2 py-0.5">
            OACI 4 · CEFR {cls.cefrEquivalent} · {cls.durationMinutes} min
          </span>
        </div>
      </div>

      {/* Audio generation panel (only if class has a radio exchange) */}
      {cls.dialogueSegments.length > 0 && (
        <div className="border-b border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3">
            {hasAudio ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  ✓ Radio exchange audio listo
                </span>
                <span className="text-xs text-gray-500 truncate flex-1 min-w-0 font-mono">
                  {audioUrl}
                </span>
                <button
                  onClick={handleClearAudio}
                  className="text-[11px] font-semibold text-[#5A3D7A]/70 hover:text-[#5A3D7A] underline"
                >
                  🔄 Regenerar
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-[#F9F5FF] border border-[#C8A8DC] p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#5A3D7A]">
                    🎙 Audio de radio exchange
                  </p>
                  <p className="text-xs text-[#5A3D7A]/80 mt-0.5">
                    Genera el diálogo completo ({cls.dialogueSegments.length} líneas · ATC + pilots) con ElevenLabs.
                    Se guarda una vez y no lo vas a tener que regenerar.
                  </p>
                  {generateError && (
                    <p className="text-[10px] text-red-500 mt-1">ElevenLabs: {generateError}</p>
                  )}
                </div>
                <button
                  onClick={handleGenerateAudio}
                  disabled={generating || !teacherId}
                  className="px-4 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-xs font-bold shadow hover:shadow-lg disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {generating ? (generateProgress || 'Generando…') : '🎙 Generar audio'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide viewer */}
      <div className="flex-1 min-h-0">
        <SlideViewer lesson={lesson} onComplete={() => router.push('/dashboard/teacher/icao')} />
      </div>
    </div>
  );
}
