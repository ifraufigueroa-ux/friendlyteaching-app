// FriendlyTeaching.cl — Regenerate clip_controlled_practice with the new
// 8-item mix (1 MC + 2 unscramble + 2 verb_form + 1 match_halves +
// 1 error_correction + 1 open_ended). Also regenerate clip_comprehension
// to 6 questions, BUT only when the comprehension is algorithm-generated.
// Teacher-customized comprehension is left untouched.
//
// Fingerprint used to tell algorithm vs teacher apart:
//   · Algorithm-generated comprehension questions use option ids like
//     "c0", "c1", "c2", "c3" (see buildComprehensionSlide).
//   · Teacher-authored comprehension (built by TranscriptClipEditor)
//     uses ids like "q0o0", "q0o1", "q1o0", ...
// If ANY option id in a lesson's comprehension slide matches /^q\d+o\d+$/,
// the whole slide is considered teacher-authored and we skip it.
//
// Usage:
//   node scripts/regenerate-clip-practice-and-comprehension.js         # dry run
//   node scripts/regenerate-clip-practice-and-comprehension.js --apply # write

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const APPLY = process.argv.includes('--apply');

initAdmin();
const db = getFirestore();

// ─── FOCI mirror + focus resolution (same as previous script) ─────────

const FOCI = [
  { test: /\b(would|could|might|may)\b/i,        name: 'Modals of possibility',    short: 'modals' },
  { test: /\b(have|has)\s+(been|got|had|done|made|seen|gone|come)/i,
                                                 name: 'Present perfect',           short: 'present-perfect' },
  { test: /\bgoing to\b/i,                       name: 'Future with "going to"',    short: 'be-going-to' },
  { test: /\bif\b.+\b(would|will)\b/i,           name: 'Conditionals',              short: 'conditionals' },
  { test: /\b(was|were)\s+\w+ing\b/i,            name: 'Past continuous',           short: 'past-continuous' },
  { test: /\b(said|told|asked)\b.+\b(that|to)\b/i, name: 'Reported speech',         short: 'reported-speech' },
];
const DEFAULT_FOCUS = { name: 'Past simple', short: 'past-simple' };

function detectFocus(dialogue) {
  for (const f of FOCI) if (f.test.test(dialogue)) return { name: f.name, short: f.short };
  return DEFAULT_FOCUS;
}

function cleanGrammarName(raw) {
  if (!raw) return null;
  return raw
    .replace(/^\s*language\s*focus\s*:\s*/i, '')
    .replace(/^\s*language\s*awareness\s*[—-]\s*/i, '')
    .replace(/^\s*language\s*focus\s*[—-]\s*/i, '')
    .trim();
}

function guessShort(name) {
  if (!name) return 'past-simple';
  const s = name.toLowerCase();
  const known = FOCI.find(f => s.includes(f.name.toLowerCase()));
  if (known) return known.short;
  if (s.includes('past perfect'))    return 'past-perfect';
  if (s.includes('present perfect')) return 'present-perfect';
  if (s.includes('past continuous')) return 'past-continuous';
  if (s.includes('past simple'))     return 'past-simple';
  if (s.includes('conditional'))     return s.includes('second') ? 'second-conditional' : 'first-conditional';
  if (s.includes('reported'))        return 'reported-speech';
  if (s.includes('going to'))        return 'be-going-to';
  if (s.includes('future') || s.includes('will')) return 'future-forms';
  if (s.includes('modal'))           return 'modals';
  return 'past-simple';
}

function resolveFocus(languageFocusTitle, practiceSubtitle, dialogue) {
  const fromLang = cleanGrammarName(languageFocusTitle);
  if (fromLang && fromLang.length > 2) return { name: fromLang, short: guessShort(fromLang) };
  const fromSub = cleanGrammarName(practiceSubtitle);
  if (fromSub && fromSub.length > 2 && !fromSub.endsWith('.')) return { name: fromSub, short: guessShort(fromSub) };
  return detectFocus(dialogue);
}

// ─── Shared helpers ───────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Comprehension builder (6 questions) ──────────────────────────────

