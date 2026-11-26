// FriendlyTeaching.cl — Monitoring (Administration)
//
// Teacher-facing snapshot of every student's Daily Practice activity:
// placement completion, session cadence, accuracy trend, grammar
// strengths/gaps. Live subscription — no manual refresh needed.
//
// Two views:
//   · Overview grid — one row per student with the headline metrics so
//     the teacher can spot who's slipping at a glance.
//   · Detail drawer — opens on click, shows the placement per-level +
//     per-topic breakdown, session history (last 50), and lifetime
//     accuracy by CEFR level based on the unit prefix.
//
// Data lives where it already does (practiceProgress,
// dailyPracticePlacement, practiceSessions/{uid}/items). No new writes
// introduced — this page is read-only.

'use client';

import { useMemo, useState } from 'react';
import {
  Activity, X, Target, Flame, Zap, Clock, TrendingUp, TrendingDown, Minus, Search, GraduationCap, CheckCircle2, AlertCircle, ChevronDown, FileText,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useStudents } from '@/hooks/useStudents';
import {
  useStudentMonitoring,
  recentAccuracy, accuracyTrend, daysSinceLastPractice,
  sessionsInWindow, accuracyByPracticeLevel, placementTopicSkills,
} from '@/hooks/useStudentMonitoring';
import { DPP_QUESTIONS } from '@/lib/data/practice/placement-questions';
import type { DPPQuestion } from '@/types/daily-practice-placement';
import type { FTUser } from '@/types/firebase';
import type { PracticeLevel } from '@/types/practice';

const LEVEL_PILL: Record<string, string> = {
  A0: 'bg-slate-100 text-slate-700 border-slate-200',
  A1: 'bg-sky-100 text-sky-700 border-sky-200',
  A2: 'bg-teal-100 text-teal-700 border-teal-200',
  B1: 'bg-violet-100 text-violet-700 border-violet-200',
  'B1+': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B2: 'bg-amber-100 text-amber-700 border-amber-200',
  'B2+': 'bg-orange-100 text-orange-700 border-orange-200',
  C1: 'bg-purple-100 text-purple-700 border-purple-200',
};

const CEFR_ORDER: PracticeLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'B2+', 'C1'];

function pct(n: number) { return `${Math.round(n * 100)}%`; }

