// FriendlyTeaching.cl — One-shot: append "uneasy" to the vocab_match slide
// of "The Last Bus to San Pedro" (textLessons/pWkEupdXGiRLXJnEfJuR).
//
// Uses the Free Dictionary API to fetch pronunciation + definition, so the
// entry lines up with the other 7 words. Backs up the whole textLesson doc
// to scripts/text-lesson-snapshots/ before writing.

const { getFirestore } = require('firebase-admin/firestore');
const fs   = require('fs');
const path = require('path');
const { initAdmin } = require('./_lessonBackup');

const LESSON_ID = 'pWkEupdXGiRLXJnEfJuR';
const NEW_WORD  = 'uneasy';

initAdmin();
const db = getFirestore();

async function lookup(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first) return null;
    const phonetic = first.phonetic
      ?? first.phonetics?.find(p => p.text)?.text
      ?? null;
    const definition = first.meanings?.[0]?.definitions?.[0]?.definition ?? null;
    const example    = first.meanings?.[0]?.definitions?.[0]?.example
      ?? first.meanings?.[0]?.definitions?.find(d => d.example)?.example
      ?? null;
    return { phonetic, definition, example };
  } catch { return null; }
}

(async () => {
  const ref = db.collection('textLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data = snap.data();

  const slides = Array.isArray(data.slides) ? [...data.slides] : [];
  const vocabIdx = slides.findIndex(s => s?.type === 'vocab_match');
  if (vocabIdx < 0) throw new Error('No vocab_match slide in this lesson');

  const words = Array.isArray(slides[vocabIdx].words) ? [...slides[vocabIdx].words] : [];
  if (words.some(w => (w.word || '').toLowerCase() === NEW_WORD)) {
    console.log(`"${NEW_WORD}" already in vocab_match — nothing to do.`);
    process.exit(0);
  }

  console.log(`Looking up "${NEW_WORD}"…`);
  const meta = await lookup(NEW_WORD);
  const entry = {
    word:          NEW_WORD,
    translation:   meta?.definition ?? 'nervous, worried, or unable to relax because something feels wrong',
    pronunciation: (meta?.phonetic || '/ʌnˈiːzi/').replace(/^\/|\/$/g, ''),
    example:       meta?.example    ?? 'She felt uneasy walking alone through the dark station.',
  };

  // Snapshot the whole doc so we can undo.
  const SNAP_ROOT = path.join(__dirname, 'text-lesson-snapshots', LESSON_ID);
  fs.mkdirSync(SNAP_ROOT, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapPath = path.join(SNAP_ROOT, `${stamp}--pre-add-uneasy.json`);
  fs.writeFileSync(snapPath, JSON.stringify({
    lessonId: LESSON_ID,
    capturedAt: new Date().toISOString(),
    note: 'pre-add-uneasy',
    data,
  }, null, 2));
  console.log(`✓ Snapshot: ${path.relative(process.cwd(), snapPath)}`);

  words.push(entry);
  slides[vocabIdx] = { ...slides[vocabIdx], words };
  await ref.update({ slides });

  console.log(`\n✓ Added "${NEW_WORD}" — vocab now has ${words.length} words:`);
  console.log(`  ${words.map(w => w.word).join(', ')}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
