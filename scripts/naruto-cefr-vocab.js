// Refactor Pain's Cycle of Hatred so the vocabulary stage uses the
// SAME 10 words that appear as blanks in the listening game.
//
// Target words are CEFR-prioritised (B2 / C1) and present in the
// dialogue text — we inject {{blank}} at one occurrence per word.
const admin = require('firebase-admin');
const fs = require('fs');

const json = fs.readFileSync('C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json', 'utf8');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
const db = admin.firestore();

const LESSON_ID = 'gLtuWtn86IvTKe9U6G90';

// 10 target words, ordered by where they first appear in the dialogue.
const TARGETS = [
  { word: 'vengeance', ipa: "ˈven.dʒəns",   level: 'C1',
    definition: 'revenge taken for an injury or wrong',
    distractors: ['revenge', 'fury', 'hatred'] },
  { word: 'hatred',    ipa: "ˈheɪ.trɪd",    level: 'B2',
    definition: 'intense feeling of dislike',
    distractors: ['anger', 'fear', 'sorrow'] },
  { word: 'harmony',   ipa: "ˈhɑː.mə.ni",   level: 'B2',
    definition: 'agreement, peaceful coexistence',
    distractors: ['peace', 'unity', 'silence'] },
  { word: 'fulfill',   ipa: "fʊlˈfɪl",      level: 'B2',
    definition: 'to achieve or carry out something promised',
    distractors: ['achieve', 'complete', 'reach'] },
  { word: 'trigger',   ipa: "ˈtrɪɡ.ər",     level: 'B2',
    definition: 'to cause or set off',
    distractors: ['cause', 'start', 'spark'] },
  { word: 'vicious',   ipa: "ˈvɪʃ.əs",      level: 'B2',
    definition: 'cruel, severe',
    distractors: ['cruel', 'endless', 'brutal'] },
  { word: 'preach',    ipa: "priːtʃ",       level: 'C1',
    definition: 'to publicly proclaim or lecture',
    distractors: ['teach', 'lecture', 'scream'] },
  { word: 'fate',      ipa: "feɪt",         level: 'B2',
    definition: 'destiny, the inevitable outcome',
    distractors: ['future', 'luck', 'pain'] },
  { word: 'confront',  ipa: "kənˈfrʌnt",    level: 'B2',
    definition: 'to face up to a problem boldly',
    distractors: ['face', 'fight', 'avoid'] },
  { word: 'entrust',   ipa: "ɪnˈtrʌst",     level: 'C1',
    definition: 'to give responsibility to someone',
    distractors: ['trust', 'assign', 'leave'] },
];

// Pure dialogue without any blank — the source of truth used to inject.
const DIALOGUE_PLAIN = [
  "Naruto: (grunts) / Pain: You asked me why I'm doing all this. But even if I told you why...",
  "...I doubt very strongly that the knowledge would change anything at all. But let's say that I take the time to explain it to you.",
  "What do you think would happen then? Naruto: I have nothing to say to you. Pain: My goal is to fulfill the dream even Jiraiya-sensei was unable to achieve.",
  "Naruto: (grunts) Pain: As I said earlier... ...what I want is to create peace and bring about justice.",
  "Naruto: Create peace? Justice? Are you kidding?!? GIVE ME A BREAK! You killed my master...",
  "...and my sensei! Hurt my friends... Destroyed my village!!!",
  "After all of the horrible things that you've done... ...DON'T YOU DARE TALK ABOUT PEACE AND JUSTICE!",
  "(heavy breathing) Pain: Then tell me...what is your goal?",
  "Naruto: First, I'm gonna kill you! And then, I'M GONNA BRING PEACE TO THE NINJA WORLD! Pain: Oh I see. That is noble of you.",
  "That WOULD be justice. However... What about MY family? MY friends?",
  "MY village? They suffered the same fate as this village at the hands of you Hidden Leaf ninja.",
  "How is it fair to let ONLY YOU people preach about peace and justice?",
  "Naruto: *gasp* What the hell are you talking about? Pain: Once...the Land of Fire and the Hidden Leaf had grown too big.",
  "To protect their power, they pulled my country into their war. They came to my village...",
  "...and killed innocent people. So I lost everything. Pain: That's why I came to understand...the only true peace is...",
  "...one based on the threat of pain and force. Naruto: How does THAT even...?! Pain: If one comes to call vengeance 'justice'...",
  "...such 'justice' will only breed further vengeance...",
  "...and trigger a vicious Cycle Of Hatred. Right now, we live in such a cycle.",
  "I know the past and can foretell our future. It is the same...as our history. SO WE BELIEVE THAT HUMAN BEINGS SIMPLY CANNOT UNDERSTAND EACH OTHER...",
  "AND THEY NEVER WILL. The shinobi world of ours is ruled by hatred...",
  "Jiraiya: Ah. I've always wanted to do something about all of this hatred. I'm just not quite sure how to go about it as of yet.",
  "But I truly believe... ...that eventually, the day will come... ...when all people will understand one another and live in harmony.",
  "Naruto: Boy, it sounds kind of complicated to me. Jiraiya: And if I can't find the solution to this problem... ...then perhaps I'll entrust you to find it instead, eh, Naruto?",
  "Naruto: Yes sir! I can't turn down a request from my master, can I, Pervy Sage?",
  "(quiet grunting) So Naruto... ...how would YOU confront this hatred in order to create peace?",
];

