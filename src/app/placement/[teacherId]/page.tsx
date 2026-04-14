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

// ── Brand helpers ─────────────────────────────────────────────
function BrandHeader() {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md ring-2 ring-[#C8A8DC]/30 flex-shrink-0">
        <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={40} height={40} className="object-cover w-full h-full" />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-[#5A3D7A] leading-tight">FriendlyTeaching</p>
        <p className="text-[11px] text-[#9B7CB8]">.cl</p>
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
    if (!email.trim() || !email.includes('@')) { setFormError('Please enter a valid email.'); return; }
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

  // ── Shared background ────────────────────────────────────────
  const pageBg = 'min-h-screen flex items-center justify-center p-4';
  const pageBgStyle = { background: 'linear-gradient(135deg, #F0E5FF 0%, #E0D5FF 50%, #FFE8F0 100%)' };

  // ── Landing ──────────────────────────────────────────────────
  if (step === 'landing') {
    return (
      <div className={pageBg} style={pageBgStyle}>
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-8" style={{ boxShadow: '0 8px 40px -4px rgba(90,61,122,0.18)' }}>
          <BrandHeader />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #F0E5FF, #C8A8DC)' }}>
              <svg className="w-7 h-7" style={{ color: '#5A3D7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#5A3D7A' }}>Grammar Placement Test</h1>
            <p className="text-sm" style={{ color: '#9B7CB8' }}>
              Find your English level in 15–25 minutes
            </p>
          </div>

          <form onSubmit={handleLandingSubmit} className="space-y-4">
            {[
              { label: 'Full Name', value: name, setter: setName, type: 'text', placeholder: 'Your full name', required: true },
              { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'your@email.com', required: true },
              { label: 'WhatsApp / Phone', value: phone, setter: setPhone, type: 'tel', placeholder: '+56 9 1234 5678', required: false },
            ].map(({ label, value, setter, type, placeholder, required }) => (
              <div key={label}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5A3D7A' }}>
                  {label} {required && <span className="text-red-400">*</span>}
                  {!required && <span className="font-normal ml-1" style={{ color: '#9B7CB8' }}>(optional)</span>}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ border: '2px solid #E0D5FF', background: '#FDFAFF' }}
                  onFocus={(e) => { e.target.style.borderColor = '#C8A8DC'; e.target.style.boxShadow = '0 0 0 3px rgba(200,168,220,0.15)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E0D5FF'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            ))}

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <button
              type="submit"
              className="w-full text-white font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95 mt-2"
              style={{ background: 'linear-gradient(135deg, #6B4F8A, #5A3D7A)' }}
            >
              Start Test →
            </button>
          </form>

          <div className="flex items-center justify-center gap-4 mt-6">
            {['No account needed', '100 questions', 'Free'].map((t, i) => (
              <span key={i} className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: '#F0E5FF', color: '#9B7CB8' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Instructions ─────────────────────────────────────────────
  if (step === 'instructions') {
    return (
      <div className={pageBg} style={pageBgStyle}>
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-lg p-8" style={{ boxShadow: '0 8px 40px -4px rgba(90,61,122,0.18)' }}>
          <BrandHeader />

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#5A3D7A' }}>Before you begin</h2>
            <p className="text-sm" style={{ color: '#9B7CB8' }}>
              Hi <strong style={{ color: '#5A3D7A' }}>{name}</strong>! Please read these instructions carefully.
            </p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              { icon: '📋', text: 'The test has up to 100 grammar questions, ordered from very basic to advanced.' },
              { icon: '⏹', text: `The test stops automatically if you get ${MAX_CONSECUTIVE_ERRORS} questions wrong in a row — this is completely normal.` },
              { icon: '⏱', text: 'There is no time limit. Take your time on each question.' },
              { icon: '🚫', text: "Don't use Google Translate or any other help — the results won't be accurate." },
              { icon: '🎯', text: "If you don't know the answer, make your best guess. Don't leave any blank." },
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-start rounded-xl p-3" style={{ background: '#FDFAFF', border: '1px solid #F0E5FF' }}>
                <span className="text-lg leading-tight flex-shrink-0 mt-0.5">{item.icon}</span>
                <span className="text-sm" style={{ color: '#5A3D7A' }}>{item.text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setStep('test')}
            className="w-full text-white font-bold py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6B4F8A, #5A3D7A)' }}
          >
            I&apos;m ready — Start the test →
          </button>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className={pageBg} style={pageBgStyle}>
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md p-8 text-center" style={{ boxShadow: '0 8px 40px -4px rgba(90,61,122,0.18)' }}>
          <BrandHeader />

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: 'linear-gradient(135deg, #F0E5FF, #C8A8DC)' }}>
            <svg className="w-10 h-10" style={{ color: '#5A3D7A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: '#5A3D7A' }}>Test Completed!</h2>
          <p className="text-sm mb-1" style={{ color: '#6B4F8A' }}>
            Thank you, <strong>{name}</strong>!
          </p>
          <p className="text-sm mb-6" style={{ color: '#9B7CB8' }}>
            Your teacher will review your results and contact you soon with your level and a personalised learning plan.
          </p>

          {saving && <p className="text-sm animate-pulse mb-4" style={{ color: '#9B7CB8' }}>Saving your results…</p>}
          {saveError && (
            <p className="text-amber-600 text-sm mb-4">
              Your answers were recorded but could not be saved. Please let your teacher know you completed the test.
            </p>
          )}

          <div className="rounded-2xl p-4 text-left" style={{ background: 'linear-gradient(135deg, #F0E5FF, #E0D5FF)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9B7CB8' }}>Summary</p>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#5A3D7A' }}>Questions answered</span>
              <span className="text-sm font-bold" style={{ color: '#5A3D7A' }}>{answers.length} / {totalQuestions}</span>
            </div>
            {stoppedAt !== null && (
              <p className="text-xs mt-2" style={{ color: '#9B7CB8' }}>
                The test ended early based on your responses — this is completely normal.
              </p>
            )}
          </div>

          <p className="text-xs mt-6" style={{ color: '#C8A8DC' }}>FriendlyTeaching.cl &bull; English for life</p>
        </div>
      </div>
    );
  }

  // ── Test ─────────────────────────────────────────────────────
  const progress = (currentIdx / totalQuestions) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-6" style={pageBgStyle}>

      {/* Top bar */}
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/logo-friendlyteaching.jpg" alt="FT" width={28} height={28} className="object-cover w-full h-full" />
            </div>
            <span className="text-xs font-bold" style={{ color: '#5A3D7A' }}>FriendlyTeaching.cl</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#9B7CB8' }}>Question {currentIdx + 1} of {totalQuestions}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#F0E5FF', color: '#5A3D7A' }}>{currentQ.level}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: 'rgba(200,168,220,0.25)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C8A8DC, #5A3D7A)' }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-2xl p-8" style={{ boxShadow: '0 8px 40px -4px rgba(90,61,122,0.15)' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: '#C8A8DC' }}>
          Choose the correct option to complete the sentence
        </p>

        <p className="text-xl font-semibold mb-8 leading-relaxed" style={{ color: '#2D1B4E' }}>
          {currentQ.sentence}
        </p>

        <div className="grid grid-cols-1 gap-3 mb-6">
          {currentQ.options.map((opt, idx) => {
            let bg = 'white';
            let border = '#E0D5FF';
            let color = '#5A3D7A';
            let shadow = 'none';

            if (selected === idx && !confirmed) {
              bg = '#F0E5FF'; border = '#9B7CB8'; color = '#5A3D7A';
              shadow = '0 0 0 3px rgba(155,124,184,0.15)';
            } else if (confirmed) {
              if (idx === currentQ.correct) {
                bg = '#F0FFF4'; border = '#4CAF50'; color = '#2E7D32';
              } else if (selected === idx) {
                bg = '#FFF5F5'; border = '#EF5350'; color = '#C62828';
              }
            }

            return (
              <button
                key={idx}
                disabled={confirmed}
                onClick={() => setSelected(idx)}
                className="w-full text-left px-5 py-4 rounded-2xl font-medium text-sm transition-all"
                style={{ background: bg, border: `2px solid ${border}`, color, boxShadow: shadow, cursor: confirmed ? 'default' : 'pointer' }}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {!confirmed ? (
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            className="w-full text-white font-bold py-4 rounded-2xl transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed"
            style={{
              background: selected === null ? '#E0D5FF' : 'linear-gradient(135deg, #6B4F8A, #5A3D7A)',
              color: selected === null ? '#9B7CB8' : 'white',
            }}
          >
            Confirm Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full text-white font-bold py-4 rounded-2xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6B4F8A, #5A3D7A)' }}
          >
            {currentIdx === totalQuestions - 1 ? 'Finish Test ✓' : 'Next Question →'}
          </button>
        )}
      </div>

      <p className="text-[11px] mt-4" style={{ color: '#C8A8DC' }}>
        {name} &bull; Grammar Placement Test &bull; FriendlyTeaching.cl
      </p>
    </div>
  );
}
