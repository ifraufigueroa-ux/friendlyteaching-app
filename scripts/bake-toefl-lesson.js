// FriendlyTeaching.cl — generic TOEFL lesson audio baker
//
// Reads the catalog in src/lib/data/toefl-lessons/catalog.ts (plain
// regex, no ts-node), finds the lesson by slug, generates each
// audio clip via ElevenLabs (single-voice or multi-voice dialogue
// stitched into one MP3 server-side), uploads to Firebase Storage,
// and patches the public HTML to short-circuit the runtime
// generateElevenLabsAudio() lookup with the hosted URL.
//
// Usage:
//   node scripts/bake-toefl-lesson.js <slug>
//   node scripts/bake-toefl-lesson.js --all             # bake every lesson
//   node scripts/bake-toefl-lesson.js <slug> --force    # overwrite existing MP3s
//
// Idempotent: Storage uploads overwrite the same path; HTML injection
// is re-runnable (replaces the anchor each time).

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
const SLUG  = args.find(a => !a.startsWith('--'));

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

// ── Catalog parse ─────────────────────────────────────────────
//
// Load the compiled catalog via ts-stripping regex. The code tree
// is small and stable; this keeps us off of ts-node.

function loadCatalog() {
  // The catalog.ts has `export const TOEFL_LESSONS: ToeflLesson[] = [ ... ];`
  // We eval the body in a sandbox after stripping TS types. Good enough for
  // a controlled, in-repo data file.
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'data', 'toefl-lessons', 'catalog.ts'),
    'utf8',
  );
  const voicesStart = src.indexOf('export const TOEFL_VOICES =');
  const lessonsStart = src.indexOf('export const TOEFL_LESSONS');
  if (voicesStart < 0 || lessonsStart < 0) throw new Error('Catalog format changed — could not locate TOEFL_VOICES / TOEFL_LESSONS exports.');

  // Extract the two declarations as JS by stripping `as const` and
  // the TS type annotation on TOEFL_LESSONS.
  const voicesBlock = src.slice(voicesStart, lessonsStart)
    .replace('export const TOEFL_VOICES =', 'const TOEFL_VOICES =')
    .replace(/\}\s*as const;/, '};');

  const lessonsBlock = src.slice(lessonsStart)
    .replace('export const TOEFL_LESSONS: ToeflLesson[] =', 'const TOEFL_LESSONS =');
  // Lessons block runs to the `];` closing the array.
  const lessonsEnd = lessonsBlock.indexOf('\n];');
  const lessonsDef = lessonsBlock.slice(0, lessonsEnd + 3);

  // Evaluate the two declarations in a sandbox.
  const ctx = { TOEFL_VOICES: undefined, TOEFL_LESSONS: undefined };
  const fn = new Function('ctx', `
    ${voicesBlock}
    ${lessonsDef}
    ctx.TOEFL_VOICES = TOEFL_VOICES;
    ctx.TOEFL_LESSONS = TOEFL_LESSONS;
  `);
  fn(ctx);
  return { TOEFL_VOICES: ctx.TOEFL_VOICES, TOEFL_LESSONS: ctx.TOEFL_LESSONS };
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
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
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

