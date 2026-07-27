'use client';
// FriendlyTeaching.cl — Teacher Placement Test Dashboard

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';
import { usePlacementSessions, linkSessionToStudent as _linkSession } from '@/hooks/usePlacementSessions';
import { useStudents } from '@/hooks/useStudents';
import {
  usePlacementAssignments, createPlacementAssignment,
  deletePlacementAssignment, type PlacementAssignment,
} from '@/hooks/usePlacementAssignments';
import { usePlacementSuiteSessions } from '@/hooks/usePlacementSuiteSessions';
import { TOPIC_LABELS } from '@/data/placementQuestions';
import type { PlacementSession, SectionScore } from '@/types/placement';
import {
  COMPONENT_META, PRESETS, estimateMinutes,
  type ComponentId, type Preset, type PlacementSuiteSession, type Budgets, type GrammarMode,
} from '@/types/placement-suite';

// ── Brand palette ─────────────────────────────────────────────
const B = {
  purple:      '#5A3D7A',
  purpleMed:   '#9B7CB8',
  purpleLight: '#C8A8DC',
  lavender:    '#F0E5FF',
  lavenderDark:'#E0D5FF',
  bg:          '#FDFAFF',
};

// ── Level config ──────────────────────────────────────────────
const LEVEL_CONFIG: Record<string, { bg: string; text: string; bar: string }> = {
  A0:   { bg: '#F3F0FF', text: '#5A3D7A', bar: '#C8A8DC' },
  A1:   { bg: '#EEF2FF', text: '#3730A3', bar: '#818CF8' },
  A2:   { bg: '#E0F2FE', text: '#0369A1', bar: '#38BDF8' },
  B1:   { bg: '#F0FDF4', text: '#15803D', bar: '#4ADE80' },
  'B1+':{ bg: '#ECFDF5', text: '#047857', bar: '#34D399' },
  B2:   { bg: '#FFFBEB', text: '#B45309', bar: '#FBBF24' },
  C1:   { bg: '#FFF7ED', text: '#C2410C', bar: '#FB923C' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  completed:          { label: 'Completed',    bg: '#F0FDF4', text: '#15803D' },
  stopped_by_ceiling: { label: 'Auto-stopped', bg: '#FFFBEB', text: '#B45309' },
  in_progress:        { label: 'In progress',  bg: B.lavender, text: B.purple },
};

function formatDate(ts: unknown): string {
  if (!ts) return '—';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = ts as any;
  const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date((raw?.seconds ?? 0) * 1000);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Level badge ───────────────────────────────────────────────
function LevelBadge({ level, size = 'sm' }: { level: string; size?: 'sm' | 'lg' }) {
  const cfg = LEVEL_CONFIG[level] ?? { bg: B.lavender, text: B.purple, bar: B.purpleLight };
  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${size === 'lg' ? 'px-4 py-1.5 text-base' : 'px-2.5 py-0.5 text-xs'}`}
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {level}
    </span>
  );
}

// ── Section score bar ─────────────────────────────────────────
function SectionBar({ section }: { section: SectionScore }) {
  const cfg = LEVEL_CONFIG[section.level] ?? { bg: B.lavender, text: B.purple, bar: B.purpleLight };
  const barColor = section.total < 4 ? '#E0D5FF' : section.passed ? cfg.bar : '#FCA5A5';

  return (
    <div className="flex items-center gap-3">
      <span className="w-9 text-[11px] font-bold text-center rounded-lg py-0.5 flex-shrink-0"
        style={{ background: cfg.bg, color: cfg.text }}>
        {section.level}
      </span>
      <div className="flex-1 rounded-full h-3 overflow-hidden" style={{ background: '#F0E5FF' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${section.pct}%`, background: barColor }}
        />
      </div>
      <span className="text-xs w-28 text-right flex-shrink-0" style={{ color: B.purpleMed }}>
        {section.total > 0
          ? <><strong style={{ color: section.passed ? '#15803D' : '#DC2626' }}>{section.pct}%</strong> &nbsp;{section.correct}/{section.total}</>
          : <span style={{ color: '#C8A8DC' }}>—</span>
        }
      </span>
    </div>
  );
}

