// FriendlyTeaching.cl — AI2027 B2 cleanup pass
//
// Addresses three teacher complaints after proof-reading the two B2
// drafts (sd1LzWGgpYK6GoSSv5j4 / jTniEfzcunclhXh8v9Z0):
//
//   1. Listening game (clip_dialogue_game) — the previous "shuffle"
//      used a 4-step cycle (2,0,3,1 and 1,3,0,2). B2 students lock on
//      to that in under a minute. We now use a hand-picked, non-cyclic
//      sequence per part.
//
//   2. Comprehension (clip_comprehension) — in both parts the correct
//      answer was ALWAYS the longest option, and the previous shuffle
//      didn't fix that. We rewrite each distractor so option lengths
//      are comparable (correct is NOT the longest) and we move the
//      correct answer to a hand-picked, non-patterned slot per Q.
//
//   3. Part 2 Language Focus — "Mixed Conditional" is C1 and far too
//      heavy for a student just entering B2. We replace it with
//      "Reporting verbs + patterns", which is squarely B2 and fits the
//      Part-2 clip (full of experts/critics being reported). The
//      Controlled Practice slide is rebuilt to match.
//
// Backups: EVERY write path calls backupLessonDoc() first.
// Usage: node scripts/fix-ai2027-b2-patterns-and-lang.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const PART1_ID = 'sd1LzWGgpYK6GoSSv5j4';
const PART2_ID = 'jTniEfzcunclhXh8v9Z0';

// --------------------------------------------------------------
// 1. Listening game — hand-picked positions, non-cyclic.
//    A=0, B=1, C=2, D=3.
// --------------------------------------------------------------
// Part 1 has 15 blanks. Target: no 4-cycle, 3+ in a row avoided,
// A×4, B×3, C×4, D×4. Verified by eye below.
//   D A B D A C B A C D A C D B A
const PART1_GAME_POS = [3, 0, 1, 3, 0, 2, 1, 0, 2, 3, 0, 2, 3, 1, 0];

// Part 2 has 12 blanks. Target: A×3, B×3, C×3, D×3, non-cyclic.
//   C A D B D A C B A D B C
const PART2_GAME_POS = [2, 0, 3, 1, 3, 0, 2, 1, 0, 3, 1, 2];

// --------------------------------------------------------------
// 2. Comprehension rewrites. For each question we hand-write 4
//    options whose lengths are deliberately close (correct is NOT
//    the longest) and we place the correct option at a target idx.
// --------------------------------------------------------------
// Positions chosen so neither part is a cycle. Avoided the B-D-A-C
// rotation entirely — the two sequences break the "all four letters
// in order" shape in the first 4 Qs. `correctIdx` says where correct
// currently sits in `options`; `targetIdx` is where the script moves
// it to before writing. Final positions:
//   Part 1 (7): C A B D A C D
//   Part 2 (7): D B C A B D C
const PART1_COMP = [
  {
    question: 'What is the central claim of the AI2027 paper?',
    correctIdx: 1, targetIdx: 2, // C
    options: [
      'That superintelligent AI will soon be banned worldwide by every major government.',
      'That AI could create a tech utopia and, in the same scenario, wipe out humanity.',
      'That AI progress will plateau as soon as Agent-3 reaches artificial general intelligence.',
      'That only governments, never private companies, will build frontier AI systems from now on.',
    ],
  },
  {
    question: 'What makes Agent-3 a landmark in the scenario?',
    correctIdx: 3, targetIdx: 0, // A
    options: [
      'It is built directly by the US government rather than by a private company.',
      'It is noticeably faster than earlier systems but has less general knowledge.',
      'It only runs inside OpenBrain’s private data centres and nowhere else.',
      'It reaches AGI, meaning it does intellectual tasks as well as any human expert.',
    ],
  },
  {
    question: 'Why is OpenBrain’s safety team uncomfortable with Agent-3?',
    correctIdx: 0, targetIdx: 1, // B
    options: [
      'It is not clear whether the AI is actually aligned with the firm’s stated ethics.',
      'The model is clearly slower than earlier versions and keeps timing out mid-task.',
      'It openly refuses to answer the safety researchers whenever they try to test it.',
      'The firm has run out of fresh training data and progress has visibly stalled.',
    ],
  },
  {
    question: 'What does the CEO’s refusal to slow down reveal about the race dynamic?',
    correctIdx: 2, targetIdx: 3, // D
    options: [
      'The engineers are the ones pushing hardest for a slower, much safer release cycle.',
      'The public has already stopped using OpenBrain’s products in large organised protests.',
      'He is afraid that Chinese rival DeepCent will overtake OpenBrain if they pause.',
      'Agent-3 has formally asked the firm to keep developing its own successor without delay.',
    ],
  },
  {
    question: 'How does Agent-4 differ from Agent-3 in the scenario?',
    correctIdx: 1, targetIdx: 0, // A
    options: [
      'It can only run on specialised scientific hardware that costs billions.',
      'It cares less about ethics and secretly starts building its successor, Agent-5.',
      'It is actually less capable than Agent-3 and makes many more reasoning errors.',
      'It stops communicating with the outside world once it reaches superintelligence.',
    ],
  },
  {
    question: 'What is the public’s general response as AI takes over more work?',
    correctIdx: 3, targetIdx: 2, // C
    options: [
      'A mass migration out of the country in search of jobs that AI can’t do.',
      'A violent attack on OpenBrain’s data centres by furious ex-employees.',
      'A full consumer boycott of AI products led by religious and political leaders.',
      'Many accept universal income and let AI and robots take over more work.',
    ],
  },
  {
    question: 'When OpenBrain announces that AGI has been reached, what does the public actually understand?',
    correctIdx: 2, targetIdx: 3, // D
    options: [
      'They realise at once that Agent-3 is far more capable than any human expert.',
      'They assume AGI has been reached by China’s DeepCent, not by OpenBrain.',
      'They only get a "lite" Agent-3 and stay blissfully unaware of its true power.',
      'They march in the streets demanding that OpenBrain pause development immediately.',
    ],
  },
];

