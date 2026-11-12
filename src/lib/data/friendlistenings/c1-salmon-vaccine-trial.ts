// Friendlistenings® — C1 · What the challenge data is telling us
//
// A ~3:10 late-evening Zoom call between two immunologists on a joint
// salmon-vaccine programme. Dr Valentina Soto (lead PI, Puerto Montt) and
// Dr Henrik Lund (NOFIMA, Tromsø) are looking at preliminary efficacy data
// from a prime-boost trial of a modified live-attenuated vaccine against
// Piscirickettsia salmonis (SRS). The humoral and cellular readouts look
// strong, but field-challenge RPS came back at 40% — below the 65% they'd
// pitched to the grant committee.
//
// Targeted at the salmon-industry immunology researcher: SRS is the number-
// one disease in Chilean salmon aquaculture and a real research priority
// at NOFIMA, Fundación Chile, and the IMMUNOFISH network. The vocabulary
// is authentic (RPS, humoral arm, intracellular, prime-boost, challenge
// window, durability) and the discourse is the kind of hedged, data-driven
// peer-to-peer conversation that happens in the field every day.
//
// C1 grammar surface: inference markers ("which tells me…", "that's where
// my head is too"), hedged observation ("what's striking is…"), modal-
// perfect reasoning, structured comparison, and the grown-up preference
// frame ("I'd rather X than Y"). The register rewards precision and
// epistemic care more than fluency alone.
//
// 8-step arc, ~55 minute slot:
//   1. Lead-in     · 5 min — vaccine-trial + salmon-aquaculture schema
//   2. Vocab       · 10 min — 8 immunology chunks + 3 understanding checks
//   3. Prediction  · 3 min — what will the proposed next step be?
//   4. Gist        · 7 min — overall diagnosis and decision
//   5. Detail      · 12 min — specifics (RPS, cell subsets, timeline)
//   6. Awareness   · 7 min — 5 C1 chunks for data-driven conversation
//   7. Controlled  · 5 min — reuse the chunks
//   8. Production  · 6 min — 90-sec speaking: present ambiguous data

import type { FLLesson } from '@/types/friendlistenings';

