// Friendlistenings® — student index (catalog of lessons the student can open).

'use client';
import Link from 'next/link';
import { ArrowRight, Clock, Headphones } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { FRIENDLISTENINGS_LESSONS } from '@/lib/data/friendlistenings';
import type { FLLesson } from '@/types/friendlistenings';

const LEVEL_TONE: Record<string, string> = {
  A1: '#7ED6E0', A2: '#7BC67E', B1: '#F4A261',
  B1plus: '#F4A261', B2: '#9B72B8', C1: '#E87BAD', C2: '#4A2060',
};

export default function FriendlisteningsStudentIndex() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E8D8F5] to-[#FFFDF5] text-[#2E2A33]">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-16">
        <TopBar
          title="Friendlistenings®"
          subtitle="Lecciones completas construidas alrededor de un audio real. Escuchá, notá, practicá, hablá."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Friendlistenings' },
          ]}
        />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {FRIENDLISTENINGS_LESSONS.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>

        {FRIENDLISTENINGS_LESSONS.length === 0 && (
          <p className="text-center text-sm text-[#7A7387] mt-20">
            Todavía no hay lessons publicadas.
          </p>
        )}
      </div>
    </div>
  );
}

function LessonCard({ lesson }: { lesson: FLLesson }) {
  const tone = LEVEL_TONE[lesson.level] ?? '#9B72B8';
  return (
    <Link
      href={`/dashboard/student/listenings/${lesson.id}`}
      className="group relative bg-white rounded-3xl border border-white shadow-[0_10px_30px_-16px_rgba(74,32,96,0.25)] hover:shadow-[0_18px_42px_-18px_rgba(74,32,96,0.35)] hover:-translate-y-0.5 transition-all p-6 flex gap-5 items-center overflow-hidden"
      style={{ borderTop: `4px solid ${tone}` }}
    >
      {/* Emoji / cover */}
      <div
        className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
        style={{ background: tone + '22', color: tone }}
      >
        {lesson.cover.emoji ?? '🎧'}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black tracking-wider text-white"
            style={{ background: tone }}
          >
            {lesson.level}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#7A7387]">
            <Clock className="w-3 h-3" strokeWidth={2.5} />
            {lesson.estimatedMin} min
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#7A7387]">
            <Headphones className="w-3 h-3" strokeWidth={2.5} />
            {Math.round(lesson.audio.durationSec / 60)}:{String(lesson.audio.durationSec % 60).padStart(2, '0')}
          </span>
        </div>
        <h3 className="font-serif text-xl md:text-2xl font-bold text-[#2E2A33] leading-tight">
          {lesson.title}
        </h3>
        <p className="text-sm text-[#7A7387] truncate">{lesson.subtitle}</p>
      </div>

      <ArrowRight className="flex-shrink-0 w-5 h-5 text-[#9B72B8] group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
    </Link>
  );
}
