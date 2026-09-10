// Clona la lección Bot Farms (B2, movieLessons/GskpRCzaMNzPTDKCsCgu) como
// una versión B1: vocabulario más simple, language focus First Conditional
// (reemplaza Passive voice), controlled practice reescrita para 1st cond,
// y 3 cards de critical thinking en clip_production con 1st conditional
// implícito. Mismo video, mismos timings, mismo dialogue_game — sólo
// cambia lo pedagógico.
//
// Crea un NUEVO documento en movieLessons (no toca el B2). Publish status
// arranca en 'draft' para que el profe revise antes de publicar.
//
// Usage: node scripts/clone-bot-farms-b1.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const SOURCE_ID = 'GskpRCzaMNzPTDKCsCgu';

// ─── B1 content ─────────────────────────────────────────────────────

const B1_VOCAB = [
  { word: 'fake',      translation: 'not real, but made to look real',                        pronunciation: '/feɪk/',            example: 'The costume is a fake account, a name, a photo.' },
  { word: 'account',   translation: 'your personal page or profile on a website or app',       pronunciation: '/əˈkaʊnt/',         example: "That account you argued with at midnight never got tired." },
  { word: 'traffic',   translation: 'the amount of people or data moving on the internet',     pronunciation: '/ˈtræfɪk/',         example: 'Most of the traffic on the internet was not human.' },
  { word: 'trust',     translation: 'to believe that something or someone is real or safe',    pronunciation: '/trʌst/',           example: 'The platform trusts a phone.' },
  { word: 'harm',      translation: 'damage or a bad result',                                  pronunciation: '/hɑːrm/',           example: "Where's the harm in a fake thumbs up?" },
  { word: 'spread',    translation: 'to reach many places or people',                          pronunciation: '/spred/',           example: 'Some farms are spread across a dozen countries.' },
  { word: 'crowd',     translation: 'a large group of people together',                        pronunciation: '/kraʊd/',           example: 'In a crowd, a hundred identical voices are a glitch.' },
  { word: 'prove',     translation: 'to show that something is true',                          pronunciation: '/pruːv/',           example: 'A video about fake things had to prove it was made by a real one.' },
];

const B1_PREDICTIONS_CONTENT = [
  "• The word \"bot\" — What do you think a \"bot\" is? Have you heard this word before?",
  "• Fake or real? — When you see a comment online, how do you know if it's from a real person?",
  "• Your feed — Do you trust the videos and posts you see on social media? Why or why not?",
].join('\n');

// Same 6 questions as the B2, but options rewritten to B1 vocab and grammar
// (no passive constructions in options, high-frequency verbs, shorter items).
const B1_COMPREHENSION_QUESTIONS = [
  {
    question: 'According to the video, what is a bot?',
    options: [
      { id: 'q0o0', text: 'A script with a list of instructions',   isCorrect: true  },
      { id: 'q0o1', text: 'A small toy robot',                       isCorrect: false },
      { id: 'q0o2', text: 'A program that only shows ads',           isCorrect: false },
      { id: 'q0o3', text: 'A fake phone on the internet',            isCorrect: false },
    ],
    correctAnswer: 'A script with a list of instructions',
  },
  {
    question: 'Why do bot farms use real phones?',
    options: [
      { id: 'q1o0', text: 'To make the bots work faster',                       isCorrect: false },
      { id: 'q1o1', text: 'Because platforms trust real phones more than fake ones', isCorrect: true },
      { id: 'q1o2', text: 'To give every bot a different photo',                isCorrect: false },
      { id: 'q1o3', text: "Because computers can't use social media",            isCorrect: false },
    ],
    correctAnswer: 'Because platforms trust real phones more than fake ones',
  },
  {
    question: 'What is the main goal of fake likes in the video?',
    options: [
      { id: 'q2o0', text: 'To make people talk to bots',                                 isCorrect: false },
      { id: 'q2o1', text: 'To create more fake accounts on the internet',                isCorrect: false },
      { id: 'q2o2', text: 'To make posts more fun to read',                              isCorrect: false },
      { id: 'q2o3', text: 'To change what the algorithm shows to real people',           isCorrect: true },
    ],
    correctAnswer: 'To change what the algorithm shows to real people',
  },
  {
    question: 'Why do bot accounts look a little different from each other?',
    options: [
      { id: 'q3o0', text: "So the platform doesn't find them easily",  isCorrect: true  },
      { id: 'q3o1', text: 'So they can share the same phones',         isCorrect: false },
      { id: 'q3o2', text: 'So their posts look more creative',         isCorrect: false },
      { id: 'q3o3', text: 'So the bot farm costs less money',          isCorrect: false },
    ],
    correctAnswer: "So the platform doesn't find them easily",
  },
  {
    question: "What does the speaker mean by \"friction\"?",
    options: [
      { id: 'q4o0', text: 'The problem of running a bot farm',                    isCorrect: false },
      { id: 'q4o1', text: 'The fight between real and fake users',                isCorrect: false },
      { id: 'q4o2', text: 'The small mistakes and costs of doing something real', isCorrect: true  },
      { id: 'q4o3', text: 'The time needed to open a social media account',       isCorrect: false },
    ],
    correctAnswer: 'The small mistakes and costs of doing something real',
  },
  {
    question: 'Why does the speaker draw the strawberry by hand?',
    options: [
      { id: 'q5o0', text: 'To make the video more fun',                     isCorrect: false },
      { id: 'q5o1', text: 'To show that a real person made the video',       isCorrect: true  },
      { id: 'q5o2', text: 'To show how quickly bots can copy pictures',      isCorrect: false },
      { id: 'q5o3', text: 'To explain how AI creates images',                isCorrect: false },
    ],
    correctAnswer: 'To show that a real person made the video',
  },
];

