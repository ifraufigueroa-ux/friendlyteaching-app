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
        id: 'laura', displayName: 'Laura', accent: 'UK', gender: 'f',
        suggestedVoice: {
          voiceId: 'Xb7hH8MSUJpSbSDYk0k2',
          name:    'Alice',
          note:    'ElevenLabs · UK professional female — proved natural on the BEC lesson. Teacher feedback 2026-11-27: swapped in after Grace/Antoni sounded synthetic on the first bake.',
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
        { id: 'li1', prompt: 'Have you ever lived near something very big — a highway, a factory, a shopping centre — that changed the feeling of the street? What changed? And what did people in the neighbourhood do about it?', hint: 'Could be noise, traffic, prices, a view you used to see. A short story works best.' },
        { id: 'li2', prompt: 'If a big tech company offered three hundred good jobs to a small town, but it needed a lot of the town\'s water to run its machines, would that trade be fair? What would make it fair — or unfair?' },
        { id: 'li3', prompt: 'Why do you think many of the newest tech buildings are going to small rural towns, instead of to big cities? What do the towns get, and what do the towns risk?' },
        { id: 'li4', prompt: 'Who should decide what a community accepts — the people who live there, the mayor, the company that is spending the money, or someone else? What would feel right to you?', hint: 'This is a critical-thinking question, not a trick. Say what feels fair, and say WHY.' },
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
          prompt: '"They have changed their well pump twice." This sentence tells us the García family…',
          options: [
            { id: 'a', text: 'have changed the pump twice, and the result still matters now' },
            { id: 'b', text: 'are planning to change the pump twice during the coming year' },
            { id: 'c', text: 'changed the pump twice, many years ago, before we moved in' },
            { id: 'd', text: 'always change the pump twice as part of a yearly maintenance' },
          ],
          correct: 'a',
          explain: 'Present perfect ("have changed") + a regular past participle ("changed") = a past action with a result that is still in the room now.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"People have waited long enough" means they…',
          options: [
            { id: 'a', text: 'will wait a few more weeks before deciding next' },
            { id: 'b', text: 'have waited for answers, and now they want them' },
            { id: 'c', text: 'have agreed that waiting is the best way to protest' },
            { id: 'd', text: 'have stopped speaking at the town meetings entirely' },
          ],
          correct: 'b',
          explain: '"Have waited" (regular) = action done up to now. "Long enough" = that time is over.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"Transparency" here means the community wants the company to…',
          options: [
            { id: 'a', text: 'hire local workers in every single available job' },
            { id: 'b', text: 'explain openly what it does and what it plans' },
            { id: 'c', text: 'pay more taxes to the town hall every quarter' },
            { id: 'd', text: 'install new streetlights around the data campus' },
          ],
          correct: 'b',
          explain: 'Transparency = openness. You can see through it. No hidden parts.',
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
            { id: 'a', text: 'Just over a year — around fourteen months in total' },
            { id: 'b', text: 'Only a few months — since early this summer' },
            { id: 'c', text: 'Just over three years — since the last election' },
            { id: 'd', text: 'More than ten years — since before the council' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What do the neighbours mostly want from the company?',
          options: [
            { id: 'a', text: 'The company to shut down and leave the whole valley' },
            { id: 'b', text: 'A straight answer at an open public town meeting' },
            { id: 'c', text: 'Enough money to buy a new big community centre' },
            { id: 'd', text: 'A written promise never to expand the campus again' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What will probably be the biggest moment of the evening?',
          options: [
            { id: 'a', text: 'A long speech from the mayor about our economy' },
            { id: 'b', text: 'The vote on whether to build a new school wing' },
            { id: 'c', text: 'Whether anyone from the company sits in the hall' },
            { id: 'd', text: 'A song at the end performed by the local choir' },
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
          prompt: 'Why does Marco want to tell the stories before the numbers?',
          options: [
            { id: 'a', text: 'The numbers are not finished and need more time' },
            { id: 'b', text: 'Laura prefers numbers to come after the stories' },
            { id: 'c', text: 'The people matter more than the spreadsheet does' },
            { id: 'd', text: 'Numbers always arrive late to a town hall meeting' },
          ],
          correct: 'c',
          explain: 'Laura says, "Please. The people first." Marco starts with the García family.',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What has Laura done so far to reach the company?',
          options: [
            { id: 'a', text: 'Hired a lawyer to send a formal complaint by mail' },
            { id: 'b', text: 'Shared the issue only in private with the mayor' },
            { id: 'c', text: 'Called them and emailed them, but got no reply' },
            { id: 'd', text: 'Visited the campus gate in person every Monday' },
          ],
          correct: 'c',
          explain: '"I have called. I have emailed." Present perfect of regular verbs = actions already done, result still felt now.',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Marco believes the neighbours are mainly asking for the company to leave.',
          correct: 'F',
          explain: '"Quiet is not what we are asking for. We are asking to be told the truth." They want transparency, not shutdown.',
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
          prompt: 'In how many years before now did the García family never need to change the well pump?',
          options: [
            { id: 'a', text: 'Six months, since they just moved into the new house' },
            { id: 'b', text: 'Fifteen years, with one previous replacement already done' },
            { id: 'c', text: 'A whole century, passed through three family generations' },
            { id: 'd', text: 'Forty years, and not a single change in all that time' },
          ],
          correct: 'd',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'The Sullivans\' power bill is described as…',
          options: [
            { id: 'a', text: 'Lower than it used to be, thanks to a new local deal' },
            { id: 'b', text: 'Roughly the same as before, with no big change so far' },
            { id: 'c', text: 'Paid directly by the town hall after the new contract' },
            { id: 'd', text: 'Higher than ever, every month since January this year' },
          ],
          correct: 'd',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'The company promised three hundred jobs. What did Marco say about who actually works there?',
          options: [
            { id: 'a', text: 'Forty-seven, and twelve of them are security guards from out of town' },
            { id: 'b', text: 'One hundred and ten, mostly engineers from a nearby large city' },
            { id: 'c', text: 'Three hundred, split evenly between the surrounding local villages' },
            { id: 'd', text: 'Zero workers so far, because the hiring process has not opened yet' },
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
          prompt: 'If anyone from the company comes to the meeting, what will Marco ask first?',
          options: [
            { id: 'a', text: 'Why the company picked this specific valley to build the new campus' },
            { id: 'b', text: 'What they have changed in the valley, and what they have asked us about' },
            { id: 'c', text: 'How much profit the campus is really making for them every quarter' },
            { id: 'd', text: 'Which engineer designed the cooling system for the servers upstairs' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd7',
          prompt: 'Laura remembers that when her grandmother lived there, the valley was…',
          options: [
            { id: 'a', text: 'Already a small centre for a different kind of industry' },
            { id: 'b', text: 'A busy market valley full of weekend fairs and music' },
            { id: 'c', text: 'Mostly empty, with just a few scattered family farms' },
            { id: 'd', text: 'The quietest valley in the county, no hum at the night' },
          ],
          correct: 'd',
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Marco and Laura decide they are not willing to share the valley on any terms.',
          correct: 'F',
          explain: '"If they sit with us, we can share this valley." The condition is honest conversation, not refusal.',
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
          sentence: '"Somebody has to ___ ___ at the meeting tonight — nobody should go home still wondering what the company is doing."',
          answers:  ['speak', 'up'],
          hint:     'Phrasal verb from the vocab list — say what you think when others are silent.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses the present perfect with "since" correctly?',
          options: [
            { id: 'a', text: 'Since the data centre open, the valley has changed a lot now.' },
            { id: 'b', text: 'Since the data centre opened, the valley has changed a lot.' },
            { id: 'c', text: 'Since the data centre opens, the valley has changed a lot now.' },
            { id: 'd', text: 'Since the data centre opened, the valley changes a lot now.' },
          ],
          correct: 'b',
          explain: '"Since + past simple + present perfect": opened (past) → has changed (present perfect of a regular verb).',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"The council has ___ ___ our water, and they have ___ to many neighbours this month." (two phrasal verbs from the vocab, both regular in the past — fill in all three gaps)',
          answers:  ['looked', 'into', 'talked'],
          hint:     'Investigate the water, then talk to the neighbours. Both past participles are regular (-ed).',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Which sentence sounds the most natural at B1 — a superlative with the right preposition?',
          options: [
            { id: 'a', text: 'This is the biggest building in our entire county.' },
            { id: 'b', text: 'This is the biggest building of our entire county.' },
            { id: 'c', text: 'This is the most big building in our entire county.' },
            { id: 'd', text: 'This is the building biggest in our entire county.' },
          ],
          correct: 'a',
          explain: 'Order: "the + -est + noun + in + place". "In" for the area, and short adjective + "-est", not "most".',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: '"The neighbours have ___ for an answer for fourteen months, but tonight they ___ out for the first time." (one phrasal verb from the vocab + its regular past participle, then another phrasal verb in its base form in future-with-will)',
          answers:  ['waited', 'will call'],
          hint:     'First gap: "wait for" in present perfect. Second gap: future "will" + phrasal verb in base form.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Step into the role of a neighbour in a small town that has just received a big new tech building. You are telling the story to a cousin who lives far away — no official register, no numbers you can\'t defend, just an honest, calm voice.',
      mode:         'speaking',
      prompt:       'Record 60-90 seconds. Say: (1) one real thing that has CHANGED in the town since the company arrived (sound, water, bills, the view — your choice), (2) one thing the town has NOT ANSWERED yet, (3) a question you would ask the company if they came to the next meeting, (4) what you would share with them — and what you would not share. Use at least 3 of: "since + past, has/have + -ed", "higher than ever", "the ___est ___ in the ___", "have you + -ed …?", "people have waited long enough".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
