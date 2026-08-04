// FriendlyTeaching.cl — Find a text lesson by title/source substring.
// Usage: node scripts/find-text-lesson.js "camila"
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

initAdmin();
const db = getFirestore();

const q = (process.argv[2] || '').toLowerCase();
if (!q) { console.error('Usage: node scripts/find-text-lesson.js <substring>'); process.exit(1); }

(async () => {
  const snap = await db.collection('textLessons').get();
  const rows = [];
  snap.forEach(doc => {
    const d = doc.data();
    const t = (d.title || '').toLowerCase();
    const st = (d.text?.title || '').toLowerCase();
    const src = (d.text?.source || '').toLowerCase();
    if (t.includes(q) || st.includes(q) || src.includes(q)) {
      const vocab = d.slides?.find(s => s.type === 'vocab_match');
      rows.push({
        id: doc.id,
        title: d.text?.title || d.title,
        source: d.text?.source,
        level: d.level,
        vocabWords: vocab?.words?.map(w => w.word).join(', ') || '(no vocab_match)',
        slideCount: d.slides?.length ?? 0,
      });
    }
  });
  if (rows.length === 0) {
    console.log(`No text lessons match "${q}"`);
    process.exit(0);
  }
  rows.forEach(r => {
    console.log('─'.repeat(70));
    console.log(`id:     ${r.id}`);
    console.log(`title:  ${r.title}  [${r.level}]`);
    console.log(`source: ${r.source}`);
    console.log(`slides: ${r.slideCount}`);
    console.log(`vocab:  ${r.vocabWords}`);
  });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
