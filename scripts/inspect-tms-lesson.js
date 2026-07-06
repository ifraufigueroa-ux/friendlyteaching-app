// One-shot: dump the TMS movieLesson doc so we can plan which slides to add.
// Reads the service account from .env.local (FIREBASE_SERVICE_ACCOUNT_JSON).
const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envRaw = fs.readFileSync('.env.local', 'utf8');
const svcLine = envRaw.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
if (!svcLine) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local');
const svc = JSON.parse(svcLine.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length));
initializeApp({ credential: cert(svc) });
const db = getFirestore();

(async () => {
  const snap = await db.collection('movieLessons').get();
  const matches = [];
  snap.forEach(doc => {
    const d = doc.data();
    const title = (d.title || '').toLowerCase();
    const clipTitle = (d.clip?.title || '').toLowerCase();
    const q = (process.argv[2] || 'tms').toLowerCase();
    if (title.includes(q) || clipTitle.includes(q)) {
      matches.push({ id: doc.id, data: d });
    }
  });

  if (matches.length === 0) {
    console.log('No TMS lesson found. All movieLessons:');
    snap.forEach(doc => console.log(`  ${doc.id}: ${doc.data().title}`));
    process.exit(0);
  }

  matches.forEach(m => {
    console.log('═'.repeat(70));
    console.log(`id:    ${m.id}`);
    console.log(`title: ${m.data.title}  [${m.data.level || '?'}]`);
    console.log(`clip:  ${m.data.clip?.source || '?'} — ${m.data.clip?.title || '?'}`);
    console.log(`youtube: ${m.data.clip?.youtubeUrl || ''}`);
    console.log(`slides (${m.data.slides?.length || 0}):`);
    (m.data.slides || []).forEach((s, i) => {
      console.log(`  [${i}] type=${s.type}  title=${s.title || '(no title)'}`);
    });
  });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
