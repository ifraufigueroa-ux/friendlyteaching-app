// FriendlyTeaching.cl — Weekly IELTS Academic landing (student)
//
// Shown only to students whose teacher created a weeklyIeltsAssignments
// doc for them (the sidebar hides this link otherwise). Mirrors the
// Daily Practice layout: top hero with the active plan, 4 module cards,
// and a "Request new Mock" CTA once every module is done.
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { Trophy, ArrowRight, Check, Clock, Lock, Headphones, BookOpen, PenLine, Mic, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStudentWeeklyIelts, requestNextMock } from '@/hooks/useWeeklyIelts';
import {
  WEEKLY_IELTS_MODULES, MODULE_LABEL, INTENSITY_LABEL, INTENSITY_BLURB,
  completedModuleCount, isMockComplete,
  type WeeklyIeltsModule,
} from '@/types/ielts-weekly';
import { getAcademicMock } from '@/lib/data/ielts/academicWeeklyMocks';

const MODULE_ICON: Record<WeeklyIeltsModule, typeof Headphones> = {
  listening: Headphones,
  reading:   BookOpen,
  writing:   PenLine,
  speaking:  Mic,
};

const MODULE_TINT: Record<WeeklyIeltsModule, { bg: string; text: string; accent: string }> = {
  listening: { bg: 'bg-sky-100',     text: 'text-sky-700',     accent: 'from-sky-400 to-sky-600' },
  reading:   { bg: 'bg-violet-100',  text: 'text-violet-700',  accent: 'from-violet-400 to-violet-600' },
  writing:   { bg: 'bg-amber-100',   text: 'text-amber-700',   accent: 'from-amber-400 to-amber-600' },
  speaking:  { bg: 'bg-rose-100',    text: 'text-rose-700',    accent: 'from-rose-400 to-rose-600' },
};

export default function WeeklyIeltsLandingPage() {
  const { firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const { assignment, loading } = useStudentWeeklyIelts(uid);

  const mockDef = useMemo(() => {
    if (!assignment) return null;
    return getAcademicMock(assignment.currentMock.mockId) ?? null;
  }, [assignment]);

  if (loading) {
    return <Shell><p className="text-sm text-[#4b3869]/60 text-center py-20 font-semibold">Loading…</p></Shell>;
  }

  if (!assignment) {
    return (
      <Shell>
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-md border-2 border-[#e5d9f2] p-8 text-center">
          <Trophy className="w-10 h-10 text-[#C8A8DC] mx-auto mb-3" strokeWidth={1.8} />
          <h2 className="text-xl font-extrabold text-[#4b3869] mb-2">Not assigned yet</h2>
          <p className="text-sm text-slate-500">
            Weekly IELTS is activated by your teacher. Ask them to assign you a plan to start.
          </p>
        </div>
      </Shell>
    );
  }

  const doneCount = completedModuleCount(assignment.currentMock);
  const allDone = isMockComplete(assignment.currentMock);

  async function onRequestNextMock() {
    if (!assignment?.id) return;
    try {
      await requestNextMock(assignment.id);
    } catch (e) {
      console.warn('[weekly-ielts] requestNextMock failed:', e);
    }
  }

  return (
    <Shell>
      {/* ── Hero: current plan + progress ────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-[#2D1B4E] via-[#4b2d78] to-[#7A4A00] p-6 md:p-8 text-white shadow-lg mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] bg-white/15 px-2.5 py-1 rounded-full">
              <Trophy className="w-3 h-3" strokeWidth={2.5} /> Weekly IELTS · Academic
            </p>
            <h1 className="font-fun text-3xl md:text-4xl font-extrabold mt-2 tracking-tight">
              {mockDef?.title ?? assignment.currentMock.mockId}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {INTENSITY_LABEL[assignment.intensity]} plan · {INTENSITY_BLURB[assignment.intensity]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-extrabold leading-none">{doneCount}<span className="text-xl text-white/60">/4</span></p>
            <p className="text-[11px] uppercase tracking-widest text-white/60 mt-1">modules done</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FFD591] to-[#FFAD4B] transition-all"
              style={{ width: `${(doneCount / 4) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-white/60 mt-2">
            Mock {assignment.currentMockIndex + 1} of {assignment.mockRotation.length}
            {assignment.completedMocks.length > 0 && (
              <> · {assignment.completedMocks.length} completed so far</>
            )}
          </p>
        </div>
      </section>

      {/* ── 4 modules ────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {WEEKLY_IELTS_MODULES.map((m) => {
          const done = !!assignment.currentMock.modulesCompleted[m];
          const Icon = MODULE_ICON[m];
          const tint = MODULE_TINT[m];
          return (
            <Link
              key={m}
              href={`/dashboard/student/weekly-ielts/${m}`}
              className="group bg-white rounded-3xl border-2 border-[#e5d9f2] p-5 hover:shadow-xl hover:border-[#C8A8DC] transition-all flex items-start gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl ${tint.bg} ${tint.text} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-7 h-7" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">Module</p>
                <h3 className="font-fun text-xl font-bold text-[#4b3869] leading-tight mb-1">
                  {MODULE_LABEL[m]}
                </h3>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {done ? <><Check className="w-3 h-3" strokeWidth={3} /> Completed</>
                       : <><Clock className="w-3 h-3" strokeWidth={2.5} /> Pending</>}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-[#9B7CB8] group-hover:translate-x-0.5 transition-transform flex-shrink-0" strokeWidth={2.5} />
            </Link>
          );
        })}
      </section>

      {/* ── Request new mock CTA (visible when full mock done) ── */}
      <section className="rounded-3xl bg-white border-2 border-dashed border-[#e5d9f2] p-6 text-center">
        {allDone ? (
          <>
            <p className="text-2xl mb-1">🎉</p>
            <h3 className="font-fun text-xl font-extrabold text-[#4b3869] mb-1">Mock completed!</h3>
            <p className="text-sm text-slate-500 mb-4">
              Ready for the next one? You'll get a fresh set of listening, reading, writing and speaking.
            </p>
            <button
              onClick={onRequestNextMock}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5A3D7A] to-[#7A4A00] text-white rounded-full font-bold text-sm shadow-lg hover:shadow-xl transition-shadow"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
              Request new Mock
            </button>
          </>
        ) : (
          <>
            <Lock className="w-6 h-6 text-slate-300 mx-auto mb-2" strokeWidth={2} />
            <p className="text-sm text-slate-500">
              Finish all 4 modules of this mock to unlock the next one.
            </p>
          </>
        )}
      </section>

      {assignment.completedMocks.length > 0 && (
        <section className="mt-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8] mb-2">History</p>
          <ul className="space-y-2">
            {assignment.completedMocks.slice(0, 5).map((m, i) => (
              <li key={`${m.mockId}-${i}`} className="bg-white border border-[#e5d9f2] rounded-xl px-4 py-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#4b3869]">{getAcademicMock(m.mockId)?.title ?? m.mockId}</span>
                <span className="text-[11px] text-slate-400">completed</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-grid">
      <div className="p-6">
        <TopBar
          title="Weekly IELTS"
          subtitle="Academic mocks, module by module, at your own pace."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Weekly IELTS' },
          ]}
        />
        <div className="max-w-5xl mx-auto mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
