// Quick lookup: given an email, print the uid. Given a uid, print the
// user record. Used to reconcile ieltsPracticeSessions.teacherId with a
// currently-logged-in account.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
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

const auth = getAuth();
const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/check-teacher-uid.js <email|uid>');
  process.exit(1);
}

(async () => {
  let user;
  if (arg.includes('@')) {
    user = await auth.getUserByEmail(arg);
  } else {
    user = await auth.getUser(arg);
  }
  console.log('uid:          ', user.uid);
  console.log('email:        ', user.email);
  console.log('displayName:  ', user.displayName);
  console.log('providerData: ', user.providerData.map(p => p.providerId).join(', '));
})().catch((e) => { console.error(e.message); process.exit(1); });
