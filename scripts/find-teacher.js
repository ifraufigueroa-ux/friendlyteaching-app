// One-shot: find a teacher by name substring. Prints uid + email + fullName.
// Usage: node scripts/find-teacher.js "aranxa"
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY, 'utf8'))) });
const db = getFirestore();

const q = (process.argv[2] || '').toLowerCase();
if (!q) { console.error('Usage: node find-teacher.js <name-substring>'); process.exit(1); }

(async () => {
  const snap = await db.collection('users').where('role', '==', 'teacher').get();
  const hits = [];
  snap.forEach(doc => {
    const d = doc.data();
    const name = (d.fullName || '').toLowerCase();
    const email = (d.email || '').toLowerCase();
    if (name.includes(q) || email.includes(q)) {
      hits.push({ uid: doc.id, fullName: d.fullName, email: d.email });
    }
  });
  if (hits.length === 0) console.log('No teacher matched.');
  else console.log(JSON.stringify(hits, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
