// FriendlyTeaching.cl — Regenerate the clip_controlled_practice slide
// for every movieLessons doc using the new 8-item algorithm.
//
// Ports the essential FOCI / detectFocus / practice-builder logic from
// src/lib/utils/clipLessonGenerator.ts (JS mirror). Kept in sync with
// the TS version — if the algorithm changes there, this file must
// change with it.
//
// Skips comprehension. Never touches any other slide.
//
// Usage:
//   node scripts/regenerate-controlled-practice.js            # dry run
//   node scripts/regenerate-controlled-practice.js --apply    # write
//
// Snapshots each doc via backupLessonDoc() before writing.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const APPLY = process.argv.includes('--apply');

initAdmin();
const db = getFirestore();

// ─── FOCI (mirror of clipLessonGenerator.ts) ──────────────────────────

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

// Strip common prefixes off a language_focus title to get just the
// grammar name ("Language focus: Past perfect" → "Past perfect").
function cleanGrammarName(raw) {
  if (!raw) return null;
  return raw
    .replace(/^\s*language\s*focus\s*:\s*/i, '')
    .replace(/^\s*language\s*awareness\s*[—-]\s*/i, '')
    .replace(/^\s*language\s*focus\s*[—-]\s*/i, '')
    .trim();
}

// Pick a `short` id (used only for the open_ended stem template).
// If the grammar name matches one of the built-in FOCI, use its short;
// otherwise fall back based on keywords in the name.
function guessShort(name) {
  if (!name) return 'past-simple';
  const s = name.toLowerCase();
  const known = FOCI.find(f => s.includes(f.name.toLowerCase()));
  if (known) return known.short;
  if (s.includes('past perfect'))       return 'past-perfect';
  if (s.includes('present perfect'))    return 'present-perfect';
  if (s.includes('past continuous'))    return 'past-continuous';
  if (s.includes('past simple'))        return 'past-simple';
  if (s.includes('conditional'))        return s.includes('second') ? 'second-conditional' : 'first-conditional';
  if (s.includes('reported'))           return 'reported-speech';
  if (s.includes('going to'))           return 'be-going-to';
  if (s.includes('future') || s.includes('will')) return 'future-forms';
  if (s.includes('modal'))              return 'modals';
  return 'past-simple';
}

// Resolve the grammar focus we should DRILL, preserving the teacher's
// original naming when possible.
//   1. Prefer the language_focus.title (that's where the teacher named it).
//   2. Fall back to the current practice.subtitle if it looks like a name.
//   3. Fall back to detectFocus on the raw dialogue.
function resolveFocus(languageFocusTitle, practiceSubtitle, dialogue) {
  const fromLang = cleanGrammarName(languageFocusTitle);
  if (fromLang && fromLang.length > 2) {
    return { name: fromLang, short: guessShort(fromLang) };
  }
  const fromSub = cleanGrammarName(practiceSubtitle);
  if (fromSub && fromSub.length > 2 && !fromSub.endsWith('.')) {
    return { name: fromSub, short: guessShort(fromSub) };
  }
  return detectFocus(dialogue);
}

// ─── Helpers ──────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Practice builders (mirror of clipLessonGenerator.ts) ─────────────

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
    prompt: l.replace(target, '_____'),
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

// ─── Slide builder (mirror of buildControlledPractice) ────────────────

function buildControlledPractice(dialogue, focus) {
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
    unscrambleFrom(line(0), focus),
    matchHalvesFrom(line(1), focus, pool),
    verbFormFrom(line(2), focus),
    unscrambleFrom(line(3), focus),
    matchHalvesFrom(line(4), focus, pool),
    errorCorrectionFrom(line(5), focus),
    multipleSelectionFrom(line(6), pool.filter(x => x !== line(6)), focus),
    openEndedFrom(focus),
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────

(async () => {
  const snap = await db.collection('movieLessons').get();
  console.log(`Scanning ${snap.size} movieLessons doc(s)…\n`);

  let noPractice = 0;
  let noDialogue = 0;
  let migrated = 0;
  const skipped = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const slides = Array.isArray(data.slides) ? [...data.slides] : [];
    const idx = slides.findIndex(s => s?.type === 'clip_controlled_practice');
    if (idx < 0) { noPractice++; continue; }

    const dialogue = data.clip?.dialogue;
    if (!dialogue) { noDialogue++; skipped.push({ id: doc.id, reason: 'no dialogue' }); continue; }

    const existing = slides[idx];
    const currentItemCount = existing.practiceItems?.length ?? 0;
    const langFocus = slides.find(s => s?.type === 'clip_language_focus');
    const focus = resolveFocus(langFocus?.title, existing.subtitle, dialogue);
    const newItems = buildControlledPractice(dialogue, focus);

    const title = data.title || '(untitled)';
    console.log(`• ${doc.id} — "${title}"  focus="${focus.name}"  items: ${currentItemCount} → ${newItems.length}`);

    if (!APPLY) continue;

    await backupLessonDoc(db, doc.id, 'pre-regenerate-practice');
    slides[idx] = {
      ...existing,
      subtitle:      focus.name,
      practiceItems: newItems,
    };
    await doc.ref.update({ slides });
    migrated++;
  }

  console.log('\n──── Summary ────');
  console.log(`no clip_controlled_practice: ${noPractice}`);
  console.log(`no clip.dialogue           : ${noDialogue}`);
  console.log(`ready to migrate           : ${snap.size - noPractice - noDialogue}`);
  if (APPLY) console.log(`migrated                   : ${migrated}`);
  else       console.log(`\n(dry run — pass --apply to actually write)`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
