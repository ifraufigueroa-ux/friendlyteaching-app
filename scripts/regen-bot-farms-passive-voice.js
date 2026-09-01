// Regenerate the language_focus, controlled_practice and production
// slides of the Bot Farms Friendlyflix lesson with a PASSIVE-VOICE focus
// (B2). The auto-detector had locked in "going to" because it appears in
// the dialogue, but passive voice is a much richer focus for a doc-style
// clip about how bot farms are built and deployed.
//
// Always backs up first (see scripts/_lessonBackup.js).
//
// Usage:  node scripts/regen-bot-farms-passive-voice.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'GskpRCzaMNzPTDKCsCgu';

// ─── Passive-voice grammar bank (mirrored from clipLessonGenerator.ts) ──
const FOCUS = {
  name:  'Passive voice',
  short: 'passive-voice',
  rules: [
    'BE + past participle shifts the focus from the DOER to the thing DONE: "The report was written by the intern".',
    'Use the passive when the doer is unknown, obvious, or less important than the action.',
    'The tense of BE tells you WHEN: "is written" (present), "was written" (past), "has been written" (perfect), "will be written" (future).',
  ],
};

const TEMPLATES = [
  {
    sentence: 'The report was written by the intern in a single afternoon.',
    targetForm: 'was written', baseVerb: 'write',
    wrongForms: ['wrote', 'is written', 'has written'],
    wrongVersion: 'The report wrote by the intern in a single afternoon.',
    splitAt: 2,
  },
  {
    sentence: 'These devices are manufactured in factories across Southeast Asia.',
    targetForm: 'are manufactured', baseVerb: 'manufacture',
    wrongForms: ['manufacture', 'were manufactured', 'have manufactured'],
    wrongVersion: 'These devices manufactured in factories across Southeast Asia.',
    splitAt: 2,
  },
  {
    sentence: 'The proposal has been reviewed by the entire committee.',
    targetForm: 'has been reviewed', baseVerb: 'review',
    wrongForms: ['reviewed', 'was reviewed', 'have been reviewed'],
    wrongVersion: 'The proposal reviewed by the entire committee.',
    splitAt: 2,
  },
  {
    sentence: 'A new bridge is being built on the outskirts of the city.',
    targetForm: 'is being built', baseVerb: 'build',
    wrongForms: ['is built', 'was being built', 'is building'],
    wrongVersion: 'A new bridge is building on the outskirts of the city.',
    splitAt: 3,
  },
  {
    sentence: 'The paintings had been stolen long before the museum opened.',
    targetForm: 'had been stolen', baseVerb: 'steal',
    wrongForms: ['were stolen', 'have been stolen', 'stole'],
    wrongVersion: 'The paintings stole long before the museum opened.',
    splitAt: 2,
  },
  {
    sentence: 'Every message will be encrypted before it leaves the device.',
    targetForm: 'will be encrypted', baseVerb: 'encrypt',
    wrongForms: ['will encrypt', 'is encrypted', 'was encrypted'],
    wrongVersion: 'Every message will encrypt before it leaves the device.',
    splitAt: 2,
  },
];

const MC_DISTRACTORS = [
  'The intern wrote the report in a single afternoon last week.',
  'They are manufacturing devices in Southeast Asia every year.',
  'The committee reviews the proposal thoroughly every quarter.',
];

const OPEN_STEM = 'In my country, ';

