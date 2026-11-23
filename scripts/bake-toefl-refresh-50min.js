// FriendlyTeaching.cl — bake audios for the TOEFL Review & Exam Drills HTML
//
// One-shot: takes the user's Gemini-generated HTML (two listening drills
// that would otherwise require a live ElevenLabs API key at runtime),
// pre-generates both MP3s, uploads to Firebase Storage, and emits an
// integrated HTML where students hear the audio instantly — no API
// key entry, no browser-TTS fallback.
//
//   Drill A — Advisor ↔ Student dialogue (Matilda + Adam, stitched)
//   Drill B — Professor mini-lecture (Brian, single voice)
//
// Usage:
//   node scripts/bake-toefl-refresh-50min.js
//
// Idempotent. Writes:
//   public/toefl-lessons/refresh-50min.html   (committed)
//   audio/toefl-lessons/refresh-50min/drill-{a,b}.mp3 on Firebase Storage

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';
const ELEVEN_KEY = process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_KEY) { console.error('Missing ELEVEN_KEY / ELEVENLABS_API_KEY.'); process.exit(1); }

const MODEL_ID = 'eleven_multilingual_v2';

// Voices chosen to avoid the IELTS-saturated pool per
// [[feedback-listening-names-voices]].
const VOICES = {
  advisor:   'XrExE9yKIg1WjnnlVkGX', // Matilda — warm female US
  student:   'pNInz6obpgDQGcFmaJgB', // Adam    — mature male US
  professor: 'nPczCjzI2devNBz1zQrb', // Brian   — deep lecturing male US
};

// ── Scripts (copied from the HTML verbatim, labels stripped) ──
//
// Drill A is a 3-turn dialogue; each turn is spoken by the matching
// voice and concatenated into one MP3. Drill B is a single-speaker
// mini-lecture.

const DRILL_A = [
  { role: 'advisor',   text: 'I see you are thinking of dropping Lab Section B because the eight a.m. start is rough.' },
  { role: 'student',   text: "Right — at first I thought switching to the online module would be way easier. Actually, now that I checked the lab schedule, the online version requires two proctored campus exams anyway, so I wouldn't even save the commute on test weeks." },
  { role: 'advisor',   text: 'Good catch. Plus, Section B has the equipment you need for your senior project — though if mornings really hurt your focus, ask Professor Lin if swapping into Thursday is open.' },
];

const DRILL_B_TEXT =
  'Many people picture coral reefs purely as colorful rock formations. ' +
  "In reality, reef-building corals depend on microscopic algae living inside their tissues. " +
  "Those algae provide most of the coral's energy through photosynthesis. " +
  'When water stays too warm for too long, stressed corals expel the algae — causing bleaching. ' +
  "Notice that bleached coral isn't dead right away, so if temperatures drop soon enough, recovery is still possible.";

// ── Firebase init ─────────────────────────────────────────────

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
const bucket = getStorage().bucket();

// ── TTS helpers ───────────────────────────────────────────────

