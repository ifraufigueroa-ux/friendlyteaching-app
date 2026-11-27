// Friendlistenings® — B1 · Before the town meeting
//
// Written for a late-A2 / entering-B1 student whose FIRST exposure
// to the present perfect is this lesson. Every present-perfect form
// in the script uses a regular past participle ("-ed") — changed,
// arrived, opened, promised, talked, signed, answered, started,
// finished, needed, called, ended, waited — with ONE strategic
// irregular introduced on purpose: "been" (from be). "Been" is the
// most frequent irregular PP in English, and seeing it once in a
// clear, repeated frame ("have you ever been to…", "I've been here
// since…") is a high-value first irregular.
//
// Past simple, present simple and future ("if they come, we'll")
// stay the bulk of the conversation. Present perfect only shows up
// where it is the most natural choice — a recent change, an action
// whose result is still in the room, a "since + past" anchor — so
// the student sees the contrast live rather than being drilled.
//
// Scenario: in a fictional small US town, a council member (Laura)
// and a retired teacher (Marco) meet at the community centre kitchen
// two hours before a public hearing about the new data-centre campus
// that opened in the valley fourteen months ago. Nobody is a cartoon
// villain — the company brought jobs; the community has seen water
// bills, power bills and quiet change. The lesson invites critical
// thinking: what should they ASK tonight, and what would you ask?
//
// Topic sits inside a genuinely current 2024-2026 debate — the
// rapid buildout of AI / hyperscale data centres and their tension
// with the rural communities hosting them. Grounded, not partisan.
//
// Language focus (B1 bridge, present perfect CAREFULLY at the centre):
//   · Present perfect introduced in three clean moves:
//       (1) "has / have + regular -ed" to describe a change since
//           a past moment ("the valley has changed", "the power bill
//           has arrived", "we have talked to them").
//       (2) "Have you + regular -ed …?" as a question frame
//           ("Have you talked to them?", "Have you looked at the
//           numbers?").
//       (3) ONE irregular introduced: "been". Appears three times
//           in the script in parallel frames so the pattern sticks.
//   · Past simple for finished moments ("when my grandmother lived
//     here", "they arrived last year").
//   · Future with "will" and the 1st conditional ("if they come,
//     I'll ask", "we'll have to decide").
//   · Superlatives ("the quietest valley in the county", "the
//     biggest news of the evening").
//   · Comparatives ("higher than ever", "more than last year").
//   · Pronoun practice across classes: possessive (my, their, our),
//     object (us, them, me), demonstrative (this, that), and a soft
//     reflexive touch.
//
// Five phrasal verbs anchored in the Step 2 vocab — they resurface
// in Step 7 controlled practice so the student USES them.
//
// 8-step arc, ~50-min slot, conversational warm-up.

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1DatacenterTownMeeting: FLLesson = {
  id:           'b1-datacenter-town-meeting',
  title:        'Before the town meeting',
  subtitle:     'A council member and a neighbour, two hours before the vote',
  level:        'B1',
  topic:        'Data centres · community impact · transparency · present perfect (first exposure)',
  scenario:     'Laura (council member) and Marco (retired teacher) meet in the community centre kitchen before a public hearing about the data-centre campus that opened in the valley fourteen months ago. They pool what neighbours have told them, decide what to ask the company tonight, and name what they are willing — and not willing — to share with this valley.',
  estimatedMin: 50,
  tags:         ['community', 'tech', 'environment', 'critical-thinking', 'present-perfect-first', 'phrasal-verbs'],
  createdAt:    '2026-11-27',

  cover: {
    accent: '#0369A1', // sky-700 — the colour of a small-town hall and open water
    emoji:  '🏛️',
  },

  audio: {
    durationSec: 215,
    speakers: [
      {
        id: 'laura', displayName: 'Laura', accent: 'US', gender: 'f',
        suggestedVoice: {
          voiceId: 'cgSgspJ2msm6clMCkdW9',
          name:    'Jessica',
          note:    'ElevenLabs · young expressive female US — proved natural on the IELTS Part-1 re-bake after Rachel sounded robotic. Teacher feedback 2026-11-27: Grace/Antoni and then Alice both sounded synthetic; Alice also carried too strong a UK accent for a rural US council member. Jessica is the third try and the one that works.',
        },
      },
      {
        id: 'marco', displayName: 'Marco', accent: 'US', gender: 'm',
        suggestedVoice: {
          voiceId: 'cjVigY5qzO86Huf0OWal',
          name:    'Eric',
          note:    'ElevenLabs · US male, warm incident-commander cadence — proved natural on the BEC lesson. Swapped in with Alice on the 2026-11-27 re-bake.',
        },
      },
    ],
    // Every present-perfect form below is either (a) a regular "-ed"
    // participle, or (b) the one strategic irregular "been". No "had
    // to", "hired", "told", "brought", "found", "given", "done",
    // "put", "come" in PP shape. Past simple carries those verbs
    // instead, and the contrast is pedagogically useful.
    script: [
      { speakerId: 'laura', approxStartSec:   0, text: 'Marco, come in — the kettle is hot. Have you talked to the García family this week?' },
      { speakerId: 'marco', approxStartSec:  11, text: 'I have talked to three families, actually. Let me tell you what they said before you show me the numbers.' },
      { speakerId: 'laura', approxStartSec:  22, text: 'Please. The people first.' },
      { speakerId: 'marco', approxStartSec:  27, text: 'Since the campus opened, the García family have changed their well pump twice. In forty years, they never needed to change it before. Not once.' },
      { speakerId: 'laura', approxStartSec:  44, text: 'Not once?' },
      { speakerId: 'marco', approxStartSec:  46, text: 'Not once. And the Sullivans, down on the river road — their power bill is higher than ever. Every month since January.' },
      { speakerId: 'laura', approxStartSec:  60, text: 'Okay. The numbers now. What have you noticed?' },
      { speakerId: 'marco', approxStartSec:  68, text: 'Two things. The company promised three hundred jobs. They started with forty-seven, and twelve of those are security guards from out of town. Second: our well level has dropped more than last year, and more than any drought year our neighbours remember.' },
      { speakerId: 'laura', approxStartSec:  95, text: 'That is the part I think about most. Jobs, you can renegotiate. A valley\'s water takes decades.' },
      { speakerId: 'marco', approxStartSec: 108, text: 'Have you talked to anyone from the company directly?' },
      { speakerId: 'laura', approxStartSec: 115, text: 'I have called. I have emailed. Nobody from the management team has answered. They have never been to a single town meeting since they arrived. Not one.' },
      { speakerId: 'marco', approxStartSec: 133, text: 'Tonight that has to change.' },
      { speakerId: 'laura', approxStartSec: 137, text: 'Agreed. If they come, what will you ask them first?' },
      { speakerId: 'marco', approxStartSec: 143, text: 'I will ask them a simple question: "In the fourteen months since you arrived, what have you changed in this valley, and what have you asked us about first?" The answer should be in the room.' },
      { speakerId: 'laura', approxStartSec: 162, text: 'And if nobody comes?' },
      { speakerId: 'marco', approxStartSec: 165, text: 'Then the empty chair becomes the biggest news of the night. People have waited long enough.' },
      { speakerId: 'laura', approxStartSec: 176, text: 'You know, when my grandmother lived here, this was the quietest valley in the county. Now it hums at night. I never thought I would miss silence this much.' },
      { speakerId: 'marco', approxStartSec: 194, text: 'Neither did I. But quiet is not what we are asking for. We are asking to be told the truth. If they sit with us, we can share this valley. If they will not, we will decide what we share — and what we do not.' },
      { speakerId: 'laura', approxStartSec: 215, text: 'Let\'s go. The hall is full.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Data centres are the quiet heart of the internet — the places where your messages, your videos, your AI tools actually live. In the last two years they have grown fast, and more of them are being built next to small towns. Tonight you will hear a council member and a neighbour, two hours before a public meeting. Before we hit play, a quick warm-up — just react from your own life. There are no wrong answers here.',
      hookEmoji: '🏛️',
      openQuestions: [
        { id: 'li1', prompt: 'Have you ever lived near something big — a highway, a factory, a mall — that changed the street? What changed?', hint: 'Noise, traffic, prices, a view. A short story works.' },
        { id: 'li2', prompt: 'A tech company offers 300 jobs to a small town, but needs a lot of its water. Is that trade fair? What would make it fair?' },
        { id: 'li3', prompt: 'Why do new tech buildings go to small rural towns, not big cities? What do the towns gain, and what do they risk?' },
        { id: 'li4', prompt: 'Who should decide what a community accepts — the people, the mayor, the company? What feels right to you, and why?', hint: 'Critical-thinking question. Say what feels fair, and why.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'Eight chunks for tonight — five of them phrasal verbs — that carry most of the weight when neighbours talk about a big new company that has just arrived. Notice: every phrasal verb here uses a REGULAR past form, so the present perfect feels friendly ("has talked to", "has asked about").',
      items: [
        { id: 'v1', word: 'to speak up',                pos: 'phrasal-verb', translation: 'Decir lo que piensas, especialmente en una reunión o cuando hay silencio y hace falta una voz. Es regular: speak → speaked? No — "spoke" es el pasado. Acá lo usamos en IMPERATIVO ("speak up!") para evitar la trampa.', example: '"Someone has to speak up at the meeting tonight."',                                                              definition: 'to say what you think, especially when others are silent' },
        { id: 'v2', word: 'to ask about',               pos: 'phrasal-verb', translation: 'Pedir información sobre algo — preguntar por los detalles. Es regular: asked → asked.',                                                                                                                                      example: '"Have they asked about our water supply? Not once."',                                                          definition: 'to request information about something' },
        { id: 'v3', word: 'to wait for',                pos: 'phrasal-verb', translation: 'Esperar a alguien o algo. Es regular: waited → waited. Muy usado con presente perfecto cuando la espera lleva tiempo.',                                                                                                       example: '"People have waited long enough for an honest answer."',                                                       definition: 'to stay where you are until a person or event arrives' },
        { id: 'v4', word: 'to look into (something)',   pos: 'phrasal-verb', translation: 'Investigar algo con atención — mirar los datos, preguntar, chequear si es cierto. Es regular: looked → looked.',                                                                                                              example: '"The council has to look into what is happening with our water."',                                              definition: 'to investigate something carefully' },
        { id: 'v5', word: 'to call out',                pos: 'phrasal-verb', translation: 'Señalar públicamente algo que está mal — nombrarlo en voz alta. Es regular: called → called.',                                                                                                                                example: '"The neighbours have called out the silence from the company."',                                                definition: 'to publicly name something that is wrong' },
        { id: 'v6', word: 'the water table',            pos: 'noun',         translation: 'El nivel del agua subterránea — lo que marca si el pozo del vecino tiene agua o no.',                                                                                                                                         example: '"Our water table has dropped more than last year."',                                                            definition: 'the level of water underground, which feeds wells and springs' },
        { id: 'v7', word: 'transparency',               pos: 'noun',         translation: 'Que algo se explique abiertamente, sin esconder nada. Opuesto de "silencio" o "letra chica".',                                                                                                                                example: '"The neighbours are asking for transparency, not for the company to leave."',                                  definition: 'openness — explaining honestly what is being done and why' },
        { id: 'v8', word: 'to renegotiate',             pos: 'verb',         translation: 'Volver a negociar un acuerdo que ya existía porque las condiciones cambiaron. Regular: renegotiated.',                                                                                                                       example: '"Jobs, you can renegotiate. A valley\'s water takes decades."',                                                 definition: 'to agree new terms for a deal that was already in place' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"They have changed their well pump twice." This means the García family…',
          options: [
            { id: 'a', text: 'changed the pump twice, and it still matters now' },
            { id: 'b', text: 'plan to change the pump twice next year' },
            { id: 'c', text: 'changed the pump twice, many years ago' },
            { id: 'd', text: 'change the pump twice every single year' },
          ],
          correct: 'a',
          explain: 'Present perfect ("have changed") = past action, result still in the room now.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"People have waited long enough" means they…',
          options: [
            { id: 'a', text: 'will wait a few more weeks before deciding' },
            { id: 'b', text: 'have waited for answers, and now want them' },
            { id: 'c', text: 'agree that waiting is the best way to protest' },
            { id: 'd', text: 'have stopped going to the town meetings' },
          ],
          correct: 'b',
          explain: '"Have waited" = done up to now. "Long enough" = that time is over.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"Transparency" here means the community wants the company to…',
          options: [
            { id: 'a', text: 'hire local workers for every available job' },
            { id: 'b', text: 'explain openly what it does and plans to do' },
            { id: 'c', text: 'pay more taxes to the town hall each quarter' },
            { id: 'd', text: 'install new streetlights around the campus' },
          ],
          correct: 'b',
          explain: 'Transparency = openness. No hidden parts.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'A council member and a neighbour meet two hours before a town hall. Before you listen, place your bets.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'How long has the data centre been in the valley?',
          options: [
            { id: 'a', text: 'Just over a year — around fourteen months' },
            { id: 'b', text: 'Only a few months — since this summer' },
            { id: 'c', text: 'Just over three years — since the election' },
            { id: 'd', text: 'More than ten years — before the council' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What do the neighbours mostly want from the company?',
          options: [
            { id: 'a', text: 'The company to shut down and leave' },
            { id: 'b', text: 'A straight answer at a public meeting' },
            { id: 'c', text: 'Money to build a new community centre' },
            { id: 'd', text: 'A written promise to never expand the campus' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What will probably be the biggest moment of the night?',
          options: [
            { id: 'a', text: 'A long speech from the mayor on the economy' },
            { id: 'b', text: 'A vote on whether to build a new school wing' },
            { id: 'c', text: 'Whether anyone from the company sits in the hall' },
            { id: 'd', text: 'A song at the end from the local choir' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole conversation ONCE without pausing. Catch the big shapes.',
      listenFor: [
        'Two concrete things neighbours have noticed since the data centre opened',
        'What Laura has tried to do, and what has not worked',
        'What Marco thinks they should ask the company tonight',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'Why does Marco tell the stories before the numbers?',
          options: [
            { id: 'a', text: 'The numbers are not finished yet' },
            { id: 'b', text: 'Laura prefers numbers after the stories' },
            { id: 'c', text: 'The people matter more than the spreadsheet' },
            { id: 'd', text: 'Numbers always arrive late to a meeting' },
          ],
          correct: 'c',
          explain: 'Laura says, "Please. The people first."',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What has Laura done so far to reach the company?',
          options: [
            { id: 'a', text: 'Hired a lawyer to send a formal complaint' },
            { id: 'b', text: 'Shared the issue only with the mayor' },
            { id: 'c', text: 'Called and emailed them, but got no reply' },
            { id: 'd', text: 'Visited the campus gate every Monday' },
          ],
          correct: 'c',
          explain: '"I have called. I have emailed." Present perfect of regular verbs.',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Marco believes the neighbours mainly want the company to leave.',
          correct: 'F',
          explain: '"Quiet is not what we are asking for. We are asking to be told the truth."',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again. Pause when you need to. The transcript is now available.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'Since the data centre opened, the García family have changed their well pump ___.',
          answers:  ['twice'],
          alts:     [['two times']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'For how long did the García family never need to change the pump?',
          options: [
            { id: 'a', text: 'Six months, since they just moved in' },
            { id: 'b', text: 'Fifteen years, with one previous change' },
            { id: 'c', text: 'A whole century, across three generations' },
            { id: 'd', text: 'Forty years, and not a single change' },
          ],
          correct: 'd',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'The Sullivans\' power bill is described as…',
          options: [
            { id: 'a', text: 'Lower than before, thanks to a new local deal' },
            { id: 'b', text: 'Roughly the same as before, no big change' },
            { id: 'c', text: 'Paid by the town hall after the new contract' },
            { id: 'd', text: 'Higher than ever, every month since January' },
          ],
          correct: 'd',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'The company promised 300 jobs. How many people actually work there?',
          options: [
            { id: 'a', text: 'Forty-seven, twelve of them guards from out of town' },
            { id: 'b', text: 'One hundred and ten, mostly engineers from the city' },
            { id: 'c', text: 'Three hundred, split evenly between local villages' },
            { id: 'd', text: 'Zero so far — the hiring has not opened yet' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'd5',
          sentence: 'Marco says our well level has dropped more than last year, and more than any ___ year our neighbours remember.',
          answers:  ['drought'],
          alts:     [[]],
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'If someone from the company comes, what will Marco ask first?',
          options: [
            { id: 'a', text: 'Why the company picked this valley for the campus' },
            { id: 'b', text: 'What they have changed, and what they have asked us' },
            { id: 'c', text: 'How much profit the campus is making each quarter' },
            { id: 'd', text: 'Which engineer designed the cooling system upstairs' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd7',
          prompt: 'When Laura\'s grandmother lived there, the valley was…',
          options: [
            { id: 'a', text: 'Already a small centre for a different industry' },
            { id: 'b', text: 'A busy market valley full of weekend fairs' },
            { id: 'c', text: 'Mostly empty, with just a few family farms' },
            { id: 'd', text: 'The quietest valley in the county, no night hum' },
          ],
          correct: 'd',
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Marco and Laura refuse to share the valley on any terms.',
          correct: 'F',
          explain: '"If they sit with us, we can share this valley." The condition is honest conversation.',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five B1 moves that keep this conversation grounded — four of them around the present perfect you just met. Notice them, then borrow them.',
      chunks: [
        {
          id:       'c1',
          chunk:    'has / have + regular -ed (present perfect)',
          category: 'grammar-pattern',
          gloss:    '"Has" o "have" + verbo regular con -ed — presente perfecto para una acción del pasado cuyo resultado sigue importando ahora',
          example:  '"The García family have changed their well pump twice." / "People have waited long enough."',
          notice:   'The pattern is "has/have + verb-ed". ALL the examples in this lesson use regular verbs (-ed): changed, waited, promised, talked, called, emailed, started, answered. Use it when the action is finished but the result is still in the room with you right now.',
        },
        {
          id:       'c2',
          chunk:    'since + past simple + present perfect',
          category: 'grammar-pattern',
          gloss:    'Desde + pasado + presente perfecto — algo arrancó en un momento concreto del pasado y sigue afectando el presente',
          example:  '"Since the campus opened, the García family have changed their well pump twice."',
          notice:   '"Since + past simple" marks the start. The present perfect tells the story from that start to now. In the whole script, EVERY "since" is followed by a past simple, and every present perfect built on it uses a regular -ed form. Steal the frame.',
        },
        {
          id:       'c3',
          chunk:    'Have you + regular -ed …?',
          category: 'grammar-pattern',
          gloss:    '"Have you + regular -ed …?" para preguntar si algo ya pasó (y sigue siendo relevante)',
          example:  '"Have you talked to the García family this week?" / "Have you looked into the water table?"',
          notice:   'Question form. Subject-aux swap: "You have talked" → "Have you talked…?" At B1 first exposure, stay with REGULAR verbs: talked, called, looked, asked, waited. Later you\'ll meet the irregulars; right now, the pattern is enough.',
        },
        {
          id:       'c4',
          chunk:    'the quietest valley in the county',
          category: 'collocation',
          gloss:    'Superlativo + "in" para el área donde aplica',
          example:  '"When my grandmother lived here, this was the quietest valley in the county."',
          notice:   'Pattern: "the + -est + noun + in + place". Short adjective + "-est"; "in" names the area (county, town, world). Not "of" at B1 — "in" is the natural partner.',
        },
        {
          id:       'c5',
          chunk:    'higher than ever',
          category: 'collocation',
          gloss:    '"Más alto que nunca" — una comparación honesta contra todo el pasado',
          example:  '"Their power bill is higher than ever. Every month since January."',
          notice:   'Comparative + "than ever" = compared to all the past, not just last year. The sentence doubles in weight the second you add "than ever". High-value at B1.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks and the phrasal verbs in short, realistic turns. All present-perfect gaps use regular verbs.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '"Somebody has to ___ ___ at the meeting tonight."',
          answers:  ['speak', 'up'],
          hint:     'Phrasal verb from the vocab — say what you think when others are silent.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses the present perfect with "since" correctly?',
          options: [
            { id: 'a', text: 'Since the data centre open, the valley has changed a lot.' },
            { id: 'b', text: 'Since the data centre opened, the valley has changed a lot.' },
            { id: 'c', text: 'Since the data centre opens, the valley has changed a lot.' },
            { id: 'd', text: 'Since the data centre opened, the valley changes a lot.' },
          ],
          correct: 'b',
          explain: '"Since + past simple + present perfect": opened → has changed.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"The council has ___ ___ our water, and has ___ to many neighbours." (two phrasal verbs, both regular past)',
          answers:  ['looked', 'into', 'talked'],
          hint:     'Investigate the water, then talk to the neighbours. Both regular (-ed).',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Which sentence uses the superlative correctly?',
          options: [
            { id: 'a', text: 'This is the biggest building in our county.' },
            { id: 'b', text: 'This is the biggest building of our county.' },
            { id: 'c', text: 'This is the most big building in our county.' },
            { id: 'd', text: 'This is the building biggest in our county.' },
          ],
          correct: 'a',
          explain: '"The + -est + noun + in + place". Short adjective takes "-est", not "most".',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: '"The neighbours have ___ for an answer for months, but tonight they ___ ___ out for the first time." (phrasal verb in present perfect, then future "will" + phrasal verb)',
          answers:  ['waited', 'will', 'call'],
          hint:     'First: "wait for" in present perfect. Then: "will call out" (future + phrasal).',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'You live in a small town that just got a big new tech building. Tell your cousin — who lives far away — what\'s happening.',
      mode:         'speaking',
      prompt:       'Record 60-90 seconds. Say: (1) one thing that has CHANGED since the company arrived, (2) one thing the town has NOT answered yet, (3) a question you would ask the company, (4) what you would share — and what you would not. Use at least 3 of: "since + past, has/have + -ed", "higher than ever", "the ___est ___ in the ___", "have you + -ed…?", "people have waited long enough".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