// ─── Helpers ────────────────────────────────────────────────────────────
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
function sanitize(text) {
  return text
    .replace(/\{\{\s*blank\s*\}\}/gi, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/_{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Slide builders ─────────────────────────────────────────────────────
function buildLanguageFocus(dialogue) {
  const clean = sanitize(dialogue);
  const lines = clean.split(/(?<=[.!?])\s+/).map(l => l.trim()).filter(Boolean);
  // Find up to 3 lines that actually show a passive construction.
  const passiveRx = /\b(is|are|was|were|been|being|be)\s+([A-Za-z]+ed|written|made|built|done|taken|seen|given|known|shown|found|held|kept|left|met|paid|read|sold|spent|told|used|thrown|hidden|stolen|drawn|drawn|encrypted|deployed|amplified|trusted|charged|plugged)\b/i;
  const examples = [];
  for (const line of lines) {
    if (examples.length >= 3) break;
    if (passiveRx.test(line) && line.length <= 220) {
      examples.push({
        word: FOCUS.name,
        translation: 'Look for BE + past participle in this line from the scene.',
        example: line,
      });
    }
  }
  if (examples.length === 0 && lines.length > 0) {
    examples.push({
      word: FOCUS.name,
      translation: 'Notice how this line could be reframed in the passive.',
      example: lines[0],
    });
  }

  const [r1, r2, r3] = FOCUS.rules;
  const content = [
    `${FOCUS.name} is the structure that lets you talk about WHAT is done to something without having to name (or care about) who does it — which is exactly how documentaries and explainer clips frame technical processes.`,
    `• ${r1}`,
    `• ${r2}`,
    `• ${r3}`,
    `The lines below are your anchor — every time you drill ${FOCUS.name} in the next slide, come back to them.`,
  ].join('\n');

  return {
    type: 'clip_language_focus',
    title: `Language focus: ${FOCUS.name}`,
    phase: 'while',
    content,
    words: examples,
    subtitle: FOCUS.name,
  };
}

function buildControlledPractice() {
  const templates = shuffle(TEMPLATES);
  const pick = (i) => templates[i % templates.length];

  function fromTemplate(t) {
    const s = t.sentence;
    const words = s.replace(/[.!?,]$/, '').split(/\s+/);
    const scrambled = shuffle(words).join(' / ');
    const first  = words.slice(0, t.splitAt).join(' ');
    const second = words.slice(t.splitAt).join(' ');
    const distractors = shuffle(
      templates.filter(x => x !== t).slice(0, 6).map(x => {
        const xs = x.sentence.replace(/[.!?,]$/, '').split(/\s+/);
        return xs.slice(x.splitAt).join(' ');
      })
    ).slice(0, 3);

    return {
      unscramble: {
        type: 'unscramble',
        prompt: scrambled,
        answer: s.replace(/[.!?,]$/, ''),
        grammarTopic: FOCUS.name,
        contextLine: s,
      },
      verb: {
        type: 'verb_form',
        prompt: s.replace(t.targetForm, `{{blank}} (${t.baseVerb})`),
        answer: t.targetForm,
        options: shuffle([t.targetForm, ...t.wrongForms]),
        grammarTopic: FOCUS.name,
        contextLine: s,
      },
      matchHalves: {
        type: 'match_halves',
        prompt: first,
        answer: second,
        options: shuffle([second, ...distractors]).slice(0, 4),
        grammarTopic: FOCUS.name,
        contextLine: s,
      },
      errorCorrection: {
        type: 'error_correction',
        prompt: 'Correct the mistake:',
        wrongText: t.wrongVersion,
        answer: s,
        grammarTopic: FOCUS.name,
        contextLine: s,
      },
    };
  }

  const b0 = fromTemplate(pick(0));
  const b1 = fromTemplate(pick(1));
  const b2 = fromTemplate(pick(2));
  const b3 = fromTemplate(pick(3));
  const b4 = fromTemplate(pick(4));
  const b5 = fromTemplate(pick(5));

  const multipleSelection = {
    type: 'multiple_selection',
    prompt: `Which of these sentences uses ${FOCUS.name} correctly?`,
    answer: pick(0).sentence,
    options: shuffle([pick(0).sentence, ...MC_DISTRACTORS]),
    grammarTopic: FOCUS.name,
    contextLine: pick(0).sentence,
  };

  const openEnded = {
    type: 'open_ended',
    prompt: `Complete the sentence in your own words using ${FOCUS.name}.`,
    answer: '',
    stem: OPEN_STEM,
    grammarTopic: FOCUS.name,
  };

  const items = [
    multipleSelection,
    b1.unscramble,
    b2.verb,
    b3.matchHalves,
    b4.unscramble,
    b5.verb,
    b0.errorCorrection,
    openEnded,
  ];

  return {
    type: 'clip_controlled_practice',
    title: 'Controlled practice',
    subtitle: FOCUS.name,
    phase: 'post',
    practiceItems: items,
  };
}

function buildProduction(existingProduction) {
  // Preserve the clipData from the existing production slide (it carries
  // the YouTube URL + timings the runtime needs to keep the video panel
  // in sync). Only the language pointer inside the bullets needs to
  // change from "going to" → "passive voice".
  const content = [
    '• The Warning — Which moment made you most uneasy? Why?',
    `• Your Prediction — Predict a way AI could change your life. Try using ${FOCUS.name}.`,
    '• Sound Byte — Pick one phrase from the clip. When could you use it?',
  ].join('\n');

  return {
    ...existingProduction,
    type: 'clip_production',
    title: 'Over to you',
    phase: 'post',
    prompt: existingProduction?.prompt ?? 'You have seen the scenario — over to you.',
    content,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────
(async () => {
  initAdmin();
  const db = getFirestore();
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found:', LESSON_ID); process.exit(1); }
  const data = snap.data();
  const slides = data.slides || [];

  // Backup FIRST — per project convention.
  await backupLessonDoc(db, LESSON_ID, 'pre-passive-voice-regen');

  const dialogue = data.clip?.dialogue || '';
  const existingProduction = slides.find(s => s.type === 'clip_production');

  const newLanguageFocus     = buildLanguageFocus(dialogue);
  const newControlledPractice = buildControlledPractice();
  const newProduction         = buildProduction(existingProduction);

  const updatedSlides = slides.map((s) => {
    if (s.type === 'clip_language_focus')      return newLanguageFocus;
    if (s.type === 'clip_controlled_practice') return newControlledPractice;
    if (s.type === 'clip_production')          return newProduction;
    return s;
  });

  await ref.update({ slides: updatedSlides });
  console.log('✓ Regenerated 3 slides with focus:', FOCUS.name);
  console.log('  · language_focus:      words=%d, rules=3', newLanguageFocus.words.length);
  console.log('  · controlled_practice: items=%d', newControlledPractice.practiceItems.length);
  console.log('  · production:          content updated');
  process.exit(0);
})();
