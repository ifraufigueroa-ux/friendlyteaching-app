// One-shot: list every ieltsPracticeSessions doc, so we can figure out
// why a session (e.g. Guillermo's) isn't appearing in the teacher UI.
//
// Usage: node scripts/inspect-ielts-practice-sessions.js

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

function loadServiceAccount() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = raw.split(/\r?\n/).find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not in .env.local');
  const json = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g, '');
  const parsed = JSON.parse(json);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()) });
}

const db = getFirestore();

(async () => {
  const snap = await db.collection('ieltsPracticeSessions').get();
  console.log(`Total docs: ${snap.size}\n`);
  snap.docs.forEach((d) => {
    const data = d.data();
    const answered = Object.keys(data.answers ?? {}).filter((k) => {
      const v = data.answers[k];
      return Array.isArray(v) ? v.length > 0 : (typeof v === 'string' && v.trim().length > 0);
    }).length;
    const updated = data.updatedAt?.toDate?.().toISOString() ?? '?';
    const created = data.createdAt?.toDate?.().toISOString() ?? '?';
    console.log(`- id=${d.id}`);
    console.log(`  studentName: ${data.studentName}`);
    console.log(`  teacherId:   ${data.teacherId}`);
    console.log(`  mockId:      ${data.mockId}`);
    console.log(`  answered:    ${answered}/40  · currentSection=${data.currentSection} · activeQIndex=${data.activeQIndex}`);
    console.log(`  createdAt:   ${created}`);
    console.log(`  updatedAt:   ${updated}`);
    console.log('');
  });
})().catch((e) => { console.error(e); process.exit(1); });