async function ttsOne(voiceId, text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key':   ELEVEN_KEY,
      'Accept':       'audio/mpeg',
      'Content-Type': 'application/json',
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

// Multi-speaker dialogue: TTS each turn separately with its voice,
// then concat the MP3 buffers. MP3 frames are self-contained so a
// binary concat yields a valid playable file.
async function ttsDialogue(segments) {
  const buffers = [];
  for (const [i, s] of segments.entries()) {
    const voiceId = VOICES[s.role];
    if (!voiceId) throw new Error(`Unknown role: ${s.role}`);
    console.log(`  turn ${i + 1}/${segments.length} · ${s.role} (${voiceId.slice(0,8)}…) · ${s.text.length} chars`);
    buffers.push(await ttsOne(voiceId, s.text));
  }
  return Buffer.concat(buffers);
}

async function upload(buf, storagePath) {
  const file = bucket.file(storagePath);
  await file.save(buf, {
    contentType: 'audio/mpeg',
    metadata: { cacheControl: 'public, max-age=31536000, immutable' },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
}

// ── Inject prebaked URLs into the HTML ────────────────────────
//
// Strategy: prepend a PREBAKED_AUDIOS constant at the top of the
// main script, and short-circuit generateElevenLabsAudio() when a
// matching cacheKey hits. The existing play/stop/UI stays — the
// student now gets instant playback without typing an API key.

function injectIntoHtml(html, audioUrls) {
  // The script in the source names the audios 'drill-a' and 'drill-b'
  // via cacheKey. Anchor the injection just after the audioCache init.
  const anchor = 'const audioCache = {};';
  if (!html.includes(anchor)) {
    throw new Error(`Anchor "${anchor}" not found in HTML — did the Gemini template change?`);
  }
  const injection = `const audioCache = {};
const PREBAKED_AUDIOS = ${JSON.stringify(audioUrls, null, 2)};
`;
  let out = html.replace(anchor, injection);

  // Short-circuit the ElevenLabs fetch when the drill is prebaked.
  const fnSignature = 'async function generateElevenLabsAudio(cacheKey, spokenText) {';
  const shortCircuit = `${fnSignature}
  // Pre-baked override: if the batch script has uploaded an MP3 for
  // this cacheKey, use the Firebase Storage URL directly — no API
  // key, no browser-TTS fallback. Overrides anything else.
  if (PREBAKED_AUDIOS && PREBAKED_AUDIOS[cacheKey]) {
    return PREBAKED_AUDIOS[cacheKey];
  }
`;
  if (!out.includes(fnSignature)) {
    throw new Error(`Could not find generateElevenLabsAudio signature to patch.`);
  }
  out = out.replace(fnSignature, shortCircuit);

  // Flip the ready status copy so students don't get prompted for a key.
  out = out.replace(
    'Ready. Enter ElevenLabs key above for studio voice or play directly with browser TTS.',
    'Listo. Audios pre-cargados — toca ▶ para reproducir.',
  );

  // Also hide the API-key entry card. We keep it in DOM for teachers
  // who want to regenerate ad-hoc, but collapse it visually.
  out = out.replace(
    'class="el-config"',
    'class="el-config" hidden',
  );

  return out;
}

// ── Main ──────────────────────────────────────────────────────

(async () => {
  console.log('▶ Baking TOEFL Refresh 50-Min audios…\n');

  // Drill A — dialogue
  console.log('Drill A · Advisor ↔ Student dialogue');
  const bufA = await ttsDialogue(DRILL_A);
  const urlA = await upload(bufA, 'audio/toefl-lessons/refresh-50min/drill-a.mp3');
  console.log(`  ✓ ${urlA}  (${(bufA.length / 1024).toFixed(0)} KB)\n`);

  // Drill B — single voice professor
  console.log('Drill B · Professor mini-lecture (Brian)');
  console.log(`  1 turn · professor (${VOICES.professor.slice(0,8)}…) · ${DRILL_B_TEXT.length} chars`);
  const bufB = await ttsOne(VOICES.professor, DRILL_B_TEXT);
  const urlB = await upload(bufB, 'audio/toefl-lessons/refresh-50min/drill-b.mp3');
  console.log(`  ✓ ${urlB}  (${(bufB.length / 1024).toFixed(0)} KB)\n`);

  // Read the source HTML and inject the URLs.
  const srcPath = path.join('C:', 'Users', 'UsuarioPC', 'Downloads', 'gemini-code-1795468226677.html');
  const html = fs.readFileSync(srcPath, 'utf8');
  const integrated = injectIntoHtml(html, { 'drill-a': urlA, 'drill-b': urlB });

  const outDir  = path.join(__dirname, '..', 'public', 'toefl-lessons');
  const outPath = path.join(outDir, 'refresh-50min.html');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, integrated, 'utf8');
  console.log(`✓ Integrated HTML written to ${outPath}`);
  console.log(`  Will be live at https://friendlyteaching.cl/toefl-lessons/refresh-50min.html after deploy.`);
  process.exit(0);
})().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
