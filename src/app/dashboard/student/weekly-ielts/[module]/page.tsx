// FriendlyTeaching.cl — Weekly IELTS Academic module runner (student)
//
// Thin shell for now: shows what content the current mock points at for
// this module and exposes a "Mark as complete" button that advances the
// assignment. The actual drill UI will be wired into the existing IELTS
// simulators in a follow-up pass (listening/reading/writing/speaking
// each have their own teacher-facing runner we can lift verbatim).
'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStudentWeeklyIelts, markModuleComplete } from '@/hooks/useWeeklyIelts';
import {
  WEEKLY_IELTS_MODULES, MODULE_LABEL,
  type WeeklyIeltsModule,
} from '@/types/ielts-weekly';
import { getAcademicMock } from '@/lib/data/ielts/academicWeeklyMocks';

interface PageProps {
  params: Promise<{ module: string }>;
}

export default function WeeklyIeltsModulePage({ params }: PageProps) {
  const { module: moduleParam } = use(params);
  const router = useRouter();
  const { firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const { assignment, loading } = useStudentWeeklyIelts(uid);
  const [saving, setSaving] = useState(false);

  const moduleKey = (WEEKLY_IELTS_MODULES as readonly string[]).includes(moduleParam)
    ? (moduleParam as WeeklyIeltsModule)
    : null;

  const mockDef = useMemo(() => {
    if (!assignment) return null;
    return getAcademicMock(assignment.currentMock.mockId) ?? null;
  }, [assignment]);

  if (!moduleKey) {
    return <Shell><NotFound /></Shell>;
  }

  if (loading) {
    return <Shell><p className="text-sm text-[#4b3869]/60 text-center py-20 font-semibold">Loading…</p></Shell>;
  }

  if (!assignment) {
    return (
      <Shell>
        <p className="text-sm text-slate-500 text-center py-16">
          You don't have an active Weekly IELTS assignment.
        </p>
      </Shell>
    );
  }

  const alreadyDone = !!assignment.currentMock.modulesCompleted[moduleKey];

  async function onMarkComplete() {
    if (!assignment?.id || !moduleKey) return;
    setSaving(true);
    try {
      await markModuleComplete(assignment.id, moduleKey);
      router.push('/dashboard/student/weekly-ielts');
    } catch (e) {
      console.warn('[weekly-ielts module] markModuleComplete failed:', e);
    } finally {
      setSaving(false);
    }
  }

  // Content hint — a little description of what the student will work
  // with for this module, pulled from the mock definition. Useful while
  // the real simulator isn't wired in yet.
  const hint = (() => {
    if (!mockDef) return 'Content not available.';
    switch (moduleKey) {
      case 'listening': return `Listening set: ${mockDef.listeningMockId}`;
      case 'reading':   return `Reading set: ${mockDef.readingMockId}`;
      case 'writing':   return `Task 1: ${mockDef.writingTask1Id} · Task 2: ${mockDef.writingTask2Id}`;
      case 'speaking':  return `Cue card: ${mockDef.speaking.cueCardId} · Part 1 topics: ${mockDef.speaking.part1TopicIds.join(', ')} · Part 3 topics: ${mockDef.speaking.part3Topics.join(', ')}`;
    }
  })();

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/student/weekly-ielts"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9B7CB8] hover:text-[#5A3D7A] mb-4"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={2.5} /> Back to Weekly IELTS
        </Link>

        <div className="bg-white rounded-3xl border-2 border-[#e5d9f2] p-6 md:p-8 space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">
              {mockDef?.title ?? assignment.currentMock.mockId}
            </p>
            <h1 className="font-fun text-3xl font-extrabold text-[#4b3869] leading-tight mt-1">
              {MODULE_LABEL[moduleKey]}
            </h1>
          </div>

          <div className="rounded-2xl bg-[#F7EFFF] border border-[#e5d9f2] p-4 text-sm text-[#4b3869]">
            <p className="font-semibold mb-1">Module content</p>
            <p className="text-[13px] text-slate-600 break-words">{hint}</p>
            <p className="text-[11px] text-slate-400 mt-3 italic">
              The in-app simulator for this module ships in the next update. For now, do the work with your teacher or offline and press the button below to mark it done.
            </p>
          </div>

          {alreadyDone ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 inline-flex items-center gap-2">
              <Check className="w-4 h-4" strokeWidth={2.5} />
              You already marked this module complete.
            </div>
          ) : (
            <button
              onClick={onMarkComplete}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5A3D7A] hover:bg-[#3D1F6B] text-white rounded-full font-bold text-sm shadow-lg disabled:opacity-60 transition-colors"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> Saving…</>
                : <><Check className="w-4 h-4" strokeWidth={2.5} /> Mark {MODULE_LABEL[moduleKey]} as complete</>}
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function NotFound() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-[#e5d9f2] p-8 text-center">
      <p className="text-[#4b3869] font-semibold">Unknown module.</p>
      <Link href="/dashboard/student/weekly-ielts" className="text-sm text-[#9B7CB8] hover:underline mt-3 inline-block">
        ← Back to Weekly IELTS
      </Link>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-grid">
      <div className="p-6">
        <TopBar
          title="Weekly IELTS"
          subtitle="One module at a time."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Weekly IELTS', href: '/dashboard/student/weekly-ielts' },
            { label: 'Module' },
          ]}
        />
        <div className="max-w-5xl mx-auto mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
