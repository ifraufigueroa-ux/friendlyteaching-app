// Friendlistenings® — B2 · The go-around on 27
//
// Two air traffic controllers — Alice (approach, 20 yrs experience) and
// Charlie (tower, 3 yrs) — talk at shift change about a go-around that
// happened an hour earlier. A heavy jet that landed ahead rolled out
// slowly; the trailing narrowbody caught up, Charlie called the abort,
// and now they're walking through what happened.
//
// Register is natural B2 professional debrief — narrative past (simple +
// continuous + perfect contrasts), hedging ("it looked fine on paper",
// "not ideal", "to be fair"), discourse markers ("in hindsight", "the
// thing is"), and a handful of aviation collocations the runner glosses
// in Spanish. Deliberately NOT ICAO phraseology — the point is listening
// skill, not radiotelephony.
//
// 8-step arc, ~45 min slot:
//   1. Lead-in    · 4 min  — ATC schema + "when have YOU had to abort?"
//   2. Vocab      · 8 min  — 8 chunks (aviation + transferable) + 3 checks
//   3. Prediction · 3 min  — who do they blame?
//   4. Gist       · 6 min  — what happened + the overall verdict
//   5. Detail     · 10 min — runway, aircraft types, timing, decisions
//   6. Awareness  · 6 min  — 5 B2 chunks for professional debrief
//   7. Controlled · 5 min  — reuse the chunks
//   8. Production · 5 min  — 60-sec speaking: a close call of your own

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB2AtcGoAround: FLLesson = {
  id:           'b2-atc-go-around',
  title:        'The go-around on 27',
  subtitle:     'Two controllers compare notes at shift change',
  level:        'B2',
  topic:        'Air traffic control debrief · narrative past · professional hedging',
  scenario:     'Alice (approach controller, 20 years in the role) and Charlie (tower controller, 3 years in) sit down after their shift to walk through the aborted landing that happened an hour earlier on runway 27.',
  estimatedMin: 45,
  tags:         ['aviation', 'atc', 'narrative-past', 'professional-debrief', 'hedging'],
  createdAt:    '2026-11-20',

  cover: {
    accent: '#1E3A8A',
    emoji:  '🛫',
  },

  audio: {
    durationSec: 195,
    speakers: [
      {
        id: 'alice', displayName: 'Alice', accent: 'UK', gender: 'f',
        suggestedVoice: { voiceId: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', note: 'ElevenLabs · UK female, calm and measured — reads as a senior approach controller reviewing the shift' },
      },
      {
        id: 'charlie', displayName: 'Charlie', accent: 'UK', gender: 'm',
        suggestedVoice: { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', note: 'ElevenLabs · UK male, late 20s — tower controller a few years in, slightly rattled but professional' },
      },
    ],
    script: [
      { speakerId: 'alice',   approxStartSec:   0, text: 'So. The go-around. Walk me through it from your side — I\'ve got my radar tapes but I want your version first.' },
      { speakerId: 'charlie', approxStartSec:   9, text: 'Yeah. So the lead was the Dash — the one coming in from the north — and behind him you had my narrowbody, the Airbus. On paper the spacing was textbook. Five miles on final, both stable.' },
      { speakerId: 'alice',   approxStartSec:  25, text: 'Which is what I had on the scope. That\'s why I handed him off without a second thought.' },
      { speakerId: 'charlie', approxStartSec:  31, text: 'Right. But the Dash touched down fine, and then he just… sat there. He didn\'t roll. I was watching the Airbus closing in and I was waiting for the Dash to clear at Golf, like he\'d briefed. He didn\'t take Golf. He didn\'t take Hotel either. He kept rolling slowly.' },
      { speakerId: 'alice',   approxStartSec:  53, text: 'Did he say why?' },
      { speakerId: 'charlie', approxStartSec:  56, text: 'Afterwards, yeah. Brakes were acting up — not a failure, just squishy. He was going easy on them. In hindsight he probably should have called it earlier, but I get it. In the moment you\'re not thinking "I\'m blocking the next guy", you\'re thinking "I don\'t want to lock a wheel".' },
      { speakerId: 'alice',   approxStartSec:  78, text: 'And how close did the Airbus get?' },
      { speakerId: 'charlie', approxStartSec:  82, text: 'Honestly? Closer than I\'d like to say out loud. Maybe two and a half miles. I waited one more beat, saw the Dash still wasn\'t clear, and I called it. Told the Airbus to go around.' },
      { speakerId: 'alice',   approxStartSec:  97, text: 'Good call. That\'s textbook. It\'s not fun to make, but it\'s the right one every single time.' },
      { speakerId: 'charlie', approxStartSec: 106, text: 'The captain wasn\'t thrilled. You could hear it in the readback. But he complied immediately, which is all I needed.' },
      { speakerId: 'alice',   approxStartSec: 116, text: 'He\'ll be less annoyed when he reads the incident report. The thing is, if you\'d let him land you\'d have had a Dash still on the runway when his nose wheel touched. That\'s the one you\'d be explaining tomorrow, and it would be a much worse conversation.' },
      { speakerId: 'charlie', approxStartSec: 134, text: 'Yeah. Better safe than sorry.' },
      { speakerId: 'alice',   approxStartSec: 138, text: 'To be fair to you, the setup looked fine. The Dash shouldn\'t have been that slow off the deck. If I\'d known about his brakes I\'d have put more space between them, but he never mentioned it on approach.' },
      { speakerId: 'charlie', approxStartSec: 153, text: 'So what do we write up?' },
      { speakerId: 'alice',   approxStartSec: 157, text: 'Nothing dramatic. "Aborted approach due to preceding traffic not vacating runway in expected time." You note the brake issue the Dash reported on taxi. No blame. Put that you called the go-around at — what, two and a half miles?' },
      { speakerId: 'charlie', approxStartSec: 175, text: 'About that. I\'ll check the tape.' },
      { speakerId: 'alice',   approxStartSec: 179, text: 'Right. And next shift — if a lead reports any kind of brake niggle, I want to know on approach, not on the runway. I\'ll email ops. You go home.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'When things almost go wrong at work, the debrief afterwards is often as important as the moment itself. Today you\'ll hear two air traffic controllers walk through an aborted landing — not in jargon, but as two professionals thinking out loud.',
      hookEmoji: '🛫',
      openQuestions: [
        { id: 'li1', prompt: 'Have you ever had to abort / stop something at the last second because it stopped feeling safe? What was it and how did it end?' },
        { id: 'li2', prompt: 'Which is harder in your opinion — making a tough call in the moment, or defending that call to colleagues afterwards?' },
        { id: 'li3', prompt: 'When a co-worker makes the right decision but it causes a problem for someone else, how should you respond?', hint: 'Notice Alice\'s approach — she goes to "good call" before she goes to "but".' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'Eight chunks you\'ll hear — mixing aviation collocations with the kind of hedging adults use whenever something almost went wrong at work.',
      items: [
        { id: 'v1', word: 'a go-around',             pos: 'noun',        translation: 'Un "frustrado" / aterrizaje abortado: el avión descarta la aproximación, trepa y da la vuelta para intentarlo de nuevo.',     example: 'So. The go-around. Walk me through it.',                            definition: 'an aborted landing attempt; the aircraft climbs out and comes round again' },
        { id: 'v2', word: 'to call it',              pos: 'phrase',      translation: 'Tomar la decisión de parar / cortar algo. Transferible: también se usa fuera de aviación.',                                   example: 'I waited one more beat, saw he still wasn\'t clear, and I called it.', definition: 'to make the decision to stop / abort' },
        { id: 'v3', word: 'wake turbulence',         pos: 'phrase',      translation: 'Turbulencia de estela: el aire removido que deja un avión al pasar, peligroso para los que vienen detrás.',                    example: '(context: often cited in spacing discussions)',                       definition: 'disturbed air left behind a passing aircraft — a safety factor for anything flying through it' },
        { id: 'v4', word: 'in hindsight',            pos: 'phrase',      translation: 'En retrospectiva / mirándolo ahora. Clásico marcador de autocrítica medida.',                                                 example: 'In hindsight he probably should have called it earlier.',             definition: 'looking back now, with information we didn\'t have at the time' },
        { id: 'v5', word: 'to cut it close',         pos: 'phrase',      translation: 'Dejar algo demasiado al límite / por los pelos.',                                                                              example: 'Closer than I\'d like to say out loud. Maybe two and a half miles.',   definition: 'to leave very little margin — of time, space, or safety' },
        { id: 'v6', word: 'spacing',                 pos: 'noun',        translation: 'La separación entre aviones (en millas / segundos). "Textbook spacing" = la separación perfecta del manual.',                  example: 'On paper the spacing was textbook.',                                  definition: 'the distance kept between two aircraft; by extension: any orderly gap' },
        { id: 'v7', word: 'the deck',                pos: 'noun',        translation: 'Jerga de controlador para "la pista" (en inglés también "the runway"). Se usa coloquialmente entre pilotos y controladores.',  example: 'The Dash shouldn\'t have been that slow off the deck.',               definition: 'informal name for the runway (pilot/controller slang)' },
        { id: 'v8', word: 'better safe than sorry',  pos: 'idiom',       translation: 'Más vale prevenir que lamentar — expresión fija, idéntica en español como idea.',                                              example: 'Yeah. Better safe than sorry.',                                       definition: 'it\'s wiser to be cautious even if it turns out to have been unnecessary' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'A pilot "calls a go-around". This means they…',
          options: [
            { id: 'a', text: 'land as planned.' },
            { id: 'b', text: 'ask the controller for the weather again.' },
            { id: 'c', text: 'abort the landing, climb out, and come round for another try.' },
          ],
          correct: 'c',
          explain: 'A go-around is the aborted-landing maneuver. The plane breaks off, climbs away safely, and re-enters the pattern.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"We called it at the last minute" outside of aviation most naturally means…',
          options: [
            { id: 'a', text: 'we phoned the person at the last minute.' },
            { id: 'b', text: 'we decided to stop / not go ahead at the last minute.' },
            { id: 'c', text: 'we announced the decision in a shout.' },
          ],
          correct: 'b',
          explain: '"To call it" = to make the decision to stop. Transfers cleanly from ATC to meetings, matches, projects.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'Which sentence uses "in hindsight" correctly?',
          options: [
            { id: 'a', text: 'In hindsight I\'m going to book a hotel tomorrow.' },
            { id: 'b', text: 'In hindsight we really needed to leave an hour earlier.' },
            { id: 'c', text: 'In hindsight, be careful on the stairs.' },
          ],
          correct: 'b',
          explain: '"In hindsight" always looks BACKWARDS at a past situation with the information you have now.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Two controllers after a shift. One is senior (Alice, approach). One is early career (Charlie, tower). An aborted landing happened an hour ago.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'How will Alice probably open the conversation?',
          options: [
            { id: 'a', text: 'By blaming Charlie for the abort.' },
            { id: 'b', text: 'By asking Charlie to tell her what happened from HIS side first.' },
            { id: 'c', text: 'By ignoring the incident and talking about other things.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What will probably be the main cause of the go-around?',
          options: [
            { id: 'a', text: 'Bad weather near the airport.' },
            { id: 'b', text: 'An aircraft ahead that was slow to clear the runway.' },
            { id: 'c', text: 'A fault in Charlie\'s equipment.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'How will Alice probably rate Charlie\'s decision to call the go-around?',
          options: [
            { id: 'a', text: 'A mistake — he should have let the plane land.' },
            { id: 'b', text: 'A good call, even though it wasn\'t fun to make.' },
            { id: 'c', text: 'Something to report to his supervisor as unsafe.' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the debrief ONCE. Catch the shape of what happened — details come next.',
      listenFor: [
        'The two aircraft involved — which one was in front, which was behind',
        'Why the lead aircraft didn\'t clear the runway on time',
        'How Alice responds to Charlie\'s decision',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'In the end, Alice\'s assessment of Charlie\'s go-around call is that it was…',
          options: [
            { id: 'a', text: 'premature — he should have waited.' },
            { id: 'b', text: 'textbook — exactly the right call.' },
            { id: 'c', text: 'something to review with a supervisor.' },
            { id: 'd', text: 'likely to cause a complaint from the airline.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What was the main reason the lead aircraft (the Dash) didn\'t clear the runway on time?',
          options: [
            { id: 'a', text: 'Its brakes were working normally and the pilot wanted to rush.' },
            { id: 'b', text: 'The brakes felt soft, so the pilot was going easy on them.' },
            { id: 'c', text: 'Air traffic control forgot to tell the pilot which taxiway to take.' },
            { id: 'd', text: 'A technical failure forced the aircraft to stop on the runway.' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Alice blames Charlie for how close the trailing Airbus got to the Dash.',
          correct: 'F',
          explain: 'She explicitly says it was a good call and that "to be fair to you, the setup looked fine". She even says if she\'d known about the brakes she would have spaced them further.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Now listen again, pausing where you need to. Transcript is available.',
      allowTranscript:  true,
      questions: [
        {
          kind: 'mcq',
          id: 'd1',
          prompt: 'How many miles of spacing did approach set up between the two aircraft on final?',
          options: [
            { id: 'a', text: 'Two' },
            { id: 'b', text: 'Three' },
            { id: 'c', text: 'Four' },
            { id: 'd', text: 'Five' },
          ],
          correct: 'd',
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'How close did the trailing Airbus actually get to the Dash before Charlie called the go-around?',
          options: [
            { id: 'a', text: 'About five miles.' },
            { id: 'b', text: 'About two and a half miles.' },
            { id: 'c', text: 'About one mile.' },
            { id: 'd', text: 'Half a mile.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'According to Charlie, what was the actual issue with the Dash\'s brakes?',
          options: [
            { id: 'a', text: 'A complete failure — the brakes stopped working.' },
            { id: 'b', text: 'They were "squishy" / soft, so the pilot was going easy on them.' },
            { id: 'c', text: 'They overheated after the touchdown.' },
            { id: 'd', text: 'The pilot had deliberately pumped them for a short landing.' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Charlie says that on the readback, the Airbus captain "wasn\'t ___" — annoyed, but he complied immediately.',
          answers:  ['thrilled'],
          alts:     [['happy', 'pleased']],
        },
        {
          kind: 'mcq',
          id: 'd4b',
          prompt: 'Alice imagines a worse version of events. What does she say WOULD have happened if Charlie had let the Airbus land anyway?',
          options: [
            { id: 'a', text: 'The Airbus would have run out of fuel.' },
            { id: 'b', text: 'The Dash would still have been on the runway when the Airbus\'s nose wheel touched.' },
            { id: 'c', text: 'The Airbus would have landed hard and damaged the gear.' },
            { id: 'd', text: 'Air traffic control would have been fined.' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd5',
          sentence: 'Alice promises to email ops that next shift, if a lead reports a brake issue she wants to know on ___, not on the runway.',
          answers:  ['approach'],
        },
        {
          kind:    'true-false',
          id:      'd6',
          prompt:  'Alice plans to put explicit blame on the Dash pilot in the incident report.',
          correct: 'F',
          explain: '"Nothing dramatic… no blame." She describes it as "aborted approach due to preceding traffic not vacating runway in expected time".',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five B2 chunks that do the heavy lifting in any professional debrief — not just ATC. You can lift these straight into a post-mortem at work.',
      chunks: [
        {
          id:       'c1',
          chunk:    'Walk me through it (from your side)',
          category: 'collocation',
          gloss:    'Contame paso a paso (desde tu perspectiva)',
          example:  '"Walk me through it from your side — I\'ve got my radar tapes but I want your version first."',
          notice:   'A senior move. Instead of accusing or jumping to conclusions, the senior invites the narrative. Works anywhere there\'s a post-mortem: medical, dev, legal, teaching.',
        },
        {
          id:       'c2',
          chunk:    'On paper, … / looked fine on paper',
          category: 'discourse-marker',
          gloss:    'En papel / sobre el papel — en teoría se veía bien',
          example:  '"On paper the spacing was textbook." / "To be fair to you, the setup looked fine."',
          notice:   'Flags the gap between the plan and reality. Classic hedge — signals "the data said X but the world did Y".',
        },
        {
          id:       'c3',
          chunk:    'In hindsight, X probably should have Y',
          category: 'grammar-pattern',
          gloss:    'En retrospectiva, X probablemente debería haber Y',
          example:  '"In hindsight he probably should have called it earlier."',
          notice:   'Classic structure for measured self-criticism — or criticism of others. The "in hindsight" + "probably" combination softens the judgement without erasing it.',
        },
        {
          id:       'c4',
          chunk:    'To be fair (to you), …',
          category: 'discourse-marker',
          gloss:    'Para ser justos (contigo) — a defender a alguien de una crítica',
          example:  '"To be fair to you, the setup looked fine."',
          notice:   'Signals you\'re about to defend or balance a prior complaint. Softens delivery enormously; indispensable in debriefs.',
        },
        {
          id:       'c5',
          chunk:    'You\'d be explaining that tomorrow',
          category: 'register',
          gloss:    'Tendrías que estar explicando ESO mañana — hipotético amenazante',
          example:  '"That\'s the one you\'d be explaining tomorrow, and it would be a much worse conversation."',
          notice:   'Second conditional used to paint a scary counterfactual. Common when a senior explains WHY the hard call was the right one — "if you\'d done the other thing, THIS is what you\'d be dealing with now".',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Use the chunks from the previous step to complete these.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: 'I want to understand the incident from your point of view. Can you ___ me ___ it from the start?',
          answers:  ['walk', 'through'],
          hint:     'Ask for a step-by-step narrative.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence is the most natural B2 way to flag "the plan looked good but it didn\'t work in practice"?',
          options: [
            { id: 'a', text: '"The plan was in paper good but it was not good."' },
            { id: 'b', text: '"On paper the plan looked fine — in practice it fell apart."' },
            { id: 'c', text: '"The plan paper was fine but in practice fell."' },
          ],
          correct: 'b',
          explain: '"On paper … in practice …" is the standard pair for contrasting plan with reality.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: 'I didn\'t see it coming at the time, but ___ ___, we really should have budgeted another week.',
          answers:  ['in', 'hindsight'],
          hint:     'Looking back now, with the info we have.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'You want to defend a colleague\'s decision before giving your own suggestion. You start with…',
          options: [
            { id: 'a', text: '"You messed up, but…"' },
            { id: 'b', text: '"To be fair to you, the setup looked fine."' },
            { id: 'c', text: '"Honestly, this is on you."' },
          ],
          correct: 'b',
          explain: '"To be fair to you" is the standard move: it protects the colleague before you add anything that might land as criticism.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'A manager tells a nurse: "If you\'d given the drug without checking, you\'d be ___ that to the family tomorrow." What fits?',
          options: [
            { id: 'a', text: 'explain' },
            { id: 'b', text: 'to explain' },
            { id: 'c', text: 'explaining' },
          ],
          correct: 'c',
          explain: '"you\'d be + -ing" — second conditional continuous. Paints the counterfactual as vividly ongoing.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Think of a time at work (or in your studies, in sport, driving) when something almost went wrong — or did go wrong — and you had to debrief with someone afterwards.',
      mode:         'speaking',
      prompt:       'Record 60 seconds debriefing an imaginary colleague about a close call. Cover: (1) what you had set up / expected, (2) what actually happened, (3) the decision you made in the moment, (4) what you\'d do differently with hindsight. Use at least 3 of: "Walk me through it", "On paper …", "In hindsight …", "To be fair …", "you\'d be explaining that tomorrow / later".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
