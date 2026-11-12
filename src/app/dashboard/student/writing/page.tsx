// FriendlyWriting® — student catalog.
//
// Editorial-feel landing that previews the lesson's cover, level, estimated
// time, grammar focus and the IELTS task it builds towards. Scaffolded
// toward IELTS Writing but usable as a standalone CLT writing lesson.

'use client';
import Link from 'next/link';
import { ArrowRight, Clock, PenLine, Target } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { FRIENDLYWRITING_LESSONS } from '@/lib/data/friendlywriting';
import type { FWLesson, FWTaskType } from '@/types/friendlywriting';

const TASK_LABEL: Record<FWTaskType, string> = {
  'ielts-gt-t1-letter-informal':   'IELTS GT · Informal letter',
  'ielts-gt-t1-letter-semiformal': 'IELTS GT · Semi-formal letter',
  'ielts-gt-t1-letter-formal':     'IELTS GT · Formal letter',
  'ielts-ac-t1-report':            'IELTS Academic · Report',
  'ielts-t2-essay':                'IELTS Task 2 · Essay',
};

export default function FriendlywritingStudentCatalog() {
  return (
    <div className="relative min-h-screen bg-[#FFFDF5] text-[#2E2A33]">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-16">
        <TopBar
          title="FriendlyWriting®"
          subtitle="Scaffolded writing lessons that build toward IELTS — one structure at a time."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'FriendlyWriting' },
          ]}
        />

        {/* Hero intro */}
        <div className="mt-8 flex flex-col md:flex-row gap-6 items-start">
          <div
            className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center text-5xl md:text-6xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7ECBF2, #9B72B8)' }}
          >
            ✍️
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#7A7387] mb-2">Writing, scaffolded</p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#2E2A33] leading-tight mb-2">
              One short piece per class.<br className="hidden md:block" /> One structure to own.
            </h1>
            <p className="text-sm md:text-base text-[#7A7387] leading-relaxed max-w-xl">
              Each lesson walks you through opening the class, pre-teaching the chunks, brainstorming your
              ideas, reading an annotated model, writing your own piece, and submitting it for your
              teacher to review next class.
            </p>
          </div>
        </div>

        {/* Lessons */}
        <div className="mt-12 space-y-5">
          {FRIENDLYWRITING_LESSONS.map(lesson => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
        </div>

        {FRIENDLYWRITING_LESSONS.length === 0 && (
          <p className="text-center text-sm text-[#7A7387] mt-20">No lessons published yet.</p>
        )}
      </div>
    </div>
  );
}

function LessonRow({ lesson }: { lesson: FWLesson }) {
  const from = lesson.cover.palette?.from ?? lesson.cover.accent;
  const to   = lesson.cover.palette?.to   ?? lesson.cover.accent;
  return (
    <Link
      href={`/dashboard/student/writing/${lesson.id}`}
      className="group block bg-white rounded-3xl border border-black/5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Cover */}
        <div
          className="md:w-56 flex-shrink-0 p-7 md:p-8 text-white flex md:flex-col justify-between relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div>
            <span className="inline-block text-[11px] font-black tracking-widest text-white/80 mb-3">
              {lesson.level}
            </span>
            <div className="text-5xl md:text-6xl">{lesson.cover.emoji ?? '✍️'}</div>
          </div>
          <div className="mt-6 md:mt-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Builds toward</p>
            <p className="text-sm font-semibold text-white/95 leading-tight mt-0.5">
              {TASK_LABEL[lesson.taskType]}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 md:p-7 flex flex-col">
          <div className="flex items-center gap-2 text-[11px] text-[#7A7387] mb-2">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={2.5} /> {lesson.estimatedMin} min
            </span>
            <span className="text-[#C3BDCA]">·</span>
            <span className="inline-flex items-center gap-1">
              <PenLine className="w-3 h-3" strokeWidth={2.5} /> 6 steps
            </span>
          </div>
          <h3 className="font-serif text-2xl md:text-[26px] text-[#2E2A33] leading-tight">{lesson.title}</h3>
          <p className="text-sm text-[#7A7387] mt-1">{lesson.subtitle}</p>

          {/* Grammar focus chips */}
          {lesson.tags && lesson.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {lesson.tags.slice(0, 4).map(t => (
                <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-[#2E2A33]" style={{ background: `${lesson.cover.accent}18` }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#2E2A33] group-hover:gap-3 transition-all">
              <span style={{ color: lesson.cover.accent }}>Start lesson</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} style={{ color: lesson.cover.accent }} />
            </span>
            <Target className="w-5 h-5 text-[#C3BDCA]" strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  );
}
