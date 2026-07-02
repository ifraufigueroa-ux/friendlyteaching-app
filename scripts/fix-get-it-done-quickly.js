// One-shot: fix "Get it done quickly" clip timings + populate the CLT deck.
//
// Source of truth for the transcript is the [HH:MM:SS] Speaker: Text
// pasted by the teacher. This script:
//   1. Parses that transcript into (line, timestamp) pairs, preserving
//      speaker attribution and keeping the {{blank}} markers already in
//      Firestore (matched by position within the game slide's content).
//   2. Rebuilds clip.dialogue + clip.timings + clip.startTime.
//   3. Preserves the teacher's existing clip_dialogue_game blanksData
//      and clip_comprehension slide.
//   4. Prepends the CLT curriculum slides (cover, vocabulary, predictions,
//      language_focus, language_practice, clip_production) so the deck
//      matches the English for Devs / Pain's Cycle structure.
//
// Backup is written before any mutation, per the convention in _lessonBackup.js.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const { backupLessonDoc } = require('./_lessonBackup');

const KEY_PATH = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
}
const db = getFirestore();

const LESSON_ID = 'QvVSsw0T0jiFbhm9PFTr';

// ─── Raw transcript (as pasted by the teacher) ────────────────────────

const RAW_TRANSCRIPT = `
[00:00:00] Narrator: It's that time again for English at Work. Life in the offices of Tip Top Trading is still hectic...
[00:00:21] Anna: Could someone answer that please? I'm on the other line.
[00:00:26] Denise: Well I can't, I'm already on the phone.
[00:00:29] Tom: Yeah, talking to your friend Marge. And I'm busy… errr… writing a business proposal.
[00:00:36] Paul: Could someone just answer that phone… oh, you're all busy. I suppose I'd better do it.
[00:00:54] Anna: Yes Paul. What's wrong?
[00:00:57] Paul: Hold on – I just need a quick bite on a biscuit... that was Nice'n'Cheesy. They're not happy...
[00:01:16] Paul: I need you to pull out all the stops and sort this out.
[00:01:21] Anna: Pull out what stops?
[00:01:28] Anna: But we've got the aubergine launch tomorrow.
[00:01:37] Narrator: ...Anyway Anna, your priority now is the order for Nice'n'Cheesy...
[00:02:03] Anna: Oh thanks. Tom, I need your help. It's the order for Nice'n'Cheesy, we need to process it urgently.
[00:02:11] Tom: The order? I sent that out ages ago, with the paperwork.
[00:02:15] Denise: You mean this paperwork Tom, on your desk?
[00:02:24] Anna: Well, they're not happy, so we've got to pull out all the stops and get them their grapes.
[00:02:33] Anna: Forget about the aubergines... You go and get the plastic grapes from the warehouse, I'll sort out this paperwork...
[00:02:49] Anna: We're getting a taxi to the offices of Nice'n'Cheesy...
[00:03:07] Narrator: She certainly is! Anna has wasted no time in sorting out this problem...
[00:03:45] Anna: …so we're really sorry about the delay, and it won't happen again.
[00:04:22] Tom: Phew, well done Anna... Hey, hold on, isn't that your boyfriend, Dave from IT, over there?
[00:04:41] Anna: No, it can't be… It is! What's Dave doing with another woman?
[00:04:54] Narrator: Oh dear. Poor Anna, it looks like Dave's been cheating on her...
`.trim();

// ─── Parse [HH:MM:SS] Speaker: Text into { time, text } ──────────────

function parseTranscript(raw) {
  const lineRegex = /\[(\d{1,2}):(\d{2}):(\d{2})\]\s*([^:]+?):\s*(.+)/;
  const out = [];
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(lineRegex);
    if (!m) continue;
    const [, hh, mm, ss, , text] = m;
    const seconds = parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseInt(ss, 10);
    out.push({ time: seconds, text: text.trim() });
  }
  return out;
}

// ─── CLT slides (mirrors English for Devs structure) ────────────────

