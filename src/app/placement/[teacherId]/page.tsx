'use client';
// FriendlyTeaching.cl — Public Grammar Placement Test
// URL: /placement/[teacherId]  — no login required

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  collection, doc, setDoc, updateDoc,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PLACEMENT_QUESTIONS } from '@/data/placementQuestions';
import {
  computeSectionScores,
  determineLevel,
  computeWeakAreas,
  generateLearningProgram,
  shouldStopTest,
  MAX_CONSECUTIVE_ERRORS,
} from '@/lib/placementScoring';
import type { PlacementAnswer } from '@/types/placement';

type Step = 'landing' | 'instructions' | 'test' | 'done';

const B = {
  purple:      '#5A3D7A',
  purpleDark:  '#3D2558',
  purpleMed:   '#9B7CB8',
  purpleLight: '#C8A8DC',
  lavender:    '#F0E5FF',
  lavenderDark:'#E0D5FF',
};

// ── Shared decorative background ───────────────────────────────
function PageBg({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #EDE8FF 0%, #E0D5FF 45%, #F0E5FF 100%)' }}
    >
      <div className="absolute pointer-events-none" style={{
        width: 480, height: 480, borderRadius: '50%',
        background: 'rgba(155,124,184,0.18)', filter: 'blur(60px)',
        top: '-20%', left: '-15%',
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 360, height: 360, borderRadius: '50%',
        background: 'rgba(200,168,220,0.2)', filter: 'blur(50px)',
        bottom: '-15%', right: '-10%',
      }} />
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ── Card with purple gradient header ──────────────────────────
function Card({ header, children, maxWidth = 'max-w-md' }: {
  header: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className={`w-full ${maxWidth} rounded-3xl overflow-hidden`}
      style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
      {/* Purple gradient header */}
      <div className="relative overflow-hidden px-8 py-7"
        style={{ background: 'linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%)' }}>
        <div className="absolute pointer-events-none" style={{
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', top: '-40%', right: '-10%',
        }} />
        <div className="absolute pointer-events-none" style={{
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', bottom: '-30%', left: '-5%',
        }} />
        <div className="relative">{header}</div>
      </div>
      {/* White body */}
      <div className="bg-white px-8 py-7">{children}</div>
    </div>
  );
}

// ── Brand logo strip ───────────────────────────────────────────
function BrandStrip({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl overflow-hidden flex-shrink-0"
        style={{ width: 44, height: 44, outline: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
        <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={44} height={44} className="object-cover w-full h-full" />
      </div>
      <div>
        <p className="text-base font-black text-white leading-tight">FriendlyTeaching</p>
        {subtitle && <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function PlacementTestPage() {
  const { teacherId } = useParams<{ teacherId: string }>();

  const [step, setStep]     = useState<Step>('landing');
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');
  const [formError, setFormError] = useState('');

  const [currentIdx, setCurrentIdx]   = useState(0);
  const [answers, setAnswers]         = useState<PlacementAnswer[]>([]);
  const [selected, setSelected]       = useState<number | null>(null);
  const [confirmed, setConfirmed]     = useState(false);
  const [consecutiveErrors, setCons]  = useState(0);
  const [stoppedAt, setStoppedAt]     = useState<number | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState(false);

  const sessionIdRef   = useRef<string | null>(null);
  const sessionPending = useRef<Promise<string> | null>(null);
  const startTimeRef   = useRef<Date>(new Date());
  const questionStart  = useRef<number>(Date.now());

  const totalQuestions = PLACEMENT_QUESTIONS.length;
  const currentQ       = PLACEMENT_QUESTIONS[currentIdx];

  function handleLandingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setFormError('Please enter a valid email address.'); return; }
    setFormError('');
    startTimeRef.current  = new Date();
    questionStart.current = Date.now();
    setStep('instructions');
  }

  function ensureSession(): Promise<string> {
    if (sessionIdRef.current) return Promise.resolve(sessionIdRef.current);
    if (sessionPending.current) return sessionPending.current;
    const ref = doc(collection(db, 'placementSessions'));
    sessionIdRef.current = ref.id;
    const p = setDoc(ref, {
      teacherId,
      studentName: name.trim(),
      studentEmail: email.trim(),
      studentPhone: phone.trim() || null,
      status: 'in_progress',
      answers: [],
      totalAnswered: 0,
      totalCorrect: 0,
      consecutiveErrors: 0,
      startedAt: Timestamp.fromDate(startTimeRef.current),
      createdAt: serverTimestamp(),
    }).then(() => ref.id).catch(() => ref.id);
    sessionPending.current = p;
    return p;
  }

  const pendingAnswerRef = useRef<{ newAnswers: PlacementAnswer[]; newConsec: number; stop: boolean } | null>(null);

  const handleConfirm = useCallback(() => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    const q         = PLACEMENT_QUESTIONS[currentIdx];
    const isCorrect = selected === q.correct;
    const answer: PlacementAnswer = {
      questionId: q.id, level: q.level, topic: q.topic,
      selected: selected as 0 | 1 | 2 | 3, correct: isCorrect,
      timeMs: Date.now() - questionStart.current,
    };
    const newAnswers = [...answers, answer];
    const newConsec  = isCorrect ? 0 : consecutiveErrors + 1;
    pendingAnswerRef.current = { newAnswers, newConsec, stop: shouldStopTest(newAnswers) };
  }, [selected, confirmed, currentIdx, answers, consecutiveErrors]);

  const handleNext = useCallback(() => {
    if (!confirmed || !pendingAnswerRef.current) return;
    const { newAnswers, newConsec, stop } = pendingAnswerRef.current;
    pendingAnswerRef.current = null;
    const isLast = currentIdx === totalQuestions - 1;
    const q      = PLACEMENT_QUESTIONS[currentIdx];

    if (stop || isLast) {
      setAnswers(newAnswers); setCons(newConsec);
      if (stop) setStoppedAt(q.id);
      setSaving(true);
      const sectionScores = computeSectionScores(newAnswers);
      const placedLevel   = determineLevel(sectionScores);
      const weakAreas     = computeWeakAreas(newAnswers);
      const learningProg  = generateLearningProgram(placedLevel, weakAreas);
      ensureSession().then((sid) =>
        updateDoc(doc(db, 'placementSessions', sid), {
          status: stop ? 'stopped_by_ceiling' : 'completed',
          answers: newAnswers, totalAnswered: newAnswers.length,
          totalCorrect: newAnswers.filter((a) => a.correct).length,
          consecutiveErrors: newConsec,
          stoppedAtQuestion: stop ? q.id : null,
          placedLevel, sectionScores, weakAreas, learningProgram: learningProg,
          completedAt: serverTimestamp(), updatedAt: serverTimestamp(),
        })
      ).catch(() => setSaveError(true)).finally(() => setSaving(false));
      setStep('done');
      return;
    }

    setAnswers(newAnswers); setCons(newConsec);
    setCurrentIdx((i) => i + 1);
    setSelected(null); setConfirmed(false);
    questionStart.current = Date.now();
    if (newAnswers.length % 10 === 0) {
      ensureSession().then((sid) =>
        updateDoc(doc(db, 'placementSessions', sid), {
          answers: newAnswers, totalAnswered: newAnswers.length,
          totalCorrect: newAnswers.filter((a) => a.correct).length,
          consecutiveErrors: newConsec, updatedAt: serverTimestamp(),
        })
      ).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, currentIdx, totalQuestions]);

  // ── Landing ──────────────────────────────────────────────────
  if (step === 'landing') {
    return (
      <PageBg>
        <Card
          maxWidth="max-w-md"
          header={
            <>
              <BrandStrip subtitle="Grammar Placement Test" />
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <h1 className="text-2xl font-black text-white leading-tight">
                  English Level<br />Assessment
                </h1>
                <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Discover your CEFR level in 15–25 minutes
                </p>
              </div>
            </>
          }
        >
          <form onSubmit={handleLandingSubmit} className="space-y-4">
            {[
              { label: 'Full Name', value: name, setter: setName, type: 'text', placeholder: 'Your full name', required: true },
              { label: 'Email Address', value: email, setter: setEmail, type: 'email', placeholder: 'your@email.com', required: true },
              { label: 'WhatsApp / Phone', value: phone, setter: setPhone, type: 'tel', placeholder: '+56 9 1234 5678', required: false },
            ].map(({ label, value, setter, type, placeholder, required }) => (
              <div key={label}>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: B.purple }}>
                  {label}
                  {!required && <span className="ml-1 normal-case font-normal" style={{ color: B.purpleMed }}>(optional)</span>}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ border: `2px solid ${B.lavenderDark}`, background: '#FDFAFF', color: B.purple }}
                  onFocus={(e) => { e.target.style.borderColor = B.purpleLight; e.target.style.boxShadow = '0 0 0 3px rgba(200,168,220,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = B.lavenderDark; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}

            {formError && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#FFF0F0', color: '#C62828', border: '1px solid #FECACA' }}>
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="w-full font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[.98] mt-1 text-sm"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)', color: 'white' }}
            >
              Begin Assessment
            </button>
          </form>

          <div className="flex items-center justify-center gap-3 mt-5">
            {['No account needed', '100 questions', 'Free'].map((t, i, arr) => (
              <span key={t} className="flex items-center gap-3">
                <span className="text-[11px]" style={{ color: B.purpleMed }}>{t}</span>
                {i < arr.length - 1 && <span style={{ color: B.lavenderDark }}>·</span>}
              </span>
            ))}
          </div>
        </Card>
      </PageBg>
    );
  }

  // ── Instructions ─────────────────────────────────────────────
  if (step === 'instructions') {
    const instructions = [
      { heading: 'Structured progression', body: `The test contains up to 100 grammar questions, ordered from very basic to advanced level.` },
      { heading: 'Automatic ceiling', body: `The test stops if you answer ${MAX_CONSECUTIVE_ERRORS} questions incorrectly in a row — this is completely normal and by design.` },
      { heading: 'No time limit', body: 'There is no timer. Take as long as you need on each question.' },
      { heading: 'Work independently', body: 'Please do not use translation tools or external help — the results will not reflect your true level.' },
      { heading: 'Always answer', body: "If you are unsure, choose your best guess. Do not leave any question without an answer." },
    ];

    return (
      <PageBg>
        <Card
          maxWidth="max-w-lg"
          header={
            <>
              <BrandStrip subtitle="Grammar Placement Test" />
              <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <h2 className="text-xl font-black text-white">Before You Begin</h2>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Hi <strong className="text-white">{name}</strong> — please read these instructions carefully.
                </p>
              </div>
            </>
          }
        >
          <ol className="space-y-3 mb-7">
            {instructions.map((item, i) => (
              <li key={i} className="flex gap-4 items-start rounded-2xl px-4 py-3.5"
                style={{ background: B.lavender, border: `1px solid ${B.lavenderDark}` }}>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)', minWidth: 28 }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight" style={{ color: B.purple }}>{item.heading}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: B.purpleMed }}>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <button
            onClick={() => setStep('test')}
            className="w-full font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[.98] text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
          >
            I&apos;m ready — Start the test
          </button>
        </Card>
      </PageBg>
    );
  }

  // ── Done ─────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <PageBg>
        <Card
          maxWidth="max-w-md"
          header={
            <>
              <BrandStrip subtitle="Grammar Placement Test" />
              <div className="mt-6 pt-6 flex items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                {/* Checkmark circle */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">Assessment Complete</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Thank you, <strong className="text-white">{name}</strong>
                  </p>
                </div>
              </div>
            </>
          }
        >
          <p className="text-sm mb-5" style={{ color: B.purpleMed }}>
            Your results have been submitted. Your teacher will review them and contact you with your English level and a personalised learning plan.
          </p>

          {saving && (
            <p className="text-sm font-medium animate-pulse mb-4" style={{ color: B.purpleMed }}>
              Saving your results...
            </p>
          )}
          {saveError && (
            <div className="rounded-xl px-4 py-3 text-sm mb-4" style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
              Your answers were recorded locally. Please let your teacher know you completed the test.
            </div>
          )}

          {/* Summary */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${B.lavenderDark}` }}>
            <div className="px-4 py-2.5" style={{ background: B.lavender }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: B.purpleMed }}>Summary</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: B.purple }}>Questions answered</span>
                <span className="text-sm font-bold" style={{ color: B.purple }}>{answers.length} / {totalQuestions}</span>
              </div>
              {stoppedAt !== null && (
                <p className="text-xs leading-relaxed pt-2" style={{ color: B.purpleMed, borderTop: `1px solid ${B.lavenderDark}` }}>
                  The test ended early based on your response pattern. This is a normal part of the adaptive design.
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-center mt-5" style={{ color: B.purpleLight }}>
            FriendlyTeaching.cl · English for life
          </p>
        </Card>
      </PageBg>
    );
  }

  // ── Test ─────────────────────────────────────────────────────
  const progress = ((currentIdx + (confirmed ? 1 : 0)) / totalQuestions) * 100;
  const pct      = Math.round(progress);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(150deg, #EDE8FF 0%, #E0D5FF 45%, #F0E5FF 100%)' }}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3"
        style={{ background: 'rgba(237,232,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(200,168,220,0.25)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2.5">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg overflow-hidden flex-shrink-0" style={{ width: 28, height: 28 }}>
                <Image src="/logo-friendlyteaching.jpg" alt="FT" width={28} height={28} className="object-cover w-full h-full" />
              </div>
              <span className="text-xs font-bold hidden sm:block" style={{ color: B.purple }}>FriendlyTeaching.cl</span>
            </div>

            {/* Counter + level */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium" style={{ color: B.purpleMed }}>
                Question <strong style={{ color: B.purple }}>{currentIdx + 1}</strong> of {totalQuestions}
              </span>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg"
                style={{ background: B.lavender, color: B.purple }}>
                {currentQ.level}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(200,168,220,0.3)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #9B7CB8, #5A3D7A)' }}
              />
            </div>
            <span className="text-[11px] font-bold w-8 text-right flex-shrink-0" style={{ color: B.purpleMed }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* ── Question card ─────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 8px 40px -4px rgba(61,37,88,0.15)' }}>

            {/* Card header accent */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #3D2558, #9B7CB8)' }} />

            <div className="p-8">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: B.purpleLight }}>
                Choose the correct option to complete the sentence
              </p>

              <p className="text-xl font-semibold leading-relaxed mb-8" style={{ color: '#1A0E2E' }}>
                {currentQ.sentence}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5 mb-6">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect  = idx === currentQ.correct;

                  let bg      = 'white';
                  let border  = B.lavenderDark;
                  let color   = B.purple;
                  let shadow  = 'none';
                  let accentBg = B.lavenderDark;
                  let accentColor = B.purpleLight;

                  if (isSelected && !confirmed) {
                    bg = '#F0E5FF'; border = B.purpleMed; color = B.purple;
                    shadow = '0 0 0 3px rgba(155,124,184,0.15)';
                    accentBg = B.purpleMed; accentColor = 'white';
                  } else if (confirmed) {
                    if (isCorrect) {
                      bg = '#F0FFF4'; border = '#4CAF50'; color = '#1B5E20';
                      accentBg = '#4CAF50'; accentColor = 'white';
                    } else if (isSelected) {
                      bg = '#FFF5F5'; border = '#EF5350'; color = '#B71C1C';
                      accentBg = '#EF5350'; accentColor = 'white';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={confirmed}
                      onClick={() => setSelected(idx)}
                      className="w-full text-left rounded-2xl overflow-hidden transition-all flex items-stretch"
                      style={{
                        border: `2px solid ${border}`,
                        background: bg,
                        boxShadow: shadow,
                        cursor: confirmed ? 'default' : 'pointer',
                      }}
                    >
                      {/* Letter badge */}
                      <span className="flex items-center justify-center px-4 text-xs font-black flex-shrink-0"
                        style={{ background: accentBg, color: accentColor, minWidth: 48 }}>
                        {['A', 'B', 'C', 'D'][idx]}
                      </span>
                      <span className="px-5 py-4 text-sm font-medium leading-snug" style={{ color }}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action button */}
              {!confirmed ? (
                <button
                  onClick={handleConfirm}
                  disabled={selected === null}
                  className="w-full font-bold py-4 rounded-2xl transition-all active:scale-[.98] text-sm"
                  style={{
                    background: selected === null
                      ? B.lavenderDark
                      : 'linear-gradient(135deg, #3D2558, #5A3D7A)',
                    color: selected === null ? B.purpleLight : 'white',
                    cursor: selected === null ? 'not-allowed' : 'pointer',
                  }}
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full font-bold py-4 rounded-2xl transition-all hover:opacity-90 active:scale-[.98] text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
                >
                  {currentIdx === totalQuestions - 1 ? 'Finish Test' : 'Next Question'}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] mt-4" style={{ color: 'rgba(155,124,184,0.7)' }}>
            {name} · Grammar Placement Test · FriendlyTeaching.cl
          </p>
        </div>
      </div>
    </div>
  );
}
