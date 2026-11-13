// Friendlistenings® — B1 · The sprint is slipping (logistics consultancy)
//
// A ~2:45 weekly client-sync call. Rohan is the logistics consultant
// leading his firm's redesign of Clara's outbound distribution network.
// The project is behind — the SKU master data her company pulled from
// its ERP turned out to be far dirtier than the team estimated — and
// Rohan has to deliver the news while still proposing a path that lands
// the client's February cost target.
//
// Business B1 register for a student doing logistics consultancy: polite
// but direct, with the chunks a consultant and a client-side operations
// lead actually use. Grammar focus: first conditional for scenario
// planning ("if we keep the current scope…"), modals for recommending
// action, hedged bad news ("I'll be straight with you"), and reporting
// ("my team has done the numbers").
//
// 8-step arc, ~50-minute slot:
//   1. Lead-in     · 4 min — logistics + slipping-project schema
//   2. Vocab       · 8 min — 8 consultancy chunks + 3 checks
//   3. Prediction  · 3 min — how will the client react?
//   4. Gist        · 6 min — the core compromise
//   5. Detail      · 10 min — specifics (SKUs, DCs, savings, dates)
//   6. Awareness   · 7 min — 5 business chunks
//   7. Controlled  · 5 min — reuse the chunks
//   8. Production  · 7 min — 90-sec speaking: a status update of your own

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1LogisticsConsultancySprintSlip: FLLesson = {
  id:           'b1-logistics-consultancy-sprint-slip',
  title:        'The sprint is slipping',
  subtitle:     'A logistics consultant\'s weekly client sync',
  level:        'B1',
  topic:        'Logistics consultancy · delivering bad news · scope negotiation',
  scenario:     'Rohan, a logistics consultant, tells his client Clara the distribution-network redesign is behind and proposes a reduced phase-one scope to still hit the February cost target.',
  estimatedMin: 50,
  tags:         ['business', 'logistics', 'consultancy', 'first-conditional', 'hedging'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#1E3A8A',
    emoji:  '🚚',
  },

  audio: {
    durationSec: 170,
    speakers: [
      {
        id: 'clara', displayName: 'Clara', accent: 'UK', gender: 'f',
        suggestedVoice: { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', note: 'ElevenLabs · warm UK female, supply-chain lead tone — calm, measured' },
      },
      {
        id: 'rohan', displayName: 'Rohan', accent: 'IN', gender: 'm',
        suggestedVoice: { voiceId: 'zgqefOY5FPQ3bB7OZTVR', name: 'Niraj', note: 'ElevenLabs · Indian-English male, mid-career consultant — composed under pressure' },
      },
    ],
    script: [
      { speakerId: 'clara', approxStartSec:   0, text: 'Hi Rohan. Thanks for jumping on. Give me the honest version — where are we with the network redesign?' },
      { speakerId: 'rohan', approxStartSec:   8, text: 'Thanks, Clara. I\'ll be straight with you — we\'re behind. The SKU master data we pulled from your ERP turned out to be dirtier than my team estimated. We\'re two sprints behind where we hoped to be.' },
      { speakerId: 'clara', approxStartSec:  26, text: 'Define "behind". Are we missing the February go-live for the new carrier mix?' },
      { speakerId: 'rohan', approxStartSec:  33, text: 'If we keep the current scope — all SKUs, all three distribution centres — yes. We\'d hit mid-March at the earliest. But I don\'t think that\'s the only option.' },
      { speakerId: 'clara', approxStartSec:  47, text: 'I\'m listening. What\'s the alternative?' },
      { speakerId: 'rohan', approxStartSec:  52, text: 'We scale back for phase one. Launch the new network with the SKUs that already have clean weight and dimension data — about sixty percent of your volume. Keep your current carriers for the other forty percent. Then we clean the remaining master data and bring everything into the new network in phase two in Q2. You\'d still hit February.' },
      { speakerId: 'clara', approxStartSec:  78, text: 'That\'s a lot to carve out. Warehouse operations is going to push back on running two networks in parallel for a quarter.' },
      { speakerId: 'rohan', approxStartSec:  88, text: 'I know. But my team has done the numbers. The sixty percent we\'d move already accounts for eighty-five percent of your freight spend. The savings still land where you promised the CFO, even with the split network.' },
      { speakerId: 'clara', approxStartSec: 103, text: 'Okay. And what do I tell my CEO when he asks why we\'re going live with the new network for half our SKUs?' },
      { speakerId: 'rohan', approxStartSec: 113, text: 'You tell him you\'re hitting the February cost target with the volume that actually moves the P&L, instead of launching the full network late and risky. That\'s a stronger story than any schedule slip.' },
      { speakerId: 'clara', approxStartSec: 128, text: 'Fair point. Can you send me a one-page summary by Friday? Phase-one SKUs, carrier mix, projected savings, risks. I\'ll walk it to my CEO Monday morning.' },
      { speakerId: 'rohan', approxStartSec: 142, text: 'Absolutely. You\'ll have it by end of Thursday. Anything else I should address in that doc?' },
      { speakerId: 'clara', approxStartSec: 150, text: 'Yes — put a line in about what we\'d pick up in phase two, so warehouse ops sees it\'s not a permanent two-network setup, just sequenced.' },
      { speakerId: 'rohan', approxStartSec: 160, text: 'Done. Thanks, Clara. I know this isn\'t the update you wanted.' },
      { speakerId: 'clara', approxStartSec: 168, text: 'It isn\'t. But I\'d rather hear it now than in February. Talk Friday.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'In logistics consulting, half the job is delivering difficult updates to a client without losing them. Today you\'ll hear a consultant tell his client the distribution-network project is behind — and offer a way to still hit her February target.',
      hookEmoji: '🚚',
      openQuestions: [
        { id: 'li1', prompt: 'In a supply-chain project, which problem scares you the most: dirty data, late delivery, or carrier reliability? Why?' },
        { id: 'li2', prompt: 'Have you ever had to tell a client or a boss a project was behind? How did you prepare the conversation?' },
        { id: 'li3', prompt: 'Which is better: shipping a smaller phase-one on time, or shipping the full project a few weeks late?', hint: 'The answer usually depends on who the stakeholder reports to.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'These 8 chunks are the ones any B1 consultant needs in a real client sync. They\'re generic enough to reuse across industries — but you\'ll hear them all here.',
      items: [
        { id: 'v1', word: 'to jump on (a call)',        pos: 'phrasal-verb', translation: 'Sumarse / meterse a una llamada o reunión, especialmente con poca anticipación.', example: 'Thanks for jumping on.',                                           definition: 'to join a call or meeting quickly' },
        { id: 'v2', word: 'to be behind',               pos: 'phrase',       translation: 'Estar atrasado/a (respecto al plan, cronograma).',                                   example: 'We\'re two sprints behind.',                                       definition: 'to be late / not on schedule' },
        { id: 'v3', word: 'to turn out to be + adjective', pos: 'phrasal-verb', translation: 'Resultar ser + adjetivo. Para revelar algo que no se esperaba.',                     example: 'The master data turned out to be dirtier than we estimated.',       definition: 'to end up being, often unexpectedly' },
        { id: 'v4', word: 'to scale back',               pos: 'phrasal-verb', translation: 'Reducir el alcance / tamaño de algo.',                                               example: 'We scale back for phase one.',                                     definition: 'to reduce the size or scope' },
        { id: 'v5', word: 'phase two (/ one / three)',   pos: 'noun',         translation: 'Fase dos — segunda etapa de un proyecto después del lanzamiento inicial.',          example: 'Move everything else to phase two in Q2.',                         definition: 'a later stage of a project' },
        { id: 'v6', word: 'to push back on (sth)',       pos: 'phrasal-verb', translation: 'Oponerse / resistirse a algo.',                                                      example: 'Warehouse ops is going to push back on running two networks.',       definition: 'to resist or disagree with a decision' },
        { id: 'v7', word: 'a schedule slip',              pos: 'noun',        translation: 'Un atraso en el cronograma. Suave; menos alarmante que "a delay".',                   example: '…a stronger story than any schedule slip.',                        definition: 'a delay against the planned timeline' },
        { id: 'v8', word: 'to walk (sth) to (sb)',        pos: 'phrase',      translation: 'Llevar algo en persona / presentarlo cara a cara a alguien (típicamente arriba).',    example: 'I\'ll walk it to my CEO Monday morning.',                           definition: 'to personally present something to someone' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"We\'re two sprints behind" means the team is…',
          options: [
            { id: 'a', text: 'two weeks ahead of schedule' },
            { id: 'b', text: 'two sprints without work' },
            { id: 'c', text: 'two sprints late on the plan' },
          ],
          correct: 'c',
          explain: '"Behind" in project speak = late relative to the plan. Its opposite is "ahead".',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"We scaled back the phase one launch" means you…',
          options: [
            { id: 'a', text: 'made it smaller / less ambitious' },
            { id: 'b', text: 'made it bigger' },
            { id: 'c', text: 'cancelled it entirely' },
          ],
          correct: 'a',
          explain: '"Scale back" = reduce in scope or size. "Scale up" = the opposite.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'Warehouse ops "pushed back on" the two-network plan. They were…',
          options: [
            { id: 'a', text: 'physically moving the racks' },
            { id: 'b', text: 'resisting / disagreeing with the plan' },
            { id: 'c', text: 'approving it quickly' },
          ],
          correct: 'b',
          explain: '"Push back on X" = resist X. Essential chunk for any stakeholder conversation.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Rohan is about to tell Clara the network redesign is behind. Guess how the conversation goes.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'How will Rohan deliver the bad news?',
          options: [
            { id: 'a', text: 'Hide it and change the topic' },
            { id: 'b', text: 'Blame the client' },
            { id: 'c', text: 'Be straight about it and propose a solution' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What will Clara most likely do?',
          options: [
            { id: 'a', text: 'Push back but look for a compromise' },
            { id: 'b', text: 'Cancel the whole project' },
            { id: 'c', text: 'Agree to every proposal immediately' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What solution do you think Rohan will propose?',
          options: [
            { id: 'a', text: 'Add more consultants to the team' },
            { id: 'b', text: 'Launch a smaller phase one on time and move the rest to phase two' },
            { id: 'c', text: 'Push the deadline by six months' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole call ONCE, no pauses. Catch the big picture.',
      listenFor: [
        'What exactly made the project slip',
        'Rohan\'s core proposal',
        'What Clara commits to by the end',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What is Rohan\'s core proposal?',
          options: [
            { id: 'a', text: 'Push the deadline from February to mid-March' },
            { id: 'b', text: 'Cancel the redesign and keep the old network' },
            { id: 'c', text: 'Launch a smaller phase one on time and clean the rest for phase two in Q2' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does Clara commit to by the end of the call?',
          options: [
            { id: 'a', text: 'Walking the one-page summary to her CEO on Monday' },
            { id: 'b', text: 'Approving the plan right there on the call' },
            { id: 'c', text: 'Firing the consultancy firm' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Clara is happy about the update.',
          correct: 'F',
          explain: 'She\'s clearly not happy — "it isn\'t the update I wanted" — but she accepts the compromise.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again. Pause when you need to. The transcript is available.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'Rohan says the team is ___ sprints behind.',
          answers:  ['two'],
          alts:     [['2']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'What turned out to be dirtier than estimated?',
          options: [
            { id: 'a', text: 'The warehouses themselves' },
            { id: 'b', text: 'The SKU master data from the client\'s ERP' },
            { id: 'c', text: 'The carrier contracts' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd3',
          sentence: 'If the team keeps the current scope, they\'d hit the deadline in ___-___ at the earliest.',
          answers:  ['mid', 'March'],
          alts:     [['mid-'], ['march']],
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'What percentage of the volume moves in phase one, according to Rohan?',
          options: [
            { id: 'a', text: 'About forty percent' },
            { id: 'b', text: 'All of it' },
            { id: 'c', text: 'About sixty percent' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'That phase-one volume accounts for what share of freight spend?',
          options: [
            { id: 'a', text: 'Eighty-five percent' },
            { id: 'b', text: 'About half' },
            { id: 'c', text: 'All of it' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'Which internal team is Clara worried will push back?',
          options: [
            { id: 'a', text: 'Marketing' },
            { id: 'b', text: 'Warehouse operations' },
            { id: 'c', text: 'Legal' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd7',
          sentence: 'Clara wants the summary by ___. Rohan says he\'ll deliver it by end of ___.',
          answers:  ['Friday', 'Thursday'],
          alts:     [['friday'], ['thursday']],
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Clara asks Rohan to include what the team will pick up in phase two.',
          correct: 'T',
          explain: '"Put a line in about what we\'d pick up in phase two."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five chunks that make this sound like a real client meeting, not a B1 textbook.',
      chunks: [
        {
          id:       'c1',
          chunk:    'I\'ll be straight with you',
          category: 'discourse-marker',
          gloss:    'Te voy a hablar sin vueltas — anuncia honestidad',
          example:  '"I\'ll be straight with you — we\'re behind."',
          notice:   'Meta-commentary. Earns the right to say something hard. Compare: "Unfortunately…" (hedged), "To be honest…" (softer), "Look…" (informal). "I\'ll be straight with you" is the consultant/professional register.',
        },
        {
          id:       'c2',
          chunk:    'turned out to be + comparative',
          category: 'grammar-pattern',
          gloss:    'Resultó ser más/menos… de lo esperado',
          example:  '"The master data turned out to be dirtier than my team estimated."',
          notice:   'Past of "turn out" — reveals a gap between expectation and reality without blaming anyone. A diplomatic way to introduce a surprise.',
        },
        {
          id:       'c3',
          chunk:    'If we + simple present, we\'d + verb',
          category: 'grammar-pattern',
          gloss:    'Primer/mixto condicional para explorar escenarios',
          example:  '"If we keep the current scope, we\'d hit mid-March at the earliest."',
          notice:   'Mixing simple present + "would" lets you reason about hypothetical project paths without committing. Very common in planning and consulting.',
        },
        {
          id:       'c4',
          chunk:    'push back on + noun',
          category: 'phrasal-verb',
          gloss:    'Oponerse a / resistir algo (decisión, scope cut, idea)',
          example:  '"Warehouse ops is going to push back on running two networks in parallel."',
          notice:   'Separable only with pronoun: "they\'ll push back on it" ✓ / "they\'ll push it back on" ✗. The noun always goes after "on".',
        },
        {
          id:       'c5',
          chunk:    'I\'d rather hear it now than later',
          category: 'register',
          gloss:    'Prefiero escucharlo ahora que después — recibe la mala noticia con madurez',
          example:  '"I\'d rather hear it now than in February."',
          notice:   '"Would rather + verb + than + verb". Expresses preference under pressure. A mature professional close — signals Clara isn\'t punishing Rohan for the news.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks in short tasks.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '"The lanes between DC two and the east coast ___ out to be more expensive than we modelled."',
          answers:  ['turned'],
          hint:     'Past of "turn out".',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses "push back on" correctly?',
          options: [
            { id: 'a', text: 'The CFO pushed back the capex request on.' },
            { id: 'b', text: 'The CFO pushed on the capex request back.' },
            { id: 'c', text: 'The CFO pushed back on the capex request.' },
          ],
          correct: 'c',
          explain: '"Push back on + noun". The noun doesn\'t slide between the verb and "on".',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"I\'ll ___ ___ with you — the Q1 target isn\'t realistic with the current team."',
          answers:  ['be', 'straight'],
          hint:     'Meta-opener for a hard message.',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: '"If we ___ back the SKU set, we ___ hit the February go-live."',
          answers:  ['scale', 'can'],
          hint:     'Reduce + consequence.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'The most mature reply to a difficult status update from a consultant is:',
          options: [
            { id: 'a', text: '"I\'d rather hear it now than in February."' },
            { id: 'b', text: '"Why didn\'t you tell me earlier?!"' },
            { id: 'c', text: '"That\'s not my problem."' },
          ],
          correct: 'a',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'You\'re the consultant. A client project is behind — pick one you know (a network redesign, a transport tender, a warehouse-management rollout, an inventory review). Record 90 seconds giving the client the update + a plan.',
      mode:         'speaking',
      prompt:       'Record 90 seconds. Cover: (1) a one-line "I\'ll be straight with you" opener, (2) what turned out to be more complex than expected, (3) the reduced scope you\'re proposing for phase one, (4) what you\'ll deliver by when, (5) a stronger-story line to help your client sell this upward. Use at least 3 of: "I\'ll be straight with you", "turned out to be…", "If we + verb, we\'d/can + verb", "push back on", "I\'d rather hear it now than later".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
