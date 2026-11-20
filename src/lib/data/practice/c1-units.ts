// FriendlyTeaching.cl — Daily Practice: C1 units
//
// C1 content kept in its own file so the A0..B2+ seed stays legible.
// The main PRACTICE_UNITS array concatenates these in at export time.

import type { PracticeUnit } from '@/types/practice';

export const C1_UNITS: PracticeUnit[] = [

  // ── C1 · Perfect modals for speculation ──────────────────
  {
    id: 'c1-perfect-modals',
    level: 'C1',
    skill: 'grammar',
    title: 'Perfect Modals · past speculation',
    description: 'Must have, might have, could have, should have — speculating about the past.',
    icon: '🔮',
    quickLesson: {
      summary: 'Perfect modals ("must have done", "might have done", "could have done") let you speculate, regret, or criticise past events with precision.',
      sections: [
        {
          heading: 'Degree of certainty: must / might / can\'t have',
          body: '"Must have" = you are almost sure. "Might / could have" = it was possible, but you don\'t know. "Can\'t have" = you are almost sure it did NOT happen.',
          examples: [
            'She\'s not answering — she **must have fallen** asleep.',
            'He\'s not here yet. He **might have missed** the train.',
            'You **can\'t have finished** the whole book already!',
          ],
          tip: '"Mustn\'t have" is RARE in modern English — use "can\'t have" for strong negative deduction instead.',
        },
        {
          heading: 'Regret and criticism: should have / shouldn\'t have',
          body: '"Should have done" = it was the right thing to do, but you didn\'t. "Shouldn\'t have done" = you did it but it was wrong.',
          examples: [
            'I **should have called** her back. (regret)',
            'You **shouldn\'t have told** him. It was a secret.',
            'They **should have arrived** by now.',
          ],
        },
        {
          heading: 'Lost opportunity: could have',
          body: '"Could have done" without a question = something was possible but didn\'t happen. Often implies a missed chance.',
          examples: [
            'We **could have won** if the ref hadn\'t been so harsh.',
            'You **could have warned** me!',
            'She **could have been** a doctor — she chose teaching instead.',
          ],
          tip: 'All perfect modals share the same structure: modal + HAVE + past participle. The modal itself never changes form.',
        },
      ],
    },
    exercises: [
      {
        id: 'c1-pm-01',
        type: 'multiple-choice',
        prompt: 'The lights are off. Which sentence speculates with the HIGHEST certainty that they are out?',
        options: [
          'They might have gone out.',
          'They could have gone out.',
          'They must have gone out.',
          'They may have gone out.',
        ],
        correctIndex: 2,
        explain: '"Must have" expresses near-certainty based on evidence.',
      },
      {
        id: 'c1-pm-02',
        type: 'fill-blank',
        prompt: 'Complete with the correct perfect modal of regret.',
        sentence: 'I\'m exhausted. I ___ have gone to bed earlier last night.',
        answers: ['should'],
        alts: [['ought to']],
      },
      {
        id: 'c1-pm-03',
        type: 'multiple-choice',
        prompt: '"You can\'t have seen her at 8pm — she was at the airport then." What does the speaker mean?',
        options: [
          'It is possible that you saw her.',
          'The speaker is forbidding you to see her.',
          'The speaker is sure you did NOT see her.',
          'The speaker wants you to see her.',
        ],
        correctIndex: 2,
        explain: '"Can\'t have" = strong deduction that something did NOT happen.',
      },
      {
        id: 'c1-pm-04',
        type: 'fill-blank',
        prompt: 'Rewrite as a perfect modal of missed opportunity. "It was possible for us to win, but we didn\'t."',
        sentence: 'We ___ have won the match.',
        answers: ['could'],
        alts: [['might']],
      },
      {
        id: 'c1-pm-05',
        type: 'multiple-choice',
        prompt: 'Pick the sentence with CORRECT perfect-modal structure.',
        options: [
          'She must has forgotten her keys.',
          'She must have forgotten her keys.',
          'She must forgotten her keys.',
          'She must had forgotten her keys.',
        ],
        correctIndex: 1,
        explain: 'Perfect modals: modal + HAVE (bare infinitive) + past participle.',
      },
      {
        id: 'c1-pm-06',
        type: 'fill-blank',
        prompt: 'Complete with a perfect modal expressing criticism.',
        sentence: 'You ___ have told them! That information was private.',
        answers: ['shouldn\'t'],
        alts: [['should not']],
      },
      {
        id: 'c1-pm-07',
        type: 'multiple-choice',
        prompt: 'Which sentence best fits: "His car is in the driveway, so …"?',
        options: [
          'he could have come home.',
          'he must have come home.',
          'he might have come home.',
          'he can\'t have come home.',
        ],
        correctIndex: 1,
        explain: 'Clear evidence (the car) justifies the strong deduction with "must have".',
      },
      {
        id: 'c1-pm-08',
        type: 'match-pairs',
        prompt: 'Match each perfect modal with the attitude it conveys.',
        pairs: [
          { left: 'must have done',   right: 'strong positive deduction' },
          { left: 'can\'t have done', right: 'strong negative deduction' },
          { left: 'should have done', right: 'regret about not doing' },
          { left: 'could have done',  right: 'missed opportunity' },
        ],
      },
      {
        id: 'c1-pm-09',
        type: 'multiple-choice',
        prompt: 'Which option describes a REGRET?',
        options: [
          'I could have asked for a refund.',
          'I should have checked the dates before I booked.',
          'I might have left my wallet at the restaurant.',
          'I must have forgotten her birthday.',
        ],
        correctIndex: 1,
        explain: '"Should have + past participle" = looking back, that was the right action I failed to take.',
      },
      {
        id: 'c1-pm-10',
        type: 'fill-blank',
        prompt: 'The passive form of a perfect modal: "Someone might have stolen it" → ___ stolen.',
        sentence: 'It might have ___ stolen.',
        answers: ['been'],
      },
    ],
  },

  // ── C1 · Advanced conditionals + subjunctive inversion ───
  {
    id: 'c1-advanced-conditionals',
    level: 'B2+',
    skill: 'grammar',
    title: 'Advanced Conditionals · inversion & were-to',
    description: 'Formal conditional forms: "were it not for", "had I known", "were I to…" — the register of academic and legal English.',
    icon: '🧠',
    quickLesson: {
      summary: 'In formal English, the "if" of a conditional can be dropped and the auxiliary moved to the front — giving sentences like "Had I known…" instead of "If I had known…".',
      sections: [
        {
          heading: 'Dropping "if" with inversion',
          body: 'In formal / literary English, you can drop "if" and INVERT the auxiliary and subject. Works mainly with "had", "were", and "should".',
          examples: [
            'If I had known → **Had I known**, I would have told you.',
            'If she were here → **Were she here**, she would agree.',
            'If you should need help → **Should you need** help, call me.',
          ],
          tip: 'Inverted conditionals are more common in WRITING. In speech they sound bookish — use regular "if" there.',
        },
        {
          heading: '"Were it not for" / "had it not been for"',
          body: 'A classic hedge for stating a decisive factor. "Were it not for X" = if X did not exist (present / future). "Had it not been for X" = if X had not existed (past).',
          examples: [
            '**Were it not for** his help, I would still be stuck.',
            '**Had it not been for** the rain, the game would have finished.',
            '**But for** her patience, the project would have collapsed.',
          ],
        },
        {
          heading: '"Were + subject + to…"',
          body: 'A very formal way of hypothesising about the future — think board meetings, legal documents.',
          examples: [
            '**Were the company to merge** with its rival, prices would rise.',
            '**Were we to accept** the offer, we would lose independence.',
            '**Were you to resign**, who would take over?',
          ],
          tip: 'This structure ONLY works with "were" — never "was", regardless of the subject.',
        },
      ],
    },
    exercises: [
      {
        id: 'c1-ac-01',
        type: 'multiple-choice',
        prompt: 'Which sentence is the formal inversion of "If I had known the answer, I would have told you"?',
        options: [
          'If had I known the answer, I would have told you.',
          'Had I known the answer, I would have told you.',
          'Known I had the answer, I would have told you.',
          'Known had I the answer, I would have told you.',
        ],
        correctIndex: 1,
        explain: 'Drop "if" and invert aux + subject: "Had I known…".',
      },
      {
        id: 'c1-ac-02',
        type: 'fill-blank',
        prompt: 'Transform to formal register. "If she were my boss, she would understand."',
        sentence: '___ she my boss, she would understand.',
        answers: ['were'],
      },
      {
        id: 'c1-ac-03',
        type: 'fill-blank',
        prompt: 'Complete with the correct structure. "If it had not been for your warning, we would have been robbed."',
        sentence: '___ it not been for your warning, we would have been robbed.',
        answers: ['had'],
      },
      {
        id: 'c1-ac-04',
        type: 'multiple-choice',
        prompt: 'Which of these is CORRECT formal English?',
        options: [
          'Was he to resign, the company would struggle.',
          'Were he to resign, the company would struggle.',
          'Would he resign, the company would struggle.',
          'If he would resign, the company would struggle.',
        ],
        correctIndex: 1,
        explain: 'The "were + subject + to-infinitive" pattern uses WERE for all subjects.',
      },
      {
        id: 'c1-ac-05',
        type: 'fill-blank',
        prompt: '"Were it ___ ___ the strike, the delivery would arrive tomorrow."',
        sentence: 'Were it ___ ___ the strike, the delivery would arrive tomorrow.',
        answers: ['not', 'for'],
      },
      {
        id: 'c1-ac-06',
        type: 'multiple-choice',
        prompt: 'The sentence "Should you require further assistance, please contact us" uses…',
        options: [
          'first conditional with "if" dropped and inversion.',
          'second conditional.',
          'third conditional with "if" dropped and inversion.',
          'present subjunctive.',
        ],
        correctIndex: 0,
        explain: '"Should you need…" = formal version of "If you should need…" / "If you need…".',
      },
      {
        id: 'c1-ac-07',
        type: 'fill-blank',
        prompt: 'Rewrite with inversion. "If the plan had succeeded, we would be rich."',
        sentence: '___ the plan succeeded, we would be rich.',
        answers: ['had'],
      },
      {
        id: 'c1-ac-08',
        type: 'match-pairs',
        prompt: 'Match each formal conditional opener to its meaning.',
        pairs: [
          { left: 'Had I known',           right: 'past unreal (I didn\'t know)' },
          { left: 'Were I to accept',      right: 'future hypothetical' },
          { left: 'Were it not for',       right: 'crucial present factor' },
          { left: 'Should you need',       right: 'polite open future' },
        ],
      },
      {
        id: 'c1-ac-09',
        type: 'multiple-choice',
        prompt: 'Which sentence is NOT grammatically correct?',
        options: [
          'Were she to decline, we would offer the role to someone else.',
          'Had he studied more, he might have passed.',
          'Should any issues arise, contact the manager.',
          'If I would have known, I would have come.',
        ],
        correctIndex: 3,
        explain: 'Classic error: "If I would have known" is wrong. Correct: "If I had known" or inverted "Had I known".',
      },
      {
        id: 'c1-ac-10',
        type: 'fill-blank',
        prompt: 'Complete with the correct auxiliary. "___ you encounter any difficulties, our team is here to help."',
        sentence: '___ you encounter any difficulties, our team is here to help.',
        answers: ['should'],
      },
    ],
  },
];
