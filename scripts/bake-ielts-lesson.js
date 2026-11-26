// FriendlyTeaching.cl — IELTS lesson audio baker
//
// Same architecture as scripts/bake-toefl-lesson.js, pointed at the
// IELTS catalog + the /public/ielts-lessons folder. Reads a lesson's
// audios manifest (single-voice OR multi-voice dialogue stitched into
// one MP3), generates via ElevenLabs, uploads to Firebase Storage,
// and patches the HTML's PREBAKED_AUDIOS block.
//
// The HTML is expected to contain the block
//   const PREBAKED_AUDIOS = {};
// which the baker replaces with the generated URL map.
//
// Usage:
//   node scripts/bake-ielts-lesson.js <slug>
//   node scripts/bake-ielts-lesson.js --all
//   node scripts/bake-ielts-lesson.js <slug> --force

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

const BUCKET = 'friendly-scheduling.firebasestorage.app';
const ELEVEN_KEY = process.env.ELEVEN_KEY || process.env.ELEVENLABS_API_KEY;
if (!ELEVEN_KEY) { console.error('Missing ELEVEN_KEY / ELEVENLABS_API_KEY.'); process.exit(1); }

const MODEL_ID = 'eleven_multilingual_v2';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ALL   = args.includes('--all');
// `--audio <id>` restricts the run to a single audio inside a lesson.
// Without it, every audio in the lesson is (re)generated — which is what
// you want on a fresh bake but wastes credits + risks subtly changing
// voices the teacher already approved when you only need to fix one
// clip. With it, the baker uploads just that MP3 and merges its URL
// into the HTML's existing PREBAKED_AUDIOS map (the other URLs stay).
const audioFlagIdx = args.indexOf('--audio');
const AUDIO_ID     = audioFlagIdx >= 0 ? args[audioFlagIdx + 1] : null;
const SLUG  = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--audio');

// Voice settings are tunable via env for one-off re-bakes. Defaults
// mirror the original IELTS Introduction bake (stability 0.5,
// similarity 0.75). A slight bump (0.55 / 0.8) keeps the cadence
// steady and nudges away from the robotic-demo feel for the more
// expressive voices like Jessica.
const STABILITY  = parseFloat(process.env.ELEVEN_STABILITY  ?? '0.5');
const SIMILARITY = parseFloat(process.env.ELEVEN_SIMILARITY ?? '0.75');

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

// ── Catalog parse (plain-text eval of the TS file, strips `as const`) ──

function loadCatalog() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'data', 'ielts-lessons', 'catalog.ts'),
    'utf8',
  );
  const voicesStart  = src.indexOf('export const IELTS_LESSON_VOICES =');
  const lessonsStart = src.indexOf('export const IELTS_LESSONS');
  if (voicesStart < 0 || lessonsStart < 0) throw new Error('Catalog format changed — could not locate IELTS_LESSON_VOICES / IELTS_LESSONS exports.');

  const voicesBlock = src.slice(voicesStart, lessonsStart)
    .replace('export const IELTS_LESSON_VOICES =', 'const IELTS_LESSON_VOICES =')
    .replace(/\}\s*as const;/, '};');

  const lessonsBlock = src.slice(lessonsStart)
    .replace('export const IELTS_LESSONS: IeltsLesson[] =', 'const IELTS_LESSONS =');
  const lessonsEnd = lessonsBlock.indexOf('\n];');
  const lessonsDef = lessonsBlock.slice(0, lessonsEnd + 3);

  const ctx = { IELTS_LESSON_VOICES: undefined, IELTS_LESSONS: undefined };
  const fn = new Function('ctx', `
    ${voicesBlock}
    ${lessonsDef}
    ctx.IELTS_LESSON_VOICES = IELTS_LESSON_VOICES;
    ctx.IELTS_LESSONS = IELTS_LESSONS;
  `);
  fn(ctx);
  return { IELTS_LESSON_VOICES: ctx.IELTS_LESSON_VOICES, IELTS_LESSONS: ctx.IELTS_LESSONS };
}

