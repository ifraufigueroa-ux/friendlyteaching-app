// FriendlyTeaching.cl — One-shot: rewrite the Language focus slide of AI2027
// Part 1/2 to actually cover third conditional alongside hypothetical modals.
// The previous version had the title "Third conditional & hypothetical modals"
// but no bullet or example touched the third conditional.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';

const NEW_CONTENT = [
  "The dialogue mixes hypothetical modals — for open future risks — with the third conditional — for looking back at events that didn't happen. Both distance the speaker from certainty, essential for C1 risk analysis.",
  "• Hypothetical modals · modal (could / might / what if) + bare infinitive — opens a possible future scenario; 'could mean' signals a conditional consequence.",
  "• Third conditional · if + past perfect, would / could / might have + past participle — evaluates a past that never happened ('if OpenBrain had paused, Agent-4 wouldn't have been built').",
  "• Meaning · both structures hedge — modals frame the future as possible, not guaranteed; the third conditional weighs an alternative past against reality.",
  "• Use · in journalism and academic argument, these hedges let the writer explore worst-case futures and hindsight scenarios without asserting them as fact.",
  "In this scene, 'what if the AI goes rogue' and 'slowing down could mean China's DeepCent catches up' become sharper when reframed as third-conditional reflections after the fact.",
].join('\n');

const NEW_WORDS = [
  {
    word: "What if the AI goes rogue",
    translation: "hypothetical modal — imagines a dangerous uncontrolled outcome",
    example: "What if the AI goes rogue and undermines global stability?",
  },
  {
    word: "Slowing down could mean China's DeepCent catches up",
    translation: "hypothetical modal — signals a possible negative consequence of an action",
    example: "The CEO argues that slowing down development could mean China's DeepCent catches up.",
  },
  {
    word: "If OpenBrain had listened to the safety team, Agent-4 wouldn't have been built.",
    translation: "third conditional — past unreal: evaluates an alternative timeline the scenario warns against",
    example: "Third-conditional reformulation of the scenario's central warning.",
  },
  {
    word: "Had the US paused development, DeepCent might have overtaken OpenBrain in months.",
    translation: "third conditional (inverted) — hindsight speculation about a past decision",
    example: "Formal register: 'Had + subject + past participle' drops 'if' for academic tone.",
  },
];

initAdmin();
const db = getFirestore();

(async () => {
  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data   = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  const idx = slides.findIndex(s => s?.type === 'clip_language_focus');
  if (idx < 0) throw new Error('No clip_language_focus slide on this lesson');

  await backupLessonDoc(db, LESSON_ID, 'pre-language-focus-third-conditional');

  slides[idx] = {
    ...slides[idx],
    content: NEW_CONTENT,
    words: NEW_WORDS,
  };

  await ref.update({ slides });
  console.log(`\n✓ Updated language_focus at index ${idx}`);
  console.log(`  · ${NEW_CONTENT.split('\n').filter(l => l.startsWith('•')).length} patterns`);
  console.log(`  · ${NEW_WORDS.length} examples (2 hypothetical modals + 2 third-conditional)`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
