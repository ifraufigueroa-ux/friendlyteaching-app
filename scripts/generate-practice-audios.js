// FriendlyTeaching.cl — one-shot batch audio generator for Daily
// Practice listen-choose exercises.
//
// Walks the compiled general-english unit list, finds every
// listen-choose exercise that doesn't yet have an entry in Firestore
// `practiceAudios/{exerciseId}`, renders the `audioScript` to speech
// via ElevenLabs, uploads the MP3 to Firebase Storage under
// `audio/practice/{exerciseId}.mp3`, and writes the
// `practiceAudios` doc so the runner picks it up through
// usePracticeAudios(unitId).
//
// Usage:
//   ELEVEN_KEY=xxx node scripts/generate-practice-audios.js
//   ELEVEN_KEY=xxx node scripts/generate-practice-audios.js --unit a2-daily-routines
//   ELEVEN_KEY=xxx node scripts/generate-practice-audios.js --force    # regenerate every clip
//
// Honours ex.voiceId when present, otherwise uses a default voice per
// skill (listening units get a neutral US female). Short clips (<20s)
// to match the Daily Practice spirit — if a script is too long the
// script trims to 25 words with a warning.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';

const ELEVEN_KEY = process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_KEY) { console.error('Missing ELEVEN_KEY / ELEVENLABS_API_KEY.'); process.exit(1); }

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const unitFlagIdx = args.indexOf('--unit');
const ONLY_UNIT = unitFlagIdx >= 0 ? args[unitFlagIdx + 1] : null;

const DEFAULT_VOICE = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — warm, neutral US female
const MODEL_ID = 'eleven_multilingual_v2';

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

/** Plain-text parsing of the units file to pull out every listen-choose
 *  exercise without needing to compile TS. Keeps the dependency tree
 *  tiny and avoids ts-node setup. */
function parseUnits() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'data', 'practice', 'general-english.ts'),
    'utf8',
  );
  const units = [];
  // Rough but effective: split by top-level unit blocks. Each unit has
  // `id: '…'`, `level: '…'`, and `exercises: [ … ]`.
  const unitBlocks = src.split(/\n {2}\{\n {4}id:\s*'/).slice(1);
  for (const block of unitBlocks) {
    const idEnd = block.indexOf("'");
    const unitId = block.slice(0, idEnd);
    const levelMatch = /level:\s*'([^']+)'/.exec(block);
    const level = levelMatch ? levelMatch[1] : '?';
    const listenRegex = /\{\s*id:\s*'([^']+)'[^}]*type:\s*'listen-choose'[^}]*audioScript:\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = listenRegex.exec(block)) !== null) {
      const exerciseId  = m[1];
      const audioScript = m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
      const voiceMatch = /voiceId:\s*'([^']+)'/.exec(block.slice(m.index, m.index + 600));
      units.push({
        unitId, level, exerciseId, audioScript,
        voiceId: voiceMatch ? voiceMatch[1] : DEFAULT_VOICE,
      });
    }
  }
  return units;
}

function trimScript(script) {
  const words = script.split(/\s+/);
  if (words.length <= 25) return script;
  console.warn(`  ↳ script trimmed to 25 words (was ${words.length})`);
  return words.slice(0, 25).join(' ') + '…';
}

async function elevenTts(text, voiceId) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key':    ELEVEN_KEY,
      'Accept':        'audio/mpeg',
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToStorage(buf, storagePath) {
  const file = bucket.file(storagePath);
  await file.save(buf, {
    contentType: 'audio/mpeg',
    metadata: { cacheControl: 'public, max-age=31536000, immutable' },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

(async () => {
  const items = parseUnits().filter(it =>
    !ONLY_UNIT || it.unitId === ONLY_UNIT,
  );
  if (items.length === 0) {
    console.log(ONLY_UNIT ? `No listen-choose exercises in unit "${ONLY_UNIT}".` : 'No listen-choose exercises found.');
    process.exit(0);
  }

  console.log(`Found ${items.length} listen-choose exercise${items.length === 1 ? '' : 's'}.\n`);

  let skipped = 0;
  let generated = 0;
  let failed = 0;

  for (const it of items) {
    const ref = db.collection('practiceAudios').doc(it.exerciseId);
    const existing = await ref.get();
    if (existing.exists && !FORCE) {
      skipped += 1;
      console.log(`· skip   ${it.exerciseId} (already generated)`);
      continue;
    }
    try {
      console.log(`→ gen    ${it.exerciseId}  "${it.audioScript.slice(0, 50)}${it.audioScript.length > 50 ? '…' : ''}"`);
      const buf = await elevenTts(trimScript(it.audioScript), it.voiceId);
      const audioUrl = await uploadToStorage(buf, `audio/practice/${it.exerciseId}.mp3`);
      await ref.set({
        unitId:      it.unitId,
        level:       it.level,
        exerciseId:  it.exerciseId,
        audioUrl,
        audioScript: it.audioScript,
        voiceId:     it.voiceId,
        generatedAt: Timestamp.now(),
      });
      generated += 1;
      console.log(`  ok     ${audioUrl}`);
    } catch (err) {
      failed += 1;
      console.error(`  FAIL   ${it.exerciseId}:`, err.message);
    }
  }

  console.log(`\nDone. generated=${generated}  skipped=${skipped}  failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
})();
