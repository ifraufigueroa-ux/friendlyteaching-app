// One-shot: create the "The Bookshop at Rainy Street" Friendlytext lesson
// directly in Firestore, bypassing the UI (Anthropic credits are drained).
//
// Flow:
//   1. Author 10 CLT slides inline (Claude Sonnet in the assistant conversation).
//   2. Attempt to generate audio via the DEPLOYED /api/tts/elevenlabs endpoint
//      using the "Sarah" (US ♀) library voice. If ElevenLabs 402s (free-tier
//      cannot use library voices), the lesson still saves — audio can be
//      attached later once ElevenLabs is upgraded.
//   3. If audio came back, upload the MP3 to Firebase Storage under /audio/
//      via the admin SDK and grab a signed download URL.
//   4. Insert the textLessons doc owned by Ignacio's teacher UID.
//
// Usage:  node scripts/create-bookshop-textlesson.js
// No args. Idempotent-ish — it will create a NEW doc each run.
//
// If deploy is unreachable set SKIP_AUDIO=1 to skip the TTS step entirely.

const path = require('path');
const fs = require('fs');
const { initAdmin } = require('./_lessonBackup');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const TEACHER_UID  = 'upRMjey4VSg4bAgGzLWn2SlcFg82'; // Ignacio Frau
const STORAGE_BUCKET = 'friendly-scheduling.firebasestorage.app';
const DEPLOYED_TTS_URL = 'https://friendlyteaching.cl/api/tts/elevenlabs';
const SARAH_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

// ── 1. STORY ─────────────────────────────────────────────────────────
const STORY_TITLE  = 'The Bookshop at Rainy Street';
const STORY_SOURCE = 'Friendly Teaching CL';
const STORY_LEVEL  = 'B1';

const STORY_TEXT = `Every Saturday afternoon, when the sky over the city turned grey, Mateo walked to the little bookshop on Rainy Street. The shop was old and narrow, with a wooden door that always squeaked, and a bell above it that laughed when it rang.

Inside, the smell was warm — a mix of old paper, cinnamon tea, and something like memory. The owner was Elena, a woman in her sixties who wore round glasses and a soft blue cardigan. She never asked Mateo what he wanted. She simply watched him from behind the counter and, after a moment, disappeared into the back and returned with a single book.

"For this Saturday," she would say, sliding it across the wood.

Mateo did not understand how she did it. Once she gave him a book about the sea when he had not slept for three nights. Once she gave him a book of short poems the week his grandfather died. He never told her what was happening in his life. He did not have to.

One rainy afternoon, Mateo found the courage to ask.

"Elena, how do you always choose the right book?"

She smiled, closed her eyes for a second, and answered slowly.

"I don't choose the book, Mateo. I choose the reader. Books are patient. They wait for the person who needs them."

Mateo walked home through the wet streets that day carrying a small novel about a man who learned to talk to strangers. He did not know it yet, but in three weeks he would begin a conversation on a train that would change his life.

Years later, when Elena was gone and the bookshop had become a café, Mateo still passed by Rainy Street on grey Saturdays. He would stop for a moment, look at the empty window, and whisper, "Thank you."

Some places do not disappear. They simply move inside us, and keep choosing us, again and again.`;

