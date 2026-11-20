// FriendlyTeaching.cl — Daily Practice placement question pool
//
// Fresh grammar pool authored for the adaptive placement that lives
// inside Daily Practice. Deliberately NOT a reuse of the legacy
// /placement/[teacherId] pool — this is a self-contained Daily
// Practice asset.
//
// Each level ships ~10 questions. The adaptive engine picks one per
// turn, so with even moderate reuse 10 per level is enough signal
// over a 50-question cap. New items drop in without touching the
// engine; only this file grows.
//
// Authoring guidelines:
//   · Items target the GRAMMAR structure, not vocabulary.
//   · Exactly one option correct; three solid distractors (common L1
//     errors, tense swaps, tempting-but-ungrammatical forms).
//   · Keep prompts short; the explanation does the teaching.
//   · Tag `topic` with a short label the per-topic diagnostic can
//     group on later.

import type { DPPQuestion } from '@/types/daily-practice-placement';

export const DPP_QUESTIONS: DPPQuestion[] = [

  // ── A0 · survival present / be / plurals / articles ────────
  {
    id: 'dpp-a0-01', level: 'A0', topic: 'be (present)',
    prompt: 'She ___ my sister.',
    options: ['am', 'is', 'are', 'be'],
    correct: 1, explain: '"He / She / It" takes "is".',
  },
  {
    id: 'dpp-a0-02', level: 'A0', topic: 'articles',
    prompt: 'I have ___ apple and ___ banana.',
    options: ['a / a', 'an / a', 'a / an', 'the / the'],
    correct: 1, explain: '"an" before a vowel sound (apple); "a" before a consonant (banana).',
  },
  {
    id: 'dpp-a0-03', level: 'A0', topic: 'plural nouns',
    prompt: 'Look at those three ___.',
    options: ['child', 'childs', 'children', 'childrens'],
    correct: 2, explain: '"children" is the irregular plural of "child".',
  },
  {
    id: 'dpp-a0-04', level: 'A0', topic: 'possessive adjectives',
    prompt: 'This is John. ___ bag is black.',
    options: ['He', 'His', 'Him', 'He\'s'],
    correct: 1, explain: 'Possessive adjective for "he" is "his".',
  },
  {
    id: 'dpp-a0-05', level: 'A0', topic: 'numbers',
    prompt: 'I am ___ years old.',
    options: ['twenty one', 'twenty-one', 'twentyone', 'two one'],
    correct: 1, explain: 'Compound numbers 21-99 take a hyphen.',
  },
  {
    id: 'dpp-a0-06', level: 'A0', topic: 'there is / are',
    prompt: '___ two books on the table.',
    options: ['There is', 'There are', 'It is', 'They is'],
    correct: 1, explain: 'Plural subject ("two books") takes "there are".',
  },
  {
    id: 'dpp-a0-07', level: 'A0', topic: 'be (negative)',
    prompt: 'We ___ from Spain. We\'re from Mexico.',
    options: ['aren\'t', 'isn\'t', 'am not', 'don\'t'],
    correct: 0, explain: '"We" takes "are"; negative is "aren\'t".',
  },
  {
    id: 'dpp-a0-08', level: 'A0', topic: 'this / that / these / those',
    prompt: '___ shoes over there are mine.',
    options: ['This', 'That', 'These', 'Those'],
    correct: 3, explain: 'Plural + far = "those".',
  },
  {
    id: 'dpp-a0-09', level: 'A0', topic: 'basic questions',
    prompt: '___ your name?',
    options: ['What is', 'What are', 'Who is', 'How is'],
    correct: 0, explain: 'Asking for a name uses "What is …?".',
  },
  {
    id: 'dpp-a0-10', level: 'A0', topic: 'colours + word order',
    prompt: 'I have ___.',
    options: ['a car red', 'a red car', 'red a car', 'car red a'],
    correct: 1, explain: 'In English the adjective goes BEFORE the noun: "a red car".',
  },

  // ── A1 · present simple / can / common prepositions ────────
  {
    id: 'dpp-a1-01', level: 'A1', topic: 'present simple (3rd person)',
    prompt: 'My brother ___ pizza every weekend.',
    options: ['eat', 'eats', 'is eat', 'eating'],
    correct: 1, explain: 'Third person singular takes "-s" in present simple.',
  },
  {
    id: 'dpp-a1-02', level: 'A1', topic: 'present simple (questions)',
    prompt: '___ she speak French?',
    options: ['Does', 'Do', 'Is', 'Are'],
    correct: 0, explain: '"She" takes "does" in present-simple questions.',
  },
  {
    id: 'dpp-a1-03', level: 'A1', topic: 'can (ability)',
    prompt: 'I ___ swim, but my brother ___.',
    options: ['can / don\'t', 'can\'t / can', 'can / can\'t', 'do / don\'t'],
    correct: 2, explain: 'The pair works with the same modal: "can / can\'t".',
  },
  {
    id: 'dpp-a1-04', level: 'A1', topic: 'prepositions of time',
    prompt: 'The meeting is ___ Monday ___ 9 am.',
    options: ['in / on', 'on / at', 'at / in', 'on / in'],
    correct: 1, explain: '"on" + day, "at" + clock time.',
  },
  {
    id: 'dpp-a1-05', level: 'A1', topic: 'have got',
    prompt: 'She ___ two sisters.',
    options: ['have got', 'has got', 'got', 'is got'],
    correct: 1, explain: '"has got" for third person singular.',
  },
  {
    id: 'dpp-a1-06', level: 'A1', topic: 'object pronouns',
    prompt: 'I love my parents. I call ___ every Sunday.',
    options: ['they', 'them', 'their', 'theirs'],
    correct: 1, explain: 'Object of a verb → "them".',
  },
  {
    id: 'dpp-a1-07', level: 'A1', topic: 'present continuous',
    prompt: 'Be quiet — the baby ___.',
    options: ['sleeps', 'is sleeping', 'sleep', 'sleeping'],
    correct: 1, explain: 'Action happening right now = present continuous.',
  },
  {
    id: 'dpp-a1-08', level: 'A1', topic: 'present simple (negative)',
    prompt: 'He ___ coffee; he prefers tea.',
    options: ['don\'t drink', 'doesn\'t drink', 'doesn\'t drinks', 'not drinks'],
    correct: 1, explain: '"doesn\'t" + base form of the verb.',
  },
  {
    id: 'dpp-a1-09', level: 'A1', topic: 'how much / how many',
    prompt: '___ milk is in the fridge?',
    options: ['How many', 'How much', 'How often', 'How long'],
    correct: 1, explain: '"how much" with uncountable nouns (milk).',
  },
  {
    id: 'dpp-a1-10', level: 'A1', topic: 'articles (zero)',
    prompt: 'I love ___ music.',
    options: ['a', 'the', '— (no article)', 'an'],
    correct: 2, explain: 'Talking in general about an uncountable noun → no article.',
  },

  // ── A2 · past simple / future / comparatives ───────────────
  {
    id: 'dpp-a2-01', level: 'A2', topic: 'past simple (regular)',
    prompt: 'Yesterday I ___ to the park.',
    options: ['walk', 'walked', 'was walk', 'walking'],
    correct: 1, explain: 'Regular past simple: add "-ed".',
  },
  {
    id: 'dpp-a2-02', level: 'A2', topic: 'past simple (irregular)',
    prompt: 'She ___ a movie last night.',
    options: ['seed', 'seen', 'saw', 'see'],
    correct: 2, explain: 'Irregular past of "see" → "saw".',
  },
  {
    id: 'dpp-a2-03', level: 'A2', topic: 'past simple (negatives)',
    prompt: 'We ___ to the party.',
    options: ['didn\'t went', 'don\'t went', 'didn\'t go', 'not went'],
    correct: 2, explain: '"didn\'t" + base form — never the past form of the verb.',
  },
  {
    id: 'dpp-a2-04', level: 'A2', topic: 'be going to (future)',
    prompt: 'Look at those clouds — it ___ rain.',
    options: ['is going to', 'will', 'goes to', 'is go to'],
    correct: 0, explain: '"be going to" for predictions based on present evidence.',
  },
  {
    id: 'dpp-a2-05', level: 'A2', topic: 'comparatives',
    prompt: 'A train is ___ than a bus.',
    options: ['more fast', 'faster', 'fast', 'the fastest'],
    correct: 1, explain: 'One-syllable adjectives → "-er" ending.',
  },
  {
    id: 'dpp-a2-06', level: 'A2', topic: 'superlatives',
    prompt: 'This is ___ hotel in the city.',
    options: ['the better', 'the best', 'best', 'the most best'],
    correct: 1, explain: '"best" is the irregular superlative of "good".',
  },
  {
    id: 'dpp-a2-07', level: 'A2', topic: 'frequency adverbs (position)',
    prompt: 'She ___ coffee for breakfast.',
    options: ['always has', 'has always', 'always is having', 'is always have'],
    correct: 0, explain: 'Frequency adverbs go BEFORE a main verb (always + has).',
  },
  {
    id: 'dpp-a2-08', level: 'A2', topic: 'countable / uncountable',
    prompt: 'There ___ some milk in the fridge.',
    options: ['are', 'is', 'were', 'be'],
    correct: 1, explain: '"milk" is uncountable → singular verb.',
  },
  {
    id: 'dpp-a2-09', level: 'A2', topic: 'present perfect (introduction)',
    prompt: 'I ___ never ___ sushi.',
    options: ['am / eaten', 'have / ate', 'have / eaten', 'did / eat'],
    correct: 2, explain: '"have" + past participle. The past participle of "eat" is "eaten".',
  },
  {
    id: 'dpp-a2-10', level: 'A2', topic: 'infinitive of purpose',
    prompt: 'I went to the shop ___ bread.',
    options: ['for buy', 'to buy', 'for buying', 'buying'],
    correct: 1, explain: '"to + verb" to express purpose ("why").',
  },

  // ── B1 · present perfect / past continuous / modals ───────
  {
    id: 'dpp-b1-01', level: 'B1', topic: 'present perfect vs past simple',
    prompt: 'I ___ her twice this week.',
    options: ['saw', 'have seen', 'see', 'was seeing'],
    correct: 1, explain: '"this week" is still open → present perfect.',
  },
  {
    id: 'dpp-b1-02', level: 'B1', topic: 'present perfect (since/for)',
    prompt: 'We ___ in Berlin ___ 2020.',
    options: ['live / since', 'have lived / since', 'have lived / for', 'live / for'],
    correct: 1, explain: '"since" + point in time (2020); present perfect for ongoing.',
  },
  {
    id: 'dpp-b1-03', level: 'B1', topic: 'past continuous',
    prompt: 'When you called, I ___ dinner.',
    options: ['cooked', 'was cooking', 'am cooking', 'had cooked'],
    correct: 1, explain: 'Background action already in progress → past continuous.',
  },
  {
    id: 'dpp-b1-04', level: 'B1', topic: 'modals (should)',
    prompt: 'You look tired. You ___ go to bed earlier.',
    options: ['should', 'must', 'can', 'ought'],
    correct: 0, explain: '"should" for advice.',
  },
  {
    id: 'dpp-b1-05', level: 'B1', topic: 'first conditional',
    prompt: 'If it ___ tomorrow, we ___ stay home.',
    options: ['rains / will', 'will rain / will', 'rains / would', 'rained / will'],
    correct: 0, explain: '1st conditional: if + present simple, will + verb.',
  },
  {
    id: 'dpp-b1-06', level: 'B1', topic: 'relative pronouns',
    prompt: 'That\'s the woman ___ lives next door.',
    options: ['which', 'who', 'whose', 'where'],
    correct: 1, explain: '"who" refers to people as subject of the relative clause.',
  },
  {
    id: 'dpp-b1-07', level: 'B1', topic: 'used to (past habits)',
    prompt: 'When I was a child, I ___ comics every day.',
    options: ['use to read', 'used to read', 'used to reading', 'am used to read'],
    correct: 1, explain: '"used to + base form" for past habits that no longer happen.',
  },
  {
    id: 'dpp-b1-08', level: 'B1', topic: 'phrasal verbs (separable)',
    prompt: 'The music is too loud. Can you turn ___ ?',
    options: ['it down', 'down it', 'off it', 'it away'],
    correct: 0, explain: 'With a pronoun object the phrasal verb MUST split: "turn it down".',
  },
  {
    id: 'dpp-b1-09', level: 'B1', topic: 'present perfect (just/yet/already)',
    prompt: 'I don\'t want more food — I\'ve ___ eaten.',
    options: ['yet', 'already', 'still', 'just now'],
    correct: 1, explain: '"already" = earlier than expected, between have and the past participle.',
  },
  {
    id: 'dpp-b1-10', level: 'B1', topic: 'quantifiers',
    prompt: 'There are ___ apples left — buy some.',
    options: ['a lot of', 'much', 'few', 'little'],
    correct: 2, explain: '"few" = a small (insufficient) number with countable nouns.',
  },

  // ── B2 · conditionals / passive / reported ────────────────
  {
    id: 'dpp-b2-01', level: 'B2', topic: 'second conditional',
    prompt: 'If I ___ rich, I ___ travel more.',
    options: ['am / will', 'was / will', 'were / would', 'had been / would have'],
    correct: 2, explain: '2nd conditional: if + past simple (were preferred), would + verb.',
  },
  {
    id: 'dpp-b2-02', level: 'B2', topic: 'third conditional',
    prompt: 'If she ___ earlier, she ___ the train.',
    options: ['left / caught', 'had left / would have caught', 'leaves / would catch', 'left / would catch'],
    correct: 1, explain: '3rd conditional: had + past participle, would have + past participle.',
  },
  {
    id: 'dpp-b2-03', level: 'B2', topic: 'passive voice (past)',
    prompt: 'The painting ___ in 1890.',
    options: ['was painted', 'painted', 'is painted', 'has painted'],
    correct: 0, explain: 'Past passive = was/were + past participle.',
  },
  {
    id: 'dpp-b2-04', level: 'B2', topic: 'reported speech',
    prompt: 'She said, "I\'m tired." → She said she ___ tired.',
    options: ['is', 'was', 'had been', 'has been'],
    correct: 1, explain: 'Present → past: "am/is" becomes "was" in reported speech.',
  },
  {
    id: 'dpp-b2-05', level: 'B2', topic: 'past perfect',
    prompt: 'By the time we arrived, the film ___.',
    options: ['started', 'was starting', 'had started', 'has started'],
    correct: 2, explain: 'Earlier of two past events → past perfect (had + past participle).',
  },
  {
    id: 'dpp-b2-06', level: 'B2', topic: 'modals of deduction (present)',
    prompt: 'She\'s not answering. She ___ be in a meeting.',
    options: ['should', 'must', 'can', 'may have'],
    correct: 1, explain: '"must" expresses strong deduction (present).',
  },
  {
    id: 'dpp-b2-07', level: 'B2', topic: 'gerund vs infinitive',
    prompt: 'I can\'t stand ___ in long queues.',
    options: ['to wait', 'wait', 'waiting', 'to waiting'],
    correct: 2, explain: '"can\'t stand" is followed by a gerund (-ing form).',
  },
  {
    id: 'dpp-b2-08', level: 'B2', topic: 'passive with "by"',
    prompt: 'The project ___ by a small team of volunteers.',
    options: ['is run', 'runs', 'is running', 'has run'],
    correct: 0, explain: 'Present passive + by-agent: "is run by …".',
  },
  {
    id: 'dpp-b2-09', level: 'B2', topic: 'wish / if only',
    prompt: 'I wish I ___ speak French.',
    options: ['can', 'could', 'will', 'would'],
    correct: 1, explain: 'wish + past (could) for present unreal wishes.',
  },
  {
    id: 'dpp-b2-10', level: 'B2', topic: 'relative clauses (defining)',
    prompt: 'The hotel ___ we stayed was beautiful.',
    options: ['that', 'who', 'where', 'whose'],
    correct: 2, explain: '"where" for place; no need for a preposition.',
  },

  // ── B2+ · mixed conditionals / hedging / cleft intro ──────
  {
    id: 'dpp-b2p-01', level: 'B2+', topic: 'mixed conditional',
    prompt: 'If I ___ harder then, I ___ a better job now.',
    options: ['studied / would have', 'had studied / would have', 'had studied / would have had', 'would study / had'],
    correct: 2, explain: 'Past condition + present result = 3rd (had + pp) → would have + pp of "have".',
  },
  {
    id: 'dpp-b2p-02', level: 'B2+', topic: 'reported speech (back-shift)',
    prompt: '"I will call you tomorrow." → He told me he ___ me ___.',
    options: ['will call / tomorrow', 'would call / the next day', 'calls / tomorrow', 'was calling / tomorrow'],
    correct: 1, explain: 'Will → would, tomorrow → the next day.',
  },
  {
    id: 'dpp-b2p-03', level: 'B2+', topic: 'passive report structure',
    prompt: 'It ___ that the CEO will resign.',
    options: ['is believed', 'believes', 'is believing', 'has believed'],
    correct: 0, explain: '"It is believed/said/thought that …" — classic news-report hedging.',
  },
  {
    id: 'dpp-b2p-04', level: 'B2+', topic: 'passive report (alternative)',
    prompt: 'The CEO ___ to be considering a new role.',
    options: ['says', 'is said', 'is saying', 'has said'],
    correct: 1, explain: '"S + is said to + verb" — hedged report.',
  },
  {
    id: 'dpp-b2p-05', level: 'B2+', topic: 'modals of deduction (past)',
    prompt: 'The road is wet. It ___ rained overnight.',
    options: ['must have', 'had to', 'must', 'had'],
    correct: 0, explain: '"must have + past participle" = strong past deduction.',
  },
  {
    id: 'dpp-b2p-06', level: 'B2+', topic: 'causative "have"',
    prompt: 'We ___ the car ___ last week.',
    options: ['had / repair', 'had / repaired', 'have / repair', 'had / repairing'],
    correct: 1, explain: 'Causative: have + object + past participle ("get it done by someone").',
  },
  {
    id: 'dpp-b2p-07', level: 'B2+', topic: 'hedging (adverbs)',
    prompt: 'The results ___ suggest that stress plays a role.',
    options: ['strongly', 'surely', 'tentatively', 'absolutely'],
    correct: 2, explain: '"tentatively" hedges — fits academic / cautious register.',
  },
  {
    id: 'dpp-b2p-08', level: 'B2+', topic: 'future perfect',
    prompt: 'By next summer, I ___ here for ten years.',
    options: ['will live', 'will have lived', 'am living', 'had lived'],
    correct: 1, explain: 'Looking BACK from a future point: will have + past participle.',
  },
  {
    id: 'dpp-b2p-09', level: 'B2+', topic: 'inversion with so/such',
    prompt: '___ was the noise that we couldn\'t hear each other.',
    options: ['So loud', 'Such a loud', 'Such loud', 'So loudly'],
    correct: 0, explain: '"So + adjective + was + subject + that …" — formal emphasis with inversion.',
  },
  {
    id: 'dpp-b2p-10', level: 'B2+', topic: 'passive gerund',
    prompt: 'I don\'t enjoy ___ in public.',
    options: ['being criticised', 'being criticise', 'to be criticised', 'to criticise'],
    correct: 0, explain: 'After "enjoy" → gerund; passive gerund = being + past participle.',
  },

  // ── C1 · advanced forms / inversion / subjunctive ─────────
  {
    id: 'dpp-c1-01', level: 'C1', topic: 'inverted conditional (3rd)',
    prompt: '___ I known about the strike, I would have left earlier.',
    options: ['If', 'Had', 'Were', 'Should'],
    correct: 1, explain: 'Formal inversion of 3rd conditional drops "if": "Had I known …".',
  },
  {
    id: 'dpp-c1-02', level: 'C1', topic: 'inversion (negative adverbials)',
    prompt: 'Never before ___ such dedication.',
    options: ['I had seen', 'I saw', 'had I seen', 'did I see'],
    correct: 2, explain: 'Negative adverbial fronted → subject-aux inversion: "had I seen".',
  },
  {
    id: 'dpp-c1-03', level: 'C1', topic: 'were + subject + to',
    prompt: '___ the project to fail, we\'d lose all our funding.',
    options: ['If', 'Was', 'Were', 'Had'],
    correct: 2, explain: 'Very formal hypothetical future: "Were + subject + to + verb".',
  },
  {
    id: 'dpp-c1-04', level: 'C1', topic: 'subjunctive (mandative)',
    prompt: 'The manager insisted that she ___ present.',
    options: ['was', 'is', 'be', 'will be'],
    correct: 2, explain: 'Mandative subjunctive after "insist that": bare base form ("be").',
  },
  {
    id: 'dpp-c1-05', level: 'C1', topic: 'cleft sentences (It-cleft)',
    prompt: '___ Marta who solved the problem, not Tomás.',
    options: ['She was', 'It was', 'There was', 'What was'],
    correct: 1, explain: 'It-cleft for emphasis: "It was X who / that …".',
  },
  {
    id: 'dpp-c1-06', level: 'C1', topic: 'perfect modals (regret)',
    prompt: 'You look ill. You ___ to the meeting last night.',
    options: ['shouldn\'t go', 'shouldn\'t have gone', 'wouldn\'t go', 'hadn\'t gone'],
    correct: 1, explain: 'Past regret: shouldn\'t have + past participle.',
  },
  {
    id: 'dpp-c1-07', level: 'C1', topic: 'participle clauses (reduced relative)',
    prompt: 'The candidates ___ for the job all had PhDs.',
    options: ['who considering', 'being considered', 'considering', 'who considered'],
    correct: 1, explain: 'Reduced relative with passive meaning: "being considered" = "who were being considered".',
  },
  {
    id: 'dpp-c1-08', level: 'C1', topic: 'future continuous (polite)',
    prompt: '___ to the conference next week?',
    options: ['Are you going', 'Will you go', 'Will you be going', 'Do you go'],
    correct: 2, explain: 'Future continuous for polite enquiries about plans — avoids sounding like a request.',
  },
  {
    id: 'dpp-c1-09', level: 'C1', topic: 'had better + perfect',
    prompt: 'We ___ left when we could — now the roads are shut.',
    options: ['had better', 'should\'ve', 'might better', 'ought'],
    correct: 1, explain: 'Past regret of missed opportunity: should\'ve (= should have) + past participle.',
  },
  {
    id: 'dpp-c1-10', level: 'C1', topic: 'wish + past perfect',
    prompt: 'I wish I ___ at that interview.',
    options: ['wasn\'t late', 'hadn\'t been late', 'wouldn\'t be late', 'didn\'t be late'],
    correct: 1, explain: 'Wish + past perfect = regret about a past event.',
  },

];

// Pool lookup helpers ─────────────────────────────────────────

export function questionsByLevel(level: string): DPPQuestion[] {
  return DPP_QUESTIONS.filter((q) => q.level === level);
}

export function findQuestion(id: string): DPPQuestion | undefined {
  return DPP_QUESTIONS.find((q) => q.id === id);
}
