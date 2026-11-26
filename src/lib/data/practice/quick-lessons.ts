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
//   · VOCABULARY + PHRASAL VERB units MUST introduce every target
//     item the drill tests, not just the concept. A student should
//     never meet a word for the first time in the practice itself.
//     After writing a vocab QL, scan the unit's exercises (options,
//     pairs, fill-blank sentences) and make sure every tested
//     word/chunk is explicitly listed in the lesson with a short
//     gloss. Incident 2026-11-25: 'b1-phrasal-verbs' QL introduced
//     the concept of phrasal verbs but only 3 of the 11 verbs that
//     the drill actually tests.

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
        body: 'Give your name with "My name is …" or "I am …". Ask for a name with "What is your name?". Say where you are from with "I am from …". Reply to a new introduction with "Nice to meet you".',
        examples: [
          '**My name is** Anna.',
          '**I am from** Chile.',
          '**What is your name?** → My name is Pedro.',
          '**Nice to meet you** too.',
        ],
        tip: '"Nice to meet you" is only used the FIRST time you meet someone. After that, use "Nice to see you again".',
      },
      {
        heading: '"How are you?" and polite words',
        body: 'The standard small-talk exchange: ask "How are you?" and reply with "I\'m fine, thanks" or "I\'m good, and you?". For politeness, learn "please", "thank you", "sorry".',
        examples: [
          '**How are you?** → **I\'m fine, thanks.**',
          'The teacher helps you → "**Thank you!**"',
          'You bump into someone → "**Sorry!**"',
          'You ask for something → "Can I have water, **please**?"',
        ],
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
        heading: 'Numbers 13 to 20 — the "-teen" family',
        body: 'From 13 to 19 we take the small number and add "-teen". Stress is on the "-teen" ending. 20 ("twenty") drops the "-teen" and has a different ending.',
        examples: [
          '**thir**teen, **four**teen, **fif**teen',
          '**six**teen, **seven**teen',
          '**eigh**teen, **nine**teen, **twen**ty',
        ],
        tip: 'Watch the spelling: thirteen, fifteen and eighteen are the irregular ones. Also careful: fifteen (15) and fifty (50) sound similar — the stress is different.',
      },
      {
        heading: 'Using numbers in sentences',
        body: 'Age takes "to be": "I am 15" (not "I have 15"). For "how many" questions answer with the number alone.',
        examples: [
          '**How old are you?** → **I am 15.** (= I\'m fifteen.)',
          'I have **two** sisters.',
          'My address is number **seven**.',
        ],
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
      {
        heading: 'Primary vs. secondary colors',
        body: 'The three primary colors are **red, blue, yellow**. Every other color (green, orange, purple…) is made by mixing primaries.',
        examples: [
          'primary: **red**, **blue**, **yellow**',
          'secondary: **green** (blue + yellow), **orange** (red + yellow), **purple** (red + blue)',
        ],
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
          '**Is** she your teacher?',
        ],
        tip: 'Spanish speakers often skip "to be" — "I tired" instead of "I am tired". Always keep the verb in English.',
      },
      {
        heading: 'Short answers',
        body: 'Don\'t say just "Yes" or "No". Repeat the verb: "Yes, I am" / "No, she isn\'t". The verb stays in its FULL form in a positive short answer (not "Yes, she\'s").',
        examples: [
          '"Is she your teacher?" → **Yes, she is.** / **No, she isn\'t.**',
          '"Are you from Mexico?" → **Yes, I am.** / **No, I\'m not.**',
          '"Are they ready?" → **Yes, they are.** / **No, they aren\'t.**',
        ],
      },
    ],
  },

  'a1-family': {
    summary: 'Every family word the drill asks about — close family, extended family, in-laws, grandchildren — plus the possessives that go with them.',
    sections: [
      {
        heading: 'Close family — parents, siblings, kids, spouse',
        body: 'These are the words the drill opens with. Learn them as pairs.',
        examples: [
          '**mother** (mamá) / **father** (papá) → together: **parents**',
          '**sister** (hermana) / **brother** (hermano) → together: **siblings**',
          '**daughter** (hija) / **son** (hijo)',
          '**husband** (esposo) / **wife** (esposa)',
        ],
      },
      {
        heading: 'Grandparents, aunts, uncles, cousins',
        body: 'One step further out in the family tree. Note "cousin" is gender-neutral in English (same word for male and female).',
        examples: [
          '**grandmother** (abuela) / **grandfather** (abuelo) → together: **grandparents**',
          '**aunt** (tía) / **uncle** (tío)',
          '**cousin** (primo/prima) — same word for male and female',
        ],
      },
      {
        heading: 'Nephews and nieces (your siblings\' kids)',
        body: 'Your brother\'s or sister\'s children are your nephew (boy) or niece (girl).',
        examples: [
          '**nephew** (sobrino) = your brother/sister\'s son',
          '**niece** (sobrina) = your brother/sister\'s daughter',
        ],
      },
      {
        heading: 'Possessives: my, your, his, her, our, their',
        body: 'Possessives go BEFORE the noun, and do NOT change for singular/plural. "My brother" and "my sisters" both use "my".',
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
      {
        heading: 'Short answers with "have got"',
        body: 'Short answers reuse ONLY "have / has", NOT "do / does". Never "Yes, I do got" or "Yes, she does".',
        examples: [
          '"**Have** you got a pen?" → **Yes, I have.** / **No, I haven\'t.**',
          '"**Has** she got a dog?" → **Yes, she has.** / **No, she hasn\'t.**',
          '"**Have** they got kids?" → **Yes, they have.** / **No, they haven\'t.**',
        ],
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
      {
        heading: 'Questions — yes/no and WH-',
        body: 'Yes/no questions: do/does + subject + base verb. WH-questions: WH-word + do/does + subject + base verb. The main verb has NO -s because "does" already carries it.',
        examples: [
          '**Does** he **work** on Saturdays? → Yes, he does. / No, he doesn\'t.',
          '**What time do** you **wake up**? (not "do you wake up" — base form after does/do)',
          '**Where does** she **live**?',
          '**Why do** they **always complain**?',
        ],
      },
    ],
  },

  'a2-daily-routines': {
    summary: 'Two things at once: adverbs of frequency for routines, and the minimal pairs (ship/sheep, lives/leaves, man/men) your ear has to separate when listening.',
    sections: [
      {
        heading: 'Frequency adverb position',
        body: 'Frequency adverbs go BEFORE a main verb, but AFTER the verb "to be".',
        examples: [
          'I **always** have coffee in the morning.',
          'She is **usually** late.',
          'We **sometimes** go to the beach.',
        ],
      },
      {
        heading: 'The frequency scale',
        body: 'Rough percentages: always ≈100%, usually ≈90%, often ≈70%, sometimes ≈50%, rarely ≈10%, never ≈0%.',
        examples: [
          'I **always** brush my teeth before bed.',
          'I **rarely** eat fast food.',
          'I **never** drink coffee at night.',
        ],
        tip: 'Expressions like "every day", "twice a week", "on Mondays" go at the START or END of the sentence, not in the middle.',
      },
      {
        heading: 'Minimal pairs — the Spanish-speaker traps',
        body: 'Spanish has one "i" sound. English has two: short /ɪ/ (relaxed, mouth slightly open) and long /iː/ (tense, smile wide). Confusing them changes the word.',
        examples: [
          '**ship** /ɪ/ (boat) vs. **sheep** /iː/ (animal)',
          '**lives** /ɪ/ (he lives here) vs. **leaves** /iː/ (autumn leaves)',
          '**fit** /ɪ/ vs. **feet** /iː/, **sit** /ɪ/ vs. **seat** /iː/',
          '**man** /æ/ (singular) vs. **men** /e/ (plural) — short vowel, but different mouth shape.',
        ],
        tip: 'Long /iː/ = push the corners of your mouth OUT, as if smiling for a photo. Short /ɪ/ = relaxed, neutral.',
      },
      {
        heading: 'Routine vocabulary you\'ll hear',
        body: 'Useful chunks that appear in the listening tasks.',
        examples: [
          '**wake up** at seven fifteen',
          'have **toast and coffee** for breakfast',
          '**go to work / to the gym / to school**',
          'The man is **waiting outside**.',
        ],
      },
    ],
  },

  'a2-past-simple': {
    summary: 'Past simple for finished actions — regular "-ed" verbs plus the ten irregulars this drill tests. Learn them here so no past form takes you by surprise in the practice.',
    sections: [
      {
        heading: 'Regular verbs — just add "-ed"',
        body: 'Most verbs add "-ed" for the past. "Arrive" is the regular verb this drill tests: he arrived at eight thirty.',
        examples: [
          'work → **worked**, play → **played**, study → **studied**',
          'arrive → **arrived**, finish → **finished**, start → **started**',
        ],
        tip: 'Final -y after a consonant turns to -ied: study → studied, try → tried.',
      },
      {
        heading: 'The 10 irregulars in this drill',
        body: 'Read these once before you start. Every past-form exercise below tests one of these — no surprises.',
        examples: [
          'go → **went** ("I went to the gym yesterday.")',
          'eat → **ate** ("She ate pizza for dinner.")',
          'see → **saw** ("We saw a great movie.")',
          'take → **took** ("He took the bus.")',
          'buy → **bought** ("I bought a new phone.")',
          'drive → **drove** ("She drove to work.")',
          'write → **wrote** ("He wrote an email.")',
          'drink → **drank** ("I drank too much coffee.")',
          'have → **had** ("We had a good weekend.")',
          'be → **was / were** ("I was tired, they were happy.")',
        ],
        tip: 'Also appears: **did** — the past of "do", used in negatives and questions below.',
      },
      {
        heading: 'Negatives and questions use "did"',
        body: 'For negatives and questions we use "did / didn\'t", and the main verb goes back to the base form (no -ed, no irregular past).',
        examples: [
          'I **didn\'t go** to the party. (not "didn\'t went")',
          '**Did** you **have** a good weekend? (not "had")',
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
      {
        heading: '"For" vs. "since" with present perfect',
        body: 'Both go with present perfect for unfinished situations, but they look at the duration differently.',
        examples: [
          '**for** + duration: "I have lived here **for 5 years**." / "She has worked here **for a long time**."',
          '**since** + starting point: "I have lived here **since 2019**." / "She has worked here **since January**."',
          'Rule of thumb: if you can answer "how long?" with a number, use **for**. If you can answer "starting when?" with a date, use **since**.',
        ],
      },
    ],
  },

  'b1-phrasal-verbs': {
    summary: 'The 10 everyday phrasal verbs this drill tests — learn their meanings here, then prove you have them in the practice.',
    sections: [
      {
        heading: 'What a phrasal verb is',
        body: 'A phrasal verb is a verb + small word (up, off, out, on, after…) whose combined meaning is usually NOT guessable from the parts. "Give up" means to quit — not to give something upward. Memorise them as single units.',
      },
      {
        heading: 'The 10 phrasals in this drill',
        body: 'Read these once before you start. Every exercise below tests one of these — no surprises.',
        examples: [
          '**put off** = to postpone. "Let\'s put off the meeting until Monday."',
          '**look after** = to take care of. "I look after my grandmother on weekends."',
          '**pick (sb) up** = to collect someone (by car, from a place). "Can you pick me up at the station at 7?"',
          '**run out of** = to use the last of something. "We ran out of milk."',
          '**give up** = to quit, stop trying. "I gave up smoking last year."',
          '**turn down** = to reject (an offer, a job, an invitation). "She turned down the job."',
          '**work out** = (a) to exercise, (b) to solve / figure out. "I work out three times a week." / "We worked out the answer."',
          '**get along (with)** = to have a good relationship with. "I get along with my boss."',
          '**catch up on** = to deal with things you are behind on. "I need to catch up on my emails."',
          '**meet up (with)** = to get together with someone, often informally. "I\'ll meet up with Ana later."',
        ],
        tip: 'Also appears in the drill: **call off** = to cancel ("Let\'s call off the meeting"). Think "cancel" when you see it.',
      },
      {
        heading: 'Separable vs. inseparable',
        body: 'Some can be split by their object (pick ME up / pick up ME ✗ but pick HIM up ✓). Others cannot (look AFTER the kids, never "look the kids after"). When the object is a PRONOUN (it, me, him, them), separable phrasal verbs MUST split.',
        examples: [
          'Separable: pick **up** the box / pick the box **up** / pick it **up** ✓',
          'Inseparable: look **after** the kids ✓ / look the kids **after** ✗',
          'Pronoun rule: turn it **off** ✓ / turn **off** it ✗',
        ],
      },
    ],
  },

  'b1-reported-speech': {
    summary: 'Reporting what someone said — tenses back-shift one step, modals shift, questions lose the question word order. The full table is below.',
    sections: [
      {
        heading: 'The back-shift table',
        body: 'When the reporting verb is in the PAST ("said", "told", "asked"), the original tense moves one step back. Memorise this table — every tense in the drill uses one of these shifts.',
        examples: [
          'present simple → past simple · "I **work**" → he said he **worked**',
          'present continuous → past continuous · "I **am working**" → he said he **was working**',
          'present perfect → past perfect · "I **have finished**" → he said he **had finished**',
          'past simple → past perfect · "I **saw** you" → she said she **had seen** me',
          'past continuous → past perfect continuous · "I **was eating**" → he said he **had been eating**',
          'am/is/are → was/were · "I **am** tired" → she said she **was** tired',
          'will → would · "I **will** call" → he said he **would** call',
          'can → could · "I **can** help" → she said she **could** help',
          'must → had to · "I **must** go" → he said he **had to** go',
          'may → might · "I **may** come" → she said she **might** come',
        ],
        tip: 'If the original is still TRUE or relevant now, you can skip the back-shift. "She said she LIVES in Paris" works if she still does.',
      },
      {
        heading: '"Said" vs. "told"',
        body: 'These two reporting verbs are not interchangeable. "Said" has NO direct object (no person after it). "Told" ALWAYS takes a person as a direct object (told me, told her, told the class).',
        examples: [
          '✅ She **said that** she was busy. (no person after "said")',
          '✅ She **told me that** she was busy. (person after "told")',
          '❌ She **told that** she was busy. (missing the person)',
          '❌ She **said me that** she was busy. (no "me" after said)',
          '❌ She **told to me** that she was busy. (no "to" with told)',
        ],
        tip: 'Simple rule: "said" + (that) + sentence; "told" + someone + (that) + sentence.',
      },
      {
        heading: 'Reporting questions — word order changes',
        body: 'When you report a question, drop the question word order. Use STATEMENT order (subject + verb), and drop "do/does/did". Yes/no questions take "if" or "whether".',
        examples: [
          '"Where **do you live**?" → He asked where **I lived**. (not "where did I live")',
          '"What time **does it start**?" → She asked what time **it started**.',
          '"**Are you** tired?" → He asked **if I was** tired.',
          '"**Have you** eaten?" → She asked **whether I had** eaten.',
        ],
        tip: 'The classic error is keeping the question structure: "He asked where DO I live" — wrong. In reported questions, the word order is a regular sentence.',
      },
      {
        heading: 'Reporting verbs beyond "said"',
        body: 'Different reporting verbs take different grammar patterns. Some take a gerund (-ing), some take the infinitive (to + verb), some take an object.',
        examples: [
          '**suggest** + -ing · "Let\'s go." → He **suggested going**. (not "suggested me to go", not "suggested to go")',
          '**offer / promise / agree** + to + verb · "I\'ll do it." → She **offered to do** it.',
          '**advise / ask / tell** + someone + to + verb · "Be quiet." → She **told me to be** quiet.',
          '**apologise for** + -ing · "Sorry I\'m late." → He **apologised for being** late.',
        ],
      },
      {
        heading: 'Pronouns and time markers also shift',
        body: 'Change "I / you / my" based on the new speaker. Also shift time markers: now → then, today → that day, tomorrow → the next day.',
        examples: [
          '"**I** love **you**." → She said **she** loved **me**.',
          '"I\'ll do it **tomorrow**." → He said he\'d do it **the next day**.',
          '"We saw it **yesterday**." → They said they had seen it **the day before**.',
        ],
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
      {
        heading: 'Related structures: "I wish" and "I\'d rather"',
        body: 'Two structures that live in the same hypothetical world as conditionals — the drill tests both.',
        examples: [
          '**I wish + past perfect** for past regret: "I **wish I had taken** that job." = I didn\'t take it and now I regret it.',
          '**I wish + past simple** for present regret: "I wish I **spoke** Japanese." (I don\'t)',
          '**I\'d rather + base verb** for a polite preference: "**I\'d rather not help** you." = I prefer not to, soft refusal.',
          '**I\'d rather + past simple** when the subject is someone else: "I\'d rather you **didn\'t** smoke here."',
        ],
      },
    ],
  },

  'b2-passive-voice': {
    summary: 'Passive voice across every tense — same core formula, "to be" just matches the tense you need.',
    sections: [
      {
        heading: 'The core formula',
        body: 'Form: "to be" in the same tense as the active sentence + past participle. The object of the active sentence becomes the subject of the passive.',
        examples: [
          'They **build** houses. → Houses **are built**.',
          'Shakespeare **wrote** Hamlet. → Hamlet **was written** by Shakespeare.',
          'Someone **stole** my phone. → My phone **was stolen**.',
        ],
      },
      {
        heading: 'Passive in every tense (the table)',
        body: 'Only the form of "to be" changes. The past participle stays the same. Every passive you\'ll meet in this drill is in one of these rows.',
        examples: [
          'present simple: Houses **are built**. (are + built)',
          'present continuous: The bridge **is being repaired**. (is being + repaired)',
          'past simple: The cake **was eaten**. (was + eaten)',
          'past continuous: The road **was being fixed** yesterday. (was being + fixed)',
          'present perfect: The deal **has been signed**. (has been + signed)',
          'past perfect: The cake **had been eaten** before I arrived. (had been + eaten)',
          'future: The report **will be sent** tomorrow. (will be + sent)',
          'future perfect: The job **will have been done** by Friday. (will have been + done)',
          'modals: It **can be done** / **might be done** / **should be done**. (modal + be + done)',
        ],
        tip: 'The participle (built / eaten / signed / sent) is always the SAME form across tenses — only the "be" piece moves.',
      },
      {
        heading: 'When to prefer passive',
        body: 'Use passive when the doer is unknown ("my phone was stolen"), obvious ("he was arrested" — by the police, of course), or you want to emphasise the action over the actor (academic writing, news reports).',
        examples: [
          'The painting **was discovered** in 1950. (unknown discoverer)',
          'The decision **will be announced** tomorrow. (attention on decision, not the announcer)',
          'English **is spoken** in many countries. (generalisation)',
          'This novel **was written by** García Márquez. (named agent with "by")',
        ],
        tip: 'Only transitive verbs (verbs that take an object) can be passive. "She arrived" has no object, so there\'s no passive form.',
      },
    ],
  },

  // ── B2+ ────────────────────────────────────────────────────

  'b2plus-hedging': {
    summary: 'The exact hedging moves this drill tests — how to soften a disagreement, a claim, a rejection, or a statistic so you sound diplomatic instead of blunt.',
    sections: [
      {
        heading: 'Why hedge at all',
        body: 'Direct claims sound aggressive in English. Hedging adds nuance and keeps the conversation open — essential for academic writing, client-facing email, and any meeting where you need to push back without burning the relationship.',
      },
      {
        heading: 'Softening a disagreement',
        body: 'Flat "no" / "that\'s wrong" is almost always too much. Substitute an opener that acknowledges the other side first, then raises your concern.',
        examples: [
          '**"I\'m not sure that would work."** ← for "That won\'t work."',
          '**"I can see where you\'re coming from, but I\'m not sure it\'s the right fit."** ← for "No, bad idea."',
          '**"That\'s not quite right, I think."** ← for "You\'re wrong."',
          '**"With respect,"** = polite signal that pushback is coming.',
        ],
      },
      {
        heading: 'Softening a claim or opinion',
        body: 'Instead of asserting a fact flat, hedge the strength with a reporting verb, a modal, or a stance-opener.',
        examples: [
          '**"It tends to be the case that…"** ← for "It is a fact that…"',
          '**"I would say that a different approach might work better."** = my view, offered softly.',
          '**"arguably"** = opens the claim to disagreement without retracting it.',
          '**"in some sense,"** = adds qualification without walking the claim back.',
        ],
      },
      {
        heading: 'Soft suggestions and asking for the floor',
        body: 'When you want someone to do something, or to speak up without interrupting, lead with a hedge.',
        examples: [
          '**"I wonder if we might look at this from a different angle."** = soft suggestion of change.',
          '**"If I may,"** = polite request to take the floor before speaking.',
        ],
      },
      {
        heading: 'Hedging numbers',
        body: 'Precise numbers can imply overconfidence. Add a softener in front of statistics.',
        examples: [
          'Sales are **roughly** down about ten percent.',
          'Also works: **around** ten percent / **about** ten percent.',
        ],
        tip: 'Over-hedging sounds unsure. Mix hedges with confident statements so you don\'t sound like you believe nothing.',
      },
    ],
  },

  'b2plus-inversion-cleft': {
    summary: 'Inversion and cleft sentences — advanced word order for emphasis and literary flair. Includes the "if"-less conditional and the "Only after…" structure the drill tests.',
    sections: [
      {
        heading: 'Inversion after negative adverbials',
        body: 'When a negative or restrictive adverbial comes FIRST, the subject-verb order inverts like in a question. Formal and emphatic.',
        examples: [
          '**Never have I seen** such beauty.',
          '**Not only did she speak** three languages, but she also plays the cello.',
          '**Rarely do we get** a chance like this.',
          '**Only after the deploy did we spot** the bug.',
        ],
        tip: 'Trigger words that force inversion: never, rarely, seldom, hardly, no sooner, not only, not until, only after, only when.',
      },
      {
        heading: 'Conditional without "if" — formal inversion',
        body: 'In formal writing you can drop "if" and invert the subject + auxiliary. Most common in third conditionals and formal letters.',
        examples: [
          '**Had I known**, I would have come. ← If I had known, I would have come.',
          '**Were I you**, I would take the job. ← If I were you, I would take the job.',
          '**Should you need** help, please call. ← If you should need help, please call.',
        ],
        tip: 'This sounds literary / formal. Use it in essays and business email, not in casual chat.',
      },
      {
        heading: 'Cleft sentences — spotlight one part',
        body: 'Split a sentence in two to spotlight one part. Three common patterns: "It was X who/that…", "It was at TIME that…" and "What X did was…".',
        examples: [
          'It **was the manager who** approved it. (emphasises the person)',
          'It **was the bug that** John fixed. (emphasises the object)',
          'It **was yesterday that** John fixed the bug. (emphasises the TIME)',
          '**What** she wanted **was** a simple apology. (what-cleft on object)',
          '**What saved** the project **was** Priya\'s rewrite. (what-cleft on subject)',
        ],
        tip: 'Clefts are great in writing for emphasis, but overusing them in speech sounds theatrical.',
      },
    ],
  },
};