// ── 2. SLIDES (CLT 10-slide Friendlytext deck) ───────────────────────
const slides = [
  // 1. Cover
  {
    id: 'ai-slide-0',
    type: 'text_cover',
    phase: 'pre',
    title: STORY_TITLE,
    subtitle: `A CLT text lesson — ${STORY_SOURCE}`,
  },

  // 2. Vocab
  {
    id: 'ai-slide-1',
    type: 'vocab_match',
    phase: 'pre',
    title: 'Key Vocabulary',
    words: [
      { word: 'squeaked',  translation: 'made a short, high-pitched sound',    pronunciation: '/skwiːkt/',   example: 'The shop was old and narrow, with a wooden door that always squeaked, and a bell above it that laughed when it rang.' },
      { word: 'narrow',    translation: 'small in width from side to side',    pronunciation: '/ˈnæroʊ/',   example: 'The shop was old and narrow, with a wooden door that always squeaked, and a bell above it that laughed when it rang.' },
      { word: 'cardigan',  translation: 'a knitted sweater that opens in the front', pronunciation: '/ˈkɑːrdɪɡən/', example: 'The owner was Elena, a woman in her sixties who wore round glasses and a soft blue cardigan.' },
      { word: 'cinnamon',  translation: 'a warm brown spice from tree bark',   pronunciation: '/ˈsɪnəmən/', example: 'Inside, the smell was warm — a mix of old paper, cinnamon tea, and something like memory.' },
      { word: 'courage',   translation: 'the strength to do something scary',   pronunciation: '/ˈkɜːrɪdʒ/', example: 'One rainy afternoon, Mateo found the courage to ask.' },
      { word: 'patient',   translation: 'able to wait without becoming annoyed', pronunciation: '/ˈpeɪʃənt/', example: 'Books are patient.' },
      { word: 'whisper',   translation: 'to speak very softly, almost silently', pronunciation: '/ˈwɪspər/', example: 'He would stop for a moment, look at the empty window, and whisper, "Thank you."' },
    ],
  },

  // 3. Predictions
  {
    id: 'ai-slide-2',
    type: 'predictions',
    phase: 'pre',
    title: 'Before You Read...',
    prompt: `Just from the title "${STORY_TITLE}" and the source Friendly Teaching CL, what mood do you picture — and who might walk through that door?`,
    content: [
      `• Imagine a small bookshop on Rainy Street. Describe the sounds, the smell, the person behind the counter — what feeling fills the room?`,
      `• Tell us about a time a book, a song, or a small place seemed to arrive in your life exactly when you needed it.`,
      `• Think of a text in Spanish (a book, a poem, a song) that shares a similar warm, rainy mood with "${STORY_TITLE}". What do they have in common?`,
    ].join('\n'),
  },

  // 4. Reading
  {
    id: 'ai-slide-3',
    type: 'text_reading',
    phase: 'while',
    title: 'Read the Text',
    content: STORY_TEXT,
  },

  // 5. Comprehension quiz (6 questions of interpretation)
  {
    id: 'ai-slide-4',
    type: 'listening_quiz',
    phase: 'while',
    title: 'Comprehension Check',
    questions: [
      {
        question: 'What is the main message of "The Bookshop at Rainy Street"?',
        options: [
          { id: 'a', text: 'Old bookshops sell rare, valuable books.', isCorrect: false },
          { id: 'b', text: 'Some places and people shape us in ways we only understand later.', isCorrect: true },
          { id: 'c', text: 'Elena runs a very profitable business.', isCorrect: false },
          { id: 'd', text: 'Rain makes people read more books.', isCorrect: false },
        ],
        correctAnswer: 'Some places and people shape us in ways we only understand later.',
      },
      {
        question: 'When Elena says "I choose the reader," what does she really mean?',
        options: [
          { id: 'a', text: 'She only sells to customers she knows.', isCorrect: false },
          { id: 'b', text: 'She senses what a person needs and matches a book to that moment.', isCorrect: true },
          { id: 'c', text: 'Books cannot really be chosen — it is random.', isCorrect: false },
          { id: 'd', text: 'The reader must buy whatever she recommends.', isCorrect: false },
        ],
        correctAnswer: 'She senses what a person needs and matches a book to that moment.',
      },
      {
        question: 'The narrator writes that the bell "laughed when it rang." This phrase most likely suggests:',
        options: [
          { id: 'a', text: 'The bell was broken and made strange noises.', isCorrect: false },
          { id: 'b', text: 'The shop had a warm, alive, welcoming atmosphere.', isCorrect: true },
          { id: 'c', text: 'Customers laughed at the old bell.', isCorrect: false },
          { id: 'd', text: 'Elena had installed a novelty doorbell.', isCorrect: false },
        ],
        correctAnswer: 'The shop had a warm, alive, welcoming atmosphere.',
      },
      {
        question: 'Why did Mateo never explain his life to Elena?',
        options: [
          { id: 'a', text: 'He was shy and did not trust her.', isCorrect: false },
          { id: 'b', text: 'She already understood without being told.', isCorrect: true },
          { id: 'c', text: 'She only spoke about books, never about people.', isCorrect: false },
          { id: 'd', text: 'He wanted his visits to feel anonymous.', isCorrect: false },
        ],
        correctAnswer: 'She already understood without being told.',
      },
      {
        question: 'How does the narrator seem to feel by the end of the story?',
        options: [
          { id: 'a', text: 'Angry that the bookshop has disappeared.', isCorrect: false },
          { id: 'b', text: 'Indifferent — he has moved on completely.', isCorrect: false },
          { id: 'c', text: 'Quietly grateful, carrying Elena inside himself.', isCorrect: true },
          { id: 'd', text: 'Confused about who Elena really was.', isCorrect: false },
        ],
        correctAnswer: 'Quietly grateful, carrying Elena inside himself.',
      },
      {
        question: 'What does the final line — "Some places do not disappear. They simply move inside us" — really mean?',
        options: [
          { id: 'a', text: 'The bookshop building was never actually demolished.', isCorrect: false },
          { id: 'b', text: 'Meaningful places live on as part of who we become.', isCorrect: true },
          { id: 'c', text: 'Mateo will one day open a new bookshop himself.', isCorrect: false },
          { id: 'd', text: 'It is impossible to forget any place you have visited.', isCorrect: false },
        ],
        correctAnswer: 'Meaningful places live on as part of who we become.',
      },
    ],
  },

  // 6. Language focus — Past simple (dominant tense in narrative)
  {
    id: 'ai-slide-5',
    type: 'language_focus',
    phase: 'while',
    title: 'Language Focus: Past simple',
    content: [
      `In "${STORY_TITLE}", the writer uses the past simple to tell us what Mateo did, week after week, in the little bookshop.`,
      ``,
      `• Regular past → -ed endings such as "walked", "smiled", "answered" → shows finished actions in the past.`,
      `• Irregular past → "wore", "gave", "was", "did" → same idea (finished past), different form you have to learn.`,
      `• Habitual "would" → "she would say", "he would stop" → describes repeated past routines, softer than "used to".`,
      ``,
      `Notice how the past simple gives the whole story its warm, distant, memory-like tone.`,
    ].join('\n'),
    words: [
      { word: 'Every Saturday afternoon, when the sky over the city turned grey, Mateo walked to the little bookshop on Rainy Street.', translation: 'Past simple', example: 'Pattern: turned grey, Mateo walked' },
      { word: 'The owner was Elena, a woman in her sixties who wore round glasses and a soft blue cardigan.', translation: 'Past simple', example: 'Pattern: was Elena … wore round glasses' },
      { word: 'She smiled, closed her eyes for a second, and answered slowly.', translation: 'Past simple', example: 'Pattern: smiled, closed … answered' },
      { word: 'He would stop for a moment, look at the empty window, and whisper, "Thank you."', translation: 'Habitual "would"', example: 'Pattern: would stop … whisper' },
    ],
  },

  // 7. Language practice — 4 items, unscramble → match_halves → unscramble → match_halves
  {
    id: 'ai-slide-6',
    type: 'language_practice',
    phase: 'while',
    title: "Let's Practice!",
    content: 'Rearrange the words and match the halves. Every sentence comes straight from the story.',
    practiceItems: [
      {
        type: 'unscramble',
        prompt: 'She / smiled / , / closed / her / eyes / for / a / second',
        answer: 'She smiled , closed her eyes for a second',
      },
      {
        type: 'match_halves',
        prompt: 'One rainy afternoon,',
        answer: 'Mateo found the courage to ask.',
        options: [
          'Mateo found the courage to ask.',
          'the bookshop had become a café.',
          'she wore a soft blue cardigan.',
          'they wait for the person who needs them.',
        ],
      },
      {
        type: 'unscramble',
        prompt: 'Books / are / patient / . / They / wait / for / the / person',
        answer: 'Books are patient . They wait for the person',
      },
      {
        type: 'match_halves',
        prompt: 'Years later, when Elena was gone',
        answer: 'and the bookshop had become a café.',
        options: [
          'and the bookshop had become a café.',
          'and answered slowly.',
          'and a bell above it that laughed.',
          'and returned with a single book.',
        ],
      },
    ],
  },

  // 8. Translation game — passage translated to Spanish, 6 blanks (B1 → 5-6)
  {
    id: 'ai-slide-7',
    type: 'translation_game',
    phase: 'post',
    title: 'Translate It!',
    translationText: `"I don't choose the book, Mateo. I choose the reader. Books are patient. They wait for the person who needs them."`,
    content: `"Yo no elijo el {{blank}}, Mateo. Elijo al {{blank}}. Los libros son {{blank}}. {{blank}} a la persona que los {{blank}}."`,
    blanksData: [
      { word: 'libro',     options: ['libro', 'cuaderno', 'diario', 'papel'] },
      { word: 'lector',    options: ['lector', 'escritor', 'dueño', 'cliente'] },
      { word: 'pacientes', options: ['pacientes', 'rápidos', 'antiguos', 'silenciosos'] },
      { word: 'Esperan',   options: ['Esperan', 'Buscan', 'Miran', 'Llaman'] },
      { word: 'necesita',  options: ['necesita', 'compra', 'olvida', 'guarda'] },
    ],
  },

  // 9. Wrap-up
  {
    id: 'ai-slide-8',
    type: 'wrapup',
    phase: 'post',
    title: 'Wrap Up',
    prompt: `Now that you have read "${STORY_TITLE}", who is the Elena in your own life — the person who always seems to give you the right book, song, or word?`,
    content: [
      `→ Describe the exact moment in "${STORY_TITLE}" that hit you hardest — the line, the smell, the image. Read it out loud.`,
      `→ Compare your prediction from the start with what "${STORY_TITLE}" turned out to be. What surprised you most?`,
      `→ Pick one line from "${STORY_TITLE}" (for example, "Books are patient") that you want to remember this week. Say it aloud and explain why.`,
    ].join('\n'),
  },

  // 10. End
  {
    id: 'ai-slide-9',
    type: 'friendlytext_end',
    phase: 'post',
    title: '¡Lección completada!',
  },
];

