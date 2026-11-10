// Friendlistenings® — teacher catalog.
//
// Phase 1 view: list of lessons with level + topic + chunk preview so
// the teacher can pick what to assign / use in class. Clicking a card
// opens the student runner in a new tab so the teacher sees exactly
// what the student sees. Edit + assign flows ship in a follow-up.

'use client';
import Link from 'next/link';
import { ArrowRight, Clock, Headphones, Sparkles } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { FRIENDLISTENINGS_LESSONS } from '@/lib/data/friendlistenings';
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
          subtitle="Lecciones CLT de listening. Lead-in → vocab → predicción → gist → detalle → lenguaje → práctica guiada → producción."
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
            No hay lessons publicadas aún.
          </p>
        )}
      </div>
    </div>
  );
}

function TeacherLessonCard({ lesson }: { lesson: FLLesson }) {
  const tone = LEVEL_TONE[lesson.level] ?? '#9B72B8';
  const awareness = lesson.steps.find(s => s.kind === 'language-awareness') as FLStepLanguageAwareness | undefined;

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

          <div className="pt-3 flex items-center gap-3">
            <Link
              href={`/dashboard/student/listenings/${lesson.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider text-white shadow-sm active:scale-95 transition-all"
              style={{ background: tone }}
            >
              Previsualizar <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <span className="text-[11px] text-[#7A7387]">8 pasos · audio {lesson.audio.audioUrl ? 'listo' : 'pendiente'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