// ── TTS ───────────────────────────────────────────────────────

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
      voice_settings: { stability: STABILITY, similarity_boost: SIMILARITY },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function ttsDialogue(turns, roleVoices) {
  const buffers = [];
  for (const [i, t] of turns.entries()) {
    const voice = roleVoices[t.role];
    if (!voice) throw new Error(`Dialogue turn ${i} has unknown role "${t.role}" (available: ${Object.keys(roleVoices).join(', ')})`);
    console.log(`    turn ${i + 1}/${turns.length} · ${t.role} (${voice.slice(0, 8)}…) · ${t.text.length} chars`);
    buffers.push(await ttsOne(voice, t.text));
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

// ── HTML inject ───────────────────────────────────────────────

/** Parse the current PREBAKED_AUDIOS block out of the HTML so a
 *  partial re-bake can merge instead of wiping. Returns an object
 *  (possibly empty) — never throws on a missing block. */
function readExistingUrls(html) {
  const regex = /const PREBAKED_AUDIOS = (\{[\s\S]*?\n\});/;
  const m = html.match(regex);
  if (!m) return {};
  try {
    // JSON.parse is strict about quoting; the baker only emits
    // double-quoted JSON so this always round-trips for its own output.
    return JSON.parse(m[1]);
  } catch {
    return {};
  }
}

function injectIntoHtml(html, audioUrls) {
  // The IELTS HTML declares `const PREBAKED_AUDIOS = {};` at the top of
  // the audio-engine comment block. We replace that single-line stub
  // with the real URL map. Idempotent: re-runs replace the existing block.
  // When only part of the lesson was baked (--audio <id>), merge with
  // whatever URLs the HTML already had so the other audios keep working.
  const merged = { ...readExistingUrls(html), ...audioUrls };
  const stubEmpty   = 'const PREBAKED_AUDIOS = {};';
  const injection   = `const PREBAKED_AUDIOS = ${JSON.stringify(merged, null, 2)};`;

  if (html.includes(stubEmpty)) {
    return html.replace(stubEmpty, injection);
  }
  // Already baked? Replace the existing populated block in-place.
  const regex = /const PREBAKED_AUDIOS = \{[\s\S]*?\n\};/;
  if (regex.test(html)) {
    return html.replace(regex, injection);
  }
  throw new Error('Could not find PREBAKED_AUDIOS block in HTML — baker and HTML templates are out of sync.');
}

// ── Bake one lesson ───────────────────────────────────────────

async function bakeOne(lesson) {
  const results = {};
  console.log(`\n▶ ${lesson.id} · ${lesson.title}`);
  if (!lesson.audios?.length) { console.log('  (no audios declared — skip)'); return results; }

  // Filter to a single audio when --audio <id> was passed.
  const audios = AUDIO_ID
    ? lesson.audios.filter(a => a.id === AUDIO_ID)
    : lesson.audios;
  if (audios.length === 0) {
    throw new Error(`No audio with id "${AUDIO_ID}" in lesson ${lesson.id}. Known: ${lesson.audios.map(a => a.id).join(', ')}`);
  }
  if (AUDIO_ID) {
    console.log(`  (--audio ${AUDIO_ID} · skipping ${lesson.audios.length - 1} other clips)`);
  }
  console.log(`  voice_settings: stability=${STABILITY} similarity_boost=${SIMILARITY}`);

  for (const audio of audios) {
    console.log(`  · ${audio.id} → ${audio.storagePath}`);
    let buf;
    if (audio.dialogue) {
      buf = await ttsDialogue(audio.dialogue, audio.roleVoices ?? {});
    } else if (audio.text && audio.voiceId) {
      console.log(`    1 turn · ${audio.voiceId.slice(0, 8)}… · ${audio.text.length} chars`);
      buf = await ttsOne(audio.voiceId, audio.text);
    } else {
      throw new Error(`Audio ${audio.id}: need either {dialogue, roleVoices} or {text, voiceId}`);
    }
    const url = await upload(buf, audio.storagePath);
    results[audio.id] = url;
    console.log(`    ✓ ${url}  (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  const htmlPath = path.join(__dirname, '..', 'public', lesson.publicPath.replace(/^\//, ''));
  if (!fs.existsSync(htmlPath)) {
    console.warn(`  ! HTML not found at ${htmlPath} — audios uploaded, skipping injection`);
    return results;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const integrated = injectIntoHtml(html, results);
  fs.writeFileSync(htmlPath, integrated, 'utf8');
  console.log(`  ✓ HTML updated at ${lesson.publicPath}`);
  return results;
}

// ── Main ──────────────────────────────────────────────────────

(async () => {
  if (!SLUG && !ALL) {
    console.error('Usage: node scripts/bake-ielts-lesson.js <slug> [--force]');
    console.error('       node scripts/bake-ielts-lesson.js --all');
    process.exit(1);
  }

  const { IELTS_LESSONS } = loadCatalog();
  const targets = ALL ? IELTS_LESSONS : IELTS_LESSONS.filter(l => l.id === SLUG);
  if (targets.length === 0) {
    console.error(`No lesson matched ${SLUG}. Known slugs: ${IELTS_LESSONS.map(l => l.id).join(', ')}`);
    process.exit(1);
  }

  if (!FORCE) {
    console.log('(uploads overwrite the Storage path anyway; HTML injection is idempotent)');
  }

  for (const lesson of targets) {
    try {
      await bakeOne(lesson);
    } catch (err) {
      console.error(`FAIL · ${lesson.id}:`, err.message);
      process.exit(1);
    }
  }
  console.log('\n✓ Done.');
  process.exit(0);
})();
