// Friendlistenings® — B2+ · The retry helper we never asked for
//
// Built for Guillermo (software developer) after "Off the beaten path"
// didn't push him enough. A ~3:40 incident call between an application
// security engineer and a staff backend developer: the CI pipeline
// blocked a deploy overnight because a typo-squatted npm package the
// dev had added — on a suggestion from his AI coding assistant — was
// exfiltrating credentials from the postinstall hook.
//
// The scenario mirrors the actual pattern we've seen hit npm and PyPI
// repeatedly in 2024-2026 (Shai-Hulud family + the newer wave of
// AI-assist-amplified typosquat packages reported through this
// autumn's npm advisories). All names/package names are fictional;
// the mechanics are real.
//
// Register is B2+: past modals of criticism ("you shouldn't have…"),
// cleft-with-"what" ("that's what saved us"), security collocations
// (blast radius, rotate credentials, supply chain attack), and
// mature acceptance hedges ("I'd rather hear it like this"). Rich in
// developer vocabulary, kept natural rather than jargon-stuffed.
//
// 8-step arc, ~55-minute slot:
//   1. Lead-in     · 4 min — supply chain / AI-assisted dev schema
//   2. Vocab       · 9 min — 8 security + dev chunks + 3 checks
//   3. Prediction  · 3 min — what did the package do?
//   4. Gist        · 6 min — the mechanism + Daniel's response
//   5. Detail      · 12 min — specifics (file paths, tokens, timing)
//   6. Awareness   · 8 min — 5 B2+ chunks
//   7. Controlled  · 6 min — reuse the chunks
//   8. Production  · 7 min — 90-sec speaking: an incident of your own

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB2PlusDevSupplyChainAttack: FLLesson = {
  id:           'b2plus-dev-supply-chain-attack',
  title:        'The retry helper we never asked for',
  subtitle:     'A midnight incident in the dev team',
  level:        'B2+',
  topic:        'Developer security · npm supply-chain / typosquat · AI-assisted coding risk',
  scenario:     'Priya, an application security engineer, walks Daniel through what the CI hook caught at 23:47: a typo-squatted npm package his AI assistant suggested, exfiltrating his tokens through a postinstall script. They plan containment, rotation, and a company-wide block.',
  estimatedMin: 55,
  tags:         ['tech', 'security', 'developer', 'supply-chain', 'ai-tools', 'past-modals'],
  createdAt:    '2026-11-18',

  cover: {
    accent: '#0F766E',
    emoji:  '🛡️',
  },

  audio: {
    durationSec: 220,
    speakers: [
      {
        id: 'priya', displayName: 'Priya', accent: 'UK', gender: 'f',
        suggestedVoice: { voiceId: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', note: 'ElevenLabs · articulate female, measured security-engineer cadence — clear through technical terms without sounding rushed' },
      },
      {
        id: 'daniel', displayName: 'Daniel', accent: 'UK', gender: 'm',
        suggestedVoice: { voiceId: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Daniel', note: 'ElevenLabs · deep British male, staff-engineer tone — composed under pressure, lightly apologetic' },
      },
    ],
    script: [
      { speakerId: 'priya',  approxStartSec:   0, text: 'Daniel, thanks for jumping on at this hour. We\'ve got an incident — your CI build at eleven-forty-seven last night failed a dependency check. The build hook caught a package called axios-retry-helper.' },
      { speakerId: 'daniel', approxStartSec:  15, text: 'Yeah, I added that last week. I wrote a retry wrapper and the AI assistant suggested it as the cleanest dependency. What did the hook catch?' },
      { speakerId: 'priya',  approxStartSec:  28, text: 'The postinstall script in that package runs a curl to a domain I\'ve never seen before — nineteen characters, random, registered seventy-two hours ago. On install it exfiltrates your environment variables, your .npmrc token, and anything readable in git-credentials.' },
      { speakerId: 'daniel', approxStartSec:  50, text: 'Oh no. So it\'s a supply chain attack.' },
      { speakerId: 'priya',  approxStartSec:  55, text: 'Yes, and more specifically a typo-squat. The real package you probably meant is axios-retry — plural, mature, five million weekly downloads. The one you installed is new, published by an account with no other packages and no public repo. The AI didn\'t know it was spoofed.' },
      { speakerId: 'daniel', approxStartSec:  78, text: 'What\'s the blast radius? Did it reach prod?' },
      { speakerId: 'priya',  approxStartSec:  85, text: 'No — that\'s what saved us. Our lock-file policy flagged a new dependency that wasn\'t on the approved list, so the deploy was blocked. The package did execute on your laptop, though. We have to treat your machine and every token on it as compromised.' },
      { speakerId: 'daniel', approxStartSec: 108, text: 'So we rotate everything.' },
      { speakerId: 'priya',  approxStartSec: 112, text: 'Everything. Your GitHub personal access token, your npm auth token, your AWS access keys, your Vault session. I\'m killing your SSO session right now, and we\'ll wipe the laptop this afternoon. If there\'s anything local you still need, it comes through me first.' },
      { speakerId: 'daniel', approxStartSec: 138, text: 'Understood. What about the package itself?' },
      { speakerId: 'priya',  approxStartSec: 143, text: 'I\'ve opened a report with npm security — they usually take typo-squats down within a day. We\'re also pushing a company-wide block via our private registry proxy, so no one else on the team can install it by accident.' },
      { speakerId: 'daniel', approxStartSec: 160, text: 'And I assume I should stop just accepting AI-suggested packages.' },
      { speakerId: 'priya',  approxStartSec: 167, text: 'Not stop — verify. Treat every package the AI suggests like a pull request from a stranger. Check the publisher, the download history, the repo. If there\'s no repo, that\'s already a red flag. And for anything new: install with --ignore-scripts, do a dry run in a container first.' },
      { speakerId: 'daniel', approxStartSec: 192, text: 'Got it. I\'ll walk the team through this at standup.' },
      { speakerId: 'priya',  approxStartSec: 198, text: 'Good. One last thing — don\'t frame it as your fault. The AI is the new attack surface here, not you. If we can\'t protect each other from a package that didn\'t exist last week, the whole org has a problem.' },
      { speakerId: 'daniel', approxStartSec: 214, text: 'Thanks, Priya. I\'d rather hear it like this than at a postmortem.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Through 2024-2026 attackers have leaned hard on the "supply chain" — attacking the libraries developers install rather than the apps themselves. The newest twist: AI coding assistants sometimes recommend a package that doesn\'t really exist, and an attacker races to publish a malicious version under that exact name. Today you\'ll hear a security engineer walking a developer through one of those overnight.',
      hookEmoji: '🛡️',
      openQuestions: [
        { id: 'li1', prompt: 'How do you decide whether to trust a new library you\'re about to install — do you actually check the publisher, the repo and the postinstall scripts?' },
        { id: 'li2', prompt: 'Has an AI coding assistant ever suggested something that turned out to be wrong, non-existent, or risky? What did you do?' },
        { id: 'li3', prompt: 'What should happen in the first thirty minutes after a developer realises their laptop may be compromised?', hint: 'Order usually matters: contain first, investigate second.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'Eight chunks any B2+ developer needs when a security engineer walks into their calendar unannounced.',
      items: [
        { id: 'v1', word: 'a supply chain attack',        pos: 'noun',         translation: 'Ataque de cadena de suministro: en vez de atacar tu app, el atacante compromete una librería o herramienta en la que tu app confía.',  example: 'So it\'s a supply chain attack.',                                                                      definition: 'an attack on a dependency or tool your app relies on, rather than on your app directly' },
        { id: 'v2', word: 'a typo-squat (/ typosquat)',    pos: 'noun',        translation: 'Un paquete malicioso publicado con un nombre casi idéntico a uno real, para que alguien lo instale por error de tipeo o autocompletado.', example: 'More specifically, a typo-squat.',                                                                    definition: 'a malicious package named almost identically to a real one so people install it by mistake' },
        { id: 'v3', word: 'a postinstall script / hook',   pos: 'noun',        translation: 'Un script que se ejecuta automáticamente justo después de instalar un paquete (puede hacer cualquier cosa en tu máquina).',              example: 'The postinstall script in that package runs a curl to a domain I\'ve never seen before.',             definition: 'a script that runs automatically right after a package is installed' },
        { id: 'v4', word: 'to exfiltrate (credentials)',   pos: 'verb',        translation: 'Sacar datos sensibles (tokens, credenciales, archivos) hacia afuera de tu máquina / red sin permiso.',                                     example: 'It exfiltrates your environment variables and your .npmrc token.',                                    definition: 'to secretly move sensitive data out of a system to the attacker' },
        { id: 'v5', word: 'to rotate (tokens / keys)',     pos: 'verb',        translation: 'Revocar las credenciales actuales y generar nuevas. Lo que se hace apenas sospechas que algo se filtró.',                                    example: 'So we rotate everything.',                                                                            definition: 'to revoke old credentials and issue fresh ones, usually after a leak' },
        { id: 'v6', word: 'the blast radius',               pos: 'noun',       translation: 'Qué tan lejos llega el daño si algo falla / si algo se vulneró. Metáfora de explosión.',                                                     example: 'What\'s the blast radius? Did it reach prod?',                                                        definition: 'how far the damage of an incident can spread' },
        { id: 'v7', word: 'to flag (something) as X',      pos: 'phrasal-verb',translation: 'Marcar algo como sospechoso / que requiere revisión.',                                                                                      example: 'Our lock-file policy flagged a new dependency that wasn\'t on the approved list.',                     definition: 'to mark something as suspicious or needing attention' },
        { id: 'v8', word: 'to take (something) down',      pos: 'phrasal-verb',translation: 'Bajar / eliminar algo del aire, especialmente contenido o un paquete malicioso del registro público.',                                      example: 'They usually take typo-squats down within a day.',                                                    definition: 'to remove something — typically a malicious or published asset — from its platform' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"It exfiltrates your .npmrc token" means it is…',
          options: [
            { id: 'a', text: 'encrypting it on your machine so you can\'t use it' },
            { id: 'b', text: 'silently sending it out to an attacker' },
            { id: 'c', text: 'deleting it from your home folder' },
          ],
          correct: 'b',
          explain: '"Exfiltrate" = quietly move data out to somewhere it shouldn\'t go. Core security vocabulary.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"Our lock-file policy flagged a new dependency" means the policy…',
          options: [
            { id: 'a', text: 'approved the dependency silently' },
            { id: 'b', text: 'installed the dependency and let it run' },
            { id: 'c', text: 'raised an alert about the dependency' },
          ],
          correct: 'c',
          explain: 'To "flag" X = raise a signal that X needs attention, without necessarily blocking it. Here it also blocked the deploy.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"We rotate everything" after a compromise means you…',
          options: [
            { id: 'a', text: 'move every service to a new region' },
            { id: 'b', text: 'revoke and reissue every credential that may have leaked' },
            { id: 'c', text: 'restart every production server in order' },
          ],
          correct: 'b',
          explain: '"Rotate credentials" is the standard term for burning the old tokens and issuing new ones after a suspected leak.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'A CI hook caught a package at 23:47 last night. Before you hear the call, make your bets.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'How did the malicious package get into the project in the first place?',
          options: [
            { id: 'a', text: 'A direct phishing attack on the dev\'s inbox' },
            { id: 'b', text: 'The dev added it on a suggestion from an AI coding assistant' },
            { id: 'c', text: 'Someone pushed to the dev\'s fork and opened a PR' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Did the malicious code reach production?',
          options: [
            { id: 'a', text: 'Yes, and prod data was leaked' },
            { id: 'b', text: 'No, the CI policy blocked the deploy' },
            { id: 'c', text: 'Yes, but only to a staging environment' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What will the security engineer most likely recommend going forward?',
          options: [
            { id: 'a', text: 'Ban AI coding assistants across the team' },
            { id: 'b', text: 'Keep using the AI, but verify every package it suggests' },
            { id: 'c', text: 'Freeze all new dependencies for the next quarter' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole call ONCE without pausing. Catch the big picture.',
      listenFor: [
        'Exactly what the package did to Daniel\'s machine',
        'Whether prod was affected',
        'The main instruction Priya leaves Daniel with',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What does Priya identify the package as?',
          options: [
            { id: 'a', text: 'A typo-squat with a malicious postinstall script' },
            { id: 'b', text: 'An outdated version with a known CVE' },
            { id: 'c', text: 'A legitimate package misconfigured by the dev' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'Why didn\'t the attack reach production?',
          options: [
            { id: 'a', text: 'Daniel noticed in time and rolled the commit back' },
            { id: 'b', text: 'The CI lock-file policy flagged the new dependency and blocked the deploy' },
            { id: 'c', text: 'The attacker\'s C2 server happened to be down overnight' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Priya tells Daniel he should stop using AI coding assistants entirely.',
          correct: 'F',
          explain: '"Not stop — verify." She wants the AI kept in the loop, but every suggestion treated like a PR from a stranger.',
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
          sentence: 'Daniel\'s CI build failed at ___:___ last night.',
          answers:  ['11', '47'],
          alts:     [['eleven', '23'], ['forty-seven']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'How long before the incident was the attacker\'s domain registered?',
          options: [
            { id: 'a', text: 'About seventy-two hours' },
            { id: 'b', text: 'About a week' },
            { id: 'c', text: 'More than a month' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'What does Priya say the postinstall script exfiltrates?',
          options: [
            { id: 'a', text: 'Only the project\'s source code' },
            { id: 'b', text: 'Environment variables, .npmrc token and anything in git-credentials' },
            { id: 'c', text: 'The company\'s production database dumps' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'The real package Daniel probably meant to install is ___-___ (plural, mature, five million weekly downloads).',
          answers:  ['axios', 'retry'],
          alts:     [['axios'], ['retry']],
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'Which credentials does Priya explicitly tell Daniel to rotate?',
          options: [
            { id: 'a', text: 'Only his GitHub token' },
            { id: 'b', text: 'His GitHub PAT, npm auth token, AWS access keys and Vault session' },
            { id: 'c', text: 'Only his cloud provider credentials' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'What will the company push through their private registry proxy?',
          options: [
            { id: 'a', text: 'A new version of the legitimate package' },
            { id: 'b', text: 'A company-wide block on the malicious package' },
            { id: 'c', text: 'A read-only mode for all packages' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd7',
          sentence: 'For anything new, Priya suggests installing with --___-___ and doing a dry run in a container first.',
          answers:  ['ignore', 'scripts'],
          alts:     [['ignore'], ['scripts']],
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Priya frames the situation as primarily Daniel\'s fault.',
          correct: 'F',
          explain: '"Don\'t frame it as your fault. The AI is the new attack surface here, not you."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five B2+ chunks that make this sound like a real security engineer, not a textbook incident drill.',
      chunks: [
        {
          id:       'c1',
          chunk:    'that\'s what saved us',
          category: 'grammar-pattern',
          gloss:    'Cleft con "what" para destacar la causa del rescate',
          example:  '"No — that\'s what saved us. Our lock-file policy flagged a new dependency."',
          notice:   'Cleft structure: "X is what did Y." Lets you spotlight the single thing that mattered. Compare: "The lock-file policy saved us." (flat) vs. "That\'s what saved us." (dramatic emphasis). Classic incident-review language.',
        },
        {
          id:       'c2',
          chunk:    'treat X like Y',
          category: 'collocation',
          gloss:    'Tratar X como si fuera Y — reencuadrar algo familiar como algo que exige otro nivel de cuidado',
          example:  '"Treat every package the AI suggests like a pull request from a stranger."',
          notice:   'Instructional reframing. Takes something the listener is used to doing casually (installing a package) and re-labels it as something they already know to treat carefully (reviewing a stranger\'s PR). Very common in security coaching.',
        },
        {
          id:       'c3',
          chunk:    'that\'s already a red flag',
          category: 'idiom',
          gloss:    'Eso ya es una señal de alarma — algo que, por sí solo, debería parar la decisión',
          example:  '"If there\'s no repo, that\'s already a red flag."',
          notice:   'Idiom from flag-based warning systems. "Red flag" alone is overused; the phrase "already a red flag" sharpens it — "even on its own this is enough to stop". Use for single signals strong enough to decide on.',
        },
        {
          id:       'c4',
          chunk:    'to take X down',
          category: 'phrasal-verb',
          gloss:    'Bajar algo publicado (un paquete, un video, un sitio) a petición',
          example:  '"They usually take typo-squats down within a day."',
          notice:   'Separable: "take it down" ✓, "take the package down" ✓. The object slides between the verb and the particle. Different sense from "take down notes" or "take down a wall".',
        },
        {
          id:       'c5',
          chunk:    'I\'d rather hear it like this than at a postmortem',
          category: 'register',
          gloss:    'Prefiero escucharlo así (ahora, en vivo) que después en una autopsia — aceptación madura de una mala noticia',
          example:  '"Thanks, Priya. I\'d rather hear it like this than at a postmortem."',
          notice:   '"Would rather + bare infinitive + than + noun". Signals that the listener is taking the hit professionally — no defensiveness, grateful the news came early. A mature close in any incident call.',
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
          sentence: '"The CI job caught a secret being committed. ___\'s what ___ us from a public leak."',
          answers:  ['That', 'saved'],
          hint:     'Cleft-with-"what" from Priya\'s line.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses "treat X like Y" the way Priya does?',
          options: [
            { id: 'a', text: 'Treat every merge request as a merge request.' },
            { id: 'b', text: 'Treat every AI-suggested package like a pull request from a stranger.' },
            { id: 'c', text: 'Treat every package by installing it.' },
          ],
          correct: 'b',
          explain: '"Treat X like Y" reframes something familiar as something that deserves another level of caution.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"The package has no public repo and no download history. That\'s already a ___ ___."',
          answers:  ['red', 'flag'],
          hint:     'One signal strong enough to stop a decision.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Which one uses "take down" correctly?',
          options: [
            { id: 'a', text: 'npm took down the package within a few hours of our report.' },
            { id: 'b', text: 'npm took the package during a few hours down.' },
            { id: 'c', text: 'npm took on the package down within a few hours.' },
          ],
          correct: 'a',
          explain: '"Take X down" / "take down X" — both orders valid, but the object never floats to a weird spot.',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: '"I\'d ___ hear it like this ___ at a postmortem."',
          answers:  ['rather', 'than'],
          hint:     'Preference pattern after bad news.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'You\'re a developer. Pick a real incident (or a very realistic one): an exposed secret, a bad dependency, a misconfigured IAM role, an AI-generated snippet that leaked something. Record 90 seconds explaining it to a security engineer — honestly.',
      mode:         'speaking',
      prompt:       'Record 90 seconds. Cover: (1) a one-line summary of what you found or what caught it, (2) how the risky thing got in (AI suggestion, copy-paste, old habit…), (3) the blast radius — what\'s potentially exposed, (4) what you\'re rotating / taking down / locking down, (5) what you\'re changing in your workflow so it doesn\'t happen again. Use at least 3 of: "that\'s what saved us", "treat X like Y", "that\'s already a red flag", "take it down", "I\'d rather hear it like this than at a postmortem".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