const B1_LANGUAGE_FOCUS = {
  type: 'clip_language_focus',
  title: 'Language focus: First Conditional',
  subtitle: 'First Conditional',
  phase: 'while',
  content:
    "The First Conditional talks about a REAL possibility in the future. Use it to describe what will probably happen if a condition is true.\n" +
    "• Form: IF + present simple, WILL + base verb (\"If you post a photo, people will see it.\").\n" +
    "• Meaning: shows a real cause-and-effect for a future action.\n" +
    "• Use: perfect for rules, promises, and predictions about consequences online.\n" +
    "In this clip, the speaker uses this structure to challenge us — and the whole video is about the real consequences that follow one small online action.",
  words: [
    {
      word: 'First Conditional',
      translation: 'Look for IF + present, WILL + base verb.',
      example: 'If a bot just likes and scrolls, who cares?',
    },
    {
      word: 'First Conditional',
      translation: 'Cause and effect for a real future.',
      example: 'If you see many fake likes, you will think the post is popular.',
    },
  ],
};

const B1_CONTROLLED_PRACTICE = {
  type: 'clip_controlled_practice',
  title: 'Controlled practice',
  subtitle: 'First Conditional',
  phase: 'post',
  practiceItems: [
    {
      type: 'multiple_selection',
      prompt: 'Which sentence uses the First Conditional correctly?',
      answer: 'If you see many likes, you will believe the post.',
      options: [
        'If you see many likes, you will believe the post.',
        'If you saw many likes, you would believe the post.',
        'If you will see many likes, you will believe the post.',
        'You believed the post if you saw many likes.',
      ],
      grammarTopic: 'First Conditional',
      contextLine: 'If you see many likes, you will believe the post.',
    },
    {
      type: 'unscramble',
      prompt: 'If / a / review / looks / fake, / people / won\'t / trust / it',
      answer: "If a review looks fake, people won't trust it",
      grammarTopic: 'First Conditional',
      contextLine: "If a review looks fake, people won't trust it.",
    },
    {
      type: 'verb_form',
      prompt: 'If the algorithm {{blank}} (see) many likes, it will show the post to more people.',
      answer: 'sees',
      options: ['will see', 'sees', 'saw', 'is seeing'],
      grammarTopic: 'First Conditional',
      contextLine: 'If the algorithm sees many likes, it will show the post to more people.',
    },
    {
      type: 'match_halves',
      prompt: 'If a bot writes 100 reviews,',
      answer: 'the product will look popular online.',
      options: [
        'the product will look popular online.',
        'you would be more careful next time.',
        'no one has ever read them.',
        'the platform blocked all accounts.',
      ],
      grammarTopic: 'First Conditional',
      contextLine: 'If a bot writes 100 reviews, the product will look popular online.',
    },
    {
      type: 'unscramble',
      prompt: 'If / you / spend / more / time / online, / you / will / see / more / ads',
      answer: 'If you spend more time online, you will see more ads',
      grammarTopic: 'First Conditional',
      contextLine: 'If you spend more time online, you will see more ads.',
    },
    {
      type: 'verb_form',
      prompt: 'If you {{blank}} (post) a strong opinion online, some bots will reply.',
      answer: 'post',
      options: ['will post', 'posted', 'post', 'posting'],
      grammarTopic: 'First Conditional',
      contextLine: 'If you post a strong opinion online, some bots will reply.',
    },
    {
      type: 'error_correction',
      prompt: 'Correct the mistake:',
      wrongText: 'If you will see fake accounts, please report them.',
      answer: 'If you see fake accounts, please report them.',
      grammarTopic: 'First Conditional',
      contextLine: 'If you see fake accounts, please report them.',
    },
    {
      type: 'open_ended',
      prompt: 'Complete the sentence in your own words using the First Conditional.',
      answer: '',
      stem: 'If I see a fake profile online, ',
      grammarTopic: 'First Conditional',
    },
  ],
};

