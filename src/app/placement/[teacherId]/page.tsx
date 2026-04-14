'use client';
// FriendlyTeaching.cl — Public Grammar Placement Test
// URL: /placement/[teacherId]  — no login required

import { useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
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

// ── Steps ─────────────────────────────────────────────────────
type Step = 'landing' | 'instructions' | 'test' | 'done';

// ── Main component ────────────────────────────────────────────
export default function PlacementTestPage() {
  const { teacherId } = useParams<{ teacherId: string }>();

  const [step, setStep]           = useState<Step>('landing');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [formError, setFormError] = useState('');

  // Test state
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [answers, setAnswers]           = useState<PlacementAnswer[]>([]);
  const [selected, setSelected]         = useState<number | null>(null);
  const [confirmed, setConfirmed]       = useState(false);
  const [consecutiveErrors, setCons]    = useState(0);
  const [stoppedAt, setStoppedAt]       = useState<number | null>(null);
  const [saving, setSaving]             = useState(false);

  // Firestore session ID (created on first answer)
  const sessionIdRef  = useRef<string | null>(null);
  const startTimeRef  = useRef<Date>(new Date());
  const questionStart = useRef<number>(Date.now());

  const totalQuestions = PLACEMENT_QUESTIONS.length; // 100
  const currentQ       = PLACEMENT_QUESTIONS[currentIdx];

  // ── Landing form submit ──────────────────────────────────────
  function handleLandingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError('Por favor ingresa tu nombre.'); return; }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Por favor ingresa un email válido.'); return;
    }
    setFormError('');
    startTimeRef.current  = new Date();
    questionStart.current = Date.now();
    setStep('instructions');
  }

  // ── Create Firestore session ─────────────────────────────────
  async function createSession(): Promise<string> {
    const ref = doc(collection(db, 'placementSessions'));
    await setDoc(ref, {
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
    });
    return ref.id;
  }

  // Staged answers waiting to be persisted (filled after confirm, cleared after next)
  const pendingAnswerRef = useRef<{ answer: PlacementAnswer; newAnswers: PlacementAnswer[]; newConsec: number; stop: boolean } | null>(null);

  // ── Step 1: Confirm answer (show feedback) ────────────────────
  const handleConfirm = useCallback(() => {
    if (selected === null || confirmed) return;
    setConfirmed(true);

    const q         = PLACEMENT_QUESTIONS[currentIdx];
    const isCorrect = selected === q.correct;
    const timeMs    = Date.now() - questionStart.current;

    const answer: PlacementAnswer = {
      questionId: q.id,
      level:      q.level,
      topic:      q.topic,
      selected:   selected as 0 | 1 | 2 | 3,
      correct:    isCorrect,
      timeMs,
    };

    const newAnswers = [...answers, answer];
    const newConsec  = isCorrect ? 0 : consecutiveErrors + 1;
    const stop       = shouldStopTest(newAnswers);

    pendingAnswerRef.current = { answer, newAnswers, newConsec, stop };
  }, [selected, confirmed, currentIdx, answers, consecutiveErrors]);

  // ── Step 2: Advance to next question (or finish) ──────────────
  const handleNext = useCallback(async () => {
    if (!confirmed || !pendingAnswerRef.current) return;

    const { newAnswers, newConsec, stop } = pendingAnswerRef.current;
    pendingAnswerRef.current = null;

    setAnswers(newAnswers);
    setCons(newConsec);

    // Ensure session exists in Firestore
    let sid = sessionIdRef.current;
    if (!sid) {
      sid = await createSession();
      sessionIdRef.current = sid;
    }

    const isLast = currentIdx === totalQuestions - 1;
    const q      = PLACEMENT_QUESTIONS[currentIdx];

    if (stop || isLast) {
      // ── Test is over: compute results and save ─────────────
      setSaving(true);
      const sectionScores = computeSectionScores(newAnswers);
      const placedLevel   = determineLevel(sectionScores);
      const weakAreas     = computeWeakAreas(newAnswers);
      const learningProg  = generateLearningProgram(placedLevel, weakAreas);

      await updateDoc(doc(db, 'placementSessions', sid), {
        status:            stop ? 'stopped_by_ceiling' : 'completed',
        answers:           newAnswers,
        totalAnswered:     newAnswers.length,
        totalCorrect:      newAnswers.filter((a) => a.correct).length,
        consecutiveErrors: newConsec,
        stoppedAtQuestion: stop ? q.id : null,
        placedLevel,
        sectionScores,
        weakAreas,
        learningProgram:   learningProg,
        completedAt:       serverTimestamp(),
        updatedAt:         serverTimestamp(),
      });

      if (stop) setStoppedAt(q.id);
      setSaving(false);
      setStep('done');
      return;
    }

    // ── Persist progress every 10 answers ──────────────────
    if (newAnswers.length % 10 === 0) {
      updateDoc(doc(db, 'placementSessions', sid), {
        answers:           newAnswers,
        totalAnswered:     newAnswers.length,
        totalCorrect:      newAnswers.filter((a) => a.correct).length,
        consecutiveErrors: newConsec,
        updatedAt:         serverTimestamp(),
      }).catch(() => {/* non-critical, ignore */});
    }

    // Advance to next question
    setCurrentIdx((i) => i + 1);
    setSelected(null);
    setConfirmed(false);
    questionStart.current = Date.now();
  }, [confirmed, currentIdx, totalQuestions, teacherId]);

  // ── Render: Landing ──────────────────────────────────────────
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Grammar Placement Test</h1>
            <p className="text-gray-500 mt-2 text-sm">
              This test will help us find the right English level for you.
            </p>
          </div>

          <form onSubmit={handleLandingSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp / Phone <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {formError && (
              <p className="text-red-500 text-sm">{formError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Start Test
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            No account needed &bull; Takes 15–25 minutes &bull; 100 questions
          </p>
        </div>
      </div>
    );
  }

  // ── Render: Instructions ─────────────────────────────────────
  if (step === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Before you begin</h2>
          <p className="text-gray-500 text-sm mb-6">Hi <strong>{name}</strong>! Please read these instructions carefully.</p>

          <ul className="space-y-4 mb-8">
            {[
              { icon: '📋', text: 'The test has up to 100 grammar questions, ordered from very basic to advanced.' },
              { icon: '⏹', text: `The test stops automatically if you get ${MAX_CONSECUTIVE_ERRORS} questions wrong in a row — this is completely normal.` },
              { icon: '⏱', text: 'There is no time limit. Take your time on each question.' },
              { icon: '❌', text: "Don't use Google Translate or any other help — the results won't be accurate." },
              { icon: '🎯', text: "If you don't know the answer, make your best guess. Don't leave any blank." },
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="text-xl leading-none">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setStep('test')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            I'm ready — Start the test
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Done ─────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Test Completed!</h2>
          <p className="text-gray-600 mb-2">
            Thank you, <strong>{name}</strong>! We&apos;ve received your answers.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Your teacher will review your results and contact you soon with your level and
            a personalised learning plan.
          </p>

          {saving && (
            <p className="text-indigo-500 text-sm animate-pulse">Saving your results…</p>
          )}

          <div className="bg-indigo-50 rounded-xl p-4 text-left">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Summary</p>
            <p className="text-sm text-gray-700">
              Questions answered: <strong>{answers.length}</strong> of {totalQuestions}
            </p>
            {stoppedAt !== null && (
              <p className="text-sm text-gray-500 mt-1">
                Test ended early — this is normal and expected.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Test ─────────────────────────────────────────────
  const progress = ((currentIdx) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
          <span>Question {currentIdx + 1} of {totalQuestions}</span>
          <span className="font-medium text-indigo-600">{currentQ.level}</span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8">
        <p className="text-xs font-medium text-indigo-500 uppercase tracking-wide mb-4">
          Choose the correct option to complete the sentence
        </p>

        {/* Sentence */}
        <p className="text-lg text-gray-800 font-medium mb-8 leading-relaxed">
          {currentQ.sentence}
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {currentQ.options.map((opt, idx) => {
            let style = 'border-2 border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50';
            if (selected === idx) {
              if (!confirmed) {
                style = 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700';
              } else {
                style = idx === currentQ.correct
                  ? 'border-2 border-green-500 bg-green-50 text-green-700'
                  : 'border-2 border-red-400 bg-red-50 text-red-700';
              }
            } else if (confirmed && idx === currentQ.correct) {
              style = 'border-2 border-green-500 bg-green-50 text-green-700';
            }

            return (
              <button
                key={idx}
                disabled={confirmed}
                onClick={() => setSelected(idx)}
                className={`w-full text-left px-5 py-4 rounded-xl font-medium text-sm transition-all ${style} ${confirmed ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Confirm Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : currentIdx === totalQuestions - 1 ? 'Finish Test' : 'Next Question →'}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {name} &bull; Grammar Placement Test
      </p>
    </div>
  );
}
