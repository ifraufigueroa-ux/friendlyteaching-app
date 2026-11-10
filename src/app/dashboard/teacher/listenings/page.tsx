// Friendlistenings® — teacher catalog.
//
// Lists every published Friendlistenings lesson with its target chunks,
// opens the student runner in a new tab for preview, and — the piece this
// screen owns — generates the shared audio for each lesson via ElevenLabs.
// The generated URL is written to Firestore so every student loads the same
// MP3 instead of each teacher paying for their own.

'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Clock, Headphones, Sparkles,
  Mic, CheckCircle2, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import { FRIENDLISTENINGS_LESSONS } from '@/lib/data/friendlistenings';
import {
  loadFriendlisteningsAudio, saveFriendlisteningsAudio,
} from '@/lib/friendlistenings/audioStore';
import type { FLLesson, FLStepLanguageAwareness } from '@/types/friendlistenings';

const LEVEL_TONE: Record<string, string> = {
  A1: '#7ED6E0', A2: '#7BC67E', B1: '#F4A261',
  B2: '#9B72B8', C1: '#E87BAD', C2: '#4A2060',
};

export default function FriendlisteningsTeacherIndex() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E8D8F5] to-[#FFFDF5] text-[#2E2A33]">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-16">
        <TopBar
          title="Friendlistenings®"
          subtitle="CLT listening lessons. Lead-in → vocab → prediction → gist → detail → language → practice → production."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Friendlistenings' },
          ]}
        />

        <div className="mt-10 space-y-5">
          {FRIENDLISTENINGS_LESSONS.map(lesson => (
            <TeacherLessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>

        {FRIENDLISTENINGS_LESSONS.length === 0 && (
          <p className="text-center text-sm text-[#7A7387] mt-20">
            No lessons published yet.
          </p>
        )}
      </div>
    </div>
  );
}

function TeacherLessonCard({ lesson }: { lesson: FLLesson }) {
  const tone = LEVEL_TONE[lesson.level] ?? '#9B72B8';
  const awareness = lesson.steps.find(s => s.kind === 'language-awareness') as FLStepLanguageAwareness | undefined;
  const [audioUrl, setAudioUrl] = useState<string | null>(lesson.audio.audioUrl ?? null);

  // Load any audio that's already been generated for this lesson.
  useEffect(() => {
    let alive = true;
    loadFriendlisteningsAudio(lesson.id).then(url => {
      if (alive && url) setAudioUrl(url);
    });
    return () => { alive = false; };
  }, [lesson.id]);

  return (
    <div
      className="bg-white rounded-3xl border border-white shadow-[0_10px_30px_-16px_rgba(74,32,96,0.25)] p-6"
      style={{ borderTop: `4px solid ${tone}` }}
    >
      <div className="flex gap-5">
        <div
          className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{ background: tone + '22', color: tone }}
        >
          {lesson.cover.emoji ?? '🎧'}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black tracking-wider text-white" style={{ background: tone }}>
              {lesson.level}
            </span>
            <span className="text-[11px] text-[#7A7387] inline-flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={2.5} /> {lesson.estimatedMin} min
            </span>
            <span className="text-[11px] text-[#7A7387] inline-flex items-center gap-1">
              <Headphones className="w-3 h-3" strokeWidth={2.5} /> {Math.round(lesson.audio.durationSec / 60)}:{String(lesson.audio.durationSec % 60).padStart(2, '0')}
            </span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#2E2A33] leading-tight">
            {lesson.title}
            <span className="text-[#9B72B8] font-normal text-base ml-2">· {lesson.subtitle}</span>
          </h3>
          <p className="text-sm text-[#7A7387]">{lesson.scenario}</p>

          {awareness && awareness.chunks.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9B72B8] mb-1.5 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" strokeWidth={2.5} /> Target chunks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {awareness.chunks.map(c => (
                  <span key={c.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FBE7F1] text-[#4A2060] border border-[#E8D8F5]">
                    {c.chunk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Audio panel — generate or play */}
          <AudioPanel lesson={lesson} audioUrl={audioUrl} onGenerated={setAudioUrl} />

          <div className="pt-1 flex items-center gap-3">
            <Link
              href={`/dashboard/student/listenings/${lesson.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider text-white shadow-sm active:scale-95 transition-all"
              style={{ background: tone }}
            >
              Preview <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <span className="text-[11px] text-[#7A7387]">8 steps · audio {audioUrl ? 'ready' : 'pending'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Audio generation panel ──────────────────────────────────

function AudioPanel({ lesson, audioUrl, onGenerated }: {
  lesson:      FLLesson;
  audioUrl:    string | null;
  onGenerated: (url: string) => void;
}) {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, u => setTeacherId(u?.uid ?? null));
  }, []);

  const handleGenerate = useCallback(async () => {
    setError(null);
    if (!teacherId) { setError('You need to be signed in to generate audio.'); return; }

    // Build (voiceId, text) segments from the script + speakers.
    const byId = new Map(lesson.audio.speakers.map(s => [s.id, s]));
    const segments = lesson.audio.script.map(line => ({
      voiceId: byId.get(line.speakerId)?.suggestedVoice.voiceId ?? '',
      text:    line.text,
    }));
    const missing = segments.find(s => !s.voiceId || s.voiceId === 'TBD');
    if (missing) {
      setError('One of the speakers is missing a voiceId. Fix the lesson data.');
      return;
    }

    setGenerating(true);
    try {
      setProgress(`Generating with ElevenLabs (${segments.length} lines · may take 30–60s)…`);
      const res = await fetch('/api/tts/elevenlabs-dialogue', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ segments }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError('ElevenLabs: ' + (data.error ?? `HTTP ${res.status}`));
        return;
      }
      const blob = await res.blob();

      setProgress('Uploading to Firebase Storage…');
      const path = `audio/friendlistenings-${lesson.id}-${Date.now()}.mp3`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, blob, { contentType: 'audio/mpeg' });
      const url = await getDownloadURL(ref);

      setProgress('Saving binding…');
      await saveFriendlisteningsAudio({
        lessonId: lesson.id,
        audioUrl: url,
        source:   'generated',
        teacherId,
      });
      onGenerated(url);
      setProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }, [lesson, teacherId, onGenerated]);

  // Already generated — show a small preview + regenerate affordance.
  if (audioUrl) {
    return (
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#2F6B33]">
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Audio ready — students hear this file.
        </div>
        <audio controls className="w-full" src={audioUrl} preload="metadata" />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7A7387] hover:text-[#4A2060] disabled:opacity-50"
          title="Regenerate — this will spend ElevenLabs tokens again"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
          {generating ? (progress || 'Regenerating…') : 'Regenerate audio'}
        </button>
        {error && <p className="text-[11px] text-[#B23A5E] inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
      </div>
    );
  }

  // No audio yet — big CTA.
  return (
    <div className="pt-2">
      <div className="bg-gradient-to-br from-[#F9F5FF] to-[#F0E5FF] border border-[#C8A8DC] rounded-xl p-3 space-y-2">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
          🎙 Audio not generated yet
        </p>
        <p className="text-[11px] text-[#5A3D7A]/80 leading-snug">
          Generates the full dialogue ({lesson.audio.script.length} lines · {lesson.audio.speakers.length} voices) in one click and shares it with every student who opens this lesson.
        </p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="w-full inline-flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-xs font-bold shadow hover:shadow-lg disabled:opacity-50 transition-all"
        >
          <Mic className="w-4 h-4" strokeWidth={2.5} />
          {generating ? (progress || 'Generating…') : 'Generate audio with ElevenLabs'}
        </button>
        {error && <p className="text-[11px] text-[#B23A5E] inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
      </div>
    </div>
  );
}
