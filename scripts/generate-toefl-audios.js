// One-shot: generate TOEFL Listening audios via ElevenLabs multi-voice,
// upload to Firebase Storage, and write the toeflListeningAudios bindings
// so the runner picks them up next session.
//
// Usage:
//   node scripts/generate-toefl-audios.js <email or uid> [mockId]
//     mockId: 'mock-1' | 'mock-2' | 'mock-3' | 'mock-4' | 'all'  (default: all)
//
// Reads FIREBASE_SERVICE_ACCOUNT_JSON and ELEVEN_KEY (o ELEVENLABS_API_KEY)
// desde .env.local si no están seteados en el ambiente.
//
// El script skipea cualquier binding que ya exista para (uid, mockId, audioId),
// así que se puede correr varias veces sin duplicar ni volver a llamar a
// ElevenLabs por audios ya generados.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';
const DEFAULT_MOCK = 'all';

// ─── env loader ──────────────────────────────────────────────────

// Lee KEYS puntuales desde .env.local sin usar dotenv. Sólo agarra lo que
// necesitamos para no arrastrar variables sensibles.
function readEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return {};
  const src = fs.readFileSync(p, 'utf8');
  const out = {};
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const envLocal = readEnvLocal();
const ELEVEN_KEY =
  process.env.ELEVEN_KEY ||
  process.env.ELEVENLABS_API_KEY ||
  envLocal.ELEVEN_KEY ||
  envLocal.ELEVENLABS_API_KEY ||
  '';

if (!ELEVEN_KEY) {
  console.error(
    '❌ Falta ELEVEN_KEY / ELEVENLABS_API_KEY.\n' +
    '   Poné una de las dos en .env.local o en el ambiente y volvé a correr.',
  );
  process.exit(1);
}

// ─── firebase admin ─────────────────────────────────────────────

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || envLocal.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no encontrado (ni en env ni en .env.local)');
  const parsed = JSON.parse(raw);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()), storageBucket: BUCKET });
}
const db = getFirestore();
const bucket = getStorage().bucket();

// ─── voice map ──────────────────────────────────────────────────

// Debe estar sincronizado con VOICES en src/app/api/toefl-audio/route.ts.
const VOICES = {
  prof:       'ThT5KcBeYPX3keUQqHPh',   // Dorothy (calm female)
  student:    '21m00Tcm4TlvDq8ikWAM',   // Rachel (young female)
  librarian:  'yoZ06aMxZJJ28mfd3POQ',   // Sam (warm male)
  advisor:    'yoZ06aMxZJJ28mfd3POQ',   // Sam — advisor
  tutor:      'ThT5KcBeYPX3keUQqHPh',   // Dorothy — writing-center tutor
  counsellor: 'yoZ06aMxZJJ28mfd3POQ',   // Sam — career counsellor
  default:    'EXAVITQu4vr4xnSDxMaL',   // Bella
};

function pickVoice(speakerId) {
  return VOICES[speakerId] || VOICES.default;
}

// ─── mock manifest ──────────────────────────────────────────────

// Mapeo explícito de mockId → listado de archivos .ts de listening.
// Si se agrega un mock nuevo, se agrega acá.
const MOCK_FILES = {
  'mock-1': [
    'listening/lecture-1.ts',
    'listening/conversation-1.ts',
  ],
  'mock-2': [
    'listening/lecture-2.ts',
    'listening/conversation-2.ts',
  ],
  'mock-3': [
    'listening/lecture-3.ts',
    'listening/conversation-3.ts',
  ],
  'mock-4': [
    'listening/lecture-4.ts',
    'listening/conversation-4.ts',
  ],
};

const DATA_ROOT = path.join(__dirname, '..', 'src', 'lib', 'data', 'toefl');

// Parser regex simple sobre los .ts. Funciona porque todos los archivos de
// listening siguen la misma forma (id + speakers + script). Si cambia el
// shape, tocar acá.
function parseListeningFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const idMatch = src.match(/id:\s*'([^']+)'/);
  const speakersMatch = src.match(/speakers:\s*\[([\s\S]*?)\]/);
  const scriptMatch = src.match(/script:\s*\[([\s\S]*?)\],\s*questions:/);
  if (!idMatch || !speakersMatch || !scriptMatch) {
    throw new Error(`No se pudo parsear ${filePath}`);
  }
  const id = idMatch[1];

  const speakers = [];
  for (const m of speakersMatch[1].matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) {
    speakers.push({ id: m[1], name: m[2] });
  }

  const script = [];
  const lineRe = /\{\s*speakerId:\s*'([^']+)',\s*text:\s*\n\s*`([\s\S]*?)`\s*\}/g;
  for (const m of scriptMatch[1].matchAll(lineRe)) {
    script.push({ speakerId: m[1], text: m[2].trim() });
  }
  if (script.length === 0) throw new Error(`Cero líneas parseadas en ${filePath}`);

  return { id, speakers, script };
}