// ── Session modal ─────────────────────────────────────────────
function SessionModal({
  session, onClose, onLink, pendingStudents,
}: {
  session: PlacementSession;
  onClose: () => void;
  onLink: (sessionId: string, studentId: string) => Promise<void>;
  pendingStudents: { uid: string; fullName: string }[];
}) {
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linking, setLinking]             = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [showPdfMenu, setShowPdfMenu]     = useState(false);
  const [tab, setTab]                     = useState<'results' | 'program'>('results');
  const appUrl  = typeof window !== 'undefined' ? window.location.origin : '';
  const testUrl = `${appUrl}/placement/${session.teacherId}`;

  async function handleLink() {
    if (!linkStudentId) return;
    setLinking(true);
    await onLink(session.id, linkStudentId);
    setLinking(false);
  }

  async function handleDownloadPdf(variant: 'student' | 'teacher') {
    setShowPdfMenu(false);
    setDownloading(true);
    try {
      // Serialize Firestore Timestamps → ISO strings for JSON
      const serializeAnswers = session.answers.map((a) => ({ ...a }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedAtRaw = session.completedAt as any;
      const completedAt = completedAtRaw
        ? typeof completedAtRaw.toDate === 'function'
          ? completedAtRaw.toDate().toISOString()
          : new Date((completedAtRaw.seconds ?? 0) * 1000).toISOString()
        : new Date().toISOString();

      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'placement',
          variant,
          studentName:     session.studentName,
          studentEmail:    session.studentEmail,
          studentPhone:    session.studentPhone,
          placedLevel:     session.placedLevel,
          totalAnswered:   session.totalAnswered,
          totalCorrect:    session.totalCorrect,
          sectionScores:   session.sectionScores ?? [],
          weakAreas:       session.weakAreas ?? [],
          answers:         serializeAnswers,
          completedAt,
          status:          session.status,
          learningProgram: variant === 'teacher' ? (session.learningProgram ?? null) : undefined,
        }),
      });
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setDownloading(false);
    }
  }

  const accuracy = session.totalAnswered > 0
    ? Math.round((session.totalCorrect / session.totalAnswered) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(45,27,78,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{ background: 'white', boxShadow: '0 24px 60px -8px rgba(90,61,122,0.35)' }}>

        {/* ── Hero header ────────────────────────────── */}
        <div className="relative p-6 rounded-t-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #5A3D7A 0%, #9B7CB8 100%)' }}>
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -40%)' }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(-30%, 40%)' }} />

          {/* Brand row: logo left — level right — actions far right */}
          <div className="relative flex items-center justify-between mb-5">
            {/* Logo + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/25"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <div>
                <p className="text-base font-black text-white leading-tight">FriendlyTeaching</p>
                <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Grammar Placement Test</p>
              </div>
            </div>

            {/* Level + close */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {session.placedLevel && (
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Level</p>
                  <span className="text-2xl font-black text-white px-4 py-1.5 rounded-xl block" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {session.placedLevel}
                  </span>
                </div>
              )}
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:bg-white/20"
                style={{ fontSize: '18px', lineHeight: 1 }}>
                ×
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative w-full mb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />

          {/* Student info */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>Placement Test Result</p>
              <div className="relative">
                <button
                  onClick={() => setShowPdfMenu((v) => !v)}
                  disabled={downloading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {downloading ? '…' : '⬇ PDF ▾'}
                </button>
                {showPdfMenu && !downloading && (
                  <div
                    className="absolute right-0 mt-1 rounded-xl overflow-hidden shadow-xl z-10"
                    style={{ background: 'white', border: '1px solid #E0D5FF', minWidth: '160px', top: '100%' }}>
                    <button
                      onClick={() => handleDownloadPdf('student')}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-purple-50 transition-colors"
                      style={{ color: B.purple }}>
                      🎓 Student PDF
                    </button>
                    <div style={{ borderTop: '1px solid #F0E5FF' }} />
                    <button
                      onClick={() => handleDownloadPdf('teacher')}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-purple-50 transition-colors"
                      style={{ color: B.purple }}>
                      📋 Teacher PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold text-white">{session.studentName}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{session.studentEmail}</p>
            {session.studentPhone && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{session.studentPhone}</p>}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: 'Answered', value: session.totalAnswered },
              { label: 'Correct',  value: session.totalCorrect },
              { label: 'Accuracy', value: `${accuracy}%` },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-2xl py-3" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────── */}
        <div className="flex border-b px-6" style={{ borderColor: B.lavenderDark }}>
          {(['results', 'program'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="py-3 px-5 text-sm font-semibold border-b-2 -mb-px transition-colors"
              style={{
                borderBottomColor: tab === t ? B.purple : 'transparent',
                color: tab === t ? B.purple : B.purpleMed,
              }}>
              {t === 'results' ? '📊 Test Results' : '📅 Learning Program'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">

          {/* ══ RESULTS TAB ══════════════════════════════ */}
          {tab === 'results' && (
            <>
              {/* Section scores */}
              {session.sectionScores && session.sectionScores.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-4" style={{ color: B.purple }}>Score by level</h3>
                  <div className="space-y-2.5 p-4 rounded-2xl" style={{ background: B.lavender }}>
                    {session.sectionScores.map((s) => <SectionBar key={s.level} section={s} />)}
                  </div>
                  <div className="flex gap-4 mt-2 pl-1">
                    <span className="text-[10px] flex items-center gap-1" style={{ color: B.purpleMed }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#4ADE80' }} /> Passed (≥ 60%)
                    </span>
                    <span className="text-[10px] flex items-center gap-1" style={{ color: B.purpleMed }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#FCA5A5' }} /> Below threshold
                    </span>
                    <span className="text-[10px] flex items-center gap-1" style={{ color: B.purpleMed }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#E0D5FF' }} /> Not reached
                    </span>
                  </div>
                </div>
              )}

              {/* Weak areas */}
              {session.weakAreas && session.weakAreas.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-3" style={{ color: B.purple }}>Weak areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {session.weakAreas.map((w) => {
                      const intensity = w.pct === 0 ? '#FEE2E2' : '#FEF3C7';
                      const textColor = w.pct === 0 ? '#991B1B' : '#92400E';
                      return (
                        <span key={w.topic}
                          className="text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{ background: intensity, color: textColor, border: `1px solid ${w.pct === 0 ? '#FECACA' : '#FDE68A'}` }}
                          title={`${w.correct}/${w.total} correct`}>
                          {TOPIC_LABELS[w.topic] ?? w.topic}
                          <span className="ml-1.5 font-bold">{w.pct}%</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Link to student */}
              <div className="rounded-2xl p-4" style={{ background: B.lavender, border: `1px solid ${B.lavenderDark}` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: B.purple }}>Link to a pending student</h3>
                {session.linkedStudentId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#15803D' }}>✓ Linked</span>
                    <span className="text-xs" style={{ color: B.purpleMed }}>({session.linkedStudentId})</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select value={linkStudentId} onChange={(e) => setLinkStudentId(e.target.value)}
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ border: `2px solid ${B.lavenderDark}`, background: 'white', color: B.purple }}>
                      <option value="">Select pending student…</option>
                      {pendingStudents.map((s) => (
                        <option key={s.uid} value={s.uid}>{s.fullName}</option>
                      ))}
                    </select>
                    <button onClick={handleLink} disabled={!linkStudentId || linking}
                      className="text-white text-sm px-5 py-2 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: B.purple }}>
                      {linking ? '…' : 'Link'}
                    </button>
                  </div>
                )}
              </div>

              {/* Share link */}
              <div>
                <h3 className="text-sm font-bold mb-2" style={{ color: B.purple }}>Share test link</h3>
                <div className="flex gap-2">
                  <input readOnly value={testUrl}
                    className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ border: `1px solid ${B.lavenderDark}`, background: B.lavender, color: B.purpleMed }} />
                  <button onClick={() => navigator.clipboard.writeText(testUrl)}
                    className="text-xs font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ background: B.lavenderDark, color: B.purple }}>
                    Copy
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══ PROGRAM TAB ══════════════════════════════ */}
          {tab === 'program' && (
            <>
              {session.learningProgram ? (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #F0E5FF, #E0D5FF)' }}>
                    <LevelBadge level={session.learningProgram.placedLevel} size="lg" />
                    <div>
                      <p className="text-sm font-bold" style={{ color: B.purple }}>12-Week Personalised Learning Plan</p>
                      <p className="text-xs" style={{ color: B.purpleMed }}>Based on {session.totalAnswered} answers · {session.learningProgram.weakAreas.length} weak areas addressed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {session.learningProgram.weeks.map((week) => {
                      const phase = week.week <= 4 ? 0 : week.week <= 8 ? 1 : 2;
                      const phaseColors = [
                        { bg: '#F0E5FF', accent: B.purple, label: 'Foundation' },
                        { bg: '#E0F2FE', accent: '#0369A1', label: 'Development' },
                        { bg: '#ECFDF5', accent: '#047857', label: 'Consolidation' },
                      ];
                      const ph = phaseColors[phase];
                      return (
                        <div key={week.week} className="flex gap-4 p-4 rounded-2xl transition-all hover:shadow-sm"
                          style={{ background: ph.bg, border: `1px solid ${ph.bg}` }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
                            style={{ background: ph.accent }}>
                            W{week.week}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-bold" style={{ color: ph.accent }}>{week.focus}</p>
                              <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                style={{ background: ph.accent + '20', color: ph.accent }}>
                                {ph.label}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: '#64748B' }}>{week.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12" style={{ color: B.purpleMed }}>
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-sm">Learning program not generated yet.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Assign test modal ─────────────────────────────────────────
// ── Suite session view modal (teacher) ─────────────────────────────────────

function SuiteSessionModal({
  session, onClose,
}: {
  session: PlacementSuiteSession;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState<'results' | 'program'>('results');

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedAtRaw = session.completedAt as any;
      const completedAt = completedAtRaw
        ? typeof completedAtRaw.toDate === 'function'
          ? completedAtRaw.toDate().toISOString()
          : new Date((completedAtRaw.seconds ?? 0) * 1000).toISOString()
        : new Date().toISOString();

      // Merge weak areas from all completed components (mirrors aggregateSuite)
      const byTopic: Record<string, { total: number; correct: number }> = {};
      for (const res of Object.values(session.results ?? {})) {
        if (!res) continue;
        for (const w of res.weakAreas ?? []) {
          if (!byTopic[w.topic]) byTopic[w.topic] = { total: 0, correct: 0 };
          byTopic[w.topic].total += w.total;
          byTopic[w.topic].correct += w.correct;
        }
      }
      const mergedWeakAreas = Object.entries(byTopic).map(([topic, b]) => ({
        topic, total: b.total, correct: b.correct,
        pct: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
      })).sort((a, b) => a.pct - b.pct);

      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'placement-suite',
          studentName:  session.studentName,
          studentEmail: session.studentEmail,
          studentPhone: session.studentPhone,
          components:   session.components,
          results:      session.results ?? {},
          perSkillLevel: session.perSkillLevel,
          overallLevel: session.overallLevel,
          weakAreas:    mergedWeakAreas,
          learningProgram: session.learningProgram,
          completedAt,
          mode:         session.mode,
        }),
      });
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(45,27,78,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl bg-white my-8"
        style={{ boxShadow: '0 24px 60px -8px rgba(90,61,122,0.35)' }}>

        {/* Hero */}
        <div className="relative p-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%)' }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/25 shrink-0"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                <Image src="/logo-friendlyteaching.jpg" alt="FT" width={48} height={48} className="object-cover w-full h-full" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-black leading-tight">{session.studentName}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {session.studentEmail ?? '—'} · {formatDate(session.createdAt)}
                </p>
                <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-1"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  {session.mode === 'teacher-led' ? '👤 Live' : '🎓 Self'} · {session.components.length} componente{session.components.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {session.overallLevel && (
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>Overall</p>
                  <span className="text-2xl font-black text-white px-4 py-1.5 rounded-xl block mt-1"
                    style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {session.overallLevel}
                  </span>
                </div>
              )}
              <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: B.lavenderDark }}>
          {(['results', 'program'] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                  active ? '' : 'text-gray-400 hover:text-[#5A3D7A]'
                }`}
                style={active ? { color: B.purple, borderBottom: `2px solid ${B.purple}` } : {}}
              >
                {t === 'results' ? 'Resultados' : 'Programa 12 semanas'}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {tab === 'results' && (
            <>
              {/* Per-skill */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: B.purple }}>
                  Nivel por habilidad
                </p>
                <div className="space-y-2">
                  {session.components.map((cid) => {
                    const res = session.results?.[cid];
                    const lvl = session.perSkillLevel?.[cid] ?? res?.placedLevel;
                    const meta = COMPONENT_META[cid];
                    if (!meta) return null;
                    const answered = res?.totalAnswered ?? 0;
                    const correct = res?.totalCorrect ?? 0;
                    const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                    return (
                      <div key={cid} className="flex items-center gap-3 p-2.5 rounded-xl border"
                        style={{ borderColor: B.lavenderDark, background: B.bg }}>
                        <span className="text-xl">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold" style={{ color: B.purple }}>{meta.label}</p>
                          <p className="text-[10px]" style={{ color: B.purpleMed }}>
                            {correct}/{answered} correct · {pct}%
                            {res?.stopped ? ' · auto-stopped' : ''}
                          </p>
                        </div>
                        {lvl
                          ? <LevelBadge level={lvl} />
                          : <span className="text-xs" style={{ color: B.purpleLight }}>—</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-component section score bars */}
              {session.components.map((cid) => {
                const res = session.results?.[cid];
                if (!res?.sectionScores?.length) return null;
                const meta = COMPONENT_META[cid];
                const visible = res.sectionScores.filter(s => s.total > 0);
                if (visible.length === 0) return null;
                return (
                  <div key={`sec-${cid}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: B.purple }}>
                      {meta.icon} {meta.label} · desglose por nivel
                    </p>
                    <div className="space-y-1.5">
                      {visible.map((s) => (
                        <SectionBar key={`${cid}-${s.level}`} section={s} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === 'program' && session.learningProgram && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2" style={{ color: B.purple }}>
                Plan personalizado — nivel {session.learningProgram.placedLevel}
              </p>
              <p className="text-[11px] mb-3" style={{ color: B.purpleMed }}>
                12 semanas con foco en los {session.learningProgram.weakAreas.length} weak areas detectadas.
              </p>
              <div className="space-y-1.5">
                {session.learningProgram.weeks.map((week) => {
                  const phase = week.week <= 4 ? 0 : week.week <= 8 ? 1 : 2;
                  const phaseAccent = phase === 0 ? '#5A3D7A' : phase === 1 ? '#0369A1' : '#047857';
                  const phaseBg     = phase === 0 ? '#F0E5FF' : phase === 1 ? '#E0F2FE' : '#ECFDF5';
                  return (
                    <div key={week.week} className="flex gap-2 p-2.5 rounded-xl" style={{ background: phaseBg }}>
                      <div className="w-9 h-9 rounded-lg text-white font-black text-[11px] flex items-center justify-center shrink-0"
                        style={{ background: phaseAccent }}>W{week.week}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: phaseAccent }}>{week.focus}</p>
                        <p className="text-[10px] leading-snug" style={{ color: '#4B5563' }}>{week.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'program' && !session.learningProgram && (
            <p className="text-xs text-gray-500 text-center py-8">
              Este test aún no tiene programa generado (probablemente no completó Grammar).
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: B.lavenderDark }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: B.purple }}
            >
              {downloading ? '⏳ Generando…' : '⬇ Descargar PDF completo'}
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared component + budget picker ──────────────────────────────────────
//
// Used by both the "assign to student" modal (step 2) and the "start live
// test" modal. Owns the presets / component toggles / budget sliders and
// reports the currently-selected config through onChange.

function SuiteConfigForm({
  value, onChange,
}: {
  value: { components: ComponentId[]; budgets: Budgets; presetId: string; grammarMode: GrammarMode };
  onChange: (v: { components: ComponentId[]; budgets: Budgets; presetId: string; grammarMode: GrammarMode }) => void;
}) {
  const { components, budgets, presetId, grammarMode } = value;

  function applyPreset(preset: Preset) {
    onChange({ ...value, components: preset.components, budgets: preset.budgets, presetId: preset.id });
  }
  function toggleComponent(id: ComponentId) {
    onChange({
      ...value,
      components: components.includes(id) ? components.filter(c => c !== id) : [...components, id],
      presetId: 'custom',
    });
  }
  function setBudget(k: keyof Budgets, v: number) {
    onChange({ ...value, budgets: { ...budgets, [k]: v }, presetId: 'custom' });
  }
  function setGrammarMode(m: GrammarMode) {
    onChange({ ...value, grammarMode: m });
  }

  return (
    <>
      {/* Presets */}
      <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
        Preset
      </label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PRESETS.map((p) => {
          const active = presetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`text-left rounded-xl p-3 border-2 transition-all ${
                active ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-gray-200 bg-white hover:border-[#C8A8DC]'
              }`}
            >
              <p className="text-sm font-bold text-[#5A3D7A]">{p.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{p.description}</p>
            </button>
          );
        })}
        <button
          onClick={() => onChange({ ...value, presetId: 'custom' })}
          className={`text-left rounded-xl p-3 border-2 transition-all col-span-2 ${
            presetId === 'custom' ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-dashed border-gray-300 bg-white hover:border-[#C8A8DC]'
          }`}
        >
          <p className="text-sm font-bold text-[#5A3D7A]">✨ Custom</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Elegí exactamente qué evaluar.</p>
        </button>
      </div>

      {/* Component toggles */}
      <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
        Componentes
      </label>
      <div className="space-y-1.5 mb-4">
        {Object.values(COMPONENT_META).map((meta) => {
          const active = components.includes(meta.id);
          const disabled = !meta.available;
          return (
            <button
              key={meta.id}
              onClick={() => !disabled && toggleComponent(meta.id)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                active ? 'border-[#5A3D7A] bg-[#F0E5FF]'
                : disabled ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                : 'border-gray-200 bg-white hover:border-[#C8A8DC]'
              }`}
            >
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[11px] font-bold shrink-0 ${
                active ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-300'
              }`}>{active ? '✓' : ''}</span>
              <span className="text-lg shrink-0">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#2D1B4E]">{meta.label}</p>
                  {disabled && (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Próximo
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">{meta.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Budget sliders */}
      {(components.includes('grammar') || components.includes('vocabulary') || components.includes('reading')) && (
        <div className="mb-4 bg-[#FDFAFF] border border-[#E8D5F0] rounded-xl p-3 space-y-3">
          <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
            Cantidad de preguntas
          </p>
          {components.includes('grammar') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#2D1B4E]">
                  Modo del test ({grammarMode === 'adaptive' ? 'adaptativo' : 'lineal'})
                </label>
              </div>
              {/* Mode toggle — applies to Grammar, Vocab and Reading */}
              <div className="flex gap-1 mb-3">
                {(['adaptive', 'linear'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setGrammarMode(m)}
                    className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      grammarMode === m
                        ? 'bg-[#5A3D7A] text-white'
                        : 'bg-white text-[#5A3D7A] border border-[#E8D5F0]'
                    }`}
                  >
                    {m === 'adaptive' ? '⚡ Adaptativo' : '📋 Lineal'}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#2D1B4E]">📘 Grammar</label>
                <span className="text-xs font-bold text-[#5A3D7A] tabular-nums">
                  {budgets.grammar} Q
                </span>
              </div>
              <input type="range" min={10} max={60} step={5} value={budgets.grammar}
                onChange={e => setBudget('grammar', Number(e.target.value))}
                className="w-full accent-[#5A3D7A]" />
              <p className="text-[10px] text-gray-500 leading-tight">
                {grammarMode === 'adaptive'
                  ? 'Arranca en A1. Corre las N preguntas completas ajustando dificultad on the go (4 correctas → sube, 3 erradas → baja).'
                  : 'Corre las preguntas en orden A0 → C1. Autostop tras 6 erradas seguidas.'}
              </p>
            </div>
          )}
          {components.includes('vocabulary') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#2D1B4E]">💬 Vocabulary</label>
                <span className="text-xs font-bold text-[#5A3D7A] tabular-nums">{budgets.vocabulary} Q</span>
              </div>
              <input type="range" min={5} max={40} step={5} value={budgets.vocabulary}
                onChange={e => setBudget('vocabulary', Number(e.target.value))}
                className="w-full accent-[#5A3D7A]" />
              <p className="text-[10px] text-gray-500 leading-tight">
                {grammarMode === 'adaptive'
                  ? 'Adaptativo: arranca en el nivel estimado por Grammar y ajusta on the go.'
                  : 'Lineal: calibrado al ±1 del nivel estimado por Grammar.'}
              </p>
            </div>
          )}
          {components.includes('reading') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#2D1B4E]">📖 Reading</label>
                <span className="text-xs font-bold text-[#5A3D7A] tabular-nums">{budgets.reading} pasaje{budgets.reading !== 1 ? 's' : ''}</span>
              </div>
              <input type="range" min={1} max={6} step={1} value={budgets.reading}
                onChange={e => setBudget('reading', Number(e.target.value))}
                className="w-full accent-[#5A3D7A]" />
              <p className="text-[10px] text-gray-500 leading-tight">
                {grammarMode === 'adaptive'
                  ? 'Adaptativo por pasaje: sube o baja el nivel del siguiente según accuracy en el actual.'
                  : 'Lineal: pasajes cercanos al nivel estimado por Grammar, más cercano primero.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl px-3 py-2 mb-4 flex items-center justify-between">
        <p className="text-xs text-[#5A3D7A]">
          <strong>{components.length}</strong> componente{components.length !== 1 ? 's' : ''} seleccionado{components.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs font-bold text-[#5A3D7A]">≈ {estimateMinutes(components, budgets)} min total</p>
      </div>
    </>
  );
}

// ── Live-test setup (teacher-led launch) ──────────────────────────────────

function LiveTestSetupModal({
  teacherId, onClose,
}: {
  teacherId: string;
  onClose: () => void;
}) {
  const standard = PRESETS.find(p => p.id === 'standard')!;
  const [cfg, setCfg] = useState<{ components: ComponentId[]; budgets: Budgets; presetId: string; grammarMode: GrammarMode }>({
    components:  standard.components,
    budgets:     standard.budgets,
    presetId:    standard.id,
    grammarMode: 'adaptive',
  });

  function launch() {
    if (cfg.components.length === 0) return;
    const params = new URLSearchParams({
      mode:        'teacher-led',
      components:  cfg.components.join(','),
      g:           String(cfg.budgets.grammar),
      v:           String(cfg.budgets.vocabulary),
      r:           String(cfg.budgets.reading),
      grammarMode: cfg.grammarMode,
    });
    window.open(`/placement-suite/${teacherId}?${params.toString()}`, '_blank', 'noopener,noreferrer');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(45,27,78,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white my-8">
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">Iniciar test en vivo</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Modo teacher-led · se abre en una pestaña nueva.
              </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>
        </div>

        <div className="p-6">
          <SuiteConfigForm value={cfg} onChange={setCfg} />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              onClick={launch}
              disabled={cfg.components.length === 0}
              className="flex-1 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: '#5A3D7A' }}
            >
              ▶ Iniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignTestModal({
  teacherId,
  approvedStudents,
  onClose,
}: {
  teacherId: string;
  approvedStudents: { uid: string; fullName: string; email: string }[];
  onClose: () => void;
}) {
  const standardPreset = PRESETS.find(p => p.id === 'standard')!;
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedUid, setSelectedUid] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('standard');
  const [components, setComponents] = useState<ComponentId[]>(standardPreset.components);
  const [budgets, setBudgets] = useState<Budgets>(standardPreset.budgets);
  const [grammarMode, setGrammarMode] = useState<GrammarMode>('adaptive');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [done, setDone]     = useState(false);

  const selected = approvedStudents.find(s => s.uid === selectedUid);

  async function handleAssign() {
    if (!selected) return;
    if (components.length === 0) { setError('Seleccioná al menos un componente.'); return; }
    setSaving(true); setError('');
    try {
      await createPlacementAssignment({
        teacherId,
        studentId:    selected.uid,
        studentName:  selected.fullName,
        studentEmail: selected.email,
        components,
        mode:         'student-self',
        budgets,
        grammarMode,
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al asignar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(45,27,78,0.45)', backdropFilter: 'blur(2px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white my-8">
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">Asignar placement test</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {done ? '¡Listo!' : `Paso ${step} de 2`}
              </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* Step indicator */}
          {!done && (
            <div className="flex gap-1.5 mt-3">
              <span className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-white' : 'bg-white/25'}`} />
              <span className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-white' : 'bg-white/25'}`} />
            </div>
          )}
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-semibold text-[#5A3D7A]">Test asignado a {selected?.fullName}</p>
              <p className="text-xs text-gray-400 mt-1">
                {components.length} componente{components.length !== 1 ? 's' : ''} · ~{estimateMinutes(components, budgets)} min
              </p>
              <button onClick={onClose}
                className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#5A3D7A' }}>
                Cerrar
              </button>
            </div>
          ) : step === 1 ? (
            <>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
                Estudiante
              </label>
              {approvedStudents.length === 0 ? (
                <p className="text-sm text-gray-400 mb-4">No hay estudiantes aprobados aún.</p>
              ) : (
                <select
                  value={selectedUid}
                  onChange={e => setSelectedUid(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                >
                  <option value="">Seleccionar estudiante...</option>
                  {approvedStudents.map(s => (
                    <option key={s.uid} value={s.uid}>{s.fullName}</option>
                  ))}
                </select>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedUid}
                  className="flex-1 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: '#5A3D7A' }}
                >
                  Continuar →
                </button>
              </div>
            </>
          ) : (
            <>
              <SuiteConfigForm
                value={{ components, budgets, presetId: selectedPresetId, grammarMode }}
                onChange={(v) => {
                  setComponents(v.components);
                  setBudgets(v.budgets);
                  setSelectedPresetId(v.presetId);
                  setGrammarMode(v.grammarMode);
                }}
              />

              {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleAssign}
                  disabled={saving || components.length === 0}
                  className="flex-1 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ background: '#5A3D7A' }}
                >
                  {saving ? 'Asignando…' : 'Asignar test'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function PlacementDashboardPage() {
  const auth   = getAuth();
  const uid    = auth.currentUser?.uid ?? '';

  const { sessions, loading } = usePlacementSessions(uid);
  const { sessions: suiteSessions } = usePlacementSuiteSessions(uid);
  const { pendingStudents, students }   = useStudents();
  const { assignments }                 = usePlacementAssignments(uid);

  const [search, setSearch]             = useState('');
  const [selectedSession, setSelected] = useState<PlacementSession | null>(null);
  const [showAssignModal, setShowAssign] = useState(false);
  const [showLiveModal, setShowLive]     = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<PlacementSuiteSession | null>(null);

  const approvedStudents = (students ?? [])
    .filter(s => s.status === 'approved')
    .map(s => ({ uid: s.uid, fullName: s.fullName, email: s.email }));

  const appUrl  = typeof window !== 'undefined' ? window.location.origin : '';
  const testUrl = uid ? `${appUrl}/placement/${uid}` : '';

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) =>
      s.studentName.toLowerCase().includes(q) ||
      (s.studentEmail ?? '').toLowerCase().includes(q),
    );
  }, [sessions, search]);

  async function handleLink(sessionId: string, studentId: string) {
    await _linkSession(sessionId, studentId);
  }

  const completed  = sessions.filter((s) => s.status !== 'in_progress').length;
  const unlinked   = sessions.filter((s) => !s.linkedStudentId && s.status !== 'in_progress').length;
  const thisMonth  = sessions.filter((s) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = s.createdAt as any;
    const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date((raw?.seconds ?? 0) * 1000);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: B.purple }}>Placement Tests</h1>
          <p className="text-sm mt-1" style={{ color: B.purpleMed }}>Grammar tests completed by prospective students</p>
        </div>
        {/* Share link pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowAssign(true)}
            className="text-sm font-bold px-4 py-2.5 rounded-xl text-white transition-all hover:opacity-90"
            style={{ background: B.purple }}>
            + Asignar a estudiante
          </button>
          <button
            onClick={() => uid && setShowLive(true)}
            disabled={!uid}
            className="text-sm font-bold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 border-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'white', color: B.purple, borderColor: B.purple }}
          >
            ▶ Iniciar test en vivo
          </button>
          {testUrl && (
            <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: B.lavender, border: `1px solid ${B.lavenderDark}` }}>
              <span className="text-xs font-semibold" style={{ color: B.purple }}>Test link:</span>
              <span className="text-xs truncate max-w-[180px]" style={{ color: B.purpleMed }}>{testUrl}</span>
              <button onClick={() => navigator.clipboard.writeText(testUrl)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                style={{ background: B.purple, color: 'white' }}>
                Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total tests',  value: sessions.length,  icon: '📋' },
          { label: 'Completed',    value: completed,          icon: '✅' },
          { label: 'Pending link', value: unlinked,           icon: '🔗' },
          { label: 'This month',   value: thisMonth,          icon: '📅' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4" style={{ background: 'white', border: `1px solid ${B.lavenderDark}`, boxShadow: '0 2px 12px -2px rgba(200,168,220,0.15)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <p className="text-2xl font-black" style={{ color: B.purple }}>{stat.value}</p>
            </div>
            <p className="text-xs" style={{ color: B.purpleMed }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending assignments */}
      {assignments.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: B.purpleMed }}>
            Tests asignados ({assignments.filter(a => a.status === 'pending').length} pendientes)
          </p>
          <div className="space-y-2">
            {assignments.map((a: PlacementAssignment) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                style={{ background: a.status === 'completed' ? '#F0FDF4' : B.lavender, border: `1px solid ${a.status === 'completed' ? '#BBF7D0' : B.lavenderDark}` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                    style={{ background: a.status === 'completed' ? '#16A34A' : B.purple }}>
                    {a.studentName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: B.purple }}>{a.studentName}</p>
                    <p className="text-xs truncate" style={{ color: B.purpleMed }}>{a.studentEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: a.status === 'completed' ? '#DCFCE7' : B.lavenderDark, color: a.status === 'completed' ? '#15803D' : B.purple }}>
                    {a.status === 'completed' ? '✓ Completado' : '⏳ Pendiente'}
                  </span>
                  <button
                    onClick={() => deletePlacementAssignment(a.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors hover:bg-red-50 hover:text-red-500"
                    style={{ color: B.purpleMed }}
                    title="Eliminar asignación">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Search by name or email…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ border: `2px solid ${B.lavenderDark}`, background: B.lavender, color: B.purple }}
          onFocus={(e) => { e.target.style.borderColor = B.purpleLight; }}
          onBlur={(e) => { e.target.style.borderColor = B.lavenderDark; }}
        />
      </div>

      {/* Table / empty state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: B.lavender }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: B.lavender }}>
            <span className="text-3xl">📐</span>
          </div>
          <p className="text-lg font-bold mb-1" style={{ color: B.purple }}>No placement tests yet</p>
          <p className="text-sm mb-4" style={{ color: B.purpleMed }}>Share your link with prospective students to get started.</p>
          {testUrl && (
            <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: B.lavender }}>
              <span className="text-xs font-mono" style={{ color: B.purpleMed }}>{testUrl}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${B.lavenderDark}`, boxShadow: '0 2px 16px -4px rgba(200,168,220,0.2)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: B.lavender }}>
                {['Student', 'Date', 'Status', 'Level', 'Score', 'Linked', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: B.purpleMed }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((session, idx) => {
                const st = STATUS_CONFIG[session.status] ?? { label: session.status, bg: B.lavender, text: B.purple };
                const acc = session.totalAnswered > 0
                  ? Math.round((session.totalCorrect / session.totalAnswered) * 100) : 0;

                return (
                  <tr key={session.id}
                    className="cursor-pointer transition-colors"
                    style={{ background: idx % 2 === 0 ? 'white' : B.bg, borderTop: `1px solid ${B.lavender}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = B.lavender)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'white' : B.bg)}
                    onClick={() => setSelected(session)}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: B.purple }}>{session.studentName}</p>
                      <p className="text-xs" style={{ color: B.purpleMed }}>{session.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: B.purpleMed }}>{formatDate(session.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: st.bg, color: st.text }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {session.placedLevel ? <LevelBadge level={session.placedLevel} /> : <span style={{ color: B.purpleLight }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium" style={{ color: B.purple }}>
                      {session.totalAnswered > 0 ? `${session.totalCorrect}/${session.totalAnswered} (${acc}%)` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {session.linkedStudentId
                        ? <span className="text-xs font-semibold" style={{ color: '#15803D' }}>✓ Linked</span>
                        : <span className="text-xs" style={{ color: B.purpleLight }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(session); }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: B.lavender, color: B.purple }}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Complete Placement (suite) sessions ─────────────────── */}
      {suiteSessions.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: B.purple }}>
              Complete Placements
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: B.lavender, color: B.purple }}>
              {suiteSessions.length}
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${B.lavenderDark}`, boxShadow: '0 2px 16px -4px rgba(200,168,220,0.2)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: B.lavender }}>
                  {['Student', 'Date', 'Components', 'Mode', 'Overall', 'Status'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: B.purpleMed }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suiteSessions.map((s: PlacementSuiteSession, idx) => (
                  <tr key={s.id}
                    onClick={() => setSelectedSuite(s)}
                    className="cursor-pointer transition-colors"
                    style={{ background: idx % 2 === 0 ? 'white' : B.bg, borderTop: `1px solid ${B.lavender}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = B.lavender)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'white' : B.bg)}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: B.purple }}>{s.studentName}</p>
                      {s.studentEmail && <p className="text-xs" style={{ color: B.purpleMed }}>{s.studentEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: B.purpleMed }}>{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {s.components.map((c) => (
                          <span key={c} className="text-sm" title={COMPONENT_META[c]?.label ?? c}>
                            {COMPONENT_META[c]?.icon ?? '❓'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: B.purpleMed }}>
                      {s.mode === 'teacher-led' ? '👤 Live' : '🎓 Self'}
                    </td>
                    <td className="px-4 py-3">
                      {s.overallLevel
                        ? <LevelBadge level={s.overallLevel} />
                        : <span style={{ color: B.purpleLight }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: s.status === 'completed' ? '#DCFCE7' : s.status === 'partially_completed' ? '#FEF3C7' : B.lavender,
                          color: s.status === 'completed' ? '#15803D' : s.status === 'partially_completed' ? '#92400E' : B.purple,
                        }}>
                        {s.status === 'completed' ? 'Completed' : s.status === 'partially_completed' ? 'Partial' : 'In progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          onClose={() => setSelected(null)}
          onLink={handleLink}
          pendingStudents={pendingStudents}
        />
      )}

      {showAssignModal && (
        <AssignTestModal
          teacherId={uid}
          approvedStudents={approvedStudents}
          onClose={() => setShowAssign(false)}
        />
      )}

      {showLiveModal && (
        <LiveTestSetupModal
          teacherId={uid}
          onClose={() => setShowLive(false)}
        />
      )}

      {selectedSuite && (
        <SuiteSessionModal
          session={selectedSuite}
          onClose={() => setSelectedSuite(null)}
        />
      )}
    </div>
  );
}
