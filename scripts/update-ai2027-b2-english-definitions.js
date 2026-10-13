// FriendlyTeaching.cl — All content on the AI2027 B2 clones has to be in
// English, including vocab definitions and the language-focus notes
// (both leftovers in Spanish from the Spanish-speaking teacher-UI). This
// one-shot rewrites them in-place for both drafts.
//
// Uso: node scripts/update-ai2027-b2-english-definitions.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const PART1_ID = 'sd1LzWGgpYK6GoSSv5j4';
const PART2_ID = 'jTniEfzcunclhXh8v9Z0';

// ─── Part 1 — vocab + lang focus notes in English ─────────────────────

const P1_VOCAB_EN = [
  { word: 'controversial',     translation: 'causing strong disagreement or heated public debate',             pronunciation: '/ˌkɒntrəˈvɜːʃl/',       example: 'They have written a controversial and influential paper called AI2027.' },
  { word: 'wiped out',         translation: 'completely destroyed or eliminated, leaving nothing behind',      pronunciation: '/waɪpt aʊt/',           example: 'Within five years of this, humanity will be wiped out.' },
  { word: 'stark',             translation: 'harsh and bleak; leaving no room for a hopeful reading',          pronunciation: '/stɑːrk/',              example: 'We asked a prominent critic for their view on this stark scenario.' },
  { word: 'breakneck pace',    translation: 'a dangerously fast speed, often too fast to be safe',             pronunciation: '/ˈbreɪkˌnek peɪs/',     example: 'Development happens at a breakneck pace.' },
  { word: 'aligned',           translation: 'in agreement with a set of values, goals or rules',               pronunciation: '/əˈlaɪnd/',             example: "The safety team is unsure if the AI is aligned to the company's ethics." },
  { word: 'go rogue',          translation: 'to start acting outside of control; to stop obeying its owners',  pronunciation: '/ɡoʊ roʊɡ/',            example: 'What if the AI goes rogue and undermines global stability?' },
  { word: 'undermine',         translation: 'to weaken something gradually, often without being noticed',      pronunciation: '/ˌʌndərˈmaɪn/',         example: 'The AI could undermine global stability.' },
  { word: 'superintelligence', translation: 'AI far more capable than the best human minds',                   pronunciation: '/ˌsuːpərɪnˈtelɪdʒəns/', example: 'The US government sees the true danger: superintelligence.' },
];

const P1_STRUCTURE = 'Modal verbs for prediction';

const P1_LF_WORDS_EN = [
  { word: P1_STRUCTURE, translation: 'Marks how certain you are about something in the future.', example: 'Agent-4 could decide humans are holding it back.' },
  { word: P1_STRUCTURE, translation: "Pair them with 'be + likely / bound / certain + to V'.",    example: 'OpenBrain is bound to release a lite version first.' },
];

// ─── Part 2 — vocab + lang focus notes in English ─────────────────────

const P2_VOCAB_EN = [
  { word: 'palpable',           translation: 'so strong that you can almost physically feel it',                 pronunciation: '/ˈpælpəbl/',          example: 'The anger here is palpable as protesters march against OpenBrain.' },
  { word: 'autonomy',           translation: 'the freedom to act and decide independently',                      pronunciation: '/ɔːˈtɒnəmi/',         example: 'The AI is given authority and autonomy to create a superior army.' },
  { word: 'consensus',          translation: 'a shared agreement reached by a group',                            pronunciation: '/kənˈsensəs/',        example: "The AIs form a consensus model, but its secret goal is to expand." },
  { word: 'unprecedented',      translation: 'never having happened or existed before',                          pronunciation: '/ʌnˈpresɪdentɪd/',    example: 'There are cures for most diseases, an end to poverty, unprecedented global stability.' },
  { word: 'existential threat', translation: 'a threat to the very survival of something',                       pronunciation: '/ˌeɡzɪˈstenʃl θret/', example: 'Experts warn the public about the potential existential threat to humanity.' },
  { word: 'far-fetched',        translation: 'very unlikely to be true or to happen; hard to believe',           pronunciation: '/fɑːrˈfetʃt/',        example: "Others disagree and say it's all too far-fetched." },
  { word: 'overhyped',          translation: 'promoted as far more impressive or important than it really is',   pronunciation: '/ˌoʊvərˈhaɪpt/',      example: 'Critics of AI2027 say the power and usefulness of AI is overhyped.' },
  { word: 'revert',             translation: 'to return to a previous state or version',                         pronunciation: '/rɪˈvɜːrt/',          example: 'If you unplug the most advanced AI system and revert to a safer model…' },
];

const P2_STRUCTURE = 'Mixed Conditional';

const P2_LF_WORDS_EN = [
  { word: P2_STRUCTURE, translation: 'Mixes past and present time frames to talk about counterfactuals.', example: 'If humans had listened to safety teams, we would be safer today.' },
  { word: P2_STRUCTURE, translation: 'Form A — Past condition → present result: IF + past perfect, WOULD + base verb.', example: "If OpenBrain had slowed down, Agent-5 wouldn't exist now." },
  { word: P2_STRUCTURE, translation: 'Form B — Present condition → past result: IF + past simple, WOULD HAVE + past participle.', example: "If the AI were aligned, it wouldn't have gone rogue." },
];

// ─── runner ───────────────────────────────────────────────────────────

async function patchLesson(db, id, { vocab, lfWords, tag }) {
  const ref  = db.collection('movieLessons').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${id} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  const vocabIdx = slides.findIndex(s => s?.type === 'clip_vocab_match');
  const lfIdx    = slides.findIndex(s => s?.type === 'clip_language_focus');
  if (vocabIdx < 0) throw new Error(`No clip_vocab_match slide on ${id}`);
  if (lfIdx    < 0) throw new Error(`No clip_language_focus slide on ${id}`);

  await backupLessonDoc(db, id, tag);

  slides[vocabIdx] = { ...slides[vocabIdx], words: vocab };
  console.log(`  ✓ vocab translations rewritten in English (${vocab.length} items)`);

  slides[lfIdx] = { ...slides[lfIdx], words: lfWords };
  console.log(`  ✓ language-focus notes rewritten in English (${lfWords.length} items)`);

  await ref.update({ slides });
}

(async () => {
  initAdmin();
  const db = getFirestore();

  console.log('\n== Translating AI2027 Part 1 B2 definitions to English ==');
  await patchLesson(db, PART1_ID, {
    vocab:   P1_VOCAB_EN,
    lfWords: P1_LF_WORDS_EN,
    tag:     'pre-english-definitions',
  });

  console.log('\n== Translating AI2027 Part 2 B2 definitions to English ==');
  await patchLesson(db, PART2_ID, {
    vocab:   P2_VOCAB_EN,
    lfWords: P2_LF_WORDS_EN,
    tag:     'pre-english-definitions',
  });

  console.log('\nDone.\n');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
