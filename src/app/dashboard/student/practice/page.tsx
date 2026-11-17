// FriendlyTeaching.cl — Daily Practice landing (student)
//
// Student lands here from the sidebar. Three states:
//
//   1. New user (no progress doc) → onboarding choice:
//      "Start from A0" or "Take placement test first".
//   2. Returning user → arcade-style hero, stat chips, "Today's
//      workout" CTA, and a grid of level-grouped units with crowns.
//   3. Signed-out → ask them to sign in.

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import {
  Flame, Trophy, Sparkles, ArrowRight, Target, GraduationCap, Crown, Zap, Play,
} from 'lucide-react';
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
        <p className="text-sm text-[#462573]/60 text-center py-20 font-semibold">Loading…</p>
      </Shell>
    );
  }

  if (!uid) {
    return (
      <Shell>
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-md border-2 border-[#d9c9f0] p-8 text-center">
          <h2 className="text-2xl font-extrabold text-[#462573] mb-2">Sign in to practice</h2>
          <p className="text-sm text-slate-500">You need a student account to use Daily Practice.</p>
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
    <div className="min-h-screen" style={{ backgroundColor: '#ede2fc' }}>
      <div className="p-6">
        <TopBar
          title="Daily Practice"
          subtitle="A few minutes a day. Grammar, vocab, and real English."
          breadcrumbs={[
            { label: 'Dashboard',       href: '/dashboard' },
            { label: 'Daily Practice' },
          ]}
        />
        <div className="max-w-5xl mx-auto mt-6">
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
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#462573] bg-[#ece3f7] border border-[#d9c9f0] px-3 py-1.5 rounded-full">
          <Sparkles className="w-3 h-3" strokeWidth={2.5} />
          First time here
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#462573] leading-tight tracking-tight">
          Where would you like to start?
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Pick a starting point. You can always jump between units later — your streak counts no matter where you practice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onStartFromScratch}
          className="group text-left bg-white rounded-3xl border-2 border-[#d9c9f0] hover:border-[#6e3fb0] hover:shadow-xl transition-all p-6 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6e3fb0] to-[#8352c7] text-white flex items-center justify-center text-2xl shadow-md">
            🌱
          </div>
          <h3 className="text-xl font-extrabold text-[#462573] leading-tight">
            Start from A0
          </h3>
          <p className="text-sm text-slate-500 leading-snug">
            Begin from the very beginning. Greetings, numbers, the basics of English.
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#6e3fb0] group-hover:gap-2 transition-all">
            Start today <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </p>
        </button>

        <Link
          href="/dashboard/student/placement"
          className="group text-left bg-white rounded-3xl border-2 border-[#d9c9f0] hover:border-amber-500 hover:shadow-xl transition-all p-6 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl shadow-md">
            🎯
          </div>
          <h3 className="text-xl font-extrabold text-[#462573] leading-tight">
            Take the placement
          </h3>
          <p className="text-sm text-slate-500 leading-snug">
            Short diagnostic so we drop you at the level that fits — anywhere from A0 to B2.
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-700 group-hover:gap-2 transition-all">
            Take placement <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </p>
        </Link>
      </div>

      <p className="text-center text-[11px] text-slate-500">
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
    <div className="space-y-5">
      {/* ── Arcade header: streak + XP + level chips ──────── */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-amber-700">
            {progress.currentStreak} {progress.currentStreak === 1 ? 'day' : 'days'} streak
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#f5f0fb] px-3 py-1.5 rounded-2xl border border-[#ece3f7] shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-[#6e3fb0] text-white flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-[#583091]">{progress.totalXp.toLocaleString()} XP</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-[#d9c9f0] shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-[#462573] text-white flex items-center justify-center text-[10px] font-black">
            {progress.currentLevel}
          </div>
          <span className="text-xs font-bold text-[#462573]">{levelTitle(progress.currentLevel)}</span>
        </div>
      </div>

      {/* ── Today's workout hero CTA ─────────────────────── */}
      {nextUnit && (
        <Link
          href={`/dashboard/student/practice/lesson/${nextUnit.id}`}
          className="group block rounded-3xl p-6 md:p-8 text-white active:scale-[0.995] transition-all relative overflow-hidden shadow-xl animate-ft-cta-pulse"
          style={{
            background: 'linear-gradient(135deg, #462573 0%, #6e3fb0 55%, #8352c7 100%)',
          }}
        >
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full pointer-events-none"
               style={{ background: 'rgba(255,255,255,0.1)', filter: 'blur(32px)' }} />
          <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner border border-white/20">
              {nextUnit.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-1.5">
                <Crown className="w-3 h-3 text-amber-300" strokeWidth={2.5} />
                Today&rsquo;s workout
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
                {nextUnit.title}
              </h3>
              <p className="text-sm text-white/75 mt-1">
                {nextUnit.level} · {nextUnit.exercises.length} exercises · {skillLabel(nextUnit.skill)}
              </p>
            </div>
            <div className="flex-shrink-0 hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#462573] text-sm font-black uppercase tracking-wider shadow-lg group-hover:gap-3 transition-all">
              <Play className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} />
              Start
            </div>
          </div>
          <div className="md:hidden mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-[#462573] text-sm font-black uppercase tracking-wider shadow-lg">
            <Play className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} />
            Start
          </div>
        </Link>
      )}

      {/* ── Secondary stats row ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={<Flame className="w-5 h-5" strokeWidth={2.5} />}
          label="Current streak"
          value={`${progress.currentStreak} ${progress.currentStreak === 1 ? 'day' : 'days'}`}
          sub={streakLive
            ? (gap === 0 ? 'Practised today — nice.' : `${STREAK_GRACE_DAYS - gap} day${STREAK_GRACE_DAYS - gap === 1 ? '' : 's'} left before reset.`)
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

      {/* ── Units by level ──────────────────────────────── */}
      <div className="space-y-5">
        {levels.map(level => {
          const unitsAtLevel = grouped[level] ?? [];
          if (unitsAtLevel.length === 0) return null;
          return (
            <section key={level} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-black uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border ${levelPill(level)}`}>
                  {level}
                </span>
                <h3 className="text-lg font-extrabold text-[#462573]">
                  {levelTitle(level)}
                </h3>
                <span className="text-[11px] font-bold text-[#8352c7]/70">
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
                      className={`group bg-white rounded-2xl border-2 p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all ${
                        isNext ? 'border-[#6e3fb0] shadow-md ring-2 ring-[#6e3fb0]/15' : 'border-[#d9c9f0] hover:border-[#8352c7]'
                      }`}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#f5f0fb] border border-[#ece3f7] flex items-center justify-center text-2xl">
                        {u.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#8352c7]">
                            {skillLabel(u.skill)}
                          </p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${band.color}`}>
                            {band.label}
                          </span>
                          {crowns > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Crown
                                  key={i}
                                  className={`w-3 h-3 ${i < crowns ? 'fill-current' : 'opacity-30'}`}
                                  strokeWidth={2.5}
                                />
                              ))}
                            </span>
                          )}
                        </div>
                        <p className="font-extrabold text-sm text-[#2D1B4E] leading-tight">
                          {u.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {u.description}
                        </p>
                      </div>
                      <ArrowRight className="flex-shrink-0 w-4 h-4 text-[#8352c7] mt-1 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Footer note ─────────────────────────────────── */}
      <div className="bg-white/70 rounded-2xl border border-dashed border-[#d9c9f0] p-4 text-center">
        <p className="text-[10px] font-black text-[#462573]/60 uppercase tracking-[0.25em] mb-1 inline-flex items-center gap-1.5">
          <Target className="w-3 h-3" strokeWidth={2.5} /> Streak policy
        </p>
        <p className="text-xs text-[#462573]/70">
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
    violet: { bg: 'bg-gradient-to-br from-[#6e3fb0] to-[#8352c7]', text: 'text-[#462573]' },
    amber:  { bg: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-amber-700'  },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-[#d9c9f0] p-4 flex items-start gap-3 shadow-sm">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${palette.bg} text-white flex items-center justify-center shadow`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8352c7]/70 mb-0.5">
          {label}
        </p>
        <p className={`text-2xl font-extrabold leading-tight ${palette.text}`}>
          {value}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
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
