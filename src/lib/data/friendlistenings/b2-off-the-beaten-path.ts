// Friendlistenings® — B2 · Off the beaten path
//
// A ~3:30 podcast-style interview with a solo backpacker just back from four
// months in Southeast Asia. The script is natural, conversational and packed
// with reusable chunks a B2 student hits in authentic listening but tends to
// miss in a textbook — "end up —ing", "blow my mind", "off the beaten path",
// "hit a wall", "a bit of both".
//
// The 8-step arc fits a ~45-minute class slot (or self-study at the
// student's pace):
//   1. Lead-in     · 4 min  — activate schema with solo-travel prompts
//   2. Vocab       · 6 min  — pre-teach 8 items + 3-question check
//   3. Prediction  · 3 min  — guess the content before pressing play
//   4. Gist        · 6 min  — first listen, big-picture
//   5. Detail      · 10 min — second listen, specific info + transcript
//   6. Awareness   · 6 min  — notice-the-gap on 5 chunks
//   7. Controlled  · 5 min  — reuse the chunks in short tasks
//   8. Production  · 5 min  — 60-sec speaking using 3+ target chunks

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB2OffTheBeatenPath: FLLesson = {
  id:           'b2-off-the-beaten-path',
  title:        'Off the beaten path',
  subtitle:     'A travel podcast interview',
  level:        'B2',
  topic:        'Solo travel · Southeast Asia',
  scenario:     'Marco interviews Luna, a solo backpacker just back from 4 months in SE Asia.',
  estimatedMin: 45,
  tags:         ['travel', 'past-narratives', 'chunks', 'podcast'],
  createdAt:    '2026-11-10',

  cover: {
    accent: '#9B72B8',
    emoji:  '🎒',
  },

  audio: {
    durationSec: 210,
    speakers: [
      {
        id: 'host', displayName: 'Marco', accent: 'AU', gender: 'm',
        suggestedVoice: { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', note: 'ElevenLabs · natural Australian male, casual podcast cadence' },
      },
      {
        id: 'guest', displayName: 'Luna', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', note: 'ElevenLabs · young expressive female, traveller energy — fits first-person stories' },
      },
    ],
    script: [
      { speakerId: 'host',  approxStartSec:   0, text: 'Welcome back to Off the Beaten Path, the podcast that gets real about solo travel. I\'m Marco, and today I\'m talking to Luna Herrera. Luna, you just got back from a four-month trip around Southeast Asia. How are you feeling?' },
      { speakerId: 'guest', approxStartSec:  18, text: 'Honestly, kind of jet-lagged but on cloud nine. I only landed two days ago.' },
      { speakerId: 'host',  approxStartSec:  26, text: 'Four months is a long stretch. What made you decide to go for that long?' },
      { speakerId: 'guest', approxStartSec:  31, text: 'You know, it wasn\'t planned at all. I was supposed to take six weeks off between jobs, but things kept working out — I\'d meet someone who\'d say "you have to see this island," and I\'d just end up adding another stop. Before I knew it, four months had flown by.' },
      { speakerId: 'host',  approxStartSec:  54, text: 'That\'s the beauty of travelling solo, isn\'t it. Was there a moment that really blew your mind?' },
      { speakerId: 'guest', approxStartSec:  61, text: 'Oh, a hundred percent. I spent a week in a tiny village in northern Laos — no WiFi, no hot water — the kind of place that\'s really off the beaten path. One night the whole village came out for a lantern festival, and they just pulled me in. I didn\'t speak the language, they didn\'t speak mine, but we spent the whole night together. That blew me away.' },
      { speakerId: 'host',  approxStartSec:  92, text: 'Money-wise, were you splurging or watching every dollar?' },
      { speakerId: 'guest', approxStartSec:  97, text: 'A bit of both. Most days I\'d eat street food for two dollars and crash at hostel dorms. But every couple of weeks I\'d treat myself — one really nice dinner, or a beachfront bungalow for a night. That mix kept me sane.' },
      { speakerId: 'host',  approxStartSec: 118, text: 'Any moments where you really missed home?' },
      { speakerId: 'guest', approxStartSec: 123, text: 'Yeah, around month three I hit a wall. I was in Bangkok, overstimulated, and suddenly I just wanted my own bed and my mom\'s cooking. But the thing about feeling homesick on the road is — it passes. I caught a slow boat down the Mekong the next day, and by the time I got off, I was good again.' },
      { speakerId: 'host',  approxStartSec: 150, text: 'What\'s the one piece of advice you\'d give someone thinking of doing their first solo trip?' },
      { speakerId: 'guest', approxStartSec: 158, text: 'Pack half of what you think you need, double the money, and don\'t plan past the first week. The best stuff always happens when you leave room for it.' },
      { speakerId: 'host',  approxStartSec: 174, text: 'Luna, thanks for this. Where can people follow your travels?' },
      { speakerId: 'guest', approxStartSec: 180, text: 'You can find me on at-luna-hikes. I\'ll be posting pictures for weeks.' },
      { speakerId: 'host',  approxStartSec: 188, text: 'Perfect. Safe travels — or safe staying home. That\'s it for today\'s episode of Off the Beaten Path.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Take a second and picture travelling solo. It doesn\'t matter if you never have — just thinking about it brings images, wishes, maybe some fears. Today you\'ll listen to an interview with Luna, a traveller who just got back from four months in Southeast Asia.',
      hookEmoji: '🎒',
      openQuestions: [
        { id: 'li1', prompt: 'Have you ever travelled solo? Where to? If not, what\'s stopped you?' },
        { id: 'li2', prompt: 'Imagine you had four months and a mid-range budget. Where in the world would you go — and why?' },
        { id: 'li3', prompt: 'What would be the hardest part of travelling solo for that long: the logistics, the loneliness, or the money?', hint: 'Think about the last days of the longest trip you\'ve ever taken.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'Before you listen, look at these 8 expressions Luna uses. They\'re chunks native speakers drop all the time — your key to understanding at natural speed.',
      items: [
        { id: 'v1', word: 'jet-lagged',         pos: 'adjective', translation: 'Tired and out of sync after a long flight across time zones.',       example: 'I\'m jet-lagged but on cloud nine.',           soundsLike: 'JET-lagd',       definition: 'suffering from jet lag' },
        { id: 'v2', word: 'on cloud nine',      pos: 'idiom',     translation: 'Super happy — like you\'re floating.',                               example: 'On cloud nine after landing home.',             definition: 'extremely happy' },
        { id: 'v3', word: 'end up —ing',        pos: 'phrase',    translation: 'To finish doing something you didn\'t originally plan.',             example: 'I ended up adding another stop.',               soundsLike: 'end UP',          definition: 'to reach a state or result you didn\'t plan' },
        { id: 'v4', word: 'blow (sb\'s) mind',  pos: 'idiom',     translation: 'To completely amaze someone.',                                       example: 'That village blew me away.',                    definition: 'to impress or amaze someone' },
        { id: 'v5', word: 'off the beaten path',pos: 'idiom',     translation: 'Away from the usual tourist routes.',                                example: 'A place that\'s really off the beaten path.',   definition: 'unusual, not visited by many tourists' },
        { id: 'v6', word: 'to splurge',         pos: 'verb',      translation: 'To spend more than you normally would, as a treat.',                 example: 'Every couple of weeks I\'d splurge.',           definition: 'to spend more than you usually do' },
        { id: 'v7', word: 'to crash',           pos: 'verb',      translation: 'Informal: to sleep, usually because you\'re exhausted.',             example: 'I\'d crash at hostel dorms.',                   definition: 'to sleep in a casual, exhausted way' },
        { id: 'v8', word: 'to hit a wall',      pos: 'idiom',     translation: 'To suddenly run out of energy, physically or emotionally.',          example: 'Around month three I hit a wall.',              definition: 'to reach a point of exhaustion' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'If someone says "I\'m on cloud nine," they are…',
          options: [
            { id: 'a', text: 'very sad' },
            { id: 'b', text: 'extremely happy' },
            { id: 'c', text: 'confused' },
          ],
          correct: 'b',
          explain: 'On cloud nine = extremely happy. A classic.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"I ended up buying a ticket" means that…',
          options: [
            { id: 'a', text: 'they had planned it from the start' },
            { id: 'b', text: 'they bought it even though it wasn\'t the plan' },
            { id: 'c', text: 'they didn\'t buy it' },
          ],
          correct: 'b',
          explain: '"End up —ing" implies an UNPLANNED outcome.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'A restaurant that\'s "off the beaten path" is…',
          options: [
            { id: 'a', text: 'very famous and packed with tourists' },
            { id: 'b', text: 'little-known, outside the tourist circuit' },
            { id: 'c', text: 'permanently closed' },
          ],
          correct: 'b',
          explain: 'It\'s the opposite of a "tourist trap".',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Don\'t press play yet — with the title "Off the Beaten Path" and knowing Luna\'s back from four months in Southeast Asia, take a guess.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'Which topic do you think Luna will mention first?',
          options: [
            { id: 'a', text: 'How tired she is' },
            { id: 'b', text: 'A conflict at an airport' },
            { id: 'c', text: 'The price of her ticket' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Which moment do you think impressed her the MOST?',
          options: [
            { id: 'a', text: 'An expensive dinner at a famous restaurant' },
            { id: 'b', text: 'A festival in a remote village' },
            { id: 'c', text: 'An archaeological museum' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'At what point in the trip do you think she felt worst?',
          options: [
            { id: 'a', text: 'The first week' },
            { id: 'b', text: 'Around the third month' },
            { id: 'c', text: 'The day she came back' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Press play and listen to the whole audio ONCE. Don\'t worry about details — just catch the big picture.',
      listenFor: [
        'The overall tone: does she regret it, is she happy, is it mixed?',
        'Luna\'s attitude toward her budget',
        'The closing message / advice',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'Overall, how does Luna describe the experience?',
          options: [
            { id: 'a', text: 'Exhausting and full of regret' },
            { id: 'b', text: 'Transformative and positive, with some hard moments' },
            { id: 'c', text: 'Boring and predictable' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What is Luna\'s core message about long solo travel?',
          options: [
            { id: 'a', text: 'You have to plan every single day' },
            { id: 'b', text: 'Leave room for what you can\'t plan' },
            { id: 'c', text: 'It\'s better to travel with friends than alone' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g3',
          prompt: 'What was Luna\'s ORIGINAL plan?',
          options: [
            { id: 'a', text: 'To travel for six months' },
            { id: 'b', text: 'To take six weeks off between jobs' },
            { id: 'c', text: 'To move to Asia permanently' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Now listen again, pausing where you need to. Feel free to open the transcript if it helps.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'Luna spent a week in a tiny village in northern ___.',
          answers:  ['Laos'],
          alts:     [['laos']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'According to Luna, how did she spend most days when it came to food?',
          options: [
            { id: 'a', text: 'Expensive restaurants with friends' },
            { id: 'b', text: 'Street food for two dollars' },
            { id: 'c', text: 'Cooking at the hostel' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd3',
          sentence: 'Luna "hit a wall" around month ___, in the city of ___.',
          answers:  ['three', 'Bangkok'],
          alts:     [['3'], ['bangkok']],
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'When she felt bad in Bangkok, what did she do the next day?',
          options: [
            { id: 'a', text: 'Flew home' },
            { id: 'b', text: 'Took a slow boat down the Mekong river' },
            { id: 'c', text: 'Stayed another week in Bangkok' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'What is Luna\'s money advice for a first-time solo traveller?',
          options: [
            { id: 'a', text: 'Pack just enough' },
            { id: 'b', text: 'Double what you think you\'ll need' },
            { id: 'c', text: 'Borrow money' },
          ],
          correct: 'b',
        },
        {
          kind:     'true-false',
          id:       'd6',
          prompt:   'Luna recommends not planning past the first week of the trip.',
          correct:  'T',
          explain:  'Direct quote: "don\'t plan past the first week."',
        },
        {
          kind:     'true-false',
          id:       'd7',
          prompt:   'Luna travelled with a friend the whole time.',
          correct:  'F',
          explain:  'It\'s a podcast about SOLO travel.',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Go back to the transcript and spot these five expressions. They\'re not isolated vocabulary — they\'re chunks that let you sound natural without thinking about grammar.',
      chunks: [
        {
          id:       'c1',
          chunk:    'to end up —ing',
          category: 'grammar-pattern',
          gloss:    'to finish doing something you didn\'t plan',
          example:  '"I\'d just end up adding another stop."',
          notice:   'Always followed by a gerund (-ing). Marks an unplanned outcome. Compare with "I decided to add another stop" — much more intentional.',
        },
        {
          id:       'c2',
          chunk:    '(sth) blew my mind / away',
          category: 'idiom',
          gloss:    'something completely amazed me',
          example:  '"That blew me away."',
          notice:   'Simple past of "blow" → BLEW, not "blowed". Almost always with "mind" or "away".',
        },
        {
          id:       'c3',
          chunk:    'off the beaten path',
          category: 'idiom',
          gloss:    'away from the usual tourist routes',
          example:  '"The kind of place that\'s really off the beaten path."',
          notice:   'Works as an adjective (after a noun) or an adverb. Opposite: "a tourist trap".',
        },
        {
          id:       'c4',
          chunk:    'a bit of both',
          category: 'discourse-marker',
          gloss:    'a mix of the two / it depends',
          example:  '"A bit of both."',
          notice:   'Short answer when someone asks "A or B?" and both are partly true. Very natural.',
        },
        {
          id:       'c5',
          chunk:    'I\'d [verb] + I\'d [verb]',
          category: 'grammar-pattern',
          gloss:    '"would" for past habits',
          example:  '"I\'d eat street food… I\'d crash at hostel dorms."',
          notice:   '"Would" (= I\'d) describes past habits, like "used to" but more conversational once the time frame is clear.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Use the chunks from the previous step in these mini-tasks.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: 'The concert last night ___ my mind — I\'ve never seen anything like it.',
          answers:  ['blew'],
          hint:     'Simple past of the verb.',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: 'We were going to stay one night, but we ___ up staying for a week.',
          answers:  ['ended'],
          hint:     'Unplanned outcome.',
        },
        {
          kind: 'mcq',
          id: 'cp3',
          prompt: '"Were you happy with the hotel OR the beach?" → the most natural-sounding answer is:',
          options: [
            { id: 'a', text: 'Yes, I was.' },
            { id: 'b', text: 'A bit of both.' },
            { id: 'c', text: 'I don\'t know.' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: 'Back in college, I ___ study at the library every night and ___ grab coffee on the way home.',
          answers:  ['would', 'would'],
          alts:     [['\'d'], ['\'d']],
          hint:     'Past habit — contracted form is fine.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'Which of these places is "off the beaten path"?',
          options: [
            { id: 'a', text: 'Times Square, New York' },
            { id: 'b', text: 'The Eiffel Tower' },
            { id: 'c', text: 'A fishing village with no name on the map' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Your turn to speak like Luna. You\'re going to record 60 seconds — try to use at least 3 of the chunks from this lesson.',
      mode:         'speaking',
      prompt:       'Tell a travel story (real or invented) where you ended up doing something that WASN\'T planned. What happened? How did you feel? What did you learn? Minimum 60 seconds.',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
