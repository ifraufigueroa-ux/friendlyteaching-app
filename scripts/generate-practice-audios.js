// FriendlyTeaching.cl — one-shot batch audio generator for Daily
// Practice. Pre-generates every audio clip the runner might need so
// we never hit ElevenLabs at student runtime.
//
// Covers two exercise types:
//   · listen-choose   → renders `audioScript` to speech
//   · pronunciation   → renders `targetPhrase` as the reference clip
//
// For each exercise that doesn't yet have an entry in
// `practiceAudios/{exerciseId}`:
//   1. renders the text to MP3 via ElevenLabs
//   2. uploads it to Firebase Storage at
//        audio/practice/{exerciseId}.mp3           (listen-choose)
//        audio/practice/pronunciation/{exerciseId}.mp3 (pronunciation)
//   3. writes the `practiceAudios/{exerciseId}` doc so the runner
//      picks it up through usePracticeAudios(unitId).
//
// Usage:
//   ELEVEN_KEY=xxx node scripts/generate-practice-audios.js
//   ELEVEN_KEY=xxx node scripts/generate-practice-audios.js --unit a2-daily-routines
//   ELEVEN_KEY=xxx node scripts/generate-practice-audios.js --kind pronunciation
//   ELEVEN_KEY=xxx node scripts/generate-practice-audios.js --force    # regenerate every clip
//
// Honours ex.voiceId when present, otherwise uses a default voice.
// Short clips to match the Daily Practice spirit — if a script is too
// long the script trims to 25 words for listen-choose; pronunciation
// phrases are expected short by nature and never truncated.

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
const kindFlagIdx = args.indexOf('--kind');
const ONLY_KIND = kindFlagIdx >= 0 ? args[kindFlagIdx + 1] : null; // 'listen-choose' | 'pronunciation'

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

// ── Unit parsing ─────────────────────────────────────────────
//
// We walk every file under src/lib/data/practice/*.ts — not just
// general-english.ts — because the live export composes units from
// several waves. Plain-text regex keeps the dependency tree tiny.

function loadUnitSources() {
  const dir = path.join(__dirname, '..', 'src', 'lib', 'data', 'practice');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
  return files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n\n');
}

function unescape(str) {
  return str.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\\\/g, '\\');
}

function parseUnits() {
  const src = loadUnitSources();
  const units = [];
  const unitBlocks = src.split(/\n {2}\{\n {4}id:\s*'/).slice(1);
  for (const block of unitBlocks) {
    const idEnd = block.indexOf("'");
    const unitId = block.slice(0, idEnd);
    const levelMatch = /level:\s*'([^']+)'/.exec(block);
    const level = levelMatch ? levelMatch[1] : '?';

    // listen-choose
    const listenRegex = /\{\s*id:\s*'([^']+)'[^}]*type:\s*'listen-choose'[^}]*audioScript:\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = listenRegex.exec(block)) !== null) {
      const exerciseId  = m[1];
      const audioScript = unescape(m[2]);
      const voiceMatch = /voiceId:\s*'([^']+)'/.exec(block.slice(m.index, m.index + 600));
      units.push({
        kind:       'listen-choose',
        unitId, level, exerciseId,
        text:       audioScript,
        voiceId:    voiceMatch ? voiceMatch[1] : DEFAULT_VOICE,
      });
    }

    // pronunciation
    const pronRegex = /\{\s*id:\s*'([^']+)'[^}]*type:\s*'pronunciation'[^}]*targetPhrase:\s*'((?:[^'\\]|\\.)*)'/g;
    let p;
    while ((p = pronRegex.exec(block)) !== null) {
      const exerciseId   = p[1];
      const targetPhrase = unescape(p[2]);
      const voiceMatch = /voiceId:\s*'([^']+)'/.exec(block.slice(p.index, p.index + 600));
      units.push({
        kind:       'pronunciation',
        unitId, level, exerciseId,
        text:       targetPhrase,
        voiceId:    voiceMatch ? voiceMatch[1] : DEFAULT_VOICE,
      });
    }
  }
  return units;
}

function trimScript(script, max = 25) {
  const words = script.split(/\s+/);
  if (words.length <= max) return script;
  console.warn(`  ↳ script trimmed to ${max} words (was ${words.length})`);
  return words.slice(0, max).join(' ') + '…';
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

function storagePathFor(it) {
  return it.kind === 'pronunciation'
    ? `audio/practice/pronunciation/${it.exerciseId}.mp3`
    : `audio/practice/${it.exerciseId}.mp3`;
}

(async () => {
  let items = parseUnits();
  if (ONLY_UNIT) items = items.filter(it => it.unitId === ONLY_UNIT);
  if (ONLY_KIND) items = items.filter(it => it.kind === ONLY_KIND);

  if (items.length === 0) {
    console.log('No exercises matched the filters.');
    process.exit(0);
  }

  const listenCount = items.filter(i => i.kind === 'listen-choose').length;
  const pronCount   = items.filter(i => i.kind === 'pronunciation').length;
  console.log(`Found ${items.length} exercise${items.length === 1 ? '' : 's'}: ${listenCount} listen-choose, ${pronCount} pronunciation.\n`);

  let skipped = 0;
  let generated = 0;
  let failed = 0;

  for (const it of items) {
    const ref = db.collection('practiceAudios').doc(it.exerciseId);
    const existing = await ref.get();
    if (existing.exists && !FORCE) {
      skipped += 1;
      console.log(`· skip   [${it.kind}] ${it.exerciseId} (already generated)`);
      continue;
    }
    try {
      const preview = it.text.slice(0, 60) + (it.text.length > 60 ? '…' : '');
      console.log(`→ gen    [${it.kind}] ${it.exerciseId}  "${preview}"`);
      // Pronunciation phrases are short by design — don't trim.
      const text = it.kind === 'pronunciation' ? it.text : trimScript(it.text);
      const buf = await elevenTts(text, it.voiceId);
      const audioUrl = await uploadToStorage(buf, storagePathFor(it));
      await ref.set({
        kind:        it.kind,
        unitId:      it.unitId,
        level:       it.level,
        exerciseId:  it.exerciseId,
        audioUrl,
        text,
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
