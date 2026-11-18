// FriendlyTeaching.cl — Link a registered student account to historical
// records that currently live under a different (unlinked) name.
//
// Context: the teacher usually registers students manually, so a freshly
// created account can land next to a pile of recurring-booking rows and
// classHistory entries that were recorded under an alias, nickname, or
// the pre-account name. This modal surfaces every unlinked name tied to
// this teacher and lets them attach selected aliases to the account in
// one batched operation. Both bookings and classHistory are patched so
// the student's dashboard, analytics, and attendance all merge cleanly.
'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  collection, query, where, getDocs,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Link2, Loader2, Check, AlertCircle, History } from 'lucide-react';
import { linkBookingsByNames } from '@/hooks/useRecurringBookings';
import { linkClassHistoryByNames } from '@/hooks/useClassHistory';

interface Candidate {
  name: string;
  bookings: number;       // unlinked bookings under this name
  classes: number;        // unlinked classHistory entries under this name
  lastActivityMs: number; // for sorting
}

async function loadCandidates(teacherId: string, excludeName: string): Promise<Candidate[]> {
  // Pull everything unlinked in one go. A teacher's roster is small enough
  // that scanning the full bookings + classHistory collections for them is
  // cheap, and it means we don't miss one-off bookings or long-tail aliases.
  const [bookingsSnap, historySnap] = await Promise.all([
    getDocs(query(collection(db, 'bookings'), where('teacherId', '==', teacherId))),
    getDocs(query(collection(db, 'classHistory'), where('teacherId', '==', teacherId))),
  ]);

  const map = new Map<string, Candidate>();
  const bump = (name: string, kind: 'bookings' | 'classes', ms: number) => {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === excludeName.trim().toLowerCase()) return;
    const prev = map.get(trimmed) ?? { name: trimmed, bookings: 0, classes: 0, lastActivityMs: 0 };
    prev[kind] += 1;
    if (ms > prev.lastActivityMs) prev.lastActivityMs = ms;
    map.set(trimmed, prev);
  };

  bookingsSnap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    if (data.studentId) return;
    const name = data.studentName;
    if (typeof name !== 'string') return;
    const ts = data.createdAt;
    const ms = typeof ts?.toDate === 'function' ? ts.toDate().getTime() : 0;
    bump(name, 'bookings', ms);
  });

  historySnap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    if (data.studentId) return;
    const name = data.studentName;
    if (typeof name !== 'string') return;
    const raw = data.date;
    const ms = typeof raw?.toDate === 'function' ? raw.toDate().getTime() : 0;
    bump(name, 'classes', ms);
  });

  return [...map.values()].sort((a, b) => b.lastActivityMs - a.lastActivityMs);
}

function timeAgo(ms: number): string {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function LinkHistoryModal({
  studentId,
  studentFullName,
  teacherId,
  onClose,
}: {
  studentId: string;
  studentFullName: string;
  teacherId: string;
  onClose: () => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [linking, setLinking] = useState(false);
  const [result, setResult] = useState<{ bookings: number; classes: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await loadCandidates(teacherId, studentFullName);
        if (!cancelled) setCandidates(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [teacherId, studentFullName]);

  const filtered = useMemo(() => {
    if (!candidates) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => c.name.toLowerCase().includes(q));
  }, [candidates, filter]);

  const totals = useMemo(() => {
    let bookings = 0;
    let classes = 0;
    for (const name of selected) {
      const c = candidates?.find((x) => x.name === name);
      if (!c) continue;
      bookings += c.bookings;
      classes += c.classes;
    }
    return { bookings, classes };
  }, [selected, candidates]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleLink() {
    if (selected.size === 0) return;
    setLinking(true);
    setError(null);
    try {
      const names = [...selected];
      const [bookings, classes] = await Promise.all([
        linkBookingsByNames(teacherId, studentId, studentFullName, names),
        linkClassHistoryByNames(teacherId, studentId, studentFullName, names),
      ]);
      setResult({ bookings, classes });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center flex-shrink-0">
            <Link2 className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#5A3D7A] leading-tight">Link to previous history</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Bind unlinked bookings and class history to <strong>{studentFullName}</strong>'s account.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {result ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <p className="text-[#5A3D7A] font-bold mb-1">History linked</p>
              <p className="text-sm text-gray-500">
                {result.bookings} booking{result.bookings === 1 ? '' : 's'} + {result.classes} class record{result.classes === 1 ? '' : 's'} now point to {studentFullName}.
              </p>
            </div>
          ) : candidates === null ? (
            <div className="p-10 flex flex-col items-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Scanning history…</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-10 text-center">
              <History className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={2} />
              <p className="text-sm font-semibold text-gray-500">No unlinked history found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Every booking and class record under your account is already tied to a registered student.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by name…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
              />
              <p className="text-[11px] text-gray-400 px-1 leading-relaxed">
                Pick every alias this student used before signing up. Linked records will show {studentFullName} as the student from now on.
              </p>
              <div className="space-y-1.5">
                {filtered.map((c) => {
                  const isSel = selected.has(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggle(c.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        isSel ? 'border-[#9B7CB8] bg-[#F7EFFF]' : 'border-gray-100 bg-white hover:border-[#C8A8DC]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                        isSel ? 'bg-[#9B7CB8] border-[#9B7CB8] text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSel && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {c.bookings > 0 && <>{c.bookings} booking{c.bookings === 1 ? '' : 's'}</>}
                          {c.bookings > 0 && c.classes > 0 && <> · </>}
                          {c.classes > 0 && <>{c.classes} class record{c.classes === 1 ? '' : 's'}</>}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(c.lastActivityMs)}</span>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No names match &ldquo;{filter}&rdquo;.</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && candidates && candidates.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center gap-3">
            <div className="text-xs text-gray-500 flex-1 min-w-0">
              {selected.size === 0 ? (
                <span>Select at least one alias to link.</span>
              ) : (
                <span>
                  Will link <strong>{totals.bookings}</strong> booking{totals.bookings === 1 ? '' : 's'} + <strong>{totals.classes}</strong> class record{totals.classes === 1 ? '' : 's'}.
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLink}
              disabled={linking || selected.size === 0}
              className="px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-full text-xs font-bold disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
            >
              {linking ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Linking…</> : <><Link2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Link {selected.size || ''}</>}
            </button>
          </div>
        )}

        {result && (
          <div className="p-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-full text-xs font-bold"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
