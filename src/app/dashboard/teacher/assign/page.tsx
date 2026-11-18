// FriendlyTeaching.cl — Assignments hub
//
// Landing page under the sidebar entry "Assignments". Two gamified
// routes: Assign Lesson (one-shot or persistent material) and
// Assign Homework (deliverable the student submits back).
'use client';

import Link from 'next/link';
import {
  BookOpen,
  FileText,
  ArrowRight,
  Library,
  Link2,
  Sparkles,
  ClipboardList,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

type LaneTone = {
  tileBg: string;
  tileText: string;
  accent: string;
  chipBg: string;
  chipText: string;
};

const LESSON_TONE: LaneTone = {
  tileBg: 'bg-gradient-to-br from-[#F0E5FF] via-[#E6D4F5] to-[#D0BDF4]',
  tileText: 'text-[#4C2C7A]',
  accent: '#845EC2',
  chipBg: 'bg-white/70',
  chipText: 'text-[#5A3D7A]',
};

const HOMEWORK_TONE: LaneTone = {
  tileBg: 'bg-gradient-to-br from-[#FFE7B8] via-[#FFD591] to-[#FFC068]',
  tileText: 'text-[#7A4A00]',
  accent: '#E58900',
  chipBg: 'bg-white/70',
  chipText: 'text-[#7A4A00]',
};

function LaneTile({
  href,
  title,
  blurb,
  Icon,
  highlights,
  tone,
  cta,
}: {
  href: string;
  title: string;
  blurb: string;
  Icon: typeof BookOpen;
  highlights: { Icon: typeof BookOpen; label: string }[];
  tone: LaneTone;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={`game-card rounded-3xl p-6 md:p-8 flex flex-col group ${tone.tileBg} ${tone.tileText} relative overflow-hidden`}
    >
      {/* Decorative corner glyph */}
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/25 blur-xl pointer-events-none" aria-hidden />
      <div className="absolute top-3 right-3 opacity-60 pointer-events-none" aria-hidden>
        <Sparkles className="w-5 h-5" strokeWidth={2.25} />
      </div>

      <div
        className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center mb-5 shadow-sm"
        style={{ color: tone.accent }}
      >
        <Icon className="w-8 h-8" strokeWidth={2.25} />
      </div>

      <h2 className="font-fun text-3xl md:text-4xl font-bold leading-tight mb-2">{title}</h2>
      <p className="text-sm md:text-[15px] font-medium opacity-90 mb-5 max-w-sm leading-snug">
        {blurb}
      </p>

      <ul className="space-y-1.5 mb-6">
        {highlights.map((h, i) => (
          <li
            key={i}
            className={`inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full ${tone.chipBg} ${tone.chipText} mr-1.5`}
          >
            <h.Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
            {h.label}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <span
          className="btn-game inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
          style={{
            backgroundColor: tone.accent,
            borderBottomColor: tone.accent === '#845EC2' ? '#6B4C9A' : '#B86A00',
          }}
        >
          {cta}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}

export default function AssignmentsHubPage() {
  return (
    <div className="min-h-screen">
      <div className="p-6">
        <TopBar
          title="Assignments"
          subtitle="Pick what you want to send — a lesson to work with, or a homework to turn in."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Assignments' },
          ]}
        />

        <div className="max-w-5xl mx-auto mt-8 grid gap-5 md:grid-cols-2">
          <LaneTile
            href="/dashboard/teacher/assign/lesson"
            title="Assign Lesson"
            blurb="Any material students work with: an FT lesson, a Friendlistening or Writing task, an external link (Off2Class, Ellii, Drive), or your own HTML upload."
            Icon={BookOpen}
            highlights={[
              { Icon: Library,  label: 'FT Library' },
              { Icon: Link2,    label: 'External link' },
              { Icon: Upload,   label: 'HTML upload' },
            ]}
            tone={LESSON_TONE}
            cta="Choose material"
          />
          <LaneTile
            href="/dashboard/teacher/assign/homework"
            title="Assign Homework"
            blurb="Deliverables your student turns in — with slides for internal tasks, or an Off2Class / Ellii link. You review, grade, and give feedback."
            Icon={FileText}
            highlights={[
              { Icon: ClipboardList, label: 'With slides' },
              { Icon: Link2,         label: 'Off2Class / Ellii' },
              { Icon: CheckCircle2,  label: 'Review & grade' },
            ]}
            tone={HOMEWORK_TONE}
            cta="Set homework"
          />
        </div>

        <p className="max-w-5xl mx-auto mt-6 text-xs text-gray-400 text-center">
          Tip: use <strong className="text-[#5A3D7A]">Assign Lesson</strong> for material you expect them to engage with in or before class.
          Use <strong className="text-[#7A4A00]">Assign Homework</strong> when there's something they must submit back for you to review.
        </p>
      </div>
    </div>
  );
}
