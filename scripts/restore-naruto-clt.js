// Additive CLT restore for Pain's Cycle of Hatred.
//
// Inserts the missing canonical slides at their proper positions
// WITHOUT TOUCHING any slide that already exists in Firestore. The
// teacher's hand-crafted dialogue game and any other edited slides
// are preserved verbatim. New slides use the content from the original
// populate-naruto-clt.js blueprint that the teacher previously deemed
// production-ready.
//
//   node scripts/restore-naruto-clt.js
//
// Always runs backupLessonDoc() first (via the guard), so a bad restore
// is reversible from scripts/lesson-snapshots/.
const admin = require('firebase-admin');
const fs = require('fs');
const { backupLessonDoc } = require('./_lessonBackup');

const json = fs.readFileSync('C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json', 'utf8');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
const db = admin.firestore();

const LESSON_ID = 'gLtuWtn86IvTKe9U6G90';

// Canonical CLT order for a Friendlyflix lesson.
const CANONICAL_ORDER = [
  'cover',
  'vocabulary',
  'predictions',
  'clip_dialogue_game',  // preserved
  'clip_comprehension',  // preserved
  'language_focus',
  'language_practice',
  'clip_production',
];

function extractVideoId(url) {
  const m = (url ?? '').match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

// ─── Blueprints — verbatim copy from populate-naruto-clt.js ──────────
// One factory per type; receives the lesson doc so it can derive
// title/imageUrl/etc. from the existing clip metadata.

const BLUEPRINTS = {
  cover: (lesson) => {
    const clip = lesson.clip ?? {};
    const vid  = extractVideoId(clip.youtubeUrl);
    return {
      type: 'cover',
      title: `${clip.source ?? 'Naruto'} – ${clip.title ?? "Pain's Cycle of Hatred"}`,
      subtitle: 'A scene about the cycle of vengeance and the meaning of peace.',
      content: lesson.level ?? 'B1+',
      imageUrl: vid ? `https://img.youtube.com/vi/${vid}/maxresdefault.jpg` : undefined,
    };
  },

  vocabulary: () => ({
    type: 'vocabulary',
    title: 'Key vocabulary',
    subtitle: 'Tap each card to reveal the meaning. You will hear these words in the clip.',
    words: [
      { word: 'vengeance',  translation: 'revenge taken for an injury',
        example: "If one comes to call vengeance 'justice'…" },
      { word: 'hatred',     translation: 'intense feeling of dislike',
        example: 'The shinobi world is ruled by hatred.' },
      { word: 'cycle',      translation: 'a sequence of events that repeats',
        example: '…and trigger a vicious Cycle Of Hatred.' },
      { word: 'harmony',    translation: 'agreement, peaceful coexistence',
        example: 'All people will understand one another and live in harmony.' },
      { word: 'foretell',   translation: 'to predict the future',
        example: 'I know the past and can foretell our future.' },
      { word: 'preach',     translation: 'to publicly proclaim or lecture',
        example: "Don't you dare talk about / preach peace and justice!" },
      { word: 'confront',   translation: 'to face up to a problem boldly',
        example: 'How would YOU confront this hatred?' },
      { word: 'entrust',    translation: 'to give responsibility to someone',
        example: "I'll entrust you to find the solution." },
      { word: 'vicious',    translation: 'cruel, severe',
        example: 'Trigger a vicious Cycle Of Hatred.' },
      { word: 'fate',       translation: 'destiny, the inevitable outcome',
        example: 'They suffered the same fate as this village.' },
    ],
  }),

  predictions: () => ({
    type: 'predictions',
    title: 'Before you watch',
    prompt: 'What do you think this conversation between Naruto and Pain is about?',
    content: [
      'Who are these characters and what is their relationship?',
      'What kind of conflict do you expect to see?',
      'What might Pain want from Naruto?',
      'What emotional tone do you anticipate?',
    ].join('\n'),
  }),

  language_focus: () => ({
    type: 'language_focus',
    title: 'Cause and effect linkers',
    content: [
      'Pain argues that vengeance breeds vengeance. To make his case he uses cause-and-effect language: structures that link a cause to its consequence.',
      '',
      'Notice four patterns in the clip:',
      '• If X, X will only Y  →  conditional consequence',
      '• ...and trigger Y     →  chained result (action triggers result)',
      '• at the hands of...   →  agent of harm (passive blame)',
      '• as a result...       →  explicit cause → effect connector',
    ].join('\n'),
    words: [
      { word: "If one calls vengeance 'justice', such 'justice' will only breed further vengeance.",
        translation: 'Conditional consequence (will only + verb)',
        example: 'Pattern: If X, X will only Y' },
      { word: '…and trigger a vicious Cycle Of Hatred.',
        translation: 'Chained result',
        example: 'Pattern: …and trigger Y' },
      { word: 'They suffered the same fate as this village at the hands of you Hidden Leaf ninja.',
        translation: 'Agent of harm',
        example: 'Pattern: at the hands of X' },
      { word: 'As a result, hatred spreads to the next generation.',
        translation: 'Explicit cause-effect connector',
        example: 'Pattern: As a result, …' },
    ],
    teacherNotes: 'Use these to scaffold the controlled practice and the free production tasks.',
  }),

  language_practice: () => ({
    type: 'language_practice',
    title: 'Controlled practice',
    subtitle: 'Build the sentences using the cause-and-effect language from the clip.',
    practiceItems: [
      {
        type: 'unscramble',
        prompt: "If/we/call/revenge/'justice'/it/will/only/breed/more/hatred",
        answer: "If we call revenge 'justice' it will only breed more hatred",
      },
      {
        type: 'unscramble',
        prompt: 'The/village/suffered/at/the/hands/of/the/enemy/ninja',
        answer: 'The village suffered at the hands of the enemy ninja',
      },
      {
        type: 'unscramble',
        prompt: 'His/words/will/trigger/a/vicious/cycle/of/violence',
        answer: 'His words will trigger a vicious cycle of violence',
      },
      {
        type: 'match_halves',
        prompt: 'As a result of years of war,',
        answer: 'people grew distrustful of their neighbours.',
        options: [
          'people grew distrustful of their neighbours.',
          'the trains arrived on time.',
          'the festival was cancelled.',
          'students celebrated graduation.',
        ],
      },
    ],
  }),

  clip_production: () => ({
    type: 'clip_production',
    title: 'Your turn — free production',
    prompt: "If you were Naruto, how would YOU confront the cycle of hatred and bring peace?",
    content: [
      "Use at least TWO cause-and-effect linkers from the Language Focus.",
      'Speak for 1-2 minutes (or write 80-120 words).',
      'Reference the scene: Pain, vengeance, the Hidden Leaf, peace.',
      'Then explain whether you agree with Pain or with Naruto, and why.',
    ].join('\n'),
  }),
};

(async () => {
  await backupLessonDoc(db, LESSON_ID, 'before-additive-clt-restore');

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('✗ Lesson not found'); process.exit(1); }
  const lesson   = snap.data();
  const existing = lesson.slides ?? [];

  // Build canonical-order slides: preserve every existing slide where
  // its type appears in CANONICAL_ORDER; insert blueprint for missing
  // types. Then append any extra slides the teacher added outside the
  // canonical set so nothing of theirs is lost.
  const final     = [];
  const preserved = [];
  const added     = [];

  for (const type of CANONICAL_ORDER) {
    const existingSlide = existing.find(s => s.type === type);
    if (existingSlide) {
      final.push(existingSlide);
      preserved.push(type);
    } else if (BLUEPRINTS[type]) {
      final.push(BLUEPRINTS[type](lesson));
      added.push(type);
    } else {
      console.warn(`  · no blueprint for "${type}" — skipping`);
    }
  }

  const carried = existing.filter(s => !CANONICAL_ORDER.includes(s.type));
  if (carried.length) final.push(...carried);

  await ref.update({
    slides: final,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✓ Restore complete.');
  console.log(`  Preserved (${preserved.length}): ${preserved.join(', ') || '—'}`);
  console.log(`  Added     (${added.length}): ${added.join(', ') || '—'}`);
  if (carried.length) {
    console.log(`  Carried   (${carried.length}): ${carried.map(s => s.type).join(', ')}`);
  }
  console.log(`\nFinal order:`);
  final.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2, ' ')}. [${s.type.padEnd(28, ' ')}] ${s.title ?? '(no title)'}`));
})().catch(e => { console.error('ERR:', e); process.exit(1); });
