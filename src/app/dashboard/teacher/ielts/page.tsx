// FriendlyTeaching.cl — IELTS Simulator (unified chooser)
//
// Two-step chooser that funnels into one of the existing section/level
// pages. Step 1 picks exam type (General Training vs Academic). Step 2
// picks level (Beginners A2 / Intermediate B1-B2 / Upper-Intermediate B2
// / Advanced B2+-C1 / Full Mock).
//
// Mapping to existing routes:
//   GT · Full                 → /dashboard/teacher/ielts/mock
//   GT · Beginners A2         → /dashboard/teacher/ielts-beginners
//   GT · Intermediate B1-B2   → /dashboard/teacher/ielts-intermediate
//   GT · Upper-Int B2         → /dashboard/teacher/ielts-upper-intermediate
//   GT · Advanced B2+-C1      → /dashboard/teacher/ielts-advanced
//
//   Academic · Listening      → /dashboard/teacher/ielts/listening
//     (listening content is identical across GT and Academic — official)
//   Academic · Reading/Writing/Speaking → coming soon
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Hourglass, Headphones, Sparkles } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';

type ExamType = 'gt' | 'academic';

interface LevelOption {
  id:       string;
  label:    string;
  cefr:     string;
  tagline:  string;
  href:     string | null;      // null → coming soon
  comingSoon?: boolean;
  highlight?: boolean;          // featured on the first row
  note?:    string;             // extra line under the card (e.g. "shared with GT")
}

const GT_LEVELS: LevelOption[] = [
  {
    id:        'full',
    label:     'Full Mock',
    cefr:      'B1 – C1',
    tagline:   'The complete real-exam experience: Listening + Reading + Writing + Speaking in official order.',
    href:      '/dashboard/teacher/ielts/mock',
    highlight: true,
  },
  {
    id:        'beginners',
    label:     'Beginners',
    cefr:      'A2',
    tagline:   'Short audio (~2 min/section), 0.85× speed, simple vocabulary. For students just meeting the exam.',
    href:      '/dashboard/teacher/ielts-beginners',
  },
  {
    id:        'intermediate',
    label:     'Intermediate',
    cefr:      'B1 – B2',
    tagline:   '32 questions, ~3 min audio per section, 0.95× speed. The bridge between Beginners and the full mock.',
    href:      '/dashboard/teacher/ielts-intermediate',
  },
  {
    id:        'upper',
    label:     'Upper-Intermediate',
    cefr:      'B2',
    tagline:   '40 questions (full exam volume), natural 1.0× speed, every question type including plan-map and multi-select.',
    href:      '/dashboard/teacher/ielts-upper-intermediate',
  },
  {
    id:        'advanced',
    label:     'Advanced',
    cefr:      'B2+ – C1',
    tagline:   'Real-exam lexical density and distractors, longer scripts, mostly inferential questions. For band 7+.',
    href:      '/dashboard/teacher/ielts-advanced',
  },
];

// Academic currently only has Listening — reuses the exact same GT
// listening content because Listening is identical across both IELTS
// formats (official). Reading/Writing/Speaking Academic are coming soon.
const ACADEMIC_LEVELS: LevelOption[] = [
  {
    id:        'listening',
    label:     'Listening (shared with GT)',
    cefr:      'B1 – C1',
    tagline:   'Listening is identical for Academic and General Training. Pick a mock and launch — same runner, same mocks.',
    href:      '/dashboard/teacher/ielts/listening',
    highlight: true,
    note:      'Shared content — one source of truth across both exam types.',
  },
  {
    id:        'ac-reading',
    label:     'Reading (Academic)',
    cefr:      'B1 – C1',
    tagline:   '3 passages with academic texts and the full set of question types. In production.',
    href:      null,
    comingSoon: true,
  },
  {
    id:        'ac-writing',
    label:     'Writing (Academic)',
    cefr:      'B1 – C1',
    tagline:   'Task 1 chart/graph/diagram description + Task 2 essay. AI grading with Academic band descriptors.',
    href:      null,
    comingSoon: true,
  },
  {
    id:        'ac-speaking',
    label:     'Speaking (Academic)',
    cefr:      'B1 – C1',
    tagline:   'Part 1 + 2 + 3. Shared speaking content with the GT runner is on the roadmap.',
    href:      null,
    comingSoon: true,
  },
];

