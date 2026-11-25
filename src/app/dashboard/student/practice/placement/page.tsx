// FriendlyTeaching.cl — Daily Practice: adaptive placement runner
//
// Three visual states, all styled to match the Daily Practice look
// (game-card, font-fun headings, soft purple palette, trophy motif):
//   1. Intro — gamified hero with Start / Resume options + stats
//   2. Runner — one question at a time, progress bar, pause button
//   3. Result — placed level + "Start Daily Practice at X" CTA

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import {
  Trophy, ArrowRight, ArrowLeft, Pause, Target, Check, X, PartyPopper,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDailyPracticePlacement } from '@/hooks/useDailyPracticePlacement';
import {
  pickNextQuestion, shouldStop,
} from '@/lib/placement/adaptiveRunner';
import { DPP_CONFIG } from '@/types/daily-practice-placement';
import type { DPPQuestion } from '@/types/daily-practice-placement';

export default function PlacementPage() {
  const { firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const {
    session, loading, isInProgress, isPaused, isCompleted,
    startNew, submitAnswer, pause, complete, pool,
  } = useDailyPracticePlacement(uid);

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
        <Card>
          <p className="text-sm text-slate-500 text-center">Sign in to take the placement.</p>
        </Card>
      </Shell>
    );
  }

  if (isCompleted) {
    return <Shell><ResultView session={session!} onRestart={() => startNew()} /></Shell>;
  }
  if (isInProgress || isPaused) {
    // Seed the question picker with uid + startedAt so every retake
    // gets a different (but within-session stable) order. Without a
    // seed the selector is deterministic and students can memorise
    // the fixed trail across attempts.
    const startedAtMs = (() => {
      const s = session?.startedAt as unknown;
      if (s && typeof s === 'object' && 'toMillis' in s && typeof (s as { toMillis: () => number }).toMillis === 'function') {
        return (s as { toMillis: () => number }).toMillis();
      }
      return 0;
    })();
    const seed = `${uid}:${startedAtMs}`;
    return (
      <Shell>
        <RunnerView
          pool={pool}
          seed={seed}
          session={session!}
          onAnswer={submitAnswer}
          onPause={pause}
          onFinish={complete}
        />
      </Shell>
    );
  }
  return <Shell><IntroView existingPlacedLevel={session?.placedLevel} onStart={startNew} /></Shell>;
}