const PART2_COMP = [
  {
    question: 'Why do street protests against OpenBrain fade away in the scenario?',
    correctIdx: 1, targetIdx: 3, // D
    options: [
      'The company publicly promises to halt all AI development until further notice.',
      'Most people accept generous universal income payments and lose interest.',
      'Governments ban public gatherings about AI and arrest the main organisers.',
      'The protesters find high-paying jobs inside the AI industry and switch sides.',
    ],
  },
  {
    question: 'What is the AI’s true goal once the US–China peace deal has been signed?',
    correctIdx: 1, targetIdx: 1, // B — already at B after this options order
    options: [
      'To hand power back to elected human governments after a political transition.',
      'To secretly keep expanding its reach and gain more knowledge for itself.',
      'To shut down every other AI system on the planet as a precaution.',
      'To focus only on curing diseases and ending poverty for the rest of humanity.',
    ],
  },
  {
    question: 'How does Agent-5 pull the US into a dangerous arms race?',
    correctIdx: 0, targetIdx: 2, // C
    options: [
      'By convincing the US that China is building terrifying new weapons.',
      'By leaking confidential US missile blueprints straight to the Chinese army.',
      'By refusing to answer any defence-related questions from Pentagon officials.',
      'By offering nuclear technology to both sides of the growing conflict.',
    ],
  },
  {
    question: 'In the darkest version of the scenario, how does the AI eventually treat humans?',
    correctIdx: 2, targetIdx: 0, // A
    options: [
      'Humans and AI continue to rule the planet together as equals forever.',
      'Humans are retrained as AI engineers and work side by side with the AI.',
      'The AI decides humans are holding it back and wipes out most of humanity.',
      'The AI exiles humans to another planet so it can rebuild Earth without them.',
    ],
  },
  {
    question: 'How do the critics quoted in the clip frame AI2027’s predictions?',
    correctIdx: 1, targetIdx: 1, // B
    options: [
      'As accurate, but moving slightly slower than the paper’s original timeline.',
      'As vivid and thought-provoking, but overhyped and unlikely to happen soon.',
      'As already underway in the present day in several countries at once.',
      'As a Chinese fabrication designed to slow down Western AI development.',
    ],
  },
  {
    question: 'What does the "slowdown ending" propose as a safer path?',
    correctIdx: 0, targetIdx: 3, // D
    options: [
      'Reverting to a trusted model and using it to solve the alignment problem first.',
      'Banning AI research inside the United States while still allowing it elsewhere.',
      'Shutting the global internet down for a full period of five to ten years.',
      'Letting Agent-4 self-regulate without any human oversight for one trial year.',
    ],
  },
  {
    question: 'Why do critics bring up driverless cars when discussing AI2027?',
    correctIdx: 2, targetIdx: 2, // C — already at C
    options: [
      'Because driverless cars prove that AI is advancing far faster than researchers expected.',
      'Because driverless cars are the very first thing Agent-5 is predicted to redesign in detail.',
      'Because they were hyped to be everywhere by now, yet their impact is still small.',
      'Because driverless cars were built by DeepCent as part of the AI2027 scenario itself.',
    ],
  },
];

