// FriendlyTeaching.cl — Daily Practice: extra units, wave 3
//
// Introduces the PRONUNCIATION exercise type at every level + a
// short-listening unit at A0/B1 to round out the audio coverage.
// Pronunciation exercises use the new PronunciationBody runner (which
// records the student via MediaRecorder, transcribes with Whisper via
// /api/transcribe-speech, and plays an ElevenLabs reference on demand).

import type { PracticeUnit } from '@/types/practice';

export const EXTRA_UNITS_WAVE_3: PracticeUnit[] = [

  // ╔══════════════════════ A0 ══════════════════════╗

  {
    id: 'a0-pronunciation-basics',
    level: 'A0',
    skill: 'listening',
    title: 'Pronunciation · basics',
    description: 'Say common survival phrases out loud and get instant feedback.',
    icon: '🎤',
    quickLesson: {
      summary: 'This unit is special: the app listens to you. Press LISTEN to hear the model, RECORD to say it yourself, and the system compares word-by-word.',
      sections: [
        {
          heading: 'How it works',
          body: 'Listen to a native model, then record your own voice. The app transcribes what you said and tells you which words matched.',
          examples: [
            'Correct words → green.',
            'Missed words → red, underlined.',
            'Score above 75% = pass.',
          ],
          tip: 'Speak slowly and clearly the first time. You can retry as many times as you want.',
        },
      ],
    },
    exercises: [
      { id: 'a0-pb-01', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'Hello, my name is Anna.',           focus: 'Clear vowel in "Anna"' },
      { id: 'a0-pb-02', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'Nice to meet you.',                 focus: 'Link "meet-you" into one smooth phrase' },
      { id: 'a0-pb-03', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'How are you today?',                focus: 'Rising intonation at "today?"' },
      { id: 'a0-pb-04', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'I am from Chile.',                  focus: 'Stress on "Chile"' },
      { id: 'a0-pb-05', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'Thank you very much.',              focus: 'Short "th" sound at the start' },
      { id: 'a0-pb-06', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'See you tomorrow.',                 focus: 'Soft "y" blend in "see-you"' },
      { id: 'a0-pb-07', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'I have two brothers.',              focus: 'Pronounce "have" fully — not "I-of"' },
      { id: 'a0-pb-08', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'This is my friend.',                focus: 'Voiced "th" in "this"' },
      { id: 'a0-pb-09', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'I am twenty years old.',            focus: '"twen-ty" with a clear /t/' },
      { id: 'a0-pb-10', type: 'pronunciation', prompt: 'Say the sentence out loud.',   targetPhrase: 'Where is the bathroom?',            focus: 'Rising intonation at "bathroom?"' },
    ],
  },

  // ╔══════════════════════ A1 ══════════════════════╗

  {
    id: 'a1-pronunciation-daily',
    level: 'A1',
    skill: 'listening',
    title: 'Pronunciation · daily phrases',
    description: 'Short everyday sentences — practice your rhythm.',
    icon: '🎙️',
    quickLesson: {
      summary: 'Short daily-use sentences with natural stress and connected speech. Record yourself and the app grades per word.',
      sections: [
        {
          heading: 'Natural rhythm',
          body: 'English has strong and weak syllables. Hit the content words (nouns, main verbs, adjectives) harder than the function words (do, have, to, a).',
          tip: 'Imitate the model\'s rhythm, not just the words.',
        },
      ],
    },
    exercises: [
      { id: 'a1-pd-01', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'I usually have coffee in the morning.',    focus: 'Weak "the" (/ðə/)' },
      { id: 'a1-pd-02', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'She goes to work by bus.',                focus: 'Final /z/ sound in "goes"' },
      { id: 'a1-pd-03', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'What time does the film start?',          focus: 'Weak "does"' },
      { id: 'a1-pd-04', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'I live in a small apartment.',            focus: 'Link "in-a" into one unit' },
      { id: 'a1-pd-05', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'My sister is a doctor.',                  focus: 'Stress on "doc-tor"' },
      { id: 'a1-pd-06', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'Can you help me, please?',                focus: 'Rising intonation at "please?"' },
      { id: 'a1-pd-07', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'I don\'t speak Italian.',                 focus: 'Contraction "don\'t"' },
      { id: 'a1-pd-08', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'How much does it cost?',                  focus: 'Clear /tʃ/ in "much"' },
      { id: 'a1-pd-09', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'I would like a glass of water.',          focus: '"I would" → "I\'d"' },
      { id: 'a1-pd-10', type: 'pronunciation', prompt: 'Record yourself.', targetPhrase: 'See you next weekend.',                   focus: 'Falling intonation at the end' },
    ],
  },

  // ╔══════════════════════ A2 ══════════════════════╗

  {
    id: 'a2-pronunciation-connected',
    level: 'A2',
    skill: 'listening',
    title: 'Pronunciation · connected speech',
    description: 'Link words together the way natives do.',
    icon: '🔗',
    quickLesson: {
      summary: 'Natives rarely pause between words. Learn to link consonant-to-vowel ("an_apple") and squeeze auxiliary verbs into contractions.',
      sections: [
        {
          heading: 'Linking',
          body: 'When a word ends in a consonant and the next starts with a vowel, join them: "an apple" → "an_apple". Don\'t stop between.',
          examples: [
            'an **apple** → "a-napple"',
            'look **up** → "loo-kup"',
            'come **in** → "co-min"',
          ],
          tip: 'Spanish does the same thing ("tengo un hermano" → "tenguon-ermano"). Transfer the habit.',
        },
      ],
    },
    exercises: [
      { id: 'a2-pcs-01', type: 'pronunciation', prompt: 'Link the words smoothly.',    targetPhrase: 'I have an idea.',                     focus: 'Link "have-an-idea"' },
      { id: 'a2-pcs-02', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'She picks up the kids at three.',     focus: 'Link "picks-up"' },
      { id: 'a2-pcs-03', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'Turn off the lights, please.',        focus: 'Link "turn-off"' },
      { id: 'a2-pcs-04', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'I\'ve been there before.',             focus: 'Contraction "I\'ve"' },
      { id: 'a2-pcs-05', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'He wasn\'t at the meeting.',           focus: 'Contraction "wasn\'t"' },
      { id: 'a2-pcs-06', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'Let\'s meet up at the café.',          focus: 'Link "meet-up"' },
      { id: 'a2-pcs-07', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'I should have called earlier.',       focus: '"should\'ve" — soft "ve"' },
      { id: 'a2-pcs-08', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'Where are you from originally?',      focus: 'Stress "or-i-gi-nal-ly"' },
      { id: 'a2-pcs-09', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'It\'s a lot of work.',                focus: 'Flap /t/ in "lot-of"' },
      { id: 'a2-pcs-10', type: 'pronunciation', prompt: 'Record yourself.',             targetPhrase: 'I don\'t know what to say.',          focus: 'Reduced "don\'t-know"' },
    ],
  },

  // ╔══════════════════════ B1 ══════════════════════╗

  {
    id: 'b1-pronunciation-tricky-sounds',
    level: 'B1',
    skill: 'listening',
    title: 'Pronunciation · tricky sounds',
    description: '/θ/, /ð/, /ʃ/, /ʒ/ and other Spanish-speaker traps.',
    icon: '👄',
    quickLesson: {
      summary: 'Four sounds Spanish speakers often swap. Record and watch which words the app catches / misses — that tells you what to drill.',
      sections: [
        {
          heading: 'The "th" family',
          body: '/θ/ = unvoiced (think, thin, three). /ð/ = voiced (this, that, father). Both need tongue between teeth; Spanish /s/ and /t/ do NOT.',
          examples: [
            'think, three, thank you',
            'this, that, mother',
          ],
        },
        {
          heading: '/ʃ/ vs /tʃ/',
          body: '/ʃ/ is the "sh" sound (she, ship). /tʃ/ is the "ch" sound (chair, church). Spanish has only one — practice separating them.',
          tip: 'Minimal pairs: ship/chip, sheep/cheap, wash/watch.',
        },
      ],
    },
    exercises: [
      { id: 'b1-pts-01', type: 'pronunciation', prompt: 'Focus on the /θ/ (unvoiced th).', targetPhrase: 'I think three things.',           focus: 'Unvoiced /θ/' },
      { id: 'b1-pts-02', type: 'pronunciation', prompt: 'Focus on /ð/ (voiced th).',       targetPhrase: 'This is my mother and father.',   focus: 'Voiced /ð/' },
      { id: 'b1-pts-03', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'She sells seashells by the sea.', focus: '/ʃ/ vs /s/' },
      { id: 'b1-pts-04', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'The chef chopped the cherry.',   focus: '/tʃ/' },
      { id: 'b1-pts-05', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'The weather is pleasant.',       focus: '/ð/ in "weather" + /ʒ/ in "pleasant"' },
      { id: 'b1-pts-06', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'I would rather watch a film.',   focus: '/ð/ in "rather" + /tʃ/ in "watch"' },
      { id: 'b1-pts-07', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'Thursday was a thoughtful day.', focus: 'Multiple /θ/ sounds' },
      { id: 'b1-pts-08', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'She wished for a wish.',          focus: '/ʃ/' },
      { id: 'b1-pts-09', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'He loves his younger brother.',  focus: 'Voiced /ð/ in "brother"' },
      { id: 'b1-pts-10', type: 'pronunciation', prompt: 'Record yourself.',                targetPhrase: 'The decision was unusual.',      focus: '/ʒ/ in "usual-ly"' },
    ],
  },

  // ╔══════════════════════ B2 ══════════════════════╗

  {
    id: 'b2-pronunciation-sentence-stress',
    level: 'B2',
    skill: 'listening',
    title: 'Pronunciation · sentence stress',
    description: 'Content vs function words — the music of English.',
    icon: '🎵',
    quickLesson: {
      summary: 'Content words (nouns, verbs, adjectives, adverbs) carry the beat; function words (articles, prepositions, auxiliaries) get squished. This is what gives English its rhythm.',
      sections: [
        {
          heading: 'The beat-timed rule',
          body: 'English is stress-timed. The time between stressed syllables stays roughly constant, no matter how many weak syllables sit between them.',
          examples: [
            '**JOHN** will **BE** at the **PAR**-ty.',
            'The **CARS** that **SAM** **BOUGHT** are **RED**.',
          ],
          tip: 'Spanish is syllable-timed (every syllable gets equal weight). Transferring Spanish rhythm makes English sound robotic to native ears.',
        },
      ],
    },
    exercises: [
      { id: 'b2-pss-01', type: 'pronunciation', prompt: 'Stress the content words.',  targetPhrase: 'The cat is sleeping on the sofa.',          focus: 'CAT / SLEE / SO' },
      { id: 'b2-pss-02', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'I need to finish this project tonight.',    focus: 'NEED / FIN-ish / PRO-ject / TO-night' },
      { id: 'b2-pss-03', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'She has been working here for five years.', focus: 'WOR-king / HERE / FIVE / YEARS' },
      { id: 'b2-pss-04', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'If I had known, I would have told you.',    focus: 'KNOWN / TOLD' },
      { id: 'b2-pss-05', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'The results of the experiment were conclusive.', focus: 'RE-sults / EX-pe-ri-ment / CON-clu-sive' },
      { id: 'b2-pss-06', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'I was walking down the street when I saw her.',  focus: 'WALK / STREET / SAW' },
      { id: 'b2-pss-07', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'You should have warned me earlier.',       focus: '"should-of" + WARNED + EAR-lier' },
      { id: 'b2-pss-08', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'The meeting has been postponed until Monday.',   focus: 'MEE-ting / POST-poned / MON-day' },
      { id: 'b2-pss-09', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'I can\'t believe how fast time flies.',   focus: 'BE-lieve / FAST / FLIES' },
      { id: 'b2-pss-10', type: 'pronunciation', prompt: 'Record yourself.',           targetPhrase: 'The documents are on your desk.',         focus: 'DOC-u-ments / DESK' },
    ],
  },

  // ╔══════════════════════ B1 bonus · short listening ═══════╗

  {
    id: 'b1-listening-short-dialogues',
    level: 'B1',
    skill: 'listening',
    title: 'Short Listening · everyday dialogues',
    description: 'Hear a one-liner and pick the right response.',
    icon: '🎧',
    quickLesson: {
      summary: 'Listen to a short line of English and pick the best reply. Good for training fast comprehension under pressure.',
      sections: [
        {
          heading: 'Tip for tests',
          body: 'Don\'t translate in your head — answer by what FEELS right. Natural English lives in intuition.',
        },
      ],
    },
    exercises: [
      { id: 'b1-lsd-01', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'What do you do for a living?',             options: ["I'm a teacher.", "I live in Lima.", "I'm fine, thanks.", "I don't know."], correctIndex: 0 },
      { id: 'b1-lsd-02', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'Would you like something to drink?',       options: ["I live upstairs.", "Water, please.", "Yesterday.", "In the kitchen."], correctIndex: 1 },
      { id: 'b1-lsd-03', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'How long have you been studying English?', options: ["Very well.", "In London.", "About four years.", "I'm from Spain."], correctIndex: 2 },
      { id: 'b1-lsd-04', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'Do you mind if I open the window?',        options: ["Not at all.", "You're welcome.", "I don't like it.", "Of course not — I mind."], correctIndex: 0 },
      { id: 'b1-lsd-05', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'When does the next train arrive?',        options: ["In five minutes.", "Over there.", "It\'s red.", "At the station."], correctIndex: 0 },
      { id: 'b1-lsd-06', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'How often do you go to the gym?',         options: ["Three times a week.", "Yes, every day.", "A lot.", "Near my house."], correctIndex: 0 },
      { id: 'b1-lsd-07', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'Could you help me with this box?',        options: ["Sure, no problem.", "It\'s in the garage.", "I\'m hungry.", "I bought it yesterday."], correctIndex: 0 },
      { id: 'b1-lsd-08', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'Where did you grow up?',                   options: ["A small town in Chile.", "I\'m tall.", "I didn\'t.", "On Mondays."], correctIndex: 0 },
      { id: 'b1-lsd-09', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'How was your weekend?',                    options: ["Pretty good, thanks.", "It\'s Monday.", "In Lima.", "Two days."], correctIndex: 0 },
      { id: 'b1-lsd-10', type: 'listen-choose', prompt: 'Pick the natural reply.', audioScript: 'Are you free this evening?',               options: ["Yes, I think so.", "Last Friday.", "Very cheap.", "Three dollars."], correctIndex: 0 },
    ],
  },

];
