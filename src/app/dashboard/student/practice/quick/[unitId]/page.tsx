// FriendlyTeaching.cl — Daily Practice: Quick Lesson
//
// Reached from the "Quick Lesson" button on any unit card. Shows a
// short pre-workout explainer with examples and tips, then a big
// "Go Practice" button that routes into the actual drill at
// /dashboard/student/practice/lesson/[unitId].
'use client';

import { use } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Sparkles } from 'lucide-react';
import { findUnit } from '@/lib/data/practice/general-english';
import type { QuickLessonSection } from '@/types/practice';

interface PageProps {
  params: Promise<{ unitId: string }>;
}

export default function QuickLessonPage({ params }: PageProps) {
  const { unitId } = use(params);
  const unit = findUnit(unitId);

  if (!unit) return <Shell><NotFound /></Shell>;

  const practiceHref = `/dashboard/student/practice/lesson/${unit.id}`;
  const quick = unit.quickLesson;

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/student/practice"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9B7CB8] hover:text-[#5A3D7A] mb-4"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={2.5} /> Back to Daily Practice
        </Link>

        {/* ── Hero: title + level + summary ────────────────── */}
        <div className="rounded-3xl bg-gradient-to-br from-[#5A3D7A] via-[#4b2d78] to-[#2D1B4E] p-6 md:p-8 text-white shadow-lg mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-3xl">{unit.icon}</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] bg-white/15 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" strokeWidth={2.5} /> {unit.level} · Quick Lesson
            </span>
          </div>
          <h1 className="font-fun text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {unit.title}
          </h1>
          {quick?.summary && (
            <p className="text-white/80 text-sm md:text-base mt-3 leading-relaxed">
              {quick.summary}
            </p>
          )}
          {!quick && (
            <p className="text-white/70 text-sm md:text-base mt-3 leading-relaxed italic">
              {unit.description}
            </p>
          )}
        </div>

        {/* ── Body: sections, or coming soon ────────────── */}
        {quick ? (
          <div className="space-y-5 mb-8">
            {quick.sections.map((s, i) => (
              <Section key={i} s={s} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white border-2 border-dashed border-[#e5d9f2] p-6 mb-8 text-center">
            <BookOpen className="w-7 h-7 text-[#C8A8DC] mx-auto mb-2" strokeWidth={1.8} />
            <p className="text-[#4b3869] font-semibold text-sm mb-1">
              Quick lesson coming soon
            </p>
            <p className="text-xs text-slate-500">
              Jump into the practice while we finish writing the explainer.
            </p>
          </div>
        )}

        {/* ── Go Practice CTA (sticky-ish at bottom of content) ─ */}
        <Link
          href={practiceHref}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#845ec2] to-[#5A3D7A] text-white rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-shadow"
        >
          Go Practice <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
        </Link>
        <p className="text-center text-[11px] text-slate-500 mt-3">
          {unit.exercises.length} exercises · a few minutes
        </p>
      </div>
    </Shell>
  );
}

// ── Section renderer ─────────────────────────────────────────

function Section({ s }: { s: QuickLessonSection }) {
  const paragraphs = s.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="rounded-3xl bg-white border-2 border-[#e5d9f2] p-5 md:p-6 shadow-sm">
      {s.heading && (
        <h2 className="font-fun text-xl font-extrabold text-[#4b3869] leading-tight mb-2">
          {s.heading}
        </h2>
      )}
      <div className="space-y-2.5 text-sm md:text-[15px] text-slate-700 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {s.examples && s.examples.length > 0 && (
        <div className="mt-4 rounded-2xl bg-[#F7EFFF] border border-[#e5d9f2] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8] mb-2">
            Examples
          </p>
          <ul className="space-y-1.5">
            {s.examples.map((ex, i) => (
              <li key={i} className="text-sm text-[#4b3869] leading-snug">
                <span className="font-semibold text-[#7A5EA7] mr-1.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatExample(ex) }} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.tip && (
        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 inline-flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
          <p className="text-[13px] text-amber-900 leading-snug">{s.tip}</p>
        </div>
      )}
    </div>
  );
}

/** Lightweight formatting for examples: wrap text between asterisks in
 *  <strong> so authors can emphasise the grammar target.
 *  "I **have been** studying" → "I <strong>have been</strong> studying". */
function formatExample(raw: string): string {
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#5A3D7A]">$1</strong>');
}

// ── Shell + NotFound ────────────────────────────────────────

function NotFound() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-[#e5d9f2] p-8 text-center">
      <p className="text-[#4b3869] font-semibold">Unit not found.</p>
      <Link href="/dashboard/student/practice" className="text-sm text-[#9B7CB8] hover:underline mt-3 inline-block">
        ← Back to Daily Practice
      </Link>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-grid">
      <div className="p-6">
        <TopBar
          title="Quick Lesson"
          subtitle="A short explainer before the drill."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Daily Practice', href: '/dashboard/student/practice' },
            { label: 'Quick Lesson' },
          ]}
        />
        <div className="max-w-5xl mx-auto mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
