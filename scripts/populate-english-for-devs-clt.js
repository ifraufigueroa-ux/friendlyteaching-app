// FriendlyTeaching.cl — Populate "ESL — English for Devs" with full CLT
//
// Mirror of populate-naruto-clt.js for the English for Devs daily-standup
// clip. Preserves the teacher-curated clip_dialogue_game slide verbatim and
// the existing clip_comprehension slide, and prepends/appends the missing
// CLT stages so the lesson has the full 8-slide flow:
//
//   1. Cover
//   2. Vocabulary (tech-standup key terms)
//   3. Predictions (before you watch)
//   4. Dialogue game (preserved)
//   5. Comprehension (preserved)
//   6. Language focus (standup language patterns)
//   7. Controlled practice (unscramble + match halves)
//   8. Free production (your own standup)
//
// Per lesson-backup-system: a backup is written BEFORE any mutation.

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const { backupLessonDoc } = require('./_lessonBackup');

const KEY_PATH = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

const LESSON_ID = 'riGpqOqSghZMesGDCTND'; // ESL – English for Devs
const VIDEO_ID  = 'MsxcpZr1LpM';

(async () => {
  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const lesson = snap.data();
  const clip   = lesson.clip;

  // ── Backup BEFORE any write ──────────────────────────────────────
  await backupLessonDoc(db, LESSON_ID, 'populate-clt');

  // ── Preserve teacher-curated slides ──────────────────────────────
  const existingSlides    = Array.isArray(lesson.slides) ? lesson.slides : [];
  const gameSlide         = existingSlides.find(s => s.type === 'clip_dialogue_game');
  const comprehensionSlide = existingSlides.find(s => s.type === 'clip_comprehension');
  if (!gameSlide)          { console.error('No clip_dialogue_game slide found — refusing to write.'); process.exit(1); }
  if (!comprehensionSlide) { console.error('No clip_comprehension slide found — refusing to write.'); process.exit(1); }

  // ── 1. Cover ─────────────────────────────────────────────────────
  const coverSlide = {
    type: 'cover',
    title: `${clip.source} — ${clip.title}`,
    subtitle: 'A realistic daily standup. The everyday English you will hear and use as a developer.',
    content: lesson.level || 'B2',
    imageUrl: `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
  };

  // ── 2. Vocabulary ─────────────────────────────────────────────────
  const vocabSlide = {
    type: 'vocabulary',
    title: 'Key vocabulary',
    subtitle: 'Tap each card to reveal the meaning. You will hear these in the standup.',
    words: [
      { word: 'standup',         translation: 'short daily team meeting (≈15 min) where each member reports progress, blockers and next steps',
        example: "Let's kick off our daily standup. Who wants to start today?" },
      { word: 'blocker',         translation: 'something that is stopping you from making progress',
        example: "I've been waiting for some clarification on the security requirements." },
      { word: 'swamped',         translation: 'extremely busy, overwhelmed with work',
        example: "I've been swamped with meetings." },
      { word: 'ticket',          translation: 'a unit of work in your project tracker (Jira, Linear, etc.)',
        example: "You've cleared up all other information about this ticket, right?" },
      { word: 'JWT',             translation: 'JSON Web Token — a compact, signed token used for authentication',
        example: 'I think I need to dig deeper into our JWT library.', pronunciation: 'ˌdʒeɪ-ˈdʌbəl-juː-ˈtiː' },
      { word: 'staging',         translation: 'a pre-production environment used to test before release',
        example: "I'll push the initial version to our staging environment this afternoon." },
      { word: 'edge case',       translation: 'an uncommon scenario that exposes hidden bugs',
        example: "We've uncovered a few edge cases in the user profile update flow." },
      { word: 'showstopper',     translation: 'a critical bug that blocks the release',
        example: 'Nothing showstopping, but there is an intermittent bug…' },
      { word: 'code splitting',  translation: 'breaking a large bundle into smaller chunks loaded on demand',
        example: "I've started implementing code splitting and lazy loading for some of our larger components." },
      { word: 'tree shaking',    translation: "removing code that isn't used so the final bundle is smaller",
        example: "I'm looking into using Webpack's tree shaking more aggressively." },
    ],
  };

  // ── 3. Predictions ───────────────────────────────────────────────
  const predictionsSlide = {
    type: 'predictions',
    title: 'Before you watch',
    prompt: 'You are about to listen to a real daily standup at a software team. Think before you watch.',
    content: [
      'What roles do you expect to hear? (developer, QA, product owner, etc.)',
      'What format will the meeting probably follow?',
      'Which technical topics or problems do you expect each person to mention?',
      'What English phrases would you use to report progress, blockers, and next steps in your own standup?',
    ].join('\n'),
  };

  // ── 4. Dialogue Game (PRESERVED) ─────────────────────────────────
  // ── 5. Comprehension (PRESERVED) ─────────────────────────────────

  // ── 6. Language Focus ────────────────────────────────────────────
  const languageFocusSlide = {
    type: 'language_focus',
    title: 'Standup language patterns',
    content: [
      'A standup is a fast, repetitive format. Every developer answers three questions:',
      '• What did I work on?',
      '• What am I working on now?',
      '• Am I blocked on anything?',
      '',
      'Notice four patterns in the clip — they are the building blocks you will use every morning:',
      '• Present perfect continuous (I have been + -ing) → ongoing work since yesterday',
      '• Run into / dig deeper into → describing problems and how you are tackling them',
      '• Hedging language (kind of / sort of / I think / maybe) → expressing uncertainty politely',
      '• Future intent (I will / I am going to / I will keep + -ing) → next steps',
    ].join('\n'),
    words: [
      { word: "I've been working on the new authentication service.",
        translation: 'Reporting ongoing work',
        example: 'Pattern: I have been + -ing  (since yesterday / this week)' },
      { word: "I've run into some issues with token refresh.",
        translation: 'Reporting a blocker',
        example: 'Pattern: run into / dig deeper into / look into' },
      { word: "I'm not sure but it might be related to how we're handling asynchronous actions.",
        translation: 'Hedging uncertainty',
        example: 'Pattern: I am not sure but… / it might / I think / maybe' },
      { word: "I'll keep working on the token validation logic.",
        translation: 'Stating next steps',
        example: 'Pattern: I will + verb  /  I will keep + -ing  /  I am going to + verb' },
    ],
    teacherNotes: 'Drill the four patterns orally before the controlled practice. Encourage the student to swap nouns (auth service → API endpoint, deployment, dashboard) so the patterns become reusable.',
  };

  // ── 7. Controlled Practice ───────────────────────────────────────
  const controlledPracticeSlide = {
    type: 'language_practice',
    title: 'Controlled practice',
    subtitle: 'Use the four standup patterns to build the sentences.',
    practiceItems: [
      {
        type: 'unscramble',
        prompt: "I/have/run/into/some/issues/with/the/token/refresh",
        answer: "I have run into some issues with the token refresh",
      },
      {
        type: 'unscramble',
        prompt: "I/have/been/working/on/the/new/authentication/service",
        answer: "I have been working on the new authentication service",
      },
      {
        type: 'unscramble',
        prompt: "I/will/push/the/initial/version/to/our/staging/environment",
        answer: "I will push the initial version to our staging environment",
      },
      {
        type: 'match_halves',
        prompt: "I've been swamped with meetings,",
        answer: "so I'll get back to you about that ticket later today.",
        options: [
          "so I'll get back to you about that ticket later today.",
          "so the deployment was successful.",
          "so the unit tests are now passing.",
          "so the bundle size has dropped significantly.",
        ],
      },
      {
        type: 'match_halves',
        prompt: "I'm not sure what's causing the bug,",
        answer: "but I think it might be related to how we handle async actions.",
        options: [
          "but I think it might be related to how we handle async actions.",
          "and the release went out yesterday.",
          "and the staging environment is up.",
          "but the standup is at 10am.",
        ],
      },
    ],
  };

  // ── 8. Free Production ───────────────────────────────────────────
  const productionSlide = {
    type: 'clip_production',
    title: 'Your turn — give your own standup',
    prompt: 'Imagine you are at tomorrow morning\'s standup. Give your update in 60–90 seconds.',
    content: [
      'Pick a real or hypothetical project you are working on.',
      'Report ONE thing you worked on yesterday  (use: I have been + -ing).',
      'Report ONE blocker  (use: I have run into… / I am waiting for…).',
      'Hedge ONE uncertainty  (use: I am not sure but… / it might…).',
      'State ONE thing you will do next  (use: I will… / I am going to…).',
      'Speak for ~60–90 seconds. Then swap to the teacher\'s role and ask one follow-up question.',
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
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log('✓ Updated lesson with', slides.length, 'slides:');
  slides.forEach((s, i) => console.log(`   ${i + 1}. ${s.type}  —  ${s.title || ''}`));
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