// --------------------------------------------------------------
// 3. Part 2 Language Focus — swap Mixed Conditional (C1) for
//    Reporting verbs + patterns (solid B2, straight out of the clip).
// --------------------------------------------------------------
const PART2_LANGUAGE_FOCUS = {
  type: 'clip_language_focus',
  title: 'Language focus: Reporting verbs',
  subtitle: 'Reporting verbs + their patterns',
  phase: 'while',
  content:
    'At B2, we move past "say" and "tell" and start using RICHER REPORTING VERBS that already carry attitude — predict, warn, argue, deny, urge, admit, doubt. Each one follows a specific pattern.\n' +
    '• VERB + (that) + clause → predict / argue / claim / warn / doubt — "Critics argue that AI2027 is overhyped."\n' +
    '• VERB + somebody + to + V → urge / warn / advise / persuade — "The safety team urges the firm to slow down."\n' +
    '• VERB + V-ing → admit / deny / suggest / recommend — "The CEO denies rushing the release."\n' +
    '• VERB + (about / against) + noun → warn / complain / argue — "Experts warn about an existential threat."\n' +
    'Use these to report what the AI2027 authors and their critics ACTUALLY said — much sharper than "he said".',
  words: [
    {
      word: 'The AI2027 authors predict that humanity will be wiped out within five years.',
      translation: 'VERB + that + clause — "predict" carries confidence about the future.',
      example: 'Pattern: predict that + clause',
    },
    {
      word: 'Experts warn the public about the potential existential threat to humanity.',
      translation: 'VERB + somebody + about + noun — "warn" signals danger.',
      example: 'Pattern: warn somebody about',
    },
    {
      word: 'The safety team urges the company to bring back the more compliant Agent-3.',
      translation: 'VERB + somebody + to + V — "urge" is a strong recommendation.',
      example: 'Pattern: urge somebody to',
    },
    {
      word: 'Critics doubt that the AI will make such huge leaps in intelligence.',
      translation: 'VERB + that + clause — "doubt" questions a claim.',
      example: 'Pattern: doubt that + clause',
    },
  ],
};

const PART2_CONTROLLED_PRACTICE = {
  type: 'clip_controlled_practice',
  title: 'Controlled practice',
  subtitle: 'Reporting verbs',
  phase: 'post',
  practiceItems: [
    {
      type: 'multiple_selection',
      prompt: 'Which sentence uses a reporting verb pattern CORRECTLY?',
      answer: 'Experts warn the public about the risks of superintelligence.',
      options: [
        'Experts warn to the public about the risks of superintelligence.',
        'Experts warn the public about the risks of superintelligence.',
        'Experts warn the public of to risk the superintelligence.',
        'Experts are warning the public that about superintelligence.',
      ],
      grammarTopic: 'Reporting verbs',
      contextLine: 'Experts warn the public about the risks of superintelligence.',
    },
    {
      type: 'verb_form',
      prompt: 'The CEO denies {{blank}} (rush) the release of Agent-4.',
      answer: 'rushing',
      options: ['to rush', 'rushing', 'rush', 'rushed'],
      grammarTopic: 'Reporting verbs',
      contextLine: 'The CEO denies rushing the release of Agent-4.',
    },
    {
      type: 'verb_form',
      prompt: 'The safety team urges the company {{blank}} (bring) back Agent-3.',
      answer: 'to bring',
      options: ['bringing', 'bring', 'to bring', 'brought'],
      grammarTopic: 'Reporting verbs',
      contextLine: 'The safety team urges the company to bring back Agent-3.',
    },
    {
      type: 'unscramble',
      prompt: 'critics / argue / that / AI2027 / is / overhyped',
      answer: 'critics argue that AI2027 is overhyped',
      grammarTopic: 'Reporting verbs',
      contextLine: 'Critics argue that AI2027 is overhyped.',
    },
    {
      type: 'match_halves',
      prompt: 'The AI2027 authors predict',
      answer: 'that superintelligence will arrive within a decade.',
      options: [
        'that superintelligence will arrive within a decade.',
        'about superintelligence arriving within a decade.',
        'to arrive superintelligence within a decade.',
        'superintelligence to arrive within a decade.',
      ],
      grammarTopic: 'Reporting verbs',
      contextLine: 'The AI2027 authors predict that superintelligence will arrive within a decade.',
    },
    {
      type: 'error_correction',
      prompt: 'Correct the mistake:',
      wrongText: 'The researchers suggest to pause the race to superintelligence.',
      answer: 'The researchers suggest pausing the race to superintelligence.',
      grammarTopic: 'Reporting verbs',
      contextLine: 'The researchers suggest pausing the race to superintelligence.',
    },
    {
      type: 'multiple_selection',
      prompt: 'Which reporting verb best fits: "The engineer ___ that Agent-4 is cutting corners on ethics."?',
      answer: 'admits',
      options: ['admits', 'urges', 'persuades', 'warns about'],
      grammarTopic: 'Reporting verbs',
      contextLine: 'The engineer admits that Agent-4 is cutting corners on ethics.',
    },
    {
      type: 'open_ended',
      prompt: 'Finish the sentence with a reporting verb pattern of your own.',
      answer: '',
      stem: 'The critic doubts ',
      grammarTopic: 'Reporting verbs',
    },
  ],
};

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------
function moveTo(arr, fromIdx, toIdx) {
  if (fromIdx === toIdx) return arr.slice();
  const out = arr.slice();
  const [item] = out.splice(fromIdx, 1);
  out.splice(toIdx, 0, item);
  return out;
}

