// FriendlyWriting® — teacher catalog + submissions tray.
//
// Two sections stacked: the lesson catalog (click any lesson to preview it
// using the student runner), and a live submissions tray that pulls from
// Firestore and lets the teacher expand each submission to read the text,
// the student's brainstorm notes, and their reflection.

'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  updateDoc, doc, Timestamp,
  type QuerySnapshot, type DocumentData, type FirestoreError,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Clock, PenLine, ChevronDown, ChevronUp, Inbox,
  CheckCircle2, Circle, ExternalLink,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { FRIENDLYWRITING_LESSONS } from '@/lib/data/friendlywriting';
import type { FWLesson, FWTaskType } from '@/types/friendlywriting';

const TASK_LABEL: Record<FWTaskType, string> = {
  'ielts-gt-t1-letter-informal':   'IELTS GT · Informal letter',
  'ielts-gt-t1-letter-semiformal': 'IELTS GT · Semi-formal letter',
  'ielts-gt-t1-letter-formal':     'IELTS GT · Formal letter',
  'ielts-ac-t1-report':            'IELTS Academic · Report',
  'ielts-t2-essay':                'IELTS Task 2 · Essay',
};

interface Submission {
  id:            string;
  userEmail:     string | null;
  lessonId:      string;
  lessonTitle:   string;
  lessonLevel:   string;
  text:          string;
  wordCount:     number;
  minWords:      number;
  brainstorm:    Record<string, string>;
  reflection:    Record<string, string>;
  submittedAt:   Timestamp | null;
  reviewed:      boolean;
}