function loadAudiosForMock(mockId) {
  const files = MOCK_FILES[mockId];
  if (!files) throw new Error(`Mock desconocido: ${mockId}`);
  return files.map(rel => parseListeningFile(path.join(DATA_ROOT, rel)));
}

// ─── args ───────────────────────────────────────────────────────

const arg = process.argv[2];
const mockArg = process.argv[3] || DEFAULT_MOCK;
if (!arg) {
  console.error('Usage: node generate-toefl-audios.js <email or uid> [mockId|all]');
  process.exit(1);
}
const mocksToRun = mockArg === 'all' ? Object.keys(MOCK_FILES) : [mockArg];
for (const mockId of mocksToRun) {
  if (!MOCK_FILES[mockId]) {
    console.error(`❌ Mock desconocido: ${mockId}. Opciones: ${Object.keys(MOCK_FILES).join(', ')}, all`);
    process.exit(1);
  }
}

// ─── helpers ────────────────────────────────────────────────────

async function resolveUid(input) {
  if (input.includes('@')) {
    const snap = await db.collection('users').where('email', '==', input).limit(1).get();
    if (snap.empty) throw new Error(`No hay usuario con email ${input}`);
    return snap.docs[0].id;
  }
  return input;
}

async function ttsLine(text, voiceId) {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key':   ELEVEN_KEY,
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
    throw new Error(`ElevenLabs ${resp.status}: ${err.slice(0, 300)}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

async function ensureDownloadUrl(file) {
  const [meta] = await file.getMetadata();
  let token = meta.metadata && meta.metadata.firebaseStorageDownloadTokens;
  if (!token) {
    token = crypto.randomUUID();
    await file.setMetadata({
      metadata: { ...(meta.metadata || {}), firebaseStorageDownloadTokens: token },
    });
  }
  const encoded = encodeURIComponent(file.name);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media&token=${token}`;
}

function concatMp3(buffers) {
  return Buffer.concat(buffers);
}

// ─── main ───────────────────────────────────────────────────────

(async () => {
  const uid = await resolveUid(arg);
  console.log(
    `\n🎧 Generando audios TOEFL para teacherId=${uid}\n   mocks: ${mocksToRun.join(', ')}\n`,
  );

  let generated = 0;
  let cached = 0;
  let charsSent = 0;

  for (const mockId of mocksToRun) {
    const audios = loadAudiosForMock(mockId);
    console.log(`\n═══ ${mockId} — ${audios.length} audios ═══`);

    for (const audio of audios) {
      const bindingKey = `${uid}_${mockId}_${audio.id}`;
      const bindingRef = db.collection('toeflListeningAudios').doc(bindingKey);
      const existing = await bindingRef.get();
      if (existing.exists && existing.get('audioUrl')) {
        console.log(`  ⏭  ${audio.id} — ya cacheado, skip`);
        cached++;
        continue;
      }

      console.log(`\n── ${audio.id} · ${audio.script.length} lines ──`);
      const parts = [];
      for (const [i, line] of audio.script.entries()) {
        const voiceId = pickVoice(line.speakerId);
        charsSent += line.text.length;
        process.stdout.write(`  [${i + 1}/${audio.script.length}] ${line.speakerId} (${line.text.length} chars)… `);
        const buf = await ttsLine(line.text, voiceId);
        parts.push(buf);
        process.stdout.write(`${(buf.length / 1024).toFixed(0)} KB\n`);
      }
      const combined = concatMp3(parts);
      const storagePath = `audio/toefl-${mockId}-${audio.id}-${uid}-${Date.now()}.mp3`;
      const file = bucket.file(storagePath);
      await file.save(combined, { contentType: 'audio/mpeg' });
      const url = await ensureDownloadUrl(file);
      await bindingRef.set({
        teacherId:  uid,
        mockId,
        audioId:    audio.id,
        audioUrl:   url,
        storagePath,
        createdAt:  Timestamp.now(),
        updatedAt:  Timestamp.now(),
      });
      generated++;
      console.log(`  ✅ ${audio.id} subido a ${storagePath}`);
    }
  }

  console.log(
    `\n🎉 Listo. Generados: ${generated} · Ya cacheados: ${cached} · ` +
    `Caracteres a ElevenLabs: ${charsSent.toLocaleString('es-CL')}\n`,
  );
})().catch(err => {
  console.error('\n❌ Falló:', err.message);
  process.exit(1);
});