// Inject blanks at first un-claimed occurrence of each target word.
// Multiple blanks per line are allowed — only the SAME character range
// is guarded so two targets don't overlap.
function buildDialogueWithBlanks(lines, targets) {
  const lineState = lines.map(l => ({ text: l, blanksByOffset: [] }));
  const blanksData = [];

  function rangeOverlaps(line, start, end) {
    return line.blanksByOffset.some(b => !(end <= b.start || start >= b.end));
  }

  for (const t of targets) {
    let placed = false;
    for (let li = 0; li < lineState.length && !placed; li++) {
      const text = lineState[li].text;
      const re = new RegExp(`\\b${t.word}\\b`, 'gi');
      let m;
      while ((m = re.exec(text)) !== null) {
        const start = m.index, end = m.index + m[0].length;
        if (rangeOverlaps(lineState[li], start, end)) continue;
        lineState[li].blanksByOffset.push({ start, end, actualText: m[0] });
        placed = true;
        const options = [t.word, ...t.distractors];
        for (let k = options.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [options[k], options[j]] = [options[j], options[k]];
        }
        blanksData.push({ word: t.word, options });
        break;
      }
    }
    if (!placed) {
      console.warn(`Could not place {{blank}} for "${t.word}"`);
    }
  }

  // Reconstruct dialogue text — replace each tracked range with {{blank}}.
  const blankedLines = lineState.map(({ text, blanksByOffset }) => {
    if (blanksByOffset.length === 0) return text;
    let out = '';
    let cursor = 0;
    blanksByOffset.sort((a, b) => a.start - b.start);
    for (const b of blanksByOffset) {
      out += text.slice(cursor, b.start) + '{{blank}}';
      cursor = b.end;
    }
    out += text.slice(cursor);
    return out;
  });

  return { dialogue: blankedLines.join('\n'), blanksData };
}

(async () => {
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const lesson = snap.data();

  const { dialogue, blanksData } = buildDialogueWithBlanks(DIALOGUE_PLAIN, TARGETS);
  console.log('Placed', blanksData.length, '/', TARGETS.length, 'target blanks:');
  blanksData.forEach((b, i) => console.log(`  ${i + 1}.`, b.word, '· options:', b.options.join(', ')));

  // Build the new vocab match slide words (same 10 target words in the
  // same order they appear in the dialogue).
  const vocabWords = blanksData.map(b => {
    const t = TARGETS.find(x => x.word === b.word);
    return {
      word:          t.word,
      translation:   t.definition,
      pronunciation: t.ipa,
      example:       `${t.level} · target blank`,
    };
  });

  // Rebuild the slides array preserving everything except:
  //   - the dialogue game slide (new dialogue + blanksData + clipData)
  //   - the vocab match slide (new words)
  const oldClip = lesson.clip;
  const newClipData = {
    ...oldClip,
    dialogue,
    timings: oldClip.timings, // unchanged — same line count
  };

  const slides = (lesson.slides || []).map(s => {
    if (s.type === 'clip_dialogue_game') {
      return {
        ...s,
        content: dialogue,
        blanksData,
        clipData: newClipData,
      };
    }
    if (s.type === 'clip_vocab_match' || s.type === 'vocabulary') {
      return {
        ...s,
        type: 'clip_vocab_match',
        title: 'Key vocabulary',
        subtitle: 'Match each blank-target word with its definition. Hint: you will hear them in the clip.',
        words: vocabWords,
      };
    }
    return s;
  });

  await ref.update({
    clip: newClipData,
    slides,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✓ Lesson updated — vocab now mirrors the 10 target blanks.');
})().catch(e => { console.error('ERR:', e); process.exit(1); });
