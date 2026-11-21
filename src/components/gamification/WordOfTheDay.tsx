// FriendlyTeaching.cl — Word of the Day interactive component (Student Dashboard)
//
// Rewritten to match the profile's gamified board palette: game-card
// chrome (border + drop-shadow), Fredoka titles, same purple tokens as
// the welcome hero / daily missions. Previous glass-card + pastel pink
// strip read as a different product from the rest of the student view.
'use client';

import { useEffect, useState } from 'react';
import {
  BookMarked,
  Medal,
  PenTool,
  FileText,
  Flame,
  Lightbulb,
  Eye,
  CheckCircle2,
  Send,
  Zap,
  MessageSquare,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import {
  useWordOfDay, countUnreadFeedback, markWordFeedbackRead,
  type WordSubmission,
} from '@/hooks/useWordOfDay';
import { XP_REWARDS } from '@/types/firebase';

interface Props {
  studentId: string;
  onXpAwarded?: (xp: number) => void;
  recordWordOfDay?: (wordStreak: number) => Promise<void>;
}

export default function WordOfTheDay({ studentId, onXpAwarded, recordWordOfDay }: Props) {
  const {
    wordOfDay,
    todaySubmission,
    recentSubmissions,
    wordStreak,
    totalSubmissions,
    loading,
    submitExample,
    hasSubmittedToday,
  } = useWordOfDay(studentId);

  // Submissions that have teacher feedback the student hasn't opened
  // yet — drives the (N) badge in the title row.
  const unreadFeedbackCount = countUnreadFeedback(recentSubmissions);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackSubs = recentSubmissions.filter((s) => !!s.feedback);

  const [example, setExample] = useState('');
  const [showMeaning, setShowMeaning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!example.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ok = await submitExample(example);
      if (ok) {
        setJustSubmitted(true);
        const newStreak = wordStreak + 1;
        if (recordWordOfDay) await recordWordOfDay(newStreak);
        onXpAwarded?.(XP_REWARDS.WORD_OF_DAY);
        setTimeout(() => setJustSubmitted(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="game-card rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-[#f3eefc] rounded w-32 mb-3" />
        <div className="h-6 bg-[#f3eefc] rounded w-48 mb-2" />
        <div className="h-3 bg-[#f3eefc] rounded w-40" />
      </div>
    );
  }

  const StreakIcon: LucideIcon =
    wordStreak >= 30 ? Medal :
    wordStreak >= 14 ? PenTool :
    wordStreak >= 7  ? FileText :
    wordStreak >= 3  ? Flame :
    BookMarked;

  return (
    <div className="game-card rounded-2xl overflow-hidden">
      <div className="p-5">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="inline-flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#f3eefc] text-[#845ec2] flex items-center justify-center flex-shrink-0">
              <PenTool className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <p className="font-fun font-bold text-[#4b3869] text-sm truncate">Word of the Day</p>
            {unreadFeedbackCount > 0 && (
              <button
                type="button"
                onClick={() => setShowFeedback(true)}
                aria-label={`${unreadFeedbackCount} new teacher feedback${unreadFeedbackCount === 1 ? '' : 's'}`}
                className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold shadow-[0_2px_6px_rgba(244,63,94,0.45)] ring-2 ring-white hover:scale-105 transition-transform animate-pulse"
              >
                ({unreadFeedbackCount})
              </button>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 bg-[#f3eefc] px-2.5 py-1 rounded-xl border border-[#e5d9f2] flex-shrink-0">
            <StreakIcon className="w-3.5 h-3.5 text-[#845ec2]" strokeWidth={2.25} />
            <span className="text-[11px] font-fun font-bold text-[#6b4c9a]">
              {wordStreak} day{wordStreak !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Teacher feedback inbox — collapsible. Button is visible
            whenever there is at least one feedback on file. */}
        {feedbackSubs.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowFeedback((v) => !v)}
              className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl bg-[#f3eefc] border border-[#e5d9f2] text-[#5A3D7A] text-xs font-bold hover:bg-[#e8dcf7] transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" strokeWidth={2.5} />
                Teacher feedback
                {unreadFeedbackCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                    {unreadFeedbackCount}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFeedback ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </button>
            {showFeedback && (
              <FeedbackList subs={feedbackSubs} />
            )}
          </div>
        )}

        {/* Word display */}
        <div className="mb-4">
          <p className="font-fun text-3xl font-bold text-[#4b3869] leading-tight tracking-tight">
            {wordOfDay.word}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-[#9474c4] font-mono">{wordOfDay.ipa}</span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-xs text-slate-500 italic">{wordOfDay.type}</span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              wordOfDay.level === 'C1' ? 'bg-purple-100 text-purple-700' :
              wordOfDay.level === 'B2' ? 'bg-amber-100 text-amber-700' :
              wordOfDay.level === 'B1' ? 'bg-emerald-100 text-emerald-700' :
              'bg-sky-100 text-sky-700'
            }`}>
              {wordOfDay.level}
            </span>
          </div>
        </div>

        {/* Reveal meaning toggle */}
        <button
          onClick={() => setShowMeaning(!showMeaning)}
          className="w-full text-left mb-4 group"
        >
          <div className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
            showMeaning
              ? 'bg-[#f3eefc] border-[#e5d9f2] p-4'
              : 'bg-white border-[#e5d9f2] p-3 hover:border-[#d0bdf4] hover:bg-[#fcfbfe]'
          }`}>
            {showMeaning ? (
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] font-bold text-[#845ec2] uppercase tracking-wider mb-0.5">Meaning</p>
                  <p className="text-sm font-semibold text-[#4b3869]">{wordOfDay.meaning}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#845ec2] uppercase tracking-wider mb-0.5">Example</p>
                  <p className="text-sm text-slate-600 italic">&ldquo;{wordOfDay.example}&rdquo;</p>
                </div>
                {wordOfDay.tip && (
                  <div className="flex items-start gap-2 bg-white rounded-xl p-2.5 border border-[#e5d9f2]">
                    <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" strokeWidth={2.25} />
                    <p className="text-xs text-[#4b3869] leading-relaxed">{wordOfDay.tip}</p>
                  </div>
                )}
                <p className="text-[10px] text-[#9474c4] text-center mt-1">Tap to hide ▲</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b4c9a] font-medium inline-flex items-center gap-1.5">
                  <Eye className="w-4 h-4" strokeWidth={2.25} /> Tap to see meaning, example & tip
                </span>
                <span className="text-[#845ec2] text-lg group-hover:translate-y-0.5 transition-transform">▼</span>
              </div>
            )}
          </div>
        </button>

        {/* Submission area */}
        {hasSubmittedToday || justSubmitted ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-center">
            <CheckCircle2 className="w-7 h-7 mx-auto mb-1 text-emerald-500" strokeWidth={2.25} />
            <p className="font-fun text-sm font-bold text-emerald-700">
              {justSubmitted ? 'Example sent!' : "You're done for today!"}
            </p>
            {todaySubmission && (
              <p className="text-xs text-emerald-600 mt-1 italic">&ldquo;{todaySubmission.example}&rdquo;</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="text-center">
                <p className="font-fun text-lg font-bold text-emerald-700">{wordStreak}</p>
                <p className="text-[10px] text-emerald-600">Streak</p>
              </div>
              <div className="w-px h-8 bg-emerald-200" />
              <div className="text-center">
                <p className="font-fun text-lg font-bold text-emerald-700">{totalSubmissions}</p>
                <p className="text-[10px] text-emerald-600">Total</p>
              </div>
              <div className="w-px h-8 bg-emerald-200" />
              <div className="text-center">
                <p className="font-fun text-lg font-bold text-emerald-700">+{XP_REWARDS.WORD_OF_DAY}</p>
                <p className="text-[10px] text-emerald-600">XP</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#4b3869] mb-1.5 block">
                Write a sentence using &ldquo;{wordOfDay.word}&rdquo;
              </label>
              <textarea
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder={`e.g. "${wordOfDay.word} is..."`}
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2.5 border-2 border-[#e5d9f2] rounded-2xl text-sm focus:outline-none focus:border-[#845ec2] bg-white resize-none placeholder:text-slate-300"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-slate-400">{example.length}/300</p>
                <p className="text-[10px] text-[#6b4c9a] font-semibold inline-flex items-center gap-1">
                  <Zap className="w-3 h-3" strokeWidth={2.5} /> +{XP_REWARDS.WORD_OF_DAY} XP on send
                </p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!example.trim() || submitting}
              className={`btn-game w-full py-3 font-fun font-bold rounded-2xl text-sm flex items-center justify-center gap-2 uppercase tracking-wider ${
                example.trim() ? '' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Send example
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Collapsible teacher-feedback inbox ────────────────────────
// Lists the submissions that have feedback, newest first. On mount it
// marks every unread entry as read (best-effort — ignored if the write
// fails, so the user never sees an error over a dismissed badge).

function FeedbackList({ subs }: { subs: WordSubmission[] }) {
  useEffect(() => {
    const unreadIds = subs.filter((s) => !s.feedbackReadAt).map((s) => s.id);
    if (unreadIds.length === 0) return;
    void Promise.all(unreadIds.map((id) =>
      markWordFeedbackRead(id).catch(() => undefined),
    ));
  }, [subs]);

  if (subs.length === 0) return null;

  return (
    <ul className="mt-2 space-y-2">
      {subs.map((s) => (
        <li key={s.id} className="bg-white border border-[#e5d9f2] rounded-xl p-3 text-left">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] font-bold text-[#9474c4] uppercase tracking-wider truncate">
              {s.word} · {s.date}
            </p>
            {!s.feedbackReadAt && (
              <span className="inline-flex items-center justify-center text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                new
              </span>
            )}
          </div>
          <p className="text-[11px] italic text-slate-500 mb-1.5 leading-snug">
            &ldquo;{s.example}&rdquo;
          </p>
          <p className="text-sm text-[#4b3869] leading-snug">
            {s.feedback}
          </p>
        </li>
      ))}
    </ul>
  );
}
