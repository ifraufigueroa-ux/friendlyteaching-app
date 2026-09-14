// FriendlyTeaching.cl — TOEFL Writing section orchestrator
//
// Runs the three sub-tasks in canonical TOEFL Essentials order:
//    Build a Sentence (~4 min) → Write an Email (~7 min) → Academic
//    Discussion (~10 min)
// Each sub-task has its own timer; expiring a sub-task advances to the
// next. The parent gets one final callback with a composite
// WritingSectionSubmission.
//
// Autosave: this component consolidates snapshots from each sub-task
// into the parent's onSnapshot callback so a mid-section refresh
// restores whatever the student has typed so far.

'use client';
import { useCallback, useState } from 'react';
import type {
  TOEFLWritingSequence, WritingSectionSubmission, TOEFLLiveSnapshot,
  BuildSentenceAnswer, EmailSubmission, WritingSubmission,
} from '@/types/toefl';
import { BuildSentenceSection } from './BuildSentenceSection';
import { EmailSection } from './EmailSection';
import { WritingSection } from './WritingSection';

export interface WritingSequenceProps {
  seq:    TOEFLWritingSequence;
  onDone: (submission: WritingSectionSubmission) => void;
  /** Optional initial state, from a resumed live snapshot. */
  initial?: {
    subtask?:              'build-sentence' | 'email' | 'discussion';
    buildSentenceAnswers?: Record<string, string>;
    emailText?:            string;
    writingText?:          string;
  };
  /** Merged snapshot callback — pass-through to the session. */
  onSnapshot?: (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
  /** True in the live-mock flow; false in the async assignment flow.
   *  Controls whether short-draft submits require confirmation. */
  confirmSubmit?: boolean;
  /** Practice mode: sub-timers don't auto-submit and the countdown is
   *  hidden. Student decides when to advance. */
  practiceMode?: boolean;
}

export function WritingSequence({
  seq, onDone, initial, onSnapshot, confirmSubmit, practiceMode,
}: WritingSequenceProps) {
  const [phase, setPhase] = useState<'build-sentence' | 'email' | 'discussion'>(
    initial?.subtask ?? 'build-sentence',
  );

  // Accumulate the pieces of the composite submission as each sub-task
  // finishes. The AD is the last one — when it lands, we emit onDone.
  const [basAnswers, setBasAnswers] = useState<BuildSentenceAnswer[] | null>(null);
  const [emailSub,   setEmailSub]   = useState<EmailSubmission | null>(null);

  // Autosave state so parent can persist across sub-task boundaries.
  const [basDraft,   setBasDraft]   = useState<Record<string, string>>(initial?.buildSentenceAnswers ?? {});
  const [emailDraft, setEmailDraft] = useState<string>(initial?.emailText ?? '');
  const [adDraft,    setAdDraft]    = useState<string>(initial?.writingText ?? '');

  const emit = useCallback((subtask: 'build-sentence' | 'email' | 'discussion',
                            basD:  Record<string, string>,
                            emailD: string,
                            adD:    string) => {
    onSnapshot?.({
      outerIdx:              0,
      innerIdx:              0,
      timeLeftSec:           0,
      writingSubtask:        subtask,
      buildSentenceAnswers:  basD,
      emailText:             emailD,
      writingText:           adD,
    });
  }, [onSnapshot]);

  if (phase === 'build-sentence') {
    return (
      <BuildSentenceSection
        items={seq.buildSentence}
        timerMin={4}
        initial={basDraft}
        practiceMode={practiceMode}
        onSnapshot={(a) => { setBasDraft(a); emit('build-sentence', a, emailDraft, adDraft); }}
        onDone={(answers) => {
          setBasAnswers(answers);
          emit('email', basDraft, emailDraft, adDraft);
          setPhase('email');
        }}
      />
    );
  }

  if (phase === 'email') {
    return (
      <EmailSection
        prompt={seq.email}
        initialText={emailDraft}
        confirmSubmit={confirmSubmit}
        practiceMode={practiceMode}
        onSnapshot={(t) => { setEmailDraft(t); emit('email', basDraft, t, adDraft); }}
        onDone={(sub) => {
          setEmailSub(sub);
          emit('discussion', basDraft, sub.text, adDraft);
          setPhase('discussion');
        }}
      />
    );
  }

  return (
    <WritingSection
      prompt={seq.discussion}
      initialText={adDraft}
      confirmSubmit={confirmSubmit}
      practiceMode={practiceMode}
      onSnapshot={(snap) => {
        setAdDraft(snap.writingText ?? '');
        emit('discussion', basDraft, emailDraft, snap.writingText ?? '');
      }}
      onDone={(adSub: WritingSubmission) => {
        const composite: WritingSectionSubmission = {
          buildSentence: basAnswers ?? [],
          email:         emailSub   ?? { promptId: seq.email.id, text: emailDraft, wordCount: emailDraft.trim().split(/\s+/).filter(Boolean).length },
          discussion:    adSub,
        };
        onDone(composite);
      }}
    />
  );
}