function injectIntoHtml(html, audioUrls) {
  const anchor = 'const audioCache = {};';
  if (!html.includes(anchor)) {
    throw new Error(`Anchor "${anchor}" not found. Lesson HTML must contain the generateElevenLabsAudio runtime.`);
  }

  // Idempotent: if the PREBAKED_AUDIOS block already exists, replace it.
  let out = html;
  const prebakedBlockStart = out.indexOf('const PREBAKED_AUDIOS');
  if (prebakedBlockStart >= 0) {
    const prebakedBlockEnd = out.indexOf('};', prebakedBlockStart) + 2;
    out = out.slice(0, prebakedBlockStart) + out.slice(prebakedBlockEnd);
    // strip any stale newline that got left behind
    if (out[prebakedBlockStart] === '\n') out = out.slice(0, prebakedBlockStart) + out.slice(prebakedBlockStart + 1);
  }

  const injection = `const audioCache = {};
const PREBAKED_AUDIOS = ${JSON.stringify(audioUrls, null, 2)};
`;
  out = out.replace(anchor, injection);

  // Short-circuit the generator. Idempotent: skip if already present.
  const fnSignature = 'async function generateElevenLabsAudio(cacheKey, spokenText) {';
  if (!out.includes('Pre-baked override:')) {
    const shortCircuit = `${fnSignature}
  // Pre-baked override: if the batch script has uploaded an MP3 for
  // this cacheKey, use the Firebase Storage URL directly — no API
  // key, no browser-TTS fallback. Overrides anything else.
  if (PREBAKED_AUDIOS && PREBAKED_AUDIOS[cacheKey]) {
    return PREBAKED_AUDIOS[cacheKey];
  }
`;
    out = out.replace(fnSignature, shortCircuit);
  }

  out = out.replace(
    'Ready. Enter ElevenLabs key above for studio voice or play directly with browser TTS.',
    'Listo. Audios pre-cargados — toca ▶ para reproducir.',
  );
  // Hide the API-key card when it's present — some templates may omit it.
  out = out.replace(/class="el-config"(?! hidden)/g, 'class="el-config" hidden');

  // The Gemini template's play handler branches on `state.elApiKey` BEFORE
  // calling generateElevenLabsAudio — so without a pasted API key the
  // short-circuit never fires and it jumps to browser TTS. Patch the gate
  // to also trip when the cacheKey has a pre-baked URL.
  const gateSignature = 'if ((state.elApiKey || "").trim()) {';
  const gatePatched   = 'if ((PREBAKED_AUDIOS && PREBAKED_AUDIOS[cacheKey]) || (state.elApiKey || "").trim()) {';
  // Only replace if the un-patched exact literal is still in the file.
  // (Same-string self-check — patched form contains gateSignature as a
  // substring so we match explicitly on the un-patched one.)
  if (out.includes(gateSignature) && !out.includes(gatePatched)) {
    out = out.replace(gateSignature, gatePatched);
  }

  // Also fix the mode-label banner so it stops saying "Browser TTS Fallback"
  // when we have a baked URL.
  const modeLabelOld = '🎧 ${labelText} · ${hasKey ? "Mode: ElevenLabs API" : "Mode: Browser TTS Fallback"}';
  const modeLabelNew = '🎧 ${labelText} · ${(PREBAKED_AUDIOS && PREBAKED_AUDIOS[cacheKey]) ? "Mode: Studio MP3 (pre-cached)" : (hasKey ? "Mode: ElevenLabs API" : "Mode: Browser TTS Fallback")}';
  if (out.includes(modeLabelOld)) {
    out = out.replace(modeLabelOld, modeLabelNew);
  }

  return out;
}

// ── Bake one lesson ───────────────────────────────────────────

async function bakeOne(lesson) {
  const results = {};
  console.log(`\n▶ ${lesson.id} · ${lesson.title}`);
  if (!lesson.audios?.length) { console.log('  (no audios declared — skip)'); return results; }

  for (const audio of lesson.audios) {
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

  // Inject into the HTML file.
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
    console.error('Usage: node scripts/bake-toefl-lesson.js <slug> [--force]');
    console.error('       node scripts/bake-toefl-lesson.js --all [--force]');
    process.exit(1);
  }

  const { TOEFL_LESSONS } = loadCatalog();
  const targets = ALL ? TOEFL_LESSONS : TOEFL_LESSONS.filter(l => l.id === SLUG);
  if (targets.length === 0) {
    console.error(`No lesson matched ${SLUG}. Known slugs: ${TOEFL_LESSONS.map(l => l.id).join(', ')}`);
    process.exit(1);
  }

  if (!FORCE) {
    console.log('(no --force → uploads overwrite Storage path anyway; HTML injection is idempotent)');
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
