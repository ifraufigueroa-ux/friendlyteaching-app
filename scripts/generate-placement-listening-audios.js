// One-shot: generate the 6 placement Listening clips with ElevenLabs multi-
// voice, upload to Firebase Storage, and write the placementListeningAudios
// bindings so the runner picks them up next session.
//
// Usage:
//   ELEVEN_KEY=xxx node scripts/generate-placement-listening-audios.js <email or uid>

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';

const ELEVEN_KEY = process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_KEY) { console.error('Missing ELEVEN_KEY / ELEVENLABS_API_KEY.'); process.exit(1); }

const VOICES = {
  server:       'ThT5KcBeYPX3keUQqHPh',
  customer:     '21m00Tcm4TlvDq8ikWAM',
  tourist:      '21m00Tcm4TlvDq8ikWAM',
  local:        'yoZ06aMxZJJ28mfd3POQ',
  receptionist: 'ThT5KcBeYPX3keUQqHPh',
  patient:      '21m00Tcm4TlvDq8ikWAM',
  a:            'EXAVITQu4vr4xnSDxMaL',
  b:            'yoZ06aMxZJJ28mfd3POQ',
  anchor:       'ThT5KcBeYPX3keUQqHPh',
  reporter:     'yoZ06aMxZJJ28mfd3POQ',
  prof:         'ThT5KcBeYPX3keUQqHPh',
  default:      'EXAVITQu4vr4xnSDxMaL',
};

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
if (!arg) { console.error('Usage: node generate-placement-listening-audios.js <email or uid>'); process.exit(1); }

async function resolveUid(input) {
  if (input.includes('@')) {
    const snap = await db.collection('users').where('email', '==', input).limit(1).get();
    if (snap.empty) throw new Error(`No user with email ${input}`);
    return snap.docs[0].id;
  }
  return input;
}

function loadClips() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'placementListening.ts'), 'utf8');
  // Split into individual clip objects. We look for `id: '…'` markers.
  const clipBlocks = src.split(/\n\s*\{\s*\n\s*id:\s*'/).slice(1);
  const clips = [];
  for (const rawBlock of clipBlocks) {
    const block = "id: '" + rawBlock;
    const idMatch = block.match(/id:\s*'([^']+)'/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const speakersMatch = block.match(/speakers:\s*\[([\s\S]*?)\]/);
    if (!speakersMatch) continue;
    const speakers = [];
    for (const m of speakersMatch[1].matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) {
      speakers.push({ id: m[1], name: m[2] });
    }

    const scriptMatch = block.match(/script:\s*\[([\s\S]*?)\],\s*questions:/);
    if (!scriptMatch) continue;
    const script = [];
    const lineRe = /\{\s*speakerId:\s*'([^']+)',\s*text:\s*'((?:[^'\\]|\\.)*)'\s*\}/g;
    for (const m of scriptMatch[1].matchAll(lineRe)) {
      const text = m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
      script.push({ speakerId: m[1], text });
    }
    if (script.length === 0) throw new Error(`No script lines parsed for ${id}`);

    clips.push({ id, speakers, script });
  }
  return clips;
}

async function ttsLine(text, voiceId) {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key':  ELEVEN_KEY,
      'Content-Type': 'application/json',
      Accept:         'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id:       'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.7 },
    }),
  });
  if (!resp.ok) { const err = await resp.text(); throw new Error(`ElevenLabs ${resp.status}: ${err}`); }
  return Buffer.from(await resp.arrayBuffer());
}

async function ensureDownloadUrl(file) {
  const [meta] = await file.getMetadata();
  let token = meta.metadata?.firebaseStorageDownloadTokens;
  if (!token) {
    token = crypto.randomUUID();
    await file.setMetadata({ metadata: { ...(meta.metadata ?? {}), firebaseStorageDownloadTokens: token } });
  }
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
}

(async () => {
  const uid = await resolveUid(arg);
  console.log(`\n🎧 Generando audios de Placement Listening para teacherId=${uid}\n`);

  const clips = loadClips();
  for (const clip of clips) {
    console.log(`\n── ${clip.id} · ${clip.script.length} lines ──`);
    const parts = [];
    for (const [i, line] of clip.script.entries()) {
      const voiceId = VOICES[line.speakerId] || VOICES.default;
      process.stdout.write(`  [${i + 1}/${clip.script.length}] ${line.speakerId}… `);
      const buf = await ttsLine(line.text, voiceId);
      parts.push(buf);
      process.stdout.write(`${(buf.length / 1024).toFixed(0)} KB\n`);
    }
    const combined = Buffer.concat(parts);
    const storagePath = `audio/placement-listening-${clip.id}-${uid}-${Date.now()}.mp3`;
    const file = bucket.file(storagePath);
    await file.save(combined, { contentType: 'audio/mpeg' });
    const url = await ensureDownloadUrl(file);
    const key = `${uid}_${clip.id}`;
    await db.collection('placementListeningAudios').doc(key).set({
      teacherId:  uid,
      clipId:     clip.id,
      audioUrl:   url,
      storagePath,
      createdAt:  Timestamp.now(),
      updatedAt:  Timestamp.now(),
    });
    console.log(`  ✅ subido: ${storagePath}`);
  }

  console.log('\n🎉 Listo. Recargá el placement suite y los clips cargan solos.\n');
})();