export default function FriendlywritingTeacherPage() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  useEffect(() => {
    const q = query(
      collection(db, 'friendlywritingSubmissions'),
      orderBy('submittedAt', 'desc'),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setSubs(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...(d.data() as Omit<Submission, 'id'>),
        })));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('[friendlywriting] submissions listener failed', err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'pending')  return subs.filter(s => !s.reviewed);
    if (filter === 'reviewed') return subs.filter(s => s.reviewed);
    return subs;
  }, [subs, filter]);

  const toggleReviewed = async (s: Submission) => {
    try {
      await updateDoc(doc(db, 'friendlywritingSubmissions', s.id), { reviewed: !s.reviewed });
    } catch (err) {
      console.error('[friendlywriting] toggle reviewed failed', err);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FFFDF5] text-[#2E2A33]">
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-16">
        <TopBar
          title="FriendlyWriting®"
          subtitle="Scaffolded writing lessons + live submissions from your students."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'FriendlyWriting' },
          ]}
        />

        {/* ── Lesson catalog ──────────────────────────── */}
        <section className="mt-10">
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#7A7387]">Catalog</p>
              <h2 className="font-serif text-2xl text-[#2E2A33]">Lessons</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FRIENDLYWRITING_LESSONS.map(lesson => (
              <TeacherLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>

        {/* ── Submissions ─────────────────────────────── */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#7A7387]">Inbox</p>
              <h2 className="font-serif text-2xl text-[#2E2A33] flex items-center gap-2">
                Submissions
                {subs.filter(s => !s.reviewed).length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#E87BAD] text-white text-xs font-bold">
                    {subs.filter(s => !s.reviewed).length}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-black/5 shadow-sm">
              {(['pending', 'reviewed', 'all'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition"
                  style={{
                    background: filter === k ? '#2E2A33' : 'transparent',
                    color: filter === k ? 'white' : '#7A7387',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-[#7A7387] py-8 text-center">Loading submissions…</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/5 py-12 text-center">
              <Inbox className="w-8 h-8 text-[#C3BDCA] mx-auto mb-3" strokeWidth={1.8} />
              <p className="text-sm text-[#7A7387]">
                {filter === 'pending'
                  ? "No pending submissions — you're all caught up."
                  : filter === 'reviewed'
                    ? 'No reviewed submissions yet.'
                    : 'No submissions yet.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map(s => (
                <SubmissionCard
                  key={s.id}
                  sub={s}
                  open={expanded === s.id}
                  onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  onToggleReviewed={() => toggleReviewed(s)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function TeacherLessonCard({ lesson }: { lesson: FWLesson }) {
  const from = lesson.cover.palette?.from ?? lesson.cover.accent;
  const to   = lesson.cover.palette?.to   ?? lesson.cover.accent;
  return (
    <Link
      href={`/dashboard/student/writing/${lesson.id}`}
      className="group block bg-white rounded-2xl border border-black/5 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.2)] hover:shadow-[0_16px_34px_-18px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all overflow-hidden"
    >
      <div
        className="h-24 relative px-5 flex items-center justify-between text-white"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="text-[10px] font-black tracking-widest text-white/80">{lesson.level}</span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 mt-0.5">
            {TASK_LABEL[lesson.taskType]}
          </p>
        </div>
        <div className="text-4xl relative">{lesson.cover.emoji ?? '✍️'}</div>
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl text-[#2E2A33] leading-tight">{lesson.title}</h3>
        <p className="text-xs text-[#7A7387] mt-1">{lesson.subtitle}</p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-[#7A7387]">
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={2.5} /> {lesson.estimatedMin} min</span>
          <span className="inline-flex items-center gap-1"><PenLine className="w-3 h-3" strokeWidth={2.5} /> 6 steps</span>
          <span className="inline-flex items-center gap-1 ml-auto font-semibold" style={{ color: lesson.cover.accent }}>
            Preview <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SubmissionCard(
  { sub, open, onToggle, onToggleReviewed }:
  { sub: Submission; open: boolean; onToggle: () => void; onToggleReviewed: () => void }
) {
  const when = sub.submittedAt?.toDate?.();
  const whenStr = when
    ? when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
      when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const under = sub.wordCount < sub.minWords;

  return (
    <li className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={e => { e.stopPropagation(); onToggleReviewed(); }}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition"
          style={{
            background: sub.reviewed ? '#EAF7EB' : '#F7F4FA',
            color: sub.reviewed ? '#7BC67E' : '#C3BDCA',
          }}
          aria-label={sub.reviewed ? 'Mark pending' : 'Mark reviewed'}
        >
          {sub.reviewed ? <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} /> : <Circle className="w-5 h-5" strokeWidth={2.5} />}
        </button>
        <button onClick={onToggle} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black tracking-widest text-[#7A7387]">{sub.lessonLevel}</span>
            <span className="font-semibold text-[#2E2A33] text-sm truncate">{sub.lessonTitle}</span>
          </div>
          <div className="flex items-center gap-x-3 gap-y-0.5 text-[11px] text-[#7A7387] mt-0.5 flex-wrap">
            <span className="truncate max-w-[200px]">{sub.userEmail ?? 'unknown'}</span>
            <span>·</span>
            <span>{whenStr}</span>
            <span>·</span>
            <span>
              <span className={under ? 'text-amber-700 font-semibold' : 'font-semibold text-[#2E2A33]'}>
                {sub.wordCount}
              </span>
              <span> / {sub.minWords} words</span>
              {under && <span className="ml-1 text-amber-700">(under)</span>}
            </span>
          </div>
        </button>
        <button onClick={onToggle} className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-[#F7F4FA] flex items-center justify-center text-[#7A7387]">
          {open ? <ChevronUp className="w-4 h-4" strokeWidth={2.5} /> : <ChevronDown className="w-4 h-4" strokeWidth={2.5} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-[#FBF9F4] p-5 space-y-5">
          {/* The piece */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387] mb-2">Student's piece</p>
            <article className="bg-white rounded-xl border border-black/5 p-5 font-serif text-[15px] leading-[1.75] text-[#2E2A33] whitespace-pre-wrap">
              {sub.text || <span className="text-[#7A7387] italic">Empty submission.</span>}
            </article>
          </div>

          {/* Brainstorm */}
          {sub.brainstorm && Object.keys(sub.brainstorm).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387] mb-2">Brainstorm notes</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(sub.brainstorm).map(([id, note]) => note?.trim() && (
                  <li key={id} className="bg-white rounded-lg border border-black/5 p-3 text-xs">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#C3BDCA] mb-0.5">{id}</p>
                    <p className="text-[#2E2A33]">{note}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reflection */}
          {sub.reflection && Object.keys(sub.reflection).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387] mb-2">Reflection</p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {Object.entries(sub.reflection).map(([id, note]) => note?.trim() && (
                  <li key={id} className="bg-white rounded-lg border border-black/5 p-3 text-xs">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#C3BDCA] mb-0.5">{id}</p>
                    <p className="text-[#2E2A33] italic">"{note}"</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
