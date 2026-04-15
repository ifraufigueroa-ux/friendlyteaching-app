'use client';
// FriendlyTeaching.cl — Teacher Placement Test Dashboard

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';
import { usePlacementSessions, linkSessionToStudent as _linkSession } from '@/hooks/usePlacementSessions';
import { useStudents } from '@/hooks/useStudents';
import { TOPIC_LABELS } from '@/data/placementQuestions';
import type { PlacementSession, SectionScore } from '@/types/placement';

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
  const [tab, setTab]                     = useState<'results' | 'program'>('results');
  const appUrl  = typeof window !== 'undefined' ? window.location.origin : '';
  const testUrl = `${appUrl}/placement/${session.teacherId}`;

  async function handleLink() {
    if (!linkStudentId) return;
    setLinking(true);
    await onLink(session.id, linkStudentId);
    setLinking(false);
  }

  async function handleDownloadPdf() {
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
          studentName:   session.studentName,
          studentEmail:  session.studentEmail,
          studentPhone:  session.studentPhone,
          placedLevel:   session.placedLevel,
          totalAnswered: session.totalAnswered,
          totalCorrect:  session.totalCorrect,
          sectionScores: session.sectionScores ?? [],
          weakAreas:     session.weakAreas ?? [],
          answers:       serializeAnswers,
          completedAt,
          status:        session.status,
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

          {/* Top action row */}
          <div className="relative flex items-center justify-end gap-2 mb-5">
            <button onClick={handleDownloadPdf} disabled={downloading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              {downloading ? '…' : '⬇ PDF'}
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:bg-white/20"
              style={{ fontSize: '18px', lineHeight: 1 }}>
              ×
            </button>
          </div>

          {/* Brand block — centred, prominent */}
          <div className="relative flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mb-3 ring-4 ring-white/20"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
              <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={64} height={64} className="object-cover w-full h-full" />
            </div>
            <p className="text-xl font-black text-white tracking-tight leading-none">FriendlyTeaching</p>
            <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Grammar Placement Test</p>
          </div>

          {/* Divider */}
          <div className="relative w-full mb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />

          {/* Student info + level */}
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Placement Test Result</p>
              <h2 className="text-xl font-bold text-white">{session.studentName}</h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{session.studentEmail}</p>
              {session.studentPhone && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{session.studentPhone}</p>}
            </div>
            {session.placedLevel && (
              <div className="text-center flex-shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Level</p>
                <span className="text-2xl font-black text-white px-4 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {session.placedLevel}
                </span>
              </div>
            )}
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

// ── Main page ─────────────────────────────────────────────────
export default function PlacementDashboardPage() {
  const auth   = getAuth();
  const uid    = auth.currentUser?.uid ?? '';

  const { sessions, loading } = usePlacementSessions(uid);
  const { pendingStudents }   = useStudents();

  const [search, setSearch]             = useState('');
  const [selectedSession, setSelected] = useState<PlacementSession | null>(null);

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

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          onClose={() => setSelected(null)}
          onLink={handleLink}
          pendingStudents={pendingStudents}
        />
      )}
    </div>
  );
}