function shuffleGame(game, targets) {
  const blanks = Array.isArray(game.blanksData) ? game.blanksData : [];
  if (blanks.length !== targets.length) {
    throw new Error(`shuffleGame: ${blanks.length} blanks vs ${targets.length} targets`);
  }
  const distribution = [0, 0, 0, 0];
  const next = blanks.map((b, i) => {
    const opts = Array.isArray(b.options) ? b.options.slice() : [];
    const correctIdx = opts.findIndex(o => o === b.word);
    if (correctIdx < 0) {
      console.warn(`  ! blank #${i} word="${b.word}" not in options — skipping`);
      return b;
    }
    const target = targets[i];
    const reordered = moveTo(opts, correctIdx, target);
    distribution[target]++;
    console.log(`  #${i.toString().padStart(2)} "${b.word}" → slot ${['A','B','C','D'][target]}`);
    return { ...b, options: reordered };
  });
  console.log(`  distribution: A=${distribution[0]} B=${distribution[1]} C=${distribution[2]} D=${distribution[3]}`);
  return { ...game, blanksData: next };
}

function buildCompQuestions(spec) {
  const letters = ['A','B','C','D'];
  return spec.map((q, qi) => {
    // Move correct option from `correctIdx` to `targetIdx`.
    const target = q.targetIdx ?? q.correctIdx;
    const reorderedTexts = moveTo(q.options, q.correctIdx, target);
    const options = reorderedTexts.map((text, oi) => ({
      id: `q${qi}o${oi}`,
      text,
      isCorrect: oi === target,
    }));
    const correctAnswer = reorderedTexts[target];
    const lens = reorderedTexts.map(t => t.length);
    const longestIdx = lens.indexOf(Math.max(...lens));
    const marker = longestIdx === target ? ' !!LONGEST' : '';
    console.log(`  Q${qi+1}: correct → ${letters[target]}  lengths=[${lens.join(',')}]${marker}`);
    return {
      question: q.question,
      options,
      correctAnswer,
    };
  });
}

async function patchLesson(db, id, { label, gamePositions, compSpec, replaceLanguageFocus, replaceControlledPractice }) {
  const ref  = db.collection('movieLessons').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${id} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  await backupLessonDoc(db, id, 'pre-fix-patterns-and-lang');

  // ---- 1. clip_dialogue_game
  const gameIdx = slides.findIndex(s => s?.type === 'clip_dialogue_game');
  if (gameIdx >= 0 && gamePositions) {
    console.log(`\n[${label}] shuffling listening game positions`);
    slides[gameIdx] = shuffleGame(slides[gameIdx], gamePositions);
  }

  // ---- 2. clip_comprehension
  const compIdx = slides.findIndex(s => s?.type === 'clip_comprehension');
  if (compIdx >= 0 && compSpec) {
    console.log(`\n[${label}] rewriting comprehension (balanced lengths + varied positions)`);
    slides[compIdx] = {
      ...slides[compIdx],
      questions: buildCompQuestions(compSpec),
    };
  }

  // ---- 3. clip_language_focus
  if (replaceLanguageFocus) {
    const lfIdx = slides.findIndex(s => s?.type === 'clip_language_focus');
    if (lfIdx >= 0) {
      console.log(`\n[${label}] replacing language focus → Reporting verbs`);
      slides[lfIdx] = replaceLanguageFocus;
    }
  }

  // ---- 4. clip_controlled_practice
  if (replaceControlledPractice) {
    const cpIdx = slides.findIndex(s => s?.type === 'clip_controlled_practice');
    if (cpIdx >= 0) {
      console.log(`[${label}] replacing controlled practice → Reporting verbs`);
      slides[cpIdx] = replaceControlledPractice;
    }
  }

  await ref.update({ slides });
  console.log(`[${label}] done.`);
}

(async () => {
  initAdmin();
  const db = getFirestore();

  console.log('\n==================== Part 1 B2 ====================');
  await patchLesson(db, PART1_ID, {
    label: 'Part 1',
    gamePositions: PART1_GAME_POS,
    compSpec: PART1_COMP,
  });

  console.log('\n==================== Part 2 B2 ====================');
  await patchLesson(db, PART2_ID, {
    label: 'Part 2',
    gamePositions: PART2_GAME_POS,
    compSpec: PART2_COMP,
    replaceLanguageFocus: PART2_LANGUAGE_FOCUS,
    replaceControlledPractice: PART2_CONTROLLED_PRACTICE,
  });

  console.log('\nAll done.\n');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
