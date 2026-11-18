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
  Flame, Trophy, Sparkles, ArrowRight, Target, GraduationCap, Zap, Play, Lock, Star, Crown,
} from 'lucide-react';
import { useDailyPractice, masteryBand } from '@/hooks/useDailyPractice';
import { PRACTICE_UNITS, unitsByLevel } from '@/lib/data/practice/general-english';
import {
  PRACTICE_LEVELS, LEVEL_ORDER, STREAK_GRACE_DAYS, daysSince,
  isUnitUnlocked, toStars, STARS_MAX,
  type PracticeLevel, type PracticeUnit, type PracticeProgress,
} from '@/types/practice';

export default function PracticeLandingPage() {
  const { uid, progress, loading, initializeProgress } = useDailyPractice();

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-[#4b3869]/60 text-center py-20 font-semibold">Loading…</p>
      </Shell>
    );
  }

  if (!uid) {
    return (
      <Shell>
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-md border-2 border-[#e5d9f2] p-8 text-center">
          <h2 className="text-2xl font-extrabold text-[#4b3869] mb-2">Sign in to practice</h2>
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
    <div className="min-h-screen bg-grid">
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
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#4b3869] bg-[#e5d9f2] border border-[#e5d9f2] px-3 py-1.5 rounded-full">
          <Sparkles className="w-3 h-3" strokeWidth={2.5} />
          First time here
        </span>
        <h2 className="font-fun text-3xl md:text-4xl font-bold text-[#4b3869] leading-tight tracking-tight">
          Where would you like to start?
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Pick a starting point. You can always jump between units later — your streak counts no matter where you practice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onStartFromScratch}
          className="group text-left game-card rounded-3xl p-6 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#845ec2] to-[#9474c4] text-white flex items-center justify-center text-2xl shadow-md">
            🌱
          </div>
          <h3 className="font-fun text-xl font-bold text-[#4b3869] leading-tight">
            Start from A0
          </h3>
          <p className="text-sm text-slate-500 leading-snug">
            Begin from the very beginning. Greetings, numbers, the basics of English.
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#845ec2] group-hover:gap-2 transition-all">
            Start today <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </p>
        </button>

        <Link
          href="/dashboard/student/placement"
          className="group text-left game-card rounded-3xl p-6 space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-2xl shadow-md">
            🎯
          </div>
          <h3 className="font-fun text-xl font-bold text-[#4b3869] leading-tight">
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

  // Ordered unit ids used for unlock gating. Order matches CEFR + file
  // position: the first A0 unit is always open, every other unit opens
  // once the previous one has ≥2 stars.
  const orderedUnits = useMemo(() => {
    const ordered: PracticeUnit[] = [];
    for (const lvl of levels) {
      for (const u of (grouped[lvl] ?? [])) ordered.push(u);
    }
    return ordered;
  }, [levels, grouped]);
  const orderedUnitIds = useMemo(() => orderedUnits.map(u => u.id), [orderedUnits]);

  const nextUnit: PracticeUnit | null = useMemo(() => {
    // Pick the first unlocked unit the student hasn't passed yet (<2 stars).
    const firstUnlocked = orderedUnits.find(u => {
      if (!isUnitUnlocked(u.id, orderedUnitIds, progress.mastery)) return false;
      return toStars(progress.mastery[u.id]) < 2;
    });
    if (firstUnlocked) return firstUnlocked;
    // Fall back to the stored nextUnitId then the stored level's first unit.
    if (progress.nextUnitId) {
      const picked = PRACTICE_UNITS.find(u => u.id === progress.nextUnitId);
      if (picked) return picked;
    }
    const atLevel = grouped[progress.currentLevel] ?? [];
    return atLevel[0] ?? PRACTICE_UNITS[0] ?? null;
  }, [progress, grouped, orderedUnits, orderedUnitIds]);

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
        <div className="flex items-center gap-1.5 bg-[#f3eefc] px-3 py-1.5 rounded-2xl border border-[#e5d9f2] shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-[#845ec2] text-white flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-[#6b4c9a]">{progress.totalXp.toLocaleString()} XP</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-[#e5d9f2] shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-[#4b3869] text-white flex items-center justify-center text-[10px] font-black">
            {progress.currentLevel}
          </div>
          <span className="text-xs font-bold text-[#4b3869]">{levelTitle(progress.currentLevel)}</span>
        </div>
      </div>

      {/* ── Today's workout hero CTA ─────────────────────── */}
      {nextUnit && (
        <div className="game-card rounded-3xl p-6 md:p-8 relative overflow-hidden bg-gradient-to-r from-[#f3eefc] to-white">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full pointer-events-none"
               style={{ background: 'rgba(132,94,194,0.15)', filter: 'blur(40px)' }} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[#845ec2] text-white flex items-center justify-center text-3xl shadow-md border-2 border-white">
                {nextUnit.icon}
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 bg-[#845ec2] text-white px-3 py-1 rounded-full text-[10px] font-fun font-bold uppercase tracking-wider mb-1.5">
                  <Crown className="w-3 h-3" strokeWidth={2.5} />
                  Today&rsquo;s workout
                </span>
                <h3 className="font-fun text-2xl md:text-3xl font-bold leading-tight tracking-tight text-[#4b3869]">
                  {nextUnit.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {nextUnit.level} · {nextUnit.exercises.length} exercises · {skillLabel(nextUnit.skill)}
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/student/practice/lesson/${nextUnit.id}`}
              className="btn-game inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-fun font-bold text-xs uppercase tracking-wider whitespace-nowrap shadow-md flex-shrink-0 md:self-center"
            >
              <Play className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} />
              Start now 🚀
            </Link>
          </div>
        </div>
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
                <h3 className="font-fun text-lg font-bold text-[#4b3869]">
                  {levelTitle(level)}
                </h3>
                <span className="text-[11px] font-bold text-[#9474c4]/70">
                  {unitsAtLevel.length} {unitsAtLevel.length === 1 ? 'unit' : 'units'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unitsAtLevel.map(u => {
                  const stars  = toStars(progress.mastery[u.id]);
                  const band   = masteryBand(stars);
                  const isNext = nextUnit?.id === u.id;
                  const unlocked = isUnitUnlocked(u.id, orderedUnitIds, progress.mastery);
                  const content = (
                    <>
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl ${unlocked ? 'bg-[#f3eefc] border-[#e5d9f2]' : 'bg-slate-100 border-slate-200 grayscale'}`}>
                        {unlocked ? u.icon : <Lock className="w-5 h-5 text-slate-400" strokeWidth={2.25} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${unlocked ? 'text-[#9474c4]' : 'text-slate-400'}`}>
                            {skillLabel(u.skill)}
                          </p>
                          {unlocked ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${band.color}`}>
                              {band.label}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 inline-flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" strokeWidth={2.5} /> Bloqueada
                            </span>
                          )}
                          {unlocked && stars > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: STARS_MAX }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${i < stars ? 'fill-current' : 'opacity-30'}`}
                                  strokeWidth={0}
                                />
                              ))}
                            </span>
                          )}
                        </div>
                        <p className={`font-fun text-sm font-bold leading-tight ${unlocked ? 'text-[#4b3869]' : 'text-slate-400'}`}>
                          {u.title}
                        </p>
                        <p className={`text-xs mt-0.5 leading-snug ${unlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                          {unlocked ? u.description : 'Terminá la unidad anterior con 2★ o más para desbloquearla.'}
                        </p>
                      </div>
                      {unlocked && (
                        <ArrowRight className="flex-shrink-0 w-4 h-4 text-[#9474c4] mt-1 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                      )}
                    </>
                  );
                  if (!unlocked) {
                    return (
                      <div
                        key={u.id}
                        className="group game-card rounded-3xl p-4 flex items-start gap-3 opacity-80 cursor-not-allowed"
                        aria-disabled="true"
                      >
                        {content}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={u.id}
                      href={`/dashboard/student/practice/lesson/${u.id}`}
                      className={`group game-card rounded-3xl p-4 flex items-start gap-3 ${isNext ? 'border-l-4 border-l-[#845ec2]' : ''}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Footer note ─────────────────────────────────── */}
      <div className="bg-white/70 rounded-2xl border border-dashed border-[#e5d9f2] p-4 text-center">
        <p className="text-[10px] font-black text-[#4b3869]/60 uppercase tracking-[0.25em] mb-1 inline-flex items-center gap-1.5">
          <Target className="w-3 h-3" strokeWidth={2.5} /> Streak policy
        </p>
        <p className="text-xs text-[#4b3869]/70">
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
    violet: { bg: 'bg-gradient-to-br from-[#845ec2] to-[#9474c4]', text: 'text-[#4b3869]' },
    amber:  { bg: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-amber-700'  },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-[#e5d9f2] p-4 flex items-start gap-3 shadow-sm">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${palette.bg} text-white flex items-center justify-center shadow`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#9474c4]/70 mb-0.5">
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
    case 'A0':  return 'border-slate-300 bg-slate-50 text-slate-700';
    case 'A1':  return 'border-sky-300 bg-sky-50 text-sky-700';
    case 'A2':  return 'border-teal-300 bg-teal-50 text-teal-700';
    case 'B1':  return 'border-violet-300 bg-violet-50 text-violet-700';
    case 'B2':  return 'border-rose-300 bg-rose-50 text-rose-700';
    case 'B2+': return 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700';
  }
}

function levelTitle(level: PracticeLevel): string {
  switch (level) {
    case 'A0':  return 'Starter — pre-A1';
    case 'A1':  return 'Beginner';
    case 'A2':  return 'Elementary';
    case 'B1':  return 'Intermediate';
    case 'B2':  return 'Upper-Intermediate';
    case 'B2+': return 'Advanced Intermediate';
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