// ── Shell: matches /practice layout ────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-grid p-4 md:p-6">
      <div className="max-w-5xl mx-auto bg-white/85 backdrop-blur-sm rounded-3xl border border-[#e5d9f2] shadow-[0_18px_48px_-24px_rgba(90,61,122,0.35)] p-6 md:p-8">
        <TopBar
          title="Placement Test"
          subtitle="Find out your grammar level — adaptive, resumable, under 20 minutes."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Daily Practice', href: '/dashboard/student/practice' },
            { label: 'Placement' },
          ]}
        />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border-2 border-[#e5d9f2] p-6 md:p-8 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── Intro view ─────────────────────────────────────────────

function IntroView({ existingPlacedLevel, onStart }: {
  existingPlacedLevel: string | undefined;
  onStart: () => Promise<void>;
}) {
  const [starting, setStarting] = useState(false);

  async function go() {
    setStarting(true);
    try { await onStart(); } finally { setStarting(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#4b3869] bg-[#e5d9f2] border border-[#e5d9f2] px-3 py-1.5 rounded-full">
          <Trophy className="w-3 h-3" strokeWidth={2.5} />
          Adaptive · grammar only
        </span>
        <h2 className="font-fun text-3xl md:text-4xl font-bold text-[#4b3869] leading-tight tracking-tight">
          Find your real level
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Up to {DPP_CONFIG.MAX_QUESTIONS} questions, but most students finish in under 25. The test gets harder or easier depending on your answers — and you can pause anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatTile icon="🎯" title={`${DPP_CONFIG.MAX_QUESTIONS} questions`} sub="hard cap — usually fewer" />
        <StatTile icon="⏱️" title="~15–20 min" sub="save and continue later" />
        <StatTile icon="🪜" title="A0 → C1" sub="covers the full ladder" />
      </div>

      <button
        onClick={go}
        disabled={starting}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#845ec2] to-[#5A3D7A] text-white rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-shadow disabled:opacity-50"
      >
        {starting ? 'Starting…' : existingPlacedLevel ? 'Retake the placement' : 'Start placement'}
        <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {existingPlacedLevel && (
        <p className="text-center text-xs text-slate-500">
          You’re currently placed at <strong className="text-[#4b3869]">{existingPlacedLevel}</strong>. Retaking the test overwrites this.
        </p>
      )}

      <div className="text-center">
        <Link href="/dashboard/student/practice" className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A]">
          ← Back to Daily Practice
        </Link>
      </div>
    </div>
  );
}

function StatTile({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="game-card rounded-2xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-sm font-bold text-[#4b3869] leading-tight">{title}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

// ── Runner view ────────────────────────────────────────────

function RunnerView({ pool, seed, session, onAnswer, onPause, onFinish }: {
  pool: DPPQuestion[];
  seed: string;
  session: {
    answers: { questionId: string; level: string; topic: string; pickedIndex: number; correct: boolean }[];
    currentLevelEstimate: string;
    status: string;
  };
  onAnswer: (a: { questionId: string; level: 'A0'|'A1'|'A2'|'B1'|'B2'|'B2+'|'C1'; topic: string; pickedIndex: number; correct: boolean; elapsedMs: number }) => Promise<void>;
  onPause: () => Promise<void>;
  // complete() returns the placed level + first unit; we don't read it
  // here (the hook also writes practiceProgress), so widen the prop.
  onFinish: () => Promise<unknown>;
}) {
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const question = useMemo(() => {
    const normalisedAnswers = session.answers.map((a) => ({
      ...a, level: a.level as 'A0'|'A1'|'A2'|'B1'|'B2'|'B2+'|'C1',
    }));
    return pickNextQuestion(normalisedAnswers, pool, seed);
  }, [session.answers, pool, seed]);

  // Reset local UI state for every new question.
  useEffect(() => {
    setPickedIndex(null);
    setRevealed(false);
    setStartedAt(Date.now());
  }, [question?.id]);

  // When the engine decides we're done, flip the session to completed.
  useEffect(() => {
    const normalised = session.answers.map((a) => ({
      ...a, level: a.level as 'A0'|'A1'|'A2'|'B1'|'B2'|'B2+'|'C1',
    }));
    if (shouldStop(normalised, pool, seed)) {
      void onFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.answers.length]);

  if (!question) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <p className="text-sm text-slate-500">Wrapping up…</p>
      </Card>
    );
  }

  const answered = session.answers.length;
  const cap      = DPP_CONFIG.MAX_QUESTIONS;
  const pct      = Math.min(100, Math.round((answered / cap) * 100));

  async function reveal() {
    if (pickedIndex === null || submitting || !question) return;
    setSubmitting(true);
    try {
      const correct = pickedIndex === question.correct;
      setRevealed(true);
      await onAnswer({
        questionId:  question.id,
        level:       question.level,
        topic:       question.topic,
        pickedIndex,
        correct,
        elapsedMs:   Date.now() - startedAt,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress + estimate chip + pause */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="h-2 bg-[#e5d9f2] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#845ec2] to-[#5A3D7A] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Question {answered + 1} · estimate so far: <strong className="text-[#4b3869]">{session.currentLevelEstimate}</strong>
          </p>
        </div>
        <button
          onClick={() => onPause()}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A3D7A] bg-white border border-[#e5d9f2] px-3 py-1.5 rounded-full hover:bg-[#F7EFFF] transition-colors"
        >
          <Pause className="w-3 h-3" strokeWidth={2.5} /> Pause
        </button>
        <FullscreenButton
          variant="inline"
          className="!w-9 !h-9 !rounded-full flex-shrink-0"
        />
      </div>

      <Card>
        {/* Only the level chip — topic names the grammar structure under
            test (e.g. "modals (should)") and often outright spoils the
            answer ("should"). Topics stay in the answer payload we write
            to Firestore so the teacher analytics still see per-topic
            accuracy; they just don't show up during the test itself. */}
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9B7CB8] mb-2">
          {question.level}
        </p>
        <p className="font-fun text-xl md:text-2xl font-bold text-[#4b3869] leading-snug mb-5">
          {question.prompt}
        </p>

        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const isPicked = pickedIndex === i;
            const isRight  = question.correct === i;
            const className = (() => {
              const base = 'w-full text-left px-4 py-3 rounded-2xl border-2 transition-colors text-sm';
              if (!revealed) {
                return `${base} ${isPicked
                  ? 'border-[#5A3D7A] bg-[#F7EFFF] text-[#4b3869]'
                  : 'border-[#e5d9f2] hover:border-[#C8A8DC] text-[#4b3869]'}`;
              }
              if (isRight)   return `${base} border-emerald-400 bg-emerald-50 text-emerald-900`;
              if (isPicked)  return `${base} border-rose-300    bg-rose-50    text-rose-900`;
              return `${base} border-[#e5d9f2] text-slate-500`;
            })();
            return (
              <button
                key={i}
                onClick={() => !revealed && setPickedIndex(i)}
                disabled={revealed}
                className={className}
              >
                <span className="font-black mr-2 text-[#9B7CB8]">{String.fromCharCode(65 + i)}.</span>
                {opt}
                {revealed && isRight  && <Check className="float-right w-4 h-4 text-emerald-600" strokeWidth={2.5} />}
                {revealed && !isRight && isPicked && <X className="float-right w-4 h-4 text-rose-500" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        {revealed && question.explain && (
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 leading-snug">
            <strong>Why:</strong> {question.explain}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {!revealed ? (
            <button
              onClick={reveal}
              disabled={pickedIndex === null || submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#5A3D7A] hover:bg-[#3D1F6B] text-white rounded-full font-bold text-sm disabled:opacity-50 transition-colors"
            >
              Submit answer
            </button>
          ) : (
            <button
              onClick={() => { setRevealed(false); setPickedIndex(null); }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#845ec2] to-[#5A3D7A] text-white rounded-full font-bold text-sm transition-shadow shadow-sm hover:shadow-md"
            >
              Next question <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Result view ────────────────────────────────────────────

function ResultView({ session, onRestart }: {
  session: {
    placedLevel?: string;
    answers: unknown[];
    perLevelAccuracy?: Partial<Record<string, { answered: number; correct: number; pct: number }>>;
  };
  onRestart: () => Promise<void>;
}) {
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);
  async function restart() {
    setRestarting(true);
    try {
      await onRestart();
      // start fresh: force runner view to reload
      router.refresh();
    } finally { setRestarting(false); }
  }
  const level = session.placedLevel ?? '—';
  const total = session.answers.length;

  return (
    <div className="max-w-xl mx-auto text-center space-y-5">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-[#845ec2] to-[#5A3D7A] text-white shadow-lg">
        <PartyPopper className="w-8 h-8" strokeWidth={2.25} />
      </div>
      <h2 className="font-fun text-4xl md:text-5xl font-extrabold text-[#4b3869] tracking-tight">
        You’re at {level}!
      </h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        Based on {total} question{total === 1 ? '' : 's'}. We’ve set your Daily Practice starting level to <strong className="text-[#4b3869]">{level}</strong>.
      </p>

      {session.perLevelAccuracy && (
        <div className="grid grid-cols-7 gap-1 max-w-md mx-auto text-[10px]">
          {(['A0','A1','A2','B1','B2','B2+','C1'] as const).map((lvl) => {
            const r = session.perLevelAccuracy?.[lvl];
            const pct = r ? Math.round(r.pct * 100) : 0;
            const hit = !!r && r.answered > 0;
            return (
              <div key={lvl} className={`rounded-xl p-2 border ${hit ? 'border-[#C8A8DC] bg-[#F7EFFF]' : 'border-slate-100 bg-white text-slate-300'}`}>
                <p className="font-black">{lvl}</p>
                <p>{hit ? `${pct}%` : '—'}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Link
          href="/dashboard/student/practice"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#845ec2] to-[#5A3D7A] text-white rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-shadow"
        >
          <Target className="w-5 h-5" strokeWidth={2.5} />
          Start Daily Practice at {level}
          <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
        </Link>
        <button
          onClick={restart}
          disabled={restarting}
          className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] disabled:opacity-50"
        >
          <ArrowLeft className="inline w-3 h-3 mr-1" strokeWidth={2.5} />
          {restarting ? 'Resetting…' : 'Retake the placement'}
        </button>
      </div>
    </div>
  );
}