function buildComprehensionSlide(dialogue) {
  const rawLines = dialogue.split('\n').map(l => l.trim()).filter(Boolean);
  const lines = rawLines.filter(l => {
    const wc = l.split(/\s+/).length;
    return wc >= 4 && wc <= 22;
  });
  const usable = lines.length >= 4 ? lines : rawLines;
  if (usable.length < 2) return { type: 'clip_comprehension', title: 'Comprehension', phase: 'while', questions: [] };

  function makeQuestion(qText, correctLine, distractors) {
    const opts = shuffle([correctLine, ...distractors.slice(0, 3)]).map((t, i) => ({
      id: `c${i}`,
      text: t,
      isCorrect: t === correctLine,
    }));
    return { question: qText, options: opts, correctAnswer: correctLine };
  }

  const anchorAt = (frac) =>
    usable[Math.max(0, Math.min(usable.length - 1, Math.floor(usable.length * frac)))] ?? usable[0];

  const positions = [0.10, 0.25, 0.40, 0.55, 0.72, 0.88];
  const anchors = [];
  for (const p of positions) {
    const line = anchorAt(p);
    if (!anchors.includes(line)) anchors.push(line);
  }
  const used = new Set(anchors);
  const pool = shuffle(usable.filter(l => !used.has(l)));

  const prompts = [
    'Which line opens the scene?',
    'Which line comes just after the opening?',
    'Which line lands mid-scene?',
    'Which line hits the turning point?',
    'Which line comes near the end?',
    'Which line brings the scene to a close?',
  ];
  const questions = anchors
    .map((line, i) => makeQuestion(prompts[i] ?? 'Which line appears in the scene?', line, pool.slice(i * 3, i * 3 + 3)))
    .filter(q => q.options.length >= 2);

  return { type: 'clip_comprehension', title: 'Comprehension', phase: 'while', questions };
}

// ─── Fingerprint: teacher-authored comprehension? ─────────────────────

const TEACHER_ID_RE = /^q\d+o\d+$/;

function isTeacherAuthoredComprehension(slide) {
  if (!slide || !Array.isArray(slide.questions)) return false;
  for (const q of slide.questions) {
    if (!Array.isArray(q?.options)) continue;
    for (const opt of q.options) {
      if (opt?.id && TEACHER_ID_RE.test(opt.id)) return true;
    }
  }
  return false;
}

// ─── Practice builders (with new verb_form format + new mix) ──────────

function unscrambleFrom(l, focus) {
  const words = l.replace(/[.!?,]$/, '').split(/\s+/);
  return {
    type: 'unscramble',
    prompt: shuffle(words).join(' / '),
    answer: l,
    grammarTopic: focus.name,
    contextLine: l,
  };
}

function matchHalvesFrom(l, focus, pool) {
  const ws  = l.split(/\s+/);
  const h   = Math.max(2, Math.floor(ws.length / 2));
  const first  = ws.slice(0, h).join(' ');
  const second = ws.slice(h).join(' ');
  const distractors = shuffle(
    pool.filter(x => x !== l).slice(0, 6).map(x => {
      const xs = x.split(/\s+/);
      return xs.slice(Math.max(2, Math.floor(xs.length / 2))).join(' ');
    }),
  ).slice(0, 3);
  return {
    type: 'match_halves',
    prompt: first,
    answer: second,
    options: shuffle([second, ...distractors]).slice(0, 4),
    grammarTopic: focus.name,
    contextLine: l,
  };
}

function verbFormFrom(l, focus) {
  const words = l.split(/\s+/);
  const idx = words.findIndex(w => /(ed|ing|s)$/i.test(w) && w.length > 4);
  const target = (idx >= 0 ? words[idx] : words[Math.floor(words.length / 2)])
    .replace(/[.!?,]$/, '');
  const base = target.replace(/(ed|ing|s)$/i, '');
  return {
    type: 'verb_form',
    prompt: l.replace(target, `_____ (${base})`),
    answer: target,
    options: shuffle([target, base, base + 'ed', base + 'ing']).slice(0, 4),
    grammarTopic: focus.name,
    contextLine: l,
  };
}

function errorCorrectionFrom(l, focus) {
  const wrong = (() => {
    if (/\bwas\b/.test(l))  return l.replace(/\bwas\b/, 'were');
    if (/\bwere\b/.test(l)) return l.replace(/\bwere\b/, 'was');
    if (/\bhas\b/.test(l))  return l.replace(/\bhas\b/, 'have');
    if (/\bhave\b/.test(l)) return l.replace(/\bhave\b/, 'has');
    return l.replace(/\.$/, '') + ' yesterday.';
  })();
  return {
    type: 'error_correction',
    prompt: 'Correct the mistake:',
    wrongText: wrong,
    answer: l,
    grammarTopic: focus.name,
    contextLine: l,
  };
}

function multipleSelectionFrom(l, others, focus) {
  const distractors = shuffle(others).slice(0, 3);
  return {
    type: 'multiple_selection',
    prompt: `Which of these lines uses ${focus.name} correctly?`,
    answer: l,
    options: shuffle([l, ...distractors]),
    grammarTopic: focus.name,
    contextLine: l,
  };
}

function openEndedFrom(focus) {
  const stemByShort = {
    'modals':          'If I had more time, I might ',
    'past-simple':     'Yesterday I ',
    'past-continuous': 'While I was walking home, ',
    'present-perfect': 'I have ',
    'reported-speech': 'She said she ',
    'first-conditional':  'If it rains tomorrow, ',
    'second-conditional': 'If I were you, I would ',
    'future-forms':    'Next week I ',
  };
  return {
    type: 'open_ended',
    prompt: `Complete the sentence in your own words using ${focus.name}.`,
    answer: '',
    stem: stemByShort[focus.short] ?? 'Write your own sentence using this pattern: ',
    grammarTopic: focus.name,
  };
}