// 3 critical-thinking cards. Same format as previous friendlyflix pattern
// ("• Label — Question"). First Conditional triggers are embedded in the
// prompt itself so the student naturally answers with IF + present, WILL +
// base verb, without the grammar ever being named.
//
//   Q1 → "If the likes are real / will you believe"
//   Q2 → "If some are written by bots / will you still trust"
//   Q3 → "If you post something perfect / will your friends trust it more"
const B1_PRODUCTION_CONTENT = [
  "• Fake likes, real doubts — Imagine you open Instagram and a photo has 100,000 likes in one hour. Will you believe it? If the likes are not real, what will you do to check?",
  "• A bot writes your review — Before you buy something online, you read the reviews. If some of them are written by bots, will you still trust the score? What will you look for to feel safe?",
  "• A little imperfect — The speaker says the internet is more real if it is \"a little imperfect\". If you post a perfect photo — no mistakes, perfect light — will your friends trust you more, or less? Will you try to look more real online this week?",
].join('\n');

const B1_PRODUCTION_PROMPT = 'Three questions to think aloud with. Pick the one that pulls you in — or answer all three.';

// ─── main ───────────────────────────────────────────────────────────

(async () => {
  initAdmin();
  const db = getFirestore();
  const srcRef = db.collection('movieLessons').doc(SOURCE_ID);
  const srcSnap = await srcRef.get();
  if (!srcSnap.exists) { console.error('Source lesson not found:', SOURCE_ID); process.exit(1); }
  const src = srcSnap.data();

  // Adapt slides. Preserve everything the video machinery needs (clipData,
  // dialogue, timings, dialogue_game blanks) and only swap the pedagogical
  // parts to their B1 versions.
  const newSlides = src.slides.map((s) => {
    switch (s.type) {
      case 'clip_cover':
        return { ...s, content: 'B1' };
      case 'clip_vocab_match':
        return { ...s, words: B1_VOCAB };
      case 'clip_predictions':
        return {
          ...s,
          prompt: 'What might be hiding behind the posts and likes you see every day?',
          content: B1_PREDICTIONS_CONTENT,
        };
      case 'clip_comprehension':
        return { ...s, questions: B1_COMPREHENSION_QUESTIONS };
      case 'clip_language_focus':
        // Fresh object — the old one carries Passive voice metadata.
        return B1_LANGUAGE_FOCUS;
      case 'clip_controlled_practice':
        return B1_CONTROLLED_PRACTICE;
      case 'clip_production':
        return {
          ...s,
          prompt: B1_PRODUCTION_PROMPT,
          content: B1_PRODUCTION_CONTENT,
        };
      case 'friendlyflix_end':
      case 'clip_dialogue_game':
      default:
        return s; // keep as-is (dialogue game is video-locked, end is generic)
    }
  });

  const now = new Date();
  const newDoc = {
    ...src,
    title:         'Hard Truth Reality – Bot Farms (B1)',
    level:         'B1',
    slides:        newSlides,
    assignedTo:    [],
    publishStatus: 'draft',
    createdAt:     now,
    updatedAt:     now,
  };

  // Firestore auto-generates the id for the new doc.
  const dstRef = await db.collection('movieLessons').add(newDoc);
  console.log('\n✓ Cloned Bot Farms as B1');
  console.log('  new lesson id :', dstRef.id);
  console.log('  title         :', newDoc.title);
  console.log('  level         :', newDoc.level);
  console.log('  publishStatus :', newDoc.publishStatus);
  console.log('  slides        :', newDoc.slides.length);
  console.log('  vocab items   :', B1_VOCAB.length);
  console.log('  practice items:', B1_CONTROLLED_PRACTICE.practiceItems.length);
  console.log('  production    :', B1_PRODUCTION_CONTENT.split('\n').length, 'critical-thinking cards');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
