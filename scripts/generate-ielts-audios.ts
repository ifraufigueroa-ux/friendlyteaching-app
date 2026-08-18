// One-shot: genera los 4 audios de IELTS Listening Mock 1 con ElevenLabs,
// los sube a Firebase Storage, y escribe los bindings en ieltsListeningAudios
// para que la página de listening los tome cacheados.
//
// Usage:
//   npx tsx scripts/generate-ielts-audios.ts <email or uid> [mockId]
//     mockId: por default 'listening-mock-1'.
//
// Env:
//   ELEVEN_KEY / ELEVENLABS_API_KEY y FIREBASE_SERVICE_ACCOUNT_JSON.
//   Lee ambos desde .env.local como fallback (igual patrón que el script
//   de TOEFL).
//
// Skipea audios cuyo binding ya existe, así que se puede re-correr sin
// duplicar ni volver a pagar por audios ya generados.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listeningMock1 } from '@/lib/data/ielts/listeningMock1';
import type { ListeningSection } from '@/types/ielts';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const BUCKET       = 'friendly-scheduling.firebasestorage.app';
const DEFAULT_MODEL = 'eleven_multilingual_v2';

// ─── env loader (mismo patrón que TOEFL script) ─────────────────

function readEnvLocal(): Record<string, string> {
  const p = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return {};
  const src = fs.readFileSync(p, 'utf8');
  const out: Record<string, string> = {};
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

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || envLocal.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON no encontrado (env o .env.local)');
  const parsed = JSON.parse(raw);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()), storageBucket: BUCKET });
}
const db = getFirestore();
const bucket = getStorage().bucket();

// ─── args ───────────────────────────────────────────────────────

const arg = process.argv[2];
const mockId = process.argv[3] || listeningMock1.id;
if (!arg) {
  console.error('Usage: npx tsx scripts/generate-ielts-audios.ts <email or uid> [mockId]');
  process.exit(1);
}
if (mockId !== listeningMock1.id) {
  console.error(`❌ Sólo ${listeningMock1.id} está disponible por ahora.`);
  process.exit(1);
}

// ─── helpers ────────────────────────────────────────────────────

async function resolveUid(input: string): Promise<string> {
  if (input.includes('@')) {
    const snap = await db.collection('users').where('email', '==', input).limit(1).get();
    if (snap.empty) throw new Error(`No hay usuario con email ${input}`);
    return snap.docs[0].id;
  }
  return input;
}

async function ttsLine(text: string, voiceId: string): Promise<Buffer> {
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key':   ELEVEN_KEY,
      'Content-Type': 'application/json',
      Accept:         'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id:       DEFAULT_MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`ElevenLabs ${resp.status}: ${err.slice(0, 300)}`);
  }
  return Buffer.from(await resp.arrayBuffer());
}

async function ensureDownloadUrl(file: ReturnType<typeof bucket.file>): Promise<string> {
  const [meta] = await file.getMetadata();
  const rawMeta = (meta.metadata ?? {}) as Record<string, string>;
  let token = rawMeta.firebaseStorageDownloadTokens;
  if (!token) {
    token = crypto.randomUUID();
    await file.setMetadata({
      metadata: { ...rawMeta, firebaseStorageDownloadTokens: token },
    });
  }
  const encoded = encodeURIComponent(file.name);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encoded}?alt=media&token=${token}`;
}

// Prepend a short SSML break to lines 2+ so speaker switches don't feel
// rushed (mismo criterio que el endpoint /api/tts/elevenlabs-dialogue).
function segmentText(idx: number, text: string): string {
  return idx === 0 ? text : `<break time="0.4s"/> ${text}`;
}

// ─── main ───────────────────────────────────────────────────────

async function generateSection(uid: string, section: ListeningSection): Promise<{ generated: boolean; url: string }> {
  const bindingKey = `${uid}_${listeningMock1.id}_${section.number}`;
  const bindingRef = db.collection('ieltsListeningAudios').doc(bindingKey);

  const existing = await bindingRef.get();
  if (existing.exists && existing.get('audioUrl')) {
    return { generated: false, url: existing.get('audioUrl') as string };
  }

  const speakerMap = new Map(section.speakers.map(s => [s.id, s]));

  console.log(`\n── Section ${section.number} · ${section.title} · ${section.script.length} líneas ──`);
  const buffers: Buffer[] = [];
  let charsSent = 0;
  for (let i = 0; i < section.script.length; i++) {
    const line = section.script[i];
    const spk = speakerMap.get(line.speakerId);
    if (!spk) throw new Error(`Line ${i}: speaker ${line.speakerId} no está en section.speakers`);
    const voiceId = spk.suggestedVoice.voiceId;
    const text = segmentText(i, line.text);
    charsSent += text.length;
    process.stdout.write(`  [${i + 1}/${section.script.length}] ${spk.displayName} (${text.length} chars)… `);
    const buf = await ttsLine(text, voiceId);
    buffers.push(buf);
    process.stdout.write(`${(buf.length / 1024).toFixed(0)} KB\n`);
  }

  const combined = Buffer.concat(buffers);
  const storagePath = `audio/ielts-${section.number}-dialogue-${uid}-${Date.now()}.mp3`;
  const file = bucket.file(storagePath);
  await file.save(combined, { contentType: 'audio/mpeg' });
  const url = await ensureDownloadUrl(file);

  await bindingRef.set({
    teacherId:     uid,
    mockId:        listeningMock1.id,
    sectionNumber: section.number,
    audioUrl:      url,
    source:        'generated',
    createdAt:     Timestamp.now(),
    updatedAt:     Timestamp.now(),
  });

  console.log(`  ✅ subido: ${storagePath} (${(combined.length / 1024).toFixed(0)} KB · ${charsSent} chars)`);
  return { generated: true, url };
}

(async () => {
  const uid = await resolveUid(arg);
  console.log(`\n🎧 Generando IELTS Listening Mock 1 para teacherId=${uid}\n   4 secciones · voces por speaker según mock`);

  let generated = 0;
  let cached    = 0;
  for (const section of listeningMock1.sections) {
    try {
      const r = await generateSection(uid, section);
      if (r.generated) generated++;
      else {
        cached++;
        console.log(`  ⏭  Section ${section.number} — ya cacheada, skip`);
      }
    } catch (err) {
      console.error(`\n❌ Falló Section ${section.number}:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  console.log(`\n🎉 Listo. Generadas: ${generated} · Ya cacheadas: ${cached}\n`);
})().catch(err => {
  console.error('\n❌ Falló:', err);
  process.exit(1);
});
