// FriendlyTeaching.cl — Upgrade Fire Drill vocab (harder B2+ words that are
// actually spoken in the clip) and rewrite the production prompts so they
// implicitly invite modal-verb use (could / must / can't be) while helping
// the student connect to experiences similar to the video.
//
// - Vocab: swaps the simpler words (procedure, option, panicking, damp,
//   replaced, sharpen) for harder ones that also appear in the transcript
//   (preparedness, merely, bunching, duct, battering ram, victim, swallow).
//   Keeps ignite and adrenaline. English translations + IPA are preserved
//   in the same shape the renderer expects.
// - Production: 3 tarjetas nuevas ("Read the Room", "The Overreaction",
//   "Steal a Line") con preguntas que empujan hacia possibility/deduction
//   sin nombrar la estructura, y anclas emocionales (situaciones caóticas
//   de trabajo, jefes/compañeros exagerando, líneas usables en la semana).
//
// Usage: node scripts/upgrade-firedrill-vocab-and-production.js
//
// Backup runs automatically before the write (per _lessonBackup convention).

const { initAdmin, backupLessonDoc } = require('./_lessonBackup');
const { getFirestore } = require('firebase-admin/firestore');

const LESSON_ID = '66cq9MCLdxD3B3wZqaez';

// ── New vocab (8 items) ─────────────────────────────────────────
// Each word must appear in real spoken dialogue in the clip transcript.
// Translations stay in English (matches existing shape).
const NEW_VOCAB = [
  {
    word:          'ignite',
    pronunciation: '/ɪɡˈnaɪt/',
    translation:   'to set something on fire or cause it to start burning',
    example:       'Today, smoking is going to save lives.',
  },
  {
    word:          'adrenaline',
    pronunciation: '/əˈdrɛnəlɪn/',
    translation:   'a hormone your body releases that gives you extra energy in fear or danger',
    example:       'Use the power of fear and adrenaline to sharpen your decision-making.',
  },
  {
    word:          'preparedness',
    pronunciation: '/prɪˈpɛərdnəs/',
    translation:   'the state of being ready to handle an emergency or difficult situation',
    example:       'This has been a test of our emergency preparedness.',
  },
  {
    word:          'merely',
    pronunciation: '/ˈmɪərli/',
    translation:   'only; nothing more than — used to make something sound less important',
    example:       'This was merely a training exercise.',
  },
  {
    word:          'bunching',
    pronunciation: '/ˈbʌntʃɪŋ/',
    translation:   'crowding together in one tight group — usually blocks movement in an emergency',
    example:       'Calm down everyone. No bunching!',
  },
  {
    word:          'duct',
    pronunciation: '/dʌkt/',
    translation:   'a tube or channel that carries air, water or wires through a building',
    example:       'The smoke could be coming from an air duct.',
  },
  {
    word:          'battering ram',
    pronunciation: '/ˈbætərɪŋ ræm/',
    translation:   'a heavy object used to break down a door by force — here, a copy machine',
    example:       'Yes, battering ram! Battering ram!',
  },
  {
    word:          'swallow',
    pronunciation: '/ˈswɒləʊ/',
    translation:   'to make food or liquid go down your throat — or, in a panic, your own tongue',
    example:       'He is going to swallow his tongue.',
  },
];

// ── New production prompts ──────────────────────────────────────
// Format is: "Title — question", one per line. The renderer splits on \n
// and builds a 3-column grid.
//
// Design intent:
// - Nudge toward "could be / must be / can't be / might have been" without
//   naming the structure. Each prompt asks the student to interpret a
//   confusing situation ("what did you think was going on?") — the natural
//   answer uses modals of deduction.
// - Anchor to Office-adjacent experiences: workplace/school chaos,
//   overreacting colleagues, memorable lines to reuse.
const NEW_PRODUCTION_CONTENT = [
  "Read the Room — You walk into a place — the office, a classroom, your house — and something feels off. Nobody is talking, or the door is locked, or people look nervous. Tell me about a time this happened. What did you think was going on before you knew for sure?",
  "The Overreaction — Think of a moment when someone at work, school or home turned a small problem into total chaos. What do you think was really behind their reaction — stress, something personal, something they were trying to prove?",
  "Steal a Line — Pick one line from the scene you'd love to drop into your week — a meeting, a chat with your family, a group chat. Where would it fit, and how would people react?",
].join('\n');

const NEW_PRODUCTION_PROMPT = 'The chaos is over — now think about a time your world went sideways and tell me what was really going on underneath.';

(async () => {
  initAdmin();
  const db = getFirestore();

  await backupLessonDoc(db, LESSON_ID, 'pre-vocab-and-production-upgrade');

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);

  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  const vocabIdx = slides.findIndex(s => s.type === 'clip_vocab_match');
  const prodIdx  = slides.findIndex(s => s.type === 'clip_production');
  if (vocabIdx < 0) throw new Error('No clip_vocab_match slide');
  if (prodIdx  < 0) throw new Error('No clip_production slide');

  slides[vocabIdx] = {
    ...slides[vocabIdx],
    words: NEW_VOCAB,
  };
  slides[prodIdx] = {
    ...slides[prodIdx],
    content: NEW_PRODUCTION_CONTENT,
    prompt:  NEW_PRODUCTION_PROMPT,
  };

  await ref.update({ slides });
  console.log('✓ Fire Drill lesson updated:');
  console.log(`  vocab_match  → ${NEW_VOCAB.length} words (harder B2+/C1 lift)`);
  console.log('  production   → 3 new cards, implicit modal-deduction nudge');
  process.exit(0);
})().catch(err => { console.error('✗', err); process.exit(1); });
