// FriendlyTeaching.cl — Student gamified board
//
// Shared surface used by both /dashboard/profile and /dashboard/student.
// Previously inline in the profile page; extracted so the student
// dashboard can present the same look + feel without duplicating ~350
// lines. Takes optional slots so each host can inject its own blocks
// (e.g. Next Lesson card, Word of the Day) into the flow without
// forking the layout.
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  CalendarDays, Crown, Flame, Headphones, PenTool, CheckCircle2,
  Play, Target, Timer, GraduationCap, Star, TrendingUp, Zap,
} from 'lucide-react';
import { xpForNextLevel, getTodayStr } from '@/lib/utils/gamification';
import { LevelTimeline } from '@/components/students/LevelTimeline';
import { SkillRadarChart } from '@/components/students/SkillRadarChart';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import type {
  LessonLevel, Progress, SkillScores, LevelHistoryEntry, StudentGamification,
} from '@/types/firebase';

const LEVEL_LABELS: Record<LessonLevel, string> = {
  A0: 'A0 — Absolute beginner',
  A1: 'A1 — Beginner',
  A2: 'A2 — Elementary',
  B1: 'B1 — Intermediate',
  'B1+': 'B1+ — Upper intermediate',
  B2: 'B2 — Advanced intermediate',
  C1: 'C1 — Advanced',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatDuration(mins?: number) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function todayCompletedLessons(progress: Progress[]): number {
  const today = startOfDay(new Date()).getTime();
  const tomorrow = today + 86400000;
  return progress.filter((p) => {
    if (p.status !== 'completed') return false;
    const t = p.startedAt?.toDate?.().getTime() ?? 0;
    return t >= today && t < tomorrow;
  }).length;
}

function weekdayGrid(gamification: StudentGamification | null): boolean[] {
  // Marks the last 7 days (Mon–Sun of current week) as active based on
  // currentStreak + lastActivityDate. We only know the student was
  // active today; everything else is inferred from the streak length.
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7;
  const active: boolean[] = Array(7).fill(false);
  if (!gamification) return active;
  const todayStr = getTodayStr();
  const wasToday = gamification.lastActivityDate === todayStr;
  const streak = gamification.currentStreak ?? 0;
  if (!wasToday && streak === 0) return active;
  let cursor = wasToday ? dayIdx : dayIdx - 1;
  let left = streak + (wasToday ? 0 : 0);
  while (cursor >= 0 && left > 0) {
    active[cursor] = true;
    cursor -= 1;
    left -= 1;
  }
  return active;
}

function timeUntilMidnightLabel(): string {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  const diff = Math.max(0, mid.getTime() - now.getTime());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export interface StudentGamifiedBoardProps {
  firstName: string;
  email: string;
  level: LessonLevel | undefined;
  memberSince: string | null;
  gamification: StudentGamification | null;
  progress: Progress[];
  skillScores: SkillScores | null;
  levelHistory: LevelHistoryEntry[];
  /** Optional block rendered right after the welcome hero. Perfect for
   *  the student dashboard's Next Lesson card. */
  afterHeroSlot?: ReactNode;
  /** Optional block rendered between the stats strip and the CEFR / Skills
   *  section. The dashboard uses it for the Word of the Day. */
  beforeSkillsSlot?: ReactNode;
}

export default function StudentGamifiedBoard({
  firstName, email, level, memberSince, gamification,
  progress, skillScores, levelHistory,
  afterHeroSlot, beforeSkillsSlot,
}: StudentGamifiedBoardProps) {
  const [resetLabel, setResetLabel] = useState(timeUntilMidnightLabel);
  useEffect(() => {
    const id = window.setInterval(() => setResetLabel(timeUntilMidnightLabel()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const totalXp = gamification?.totalXp ?? 0;
  const playerLevel = gamification?.level ?? 1;
  const { current: levelXp, needed: levelNeeded, progress: levelProgress } = xpForNextLevel(totalXp);
  const xpToNext = Math.max(0, levelNeeded - levelXp);

  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const todayStr = getTodayStr();
  const wasActiveToday = gamification?.lastActivityDate === todayStr;

  const completed = progress.filter((p) => p.status === 'completed');
  const uniqueLessons = new Set(completed.map((p) => p.lessonId)).size;
  const totalMinutes = completed.reduce((acc, p) => acc + (p.duration ?? 0), 0);
  const scores = completed.map((p) => p.overallScore).filter((s): s is number => typeof s === 'number');
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

  const todayLessons = todayCompletedLessons(progress);
  const loggedInToday = wasActiveToday;
  const wordDoneToday = wasActiveToday && (gamification?.wordStreak ?? 0) > 0;
  const lessonDoneToday = todayLessons > 0;

  const missions: {
    key: string; title: string; icon: ReactNode; xp: number;
    done: boolean; pct: number; tone: string;
  }[] = [
    { key: 'login',  title: 'Open FriendlyTeaching today', icon: <CheckCircle2 className="w-5 h-5" strokeWidth={2.25} />, xp: 5,  done: loggedInToday,   pct: loggedInToday ? 100 : 0,   tone: 'emerald' },
    { key: 'word',   title: "Submit today's Word of the Day", icon: <PenTool className="w-5 h-5" strokeWidth={2.25} />,     xp: 15, done: wordDoneToday,   pct: wordDoneToday ? 100 : 0,   tone: 'ft' },
    { key: 'lesson', title: 'Complete 1 lesson today',    icon: <Headphones className="w-5 h-5" strokeWidth={2.25} />,     xp: 25, done: lessonDoneToday, pct: lessonDoneToday ? 100 : 0, tone: 'amber' },
  ];

  const weekGrid = weekdayGrid(gamification);
  const levelLabel = level ? `${level} · ${LEVEL_LABELS[level].split('—')[1]?.trim() ?? ''}` : 'Level pending';

  return (
    <>
      {/* ── Header stat badges ──────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 mb-4">
        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-amber-700">
            {currentStreak} day{currentStreak === 1 ? '' : 's'} streak
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#f3eefc] px-3 py-1.5 rounded-2xl border border-[#e5d9f2] shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-[#845ec2] text-white flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-[#6b4c9a]">{totalXp.toLocaleString()} XP total</span>
        </div>
      </div>

      {/* ── Welcome hero ─────────────────────────────────────── */}
      <div
        className="game-card rounded-3xl p-6 md:p-8 relative overflow-hidden mb-6"
        style={{ background: 'linear-gradient(to right, #ffffff, #fcfbfe, #f3eefc)' }}
      >
        <div
          className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(236, 227, 247, 0.5)', filter: 'blur(32px)' }}
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#e5d9f2]/80 px-3 py-1 rounded-full text-[#4b3869] text-xs font-extrabold">
              <Crown className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.25} />
              <span>Level {playerLevel}{level ? ` — ${levelLabel.split(' · ').slice(1).join(' · ') || level}` : ''}</span>
            </div>
            <h1 className="font-fun text-2xl md:text-4xl font-bold text-[#4b3869] tracking-tight">
              Hi, {firstName}! <span>🚀</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-lg">
              {currentStreak > 0
                ? `Finish your daily missions to keep the streak alive and climb this week's league.`
                : `Finish your daily missions to start your streak and climb this week's league.`}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 text-[11px] text-slate-400 pt-1">
              <span className="truncate">{email}</span>
              {memberSince && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" strokeWidth={2.25} /> Since {memberSince}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border-2 border-[#e5d9f2] shadow-md flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-16 h-16 flex items-center justify-center bg-[#f3eefc] rounded-2xl text-[#845ec2] font-extrabold text-xl border-2 border-[#e5d9f2]">
              {Math.round(levelProgress * 100)}%
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Level progress</span>
              <span className="text-sm font-extrabold text-[#4b3869]">{levelXp} / {levelNeeded} XP</span>
              <span className="text-xs font-semibold text-[#9474c4] block mt-0.5">
                {xpToNext > 0 ? `Only ${xpToNext} XP to Level ${playerLevel + 1}!` : 'Level up pending next activity'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dashboard-only block (e.g. Next Lesson) ─────────── */}
      {afterHeroSlot && <div className="mb-5">{afterHeroSlot}</div>}

      {/* ── Daily missions + streak ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-fun font-bold text-[#4b3869] text-lg inline-flex items-center gap-2">
              <Target className="w-4 h-4 text-[#845ec2]" strokeWidth={2.25} />
              Daily missions
            </h3>
            <span className="text-xs font-bold text-slate-400">Resets in {resetLabel}</span>
          </div>

          {missions.map((m) => {
            const toneMap: Record<string, { leftBar: string; iconBg: string; iconFg: string; chipBg: string; chipFg: string; bar: string }> = {
              emerald: { leftBar: 'border-l-emerald-500', iconBg: 'bg-emerald-100', iconFg: 'text-emerald-600', chipBg: 'bg-emerald-50 border-emerald-200', chipFg: 'text-emerald-700', bar: 'bg-emerald-500' },
              ft:      { leftBar: 'border-l-[#845ec2]',  iconBg: 'bg-[#f3eefc]',  iconFg: 'text-[#845ec2]',  chipBg: 'bg-[#f3eefc] border-[#e5d9f2]', chipFg: 'text-[#845ec2]', bar: 'bg-[#845ec2]' },
              amber:   { leftBar: 'border-l-amber-500',  iconBg: 'bg-amber-100',  iconFg: 'text-amber-600',   chipBg: 'bg-amber-50 border-amber-200', chipFg: 'text-amber-700', bar: 'bg-amber-500' },
            };
            const t = toneMap[m.tone];
            return (
              <div key={m.key} className={`game-card rounded-2xl p-4 flex items-center justify-between border-l-4 ${t.leftBar}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl ${t.iconBg} ${t.iconFg} flex items-center justify-center flex-shrink-0`}>
                    {m.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-fun font-bold text-[#4b3869] text-sm truncate">{m.title}</h4>
                    <div className="w-40 sm:w-56 bg-[#f3eefc] h-2 rounded-full mt-1.5 overflow-hidden border border-[#e5d9f2]">
                      <div className={`${t.bar} h-full rounded-full transition-all`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className={`text-[11px] font-fun font-bold px-2.5 py-1 rounded-xl border ${t.chipBg} ${t.chipFg}`}>
                    {m.done ? 'Done!' : `+${m.xp} XP`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div
            className="game-card rounded-3xl p-6 text-center border-amber-300 shadow-md"
            style={{ background: 'linear-gradient(to bottom, rgba(254, 243, 199, 0.5), #ffffff)', boxShadow: '0 4px 0 0 #fcd34d' }}
          >
            <div className={`w-16 h-16 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30 ${currentStreak > 0 ? 'animate-bounce' : ''}`}>
              <Flame className="w-8 h-8" strokeWidth={2.25} />
            </div>
            <h3 className="font-fun text-2xl font-bold text-amber-800 leading-tight">
              {currentStreak} day{currentStreak === 1 ? '' : 's'} streak
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-snug">
              {wasActiveToday
                ? 'Today is already counted. See you tomorrow!'
                : currentStreak > 0
                  ? "Study today so you don't lose the flame."
                  : 'Finish one mission today to light the flame.'}
            </p>
            <div className="mt-5 pt-4 border-t border-amber-200 grid grid-cols-7 gap-1 text-[10px] font-bold">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className={`p-1 rounded-lg ${weekGrid[i] ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                >
                  {d}
                </div>
              ))}
            </div>
            {longestStreak > 0 && (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-amber-600/80">
                Best · {longestStreak} days
              </p>
            )}
          </div>

          <Link
            href="/dashboard/student/practice"
            className="btn-game w-full py-4 font-fun font-bold rounded-2xl text-sm flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Play className="w-3.5 h-3.5 fill-current" strokeWidth={2.25} />
            Continue practice
          </Link>
        </div>
      </div>

      {/* ── Learning stats strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total XP',          value: totalXp.toLocaleString(),      Icon: Zap,            color: 'text-[#845ec2]' },
          { label: 'Completed lessons', value: uniqueLessons,                 Icon: GraduationCap,  color: 'text-emerald-600' },
          { label: 'Total time',        value: formatDuration(totalMinutes),  Icon: Timer,          color: 'text-blue-600' },
          { label: 'Avg. grade',        value: avgScore ?? '—',               Icon: Star,           color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="game-card rounded-2xl p-4 text-center">
            <div className={`mb-0.5 flex justify-center ${s.color}`}><s.Icon className="w-5 h-5" strokeWidth={2.25} /></div>
            <p className={`font-fun text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Dashboard-only block (e.g. Word of the Day) ─────── */}
      {beforeSkillsSlot && <div className="mb-5">{beforeSkillsSlot}</div>}

      {/* ── Skills radar + CEFR timeline ─────────────────────── */}
      {(skillScores || level) && (
        <div className="game-card rounded-2xl overflow-hidden mb-5">
          <div className="px-4 pt-4 pb-2">
            <p className="font-fun font-bold text-[#4b3869] text-sm inline-flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#845ec2]" strokeWidth={2.25} /> My English progress
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#e5d9f2]">
            {level && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">CEFR level</p>
                <LevelTimeline history={levelHistory} currentLevel={level} />
              </div>
            )}
            {skillScores && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Skills</p>
                <SkillRadarChart scores={skillScores} compact />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Badges ───────────────────────────────────────────── */}
      {gamification && gamification.badges.length > 0 && (
        <div className="mb-5">
          <BadgeGrid earnedBadges={gamification.badges} />
        </div>
      )}
    </>
  );
}