function buildCurriculumSlides(youtubeUrl) {
  const videoId = youtubeUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? '';
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';

  return [
    {
      type: 'cover',
      title: 'BBC English at Work — Get it done quickly',
      subtitle:
        "Learn how to prioritise, delegate, and rally your team when a client is unhappy. Everyday workplace English at B2.",
      content: 'B2',
      imageUrl: thumb,
    },
    {
      type: 'vocabulary',
      title: 'Key vocabulary',
      subtitle:
        'Tap each card to reveal the meaning. You will hear these throughout the office scene.',
      words: [
        {
          word: 'hectic',
          translation: 'very busy, fast-paced and chaotic',
          example: 'Life in the offices of Tip Top Trading is still hectic.',
        },
        {
          word: 'launch (a product)',
          translation: 'to release a product to the market for the first time',
          example: 'Tomorrow the team is launching its new product — the plastic aubergine.',
        },
        {
          word: "pull your weight",
          translation: 'do your fair share of the work',
          example: 'Everyone needs to pull their weight and get things done — quickly.',
        },
        {
          word: 'pull out all the stops',
          translation: 'make every possible effort to succeed',
          example: 'I need you to pull out all the stops and sort this out.',
        },
        {
          word: 'process an order',
          translation: 'handle an order from receipt to fulfilment',
          example: 'They are not happy about how slowly we are processing their order.',
        },
        {
          word: 'sort (something) out',
          translation: 'resolve or organise something',
          example: 'We need to pull out all the stops to get this sorted.',
        },
        {
          word: 'number one priority',
          translation: 'the single most important task right now',
          example: "This is our number one priority.",
        },
        {
          word: 'delegate (a task)',
          translation: 'assign a task to someone else on your team',
          example: 'Anna delegated tasks to the team to help her get the order sorted.',
        },
        {
          word: 'hand deliver',
          translation: 'deliver in person rather than via courier or post',
          example: 'We can hand deliver the grapes.',
        },
        {
          word: 'customer care',
          translation: 'service and support given to customers',
          example: "If you can guarantee a bit more 'customer care', we'll be buying from you again.",
        },
        {
          word: 'competitive (price)',
          translation: 'priced comparably to or below rivals — attractive to buyers',
          example: 'The price is very competitive.',
        },
        {
          word: 'save the day',
          translation: 'rescue a situation that was going wrong',
          example: 'I think you saved the day once again.',
        },
      ],
    },
    {
      type: 'clip_predictions',
      title: 'Before you watch',
      subtitle: 'Think for a moment before the audio plays.',
      prompt: 'What would you do if a big client called your office to complain about a delayed order?',
      content:
        'Think about which co-worker you would ask for help first.\n' +
        'Predict which excuses the team members might give when the phone rings.\n' +
        'Guess what "pull out all the stops" could mean in this office context.',
    },
    // ── The teacher-authored clip_dialogue_game slide sits HERE (index 3) ─
    // ── The teacher-authored clip_comprehension slide sits HERE  (index 4) ─
    {
      type: 'clip_language_focus',
      title: 'Language focus: urgency + delegation',
      subtitle:
        'How Anna signals urgency, sets priorities, and hands work over to Tom.',
      content:
        "In a busy office you often need to move fast and make it clear that a task is urgent. Anna does this with three moves:\n\n" +
        "1) STATE THE URGENCY with a fixed phrase: \"We have an order we need to process urgently.\" / \"We've got to pull out all the stops.\"\n\n" +
        "2) SET THE PRIORITY with a superlative: \"This is our number one priority.\" — this signals that everything else waits.\n\n" +
        "3) DELEGATE with a direct instruction + a checkpoint time: \"You go and get the plastic grapes… I'll meet you downstairs in 15 minutes.\"\n\n" +
        "Notice the register: Paul, the boss, softens instructions with \"Could you…\" and \"Please\". Anna, giving instructions to a peer, uses direct imperatives (\"You go…\", \"Forget about the aubergines\") because they are already a team and time is short.",
      words: [
        {
          word: 'pull out all the stops',
          translation: 'Fixed phrase — make every possible effort',
          example: 'I need you to pull out all the stops and sort this out.',
        },
        {
          word: 'process it urgently',
          translation: 'Signals urgency without sounding rude',
          example: "It's the order for Nice'n'Cheesy, we need to process it urgently.",
        },
        {
          word: "It's our number one priority",
          translation: 'Sets absolute priority so other tasks stand down',
          example: "It's our number one priority.",
        },
        {
          word: "I'll meet you downstairs in 15 minutes",
          translation: 'Direct instruction + specific checkpoint — no ambiguity',
          example: "I'll sort out this paperwork, and I'll meet you downstairs in 15 minutes.",
        },
      ],
    },
    {
      type: 'clip_controlled_practice',
      title: 'Controlled practice',
      subtitle: 'Complete each sentence with the missing phrase from the episode.',
      practiceItems: [
        {
          type: 'unscramble',
          prompt: 'need / to / We / all / stops / the / out / pull',
          answer: 'We need to pull out all the stops',
        },
        {
          type: 'unscramble',
          prompt: 'is / one / This / priority / number / our',
          answer: 'This is our number one priority',
        },
        {
          type: 'unscramble',
          prompt: 'to / an / order / We / need / process / have / urgently / we',
          answer: 'We have an order we need to process urgently',
        },
        {
          type: 'match_halves',
          prompt: 'I need you to pull out all the stops',
          answer: 'and sort this out.',
          options: [
            'and sort this out.',
            'and launch the aubergine.',
            'and answer the phone.',
            'and go to lunch.',
          ],
        },
        {
          type: 'match_halves',
          prompt: "We're getting a taxi to the offices of Nice'n'Cheesy",
          answer: 'so we can hand deliver the grapes.',
          options: [
            'so we can hand deliver the grapes.',
            "so we can meet Dave from IT.",
            'so we can go for lunch first.',
            'so we can pick up more aubergines.',
          ],
        },
      ],
    },
    {
      type: 'clip_production',
      title: 'Your turn — free production',
      subtitle:
        'Use the language from the clip in a realistic office moment of your own.',
      prompt:
        "Imagine an important client just called your office to complain that their order is late. Record a 60-90 second voice note explaining:\n\n" +
        "• What went wrong (be honest, not defensive).\n" +
        "• How you will fix it, using at least two of: \"pull out all the stops\", \"number one priority\", \"process it urgently\".\n" +
        "• Which team-mate you will delegate to and by when.\n" +
        "• How you will follow up with the client.\n\n" +
        "Try to sound calm and in control — like Anna does with Tom.",
    },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────

(async () => {
  await backupLessonDoc(db, LESSON_ID, 'before-fix-timings-and-add-clt');
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const lesson = snap.data();

  // ── 1. Parse the pasted transcript ────────────────────────────────
  const parsed = parseTranscript(RAW_TRANSCRIPT);
  console.log(`Parsed ${parsed.length} transcript lines. First:`, parsed[0], 'Last:', parsed[parsed.length - 1]);

  // ── 2. Build new clip.dialogue + clip.timings ────────────────────
  // Keep the teacher's {{blank}} markers by pulling them from the
  // existing clip.dialogue and matching them to lines by index. If the
  // teacher already reordered lines the safest fallback is to leave the
  // new dialogue blank-free and let them re-mark.
  const oldGameSlide = (lesson.slides || []).find(
    s => s.type === 'clip_dialogue_game' || s.type === 'lyrics_game',
  );
  const oldDialogue = lesson.clip?.dialogue ?? oldGameSlide?.content ?? '';
  const oldLines = oldDialogue.split('\n').filter(Boolean);

  const newLines = parsed.map((p, i) => {
    // If the teacher had this exact line marked before, keep the marked
    // version (preserves {{blank}} positions). Otherwise take the raw line.
    const cleanOld = (oldLines[i] || '').replace(/\{\{blank\}\}/g, '___');
    const cleanNew = p.text.replace(/[.,!?;:"'()…–—]/g, '').toLowerCase();
    const cleanOldNorm = cleanOld.replace(/[.,!?;:"'()…–—]/g, '').toLowerCase();
    // Lightweight similarity: if the two normalised versions share the
    // same first 15 chars, we assume it is the same line and reuse the
    // teacher's blank markers, only updating around the marker.
    if (cleanOld && cleanOldNorm.slice(0, 15) === cleanNew.slice(0, 15)) {
      return oldLines[i];
    }
    return p.text;
  });

  const newDialogue = newLines.join('\n');
  const newTimings  = parsed.map(p => p.time);

  console.log(`\nDialogue: ${newLines.length} lines. Timings: ${newTimings.length} entries.`);
  console.log(`Preserved teacher blank markers on ${newLines.filter(l => l.includes('{{blank}}')).length} lines.`);

  const newClip = {
    ...(lesson.clip || {}),
    dialogue: newDialogue,
    timings:  newTimings,
    startTime: 0,
    captionsSource: 'manual',
    youtubeUrl: lesson.clip?.youtubeUrl || 'https://www.youtube.com/watch?v=WO-pVRr9Wio',
    title:     lesson.clip?.title     || 'Get it done quickly',
    source:    lesson.clip?.source    || 'English at Work',
  };

  // ── 3. Rebuild slide deck: prepend CLT, keep teacher game + comprehension,
  //       append CLT tail. ─────────────────────────────────────────────
  const curriculumHead = buildCurriculumSlides(newClip.youtubeUrl).slice(0, 3); // cover, vocabulary, predictions
  const curriculumTail = buildCurriculumSlides(newClip.youtubeUrl).slice(3);    // language_focus, controlled_practice, production

  const gameSlide = oldGameSlide
    ? { ...oldGameSlide, content: newDialogue, clipData: { ...(oldGameSlide.clipData || {}), ...newClip } }
    : {
        type: 'clip_dialogue_game',
        content: newDialogue,
        blanksData: [],
        clipData: newClip,
      };

  const comprehensionSlide = (lesson.slides || []).find(s => s.type === 'clip_comprehension');

  const newSlides = [
    ...curriculumHead,
    gameSlide,
    ...(comprehensionSlide ? [comprehensionSlide] : []),
    ...curriculumTail,
  ];

  console.log(`\nNew deck: ${newSlides.map(s => s.type).join(' → ')}`);

  await ref.update({
    clip: newClip,
    slides: newSlides,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log('\n✓ Firestore updated.');
})().catch(e => { console.error('ERR:', e); process.exit(1); });
