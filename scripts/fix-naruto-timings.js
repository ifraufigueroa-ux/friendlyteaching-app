// One-shot: truncate Naruto timings array to match the 25-line dialogue.
//
// Background: scripts/naruto-cefr-vocab.js rewrote the dialogue to 25
// lines but did NOT update the timings array (still 33 entries from
// the original transcript), so the slide's `supplied.length ===
// totalLines` guard rejected the manual timings and fell back to
// weight-based interpolation. The cursor ended up wildly out of sync
// (e.g. vengeance blank trigger at 35.62 s instead of ~16 s).
//
// Lines 0-24 of the new dialogue match the first 25 lines of the
// original 33-line transcript verbatim, so the fix is to keep only
// the first 25 timestamps and drop the trailing 8 (which were for
// dialogue lines my CEFR rewrite removed entirely).
const admin = require('firebase-admin');
const fs = require('fs');
const { backupLessonDoc } = require('./_lessonBackup');

const json = fs.readFileSync('C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json', 'utf8');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
const db = admin.firestore();

const LESSON_ID = 'gLtuWtn86IvTKe9U6G90';

(async () => {
  await backupLessonDoc(db, LESSON_ID, 'before-fix-naruto-timings');
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const lesson = snap.data();
  const clip = lesson.clip;

  const dialogueLines = (clip.dialogue || '').split('\n');
  const currentTimings = clip.timings || [];

  console.log('Before: dialogue lines =', dialogueLines.length, '· timings =', currentTimings.length);

  if (currentTimings.length === dialogueLines.length) {
    console.log('Already in sync — nothing to do.');
    return;
  }

  // Truncate (or pad if needed) so timings.length === dialogueLines.length.
  let newTimings;
  if (currentTimings.length > dialogueLines.length) {
    newTimings = currentTimings.slice(0, dialogueLines.length);
  } else {
    // Pad with linear extrapolation if dialogue is longer than timings.
    const last = currentTimings[currentTimings.length - 1] ?? 0;
    const prev = currentTimings[currentTimings.length - 2] ?? Math.max(0, last - 6);
    const gap = Math.max(3, last - prev);
    newTimings = [...currentTimings];
    while (newTimings.length < dialogueLines.length) {
      newTimings.push(newTimings[newTimings.length - 1] + gap);
    }
  }

  const newClip = { ...clip, timings: newTimings };

  // Update both the lesson's clip blob and the listening-game slide's clipData snapshot.
  const slides = (lesson.slides || []).map(s => {
    if (s.type === 'clip_dialogue_game') {
      return { ...s, clipData: { ...s.clipData, timings: newTimings } };
    }
    return s;
  });

  await ref.update({
    clip: newClip,
    slides,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('After: timings =', newTimings.length, 'entries');
  console.log('First 5:', newTimings.slice(0, 5).join(', '));
  console.log('Last  5:', newTimings.slice(-5).join(', '));
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
