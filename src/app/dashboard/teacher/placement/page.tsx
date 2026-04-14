'use client';
// FriendlyTeaching.cl — Teacher Placement Test Dashboard

import { useState, useMemo } from 'react';
import { getAuth } from 'firebase/auth';
import { usePlacementSessions, linkSessionToStudent as _linkSession } from '@/hooks/usePlacementSessions';
import { useStudents } from '@/hooks/useStudents';
import { TOPIC_LABELS } from '@/data/placementQuestions';
import type { PlacementSession, SectionScore, WeakArea } from '@/types/placement';
import type { LessonLevel } from '@/types/firebase';

// ── Level badge colours ────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  A0:   'bg-gray-100 text-gray-700',
  A1:   'bg-blue-100 text-blue-700',
  A2:   'bg-sky-100 text-sky-700',
  B1:   'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2:   'bg-yellow-100 text-yellow-700',
  C1:   'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  completed:          { label: 'Completed',   style: 'bg-green-100 text-green-700' },
  stopped_by_ceiling: { label: 'Auto-stopped', style: 'bg-amber-100 text-amber-700' },
  in_progress:        { label: 'In progress',  style: 'bg-blue-100 text-blue-700' },
};

function formatDate(ts: unknown): string {
  if (!ts) return '—';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = ts as any;
  const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw?.seconds * 1000);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Section score bar ─────────────────────────────────────────