function buildControlledPracticeItems(dialogue, focus) {
  const lines = dialogue.split('\n').map(l => l.trim()).filter(Boolean);
  const shortLines = lines.filter(l => {
    const wc = l.split(/\s+/).length;
    return wc >= 5 && wc <= 14;
  });
  const anchors = shortLines.length >= 6 ? shortLines : lines;
  const pool = shuffle(anchors);

  const safety = [
    'She said she would call.',
    'They were watching the game.',
    'He has just left the office.',
    'I have seen her yesterday.',
    'We could meet next Friday.',
    'The kids were playing in the yard.',
    'Nobody knew what to say.',
    'I might come back later.',
  ];
  const line = (i) => pool[i] ?? safety[i % safety.length];

  return [
    multipleSelectionFrom(line(0), pool.filter(x => x !== line(0)), focus),
    unscrambleFrom(line(1), focus),
    verbFormFrom(line(2), focus),
    matchHalvesFrom(line(3), focus, pool),
    unscrambleFrom(line(4), focus),
    verbFormFrom(line(5), focus),
    errorCorrectionFrom(line(6), focus),
    openEndedFrom(focus),
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────

(async () => {
  const snap = await db.collection('movieLessons').get();
  console.log(`Scanning ${snap.size} movieLessons doc(s)…\n`);

  let practiceRegen = 0;
  let compRegen     = 0;
  let compSkipped   = 0;
  let compMissing   = 0;
  const rows = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const slides = Array.isArray(data.slides) ? [...data.slides] : [];
    const practiceIdx = slides.findIndex(s => s?.type === 'clip_controlled_practice');
    const compIdx     = slides.findIndex(s => s?.type === 'clip_comprehension');
    const dialogue    = data.clip?.dialogue;

    if (practiceIdx < 0 || !dialogue) continue;

    const langFocus = slides.find(s => s?.type === 'clip_language_focus');
    const focus = resolveFocus(langFocus?.title, slides[practiceIdx].subtitle, dialogue);

    const newItems = buildControlledPracticeItems(dialogue, focus);
    let action = { id: doc.id, title: data.title || '(untitled)', focus: focus.name,
                   practice: `${slides[practiceIdx].practiceItems?.length ?? 0} → 8`, comprehension: '—' };

    let touchComp = false;
    let newComp = null;
    if (compIdx < 0) {
      // No comprehension yet — safe to add the algorithmic one.
      touchComp   = true;
      newComp     = buildComprehensionSlide(dialogue);
      compMissing++;
      action.comprehension = `add 6`;
    } else if (isTeacherAuthoredComprehension(slides[compIdx])) {
      compSkipped++;
      action.comprehension = `SKIP (teacher-authored)`;
    } else {
      touchComp   = true;
      newComp     = buildComprehensionSlide(dialogue);
      const old = slides[compIdx].questions?.length ?? 0;
      action.comprehension = `${old} → ${newComp.questions.length}`;
    }

    rows.push(action);

    if (!APPLY) continue;

    await backupLessonDoc(db, doc.id, 'pre-regen-practice-and-comp');

    slides[practiceIdx] = {
      ...slides[practiceIdx],
      subtitle:      focus.name,
      practiceItems: newItems,
    };
    practiceRegen++;

    if (touchComp && newComp) {
      if (compIdx >= 0) {
        slides[compIdx] = newComp;
      } else {
        // Insert right after clip_dialogue_game (or predictions) if not present.
        const gameIdx = slides.findIndex(s => s?.type === 'clip_dialogue_game');
        const predIdx = slides.findIndex(s => s?.type === 'clip_predictions');
        const anchor = gameIdx >= 0 ? gameIdx : predIdx;
        const at = anchor >= 0 ? anchor + 1 : 4;
        slides.splice(at, 0, newComp);
      }
      compRegen++;
    }

    await doc.ref.update({ slides });
  }

  console.log('Plan:');
  for (const r of rows) {
    console.log(`• ${r.id} — "${r.title}"  focus="${r.focus}"`);
    console.log(`    practice: ${r.practice}`);
    console.log(`    comp:     ${r.comprehension}`);
  }

  console.log('\n──── Summary ────');
  console.log(`practice regenerated : ${APPLY ? practiceRegen : rows.length}`);
  console.log(`comp regenerated     : ${APPLY ? compRegen : rows.filter(r => !/SKIP/.test(r.comprehension)).length}`);
  console.log(`comp added (missing) : ${compMissing}`);
  console.log(`comp skipped (manual): ${compSkipped}`);
  if (!APPLY) console.log('\n(dry run — pass --apply to actually write)');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
