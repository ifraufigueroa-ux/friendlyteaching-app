// One-shot: generate TOEFL Listening audios via ElevenLabs multi-voice,
// upload to Firebase Storage, and write the toeflListeningAudios bindings
// so the runner picks them up next session.
//
// Usage:
//   ELEVEN_KEY=xxx node scripts/generate-toefl-audios.js <email or uid> [mockId]
//
// Defaults: mockId = 'mock-1'.
//
// Needs FIREBASE_SERVICE_ACCOUNT_JSON in .env.local and ELEVEN_KEY in env.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';
const DEFAULT_MOCK = 'mock-1';

const ELEVEN_KEY = process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_KEY) {
  console.error('Missing ELEVEN_KEY / ELEVENLABS_API_KEY env var.');
  process.exit(1);
}

// Voice map — pick different pre-made ElevenLabs voices per speaker id.
// Feel free to change these to voices you prefer.
const VOICES = {
  prof:      'ThT5KcBeYPX3keUQqHPh',   // Dorothy (calm female)
  student:   '21m00Tcm4TlvDq8ikWAM',   // Rachel (young female)
  librarian: 'yoZ06aMxZJJ28mfd3POQ',   // Sam (warm male)
  default:   'EXAVITQu4vr4xnSDxMaL',   // Bella
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
const mockId = process.argv[3] || DEFAULT_MOCK;
if (!arg) {
  console.error('Usage: node generate-toefl-audios.js <email or uid> [mockId]');
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

// Requires that the TypeScript mock file has been converted to JSON — for
// simplicity we duplicate the minimal data here. If you edit the scripts,
// regenerate this manually.
async function loadMock() {
  // Import via require after transpiling. Simpler: read the TS source and
  // parse the export. But easiest for a one-off: hard-code by requiring the
  // built JS if we had one, or read the script arrays inline.
  //
  // Practical workaround: import via ts-node isn't set up here — we'll
  // require the compiled Next.js output isn't available at this point either.
  // So we ship a small helper that reads the .ts source and extracts the
  // script array using eval on the raw content.
  //
  // For a one-shot script this is acceptable. In production we'd move mock
  // data to plain .json files.
  const tsFiles = {
    lecture:      path.join(__dirname, '..', 'src', 'lib', 'data', 'toefl', 'listening', 'lecture-1.ts'),
    conversation: path.join(__dirname, '..', 'src', 'lib', 'data', 'toefl', 'listening', 'conversation-1.ts'),
  };
  const audios = [];
  for (const [key, file] of Object.entries(tsFiles)) {
    const src = fs.readFileSync(file, 'utf8');
    // Cheap parse: pull out the exported object literal. Requires that the
    // source shape stays close to what src/lib/data/toefl/listening/*.ts uses.
    const idMatch = src.match(/id:\s*'([^']+)'/);
    const speakersMatch = src.match(/speakers:\s*\[([\s\S]*?)\]/);
    const scriptMatch = src.match(/script:\s*\[([\s\S]*?)\],\s*questions:/);
    if (!idMatch || !speakersMatch || !scriptMatch) {
      throw new Error(`Could not parse ${file}`);
    }
    const id = idMatch[1];

    // Speakers
    const speakers = [];
    for (const m of speakersMatch[1].matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) {
      speakers.push({ id: m[1], name: m[2] });
    }

    // Script lines — captured as speakerId + text (text may contain single
    // quotes escaped via backticks in the source, so we prefer the backtick
    // form here).
    const script = [];
    const lineRe = /\{\s*speakerId:\s*'([^']+)',\s*text:\s*\n\s*`([\s\S]*?)`\s*\}/g;
    for (const m of scriptMatch[1].matchAll(lineRe)) {
      script.push({ speakerId: m[1], text: m[2].trim() });
    }
    if (script.length === 0) throw new Error(`No script lines parsed in ${file}`);

    audios.push({ id, speakers, script });
  }
  return audios;
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
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`ElevenLabs ${resp.status}: ${err}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

function pickVoice(speakerId) {
  return VOICES[speakerId] || VOICES.default;
}

async function ensureDownloadUrl(file) {
  const [meta] = await file.getMetadata();
  let token = meta.metadata?.firebaseStorageDownloadTokens;
  if (!token) {
    token = crypto.randomUUID();
    await file.setMetadata({ metadata: { ...(meta.metadata ?? {}), firebaseStorageDownloadTokens: token } });
  }
  const encoded = encodeURIComponent(file.name);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media&token=${token}`;
}

// Concatenate multiple MP3 buffers by simple binary concatenation. Works
// well enough for the browser <audio> element in most cases; more robust
// would run ffmpeg to normalise headers, but that's overkill for placement.
function concatMp3(buffers) {
  return Buffer.concat(buffers);
}

(async () => {
  const uid = await resolveUid(arg);
  console.log(`\n🎧 Generando audios TOEFL para teacherId=${uid} · mockId=${mockId}\n`);

  const audios = await loadMock();
  for (const audio of audios) {
    console.log(`\n── ${audio.id} · ${audio.script.length} lines ──`);
    const parts = [];
    for (const [i, line] of audio.script.entries()) {
      const voiceId = pickVoice(line.speakerId);
      process.stdout.write(`  [${i + 1}/${audio.script.length}] ${line.speakerId}… `);
      const buf = await ttsLine(line.text, voiceId);
      parts.push(buf);
      process.stdout.write(`${(buf.length / 1024).toFixed(0)} KB\n`);
    }
    const combined = concatMp3(parts);
    const storagePath = `audio/toefl-${audio.id}-${uid}-${Date.now()}.mp3`;
    const file = bucket.file(storagePath);
    await file.save(combined, { contentType: 'audio/mpeg' });
    const url = await ensureDownloadUrl(file);
    const key = `${uid}_${mockId}_${audio.id}`;
    await db.collection('toeflListeningAudios').doc(key).set({
      teacherId:  uid,
      mockId,
      audioId:    audio.id,
      audioUrl:   url,
      storagePath,
      createdAt:  Timestamp.now(),
      updatedAt:  Timestamp.now(),
    });
    console.log(`  ✅ subido: ${storagePath}`);
    console.log(`     ${url}`);
  }

  console.log('\n🎉 Listo. Recargá el runner y los audios cargan solos.\n');
})();
