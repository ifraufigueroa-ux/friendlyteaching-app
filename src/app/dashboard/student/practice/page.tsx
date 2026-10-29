// FriendlyTeaching.cl — Daily Practice landing (student)
//
// Student lands here from the sidebar. Three states:
//
//   1. New user (no progress doc) → onboarding choice:
//      "Start from A0" or "Take placement test first".
//   2. Returning user → streak chip, current level, "Start today's
//      workout" CTA on the next unit, grid of available units with
//      mastery crowns.
//   3. Signed-out → ask them to sign in.

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { Flame, Trophy, Sparkles, ArrowRight, Target, GraduationCap } from 'lucide-react';
import { useDailyPractice, masteryBand } from '@/hooks/useDailyPractice';
import { PRACTICE_UNITS, unitsByLevel } from '@/lib/data/practice/general-english';
import {
  PRACTICE_LEVELS, LEVEL_ORDER, STREAK_GRACE_DAYS, daysSince,
  type PracticeLevel, type PracticeUnit, type PracticeProgress,
} from '@/types/practice';

export default function PracticeLandingPage() {
  const { uid, progress, loading, initializeProgress } = useDailyPractice();

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-[#5A3D7A]/60 text-center py-20">Loading…</p>
      </Shell>
    );
  }

  if (!uid) {
    return (
      <Shell>
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-md border border-[#E8D5F0] p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-[#2D1B4E] mb-2">Sign in to practice</h2>
          <p className="text-sm text-gray-500">You need a student account to use Daily Practice.</p>
        </div>
      </Shell>
    );
  }

  if (!progress) {
    return (
      <Shell>
        <OnboardingChoice
          onStartFromScratch={async () => {
            await initializeProgress({
              startedFromPlacement: false,
              currentLevel:         'A0',
              nextUnitId:           PRACTICE_UNITS[0]?.id ?? null,
            });
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <DashboardView progress={progress} />
    </Shell>
  );
}

// ── Shell ────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 20%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 20%, black 40%, transparent 90%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(55rem 35rem at 50% -10%, rgba(200,168,220,0.30) 0%, transparent 60%),' +
            'radial-gradient(40rem 25rem at 95% 95%, rgba(244,114,182,0.08) 0%, transparent 60%)',
        }}
      />
      <div className="relative z-10 p-6">
        <TopBar
          title="Daily Practice"
          subtitle="A few minutes a day. Grammar, vocab, and real English."
          breadcrumbs={[
            { label: 'Dashboard',       href: '/dashboard' },
            { label: 'Daily Practice' },
          ]}
        />
        <div className="max-w-5xl mx-auto mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Onboarding choice ────────────────────────────────────────

function OnboardingChoice({
  onStartFromScratch,
}: {
  onStartFromScratch: () => Promise<void>;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/40 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3 h-3" strokeWidth={2.5} />
          First time here
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2D1B4E] leading-tight">
          Where would you like to start?
        </h2>
        <p className="text-sm text-[#5A3D7A]/70 max-w-md mx-auto">
          Pick a starting point. You can always jump between units later — your streak counts no matter where you practice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onStartFromScratch}
          className="group text-left bg-white rounded-3xl border-2 border-[#E8D5F0] hover:border-[#5A3D7A] hover:shadow-xl transition-all p-6 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white flex items-center justify-center text-2xl shadow-md">
            🌱
          </div>
          <h3 className="font-serif text-xl font-bold text-[#2D1B4E] leading-tight">
            Start from A0
          </h3>
          <p className="text-sm text-gray-500 leading-snug">
            Begin from the very beginning. Greetings, numbers, the basics of English.
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-bold text-[#5A3D7A] group-hover:gap-2 transition-all">
            Start today <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </p>
        </button>

        <Link
          href="/dashboard/student/placement"
          className="group text-left bg-white rounded-3xl border-2 border-[#E8D5F0] hover:border-[#5A3D7A] hover:shadow-xl transition-all p-6 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl shadow-md">
            🎯
          </div>
          <h3 className="font-serif text-xl font-bold text-[#2D1B4E] leading-tight">
            Take the placement
          </h3>
          <p className="text-sm text-gray-500 leading-snug">
            Short diagnostic so we drop you at the level that fits — anywhere from A0 to B2.
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:gap-2 transition-all">
            Take placement <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </p>
        </Link>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Either way, you can pick a different level any time from the unit grid.
      </p>
    </div>
  );
}