function SectionBar({ section }: { section: SectionScore }) {
  const color = section.passed
    ? 'bg-green-500'
    : section.total < 4
    ? 'bg-gray-300'
    : 'bg-red-400';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-8 text-center font-semibold px-1 py-0.5 rounded text-white text-[10px] ${LEVEL_COLORS[section.level]?.replace('text-', 'bg-').replace('bg-', 'bg-')}`}
        style={{ background: 'transparent', color: 'inherit' }}>
        {section.level}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${section.pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-gray-500">
        {section.total > 0 ? `${section.correct}/${section.total} (${section.pct}%)` : '—'}
      </span>
    </div>
  );
}

// ── Session detail modal ──────────────────────────────────────
function SessionModal({
  session,
  onClose,
  onLink,
  pendingStudents,
}: {
  session: PlacementSession;
  onClose: () => void;
  onLink: (sessionId: string, studentId: string) => Promise<void>;
  pendingStudents: { uid: string; fullName: string }[];
}) {
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linking, setLinking]             = useState(false);
  const [tab, setTab]                     = useState<'results' | 'program'>('results');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const testUrl = `${appUrl}/placement/${session.teacherId}`;

  async function handleLink() {
    if (!linkStudentId) return;
    setLinking(true);
    await onLink(session.id, linkStudentId);
    setLinking(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{session.studentName}</h2>
            <p className="text-sm text-gray-500">{session.studentEmail}</p>
            {session.studentPhone && (
              <p className="text-sm text-gray-500">{session.studentPhone}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {session.placedLevel && (
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${LEVEL_COLORS[session.placedLevel] ?? ''}`}>
                {session.placedLevel}
              </span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          {(['results', 'program'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'results' ? 'Test Results' : 'Learning Program'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {tab === 'results' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{session.totalAnswered}</p>
                  <p className="text-xs text-gray-500 mt-1">Questions answered</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{session.totalCorrect}</p>
                  <p className="text-xs text-gray-500 mt-1">Correct</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-600">
                    {session.totalAnswered > 0
                      ? Math.round((session.totalCorrect / session.totalAnswered) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Overall accuracy</p>
                </div>
              </div>

              {/* Section scores */}
              {session.sectionScores && session.sectionScores.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Score by level</h3>
                  <div className="space-y-2">
                    {session.sectionScores.map((s) => (
                      <SectionBar key={s.level} section={s} />
                    ))}
                  </div>
                </div>
              )}

              {/* Weak areas */}
              {session.weakAreas && session.weakAreas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Weak areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {session.weakAreas.map((w) => (
                      <span
                        key={w.topic}
                        className="bg-red-50 text-red-700 text-xs px-3 py-1 rounded-full border border-red-200"
                        title={`${w.correct}/${w.total} correct (${w.pct}%)`}
                      >
                        {TOPIC_LABELS[w.topic] ?? w.topic} — {w.pct}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Link to student */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Link to a pending student</h3>
                {session.linkedStudentId ? (
                  <p className="text-sm text-green-600">Linked to student ID: {session.linkedStudentId}</p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={linkStudentId}
                      onChange={(e) => setLinkStudentId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select pending student…</option>
                      {pendingStudents.map((s) => (
                        <option key={s.uid} value={s.uid}>{s.fullName}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleLink}
                      disabled={!linkStudentId || linking}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      {linking ? 'Linking…' : 'Link'}
                    </button>
                  </div>
                )}
              </div>

              {/* Test URL share */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Share test link</h3>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={testUrl}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 bg-gray-50"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(testUrl)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'program' && (
            <>
              {session.learningProgram ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${LEVEL_COLORS[session.learningProgram.placedLevel] ?? ''}`}>
                      {session.learningProgram.placedLevel}
                    </span>
                    <p className="text-sm text-gray-600">12-week personalised learning plan</p>
                  </div>
                  {session.learningProgram.weeks.map((week) => (
                    <div key={week.week} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 text-xs font-bold">W{week.week}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{week.focus}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{week.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Learning program not generated yet.</p>
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
  const auth    = getAuth();
  const uid     = auth.currentUser?.uid ?? '';

  const { sessions, loading }  = usePlacementSessions(uid);
  const { pendingStudents }    = useStudents();

  const [search, setSearch]             = useState('');
  const [selectedSession, setSelected] = useState<PlacementSession | null>(null);

  const appUrl  = typeof window !== 'undefined' ? window.location.origin : '';
  const testUrl = `${appUrl}/placement/${uid}`;

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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Tests</h1>
          <p className="text-gray-500 text-sm mt-1">Grammar tests completed by prospective students</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 flex items-center gap-2 max-w-xs">
            <span className="text-xs text-indigo-600 font-medium">Share link:</span>
            <input
              readOnly
              value={uid ? testUrl : 'Loading…'}
              className="text-xs text-gray-600 bg-transparent outline-none truncate w-40"
            />
            <button
              onClick={() => navigator.clipboard.writeText(testUrl)}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total tests',   value: sessions.length },
          { label: 'Completed',     value: sessions.filter((s) => s.status !== 'in_progress').length },
          { label: 'Not linked',    value: sessions.filter((s) => !s.linkedStudentId && s.status !== 'in_progress').length },
          { label: 'This month',    value: sessions.filter((s) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = s.createdAt as any;
            const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date((raw?.seconds ?? 0) * 1000);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-2">No placement tests yet</p>
          <p className="text-sm">Share your test link with prospective students to get started.</p>
          <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 inline-block">
            <p className="text-xs text-gray-600 font-mono">{uid ? testUrl : '—'}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Student</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Level</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Score</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Linked</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((session) => {
                const status = STATUS_LABELS[session.status] ?? { label: session.status, style: 'bg-gray-100 text-gray-600' };
                const accuracy = session.totalAnswered > 0
                  ? Math.round((session.totalCorrect / session.totalAnswered) * 100)
                  : 0;

                return (
                  <tr key={session.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(session)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{session.studentName}</p>
                      <p className="text-xs text-gray-500">{session.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(session.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.style}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {session.placedLevel ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${LEVEL_COLORS[session.placedLevel] ?? ''}`}>
                          {session.placedLevel}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {session.totalAnswered > 0
                        ? `${session.totalCorrect}/${session.totalAnswered} (${accuracy}%)`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {session.linkedStudentId ? (
                        <span className="text-green-600 text-xs">Linked</span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(session); }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
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

      {/* Detail modal */}
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