export default function MonitoringPage() {
  const { students, loading: studentsLoading } = useStudents();
  const [search, setSearch] = useState('');
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      s.fullName.toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q),
    );
  }, [students, search]);

  const openStudent = useMemo(
    () => students.find((s) => s.uid === openStudentId) ?? null,
    [students, openStudentId],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBF8FF] via-[#F3EEFF] to-[#F9F5FF]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <TopBar
          title="Monitoring"
          subtitle="Live view of Daily Practice activity across your students — placement, streak, accuracy trend."
          breadcrumbs={[
            { label: 'Dashboard',       href: '/dashboard' },
            { label: 'Administration' },
            { label: 'Monitoring' },
          ]}
        />

        {/* Search */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students by name or email…"
              className="w-full pl-9 pr-3 py-2 border border-[#E5D9F2] rounded-xl text-sm bg-white focus:outline-none focus:border-[#9B7CB8]"
            />
          </div>
          <span className="text-[11px] text-slate-500">{filtered.length} / {students.length} students</span>
        </div>

        {/* List */}
        <div className="mt-5 space-y-2">
          {studentsLoading ? (
            <p className="text-sm text-slate-500 text-center py-16">Loading students…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-16">No students match that filter.</p>
          ) : (
            filtered.map((s) => (
              <MonitoringRow key={s.uid} student={s} onOpen={() => setOpenStudentId(s.uid)} />
            ))
          )}
        </div>
      </div>

      {openStudent && (
        <DetailDrawer
          student={openStudent}
          onClose={() => setOpenStudentId(null)}
        />
      )}
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────

function MonitoringRow({ student, onOpen }: { student: FTUser; onOpen: () => void }) {
  const data = useStudentMonitoring(student.uid);
  const level = data.progress?.currentLevel ?? student.studentData?.level ?? '—';
  const streak = data.progress?.currentStreak ?? 0;
  const xp = data.progress?.totalXp ?? 0;
  const acc10 = recentAccuracy(data.sessions, 10);
  const trend = accuracyTrend(data.sessions, 5);
  const last7 = sessionsInWindow(data.sessions, 7);
  const daysAgo = daysSinceLastPractice(data.sessions);
  const placement = data.placement;
  const placementDone = placement?.status === 'completed';

  const Trend =
    trend === null ? Minus
    : trend > 2    ? TrendingUp
    : trend < -2   ? TrendingDown
    : Minus;
  const trendColor =
    trend === null || Math.abs(trend) <= 2 ? 'text-slate-400'
    : trend > 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <button
      onClick={onOpen}
      className="w-full bg-white border border-[#E5D9F2] hover:border-[#9B7CB8] rounded-2xl px-4 py-3 flex items-center gap-4 text-left shadow-sm hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-[#F7EFFF] text-[#5A3D7A] flex items-center justify-center text-sm font-bold flex-shrink-0">
        {student.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#2D1B4E] text-sm truncate">{student.fullName}</p>
        <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
      </div>

      <span className={`hidden sm:inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${LEVEL_PILL[level] ?? LEVEL_PILL.A0}`}>
        {level}
      </span>

      <div className="hidden md:inline-flex items-center gap-1 text-xs text-slate-600 w-24">
        {placementDone
          ? <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle2 className="w-3 h-3" strokeWidth={2.5} /> Placed {placement?.placedLevel}</span>
          : <span className="inline-flex items-center gap-1 text-amber-600"><AlertCircle className="w-3 h-3" strokeWidth={2.5} /> No placement</span>}
      </div>

      <Stat icon={<Flame className="w-3 h-3" strokeWidth={2.5} />} value={`${streak}d`}        label="streak" tone="orange" />
      <Stat icon={<Zap   className="w-3 h-3" strokeWidth={2.5} />} value={xp.toLocaleString()}  label="XP"     tone="violet" />
      <Stat icon={<Target className="w-3 h-3" strokeWidth={2.5} />} value={data.sessions.length === 0 ? '—' : pct(acc10)} label="acc10" tone="emerald" />
      <Stat icon={<Trend className="w-3 h-3" strokeWidth={2.5} />} value={trend === null ? '—' : `${trend > 0 ? '+' : ''}${trend}pp`} label="trend" tone="slate" accent={trendColor} />
      <Stat icon={<Clock className="w-3 h-3" strokeWidth={2.5} />} value={last7.toString()}    label="7d"     tone="sky" />
      <Stat icon={<Clock className="w-3 h-3" strokeWidth={2.5} />} value={
        daysAgo === Infinity ? '—'
        : daysAgo === 0 ? 'today'
        : `${daysAgo}d ago`
      } label="last" tone="slate" />
    </button>
  );
}

function Stat({ icon, value, label, tone, accent }: {
  icon: React.ReactNode; value: string; label: string;
  tone: 'orange' | 'violet' | 'emerald' | 'sky' | 'slate';
  accent?: string;
}) {
  const palette = {
    orange:  'text-orange-600',
    violet:  'text-violet-700',
    emerald: 'text-emerald-700',
    sky:     'text-sky-700',
    slate:   'text-slate-500',
  }[tone];
  return (
    <div className="hidden md:flex flex-col items-end min-w-[52px]">
      <div className={`inline-flex items-center gap-1 text-xs font-bold ${accent ?? palette}`}>
        {icon}{value}
      </div>
      <span className="text-[9px] uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}

// ─── Detail drawer ───────────────────────────────────────────────

function DetailDrawer({ student, onClose }: { student: FTUser; onClose: () => void }) {
  const data = useStudentMonitoring(student.uid);
  const placement = data.placement;
  const perLevelPlacement = placement?.perLevelAccuracy ?? {};
  const perLevelLifetime = accuracyByPracticeLevel(data.sessions);
  const topicSkills = placementTopicSkills(placement);

  // Most-failed topics (placement run) — highlight where the student
  // needs practice right now.
  const topicRows = Object.entries(topicSkills)
    .sort(([, a], [, b]) => a.pct - b.pct)
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-full bg-[#FBF8FF] border-l border-[#E5D9F2] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5D9F2] px-5 py-3 flex items-center gap-3 z-10">
          <GraduationCap className="w-5 h-5 text-[#5A3D7A]" strokeWidth={2.25} />
          <div className="flex-1 min-w-0">
            <p className="font-fun font-bold text-[#3D1F6B] text-base leading-tight truncate">{student.fullName}</p>
            <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border border-[#E5D9F2] text-slate-400 hover:text-[#5A3D7A] hover:bg-[#F7EFFF] inline-flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Headline */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Tile label="Level"   value={data.progress?.currentLevel ?? '—'} tone="violet" />
            <Tile label="Streak"  value={`${data.progress?.currentStreak ?? 0}d`} tone="orange" />
            <Tile label="Total XP" value={(data.progress?.totalXp ?? 0).toLocaleString()} tone="violet" />
            <Tile label="Mastered" value={`${Object.values(data.progress?.mastery ?? {}).filter((s) => s >= 3).length}`} tone="emerald" />
          </section>

          {/* Placement */}
          <section className="bg-white rounded-2xl border border-[#E5D9F2] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#5A3D7A] inline-flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" strokeWidth={2.5} /> Placement test
              </h3>
              <span className="text-[11px] text-slate-500">
                {placement?.status === 'completed' ? `Completed · ${placement.answers?.length ?? 0} answers`
                : placement?.status === 'in_progress' ? `In progress · ${placement.answers?.length ?? 0} answers`
                : placement?.status === 'paused' ? `Paused · ${placement.answers?.length ?? 0} answers`
                : 'Not taken yet'}
              </span>
            </div>
            {placement ? (
              <>
                <div className="grid grid-cols-7 gap-1 text-[10px] mb-3">
                  {CEFR_ORDER.map((lvl) => {
                    const r = perLevelPlacement[lvl];
                    const hit = !!r && r.answered > 0;
                    const p = r ? Math.round(r.pct * 100) : 0;
                    return (
                      <div key={lvl} className={`rounded-xl p-2 text-center border ${hit ? 'border-[#C8A8DC] bg-[#F7EFFF]' : 'border-slate-100 bg-white text-slate-300'}`}>
                        <p className="font-black">{lvl}</p>
                        <p className="text-[10px]">{hit ? `${p}%` : '—'}</p>
                        {hit && <p className="text-[9px] text-slate-400 mt-0.5">{r!.correct}/{r!.answered}</p>}
                      </div>
                    );
                  })}
                </div>
                {topicRows.length > 0 && (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Weakest grammar topics (this run)</p>
                    <div className="space-y-1">
                      {topicRows.map(([topic, r]) => (
                        <div key={topic} className="flex items-center gap-2 text-xs">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${LEVEL_PILL[r.level] ?? LEVEL_PILL.A0}`}>{r.level}</span>
                          <span className="flex-1 min-w-0 truncate text-slate-700">{topic}</span>
                          <span className={`font-bold ${r.pct < 0.5 ? 'text-rose-600' : r.pct < 0.75 ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {Math.round(r.pct * 100)}%
                          </span>
                          <span className="text-[10px] text-slate-400 w-10 text-right">{r.correct}/{r.answered}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500">The student has not taken the placement test yet.</p>
            )}
          </section>

          {/* Full answer-by-answer review */}
          {placement && (placement.answers?.length ?? 0) > 0 && (
            <PlacementAnswerReview placement={placement} />
          )}

          {/* Lifetime accuracy by level */}
          <section className="bg-white rounded-2xl border border-[#E5D9F2] p-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#5A3D7A] inline-flex items-center gap-1.5 mb-3">
              <Activity className="w-3.5 h-3.5" strokeWidth={2.5} /> Lifetime accuracy by level
            </h3>
            {Object.keys(perLevelLifetime).length === 0 ? (
              <p className="text-xs text-slate-500">No practice sessions yet.</p>
            ) : (
              <div className="grid grid-cols-7 gap-1 text-[10px]">
                {CEFR_ORDER.map((lvl) => {
                  const r = perLevelLifetime[lvl];
                  const hit = !!r && r.answered > 0;
                  const p = r ? Math.round(r.pct * 100) : 0;
                  return (
                    <div key={lvl} className={`rounded-xl p-2 text-center border ${hit ? 'border-[#C8A8DC] bg-[#F7EFFF]' : 'border-slate-100 bg-white text-slate-300'}`}>
                      <p className="font-black">{lvl}</p>
                      <p>{hit ? `${p}%` : '—'}</p>
                      {hit && <p className="text-[9px] text-slate-400 mt-0.5">{r!.correct}/{r!.answered}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Session history */}
          <section className="bg-white rounded-2xl border border-[#E5D9F2] p-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#5A3D7A] inline-flex items-center gap-1.5 mb-3">
              <Clock className="w-3.5 h-3.5" strokeWidth={2.5} /> Session history ({data.sessions.length})
            </h3>
            {data.sessions.length === 0 ? (
              <p className="text-xs text-slate-500">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {data.sessions.map((s) => {
                  const d = (s.completedAt as unknown as { toDate?: () => Date })?.toDate?.();
                  const when = d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : s.date;
                  return (
                    <div key={s.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-slate-50">
                      <span className="text-[10px] text-slate-400 w-28 flex-shrink-0">{when}</span>
                      <span className="flex-1 min-w-0 truncate text-slate-700 font-mono text-[11px]">{s.unitId}</span>
                      <span className="text-[10px] text-slate-500 w-14 text-right">{s.correctCount}/{s.totalCount}</span>
                      <span className={`text-[11px] font-bold w-10 text-right ${s.accuracy < 0.5 ? 'text-rose-600' : s.accuracy < 0.7 ? 'text-amber-600' : s.accuracy < 0.9 ? 'text-sky-700' : 'text-emerald-700'}`}>
                        {Math.round(s.accuracy * 100)}%
                      </span>
                      <span className="text-[10px] text-[#845ec2] w-10 text-right">+{s.xpEarned}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Placement answer-by-answer review ──────────────────────────
//
// For each answered question in the placement run: render the full
// question text, the student's pick (red if wrong), and the correct
// alternative (always shown green with a "+" chip). Looks up the
// question text / options from the DPP pool by id. Collapsed by
// default to avoid overwhelming the drawer; opens with filters for
// "Wrong only" so the teacher can zero in on gaps.

interface PlacementAnswerReviewProps {
  placement: { answers?: { questionId: string; level: string; topic: string; pickedIndex: number; correct: boolean }[] };
}

function PlacementAnswerReview({ placement }: PlacementAnswerReviewProps) {
  const [open, setOpen] = useState(false);
  const [wrongOnly, setWrongOnly] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const answers = placement.answers ?? [];
  const correctCount = answers.filter((a) => a.correct).length;

  // Build a stable lookup from questionId → question. The pool is
  // small (~210 items) so a Map is both fast and memory-cheap. Memoised
  // across renders.
  const pool = useMemo(() => {
    const m = new Map<string, DPPQuestion>();
    for (const q of DPP_QUESTIONS) m.set(q.id, q);
    return m;
  }, []);

  const filtered = useMemo(() => {
    return answers.filter((a) => {
      if (wrongOnly && a.correct) return false;
      if (levelFilter !== 'all' && a.level !== levelFilter) return false;
      return true;
    });
  }, [answers, wrongOnly, levelFilter]);

  const levelsSeen = useMemo(() => {
    const set = new Set<string>();
    for (const a of answers) set.add(a.level);
    return CEFR_ORDER.filter((l) => set.has(l));
  }, [answers]);

  return (
    <section className="bg-white rounded-2xl border border-[#E5D9F2] p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-[#5A3D7A] inline-flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" strokeWidth={2.5} /> Placement — answer review
          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#F7EFFF] text-[#5A3D7A] text-[10px] font-black tabular-nums">
            {correctCount}/{answers.length}
          </span>
        </h3>
        <ChevronDown className={`w-4 h-4 text-[#5A3D7A] transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      {open && (
        <>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setWrongOnly((v) => !v)}
              className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-colors ${
                wrongOnly
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-600'
              }`}
            >
              {wrongOnly ? '✓ Wrong only' : 'Wrong only'}
            </button>
            <div className="inline-flex items-center gap-1 ml-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Level</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="text-[11px] font-semibold text-[#5A3D7A] bg-white border border-[#E5D9F2] rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              >
                <option value="all">All</option>
                {levelsSeen.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500 text-center py-4">
              {wrongOnly ? 'No wrong answers at this filter.' : 'No answers at this filter.'}
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {filtered.map((a, i) => {
                const q = pool.get(a.questionId);
                const pickedLabel = q?.options[a.pickedIndex] ?? `Option ${a.pickedIndex + 1}`;
                const correctLabel = q?.options[q.correct] ?? '—';
                return (
                  <div key={`${a.questionId}-${i}`} className={`rounded-xl border p-3 text-xs ${a.correct ? 'border-emerald-100 bg-emerald-50/40' : 'border-rose-100 bg-rose-50/40'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${LEVEL_PILL[a.level] ?? LEVEL_PILL.A0}`}>{a.level}</span>
                      <span className="text-[10px] text-slate-500 flex-1 min-w-0 truncate">{a.topic}</span>
                      {a.correct ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" strokeWidth={2.5} /> Wrong
                        </span>
                      )}
                    </div>
                    {q ? (
                      <>
                        <p className="text-[13px] text-[#2D1B4E] font-semibold leading-snug mb-2">{q.prompt}</p>
                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-16 flex-shrink-0 pt-0.5">Student</span>
                            <span className={`flex-1 text-[12px] ${a.correct ? 'text-emerald-800 font-semibold' : 'text-rose-700 line-through decoration-rose-400/70 font-semibold'}`}>
                              {pickedLabel}
                            </span>
                          </div>
                          {!a.correct && (
                            <div className="flex items-start gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-16 flex-shrink-0 pt-0.5">Correct</span>
                              <span className="flex-1 text-[12px] text-emerald-800 font-bold">
                                {correctLabel}
                              </span>
                            </div>
                          )}
                        </div>
                        {q.explain && (
                          <p className="mt-2 text-[11px] text-[#5A3D7A] bg-[#F7EFFF] border border-[#E5D9F2] rounded-lg px-2.5 py-1.5 leading-snug">
                            <strong className="font-bold">Why:</strong> {q.explain}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Question <code className="text-[10px]">{a.questionId}</code> is no longer in the pool — showing picked index {a.pickedIndex} only.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: 'violet' | 'orange' | 'emerald' | 'sky' }) {
  const palette = {
    violet:  { bg: 'bg-gradient-to-br from-[#845ec2] to-[#9474c4]', text: 'text-[#4b3869]' },
    orange:  { bg: 'bg-gradient-to-br from-orange-400 to-rose-500', text: 'text-rose-700' },
    emerald: { bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600', text: 'text-emerald-700' },
    sky:     { bg: 'bg-gradient-to-br from-sky-400 to-sky-600', text: 'text-sky-700' },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-[#E5D9F2] p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-xl font-extrabold ${palette.text} leading-none mt-1`}>{value}</p>
      <div className={`mt-2 h-1 rounded-full ${palette.bg}`} />
    </div>
  );
}