export default function IELTSSimulatorChooser() {
  const [examType, setExamType] = useState<ExamType | null>(null);

  const levels = examType === 'gt' ? GT_LEVELS : examType === 'academic' ? ACADEMIC_LEVELS : [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      {/* Decorative grid */}
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
      {/* Decorative glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% -10%, rgba(200,168,220,0.35) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 10% 90%, rgba(220,20,60,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="IELTS Simulator"
          subtitle="Pick exam type and level — then launch the mock"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools',     href: '/dashboard/teacher/tools' },
            { label: 'IELTS Simulator' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8 space-y-8">

          {/* Hero */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC143C] animate-pulse" />
              IELTS®
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              IELTS Simulator
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Every version of our IELTS prep in one entrance. Start by picking
              the format your student is sitting, then the level.
            </p>
          </div>

          {/* Step 1 — exam type */}
          <section className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-1">Step 1</p>
                <h2 className="font-serif font-bold text-xl text-[#2D1B4E] leading-tight">Choose exam type</h2>
              </div>
              {examType && (
                <button
                  onClick={() => setExamType(null)}
                  className="text-[11px] font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] underline decoration-dotted"
                >
                  Change
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ExamTypeCard
                active={examType === 'gt'}
                title="General Training"
                blurb="Everyday English — work, immigration, and daily-life contexts. Most common for Chile/LatAm candidates."
                badge="Full stack ready"
                onClick={() => setExamType('gt')}
              />
              <ExamTypeCard
                active={examType === 'academic'}
                title="Academic"
                blurb="University admissions and professional registration (medical / engineering boards). Reading & Writing use academic sources."
                badge="Listening only (for now)"
                badgeTone="amber"
                onClick={() => setExamType('academic')}
              />
            </div>

            <p className="text-[11px] text-[#5A3D7A]/60 flex items-start gap-1.5">
              <Headphones className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={2.25} />
              <span>
                Heads up: the <strong>Listening section is identical</strong> for General Training and
                Academic (official IELTS format), so both options point to the same listening mocks.
              </span>
            </p>
          </section>

          {/* Step 2 — level */}
          <section
            className={`bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4 transition-all duration-200 ${
              examType ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}
          >
            <div>
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-1">Step 2</p>
              <h2 className="font-serif font-bold text-xl text-[#2D1B4E] leading-tight">
                Choose level {examType === 'academic' && <span className="text-[#5A3D7A]/50 font-normal text-sm">· Academic</span>}
                {examType === 'gt' && <span className="text-[#5A3D7A]/50 font-normal text-sm">· General Training</span>}
              </h2>
            </div>

            {!examType ? (
              <div className="text-center py-10 text-[#5A3D7A]/50 text-sm">
                Pick an exam type above to see level options.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {levels.map((l) => (
                  <LevelCard key={l.id} level={l} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function ExamTypeCard({
  active, title, blurb, badge, badgeTone = 'violet', onClick,
}: {
  active:    boolean;
  title:     string;
  blurb:     string;
  badge:     string;
  badgeTone?: 'violet' | 'amber';
  onClick:   () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl p-4 border-2 transition-all ${
        active
          ? 'border-[#5A3D7A] bg-[#F0E5FF] shadow-md'
          : 'border-gray-200 bg-white hover:border-[#C8A8DC] hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-serif text-lg font-bold text-[#2D1B4E] leading-tight">{title}</p>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap ${
          badgeTone === 'amber'
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-[#F0E5FF] text-[#5A3D7A] border border-[#C8A8DC]/50'
        }`}>
          {badge}
        </span>
      </div>
      <p className="text-[12px] text-[#5A3D7A]/70 leading-snug">{blurb}</p>
    </button>
  );
}

function LevelCard({ level }: { level: LevelOption }) {
  const content = (
    <div
      className={`h-full flex flex-col rounded-2xl p-4 border-2 transition-all ${
        level.comingSoon
          ? 'border-dashed border-gray-200 bg-gray-50/60 opacity-70 cursor-not-allowed'
          : level.highlight
            ? 'border-[#5A3D7A]/60 bg-gradient-to-br from-[#F0E5FF] to-white hover:border-[#5A3D7A] hover:shadow-md'
            : 'border-gray-200 bg-white hover:border-[#C8A8DC] hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <p className="font-serif text-base font-bold text-[#2D1B4E] leading-tight">
            {level.label}
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5A3D7A]/60 mt-0.5">
            CEFR · {level.cefr}
          </p>
        </div>
        {level.comingSoon ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <Hourglass className="w-2.5 h-2.5" strokeWidth={2.5} /> Soon
          </span>
        ) : level.highlight ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#5A3D7A] text-white whitespace-nowrap">
            <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} /> Featured
          </span>
        ) : null}
      </div>

      <p className="text-[12px] text-[#5A3D7A]/70 leading-snug flex-1 mt-1">{level.tagline}</p>

      {level.note && (
        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1 mt-2">
          ✓ {level.note}
        </p>
      )}

      {!level.comingSoon && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#5A3D7A]">
          Launch <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );

  if (level.comingSoon || !level.href) {
    return <div>{content}</div>;
  }
  return (
    <Link href={level.href} className="block">
      {content}
    </Link>
  );
}