// ── Dashboard view ───────────────────────────────────────────

function DashboardView({ progress }: { progress: PracticeProgress }) {
  const grouped = useMemo(() => unitsByLevel(), []);
  const levels  = useMemo(
    () => [...PRACTICE_LEVELS].sort((a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b]),
    [],
  );

  // Pick the "next unit" for the daily workout: either the stored one, or
  // the first unit at the current level that isn't mastered yet, or the
  // first unit overall.
  const nextUnit: PracticeUnit | null = useMemo(() => {
    if (progress.nextUnitId) {
      const picked = PRACTICE_UNITS.find(u => u.id === progress.nextUnitId);
      if (picked) return picked;
    }
    const atLevel = grouped[progress.currentLevel] ?? [];
    const unmastered = atLevel.find(u => (progress.mastery[u.id] ?? 0) < 5);
    return unmastered ?? atLevel[0] ?? PRACTICE_UNITS[0] ?? null;
  }, [progress, grouped]);

  const gap = daysSince(progress.lastPracticedAt);
  const streakLive = gap <= STREAK_GRACE_DAYS;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={<Flame className="w-5 h-5" strokeWidth={2.5} />}
          label="Current streak"
          value={`${progress.currentStreak} ${progress.currentStreak === 1 ? 'day' : 'days'}`}
          sub={streakLive
            ? (gap === 0 ? 'Practiced today — nice.' : `${STREAK_GRACE_DAYS - gap} day${STREAK_GRACE_DAYS - gap === 1 ? '' : 's'} left before reset.`)
            : 'Streak reset — start a new one today.'
          }
          tone="orange"
        />
        <StatCard
          icon={<GraduationCap className="w-5 h-5" strokeWidth={2.5} />}
          label="Current level"
          value={progress.currentLevel}
          sub={`${(grouped[progress.currentLevel] ?? []).length} units at this level`}
          tone="violet"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" strokeWidth={2.5} />}
          label="Total XP"
          value={progress.totalXp.toLocaleString()}
          sub={progress.longestStreak > 0 ? `Longest streak: ${progress.longestStreak}` : 'Earn 10 XP per correct answer.'}
          tone="amber"
        />
      </div>

      {/* Workout CTA */}
      {nextUnit && (
        <Link
          href={`/dashboard/student/practice/lesson/${nextUnit.id}`}
          className="group block bg-gradient-to-br from-[#5A3D7A] via-[#7B5BA3] to-[#9B7CB8] rounded-3xl shadow-xl p-6 md:p-8 text-white hover:shadow-2xl active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner">
              {nextUnit.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">
                Today&rsquo;s workout
              </p>
              <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight">
                {nextUnit.title}
              </h3>
              <p className="text-sm text-white/70 mt-1">
                {nextUnit.level} · {nextUnit.exercises.length} exercises · {skillLabel(nextUnit.skill)}
              </p>
            </div>
            <div className="flex-shrink-0 hidden md:flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#5A3D7A] font-bold text-sm shadow-lg group-hover:gap-3 transition-all">
              Start <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="md:hidden mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#5A3D7A] font-bold text-sm shadow-lg">
            Start <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </div>
        </Link>
      )}

      {/* Units by level */}
      <div className="space-y-6">
        {levels.map(level => {
          const unitsAtLevel = grouped[level] ?? [];
          if (unitsAtLevel.length === 0) return null;
          return (
            <section key={level} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border ${levelPill(level)}`}>
                  {level}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#2D1B4E]">
                  {levelTitle(level)}
                </h3>
                <span className="text-[11px] text-[#5A3D7A]/60">
                  {unitsAtLevel.length} {unitsAtLevel.length === 1 ? 'unit' : 'units'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unitsAtLevel.map(u => {
                  const crowns  = progress.mastery[u.id] ?? 0;
                  const band    = masteryBand(crowns);
                  const isNext  = nextUnit?.id === u.id;
                  return (
                    <Link
                      key={u.id}
                      href={`/dashboard/student/practice/lesson/${u.id}`}
                      className={`group bg-white rounded-2xl border-2 p-4 flex items-start gap-3 hover:shadow-md transition-all ${
                        isNext ? 'border-[#5A3D7A]' : 'border-[#E8D5F0] hover:border-[#C8A8DC]'
                      }`}
                    >
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#F0E5FF] flex items-center justify-center text-xl">
                        {u.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">
                            {skillLabel(u.skill)}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${band.color}`}>
                            {band.label}
                          </span>
                          {crowns > 0 && (
                            <span className="text-[10px] text-amber-500">
                              {'★'.repeat(crowns)}{'☆'.repeat(5 - crowns)}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-[#2D1B4E] leading-tight">
                          {u.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          {u.description}
                        </p>
                      </div>
                      <ArrowRight className="flex-shrink-0 w-4 h-4 text-[#9B7CB8] mt-1 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="bg-white/60 rounded-2xl border border-dashed border-[#E8D5F0] p-4 text-center">
        <p className="text-[10px] font-black text-[#5A3D7A]/60 uppercase tracking-[0.25em] mb-1 inline-flex items-center gap-1.5">
          <Target className="w-3 h-3" strokeWidth={2.5} /> Streak policy
        </p>
        <p className="text-xs text-[#5A3D7A]/70">
          Miss {STREAK_GRACE_DAYS} days in a row and the streak resets. Any lesson, any level counts.
        </p>
      </div>
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, tone,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string;
  sub:   string;
  tone:  'orange' | 'violet' | 'amber';
}) {
  const palette = {
    orange: { bg: 'bg-gradient-to-br from-orange-400 to-rose-500', text: 'text-rose-700'   },
    violet: { bg: 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8]', text: 'text-[#5A3D7A]' },
    amber:  { bg: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-amber-700'  },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-[#E8D5F0] p-4 flex items-start gap-3 shadow-sm">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${palette.bg} text-white flex items-center justify-center shadow`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
          {label}
        </p>
        <p className={`font-serif text-2xl font-bold leading-tight ${palette.text}`}>
          {value}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
          {sub}
        </p>
      </div>
    </div>
  );
}

function levelPill(level: PracticeLevel): string {
  switch (level) {
    case 'A0': return 'border-slate-300 bg-slate-50 text-slate-700';
    case 'A1': return 'border-sky-300 bg-sky-50 text-sky-700';
    case 'A2': return 'border-teal-300 bg-teal-50 text-teal-700';
    case 'B1': return 'border-violet-300 bg-violet-50 text-violet-700';
    case 'B2': return 'border-rose-300 bg-rose-50 text-rose-700';
  }
}

function levelTitle(level: PracticeLevel): string {
  switch (level) {
    case 'A0': return 'Starter — pre-A1';
    case 'A1': return 'Beginner';
    case 'A2': return 'Elementary';
    case 'B1': return 'Intermediate';
    case 'B2': return 'Upper-Intermediate';
  }
}

function skillLabel(s: PracticeUnit['skill']): string {
  switch (s) {
    case 'grammar':    return 'Grammar';
    case 'vocabulary': return 'Vocabulary';
    case 'listening':  return 'Listening';
    case 'reading':    return 'Reading';
  }
}