// ── 3. Attempt TTS ───────────────────────────────────────────────────
async function tryGenerateAudio() {
  if (process.env.SKIP_AUDIO === '1') {
    console.log('· SKIP_AUDIO=1 — skipping TTS');
    return null;
  }
  console.log(`· Calling deployed ${DEPLOYED_TTS_URL} with Sarah (${SARAH_VOICE_ID})…`);
  const res = await fetch(DEPLOYED_TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: STORY_TEXT, voiceId: SARAH_VOICE_ID }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`⚠  TTS failed: HTTP ${res.status} → ${body.slice(0, 400)}`);
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`✓ Got MP3 (${buf.length.toLocaleString()} bytes)`);
  return buf;
}

async function uploadAudio(buf) {
  const fileName = `friendlytext-${TEACHER_UID}-${Date.now()}.mp3`;
  const objectPath = `audio/${fileName}`;
  const bucket = getStorage().bucket(STORAGE_BUCKET);
  const file = bucket.file(objectPath);
  const downloadToken = require('crypto').randomUUID();
  await file.save(buf, {
    contentType: 'audio/mpeg',
    metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } },
  });
  const encoded = encodeURIComponent(objectPath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encoded}?alt=media&token=${downloadToken}`;
  console.log(`✓ Uploaded to ${objectPath}`);
  return url;
}

// ── 4. Main ──────────────────────────────────────────────────────────
(async () => {
  initAdmin();
  const db = getFirestore();

  let audioUrl = null;
  try {
    const buf = await tryGenerateAudio();
    if (buf) audioUrl = await uploadAudio(buf);
  } catch (err) {
    console.warn('⚠  Audio pipeline errored:', err.message || err);
  }

  const audioSource = audioUrl ? 'tts' : 'none';

  const textData = {
    title: STORY_TITLE,
    source: STORY_SOURCE,
    text: STORY_TEXT,
    audioSource,
    ...(audioUrl ? { audioUrl, ttsVoiceId: SARAH_VOICE_ID } : {}),
  };

  // Enrich slides that need textData (cover, reading, end).
  const enriched = slides.map(s => {
    const needs = s.type === 'text_cover' || s.type === 'text_reading' || s.type === 'friendlytext_end';
    return needs ? { ...s, textData } : s;
  });

  const doc = {
    teacherId: TEACHER_UID,
    title: `${STORY_SOURCE} – ${STORY_TITLE}`,
    level: STORY_LEVEL,
    text: textData,
    slides: enriched,
    publishStatus: 'draft',
    assignedTo: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection('textLessons').add(doc);
  console.log(`\n✅ Lesson created: textLessons/${ref.id}`);
  console.log(`   Title:  ${doc.title}`);
  console.log(`   Level:  ${doc.level}`);
  console.log(`   Slides: ${enriched.length}`);
  console.log(`   Audio:  ${audioSource === 'tts' ? 'Sarah / ElevenLabs (attached)' : 'none (add later from the editor)'}`);
})().catch(err => { console.error('FATAL:', err); process.exit(1); });
