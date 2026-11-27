// FriendlyTeaching.cl — bake a Friendlistenings audio from the server side.
//
// Mirrors the UI generate flow (/api/tts/elevenlabs-dialogue → upload to
// Firebase Storage → write friendlisteningsAudios/{lessonId}) so a lesson
// can be baked without the teacher having to click Generate in the UI.
//
// Usage:
//   ELEVEN_KEY=sk_... node scripts/bake-friendlistening-audio.js <lessonId> [--teacher <uid>]
//
// Reads lesson metadata from src/lib/data/friendlistenings/<lessonId>.ts
// by eval-ing the file in a trimmed Node sandbox (same trick as
// bake-ielts-lesson.js uses for the catalog).

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs   = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';
const ELEVEN_KEY = process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_KEY) { console.error('Missing ELEVEN_KEY / ELEVENLABS_API_KEY'); process.exit(1); }

function loadServiceAccount() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found');
  const raw = fs.readFileSync(envPath, 'utf8');
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

const MODEL_ID  = 'eleven_multilingual_v2';
const STABILITY = parseFloat(process.env.ELEVEN_STABILITY  ?? '0.5');
const SIMILARITY= parseFloat(process.env.ELEVEN_SIMILARITY ?? '0.75');

const args = process.argv.slice(2);
const LESSON_ID = args.find(a => !a.startsWith('--'));
const teacherIdx = args.indexOf('--teacher');
const TEACHER_ID = teacherIdx >= 0 ? args[teacherIdx + 1] : 'script-bake';
if (!LESSON_ID) { console.error('Usage: node scripts/bake-friendlistening-audio.js <lessonId>'); process.exit(1); }

const bucket = getStorage().bucket(BUCKET);
const db     = getFirestore();

// ── Parse the lesson file ────────────────────────────────────
function readLesson(id) {
  const file = path.join(__dirname, '..', 'src', 'lib', 'data', 'friendlistenings', `${id}.ts`);
  if (!fs.existsSync(file)) throw new Error(`Lesson file not found: ${file}`);
  const src = fs.readFileSync(file, 'utf8');
  // Grab speakers + script via regex rather than TS eval. Both are
  // declared as inline arrays of object literals, which Node parses
  // once the TS-only syntax ("import type", trailing "as const", etc.)
  // is stripped. We just need speakers[].{id,suggestedVoice.voiceId}
  // and script[].{speakerId,text}.
  const speakerRe = /{\s*id:\s*'([^']+)'[^}]*?suggestedVoice:\s*{\s*voiceId:\s*'([^']+)'/g;
  const speakers = {};
  for (const m of src.matchAll(speakerRe)) speakers[m[1]] = m[2];
  if (Object.keys(speakers).length === 0) throw new Error('No speakers found with suggestedVoice.voiceId');

  // Match script lines: { speakerId: '...', approxStartSec: N, text: '...' }
  // text can contain escaped quotes — use a simple state machine.
  const scriptStart = src.indexOf('script:');
  if (scriptStart < 0) throw new Error('script: block not found');
  const segs = [];
  const lineRe = /{\s*speakerId:\s*'([^']+)'[^}]*?text:\s*'((?:\\'|[^'])*)'\s*}/g;
  const slice = src.slice(scriptStart);
  for (const m of slice.matchAll(lineRe)) {
    segs.push({
      speakerId: m[1],
      voiceId:   speakers[m[1]],
      text:      m[2].replace(/\\'/g, "'"),
    });
  }
  if (segs.length === 0) throw new Error('No script lines parsed');
  const missingVoice = segs.find(s => !s.voiceId);
  if (missingVoice) throw new Error(`Speaker ${missingVoice.speakerId} has no voiceId`);
  return { speakers, segments: segs };
}

// ── ElevenLabs TTS per line ──────────────────────────────────
async function ttsOne(voiceId, text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method:  'POST',
    headers: {
      'xi-api-key':   ELEVEN_KEY,
      'Accept':       'audio/mpeg',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: STABILITY, similarity_boost: SIMILARITY },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// ── Main ─────────────────────────────────────────────────────
(async () => {
  console.log(`\n▶ Baking Friendlistenings audio for ${LESSON_ID}`);
  console.log(`  voice_settings: stability=${STABILITY} similarity=${SIMILARITY}`);
  const { segments } = readLesson(LESSON_ID);
  console.log(`  ${segments.length} lines · voices: ${[...new Set(segments.map(s => s.voiceId))].map(v => v.slice(0, 8) + '…').join(', ')}`);

  const buffers = [];
  const totalChars = segments.reduce((n, s) => n + s.text.length, 0);
  console.log(`  total chars: ${totalChars} (~${(totalChars / 220).toFixed(0)} s of speech)`);

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const text = i === 0 ? s.text : `<break time="0.4s"/> ${s.text}`;
    console.log(`    turn ${i + 1}/${segments.length} · ${s.speakerId} · ${s.text.length} chars`);
    buffers.push(await ttsOne(s.voiceId, text));
  }

  const combined = Buffer.concat(buffers);
  const storagePath = `audio/friendlistenings-${LESSON_ID}-${Date.now()}.mp3`;
  console.log(`\n  uploading to gs://${BUCKET}/${storagePath} (${(combined.length / 1024).toFixed(0)} KB)`);
  const file = bucket.file(storagePath);
  await file.save(combined, {
    contentType: 'audio/mpeg',
    metadata:    { cacheControl: 'public, max-age=31536000, immutable' },
  });
  await file.makePublic();
  const audioUrl = `https://storage.googleapis.com/${BUCKET}/${storagePath}`;

  console.log(`  writing binding friendlisteningsAudios/${LESSON_ID}`);
  await db.collection('friendlisteningsAudios').doc(LESSON_ID).set({
    lessonId:  LESSON_ID,
    audioUrl,
    source:    'generated',
    createdBy: TEACHER_ID,
    createdAt: FieldValue.serverTimestamp(),
    updatedBy: TEACHER_ID,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`\n✓ Done.`);
  console.log(`  audioUrl: ${audioUrl}`);
  process.exit(0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
