// One-shot: push cors.json to the Firebase Storage bucket.
//
// EPUB files uploaded by scripts/upload-library-epubs.js live at
// https://storage.googleapis.com/<bucket>/library/*.epub and are
// read directly by epub.js in the browser. Without CORS the browser
// blocks the download. This script applies the allow-GET config in
// cors.json to the default app bucket.

const fs = require('node:fs');
const path = require('node:path');
const { initAdmin } = require('./_lessonBackup');
const admin = require('firebase-admin');

initAdmin();
// Explicit bucket name — the admin SDK isn't initialised with a
// storageBucket option in this project, so default resolution fails.
const bucket = admin.storage().bucket('friendly-scheduling.firebasestorage.app');

(async () => {
  const cors = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cors.json'), 'utf8'));
  console.log('Applying CORS to', bucket.name);
  console.log(JSON.stringify(cors, null, 2));
  await bucket.setCorsConfiguration(cors);
  const [meta] = await bucket.getMetadata();
  console.log('\nCurrent bucket CORS:');
  console.log(JSON.stringify(meta.cors ?? [], null, 2));
  console.log('\nDone.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
