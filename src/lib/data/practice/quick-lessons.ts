// FriendlyTeaching.cl — Pre-workout explainers for every Daily Practice unit
//
// One short lesson per unit, keyed by the unit id defined in
// general-english.ts. Kept in its own file so the exercise data doesn't
// grow unreadable. The main PRACTICE_UNITS array merges these in when
// it imports from the index below.
//
// Authoring guidelines:
//   · Summary: ONE sentence the student reads on the card and at the
//     top of the Quick Lesson page.
//   · Sections: 2-3 blocks. Each has a short body (2-5 sentences), a
//     handful of examples (bold the grammar target with **…**), and
//     optionally a `tip` callout for a frequent mistake / mnemonic.
//   · Keep the English UI tone — the platform is in English, so
//     explain in English even when discussing L1 interference.

import type { QuickLesson } from '@/types/practice';

export const QUICK_LESSONS: Record<string, QuickLesson> = {

  // ── A0 ─────────────────────────────────────────────────────

  'a0-greetings': {
    summary: 'Hello, goodbye, "What is your name?" and "Nice to meet you" — the basic opening moves of every English conversation.',
    sections: [
      {
        heading: 'Hellos and goodbyes',
        body: 'Use "Hello" or "Hi" when you meet someone. Use "Goodbye" or "Bye" when you leave. Time-of-day greetings are "Good morning", "Good afternoon", "Good evening".',
        examples: [
          '**Hello**! How are you?',
          '**Good morning**, Mr. Lopez.',
          '**Bye**! See you tomorrow.',
        ],
      },
      {
        heading: 'Introducing yourself',
        body: 'Give your name with "My name is …" or "I am …". Ask for a name with "What is your name?". Reply to a new introduction with "Nice to meet you".',
        examples: [
          '**My name is** Anna.',
          '**I am** from Chile.',
          '**Nice to meet you** too.',
        ],
        tip: '"Nice to meet you" is only used the FIRST time you meet someone. After that, use "Nice to see you again".',
      },
    ],
  },

  'a0-numbers': {
    summary: 'Numbers 1–20 — reading them, writing them, and using them to say how old you are or how many you have.',
    sections: [
      {
        heading: 'Numbers 1 to 12',
        body: 'The first twelve numbers have their own name. Memorise them as a block — they do not follow a pattern.',
        examples: [
          'one, two, three, four, five',
          'six, seven, eight, nine, ten',
          'eleven, twelve',
        ],
      },
      {
        heading: 'Numbers 13 to 19 — the "-teen" family',
        body: 'From 13 to 19 we take the small number and add "-teen". Stress is on the "-teen" ending.',
        examples: [
          '**thir**teen, **four**teen, **fif**teen',
          '**six**teen, **seven**teen',
          '**eigh**teen, **nine**teen, **twen**ty',
        ],
        tip: 'Watch the spelling: thirteen, fifteen and eighteen are the irregular ones.',
      },
    ],
  },

  'a0-colors': {
    summary: 'Basic colors and how to say "what color is it?" — plus the standard color adjective order (color goes before the noun).',
    sections: [
      {
        heading: 'Core colors',
        body: 'Colors are adjectives. They do not change for singular / plural.',
        examples: [
          'red, blue, green, yellow',
          'black, white, grey, brown',
          'orange, pink, purple',
        ],
      },
      {
        heading: 'Color + noun order',
        body: 'In English the color goes BEFORE the noun, never after. Say "a red car", NOT "a car red".',
        examples: [
          'A **red** car.',
          'Two **blue** books.',
          'My **green** t-shirt.',
        ],
        tip: 'Asking the color? "What color is it?" — notice there is no "the" before "color" in this question.',
      },
    ],
  },

  // ── A1 ─────────────────────────────────────────────────────

  'a1-verb-to-be': {
    summary: 'The verb "to be" in the present — the single most important verb to master before everything else.',
    sections: [
      {
        heading: 'Positive forms',
        body: 'The verb "to be" has three forms in the present: am (I), is (he/she/it), are (you/we/they). Use contractions in speech.',
        examples: [
          'I **am** a student. → I **\'m** a student.',
          'She **is** happy. → She **\'s** happy.',
          'They **are** from Spain. → They **\'re** from Spain.',
        ],
      },
      {
        heading: 'Negatives and questions',
        body: 'To make a negative, add "not" after the verb. To make a question, put the verb BEFORE the subject.',
        examples: [
          'I **am not** tired. → I **\'m not** tired.',
          'She **is not** here. → She **isn\'t** here.',
          '**Are** you ready?',
        ],
        tip: 'Spanish speakers often skip "to be" — "I tired" instead of "I am tired". Always keep the verb in English.',
      },
    ],
  },

  'a1-family': {
    summary: 'Family words (mother, father, brother…) and possessives (my, your, his, her) to talk about your family.',
    sections: [
      {
        heading: 'Family vocabulary',
        body: 'Core family terms are gender-specific in English, like in Spanish, but there is no "o/a" ending.',
        examples: [
          'mother / father, sister / brother',
          'daughter / son, aunt / uncle',
          'grandmother / grandfather',
        ],
      },
      {
        heading: 'Possessive adjectives',
        body: 'Possessives go BEFORE the noun, and do NOT change with the noun. "My brother" and "my sisters" both use "my".',
        examples: [
          '**My** mother is a teacher.',
          '**His** sister is 10.',
          '**Their** parents live in Lima.',
        ],
        tip: 'His vs. her depends on the OWNER, not the thing owned. "John and his sister" (owner = John) vs. "Mary and her brother" (owner = Mary).',
      },
    ],
  },

  'a1-have-got': {
    summary: 'Using "have got" to talk about possession, family, and features — the everyday British alternative to "have".',
    sections: [
      {
        heading: 'Have got vs. have',
        body: '"I have got a car" and "I have a car" mean the same thing. "Have got" is a bit more informal; "have" is more common in US English.',
        examples: [
          'I **have got** two sisters. = I **have** two sisters.',
          'She **has got** blue eyes.',
          'We **have got** a big dog.',
        ],
      },
      {
        heading: 'Negatives and questions',
        body: 'With "have got" the auxiliary is "have / has". Negatives: "haven\'t got / hasn\'t got". Questions: "Have you got…?".',
        examples: [
          'I **haven\'t got** a phone.',
          'She **hasn\'t got** a car.',
          '**Have you got** a minute?',
        ],
        tip: 'In US English the question is "Do you have a minute?" — same meaning.',
      },
    ],
  },

  // ── A2 ─────────────────────────────────────────────────────

  'a2-present-simple': {
    summary: 'Present simple for habits and facts — plus the famous "-s" for he / she / it in the third person.',
    sections: [
      {
        heading: 'When to use it',
        body: 'Use present simple for things that are always true, routines, and permanent states. Not for things happening right now (that is present continuous).',
        examples: [
          'I **work** in a bank.',
          'She **lives** in Mendoza.',
          'Water **boils** at 100 degrees.',
        ],
      },
      {
        heading: 'Third person "-s"',
        body: 'For he / she / it, add "-s" (or "-es" after -s, -sh, -ch, -x, -o). Verbs ending in consonant + "y" turn the y into "ies".',
        examples: [
          'he **works**, she **studies**, it **goes**',
          'My dad **watches** TV every night.',
          'She **tries** to call me every Sunday.',
        ],
        tip: 'Negatives and questions use "do / does" — and the main verb LOSES the -s: "She **doesn\'t work** here", NOT "doesn\'t works".',
      },
    ],
  },

  'a2-daily-routines': {
    summary: 'Adverbs of frequency (always, usually, often, sometimes, never) to describe how often you do something.',
    sections: [
      {
        heading: 'Position matters',
        body: 'Frequency adverbs go BEFORE a main verb, but AFTER the verb "to be".',
        examples: [
          'I **always** have coffee in the morning.',
          'She is **usually** late.',
          'We **sometimes** go to the beach.',
        ],
      },
      {
        heading: 'The frequency scale',
        body: 'Rough percentages: always ≈100%, usually ≈80%, often ≈70%, sometimes ≈50%, rarely ≈10%, never ≈0%.',
        examples: [
          'I **always** brush my teeth before bed.',
          'I **rarely** eat fast food.',
          'I **never** drink coffee at night.',
        ],
        tip: 'Expressions like "every day", "twice a week", "on Mondays" go at the START or END of the sentence, not in the middle.',
      },
    ],
  },

  'a2-past-simple': {
    summary: 'Past simple for finished actions — regular "-ed" verbs plus the irregulars you have to just learn.',
    sections: [
      {
        heading: 'Regular vs. irregular',
        body: 'Most verbs add "-ed" for the past. But the 100-ish most common verbs are irregular and have unique past forms you memorise.',
        examples: [
          'work → **worked**, play → **played**, study → **studied**',
          'go → **went**, see → **saw**, eat → **ate**',
          'be → **was / were**, have → **had**, do → **did**',
        ],
      },
      {
        heading: 'Negatives and questions use "did"',
        body: 'For negatives and questions we use "did / didn\'t", and the main verb goes back to the base form (no -ed, no irregular past).',
        examples: [
          'I **didn\'t go** to the party. (not "didn\'t went")',
          '**Did** you **see** the email?',
          'What **did** he **say**?',
        ],
        tip: 'Time markers signal past simple: yesterday, last week, in 2020, two days ago. If you see one, past simple is usually right.',
      },
    ],
  },

  // ── B1 ─────────────────────────────────────────────────────

  'b1-past-vs-present-perfect': {
    summary: 'When to use past simple vs. present perfect — one of the trickiest contrasts for Spanish speakers.',
    sections: [
      {
        heading: 'Past simple: finished time',
        body: 'Past simple is for actions at a SPECIFIC finished moment: yesterday, last year, in 2015, when I was 10.',
        examples: [
          'I **saw** her yesterday.',
          'He **lived** in Madrid in 2018.',
          'They **got** married two years ago.',
        ],
      },
      {
        heading: 'Present perfect: connected to now',
        body: 'Use present perfect when the past action matters in the present — the time period is still open ("today", "this year"), or the result is still visible.',
        examples: [
          'I **have seen** this movie three times.',
          'She **has lived** in Madrid since 2018. (still there)',
          '**Have** you **eaten**? (I\'m asking now)',
        ],
        tip: 'Red flag words for PRESENT PERFECT: ever, never, yet, already, just, so far, this week. Red flags for PAST SIMPLE: yesterday, ago, last…, in 2020.',
      },
    ],
  },

  'b1-phrasal-verbs': {
    summary: 'High-frequency everyday phrasal verbs (give up, look for, run out of…) that native speakers use constantly.',
    sections: [
      {
        heading: 'What they are',
        body: 'A phrasal verb is a verb + small word (up, off, out, on…) whose meaning is usually NOT guessable from the parts. "Give up" means to quit — not to give something upward.',
        examples: [
          '**Give up** smoking = to quit smoking.',
          '**Look for** the keys = to search for the keys.',
          '**Run out of** milk = to have none left.',
        ],
      },
      {
        heading: 'Separable vs. inseparable',
        body: 'Some phrasal verbs can be split by their object (turn OFF the light / turn the light OFF). Others cannot (look AFTER the kids, never "look the kids after").',
        examples: [
          'Turn **off** the TV. / Turn the TV **off**. ✓',
          'She **looks after** her grandmother. ✓',
          'She looks her grandmother after. ✗',
        ],
        tip: 'When the object is a pronoun (it, them, her), separable phrasal verbs MUST split: "turn it off" ✓, "turn off it" ✗.',
      },
    ],
  },

  'b1-reported-speech': {
    summary: 'Reporting what someone said — tenses "shift back" one step from the original.',
    sections: [
      {
        heading: 'Back-shift of tenses',
        body: 'When you report a past statement, the verb tense usually moves one step back: present → past, past → past perfect.',
        examples: [
          '"I **am** tired." → She said she **was** tired.',
          '"I **work** here." → He said he **worked** here.',
          '"I **saw** you." → She said she **had seen** me.',
        ],
      },
      {
        heading: 'Pronouns and time also shift',
        body: 'Change "I / you / my" based on the new speaker. Also shift time markers: now → then, today → that day, tomorrow → the next day.',
        examples: [
          '"**I** love **you**." → She said **she** loved **me**.',
          '"I\'ll do it **tomorrow**." → He said he\'d do it **the next day**.',
          '"We saw it **yesterday**." → They said they had seen it **the day before**.',
        ],
        tip: 'If the original is still TRUE or relevant now, you don\'t have to back-shift. "She said she LIVES in Paris" works if she still does.',
      },
    ],
  },

  // ── B2 ─────────────────────────────────────────────────────

  'b2-conditionals': {
    summary: 'The four conditionals — from likely future to impossible past regret.',
    sections: [
      {
        heading: 'Zero + First (real)',
        body: 'Zero: facts and general truths. First: likely real situations in the future. Both use present forms in the "if" clause.',
        examples: [
          '**If you heat water, it boils.** (zero — fact)',
          '**If it rains, we\'ll stay home.** (first — likely)',
          '**If I finish early, I\'ll call you.**',
        ],
      },
      {
        heading: 'Second + Third (unreal)',
        body: 'Second: imaginary present / unlikely future — "if I were / would". Third: past regret or impossible situation — "if I had / would have".',
        examples: [
          '**If I were rich, I would travel more.** (I\'m not rich)',
          '**If I had studied, I would have passed.** (I didn\'t study — past regret)',
          '**If she had told me, I would have helped.**',
        ],
        tip: 'Mixed conditionals: "If I had studied harder (past), I would have a better job now (present result)." Tenses can combine when the two halves live in different times.',
      },
    ],
  },

  'b2-passive-voice': {
    summary: 'Passive voice for when the DOER is unknown, obvious, or less important than the thing being done.',
    sections: [
      {
        heading: 'Structure: be + past participle',
        body: 'Form: "to be" in the same tense as the active sentence + past participle. The object of the active sentence becomes the subject of the passive.',
        examples: [
          'They **build** houses. → Houses **are built**.',
          'Shakespeare **wrote** Hamlet. → Hamlet **was written** by Shakespeare.',
          'Someone **has stolen** my phone. → My phone **has been stolen**.',
        ],
      },
      {
        heading: 'When to prefer passive',
        body: 'Use passive when the doer is unknown ("my phone was stolen"), obvious ("he was arrested" — by the police, of course), or you want to emphasise the action over the actor (academic writing, news reports).',
        examples: [
          'The painting **was discovered** in 1950.',
          'The decision **will be announced** tomorrow.',
          'English **is spoken** in many countries.',
        ],
        tip: 'Only transitive verbs (verbs that take an object) can be passive. "She arrived" has no object, so there\'s no passive form.',
      },
    ],
  },

  // ── B2+ ────────────────────────────────────────────────────

  'b2plus-hedging': {
    summary: 'Hedging language — softening statements so you sound polite, cautious, or professional instead of blunt.',
    sections: [
      {
        heading: 'Why hedge',
        body: 'Direct claims sound aggressive in English. Hedging adds nuance: "could", "might", "tend to", "it seems that", "to some extent". Essential for academic writing and polite emails.',
        examples: [
          '**It appears that** sales are falling. (not "sales ARE falling")',
          'Students **tend to** study less in summer.',
          'The results **suggest** a connection.',
        ],
      },
      {
        heading: 'Common hedging patterns',
        body: 'Modals (may, might, could, would), reporting verbs (suggest, indicate, appear), and quantity softeners (some, several, many, a number of).',
        examples: [
          'This **could** be the main reason.',
          '**Some** people argue that…',
          'There **may be** other factors involved.',
        ],
        tip: 'Over-hedging sounds unsure. Mix hedges with confident statements so you don\'t sound like you believe nothing.',
      },
    ],
  },

  'b2plus-inversion-cleft': {
    summary: 'Inversion and cleft sentences — advanced word order for emphasis and literary flair.',
    sections: [
      {
        heading: 'Inversion after negative adverbials',
        body: 'When a negative or restrictive adverbial comes FIRST, the subject-verb order inverts like in a question. Formal and emphatic.',
        examples: [
          '**Never have I seen** such beauty.',
          '**Not only did she win, but she also broke** the record.',
          '**Rarely do we get** a chance like this.',
        ],
      },
      {
        heading: 'Cleft sentences',
        body: 'Split a sentence in two to spotlight one part. Two common patterns: "It was X who/that…" and "What X did was…".',
        examples: [
          'It **was** the manager **who** approved it.',
          '**What** she wanted **was** a simple apology.',
          '**It** was **in Paris that** they met.',
        ],
        tip: 'Clefts are great in writing for emphasis, but overusing them in speech sounds theatrical.',
      },
    ],
  },
};
