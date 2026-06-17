// Populate the "Pain's Cycle of Hatred" Friendlyflix lesson with the
// full 8-slide CLT structure: cover → vocab → predictions → listening
// game → comprehension → language focus → controlled practice → free
// production. The clip_dialogue_game slide is preserved verbatim from
// what the teacher created in the editor.
const admin = require('firebase-admin');
const fs = require('fs');

const json = fs.readFileSync('C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json', 'utf8');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
const db = admin.firestore();

const LESSON_ID = 'gLtuWtn86IvTKe9U6G90'; // Pain's Cycle of Hatred

(async () => {
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const lesson = snap.data();
  const clip = lesson.clip;
  const gameSlide = (lesson.slides || []).find(s => s.type === 'clip_dialogue_game');
  if (!gameSlide) { console.error('No dialogue game slide found'); process.exit(1); }

  // ── 1. Cover ──────────────────────────────────────────────────────
  const coverSlide = {
    type: 'cover',
    title: `${clip.source} – ${clip.title}`,
    subtitle: 'A scene about the cycle of vengeance and the meaning of peace.',
    content: lesson.level || 'B1+',
    imageUrl: `https://img.youtube.com/vi/18foq__Yut0/maxresdefault.jpg`,
  };

  // ── 2. Vocabulary ─────────────────────────────────────────────────
  const vocabSlide = {
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
  };

  // ── 3. Predictions ────────────────────────────────────────────────
  const predictionsSlide = {
    type: 'predictions',
    title: 'Before you watch',
    prompt: 'What do you think this conversation between Naruto and Pain is about?',
    content: [
      'Who are these characters and what is their relationship?',
      'What kind of conflict do you expect to see?',
      'What might Pain want from Naruto?',
      'What emotional tone do you anticipate?',
    ].join('\n'),
  };

  // ── 4. Listening Game (preserved) ────────────────────────────────
  // gameSlide kept as-is.

  // ── 5. Comprehension (with re-watch) ─────────────────────────────
  const comprehensionSlide = {
    type: 'clip_comprehension',
    title: 'Comprehension',
    clipData: {
      youtubeUrl: clip.youtubeUrl,
      title: clip.title,
      source: clip.source,
      ...(clip.startTime != null ? { startTime: clip.startTime } : {}),
      ...(clip.endTime   != null ? { endTime:   clip.endTime   } : {}),
      dialogue: '', // not needed for comprehension playback
    },
    questions: [
      {
        question: "What is Pain's stated goal?",
        options: [
          { id: 'q0o0', text: 'To create peace and bring about justice', isCorrect: true },
          { id: 'q0o1', text: 'To take revenge on the Hidden Leaf village', isCorrect: false },
          { id: 'q0o2', text: 'To prove he is stronger than Naruto',       isCorrect: false },
          { id: 'q0o3', text: 'To find Jiraiya-sensei',                     isCorrect: false },
        ],
        correctAnswer: 'To create peace and bring about justice',
      },
      {
        question: 'According to Pain, why do human beings NEVER understand each other?',
        options: [
          { id: 'q1o0', text: 'Because they speak different languages',     isCorrect: false },
          { id: 'q1o1', text: 'Because the shinobi world is ruled by hatred', isCorrect: true },
          { id: 'q1o2', text: 'Because of cultural traditions',              isCorrect: false },
          { id: 'q1o3', text: 'Because of economic differences',             isCorrect: false },
        ],
        correctAnswer: 'Because the shinobi world is ruled by hatred',
      },
      {
        question: 'Whose deaths does Naruto blame Pain for?',
        options: [
          { id: 'q2o0', text: 'His parents and brother',           isCorrect: false },
          { id: 'q2o1', text: 'His master and sensei',             isCorrect: true },
          { id: 'q2o2', text: 'His teammates Sakura and Sasuke',   isCorrect: false },
          { id: 'q2o3', text: 'The Akatsuki members',              isCorrect: false },
        ],
        correctAnswer: 'His master and sensei',
      },
      {
        question: 'Why does Pain say only the Hidden Leaf preaching about peace is unfair?',
        options: [
          { id: 'q3o0', text: 'Because his own family and village suffered the same fate at their hands', isCorrect: true },
          { id: 'q3o1', text: 'Because the Hidden Leaf is too weak to enforce peace',                      isCorrect: false },
          { id: 'q3o2', text: 'Because peace is impossible',                                                isCorrect: false },
          { id: 'q3o3', text: 'Because Naruto is too young to understand',                                  isCorrect: false },
        ],
        correctAnswer: 'Because his own family and village suffered the same fate at their hands',
      },
      {
        question: 'What does Pain ask Naruto at the end?',
        options: [
          { id: 'q4o0', text: 'How would YOU confront this hatred in order to create peace?', isCorrect: true },
          { id: 'q4o1', text: 'Will you join the Akatsuki?',                                  isCorrect: false },
          { id: 'q4o2', text: 'Do you understand my pain?',                                   isCorrect: false },
          { id: 'q4o3', text: 'Where is Jiraiya-sensei?',                                     isCorrect: false },
        ],
        correctAnswer: 'How would YOU confront this hatred in order to create peace?',
      },
    ],
  };

  // ── 6. Language Focus ────────────────────────────────────────────
  const languageFocusSlide = {
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
  };

  // ── 7. Controlled Practice ───────────────────────────────────────
  const controlledPracticeSlide = {
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
  };

  // ── 8. Free Production ───────────────────────────────────────────
  const productionSlide = {
    type: 'clip_production',
    title: 'Your turn — free production',
    prompt: "If you were Naruto, how would YOU confront the cycle of hatred and bring peace?",
    content: [
      "Use at least TWO cause-and-effect linkers from the Language Focus.",
      'Speak for 1-2 minutes (or write 80-120 words).',
      'Reference the scene: Pain, vengeance, the Hidden Leaf, peace.',
      'Then explain whether you agree with Pain or with Naruto, and why.',
    ].join('\n'),
  };

  // ── Assemble + write ─────────────────────────────────────────────
  const slides = [
    coverSlide,
    vocabSlide,
    predictionsSlide,
    gameSlide,
    comprehensionSlide,
    languageFocusSlide,
    controlledPracticeSlide,
    productionSlide,
  ];

  await ref.update({
    slides,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✓ Updated lesson with', slides.length, 'slides:');
  slides.forEach((s, i) => console.log(`  ${i + 1}.`, s.type, '·', s.title || '(no title)'));
})().catch(e => { console.error('ERR:', e); process.exit(1); });
