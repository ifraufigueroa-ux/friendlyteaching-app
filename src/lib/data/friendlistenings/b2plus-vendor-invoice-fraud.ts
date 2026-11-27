// Friendlistenings® — B2+ · The invoice that wasn't
//
// Second cybersecurity entry in the catalog, after "The retry helper we
// never asked for" (supply-chain / typosquat). This one covers a
// different attack family on purpose: Business Email Compromise (BEC)
// + vendor-impersonation invoice fraud. Zero overlap in mechanics,
// vocab, scenario, or questions with the supply-chain lesson.
//
// Scenario: Priya, the finance controller at a mid-size architecture
// firm, calls Rafael (IT security / incident lead) at 08:12 after
// her AP clerk nearly wired €47,000 to what looked like a legitimate
// vendor. The attacker had been inside the vendor's mailbox for three
// weeks, learned the quarterly billing rhythm, and sent a "banking
// details updated" email from a nearly-identical look-alike domain —
// swapping an "m" for "rn". The clerk caught it in the final
// four-eyes check when the IBAN country code didn't match the
// vendor's registered country.
//
// The attack family (BEC / vendor-email compromise / invoice fraud) is
// the single highest-loss category reported to the FBI IC3 every
// year through 2024-2025, so the vocabulary is high-value: dwell time,
// a look-alike domain, wire transfer, callback verification, DMARC
// policy, four-eyes principle, to intercept, to flag, to walk X back.
//
// Register is B2+: past modals of narrow escape ("they could have
// easily lost"), third conditionals of near-miss ("if she hadn't
// double-checked the IBAN, we'd have wired"), cleft-with-"what" for
// what saved the day, phrasal verbs with high collocational weight
// in finance security contexts (walk back, catch out, pull off).
//
// Phrasal verbs anchored in the vocab step (per teacher request):
//   · to walk (something) back    — retract / reverse a step
//   · to catch (someone) out       — trap by surprise
//   · to pull (something) off      — succeed at a difficult plan
//   · to flag (something) up       — raise to management's attention
//   · to lock (an account) down    — restrict access urgently
//
// 8-step arc, ~55-minute slot. Mirrors supply-chain lesson for
// consistency but every artifact (cover accent, emoji, speakers,
// script, questions, chunks, production prompt) is independent.

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB2PlusVendorInvoiceFraud: FLLesson = {
  id:           'b2plus-vendor-invoice-fraud',
  title:        'The invoice that wasn\'t',
  subtitle:     'A near-miss wire transfer the morning after',
  level:        'B2+',
  topic:        'BEC / vendor-email compromise · invoice fraud · AP controls',
  scenario:     'Priya, the finance controller, briefs Rafael (IT security) on how her AP clerk almost wired €47,000 to a look-alike domain of a trusted vendor. They work through dwell time, callback verification, DMARC posture, and a company-wide rollout of a four-eyes policy for any bank-detail change.',
  estimatedMin: 55,
  tags:         ['finance', 'security', 'bec', 'invoice-fraud', 'social-engineering', 'phrasal-verbs', 'past-modals'],
  createdAt:    '2026-11-27',

  cover: {
    accent: '#B45309', // amber-700 — cash-colour warning, distinct from the teal of supply-chain
    emoji:  '💸',
  },

  audio: {
    durationSec: 230,
    speakers: [
      {
        id: 'priya', displayName: 'Priya', accent: 'UK', gender: 'f',
        suggestedVoice: {
          voiceId: 'Xb7hH8MSUJpSbSDYk0k2',
          name:    'Alice',
          note:    'ElevenLabs · UK professional female — measured, slightly clipped finance-controller register. Not the robot-demo Rachel/Dorothy pool.',
        },
      },
      {
        id: 'rafael', displayName: 'Rafael', accent: 'US', gender: 'm',
        suggestedVoice: {
          voiceId: 'cjVigY5qzO86Huf0OWal',
          name:    'Eric',
          note:    'ElevenLabs · US male, warm and grounded incident-commander tone. Avoids the flat Adam/Daniel pattern.',
        },
      },
    ],
    script: [
      { speakerId: 'priya',  approxStartSec:   0, text: 'Rafael, I need a few minutes. Something nearly went very wrong last night. Elena in AP was about to release a wire for forty-seven thousand euros to Novatek, and she caught it at the final check.' },
      { speakerId: 'rafael', approxStartSec:  20, text: 'OK. Walk me through what she caught.' },
      { speakerId: 'priya',  approxStartSec:  25, text: 'The invoice looked completely routine — same amount band as every quarter, same reference format, same contact name. The only thing that stood out was a note saying their banking details had been updated. New IBAN, different bank, Luxembourg.' },
      { speakerId: 'rafael', approxStartSec:  48, text: 'Novatek is registered in Germany.' },
      { speakerId: 'priya',  approxStartSec:  53, text: 'Exactly. The IBAN country code was LU, not DE. That\'s what Elena flagged up at the four-eyes stage. Everything else was pixel-perfect: logo, signature block, even the invoice numbering.' },
      { speakerId: 'rafael', approxStartSec:  72, text: 'And the sender address?' },
      { speakerId: 'priya',  approxStartSec:  76, text: 'That\'s the part that caught her out for twenty minutes. It came from accounts at novatek-finance dot com. Our usual vendor is just novatek dot com. The look-alike was clever — the "rn" instead of "m" trick, but on the subdomain rather than the root.' },
      { speakerId: 'rafael', approxStartSec: 101, text: 'So we\'re looking at either a look-alike domain the attacker registered, or they got inside the real Novatek mailbox and sent it from there. Did the message chain look continuous?' },
      { speakerId: 'priya',  approxStartSec: 119, text: 'That\'s what worries me. There\'s a three-week thread with correct quoting, correct sign-offs, correct timing. If they were inside Novatek\'s account, the dwell time was long enough to learn our billing rhythm.' },
      { speakerId: 'rafael', approxStartSec: 143, text: 'That\'s the one that keeps me up. Dwell time is where the real damage sits — they\'re not racing, they\'re reading. They\'d have known exactly when a Novatek invoice was expected.' },
      { speakerId: 'priya',  approxStartSec: 164, text: 'Right. So — what do we do in the next hour, and what do we do by end of week?' },
      { speakerId: 'rafael', approxStartSec: 175, text: 'In the next hour: lock down Elena\'s mailbox and the AP shared inbox, pull the full headers of that email for forensics, and get on a call with Novatek\'s security contact — not through email, by phone, from the number on last year\'s contract, not the one on the invoice.' },
      { speakerId: 'priya',  approxStartSec: 203, text: 'And our side?' },
      { speakerId: 'rafael', approxStartSec: 207, text: 'By end of week: callback verification becomes mandatory for any bank-detail change — the clerk has to phone the vendor on the number of record and confirm. We tighten DMARC to reject, not quarantine, so look-alikes of our own domain bounce. And four-eyes isn\'t a soft rule anymore; it\'s a hard block in the AP system.' },
      { speakerId: 'priya',  approxStartSec: 236, text: 'Could we have lost the forty-seven on this one?' },
      { speakerId: 'rafael', approxStartSec: 241, text: 'Easily. If Elena hadn\'t spotted the IBAN mismatch, you\'d have wired it. Recovery on wires that cross a border into a mule network — you\'re usually walking back about ten percent, if you\'re fast and lucky.' },
      { speakerId: 'priya',  approxStartSec: 263, text: 'Then it\'s Elena I want to thank at standup. Not a lecture about controls, a thank-you.' },
      { speakerId: 'rafael', approxStartSec: 273, text: 'Do both. Thank her, then roll the control out company-wide. One clerk catching it is a near-miss, not a system. Let\'s make sure the next time someone tries to pull this off, the system catches it before Elena has to.' },
      { speakerId: 'priya',  approxStartSec: 296, text: 'Understood. Thanks, Rafael — I\'d rather be having this call than writing an insurance claim.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'The highest-loss cybercrime category reported to the FBI every year through 2024 isn\'t ransomware or data breach — it\'s invoice fraud. Someone pretends to be a vendor you already trust and asks you to send the next payment to a new bank account. Today you\'ll hear a finance controller walking IT security through a near-miss from last night.',
      hookEmoji: '💸',
      openQuestions: [
        { id: 'li1', prompt: 'In your organisation, how is a change of bank details for a vendor actually verified — is anyone required to pick up the phone?' },
        { id: 'li2', prompt: 'How quickly would your team notice if an attacker had been quietly reading a vendor\'s inbox for three weeks? What would give them away?' },
        { id: 'li3', prompt: 'If a wire has already gone to a fraudulent account, what do you think the realistic recovery percentage looks like — and why?', hint: 'The window to claw money back closes within hours once a border is crossed.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'Eight chunks — 5 of them phrasal verbs — that carry most of the weight when a finance team talks to security about an invoice-fraud near-miss.',
      items: [
        { id: 'v1', word: 'a look-alike domain',             pos: 'noun',         translation: 'Un dominio registrado con un nombre casi idéntico al legítimo (una letra cambiada, "rn" en lugar de "m"), para engañar la vista.',          example: '"Either a look-alike domain the attacker registered, or they got inside the real Novatek mailbox."',    definition: 'a domain registered with a name that is almost identical to a trusted one, designed to pass a quick visual check' },
        { id: 'v2', word: 'dwell time',                      pos: 'noun',         translation: 'El tiempo que el atacante lleva adentro del sistema antes de ser detectado — cuánto pudieron "leer" y aprender el patrón.',             example: '"If they were inside Novatek\'s account, the dwell time was long enough to learn our billing rhythm."',   definition: 'how long an attacker has been inside a system before being noticed' },
        { id: 'v3', word: 'the four-eyes principle',          pos: 'noun',        translation: 'La regla de "doble revisión": dos personas tienen que ver y aprobar una operación sensible antes de que se ejecute.',                    example: '"That\'s what Elena flagged up at the four-eyes stage."',                                                 definition: 'a control requiring two people to review and approve a sensitive action before it can proceed' },
        { id: 'v4', word: 'callback verification',            pos: 'noun',        translation: 'Verificación por teléfono: el que recibe la instrucción llama al vendor a un número ya conocido para confirmar el cambio.',              example: '"Callback verification becomes mandatory for any bank-detail change."',                                   definition: 'confirming a change by phoning the vendor on a number already on file, not one provided in the suspicious message' },
        { id: 'v5', word: 'to walk (something) back',         pos: 'phrasal-verb',translation: 'Revertir o retroceder sobre algo — recuperar fondos ya transferidos, retractarse de una decisión, deshacer un paso.',                  example: '"You\'re usually walking back about ten percent, if you\'re fast and lucky."',                            definition: 'to reverse, retract or recover something already done or sent' },
        { id: 'v6', word: 'to catch (someone) out',           pos: 'phrasal-verb',translation: 'Pescarle a alguien un error o engañarlo con un truco — queda en falta sin querer.',                                                       example: '"That\'s the part that caught her out for twenty minutes."',                                              definition: 'to trap or trip someone up unexpectedly, often by a clever trick' },
        { id: 'v7', word: 'to pull (something) off',          pos: 'phrasal-verb',translation: 'Lograr algo difícil, especialmente un plan audaz — en este contexto, un ataque que funciona.',                                           example: '"Next time someone tries to pull this off, the system catches it."',                                     definition: 'to succeed at doing something difficult or impressive' },
        { id: 'v8', word: 'to lock (something) down',         pos: 'phrasal-verb',translation: 'Cerrar el acceso de urgencia — una cuenta, un buzón, una cartera, mientras se investiga.',                                                example: '"Lock down Elena\'s mailbox and the AP shared inbox, pull the full headers for forensics."',              definition: 'to urgently restrict access to a resource, usually during an incident' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"Dwell time was long enough to learn our billing rhythm" means the attacker had…',
          options: [
            { id: 'a', text: 'already extracted the money and gone' },
            { id: 'b', text: 'been inside the mailbox long enough to observe how the business runs' },
            { id: 'c', text: 'been detected the moment they logged in' },
            { id: 'd', text: 'spent most of the time on unrelated mailboxes' },
          ],
          correct: 'b',
          explain: '"Dwell time" = time silently inside before detection. The longer, the more they learn.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'In the context of this call, "to walk back ten percent" means…',
          options: [
            { id: 'a', text: 'to apologise publicly for ten percent of the decision' },
            { id: 'b', text: 'to slow a process down by ten percent' },
            { id: 'c', text: 'to recover ten percent of the money already sent' },
            { id: 'd', text: 'to redirect ten percent of the funds through another account' },
          ],
          correct: 'c',
          explain: '"Walk X back" here = recover / reverse X — only about ten percent of money that has crossed into a mule network is typically clawed back.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"The four-eyes principle" exists so that…',
          options: [
            { id: 'a', text: 'one trained reviewer can veto the entire approval chain' },
            { id: 'b', text: 'a sensitive action requires a second, independent reviewer before it executes' },
            { id: 'c', text: 'the AP team rotates reviewers every month to spread workload' },
            { id: 'd', text: 'finance decisions always flow through the CFO personally' },
          ],
          correct: 'b',
          explain: '"Four eyes" = two people. Two independent reviewers on sensitive actions is the control that caught this invoice.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'A finance controller called security at 08:12. Before you listen, place your bets.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'How did the attacker try to redirect the payment?',
          options: [
            { id: 'a', text: 'By phoning the AP clerk directly and posing as the vendor\'s CFO' },
            { id: 'b', text: 'By sending a "banking details updated" email from a look-alike of the vendor domain' },
            { id: 'c', text: 'By walking into reception with a forged contract' },
            { id: 'd', text: 'By installing malware on the finance controller\'s laptop' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What ultimately stopped the wire from going out?',
          options: [
            { id: 'a', text: 'The bank refused the transfer because the amount was too large' },
            { id: 'b', text: 'An automated anti-fraud filter in the payment platform' },
            { id: 'c', text: 'The AP clerk noticed the IBAN country code didn\'t match the vendor\'s registered country' },
            { id: 'd', text: 'An IT alert triggered on the mailbox the night before' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What control will Rafael most likely roll out company-wide by the end of the week?',
          options: [
            { id: 'a', text: 'Mandatory callback verification for any bank-detail change' },
            { id: 'b', text: 'A ban on paying any new vendor until a full audit' },
            { id: 'c', text: 'Rotating every finance employee\'s email address' },
            { id: 'd', text: 'Hiring an external forensics firm to sit in-house for a month' },
          ],
          correct: 'a',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole call ONCE without pausing. Grab the headline moves.',
      listenFor: [
        'What exactly made the invoice look suspicious at the last moment',
        'What Rafael thinks the attacker had been doing before last night',
        'The control Rafael wants to turn into a hard rule, not a soft one',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'According to Priya, which single detail caught the attacker out at the four-eyes stage?',
          options: [
            { id: 'a', text: 'The invoice amount was €100 higher than usual' },
            { id: 'b', text: 'The vendor logo was slightly pixelated' },
            { id: 'c', text: 'The IBAN country code was LU instead of DE' },
            { id: 'd', text: 'The payment reference used the wrong format' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does Rafael believe the attacker was doing during the three weeks of continuous thread?',
          options: [
            { id: 'a', text: 'Running automated phishing at scale against the vendor' },
            { id: 'b', text: 'Sitting quietly inside the vendor\'s mailbox, learning the billing rhythm' },
            { id: 'c', text: 'Testing different IBANs to see which bank accepted them' },
            { id: 'd', text: 'Negotiating ransom with the vendor\'s IT team' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Rafael plans to leave the four-eyes rule as a soft guideline so teams can move quickly.',
          correct: 'F',
          explain: '"Four-eyes isn\'t a soft rule anymore; it\'s a hard block in the AP system." He is turning it into a system-enforced control.',
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
          sentence: 'The attempted wire transfer was for ___ ___ thousand euros to Novatek.',
          answers:  ['forty', 'seven'],
          alts:     [['47', 'fourty'], ['seven']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'What is Novatek\'s registered country, according to the call?',
          options: [
            { id: 'a', text: 'Luxembourg (LU)' },
            { id: 'b', text: 'Germany (DE)' },
            { id: 'c', text: 'Belgium (BE)' },
            { id: 'd', text: 'Netherlands (NL)' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'Exactly where did the look-alike trick appear in the sender address?',
          options: [
            { id: 'a', text: 'In the top-level domain (.co instead of .com)' },
            { id: 'b', text: 'In the local part before the @' },
            { id: 'c', text: 'As "rn" instead of "m" on the subdomain, not the root' },
            { id: 'd', text: 'As a Cyrillic character replacing a Latin letter' },
          ],
          correct: 'c',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Rafael wants to phone Novatek\'s security contact using the number on last year\'s ___ , not the one on the invoice.',
          answers:  ['contract'],
          alts:     [[]],
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'What DMARC posture change does Rafael propose?',
          options: [
            { id: 'a', text: 'Move DMARC from reject to quarantine, so legitimate mail still flows' },
            { id: 'b', text: 'Tighten DMARC to reject, so look-alikes of their own domain bounce' },
            { id: 'c', text: 'Disable DMARC temporarily while they investigate' },
            { id: 'd', text: 'Enable DMARC reporting only, with no enforcement' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd6',
          sentence: 'According to Rafael, if money crosses a border into a mule network you are typically walking back about ___ percent.',
          answers:  ['ten'],
          alts:     [['10']],
        },
        {
          kind: 'mcq',
          id: 'd7',
          prompt: 'What immediate containment step does Rafael list first?',
          options: [
            { id: 'a', text: 'Draft a press statement for customers' },
            { id: 'b', text: 'File a report with the police' },
            { id: 'c', text: 'Lock down Elena\'s mailbox and the AP shared inbox' },
            { id: 'd', text: 'Freeze the entire company\'s payment platform' },
          ],
          correct: 'c',
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Priya wants to lecture Elena about following controls more carefully next time.',
          correct: 'F',
          explain: '"It\'s Elena I want to thank at standup. Not a lecture about controls, a thank-you."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five B2+ moves that lift this from "textbook incident" to "how finance and security actually talk to each other".',
      chunks: [
        {
          id:       'c1',
          chunk:    'the one that keeps me up',
          category: 'idiom',
          gloss:    'Lo que me mantiene despierto — lo que de verdad me preocupa',
          example:  '"That\'s the one that keeps me up. Dwell time is where the real damage sits."',
          notice:   'Idiom from "keeps me up at night". In senior conversation, dropped to the short form — honest signal that this is the risk the speaker genuinely loses sleep over. Use when flagging THE concern, not a concern.',
        },
        {
          id:       'c2',
          chunk:    'that\'s the part that caught her out',
          category: 'grammar-pattern',
          gloss:    'Cleft con "that\'s the part that…" — señala qué elemento específico fue el engaño',
          example:  '"That\'s the part that caught her out for twenty minutes."',
          notice:   'Cleft structure "that\'s the part that + V". Isolates one element from a chain of events and marks it as the pivotal one. Compare: "The subdomain caught her out" (flat) vs. "That\'s the part that caught her out" (I\'m zooming in). High-value in debriefs.',
        },
        {
          id:       'c3',
          chunk:    'if she hadn\'t spotted the IBAN mismatch, you\'d have wired it',
          category: 'grammar-pattern',
          gloss:    'Tercer condicional: situación hipotética en el pasado con consecuencia hipotética en el pasado',
          example:  '"Easily. If Elena hadn\'t spotted the IBAN mismatch, you\'d have wired it."',
          notice:   'Classic third conditional for near-miss storytelling. "If + past perfect, would have + past participle." Finance and security teams lean on this structure constantly when writing up a close call. Delivery is matter-of-fact, not dramatic.',
        },
        {
          id:       'c4',
          chunk:    'walk me through X',
          category: 'phrasal-verb',
          gloss:    'Guiame paso a paso por X — explicame el proceso ordenado',
          example:  '"OK. Walk me through what she caught."',
          notice:   '"Walk + object + through + noun" — request for a sequenced explanation, not a summary. Different from "tell me about". Used when the listener wants the chronology, not just the headline. Opens most incident briefs.',
        },
        {
          id:       'c5',
          chunk:    'I\'d rather be having this call than writing an insurance claim',
          category: 'register',
          gloss:    'Prefiero estar en esta llamada que escribiendo una reclamación — gratitud madura por una falsa alarma',
          example:  '"Understood. Thanks, Rafael — I\'d rather be having this call than writing an insurance claim."',
          notice:   '"Would rather + bare infinitive + than + -ing". Mature acceptance when a near-miss turned out well. Thanks the incident while naming the alternative that didn\'t happen. Common sign-off in good incident culture.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks and phrasal verbs in short, realistic turns.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '"The vendor sent new wire instructions at the last minute. If accounts hadn\'t ___ it up, we\'d have paid the fake IBAN."',
          answers:  ['flagged'],
          hint:     'Phrasal verb from the vocab list — raise something to management\'s attention.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses "walk X through Y" the way Rafael does?',
          options: [
            { id: 'a', text: 'Walk the vendor through the parking lot to the meeting room.' },
            { id: 'b', text: 'Walk me through what she caught — step by step, nothing summarised.' },
            { id: 'c', text: 'Walk through the vendor and sign the document at reception.' },
            { id: 'd', text: 'Walk the controls through the compliance audit for sign-off.' },
          ],
          correct: 'b',
          explain: '"Walk someone through X" = give a sequenced, step-by-step explanation. Opens incident briefs.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"The attacker spent three weeks in the vendor\'s inbox before they tried to ___ it ___. The dwell time is the real story."',
          answers:  ['pull', 'off'],
          hint:     'Phrasal verb from the vocab list — succeed at a difficult plan.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Which sentence uses the third conditional of near-miss correctly?',
          options: [
            { id: 'a', text: 'If she don\'t spot the mismatch, we would have wired the money.' },
            { id: 'b', text: 'If she hasn\'t spotted the mismatch, we would have wired the money.' },
            { id: 'c', text: 'If she hadn\'t spotted the mismatch, we\'d have wired the money.' },
            { id: 'd', text: 'If she wouldn\'t have spotted the mismatch, we\'d wire the money.' },
          ],
          correct: 'c',
          explain: 'Third conditional: "If + past perfect, would have + past participle." Standard near-miss narrative.',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: '"The moment we suspected the mailbox was compromised, I asked IT to ___ ___ the shared inbox and pull the headers."',
          answers:  ['lock', 'down'],
          hint:     'Phrasal verb from the vocab list — urgently restrict access.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'You\'re either the finance lead who spotted a near-miss or the security contact being briefed on one. Record 90 seconds. Pick a realistic scenario (your own, or one you can construct): a changed IBAN, a convincing invoice at the wrong moment, a vendor contact you weren\'t sure was really them.',
      mode:         'speaking',
      prompt:       'Record 90 seconds. Cover: (1) what the request looked like and why it was convincing, (2) the one detail that didn\'t fit — what caught the attacker out, (3) your best guess at the attacker\'s dwell time and what they learned, (4) the containment step in the first hour (what you lock down, who you phone back on which number), (5) the control you want to roll out company-wide this week. Use at least 3 of: "walk me through", "that\'s the part that caught them out", "the one that keeps me up", "if X hadn\'t spotted Y, we\'d have…", "I\'d rather be having this call than writing an insurance claim".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