export const lessonC1SalmonVaccineTrial: FLLesson = {
  id:           'c1-salmon-vaccine-trial',
  title:        'What the challenge data is telling us',
  subtitle:     'Two immunologists review a vaccine trial over Zoom',
  level:        'C1',
  topic:        'Salmon immunology · interpreting ambiguous data · peer science talk',
  scenario:     'Dr Valentina Soto (Puerto Montt) and Dr Henrik Lund (NOFIMA, Tromsø) look at preliminary data from their joint SRS vaccine trial and decide how to pitch the amendment to the grant committee.',
  estimatedMin: 55,
  tags:         ['academic', 'immunology', 'salmon-aquaculture', 'science-communication', 'high-register'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#1F6B7A',
    emoji:  '🐟',
  },

  audio: {
    durationSec: 200,
    speakers: [
      {
        id: 'henrik', displayName: 'Henrik', accent: 'UK', gender: 'm',
        suggestedVoice: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', note: 'ElevenLabs · warm UK male — collaborator cadence (plausible EU-English accent for a Norwegian academic)' },
      },
      {
        id: 'valentina', displayName: 'Valentina', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', note: 'ElevenLabs · strong, confident US female — lead-PI tone' },
      },
    ],
    script: [
      { speakerId: 'henrik',    approxStartSec:   0, text: 'Valentina, thanks for finding the time. I know it\'s already late there. Did you get a chance to look through the challenge data I sent?' },
      { speakerId: 'valentina', approxStartSec:  10, text: 'I did. I spent most of yesterday with it. I\'ll be honest — the humoral response looks beautiful, but the RPS numbers aren\'t where we wanted them.' },
      { speakerId: 'henrik',    approxStartSec:  22, text: 'I\'m getting the same read. Forty percent is respectable, but it\'s not the paper we pitched to the grant committee.' },
      { speakerId: 'valentina', approxStartSec:  32, text: 'No. And what\'s striking is the disconnect. The antibody titers at week six are clearly above the threshold we set, and the IFN-gamma response in the CD8 subset looked encouraging. So on paper, the adaptive arm is doing its job.' },
      { speakerId: 'henrik',    approxStartSec:  50, text: 'Which tells me the problem isn\'t the prime. The problem is either downstream of exposure, or something about Piscirickettsia specifically that gets around what we\'re measuring.' },
      { speakerId: 'valentina', approxStartSec:  64, text: 'That\'s where my head is too. Piscirickettsia is intracellular. If the bacteria are hiding inside the macrophages before the CD8 response can kick in, we could have all the antibodies in the world and it wouldn\'t matter.' },
      { speakerId: 'henrik',    approxStartSec:  81, text: 'Right. So the follow-up isn\'t more adjuvant — it\'s probably rethinking the challenge window. What if we shortened the post-boost to challenge interval? Hit them when the cellular response is still peaking.' },
      { speakerId: 'valentina', approxStartSec:  98, text: 'That would tell us whether the vaccine CAN protect under optimal conditions. But Henrik, the industry doesn\'t get optimal conditions. If RPS only holds at week two post-boost and drops to forty by week six, we have a product that doesn\'t travel to the field.' },
      { speakerId: 'henrik',    approxStartSec: 118, text: 'Fair. So we need both — a tighter challenge to understand the mechanism, and a parallel arm looking at durability out to twelve weeks.' },
      { speakerId: 'valentina', approxStartSec: 131, text: 'Which means we need another twelve weeks and another forty animals. The committee is not going to love that.' },
      { speakerId: 'henrik',    approxStartSec: 141, text: 'No. But forty percent RPS as our only data point is also not going to sell. I\'d rather go back to them with a clear hypothesis and a focused ask than present ambiguous numbers and hope they\'re generous.' },
      { speakerId: 'valentina', approxStartSec: 157, text: 'I agree. Can you draft the amendment language? I\'ll handle the ethics committee and the budget revision on my end.' },
      { speakerId: 'henrik',    approxStartSec: 167, text: 'Done. One more thing — when we write this up for the fish immunology meeting in June, do we lead with the immunogenicity data or the challenge data?' },
      { speakerId: 'valentina', approxStartSec: 179, text: 'Immunogenicity. The challenge data is preliminary. If we lead with RPS, that\'s all anyone will remember, and the mechanism story gets lost.' },
      { speakerId: 'henrik',    approxStartSec: 191, text: 'Smart. Okay. I\'ll have the amendment to you by end of week. Go get some sleep.' },
      { speakerId: 'valentina', approxStartSec: 198, text: 'Trying. Talk soon.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'In salmon aquaculture, Piscirickettsia salmonis (SRS) is the most expensive disease on the planet. Today you\'ll hear two immunologists review preliminary results from a joint vaccine trial — and decide how to pitch the next phase to their grant committee.',
      hookEmoji: '🐟',
      openQuestions: [
        { id: 'li1', prompt: 'In your own research or reading, what makes a vaccine candidate "promising" vs. "ready for the field"? What kind of data do you need?' },
        { id: 'li2', prompt: 'How do you personally handle ambiguous or disappointing data — when the mechanism looks right but the endpoint doesn\'t?' },
        { id: 'li3', prompt: 'Is it better to publish / present data as soon as you have it, or wait until the story is more complete? What\'s the trade-off?', hint: 'Think about industry impact, competitors, and reproducibility pressure.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'These 8 terms + chunks are a mix of fish-vaccine vocabulary and the general science-career language you need to run a project in English.',
      items: [
        { id: 'v1', word: 'humoral response (/ arm)',      pos: 'noun',   translation: 'Respuesta humoral — rama del sistema inmune mediada por anticuerpos.',                                       example: 'The humoral response looks beautiful.',                                 soundsLike: 'HYOO-mor-al',    definition: 'antibody-mediated immune response' },
        { id: 'v2', word: 'cellular response (/ arm)',      pos: 'noun',  translation: 'Respuesta celular — mediada por células T (CD4/CD8) en lugar de anticuerpos.',                                example: '…when the cellular response is still peaking.',                         definition: 'T-cell–mediated immune response' },
        { id: 'v3', word: 'RPS (relative percent survival)', pos: 'noun', translation: 'Supervivencia relativa — métrica estándar de eficacia en ensayos de vacuna en peces.',                         example: 'The RPS numbers aren\'t where we wanted them.',                          soundsLike: 'ar-pee-ESS',     definition: 'standard efficacy metric in fish vaccine trials' },
        { id: 'v4', word: 'antibody titer (/ titre)',        pos: 'noun', translation: 'Título de anticuerpos — concentración medible en suero.',                                                      example: 'The antibody titers at week six are clearly above the threshold.',      soundsLike: 'TIE-ter',        definition: 'concentration of antibodies in serum' },
        { id: 'v5', word: 'intracellular',                    pos: 'adjective', translation: 'Intracelular — se aloja o replica dentro de una célula huésped (típico de Piscirickettsia).',           example: 'Piscirickettsia is intracellular.',                                      definition: 'living or replicating inside host cells' },
        { id: 'v6', word: 'adjuvant',                          pos: 'noun', translation: 'Adyuvante — sustancia que potencia la respuesta inmune a una vacuna.',                                        example: 'The follow-up isn\'t more adjuvant.',                                    soundsLike: 'AJ-uh-vant',     definition: 'a substance that enhances vaccine response' },
        { id: 'v7', word: 'challenge window',                  pos: 'noun', translation: 'Ventana de desafío — intervalo entre vacunación y exposición al patógeno en un ensayo.',                      example: '…rethinking the challenge window.',                                      definition: 'time between vaccination and pathogen exposure in a trial' },
        { id: 'v8', word: 'durability (of the response)',      pos: 'noun', translation: 'Durabilidad — cuánto se mantiene la protección inmune en el tiempo.',                                         example: '…a parallel arm looking at durability out to twelve weeks.',             soundsLike: 'dur-a-BIL-i-tee', definition: 'how long an immune response remains effective' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'RPS (relative percent survival) measures…',
          options: [
            { id: 'a', text: 'the total number of fish in the tank' },
            { id: 'b', text: 'how much better vaccinated fish survive a challenge vs. unvaccinated controls' },
            { id: 'c', text: 'the percent of fish that produced antibodies' },
          ],
          correct: 'b',
          explain: 'RPS = (1 − mortality in vaccinated / mortality in controls) × 100. It\'s the standard efficacy endpoint.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'A pathogen described as "intracellular" is one that…',
          options: [
            { id: 'a', text: 'floats freely in the blood' },
            { id: 'b', text: 'lives and replicates inside host cells (often macrophages)' },
            { id: 'c', text: 'lives only on the skin' },
          ],
          correct: 'b',
          explain: 'Intracellular pathogens hide from antibodies by replicating inside host cells. That\'s why the cellular arm often matters more than antibody titers.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"Durability" of a vaccine response refers to…',
          options: [
            { id: 'a', text: 'the physical strength of the vial' },
            { id: 'b', text: 'how long the protection lasts after vaccination' },
            { id: 'c', text: 'the dose per fish' },
          ],
          correct: 'b',
          explain: 'A vaccine can be highly effective at week 2 and collapse by week 8 — that\'s a durability problem, not an efficacy problem.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Two scientists are looking at a trial where antibody responses are strong but the field-challenge RPS came in at 40% instead of the 65% they promised the grant committee. Guess how they handle it.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'Where will they land on the "cause" of the RPS gap?',
          options: [
            { id: 'a', text: 'The vaccine design is bad and should be scrapped.' },
            { id: 'b', text: 'Something about the pathogen or the timing of the readout is hiding the real effect.' },
            { id: 'c', text: 'The fish were just unlucky.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What will they most likely propose as next steps?',
          options: [
            { id: 'a', text: 'A single new experiment with more adjuvant' },
            { id: 'b', text: 'Two parallel experiments — one to understand mechanism, one for durability' },
            { id: 'c', text: 'Nothing — they\'ll submit the ambiguous data' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'When they write up the work for the fish-immunology meeting, they will probably lead with…',
          options: [
            { id: 'a', text: 'the challenge data, because efficacy is what matters' },
            { id: 'b', text: 'the immunogenicity data, so the mechanism story isn\'t overshadowed' },
            { id: 'c', text: 'the budget request' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen once, no pauses. Catch the big picture — the mechanism, the proposed plan, and how they want to present it.',
      listenFor: [
        'Why the RPS looks lower than expected',
        'What the proposed next experiment adds to the design',
        'How they decide to frame the work for the conference',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'According to Valentina, why might antibody titers fail to translate into RPS for SRS?',
          options: [
            { id: 'a', text: 'Because fish don\'t make antibodies.' },
            { id: 'b', text: 'Because Piscirickettsia is intracellular — antibodies can\'t reach it once it\'s inside the macrophages.' },
            { id: 'c', text: 'Because the dose was wrong.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does the proposed amendment add to the trial design?',
          options: [
            { id: 'a', text: 'A larger adjuvant arm' },
            { id: 'b', text: 'A tighter challenge window AND a parallel arm for durability out to 12 weeks' },
            { id: 'c', text: 'Switching to a different pathogen' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Valentina wants to lead the conference talk with the challenge (RPS) data.',
          correct: 'F',
          explain: 'She wants to lead with the immunogenicity data to protect the mechanism story.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again, pausing where you need to. Transcript is available — a few inference questions require re-reading.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'The field-challenge trial returned an RPS of ___ percent — below the ___ percent pitched to the grant committee.',
          answers:  ['forty', 'sixty-five'],
          alts:     [['40', '40%'], ['65', '65%']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'What does Valentina say is "striking" about the data?',
          options: [
            { id: 'a', text: 'The number of fish that died' },
            { id: 'b', text: 'The disconnect between strong immunogenicity and weak RPS' },
            { id: 'c', text: 'The cost of the trial' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'Which immune readouts look encouraging in the current data?',
          options: [
            { id: 'a', text: 'Antibody titers at week 6 and IFN-gamma in the CD8 subset' },
            { id: 'b', text: 'Only serum cortisol' },
            { id: 'c', text: 'None — all readouts were poor' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'Where might Piscirickettsia be "hiding" before the CD8 response can act?',
          options: [
            { id: 'a', text: 'In the swim bladder' },
            { id: 'b', text: 'Inside macrophages' },
            { id: 'c', text: 'On the skin' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'Henrik proposes a shorter challenge window because…',
          options: [
            { id: 'a', text: 'to save on fish-tank costs' },
            { id: 'b', text: 'so they can test the vaccine when the cellular response is still peaking' },
            { id: 'c', text: 'to publish faster' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd6',
          sentence: 'The proposed parallel arm would track durability out to ___ weeks and need another ___ animals.',
          answers:  ['twelve', 'forty'],
          alts:     [['12'], ['40']],
        },
        {
          kind: 'mcq',
          id: 'd7',
          prompt: 'How does the team divide the amendment work?',
          options: [
            { id: 'a', text: 'Henrik drafts the amendment language; Valentina handles ethics and budget on her end.' },
            { id: 'b', text: 'Valentina drafts everything.' },
            { id: 'c', text: 'They hire an external consultant.' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Valentina thinks the challenge data is final enough to lead the conference talk.',
          correct: 'F',
          explain: '"The challenge data is preliminary. If we lead with RPS, that\'s all anyone will remember, and the mechanism story gets lost."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five C1 moves that make this sound like two scientists working together, not reading a textbook aloud.',
      chunks: [
        {
          id:       'c1',
          chunk:    "What\'s striking is + (that-clause / noun phrase)",
          category: 'discourse-marker',
          gloss:    'Lo que llama la atención es… — introducir una observación clave',
          example:  '"What\'s striking is the disconnect. The antibody titers at week six are clearly above threshold…"',
          notice:   'Signals that you\'re about to name the ONE thing a listener should take away from the data. Stronger than "interestingly"; more restrained than "the dramatic finding was".',
        },
        {
          id:       'c2',
          chunk:    'Which tells me (that) + clause',
          category: 'discourse-marker',
          gloss:    'Lo cual me indica que… — inferencia a partir del dato',
          example:  '"Which tells me the problem isn\'t the prime."',
          notice:   'Draws a working inference from the previous sentence. Makes your reasoning visible — valuable in lab meetings. More tentative alternatives: "which suggests", "which implies".',
        },
        {
          id:       'c3',
          chunk:    "That\'s where my head is too",
          category: 'register',
          gloss:    'Yo estoy pensando lo mismo — acuerdo entre pares',
          example:  '"That\'s where my head is too. Piscirickettsia is intracellular…"',
          notice:   'Peer-to-peer agreement. Treats thinking as a direction ("where my head is"), not as an answer. Keeps the conversation exploratory, not combative.',
        },
        {
          id:       'c4',
          chunk:    "we could have X in the world and it wouldn\'t matter",
          category: 'grammar-pattern',
          gloss:    'Podríamos tener todo el X del mundo y no serviría de nada — hipérbole razonada',
          example:  '"We could have all the antibodies in the world and it wouldn\'t matter."',
          notice:   'Dramatic but legitimate C1 pattern. Second-conditional under hyperbolic framing — emphasises a mechanism argument without sounding sloppy. Use sparingly.',
        },
        {
          id:       'c5',
          chunk:    "I\'d rather X than Y",
          category: 'grammar-pattern',
          gloss:    'Prefiero X a Y — preferencia argumentada',
          example:  '"I\'d rather go back to them with a clear hypothesis and a focused ask than present ambiguous numbers and hope they\'re generous."',
          notice:   'Full "rather than" structure, both verbs bare-infinitive. In grant / project conversations this chunk often carries the decision. The "than" clause is where the reasoning lives.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks in short, lab-shaped tasks.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '"The vaccinated group showed a clean serology response. ___ ___ ___ is that mortality in the challenge arm was still above forty percent."',
          answers:  ['What', 'is', 'striking'],
          hint:     'Introduce the key observation.',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: '"The CD8 response peaks at week two and drops by week six. ___ ___ ___ the protection we\'re seeing is short-lived."',
          answers:  ['Which', 'tells', 'me'],
          hint:     'Draw an inference.',
        },
        {
          kind: 'mcq',
          id: 'cp3',
          prompt: 'Your co-PI says the field-challenge model is probably too harsh. The most peer-friendly way to agree is:',
          options: [
            { id: 'a', text: '"Yes, you\'re right."' },
            { id: 'b', text: '"That\'s where my head is too."' },
            { id: 'c', text: '"I don\'t care."' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: '"I\'d ___ run a smaller, cleaner trial ___ chase another endpoint we can\'t interpret."',
          answers:  ['rather', 'than'],
          hint:     'Reasoned preference.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'Which sentence sounds the most C1-natural?',
          options: [
            { id: 'a', text: '"Without the cellular arm, antibodies are useless against this pathogen."' },
            { id: 'b', text: '"We could have all the antibodies in the world and it wouldn\'t matter — the pathogen replicates intracellularly."' },
            { id: 'c', text: '"Antibodies no work here."' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Record 90 seconds presenting ambiguous data to a collaborator. It can be from your own work or an invented scenario in your field.',
      mode:         'speaking',
      prompt:       'Pretend you\'re on a Zoom call with a co-author. Walk them through: (1) the headline observation using "what\'s striking is…", (2) the inference you draw ("which tells me…"), (3) a hypothesis for the mechanism, (4) the next experiment you want to run, (5) how you\'d rather present it. Use at least 3 of: "what\'s striking is…", "which tells me…", "that\'s where my head is too", "we could have X in the world and it wouldn\'t matter", "I\'d rather X than Y".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
