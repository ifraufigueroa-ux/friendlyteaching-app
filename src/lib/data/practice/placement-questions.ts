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
    id: 'dpp-c1-09', level: 'C1', topic: 'should have + past participle (regret)',
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

  // ╔══════════ Pool expansion — wave 2 ══════════════════════╗
  // Doubles the per-level pool from 10 → 20 so a student who
  // oscillates between two neighbouring levels never exhausts the
  // bank before the 50-question hard cap. Same shape as wave 1 —
  // single-structure items, three plausible distractors, short
  // explain line.

  // ── A0 · 10 more ───────────────────────────────────────────
  { id: 'dpp-a0-11', level: 'A0', topic: 'object pronouns (basic)', prompt: 'I know Anna. I see ___ every day.', options: ['she', 'her', 'hers', 'herself'], correct: 1, explain: 'Object of a verb uses "her".' },
  { id: 'dpp-a0-12', level: 'A0', topic: 'prepositions of place', prompt: 'The book is ___ the table.', options: ['on', 'in', 'at', 'to'], correct: 0, explain: '"On" for something resting on a surface.' },
  { id: 'dpp-a0-13', level: 'A0', topic: 'days / months', prompt: 'My birthday is ___ June.', options: ['on', 'in', 'at', 'of'], correct: 1, explain: 'Months use "in".' },
  { id: 'dpp-a0-14', level: 'A0', topic: 'imperatives', prompt: '___ the door, please.', options: ['Closing', 'To close', 'Close', 'Closes'], correct: 2, explain: 'Imperative is the base form of the verb.' },
  { id: 'dpp-a0-15', level: 'A0', topic: 'like / don\'t like', prompt: 'I ___ coffee. I prefer tea.', options: ['don\'t like', 'am not like', 'not like', 'no like'], correct: 0, explain: 'Negative present simple = don\'t + base verb.' },
  { id: 'dpp-a0-16', level: 'A0', topic: 'can (ability)', prompt: 'My brother ___ swim very well.', options: ['can', 'cans', 'can to', 'is can'], correct: 0, explain: '"Can" is modal — no "-s", no "to".' },
  { id: 'dpp-a0-17', level: 'A0', topic: 'have / has', prompt: 'She ___ a new phone.', options: ['have', 'has', 'haves', 'is have'], correct: 1, explain: 'Third person singular → "has".' },
  { id: 'dpp-a0-18', level: 'A0', topic: 'how old', prompt: '___ your mother?', options: ['How is old', 'How old is', 'How old has', 'What age is'], correct: 1, explain: 'Standard order: "How old is …?".' },
  { id: 'dpp-a0-19', level: 'A0', topic: 'what time', prompt: '___ is it? — It\'s 3 o\'clock.', options: ['How time', 'What time', 'What hour', 'When time'], correct: 1, explain: 'Asking for the clock time uses "What time …?".' },
  { id: 'dpp-a0-20', level: 'A0', topic: 'subject pronouns', prompt: 'Peter and I are friends. ___ study together.', options: ['Us', 'We', 'They', 'Our'], correct: 1, explain: 'Subject of the verb → "we".' },

  // ── A1 · 10 more ───────────────────────────────────────────
  { id: 'dpp-a1-11', level: 'A1', topic: 'adverbs of frequency', prompt: 'She ___ watches TV in the morning.', options: ['never', 'is never', 'never is', 'nevers'], correct: 0, explain: 'Frequency adverbs go BEFORE the main verb.' },
  { id: 'dpp-a1-12', level: 'A1', topic: 'past simple (be)', prompt: 'I ___ at the party last night.', options: ['am', 'was', 'were', 'be'], correct: 1, explain: '"I" + past of be = "was".' },
  { id: 'dpp-a1-13', level: 'A1', topic: 'like + -ing', prompt: 'He likes ___ football on Sundays.', options: ['play', 'plays', 'playing', 'to playing'], correct: 2, explain: '"Like" is commonly followed by -ing.' },
  { id: 'dpp-a1-14', level: 'A1', topic: 'want + infinitive', prompt: 'I ___ a new car.', options: ['want buy', 'want buying', 'want to buy', 'wanting to buy'], correct: 2, explain: '"Want" is followed by TO + base verb.' },
  { id: 'dpp-a1-15', level: 'A1', topic: 'let\'s (suggestions)', prompt: '___ go to the beach tomorrow.', options: ['Let\'s to', 'We let', 'Let\'s', 'Let go'], correct: 2, explain: '"Let\'s" + base verb for suggestions.' },
  { id: 'dpp-a1-16', level: 'A1', topic: 'must (obligation)', prompt: 'You ___ wear a seatbelt in the car.', options: ['must', 'must to', 'musts', 'are must'], correct: 0, explain: '"Must" is modal; no "to", no "-s".' },
  { id: 'dpp-a1-17', level: 'A1', topic: 'shouldn\'t (advice)', prompt: 'You ___ eat so much sugar.', options: ['no should', 'shouldn\'t', 'don\'t should', 'aren\'t should'], correct: 1, explain: 'Negative of "should" is "shouldn\'t".' },
  { id: 'dpp-a1-18', level: 'A1', topic: 'countable / uncountable (basic)', prompt: 'I don\'t have ___ time.', options: ['many', 'much', 'a lot', 'few'], correct: 1, explain: '"Time" is uncountable → "much".' },
  { id: 'dpp-a1-19', level: 'A1', topic: 'possessive \'s', prompt: 'This is ___ book.', options: ['Anna\'s', 'Annas', 'of Anna', 'Anna'], correct: 0, explain: '\'s after a singular name shows possession.' },
  { id: 'dpp-a1-20', level: 'A1', topic: 'prepositions of place (deeper)', prompt: 'The cat is ___ the box.', options: ['on', 'in', 'under', 'to'], correct: 2, explain: '"Under" = below a surface.' },

  // ── A2 · 10 more ───────────────────────────────────────────
  { id: 'dpp-a2-11', level: 'A2', topic: 'present continuous (future)', prompt: 'I ___ Anna tomorrow at 7.', options: ['meet', 'am meeting', 'will meet', 'have met'], correct: 1, explain: 'Scheduled personal arrangement → present continuous.' },
  { id: 'dpp-a2-12', level: 'A2', topic: 'used to (past habit)', prompt: 'When I was a child, I ___ a lot of candy.', options: ['use to eat', 'used to eat', 'used to eating', 'was used eat'], correct: 1, explain: '"Used to" + base verb for past habits.' },
  { id: 'dpp-a2-13', level: 'A2', topic: 'may / might', prompt: 'It ___ rain later — take an umbrella.', options: ['may', 'may to', 'mays', 'is may'], correct: 0, explain: '"May" / "might" + base verb to express possibility.' },
  { id: 'dpp-a2-14', level: 'A2', topic: 'why don\'t you', prompt: '___ try the chicken? It\'s great.', options: ['Why don\'t you', 'Why not you', 'Why you don\'t', 'Why aren\'t you'], correct: 0, explain: 'Suggestion pattern: "Why don\'t you …?".' },
  { id: 'dpp-a2-15', level: 'A2', topic: 'so / such', prompt: 'It was ___ a beautiful day!', options: ['so', 'such', 'too', 'very'], correct: 1, explain: '"Such" + (a/an) + adjective + noun.' },
  { id: 'dpp-a2-16', level: 'A2', topic: 'question tags (basic)', prompt: 'You\'re a student, ___?', options: ['isn\'t it', 'aren\'t you', 'don\'t you', 'are you'], correct: 1, explain: 'Positive statement → negative tag matching subject + aux.' },
  { id: 'dpp-a2-17', level: 'A2', topic: 'quantifiers', prompt: 'There are ___ chairs in the room.', options: ['much', 'a few', 'a little', 'any'], correct: 1, explain: '"A few" with countable nouns = some.' },
  { id: 'dpp-a2-18', level: 'A2', topic: 'will (predictions)', prompt: 'Don\'t worry — I\'m sure everything ___ fine.', options: ['is', 'will be', 'is going to', 'has been'], correct: 1, explain: '"Will" for predictions based on opinion/belief.' },
  { id: 'dpp-a2-19', level: 'A2', topic: 'adverbs of manner', prompt: 'She sings ___.', options: ['beautiful', 'beautifully', 'beauty', 'the beautiful'], correct: 1, explain: 'Adverbs modifying verbs end in -ly here.' },
  { id: 'dpp-a2-20', level: 'A2', topic: 'enough', prompt: 'He isn\'t ___ to drive a car.', options: ['enough old', 'old enough', 'enough of old', 'more old'], correct: 1, explain: '"Enough" goes AFTER an adjective.' },

  // ── B1 · 10 more ───────────────────────────────────────────
  { id: 'dpp-b1-11', level: 'B1', topic: 'reported statements', prompt: 'He said he ___ tired.', options: ['is', 'was', 'has been', 'be'], correct: 1, explain: 'Back-shift from present to past in reported speech.' },
  { id: 'dpp-b1-12', level: 'B1', topic: 'relative clauses (non-defining)', prompt: 'My brother, ___ lives in Rome, is a chef.', options: ['who', 'which', 'what', 'where'], correct: 0, explain: 'Non-defining clause about a person → "who".' },
  { id: 'dpp-b1-13', level: 'B1', topic: 'phrasal verbs (inseparable)', prompt: 'We really ___ him since he moved away.', options: ['look up to', 'look after', 'look into', 'look up'], correct: 1, explain: '"Look after" (inseparable) = take care of. (Context fits as missing.)' },
  { id: 'dpp-b1-14', level: 'B1', topic: 'verb patterns (gerund vs infinitive)', prompt: 'I enjoy ___ to music.', options: ['listen', 'to listen', 'listening', 'listened'], correct: 2, explain: '"Enjoy" is always followed by -ing.' },
  { id: 'dpp-b1-15', level: 'B1', topic: 'wish (present)', prompt: 'I wish I ___ more time to travel.', options: ['have', 'had', 'will have', 'am having'], correct: 1, explain: 'Wish + past simple = unreal present.' },
  { id: 'dpp-b1-16', level: 'B1', topic: 'as soon as', prompt: 'I\'ll call you as soon as I ___ home.', options: ['get', 'will get', 'am getting', 'got'], correct: 0, explain: 'After "as soon as" (future time), use the present simple.' },
  { id: 'dpp-b1-17', level: 'B1', topic: 'neither / so (short answers)', prompt: '"I don\'t like coffee." — "___."', options: ['So do I', 'Neither do I', 'Me too', 'So am I'], correct: 1, explain: 'Agreeing with a negative → "Neither do I".' },
  { id: 'dpp-b1-18', level: 'B1', topic: 'present perfect continuous', prompt: 'How long ___ English?', options: ['have you been studying', 'are you studying', 'do you study', 'did you study'], correct: 0, explain: 'Duration of ongoing action → present perfect continuous.' },
  { id: 'dpp-b1-19', level: 'B1', topic: 'modals (might have)', prompt: 'He\'s not answering — he ___ left his phone at home.', options: ['might have', 'might', 'might has', 'might of'], correct: 0, explain: '"Might have" + past participle for past speculation.' },
  { id: 'dpp-b1-20', level: 'B1', topic: 'unless (conditional)', prompt: 'You won\'t pass ___ you study more.', options: ['if', 'unless', 'in case', 'as long as'], correct: 1, explain: '"Unless" = "if not"; takes present simple.' },

  // ── B2 · 10 more ───────────────────────────────────────────
  { id: 'dpp-b2-11', level: 'B2', topic: 'future continuous', prompt: 'This time tomorrow I ___ on a beach.', options: ['am lying', 'will lie', 'will be lying', 'will have lain'], correct: 2, explain: 'Future continuous for an action in progress at a future moment.' },
  { id: 'dpp-b2-12', level: 'B2', topic: 'future perfect (basic)', prompt: 'By next June, she ___ her degree.', options: ['will finish', 'will be finishing', 'will have finished', 'finishes'], correct: 2, explain: 'Future perfect = action completed BEFORE a future point.' },
  { id: 'dpp-b2-13', level: 'B2', topic: 'reporting verbs', prompt: 'She apologised ___ late.', options: ['for being', 'to be', 'that she was', 'being'], correct: 0, explain: '"Apologise for" + -ing.' },
  { id: 'dpp-b2-14', level: 'B2', topic: 'participle adjectives', prompt: 'The film was ___ — I almost fell asleep.', options: ['bored', 'boring', 'bore', 'been boring'], correct: 1, explain: '-ing adjective describes the thing causing the feeling.' },
  { id: 'dpp-b2-15', level: 'B2', topic: 'emphasis with do', prompt: 'I don\'t usually eat sweets, but I ___ love chocolate.', options: ['do', 'am', 'have', 'did'], correct: 0, explain: 'Auxiliary "do" in the present for emphasis.' },
  { id: 'dpp-b2-16', level: 'B2', topic: 'passive with modal', prompt: 'This document ___ before Monday.', options: ['must sign', 'must signed', 'must be signed', 'must being signed'], correct: 2, explain: 'Modal passive = modal + be + past participle.' },
  { id: 'dpp-b2-17', level: 'B2', topic: 'adverb-adjective precision', prompt: 'The results are ___ encouraging.', options: ['high', 'highly', 'height', 'heightly'], correct: 1, explain: '"Highly" modifies the adjective "encouraging".' },
  { id: 'dpp-b2-18', level: 'B2', topic: 'question tags (advanced)', prompt: 'Nobody called, ___?', options: ['did they', 'didn\'t they', 'did he', 'didn\'t he'], correct: 0, explain: '"Nobody" takes "they" in the tag and positive aux.' },
  { id: 'dpp-b2-19', level: 'B2', topic: 'enough / too (clauses)', prompt: 'It was ___ hot for us to go out.', options: ['so', 'too', 'very', 'enough'], correct: 1, explain: '"Too + adj + for + object + to-infinitive".' },
  { id: 'dpp-b2-20', level: 'B2', topic: 'reduced relative', prompt: 'The man ___ over there is my uncle.', options: ['stand', 'standing', 'is standing', 'stood'], correct: 1, explain: 'Reduced relative with -ing = "who is standing".' },

  // ── B2+ · 10 more ──────────────────────────────────────────
  { id: 'dpp-b2p-11', level: 'B2+', topic: 'inversion (basic)', prompt: 'Only after the meeting ___ the real problem.', options: ['I realized', 'did I realize', 'I did realize', 'realized I'], correct: 1, explain: '"Only + time/clause" fronted → subject-aux inversion.' },
  { id: 'dpp-b2p-12', level: 'B2+', topic: 'concessive clauses', prompt: '___ tired she was, she kept going.', options: ['Even', 'How', 'However', 'Although'], correct: 2, explain: '"However + adj + subject + verb" = concession.' },
  { id: 'dpp-b2p-13', level: 'B2+', topic: 'participle clauses', prompt: '___ into the room, she noticed the smell.', options: ['Walking', 'Walked', 'To walk', 'Walks'], correct: 0, explain: 'Participle clause = -ing form for a simultaneous action.' },
  { id: 'dpp-b2p-14', level: 'B2+', topic: 'hedging with verbs', prompt: 'The data ___ that the trend is slowing.', options: ['proves', 'suggests', 'confirms', 'demonstrates'], correct: 1, explain: '"Suggests" is the hedged academic choice.' },
  { id: 'dpp-b2p-15', level: 'B2+', topic: 'as if / as though', prompt: 'He talks ___ he knew everything.', options: ['as', 'as if', 'that', 'like'], correct: 1, explain: '"As if" + past simple for unreal present comparison.' },
  { id: 'dpp-b2p-16', level: 'B2+', topic: 'correlative conjunctions', prompt: 'She is ___ intelligent ___ hard-working.', options: ['either / or', 'both / and', 'neither / nor', 'not only / and'], correct: 1, explain: '"Both X and Y" to link two positive qualities.' },
  { id: 'dpp-b2p-17', level: 'B2+', topic: 'no sooner', prompt: 'No sooner ___ the house ___ the rain started.', options: ['I left / than', 'had I left / than', 'did I leave / when', 'I had left / when'], correct: 1, explain: '"No sooner + past perfect inversion … than + past simple".' },
  { id: 'dpp-b2p-18', level: 'B2+', topic: 'cleft (what)', prompt: '___ me most is her attitude.', options: ['It bothers', 'What bothers', 'The thing bothers', 'Bothers what'], correct: 1, explain: 'Wh-cleft: "What + clause + is + …".' },
  { id: 'dpp-b2p-19', level: 'B2+', topic: 'gerund perfect', prompt: 'She apologised for ___ forgotten the appointment.', options: ['have', 'having', 'had', 'to have'], correct: 1, explain: 'Perfect gerund: "having + past participle" for a prior action.' },
  { id: 'dpp-b2p-20', level: 'B2+', topic: 'subjunctive (mandative intro)', prompt: 'It is essential that he ___ on time.', options: ['is', 'be', 'to be', 'being'], correct: 1, explain: 'Mandative subjunctive uses the base form.' },

  // ── C1 · 10 more ───────────────────────────────────────────
  { id: 'dpp-c1-11', level: 'C1', topic: 'fronting', prompt: '___ I expected to see at the door than my old roommate.', options: ['The last person', 'Not anyone', 'Nobody more', 'Hardly anyone did'], correct: 0, explain: 'Fronting for stylistic emphasis: subject phrase + verb.' },
  { id: 'dpp-c1-12', level: 'C1', topic: 'inversion (negative adverbials)', prompt: 'Hardly ___ the house when the phone rang.', options: ['I had left', 'had I left', 'I left', 'did I leave'], correct: 1, explain: '"Hardly" fronted → subject-aux inversion with past perfect.' },
  { id: 'dpp-c1-13', level: 'C1', topic: 'subjunctive (unreal)', prompt: 'If I ___ in your shoes, I\'d accept the offer.', options: ['was', 'were', 'am', 'would be'], correct: 1, explain: 'Hypothetical "were" in all persons is formal/standard.' },
  { id: 'dpp-c1-14', level: 'C1', topic: 'participle clauses (advanced)', prompt: '___ by critics, the film still flopped.', options: ['Having praised', 'Praised', 'Praising', 'Being praised'], correct: 1, explain: 'Past participle for a passive / completed reason.' },
  { id: 'dpp-c1-15', level: 'C1', topic: 'discourse markers (formal)', prompt: 'The proposal is innovative; ___, it is unrealistic.', options: ['so', 'however', 'nevertheless', 'then'], correct: 2, explain: '"Nevertheless" = formal concession signalling contrast.' },
  { id: 'dpp-c1-16', level: 'C1', topic: 'ellipsis (verb phrase)', prompt: 'She can\'t come, but her sister ___.', options: ['can to', 'can', 'is', 'has'], correct: 1, explain: 'Ellipsis of the verb phrase after a modal uses the modal alone.' },
  { id: 'dpp-c1-17', level: 'C1', topic: 'had + inverted subject (literary)', prompt: '___ earlier, he might have caught the flight.', options: ['Had he left', 'If he left', 'If he had leave', 'Did he leave'], correct: 0, explain: 'Third-conditional inversion drops "if": "Had + subject + pp".' },
  { id: 'dpp-c1-18', level: 'C1', topic: 'far from (emphatic)', prompt: '___ being lazy, she works around the clock.', options: ['Instead of', 'Far from', 'Rather than', 'Apart from'], correct: 1, explain: '"Far from" + -ing = strong denial of an attribute.' },
  { id: 'dpp-c1-19', level: 'C1', topic: 'inversion (not only)', prompt: 'Not only ___ late, he didn\'t apologise.', options: ['he arrived', 'did he arrive', 'arrived he', 'he did arrive'], correct: 1, explain: '"Not only" fronted → do-aux inversion.' },
  { id: 'dpp-c1-20', level: 'C1', topic: 'subjunctive (that-clauses)', prompt: 'The committee insisted that the report ___ revised.', options: ['is', 'was', 'be', 'to be'], correct: 2, explain: 'Mandative subjunctive after verbs like insist, demand.' },

  // ╔══════════ Pool expansion — wave 3 ══════════════════════╗
  // Final wave bringing each level to 30 total. Covers the extreme
  // tail: a student oscillating between two levels at the 50-cap
  // can't exhaust them, and the engine always has fresh variety.

  // ── A0 · 10 more ───────────────────────────────────────────
  { id: 'dpp-a0-21', level: 'A0', topic: 'present simple (I/you)', prompt: 'You ___ English very well.', options: ['speaks', 'speak', 'speaking', 'are speak'], correct: 1, explain: '"I/You/We/They" + base form of the verb.' },
  { id: 'dpp-a0-22', level: 'A0', topic: 'short answers', prompt: '"Are you a student?" — "Yes, ___."', options: ['I am', 'I\'m', 'am I', 'I do'], correct: 0, explain: 'Short answers repeat the subject + auxiliary.' },
  { id: 'dpp-a0-23', level: 'A0', topic: 'prepositions (from)', prompt: 'I\'m ___ Chile.', options: ['of', 'at', 'from', 'in'], correct: 2, explain: '"From" + country shows origin.' },
  { id: 'dpp-a0-24', level: 'A0', topic: 'basic adjectives', prompt: 'This soup is very ___.', options: ['hotly', 'a hot', 'hot', 'hots'], correct: 2, explain: 'Adjective after "be": no article, no -s.' },
  { id: 'dpp-a0-25', level: 'A0', topic: 'colors + nouns', prompt: 'I have a ___.', options: ['red car', 'car red', 'cars red', 'red cars'], correct: 0, explain: 'English places the adjective BEFORE the noun.' },
  { id: 'dpp-a0-26', level: 'A0', topic: 'this / these', prompt: '___ apples are delicious.', options: ['This', 'That', 'These', 'Those'], correct: 2, explain: 'Plural + near = "these".' },
  { id: 'dpp-a0-27', level: 'A0', topic: 'do / does (questions)', prompt: '___ she like pizza?', options: ['Do', 'Does', 'Is', 'Are'], correct: 1, explain: 'Present simple question with "she" → "Does".' },
  { id: 'dpp-a0-28', level: 'A0', topic: 'in / on (time)', prompt: 'The meeting is ___ Monday.', options: ['in', 'on', 'at', 'of'], correct: 1, explain: 'Days of the week take "on".' },
  { id: 'dpp-a0-29', level: 'A0', topic: 'verb "to be" (plural)', prompt: 'My parents ___ doctors.', options: ['is', 'are', 'am', 'be'], correct: 1, explain: 'Plural subject → "are".' },
  { id: 'dpp-a0-30', level: 'A0', topic: 'where (questions)', prompt: '___ your keys?', options: ['Where is', 'Where are', 'Where\'s', 'Where do'], correct: 1, explain: '"Keys" is plural → "are".' },

  // ── A1 · 10 more ───────────────────────────────────────────
  { id: 'dpp-a1-21', level: 'A1', topic: 'present continuous (negative)', prompt: 'She ___ now; she\'s studying.', options: ['isn\'t sleeping', 'doesn\'t sleep', 'don\'t sleeping', 'not sleeping'], correct: 0, explain: 'Present continuous negative: "isn\'t + -ing".' },
  { id: 'dpp-a1-22', level: 'A1', topic: 'object / subject', prompt: '___ saw the movie yesterday.', options: ['Us', 'We', 'Our', 'Ours'], correct: 1, explain: 'Subject of the verb → "we".' },
  { id: 'dpp-a1-23', level: 'A1', topic: 'can / can\'t', prompt: 'I\'m sorry, I ___ come to the party.', options: ['can\'t', 'don\'t can', 'am not can', 'not can'], correct: 0, explain: 'Modal negative: "can\'t" + base verb.' },
  { id: 'dpp-a1-24', level: 'A1', topic: 'who / what (questions)', prompt: '___ is your English teacher?', options: ['What', 'Which', 'Who', 'Where'], correct: 2, explain: 'Asking about a person → "Who".' },
  { id: 'dpp-a1-25', level: 'A1', topic: 'how often', prompt: '___ do you go to the gym?', options: ['How often', 'How many', 'How much', 'How time'], correct: 0, explain: '"How often" asks about frequency.' },
  { id: 'dpp-a1-26', level: 'A1', topic: 'articles (definite)', prompt: 'Have you been to ___ United States?', options: ['-', 'a', 'an', 'the'], correct: 3, explain: 'Countries with "United" always take "the".' },
  { id: 'dpp-a1-27', level: 'A1', topic: 'possessive pronouns', prompt: 'This book isn\'t mine — it\'s ___.', options: ['your', 'yours', 'you\'re', 'of you'], correct: 1, explain: 'Possessive pronoun (no noun after) = "yours".' },
  { id: 'dpp-a1-28', level: 'A1', topic: 'present simple (routines)', prompt: 'My parents ___ dinner at 8 every night.', options: ['has', 'have', 'having', 'is having'], correct: 1, explain: 'Plural subject + routine → present simple "have".' },
  { id: 'dpp-a1-29', level: 'A1', topic: 'some / any', prompt: 'There aren\'t ___ milk in the fridge.', options: ['some', 'any', 'a', 'much'], correct: 1, explain: 'Negative → "any" with uncountable.' },
  { id: 'dpp-a1-30', level: 'A1', topic: 'would you like', prompt: '___ a cup of tea?', options: ['Do you like', 'Are you like', 'Would you like', 'Will you like'], correct: 2, explain: 'Polite offer: "Would you like …?".' },

  // ── A2 · 10 more ───────────────────────────────────────────
  { id: 'dpp-a2-21', level: 'A2', topic: 'past simple (questions)', prompt: '___ to the cinema last weekend?', options: ['Did you go', 'You went', 'Have you gone', 'Did you went'], correct: 0, explain: 'Past simple question: "Did + subject + base verb".' },
  { id: 'dpp-a2-22', level: 'A2', topic: 'adjective + preposition', prompt: 'She\'s very good ___ math.', options: ['in', 'on', 'at', 'for'], correct: 2, explain: '"Good at" + skill is the fixed collocation.' },
  { id: 'dpp-a2-23', level: 'A2', topic: 'be going to (plans)', prompt: 'Look at those clouds! It ___ rain.', options: ['goes to', 'will', 'is going to', 'is'], correct: 2, explain: '"Be going to" for predictions based on evidence.' },
  { id: 'dpp-a2-24', level: 'A2', topic: 'first conditional (basic)', prompt: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'are staying', 'would stay'], correct: 1, explain: 'First conditional: "if + present, will + base".' },
  { id: 'dpp-a2-25', level: 'A2', topic: 'comparative (less)', prompt: 'This movie is ___ interesting than the first one.', options: ['least', 'lesser', 'less', 'little'], correct: 2, explain: '"Less + adjective + than".' },
  { id: 'dpp-a2-26', level: 'A2', topic: 'have to / don\'t have to', prompt: 'You ___ pay — it\'s free today.', options: ['mustn\'t', 'don\'t have to', 'haven\'t to', 'no need to'], correct: 1, explain: '"Don\'t have to" = no obligation.' },
  { id: 'dpp-a2-27', level: 'A2', topic: 'adverbs of place', prompt: 'Come ___ — the kitchen is warmer.', options: ['on here', 'here', 'the here', 'at here'], correct: 1, explain: 'Adverbs of place take no preposition.' },
  { id: 'dpp-a2-28', level: 'A2', topic: 'present perfect (ever/never)', prompt: 'Have you ___ been to Japan?', options: ['never', 'ever', 'yet', 'just'], correct: 1, explain: '"Ever" in present perfect questions = at any time.' },
  { id: 'dpp-a2-29', level: 'A2', topic: 'too many / too much', prompt: 'There are ___ cars on the road today.', options: ['too much', 'too many', 'very many', 'a lot'], correct: 1, explain: '"Too many" + countable plural.' },
  { id: 'dpp-a2-30', level: 'A2', topic: 'prepositions (travel)', prompt: 'We travelled ___ train from Paris ___ Rome.', options: ['on / at', 'by / to', 'in / for', 'with / until'], correct: 1, explain: '"By + transport"; destination = "to".' },

  // ── B1 · 10 more ───────────────────────────────────────────
  { id: 'dpp-b1-21', level: 'B1', topic: 'reported questions', prompt: 'She asked me ___ I was happy.', options: ['that', 'if', 'what', 'did'], correct: 1, explain: 'Reporting yes/no questions → "if" / "whether".' },
  { id: 'dpp-b1-22', level: 'B1', topic: 'make / let', prompt: 'My parents didn\'t let me ___ out last night.', options: ['go', 'to go', 'going', 'went'], correct: 0, explain: '"Let + object + base verb" (no "to").' },
  { id: 'dpp-b1-23', level: 'B1', topic: 'modal perfect (should have)', prompt: 'You ___ told me earlier.', options: ['should', 'should have', 'should had', 'should been'], correct: 1, explain: '"Should have + past participle" = past regret / advice.' },
  { id: 'dpp-b1-24', level: 'B1', topic: 'passive (present simple)', prompt: 'These products ___ in China.', options: ['make', 'are made', 'are making', 'make them'], correct: 1, explain: 'Present passive: "am/is/are + past participle".' },
  { id: 'dpp-b1-25', level: 'B1', topic: 'comparatives (much + comp)', prompt: 'Your idea is ___ than mine.', options: ['much better', 'much good', 'very better', 'more best'], correct: 0, explain: '"Much + comparative" intensifies the comparison.' },
  { id: 'dpp-b1-26', level: 'B1', topic: 'embedded questions', prompt: 'Do you know ___?', options: ['where is the station', 'where the station is', 'where does the station', 'the station is where'], correct: 1, explain: 'Embedded question → statement order.' },
  { id: 'dpp-b1-27', level: 'B1', topic: 'enough + for (clauses)', prompt: 'The water isn\'t hot enough ___ tea.', options: ['make', 'to make', 'for make', 'making'], correct: 1, explain: '"Enough + to-infinitive".' },
  { id: 'dpp-b1-28', level: 'B1', topic: 'because / because of', prompt: 'We cancelled the picnic ___ the rain.', options: ['because', 'because of', 'for', 'due'], correct: 1, explain: '"Because of" + noun; "because" + clause.' },
  { id: 'dpp-b1-29', level: 'B1', topic: 'like vs as', prompt: 'He works ___ a chef in a famous restaurant.', options: ['like', 'as', 'how', 'such'], correct: 1, explain: '"As" + job/role; "like" for similarity.' },
  { id: 'dpp-b1-30', level: 'B1', topic: 'conjunctions (although)', prompt: '___ it was cold, we went for a walk.', options: ['Despite', 'Although', 'In spite', 'However'], correct: 1, explain: '"Although" + clause; "despite" + noun / -ing.' },

  // ── B2 · 10 more ───────────────────────────────────────────
  { id: 'dpp-b2-21', level: 'B2', topic: 'inversion (basic)', prompt: 'Rarely ___ such an elegant solution.', options: ['I have seen', 'have I seen', 'I had seen', 'did I saw'], correct: 1, explain: 'Negative adverb fronted → aux-subject inversion.' },
  { id: 'dpp-b2-22', level: 'B2', topic: 'passive (present perfect)', prompt: 'The documents ___ by the lawyers.', options: ['have already reviewed', 'have been already reviewed', 'have already been reviewed', 'already have reviewed'], correct: 2, explain: 'Present perfect passive: "have + been + past participle".' },
  { id: 'dpp-b2-23', level: 'B2', topic: 'causative (have)', prompt: 'I need to ___ my hair cut before the wedding.', options: ['do', 'have', 'make', 'get'], correct: 1, explain: '"Have + object + past participle" = arrange a service.' },
  { id: 'dpp-b2-24', level: 'B2', topic: 'mixed conditional (intro)', prompt: 'If I ___ harder in school, I\'d have a better job now.', options: ['studied', 'had studied', 'would study', 'will study'], correct: 1, explain: 'Mixed conditional: past condition → present result.' },
  { id: 'dpp-b2-25', level: 'B2', topic: 'subjunctive (suggestion)', prompt: 'The manager suggested that she ___ a report.', options: ['writes', 'wrote', 'write', 'to write'], correct: 2, explain: 'Mandative subjunctive after "suggest".' },
  { id: 'dpp-b2-26', level: 'B2', topic: 'conditionals (unless)', prompt: 'I won\'t speak to him ___ he apologises first.', options: ['if', 'unless', 'in case', 'provided'], correct: 1, explain: '"Unless" = "if not".' },
  { id: 'dpp-b2-27', level: 'B2', topic: 'cleft (it)', prompt: '___ caused the problem — not the software.', options: ['It was the user who', 'The user that', 'It\'s who the user', 'What the user'], correct: 0, explain: '"It + be + emphasised + who/that".' },
  { id: 'dpp-b2-28', level: 'B2', topic: 'gerund after preposition', prompt: 'She\'s thinking about ___ her own company.', options: ['start', 'to start', 'started', 'starting'], correct: 3, explain: 'Preposition + gerund (-ing).' },
  { id: 'dpp-b2-29', level: 'B2', topic: 'future perfect continuous', prompt: 'By December, I ___ here for ten years.', options: ['will work', 'will be working', 'will have been working', 'am working'], correct: 2, explain: 'Future perfect continuous: duration up to a future point.' },
  { id: 'dpp-b2-30', level: 'B2', topic: 'adverb placement', prompt: 'She ___ finished the task on time.', options: ['has almost', 'almost has', 'has finished almost', 'almost had'], correct: 0, explain: 'Adverb between auxiliary and main verb.' },

  // ── B2+ · 10 more ──────────────────────────────────────────
  { id: 'dpp-b2p-21', level: 'B2+', topic: 'inversion (seldom)', prompt: 'Seldom ___ such a brilliant performance.', options: ['we see', 'do we see', 'we do see', 'see we'], correct: 1, explain: '"Seldom" fronted → do-aux inversion.' },
  { id: 'dpp-b2p-22', level: 'B2+', topic: 'participle clauses (past)', prompt: '___ to Berlin, he found a new job quickly.', options: ['Having moved', 'Moved', 'Moving', 'To move'], correct: 0, explain: '"Having + past participle" for a completed earlier action.' },
  { id: 'dpp-b2p-23', level: 'B2+', topic: 'hedging (adverbs)', prompt: 'This ___ represents a turning point for the industry.', options: ['clear', 'arguably', 'definite', 'purely'], correct: 1, explain: '"Arguably" is the hedged adverb for a disputable claim.' },
  { id: 'dpp-b2p-24', level: 'B2+', topic: 'cleft (all)', prompt: '___ I need is a bit of peace and quiet.', options: ['It is', 'What', 'All', 'The one'], correct: 2, explain: '"All (that) + subject + verb" = cleft focus on the only thing.' },
  { id: 'dpp-b2p-25', level: 'B2+', topic: 'inversion (if omitted)', prompt: '___ you need anything, just call me.', options: ['Had', 'Should', 'If were', 'Were'], correct: 1, explain: '"Should" at start = polite conditional without "if".' },
  { id: 'dpp-b2p-26', level: 'B2+', topic: 'passive report', prompt: 'The CEO ___ to resign by the end of the week.', options: ['is expected', 'expects', 'has expected', 'is expecting'], correct: 0, explain: 'Passive report structure: "subject + be + reporting verb + to-inf".' },
  { id: 'dpp-b2p-27', level: 'B2+', topic: 'while / whereas', prompt: '___ the first study used surveys, the second relied on interviews.', options: ['While', 'When', 'Because', 'Since'], correct: 0, explain: '"While"/"whereas" for direct contrast.' },
  { id: 'dpp-b2p-28', level: 'B2+', topic: 'reduced conditional', prompt: '___ in doubt, consult the manual.', options: ['When', 'If you\'re', 'Are you', 'Being'], correct: 1, explain: 'Reduced conditional: "If + you\'re" shortens "If you are".' },
  { id: 'dpp-b2p-29', level: 'B2+', topic: 'appositional phrase', prompt: 'Dr. Lee, ___ a leading expert, will speak first.', options: ['that is', 'which is', 'who is', 'being is'], correct: 2, explain: 'Non-defining appositional clause: "who + be + description".' },
  { id: 'dpp-b2p-30', level: 'B2+', topic: 'passive gerund', prompt: 'She hates ___ at while she\'s working.', options: ['looked', 'to be looked', 'being looked', 'looking'], correct: 2, explain: 'Passive gerund: "being + past participle".' },

  // ── C1 · 10 more ───────────────────────────────────────────
  { id: 'dpp-c1-21', level: 'C1', topic: 'inversion (nowhere)', prompt: 'Nowhere ___ such hospitality.', options: ['I experienced', 'have I experienced', 'did I experience', 'I did experience'], correct: 1, explain: '"Nowhere" fronted → aux-subject inversion.' },
  { id: 'dpp-c1-22', level: 'C1', topic: 'subjunctive (lest)', prompt: 'We double-check every report ___ an error slip through.', options: ['so', 'in order', 'lest', 'unless'], correct: 2, explain: '"Lest" (formal) + subjunctive = "for fear that".' },
  { id: 'dpp-c1-23', level: 'C1', topic: 'future perfect passive', prompt: 'By next month, the renovations ___ completed.', options: ['will complete', 'will be completing', 'will have been', 'will have completed'], correct: 2, explain: 'Future perfect passive: "will have been + past participle".' },
  { id: 'dpp-c1-24', level: 'C1', topic: 'participle (having been)', prompt: '___ warned twice, she left her phone on in the exam.', options: ['Having been', 'Having', 'Being', 'Been'], correct: 0, explain: '"Having been + past participle" = passive perfect participle.' },
  { id: 'dpp-c1-25', level: 'C1', topic: 'cleft (reversed pseudo-cleft)', prompt: 'A proper apology is ___ he needs.', options: ['that', 'the one', 'what', 'where'], correct: 2, explain: 'Reversed wh-cleft: subject complement = "what-clause".' },
  { id: 'dpp-c1-26', level: 'C1', topic: 'inversion (only by)', prompt: 'Only by working together ___ overcome this crisis.', options: ['we will', 'can we', 'we can', 'will have'], correct: 1, explain: '"Only by …" fronted → modal + subject inversion.' },
  { id: 'dpp-c1-27', level: 'C1', topic: 'subjunctive (were to)', prompt: 'If I ___ hire someone, it would be her.', options: ['was', 'were', 'were to', 'was to'], correct: 2, explain: '"Were to" + base verb = remote hypothetical.' },
  { id: 'dpp-c1-28', level: 'C1', topic: 'future continuous passive', prompt: 'This time next week, the plans ___ reviewed.', options: ['are being', 'will be being', 'will be', 'will have'], correct: 1, explain: 'Future continuous passive is rare but correct: "will be being + past participle".' },
  { id: 'dpp-c1-29', level: 'C1', topic: 'ellipsis (so / neither)', prompt: '"I don\'t agree." — "Neither ___."', options: ['do I', 'I don\'t', 'am I', 'did I'], correct: 0, explain: '"Neither + aux + subject" for agreement with a negative.' },
  { id: 'dpp-c1-30', level: 'C1', topic: 'fronting (adjective)', prompt: '___ was the view that we stayed an extra hour.', options: ['So beautiful', 'Such beautiful', 'Very beautiful', 'Beautiful so'], correct: 0, explain: '"So + adj + be + subject + that + clause".' },

];

// Pool lookup helpers ─────────────────────────────────────────

export function questionsByLevel(level: string): DPPQuestion[] {
  return DPP_QUESTIONS.filter((q) => q.level === level);
}

export function findQuestion(id: string): DPPQuestion | undefined {
  return DPP_QUESTIONS.find((q) => q.id === id);
}
