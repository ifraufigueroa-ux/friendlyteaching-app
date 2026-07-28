// One-shot recovery: for every ielts-listening MP3 in Firebase Storage
// belonging to the given teacher, pick the most recent audio per section,
// mint a permanent Firebase download token (same URL shape the client SDK
// produces), and write the ieltsListeningAudios binding doc so the runner
// picks it up next session.
//
// Usage:
//   node scripts/restore-ielts-audio-bindings.js <email or uid> [mockId]
//
// Defaults: mockId = 'listening-mock-1'

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';
const DEFAULT_MOCK = 'listening-mock-1';

function loadServiceAccount() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const line = raw.split(/\r?\n/).find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not in .env.local');
  const json = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g, '');
  const parsed = JSON.parse(json);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()), storageBucket: BUCKET });
}
const db = getFirestore();
const bucket = getStorage().bucket();

const arg = process.argv[2];
const mockId = process.argv[3] || DEFAULT_MOCK;
if (!arg) {
  console.error('Usage: node restore-ielts-audio-bindings.js <email or uid> [mockId]');
  process.exit(1);
}

async function resolveUid(input) {
  if (input.includes('@')) {
    const snap = await db.collection('users').where('email', '==', input).limit(1).get();
    if (snap.empty) throw new Error(`No user with email ${input}`);
    return snap.docs[0].id;
  }
  return input;
}

function parseFilename(name) {
  const stripped = name.replace(/^audio\//, '');
  let m = stripped.match(/^ielts-(\d+)-dialogue-([A-Za-z0-9]+)-(\d+)\.mp3$/);
  if (m) return { section: Number(m[1]), teacherId: m[2], ts: Number(m[3]), source: 'generated' };
  m = stripped.match(/^ielts-(\d+)-([A-Za-z0-9]+)-(\d+)\.[a-zA-Z0-9]+$/);
  if (m) return { section: Number(m[1]), teacherId: m[2], ts: Number(m[3]), source: 'uploaded' };
  return null;
}

/**
 * Firebase Storage's client SDK generates URLs like:
 *   https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?alt=media&token={uuid}
 * The token lives in the object's custom metadata under the key
 * `firebaseStorageDownloadTokens` (comma-separated allowed). Setting one
 * here matches what the client would have set on generate/upload, so the
 * URL becomes permanent (until the file is deleted or the token revoked).
 */
async function ensureDownloadUrl(file) {
  const [meta] = await file.getMetadata();
  let token = meta.metadata?.firebaseStorageDownloadTokens;
  if (!token) {
    token = crypto.randomUUID();
    await file.setMetadata({
      metadata: { ...(meta.metadata ?? {}), firebaseStorageDownloadTokens: token },
    });
  }
  const encoded = encodeURIComponent(file.name);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media&token=${token}`;
}

(async () => {
  const uid = await resolveUid(arg);
  console.log(`\n🔧 Restaurando bindings para teacherId=${uid} · mockId=${mockId}\n`);

  const [files] = await bucket.getFiles({ prefix: 'audio/ielts-' });
  const mine = [];
  for (const f of files) {
    const parsed = parseFilename(f.name);
    if (!parsed || parsed.teacherId !== uid) continue;
    mine.push({ ...parsed, file: f });
  }

  const bySection = {};
  for (const m of mine) (bySection[m.section] ??= []).push(m);

  let restored = 0;
  for (const section of [1, 2, 3, 4]) {
    const list = (bySection[section] ?? []).sort((a, b) => b.ts - a.ts);
    if (list.length === 0) {
      console.log(`Section ${section}: sin audios en storage`);
      continue;
    }
    const chosen = list[0];
    const url = await ensureDownloadUrl(chosen.file);
    const key = `${uid}_${mockId}_${section}`;
    await db.collection('ieltsListeningAudios').doc(key).set({
      teacherId:     uid,
      mockId,
      sectionNumber: section,
      audioUrl:      url,
      source:        chosen.source,
      createdAt:     Timestamp.fromMillis(chosen.ts),
      updatedAt:     Timestamp.now(),
    }, { merge: true });
    restored++;
    console.log(`✅ Section ${section} → ${chosen.file.name}`);
    console.log(`   ${url}\n`);
  }

  console.log(`\n🎉 ${restored}/4 bindings restaurados. Recargá el mock en el navegador.\n`);
})();
