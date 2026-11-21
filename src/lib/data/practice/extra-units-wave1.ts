// FriendlyTeaching.cl — Daily Practice: extra units, wave 1
//
// First batch closing the gap between the original 3-units-per-level
// seed and the full CEFR grammar scope. Units here ship with their own
// quickLesson inline (not via the QUICK_LESSONS overlay) so this file
// is self-contained and reviewable per-level.
//
// Pattern per unit: 10 exercises, mixed shapes (MCQ + fill-blank +
// match-pairs where it fits). The grammar focus of each unit is the
// title; every exercise should test that focus specifically.

import type { PracticeUnit } from '@/types/practice';

export const EXTRA_UNITS_WAVE_1: PracticeUnit[] = [

  // ╔══════════════════════ A0 ══════════════════════╗

  {
    id: 'a0-this-that-these-those',
    level: 'A0',
    skill: 'grammar',
    title: 'This, That, These, Those',
    description: 'Point at things near and far, singular and plural.',
    icon: '👉',
    quickLesson: {
      summary: 'English has four pointing words. Pick by distance (near vs far) and number (one vs many).',
      sections: [
        {
          heading: 'Near / Far',
          body: 'Near you: this (singular), these (plural). Far from you: that (singular), those (plural).',
          examples: [
            '**This** is my pen (in my hand).',
            '**That** is her car (over there).',
            '**These** books are new (in front of me).',
            '**Those** shoes are nice (across the room).',
          ],
          tip: 'If you can touch it → this / these. If you need to point → that / those.',
        },
      ],
    },
    exercises: [
      { id: 'a0-ttt-01', type: 'multiple-choice', prompt: 'You hold a book in your hand. You say:', options: ['That book is red.', 'This book is red.', 'Those book is red.', 'These book is red.'], correctIndex: 1 },
      { id: 'a0-ttt-02', type: 'fill-blank', prompt: 'Complete.', sentence: '___ shoes over there are mine.', answers: ['Those'], alts: [['those']] },
      { id: 'a0-ttt-03', type: 'multiple-choice', prompt: 'Which is correct?', options: ['These is my brother.', 'This are my brothers.', 'These are my brothers.', 'This is my brothers.'], correctIndex: 2 },
      { id: 'a0-ttt-04', type: 'fill-blank', prompt: 'Pointing at a photo far from you.', sentence: '___ is my grandmother.', answers: ['That'], alts: [['that']] },
      { id: 'a0-ttt-05', type: 'multiple-choice', prompt: 'You give someone a cup of tea and say:', options: ['That is for you.', 'These is for you.', 'Those is for you.', 'This is for you.'], correctIndex: 3 },
      { id: 'a0-ttt-06', type: 'match-pairs', prompt: 'Match the word with its use.', pairs: [
        { left: 'this',  right: 'near, singular' },
        { left: 'these', right: 'near, plural' },
        { left: 'that',  right: 'far, singular' },
        { left: 'those', right: 'far, plural' },
      ] },
      { id: 'a0-ttt-07', type: 'fill-blank', prompt: 'Complete.', sentence: 'What are ___ in your hand? (plural)', answers: ['these'] },
      { id: 'a0-ttt-08', type: 'multiple-choice', prompt: 'Pick the natural sentence.', options: ['This apples are red.', 'These apple is red.', 'These apples are red.', 'Those apple are red.'], correctIndex: 2 },
      { id: 'a0-ttt-09', type: 'fill-blank', prompt: 'Point at a girl at the other side of the park.', sentence: '___ girl is my friend.', answers: ['That'] },
      { id: 'a0-ttt-10', type: 'multiple-choice', prompt: 'Which is grammatical?', options: ['Is this your keys?', 'Are these your keys?', 'Is these your keys?', 'Are this your keys?'], correctIndex: 1 },
    ],
  },

  {
    id: 'a0-articles-a-an-the',
    level: 'A0',
    skill: 'grammar',
    title: 'Articles — a, an, the',
    description: 'When to use "a", "an", and "the".',
    icon: '🅰️',
    quickLesson: {
      summary: '"a / an" for one of many (unknown or new); "the" for something specific (already known).',
      sections: [
        {
          heading: 'a vs an',
          body: '"a" before a consonant SOUND; "an" before a vowel SOUND. Listen to the first sound, not the first letter.',
          examples: [
            '**a** cat, **a** university (sounds like "yoo-")',
            '**an** apple, **an** hour (silent h → vowel sound)',
          ],
        },
        {
          heading: 'When to use "the"',
          body: 'Use "the" when the listener knows exactly which one — because we mentioned it already, or because it is unique (the sun, the moon).',
          examples: [
            'I saw **a** dog. **The** dog was brown.',
            'Open **the** door, please.',
            '**The** sun is hot today.',
          ],
          tip: 'No article with general plural / uncountable nouns: "I love music", NOT "I love the music".',
        },
      ],
    },
    exercises: [
      { id: 'a0-art-01', type: 'multiple-choice', prompt: 'Pick the correct article.', options: ['a apple', 'an apple', 'the apple (specific)', 'option b or c'], correctIndex: 3 },
      { id: 'a0-art-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'I have ___ cat and ___ orange dog.', answers: ['a', 'an'] },
      { id: 'a0-art-03', type: 'fill-blank', prompt: 'Complete with THE or a/an.', sentence: 'There is ___ man at the door. ___ man wants to speak with you.', answers: ['a', 'The'] },
      { id: 'a0-art-04', type: 'multiple-choice', prompt: 'Which is correct?', options: ['an university', 'a university', 'the university (any)', 'uns university'], correctIndex: 1, explain: '"University" starts with a "yoo" sound → "a".' },
      { id: 'a0-art-05', type: 'fill-blank', prompt: 'General statement, no article.', sentence: 'I love ___ music.', answers: ['—'], alts: [['-', '']] },
      { id: 'a0-art-06', type: 'multiple-choice', prompt: 'The sun is bright today. We say:', options: ['A sun is bright today.', 'Sun is bright today.', 'The sun is bright today.', 'An sun is bright today.'], correctIndex: 2 },
      { id: 'a0-art-07', type: 'fill-blank', prompt: 'Complete.', sentence: 'She is ___ honest person.', answers: ['an'], explain: '"Honest" starts with a silent H → vowel sound.' },
      { id: 'a0-art-08', type: 'multiple-choice', prompt: 'Which sentence is correct?', options: ['I need the pen. Any pen.', 'I need a pen. Any pen.', 'I need pen. Any pen.', 'I need an pen. Any pen.'], correctIndex: 1 },
      { id: 'a0-art-09', type: 'fill-blank', prompt: 'Complete.', sentence: 'Please close ___ window.', answers: ['the'], explain: 'Both speakers know which window → "the".' },
      { id: 'a0-art-10', type: 'multiple-choice', prompt: 'Pick the natural sentence.', options: ['I eat a rice every day.', 'I eat rice every day.', 'I eat the rice every day.', 'I eat an rice every day.'], correctIndex: 1, explain: '"Rice" is uncountable → no article in general statements.' },
    ],
  },

  {
    id: 'a0-plurals',
    level: 'A0',
    skill: 'grammar',
    title: 'Plural nouns',
    description: 'Regular -s, -es, and the common irregulars.',
    icon: '👥',
    quickLesson: {
      summary: 'Most nouns add -s. After s / sh / ch / x / o you add -es. Nouns ending in consonant + y change to -ies. A few plurals are irregular.',
      sections: [
        {
          heading: 'Regular patterns',
          body: 'book → books · dish → dishes · city → cities · potato → potatoes.',
          examples: [
            'cat → **cats**',
            'box → **boxes** (x/ch/sh/s/o → add -es)',
            'baby → **babies** (consonant + y → ies)',
          ],
        },
        {
          heading: 'Common irregulars',
          body: 'Memorise these: man → men · woman → women · child → children · foot → feet · tooth → teeth · person → people · mouse → mice.',
          tip: 'Remember: "the people are" (plural, verb in plural).',
        },
      ],
    },
    exercises: [
      { id: 'a0-plu-01', type: 'multiple-choice', prompt: 'The plural of "baby" is:', options: ['babys', 'babyes', 'babies', 'baby'], correctIndex: 2 },
      { id: 'a0-plu-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'There are three ___ in my family.', answers: ['children'], alts: [['childs']] },
      { id: 'a0-plu-03', type: 'multiple-choice', prompt: 'The plural of "tomato" is:', options: ['tomatos', 'tomatoes', 'tomatoies', 'tomato'], correctIndex: 1 },
      { id: 'a0-plu-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'I brush my ___ twice a day.', answers: ['teeth'] },
      { id: 'a0-plu-05', type: 'multiple-choice', prompt: 'Which plural is CORRECT?', options: ['womans', 'womens', 'woman', 'women'], correctIndex: 3 },
      { id: 'a0-plu-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'The ___ in my shoes hurt. (plural of foot)', answers: ['feet'] },
      { id: 'a0-plu-07', type: 'multiple-choice', prompt: 'Which is correct?', options: ['people is nice', 'people are nice', 'peoples are nice', 'persons are nice'], correctIndex: 1 },
      { id: 'a0-plu-08', type: 'fill-blank', prompt: 'Complete (plural).', sentence: 'There are five ___ in my street. (plural of bus)', answers: ['buses'] },
      { id: 'a0-plu-09', type: 'match-pairs', prompt: 'Match singular with plural.', pairs: [
        { left: 'mouse',  right: 'mice' },
        { left: 'child',  right: 'children' },
        { left: 'person', right: 'people' },
        { left: 'foot',   right: 'feet' },
      ] },
      { id: 'a0-plu-10', type: 'multiple-choice', prompt: 'The plural of "wife" is:', options: ['wifes', 'wives', 'wifies', 'wife'], correctIndex: 1 },
    ],
  },

  // ╔══════════════════════ A1 ══════════════════════╗

  {
    id: 'a1-present-continuous',
    level: 'A1',
    skill: 'grammar',
    title: 'Present Continuous',
    description: 'Actions happening right now: am / is / are + -ing.',
    icon: '🏃',
    quickLesson: {
      summary: 'For things happening at the moment of speaking. Form: am / is / are + verb + -ing.',
      sections: [
        {
          heading: 'Structure',
          body: '"I am running" · "She is reading" · "They are talking". The -ing form marks the action is in progress now.',
          examples: [
            'I **am studying** right now.',
            'She **is cooking** dinner.',
            'They **are playing** football.',
          ],
        },
        {
          heading: 'Negative + questions',
          body: 'Negative: not after be → "I am not working". Question: be goes first → "Are you working?"',
          examples: [
            'He **isn\'t sleeping**.',
            '**Are** they **coming** today?',
          ],
          tip: 'Spelling: "run → running" (double consonant), "write → writing" (drop -e), "lie → lying" (ie → y).',
        },
      ],
    },
    exercises: [
      { id: 'a1-pc-01', type: 'fill-blank', prompt: 'Complete (present continuous).', sentence: 'Look! The baby ___ (sleep).', answers: ['is sleeping'] },
      { id: 'a1-pc-02', type: 'multiple-choice', prompt: 'Which is correct?', options: ['I running now.', 'I am run now.', 'I am running now.', 'I running am now.'], correctIndex: 2 },
      { id: 'a1-pc-03', type: 'fill-blank', prompt: 'Complete.', sentence: 'They ___ dinner right now. (eat)', answers: ['are eating'] },
      { id: 'a1-pc-04', type: 'multiple-choice', prompt: 'The -ing form of "swim" is:', options: ['swiming', 'swimming', 'swimingg', 'swim'], correctIndex: 1 },
      { id: 'a1-pc-05', type: 'fill-blank', prompt: 'Negative form.', sentence: 'I ___ ___ now. (not / work)', answers: ['am not', 'working'], alts: [["'m not"], ['working']] },
      { id: 'a1-pc-06', type: 'multiple-choice', prompt: 'Which sentence uses present continuous CORRECTLY?', options: ['She eats an apple now.', 'She is eating an apple now.', 'She eat an apple now.', 'She ate an apple now.'], correctIndex: 1 },
      { id: 'a1-pc-07', type: 'fill-blank', prompt: 'Question form.', sentence: '___ you ___? (work)', answers: ['Are', 'working'] },
      { id: 'a1-pc-08', type: 'multiple-choice', prompt: 'The -ing form of "write" is:', options: ['writing', 'writeing', 'writting', 'wrote'], correctIndex: 0 },
      { id: 'a1-pc-09', type: 'fill-blank', prompt: 'Complete.', sentence: 'What ___ you ___ right now? (do)', answers: ['are', 'doing'] },
      { id: 'a1-pc-10', type: 'multiple-choice', prompt: 'When do we use the present continuous?', options: ['For every day habits', 'For actions happening right now', 'For past actions', 'For facts about the world'], correctIndex: 1 },
    ],
  },

  {
    id: 'a1-object-pronouns',
    level: 'A1',
    skill: 'grammar',
    title: 'Object Pronouns',
    description: 'me, you, him, her, it, us, them — what replaces the object.',
    icon: '🫵',
    quickLesson: {
      summary: 'Subject pronouns (I, he, she…) do the action. Object pronouns (me, him, her…) receive it.',
      sections: [
        {
          heading: 'The pair table',
          body: 'I ↔ me · you ↔ you · he ↔ him · she ↔ her · it ↔ it · we ↔ us · they ↔ them.',
          examples: [
            '**I** love **her**.',
            '**She** calls **me** every Sunday.',
            '**They** teach **us** English.',
          ],
        },
        {
          heading: 'After verbs + prepositions',
          body: 'Both after a verb (love, see, call, know) and after prepositions (with, for, to, about) use the OBJECT form.',
          examples: [
            'Come **with me**, not "with I".',
            'This gift is **for you**.',
            'I was talking **about him**.',
          ],
          tip: 'Spanish "le / la / lo" all collapse into HIM / HER / IT depending on gender + role.',
        },
      ],
    },
    exercises: [
      { id: 'a1-op-01', type: 'multiple-choice', prompt: 'I love my parents. I call ___ every Sunday.', options: ['they', 'their', 'them', 'theirs'], correctIndex: 2 },
      { id: 'a1-op-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'That book is for ___ (my sister).', answers: ['her'] },
      { id: 'a1-op-03', type: 'multiple-choice', prompt: 'Which is CORRECT?', options: ['He gave me a book.', 'He gave I a book.', 'He gave my a book.', 'He gave me book.'], correctIndex: 0 },
      { id: 'a1-op-04', type: 'fill-blank', prompt: 'Replace "John" with a pronoun.', sentence: 'I called John. → I called ___.', answers: ['him'] },
      { id: 'a1-op-05', type: 'match-pairs', prompt: 'Match subject with object pronoun.', pairs: [
        { left: 'I',    right: 'me' },
        { left: 'he',   right: 'him' },
        { left: 'she',  right: 'her' },
        { left: 'they', right: 'them' },
      ] },
      { id: 'a1-op-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'Come with ___. (I)', answers: ['me'] },
      { id: 'a1-op-07', type: 'multiple-choice', prompt: 'Which is correct?', options: ['They invited we to the party.', 'They invited us to the party.', 'They invited our to the party.', 'They invited ours to the party.'], correctIndex: 1 },
      { id: 'a1-op-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'I don\'t know ___. (she)', answers: ['her'] },
      { id: 'a1-op-09', type: 'multiple-choice', prompt: '"Help me, please." The word "me" is:', options: ['a subject pronoun', 'an object pronoun', 'a possessive pronoun', 'a reflexive pronoun'], correctIndex: 1 },
      { id: 'a1-op-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'We saw ___ at the park yesterday. (they)', answers: ['them'] },
    ],
  },

  {
    id: 'a1-possessive-s',
    level: 'A1',
    skill: 'grammar',
    title: "Possessive 's",
    description: "John's car — how we show who owns what.",
    icon: '🔑',
    quickLesson: {
      summary: "Add 's to a person or animal to show ownership. For plural nouns ending in -s, just add the apostrophe after the s.",
      sections: [
        {
          heading: "Singular: 's",
          body: "Name / singular noun + apostrophe + s = that person owns it.",
          examples: [
            "**Anna's** phone (= the phone of Anna)",
            "my **brother's** car",
            "the **dog's** toy",
          ],
        },
        {
          heading: "Plural ending in -s: s'",
          body: "If the noun is plural AND ends in -s already, just add the apostrophe after it (no second s).",
          examples: [
            "my **parents'** house (two parents)",
            "the **boys'** school",
            "the **students'** marks",
          ],
          tip: "Irregular plurals keep the 's: children's, women's, people's.",
        },
      ],
    },
    exercises: [
      { id: 'a1-ps-01', type: 'multiple-choice', prompt: 'How do we say "the car of John"?', options: ["John car", "John's car", "Johns car", "car of John"], correctIndex: 1 },
      { id: 'a1-ps-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'This is my ___ bag. (sister)', answers: ["sister's"] },
      { id: 'a1-ps-03', type: 'multiple-choice', prompt: 'My parents own a house. We say:', options: ["my parent's house", "my parents' house", "my parents house", "my parentss house"], correctIndex: 1 },
      { id: 'a1-ps-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'The ___ toys are everywhere. (plural: children)', answers: ["children's"] },
      { id: 'a1-ps-05', type: 'multiple-choice', prompt: 'Which is correct?', options: ["This is my brothers room. (he has 1 brother)", "This is my brother's room. (he has 1 brother)", "This is my brothers' room. (he has 1 brother)", "This is brother my room."], correctIndex: 1 },
      { id: 'a1-ps-06', type: 'fill-blank', prompt: 'Complete.', sentence: "The ___ ball. (dog, singular)", answers: ["dog's"] },
      { id: 'a1-ps-07', type: 'multiple-choice', prompt: '"The women\'s rights movement" — why apostrophe + s?', options: ["Because women is plural but irregular", "Because women is singular", "It's always spelled wrong this way", "No reason"], correctIndex: 0 },
      { id: 'a1-ps-08', type: 'fill-blank', prompt: 'Complete.', sentence: "My ___ birthday is in June. (mother)", answers: ["mother's"] },
      { id: 'a1-ps-09', type: 'multiple-choice', prompt: 'My cat owns these toys. Which is correct?', options: ["the cats toys", "the cat's toys", "the cats' toys", "the cat toys"], correctIndex: 1 },
      { id: 'a1-ps-10', type: 'fill-blank', prompt: "Plural ending in -s.", sentence: "The ___ opinions matter. (students, plural)", answers: ["students'"] },
    ],
  },

  // ╔══════════════════════ A2 ══════════════════════╗

  {
    id: 'a2-present-perfect-intro',
    level: 'A2',
    skill: 'grammar',
    title: 'Present Perfect · intro',
    description: 'have / has + past participle for life experiences and recent events.',
    icon: '✅',
    quickLesson: {
      summary: '"have / has + past participle" for things you have done in your life (ever, never) or just now (just, already, yet).',
      sections: [
        {
          heading: 'Life experience',
          body: '"ever" (in questions) and "never" are the classic markers. No specific time — only whether it happened at all.',
          examples: [
            'Have you **ever eaten** sushi?',
            'I **have never been** to Japan.',
            'She **has visited** Peru three times.',
          ],
        },
        {
          heading: 'Just / already / yet',
          body: 'just = a moment ago. already = earlier than expected. yet = up until now (questions / negatives).',
          examples: [
            'I\'ve **just finished** my homework.',
            'She **has already left**.',
            'I **haven\'t eaten yet**.',
          ],
          tip: 'DON\'T use present perfect with "yesterday / last / ago" — those need past simple.',
        },
      ],
    },
    exercises: [
      { id: 'a2-ppi-01', type: 'multiple-choice', prompt: 'Which sentence is correct?', options: ['I have ate pizza yesterday.', 'I ate pizza yesterday.', 'I have eaten pizza yesterday.', 'I eat pizza yesterday.'], correctIndex: 1, explain: '"Yesterday" is a finished time → past simple.' },
      { id: 'a2-ppi-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'I ___ ___ (never / be) to Paris.', answers: ['have', 'been'], alts: [["'ve"], ['been']] },
      { id: 'a2-ppi-03', type: 'multiple-choice', prompt: 'Have you ___ sushi?', options: ['ever eat', 'ever eaten', 'eat ever', 'eaten ever'], correctIndex: 1 },
      { id: 'a2-ppi-04', type: 'fill-blank', prompt: 'Complete with past participle.', sentence: 'She has ___ the email. (write)', answers: ['written'] },
      { id: 'a2-ppi-05', type: 'multiple-choice', prompt: 'I ___ seen that film three times this year.', options: ['have', 'has', 'am', 'was'], correctIndex: 0 },
      { id: 'a2-ppi-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'She hasn\'t arrived ___ .', answers: ['yet'] },
      { id: 'a2-ppi-07', type: 'multiple-choice', prompt: 'Pick the correct response: "Have you finished the book?"', options: ['Yes, I finished.', 'Yes, I have.', 'Yes, I am.', 'Yes, I do.'], correctIndex: 1 },
      { id: 'a2-ppi-08', type: 'fill-blank', prompt: 'Complete (just arrived).', sentence: "The train has ___ arrived.", answers: ['just'] },
      { id: 'a2-ppi-09', type: 'multiple-choice', prompt: 'Which sentence works with present perfect?', options: ['I have gone to the gym yesterday.', 'I have been to the gym twice this week.', 'I have been to the gym in 2020.', 'I have been to the gym last week.'], correctIndex: 1 },
      { id: 'a2-ppi-10', type: 'fill-blank', prompt: 'Past participle of "go".', sentence: 'They have ___ home already.', answers: ['gone'] },
    ],
  },

  {
    id: 'a2-first-conditional',
    level: 'A2',
    skill: 'grammar',
    title: 'First Conditional',
    description: 'If + present, will + verb — likely future situations.',
    icon: '🤔',
    quickLesson: {
      summary: 'Talk about possible future situations: "If it rains, we will stay home." Use present simple after IF, and will + base verb in the main clause.',
      sections: [
        {
          heading: 'Structure',
          body: 'If + present simple, will + base verb. The clauses can swap: "We will stay home if it rains" works too. Comma only when "if" is first.',
          examples: [
            '**If I study**, I **will pass**.',
            'She **will call** you **if she has time**.',
            '**If you don\'t hurry**, we **\'ll miss** the train.',
          ],
          tip: 'Never put WILL in the "if" clause: "If it will rain" → ✗',
        },
        {
          heading: 'Alternatives to "will"',
          body: 'You can use other modals in the result clause for nuance: may / might / could (less certain), can (ability), should (advice).',
          examples: [
            'If you ask her, she **might** say yes.',
            'If you need help, you **can** call me.',
          ],
        },
      ],
    },
    exercises: [
      { id: 'a2-1c-01', type: 'multiple-choice', prompt: 'If it ___ tomorrow, we ___ stay home.', options: ['will rain / will', 'rains / will', 'rained / would', 'rain / will'], correctIndex: 1 },
      { id: 'a2-1c-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'If I ___ (finish) early, I\'ll call you.', answers: ['finish'] },
      { id: 'a2-1c-03', type: 'multiple-choice', prompt: 'Which is CORRECT?', options: ["If you will study, you will pass.", "If you study, you will pass.", "If you studied, you will pass.", "If you study, you would pass."], correctIndex: 1 },
      { id: 'a2-1c-04', type: 'fill-blank', prompt: 'Complete.', sentence: "If you don't hurry, we ___ the bus. (miss)", answers: ["'ll miss"], alts: [['will miss']] },
      { id: 'a2-1c-05', type: 'multiple-choice', prompt: 'Which pair is NOT a valid first-conditional result?', options: ['will + verb', 'might + verb', 'can + verb', 'would + verb'], correctIndex: 3, explain: '"would" belongs to the 2nd conditional.' },
      { id: 'a2-1c-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'If she asks me, I ___ (tell) her the truth.', answers: ["'ll tell"], alts: [['will tell']] },
      { id: 'a2-1c-07', type: 'multiple-choice', prompt: 'Which sentence is grammatically correct?', options: ['I will help you if you need me.', 'I will help you if you will need me.', 'I would help you if you need me.', 'I would help you if you will need me.'], correctIndex: 0 },
      { id: 'a2-1c-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'If it ___ sunny tomorrow, we\'ll go to the beach. (be)', answers: ['is'] },
      { id: 'a2-1c-09', type: 'multiple-choice', prompt: '"If I pass the exam, I might go to the party." What does "might" show?', options: ['Certainty', 'Possibility — not sure', 'Permission', 'Obligation'], correctIndex: 1 },
      { id: 'a2-1c-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'What ___ you ___ if you win the lottery? (do)', answers: ['will', 'do'] },
    ],
  },

  {
    id: 'a2-comparatives-and-superlatives',
    level: 'A2',
    skill: 'grammar',
    title: 'Comparatives & Superlatives',
    description: '-er / -est vs more / most — plus the irregulars.',
    icon: '🏆',
    quickLesson: {
      summary: 'Short adjectives add -er / -est. Long adjectives use more / most. A few classics are irregular: good → better → best.',
      sections: [
        {
          heading: 'Short adjectives (1 syllable)',
          body: 'Add -er (compare) / -est (top). Double the final consonant after short vowel: big → bigger → biggest.',
          examples: [
            'fast → **faster → fastest**',
            'big → **bigger → biggest**',
            'nice → **nicer → nicest** (drop silent -e)',
          ],
        },
        {
          heading: 'Long adjectives + irregulars',
          body: '3+ syllables → "more" / "most" + adjective. 2-syllable adjectives ending in -y → -ier / -iest.',
          examples: [
            'expensive → **more expensive → the most expensive**',
            'happy → **happier → happiest**',
            'good → **better → best** · bad → **worse → worst** · far → **farther/further → farthest/furthest**',
          ],
          tip: 'Use THAN after a comparative, THE before a superlative.',
        },
      ],
    },
    exercises: [
      { id: 'a2-cs-01', type: 'multiple-choice', prompt: 'A train is ___ than a bus.', options: ['more fast', 'faster', 'fast', 'the fastest'], correctIndex: 1 },
      { id: 'a2-cs-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'This is ___ hotel in the city. (good — superlative)', answers: ['the best'] },
      { id: 'a2-cs-03', type: 'multiple-choice', prompt: '"Expensive" compared to another thing:', options: ['expensiver', 'more expensive', 'expensiest', 'most expensive'], correctIndex: 1 },
      { id: 'a2-cs-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'My bag is ___ than yours. (heavy)', answers: ['heavier'] },
      { id: 'a2-cs-05', type: 'multiple-choice', prompt: 'The comparative of "big" is:', options: ['more big', 'bigest', 'bigger', 'biger'], correctIndex: 2 },
      { id: 'a2-cs-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'That was ___ film I have ever seen. (bad — superlative)', answers: ['the worst'] },
      { id: 'a2-cs-07', type: 'multiple-choice', prompt: 'Which sentence is CORRECT?', options: ['She is more tall than her brother.', 'She is taller than her brother.', 'She is more taller than her brother.', 'She is tallest than her brother.'], correctIndex: 1 },
      { id: 'a2-cs-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'Russia is ___ country in the world. (large — superlative)', answers: ['the largest'] },
      { id: 'a2-cs-09', type: 'match-pairs', prompt: 'Match adjective with comparative.', pairs: [
        { left: 'good',    right: 'better' },
        { left: 'bad',     right: 'worse' },
        { left: 'happy',   right: 'happier' },
        { left: 'serious', right: 'more serious' },
      ] },
      { id: 'a2-cs-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'Today is ___ than yesterday. (hot)', answers: ['hotter'] },
    ],
  },

  // ╔══════════════════════ B1 ══════════════════════╗

  {
    id: 'b1-present-perfect-continuous',
    level: 'B1',
    skill: 'grammar',
    title: 'Present Perfect Continuous',
    description: 'have / has been + -ing — duration up to now.',
    icon: '⏳',
    quickLesson: {
      summary: '"Have been + -ing" for an action that started in the past and continues (or has just stopped). Focus on duration or ongoing nature.',
      sections: [
        {
          heading: 'Structure + meaning',
          body: 'have/has + been + verb-ing. Typical with "for / since / all day / lately".',
          examples: [
            'I **have been studying** for three hours.',
            'She **\'s been living** in Berlin since 2020.',
            'They **\'ve been waiting** all afternoon.',
          ],
        },
        {
          heading: 'vs Present Perfect simple',
          body: 'Perfect simple = focus on the RESULT / completion. Perfect continuous = focus on the ACTIVITY / its duration.',
          examples: [
            'I **\'ve written** five emails. (done, countable result)',
            'I **\'ve been writing** emails all morning. (activity, how long)',
          ],
          tip: 'Stative verbs (know, believe, love, want) do not usually go in continuous form.',
        },
      ],
    },
    exercises: [
      { id: 'b1-ppc-01', type: 'multiple-choice', prompt: '"I\'ve been running for an hour." What does it emphasise?', options: ['How many times I ran', 'The duration of the activity', 'A completed result', 'A plan for the future'], correctIndex: 1 },
      { id: 'b1-ppc-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'She ___ ___ (study) English since 2018.', answers: ['has been', 'studying'] },
      { id: 'b1-ppc-03', type: 'multiple-choice', prompt: 'Pick the natural one.', options: ['I have been knowing him for years.', 'I have known him for years.', 'I have been know him for years.', 'I knowing him for years.'], correctIndex: 1, explain: '"Know" is stative — present perfect simple.' },
      { id: 'b1-ppc-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'They ___ ___ (wait) for two hours. They are very tired.', answers: ['have been', 'waiting'] },
      { id: 'b1-ppc-05', type: 'multiple-choice', prompt: 'Which sentence focuses on the COMPLETED RESULT?', options: ["I've been reading this book.", "I've read five books this month.", "I've been painting all day.", "I've been living here for years."], correctIndex: 1 },
      { id: 'b1-ppc-06', type: 'fill-blank', prompt: 'Complete.', sentence: "How long ___ you ___ (work) here?", answers: ['have', 'been working'] },
      { id: 'b1-ppc-07', type: 'multiple-choice', prompt: 'Which signal word goes best with present perfect continuous?', options: ['yesterday', 'last week', 'for two hours', 'in 1999'], correctIndex: 2 },
      { id: 'b1-ppc-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'My eyes hurt because I ___ ___ (read) all day.', answers: ['have been', 'reading'], alts: [["'ve been"], ['reading']] },
      { id: 'b1-ppc-09', type: 'multiple-choice', prompt: 'Which pair is CORRECT?', options: ['have been / known', 'have being / know', 'have been / knowing', 'have / been know'], correctIndex: 0 },
      { id: 'b1-ppc-10', type: 'fill-blank', prompt: 'Complete.', sentence: "It ___ ___ (rain) since this morning.", answers: ['has been', 'raining'] },
    ],
  },

  {
    id: 'b1-past-perfect',
    level: 'B1',
    skill: 'grammar',
    title: 'Past Perfect',
    description: 'had + past participle — the earlier of two past actions.',
    icon: '⏮️',
    quickLesson: {
      summary: '"had + past participle" shows that one past action happened BEFORE another past action.',
      sections: [
        {
          heading: 'Why we use it',
          body: 'When two things happened in the past, past perfect marks the earlier one. Everything else stays in past simple.',
          examples: [
            'When I arrived, the film **had already started**.',
            'She **had lived** there for 10 years before she moved.',
            'By the time we got to the station, the train **had left**.',
          ],
        },
        {
          heading: 'Signal expressions',
          body: '"by the time", "before", "after", "when", "already", "just", "never" + past perfect.',
          examples: [
            'He had **never been** on a plane before that trip.',
            'She had **just finished** when I called.',
          ],
          tip: 'If the past actions happened in clear sequence (first A, then B), past simple + past simple is fine. Past perfect adds nuance about ordering.',
        },
      ],
    },
    exercises: [
      { id: 'b1-pp-01', type: 'multiple-choice', prompt: 'By the time we arrived, the film ___.', options: ['started', 'was starting', 'had started', 'has started'], correctIndex: 2 },
      { id: 'b1-pp-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'She ___ ___ (live) there for 10 years before she moved. ', answers: ['had', 'lived'] },
      { id: 'b1-pp-03', type: 'multiple-choice', prompt: '"I ___ seen that film before, so I didn\'t enjoy it a second time."', options: ['have', 'had', 'has', 'am'], correctIndex: 1 },
      { id: 'b1-pp-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'When I arrived, the party ___ already ___ (finish).', answers: ['had', 'finished'] },
      { id: 'b1-pp-05', type: 'multiple-choice', prompt: 'Which sentence is CORRECT?', options: ['After she had eaten, she went to bed.', 'After she ate, she had went to bed.', 'After she had eat, she went to bed.', 'After she had been eating, she had gone to bed.'], correctIndex: 0 },
      { id: 'b1-pp-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'They ___ never ___ (travel) abroad until that trip.', answers: ['had', 'travelled'], alts: [['had'], ['traveled']] },
      { id: 'b1-pp-07', type: 'multiple-choice', prompt: '"He realised he ___ his wallet at home." Pick the natural option.', options: ['leaves', 'has left', 'had left', 'is leaving'], correctIndex: 2 },
      { id: 'b1-pp-08', type: 'fill-blank', prompt: 'Complete.', sentence: "I didn't recognise her — she ___ ___ her hair. (cut)", answers: ['had', 'cut'] },
      { id: 'b1-pp-09', type: 'multiple-choice', prompt: 'Past perfect of "to write" is:', options: ['have written', 'had writing', 'had written', 'was writing'], correctIndex: 2 },
      { id: 'b1-pp-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'By 2020 she ___ already ___ (publish) three novels.', answers: ['had', 'published'] },
    ],
  },

  {
    id: 'b1-modals-advice-obligation',
    level: 'B1',
    skill: 'grammar',
    title: 'Modals · advice, must, have to',
    description: 'should / must / have to / have got to — advice, necessity and rules.',
    icon: '🧭',
    quickLesson: {
      summary: '"should" = advice. "must / have to" = necessity (strong). "don\'t have to" = NOT necessary (optional). "mustn\'t" = forbidden.',
      sections: [
        {
          heading: 'Advice: should',
          body: 'For recommendations. Negative: shouldn\'t. Soften with "could" or "might want to".',
          examples: [
            'You **should** see a doctor.',
            'You **shouldn\'t** eat so late.',
            'You **might want to** try the other option.',
          ],
        },
        {
          heading: 'Obligation: must vs have to',
          body: '"must" is internal / spoken authority. "have to" is external rule or habit.',
          examples: [
            'I **must** call my mum. (I feel I should)',
            'I **have to** wear a uniform. (rule from outside)',
            'You **don\'t have to** come (= not necessary).',
            'You **mustn\'t** smoke here (= forbidden).',
          ],
          tip: '"don\'t have to" and "mustn\'t" look similar but mean opposite things — be careful.',
        },
      ],
    },
    exercises: [
      { id: 'b1-mao-01', type: 'multiple-choice', prompt: 'You look tired. You ___ go to bed earlier.', options: ['should', 'must', 'can', 'ought'], correctIndex: 0 },
      { id: 'b1-mao-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'In my school, we ___ ___ wear a uniform. (external rule)', answers: ['have', 'to'] },
      { id: 'b1-mao-03', type: 'multiple-choice', prompt: '"You mustn\'t smoke here" means:', options: ["it's not necessary to smoke", "you are forbidden to smoke", "you should smoke", "you have a choice"], correctIndex: 1 },
      { id: 'b1-mao-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'You ___ ___ bring food — we\'ll provide everything. (not necessary)', answers: ["don't", 'have to'] },
      { id: 'b1-mao-05', type: 'multiple-choice', prompt: 'Which sentence gives ADVICE?', options: ['She has to work tomorrow.', 'You should drink more water.', 'You mustn\'t enter without a badge.', 'I have to leave now.'], correctIndex: 1 },
      { id: 'b1-mao-06', type: 'fill-blank', prompt: 'Complete.', sentence: "He really ___ see that doctor. He's been coughing for days.", answers: ['should'] },
      { id: 'b1-mao-07', type: 'multiple-choice', prompt: '"I must call my mum" is softer than "I have to call my mum" because:', options: ["it's internal — my own feeling, not a rule", "it uses two words", "it's past tense", "it's a question"], correctIndex: 0 },
      { id: 'b1-mao-08', type: 'fill-blank', prompt: 'Complete.', sentence: "You ___ park here — it's a bus lane. (prohibition)", answers: ["mustn't"], alts: [['must not']] },
      { id: 'b1-mao-09', type: 'multiple-choice', prompt: 'Pick the correct negative advice.', options: ["You don't should eat so much sugar.", "You shouldn't eat so much sugar.", "You mustn't eat so much sugar.", "You not should eat so much sugar."], correctIndex: 1 },
      { id: 'b1-mao-10', type: 'fill-blank', prompt: 'Complete.', sentence: "I ___ go to the dentist tomorrow — my mother booked me an appointment. (external)", answers: ['have to'] },
    ],
  },

  // ╔══════════════════════ B2 ══════════════════════╗

  {
    id: 'b2-third-conditional',
    level: 'B2',
    skill: 'grammar',
    title: 'Third Conditional',
    description: 'If + past perfect, would have + past participle — past regret.',
    icon: '😔',
    quickLesson: {
      summary: 'For imaginary past situations and their imaginary past results. "If I had studied, I would have passed."',
      sections: [
        {
          heading: 'Structure',
          body: 'If + had + past participle, would / could / might + have + past participle. Both halves describe things that did NOT happen.',
          examples: [
            '**If I had left** earlier, I **would have caught** the train.',
            '**If she had asked** me, I **would have helped**.',
            'They **could have won** **if they had tried** harder.',
          ],
        },
        {
          heading: 'Nuance with would / could / might',
          body: 'would have = clear result · could have = possibility · might have = uncertain possibility.',
          examples: [
            'If I had studied, I **would have passed**. (certain result)',
            'If I had studied, I **could have passed**. (possible)',
            'If I had studied, I **might have passed**. (maybe)',
          ],
          tip: 'Common error: "If I would have…" is wrong — use "If I HAD + past participle".',
        },
      ],
    },
    exercises: [
      { id: 'b2-3c-01', type: 'multiple-choice', prompt: 'If she ___ earlier, she ___ the train.', options: ['left / caught', 'had left / would have caught', 'leaves / would catch', 'left / would catch'], correctIndex: 1 },
      { id: 'b2-3c-02', type: 'fill-blank', prompt: 'Complete.', sentence: "If I ___ ___ (know), I would have told you.", answers: ['had', 'known'] },
      { id: 'b2-3c-03', type: 'multiple-choice', prompt: 'Which is INCORRECT?', options: ["If you had asked, I would have helped.", "If you asked, I would have helped.", "If you had asked, I would help.", "all are incorrect"], correctIndex: 1, explain: '3rd conditional needs HAD + pp in the if-clause.' },
      { id: 'b2-3c-04', type: 'fill-blank', prompt: 'Complete.', sentence: "We ___ ___ (win) if we had played better. (certain result)", answers: ['would have', 'won'] },
      { id: 'b2-3c-05', type: 'multiple-choice', prompt: '"If I had seen it, I might have bought it." What does MIGHT show?', options: ['Strong intention', "Something I'm forced to do", 'Uncertain possibility', 'A rule'], correctIndex: 2 },
      { id: 'b2-3c-06', type: 'fill-blank', prompt: 'Complete.', sentence: "He ___ ___ (come) if we had invited him earlier. (possible result)", answers: ['could have', 'come'] },
      { id: 'b2-3c-07', type: 'multiple-choice', prompt: 'Which best describes the third conditional?', options: ['Possible future', 'Imagined present', 'Imagined past with imagined past result', 'Habit in the past'], correctIndex: 2 },
      { id: 'b2-3c-08', type: 'fill-blank', prompt: 'Complete.', sentence: "If they ___ (not / argue), they would still be friends.", answers: ["hadn't argued"] },
      { id: 'b2-3c-09', type: 'multiple-choice', prompt: 'Pick the CORRECT sentence.', options: ["If I would have known, I would have told you.", "If I had known, I would told you.", "If I had known, I would have told you.", "If I known, I would have told you."], correctIndex: 2 },
      { id: 'b2-3c-10', type: 'fill-blank', prompt: 'Complete.', sentence: "She ___ ___ the job if she had applied on time. (would / get)", answers: ['would have', 'got'], alts: [[], ['gotten']] },
    ],
  },

  {
    id: 'b2-causative-have',
    level: 'B2',
    skill: 'grammar',
    title: 'Causative Have / Get',
    description: 'I had my hair cut — getting someone else to do it for you.',
    icon: '💇',
    quickLesson: {
      summary: '"have / get + object + past participle" = someone else does something FOR you. Common in services.',
      sections: [
        {
          heading: 'Structure',
          body: 'have (or get) + THING + past participle. Focus is on the result on the thing, not the doer.',
          examples: [
            'I **had my hair cut** yesterday. (the hairdresser did it)',
            'We **\'re getting our car repaired** this week.',
            'She **had her photo taken** at the studio.',
          ],
        },
        {
          heading: 'When problems happen to us',
          body: 'Same structure can describe bad things that happened (not planned).',
          examples: [
            'He **had his bike stolen** last week.',
            'They **got their house broken into**.',
          ],
          tip: 'Spanish speakers often say "I cut my hair" — if a hairdresser did it, you need the causative.',
        },
      ],
    },
    exercises: [
      { id: 'b2-ch-01', type: 'multiple-choice', prompt: 'A hairdresser cut your hair yesterday. You say:', options: ["I cut my hair.", "I was cut my hair.", "I had my hair cut.", "I had cut my hair."], correctIndex: 2 },
      { id: 'b2-ch-02', type: 'fill-blank', prompt: 'Complete.', sentence: "We ___ the car ___ last week. (have / repair)", answers: ['had', 'repaired'] },
      { id: 'b2-ch-03', type: 'multiple-choice', prompt: '"She had her photo taken." Who took the photo?', options: ['She did', 'Someone else did (a photographer)', 'Nobody', 'A camera, automatically'], correctIndex: 1 },
      { id: 'b2-ch-04', type: 'fill-blank', prompt: 'Complete.', sentence: "They're ___ a new kitchen ___ next month. (get / install)", answers: ['getting', 'installed'] },
      { id: 'b2-ch-05', type: 'multiple-choice', prompt: 'Which sentence uses the causative CORRECTLY?', options: ["He had stolen his bike.", "He had his bike stolen.", "He was stolen his bike.", "He stole his bike."], correctIndex: 1 },
      { id: 'b2-ch-06', type: 'fill-blank', prompt: 'Complete.', sentence: "I need to ___ my suit ___. (have / clean)", answers: ['have', 'cleaned'] },
      { id: 'b2-ch-07', type: 'multiple-choice', prompt: 'Which form sounds MORE informal?', options: ['have + object + pp', 'get + object + pp', "both are equally formal", 'neither'], correctIndex: 1 },
      { id: 'b2-ch-08', type: 'fill-blank', prompt: 'Complete.', sentence: "She ___ her nails ___ every two weeks. (get / do)", answers: ['gets', 'done'] },
      { id: 'b2-ch-09', type: 'multiple-choice', prompt: '"I had my passport stolen" probably describes:', options: ["Something she planned and paid for", "A bad event that happened to her", "A medical procedure", "A job interview"], correctIndex: 1 },
      { id: 'b2-ch-10', type: 'fill-blank', prompt: 'Complete.', sentence: "We're going to ___ the house ___ next spring. (have / paint)", answers: ['have', 'painted'] },
    ],
  },

  {
    id: 'b2-wish-regret',
    level: 'B2',
    skill: 'grammar',
    title: 'Wish & If only',
    description: 'Hypothetical and regret — about present and past.',
    icon: '🌠',
    quickLesson: {
      summary: '"wish + past" for present unreal wishes; "wish + past perfect" for past regrets; "wish + would" to complain about others.',
      sections: [
        {
          heading: 'Present wish — wish + past',
          body: 'Use past simple to wish things were different NOW. "If only" works the same.',
          examples: [
            'I **wish I had** more time. (I don\'t)',
            'I **wish I could** speak French. (I can\'t)',
            '**If only** I **were** taller.',
          ],
        },
        {
          heading: 'Past regret — wish + past perfect',
          body: 'Use had + past participle to regret a past event.',
          examples: [
            'I **wish I had studied** medicine.',
            '**If only** she **hadn\'t said** that.',
          ],
        },
        {
          heading: 'Complaint — wish + would',
          body: '"wish + would + verb" to complain about something SOMEONE ELSE repeatedly does. Not usually "I wish I would".',
          examples: [
            'I **wish you would stop** interrupting me.',
            'I **wish it would stop** raining.',
          ],
          tip: 'After "wish", "I were" (not "I was") is the standard formal choice — like second conditional.',
        },
      ],
    },
    exercises: [
      { id: 'b2-wr-01', type: 'multiple-choice', prompt: 'I wish I ___ speak Chinese.', options: ['can', 'could', 'will', 'would'], correctIndex: 1 },
      { id: 'b2-wr-02', type: 'fill-blank', prompt: 'Past regret.', sentence: "I wish I ___ ___ (study) harder for the test.", answers: ['had', 'studied'] },
      { id: 'b2-wr-03', type: 'multiple-choice', prompt: 'Which sentence is PRESENT UNREAL?', options: ["I wish I had seen her.", "I wish I knew the answer.", "I wish it had rained.", "I wish they would come."], correctIndex: 1 },
      { id: 'b2-wr-04', type: 'fill-blank', prompt: 'Complete.', sentence: "I wish he ___ (stop) talking. He's been going on for an hour. (complaint)", answers: ['would stop'] },
      { id: 'b2-wr-05', type: 'multiple-choice', prompt: 'Pick the NATURAL sentence.', options: ["I wish I was taller.", "I wish I were taller.", "Both are acceptable, with 'were' being more formal.", "Neither works."], correctIndex: 2 },
      { id: 'b2-wr-06', type: 'fill-blank', prompt: 'Complete.', sentence: "If only I ___ ___ (know) sooner. (regret about the past)", answers: ['had', 'known'] },
      { id: 'b2-wr-07', type: 'multiple-choice', prompt: '"I wish I would be more organized." What is WRONG?', options: ["Nothing", "'I wish I would' is rarely used; try 'I wish I were more organized.'", "It should be 'wished'", "It should be 'wish I will'"], correctIndex: 1 },
      { id: 'b2-wr-08', type: 'fill-blank', prompt: 'Complete.', sentence: "I wish they ___ (not / argue) so much.", answers: ["didn't argue"], alts: [["wouldn't argue"]] },
      { id: 'b2-wr-09', type: 'multiple-choice', prompt: "'If only she had been more honest.' What does it mean?", options: ["She is honest", "The speaker regrets she wasn't honest in the past", "She will be honest", "She should be honest in the future"], correctIndex: 1 },
      { id: 'b2-wr-10', type: 'fill-blank', prompt: 'Complete.', sentence: "I wish it ___ (stop) raining — I'm soaked.", answers: ['would stop'] },
    ],
  },

  // ╔══════════════════════ B2+ ═════════════════════╗

  {
    id: 'b2plus-cleft-sentences',
    level: 'B2+',
    skill: 'grammar',
    title: 'Cleft Sentences',
    description: 'It-cleft and What-cleft — grammatical emphasis.',
    icon: '✂️',
    quickLesson: {
      summary: 'Split a sentence into two parts to EMPHASISE one piece. Two main patterns: "It was X who/that…" and "What X did was…".',
      sections: [
        {
          heading: 'It-cleft',
          body: '"It + be + emphasised part + who/that + rest". Great for correcting information or spotlighting who / when / where.',
          examples: [
            '**It was** the manager **who** approved it.',
            '**It was** yesterday **that** she called.',
            '**It is** in Paris **that** they met.',
          ],
        },
        {
          heading: 'What-cleft',
          body: '"What + subject + do/did/is + be + emphasised part". Puts the spotlight on the ACTION or OBJECT.',
          examples: [
            '**What** she wanted **was** a simple apology.',
            '**What** I need **is** more time.',
            '**What** he did **was** change the whole plan.',
          ],
          tip: 'Clefts are great in writing. Overusing them in speech sounds theatrical.',
        },
      ],
    },
    exercises: [
      { id: 'b2p-cs-01', type: 'multiple-choice', prompt: '"The manager approved it." Emphasise WHO approved it:', options: ['The manager it was approved it.', 'It was the manager who approved it.', 'The manager was approved it.', 'Approve it was the manager.'], correctIndex: 1 },
      { id: 'b2p-cs-02', type: 'fill-blank', prompt: 'Complete.', sentence: "___ I need ___ more sleep.", answers: ['What', 'is'] },
      { id: 'b2p-cs-03', type: 'multiple-choice', prompt: 'Which is a valid WHAT-cleft?', options: ["What she decided was to resign.", "What she decided resign.", "What was she decided to resign.", "That she decided was to resign."], correctIndex: 0 },
      { id: 'b2p-cs-04', type: 'fill-blank', prompt: 'Complete.', sentence: "It was ___ Paris ___ they met for the first time.", answers: ['in', 'that'] },
      { id: 'b2p-cs-05', type: 'multiple-choice', prompt: 'When should you use cleft sentences?', options: ["Never — they are always wrong", "To add emphasis to a specific part", "Only in questions", "Only in the past tense"], correctIndex: 1 },
      { id: 'b2p-cs-06', type: 'fill-blank', prompt: 'Complete (it-cleft).', sentence: "It ___ my brother ___ broke the window, not me.", answers: ['was', 'who'] },
      { id: 'b2p-cs-07', type: 'multiple-choice', prompt: 'Which sentence focuses on the OBJECT?', options: ['It was the car that she bought.', 'She bought the car.', 'The car was bought.', 'The car was she bought.'], correctIndex: 0 },
      { id: 'b2p-cs-08', type: 'fill-blank', prompt: 'Complete.', sentence: "What ___ really matters ___ honesty.", answers: ['really', 'is'], alts: [[''], ['is']] },
      { id: 'b2p-cs-09', type: 'multiple-choice', prompt: 'Cleft version of "I need more time":', options: ["I more time need.", "What I need is more time.", "It is more time I need.", "Both b and c."], correctIndex: 3 },
      { id: 'b2p-cs-10', type: 'fill-blank', prompt: 'Complete.', sentence: "It was ___ our trip to Chile ___ changed everything.", answers: ['on', 'that'] },
    ],
  },

  {
    id: 'b2plus-participle-clauses',
    level: 'B2+',
    skill: 'grammar',
    title: 'Participle Clauses',
    description: 'Walking home, I saw… — compress two clauses into one.',
    icon: '📝',
    quickLesson: {
      summary: 'Reduce two clauses to one by turning the first verb into a participle. Makes writing tighter and more elegant.',
      sections: [
        {
          heading: '-ing participle (active)',
          body: 'When the subject of both clauses is the same, drop the subject and conjugate the first verb as -ing.',
          examples: [
            'While I was walking home, I saw her. → **Walking home**, I saw her.',
            'Because she felt tired, she went to bed. → **Feeling tired**, she went to bed.',
          ],
        },
        {
          heading: '-ed participle (passive)',
          body: 'When the first clause is passive, use the past participle.',
          examples: [
            'When he was asked about it, he smiled. → **Asked** about it, he smiled.',
            'The book, (which was) written in 1920, is still popular. → The book, **written in 1920**, is still popular.',
          ],
          tip: 'Keep the subject of both clauses the same, or the participle sounds dangling: "Walking home, the rain started" ✗ (rain wasn\'t walking!).',
        },
      ],
    },
    exercises: [
      { id: 'b2p-pc-01', type: 'multiple-choice', prompt: 'Reduce: "While she was reading the newspaper, she drank her coffee."', options: ['Reading the newspaper, she drank her coffee.', 'Read the newspaper, she drank her coffee.', 'Reading the newspaper, drank she her coffee.', "While reading the newspaper drank coffee."], correctIndex: 0 },
      { id: 'b2p-pc-02', type: 'fill-blank', prompt: 'Complete.', sentence: "___ finished the work, she went home. (participle of 'having' for anterior action)", answers: ['Having'] },
      { id: 'b2p-pc-03', type: 'multiple-choice', prompt: 'Which sentence has a DANGLING participle?', options: ['Walking home, I saw her.', 'Walking home, the rain started.', 'Having arrived early, I grabbed a coffee.', 'Feeling tired, she went to bed.'], correctIndex: 1 },
      { id: 'b2p-pc-04', type: 'fill-blank', prompt: 'Reduce. "The book, which was written in 1920, is a classic."', sentence: 'The book, ___ in 1920, is a classic.', answers: ['written'] },
      { id: 'b2p-pc-05', type: 'multiple-choice', prompt: 'Which participle form matches a passive meaning?', options: ['-ing', '-ed / past participle', 'being', 'to-infinitive'], correctIndex: 1 },
      { id: 'b2p-pc-06', type: 'fill-blank', prompt: 'Complete.', sentence: "___ about the delay, the customers complained. (past participle of 'inform')", answers: ['Informed'] },
      { id: 'b2p-pc-07', type: 'multiple-choice', prompt: 'Reduce: "When I was asked about it, I lied."', options: ['Asked about it, I lied.', 'Asking about it, I lied.', 'When being asked, I lied.', 'Having been asked, I had lied.'], correctIndex: 0 },
      { id: 'b2p-pc-08', type: 'fill-blank', prompt: 'Complete.', sentence: "___ (live) in Lima for a decade, she speaks Spanish fluently.", answers: ['Having lived'] },
      { id: 'b2p-pc-09', type: 'multiple-choice', prompt: 'Participle clauses are MOST useful because they…', options: ['make writing more academic', 'compress two clauses into one', 'avoid repeating the subject', 'all of the above'], correctIndex: 3 },
      { id: 'b2p-pc-10', type: 'fill-blank', prompt: 'Complete.', sentence: "___ (discover) the truth, he decided to speak up.", answers: ['Having discovered'] },
    ],
  },

  // ╔══════════════════════ C1 ══════════════════════╗

  {
    id: 'c1-mandative-subjunctive',
    level: 'C1',
    skill: 'grammar',
    title: 'Mandative Subjunctive',
    description: '"I insist that he be present." — after verbs of demand/suggestion.',
    icon: '📜',
    quickLesson: {
      summary: 'After verbs like insist, demand, suggest, recommend, propose, request — the following verb is in the bare BASE form, regardless of tense or subject.',
      sections: [
        {
          heading: 'Why it looks strange',
          body: 'In modern English the subjunctive survives mainly after these mandative verbs. The verb stays in its base form: "that he BE present" (not "is"), "that she RESIGN" (not "resigns").',
          examples: [
            'The manager **insisted** that he **be** present.',
            'I **recommend** that she **take** the course.',
            'They **demanded** that the policy **be** reviewed.',
            'His lawyer **suggested** that he **not speak** to the press.',
          ],
        },
        {
          heading: 'Set expressions',
          body: 'Fixed subjunctive phrases: "God save the Queen", "Be that as it may", "Long live the king", "So be it".',
          tip: 'In less formal English you\'ll often hear "I insist that he IS present" or "…that he SHOULD be present" — both accepted. The bare base form is the mark of C1/formal register.',
        },
      ],
    },
    exercises: [
      { id: 'c1-ms-01', type: 'multiple-choice', prompt: 'The board insisted that she ___ present.', options: ['was', 'is', 'be', 'will be'], correctIndex: 2 },
      { id: 'c1-ms-02', type: 'fill-blank', prompt: 'Complete (subjunctive).', sentence: "The committee recommended that the proposal ___ (accept).", answers: ['be accepted'] },
      { id: 'c1-ms-03', type: 'multiple-choice', prompt: 'Which sentence uses the mandative subjunctive CORRECTLY?', options: ['I suggest that he comes tomorrow.', 'I suggest that he come tomorrow.', 'I suggest that he coming tomorrow.', 'I suggest he to come tomorrow.'], correctIndex: 1 },
      { id: 'c1-ms-04', type: 'fill-blank', prompt: 'Complete with the base form.', sentence: "The judge demanded that the defendant ___ (not / speak) out of turn.", answers: ['not speak'] },
      { id: 'c1-ms-05', type: 'multiple-choice', prompt: 'Which verb typically triggers the mandative subjunctive?', options: ['think', 'insist', 'see', 'know'], correctIndex: 1 },
      { id: 'c1-ms-06', type: 'fill-blank', prompt: 'Complete.', sentence: "I propose that the meeting ___ (postpone) until next week.", answers: ['be postponed'] },
      { id: 'c1-ms-07', type: 'multiple-choice', prompt: 'The fixed phrase "Be that as it may" is an example of:', options: ['the subjunctive', 'the imperative', 'the conditional', 'a reflexive'], correctIndex: 0 },
      { id: 'c1-ms-08', type: 'fill-blank', prompt: 'Complete.', sentence: "His doctor recommended that he ___ (not / drive) for a month.", answers: ['not drive'] },
      { id: 'c1-ms-09', type: 'multiple-choice', prompt: "A more INFORMAL alternative to the mandative subjunctive is:", options: ["should + base form", "the past simple", "the gerund", "the present perfect"], correctIndex: 0 },
      { id: 'c1-ms-10', type: 'fill-blank', prompt: 'Complete.', sentence: "We request that he ___ (be) given an opportunity to respond.", answers: ['be'] },
    ],
  },

  {
    id: 'c1-future-perfect-continuous',
    level: 'C1',
    skill: 'grammar',
    title: 'Future Perfect · aspect nuance',
    description: 'By 2030 I will have been living here for 10 years.',
    icon: '🔭',
    quickLesson: {
      summary: '"will have + past participle" for an action FINISHED before a future point. "will have been + -ing" for a DURATION leading up to it.',
      sections: [
        {
          heading: 'Future perfect simple',
          body: 'Use when something will be completed before a specific point in the future.',
          examples: [
            'By 2030, we **will have launched** three products.',
            'By the time you arrive, I **will have finished** the report.',
            'She **won\'t have heard** the news yet.',
          ],
        },
        {
          heading: 'Future perfect continuous',
          body: 'Use for DURATION up to the future point. Common with "for" + time period.',
          examples: [
            'By next summer, I **will have been living** here for ten years.',
            'By midnight, he **will have been driving** for sixteen hours.',
            'By August, they **will have been dating** for exactly one year.',
          ],
          tip: 'Common signals: "by next year / by the time / by 2030". If you don\'t have a future point, you probably don\'t need future perfect.',
        },
      ],
    },
    exercises: [
      { id: 'c1-fpc-01', type: 'multiple-choice', prompt: 'By next summer, I ___ here for ten years.', options: ['will live', 'will have lived', 'am living', 'had lived'], correctIndex: 1 },
      { id: 'c1-fpc-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'By the time we arrive, the film ___ ___ ___ (already / start).', answers: ['will', 'have', 'started'] },
      { id: 'c1-fpc-03', type: 'multiple-choice', prompt: 'Which signal fits best with future perfect?', options: ['right now', 'yesterday', 'by 2030', 'while'], correctIndex: 2 },
      { id: 'c1-fpc-04', type: 'fill-blank', prompt: 'Complete (future perfect continuous).', sentence: "By midnight, she ___ ___ ___ (study) for six straight hours.", answers: ['will', 'have been', 'studying'] },
      { id: 'c1-fpc-05', type: 'multiple-choice', prompt: 'Which emphasises DURATION up to a future moment?', options: ['Future perfect simple', 'Future perfect continuous', 'Simple future', 'Present perfect'], correctIndex: 1 },
      { id: 'c1-fpc-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'By the time he turns 40, he ___ ___ ___ (publish) four books.', answers: ['will', 'have', 'published'] },
      { id: 'c1-fpc-07', type: 'multiple-choice', prompt: 'Pick the natural sentence.', options: ["By 2040, I will live here for 20 years.", "By 2040, I will have lived here for 20 years.", "By 2040, I have lived here for 20 years.", "By 2040, I was living here for 20 years."], correctIndex: 1 },
      { id: 'c1-fpc-08', type: 'fill-blank', prompt: 'Complete.', sentence: "By May, they ___ ___ (be) together for five years.", answers: ['will', 'have been'] },
      { id: 'c1-fpc-09', type: 'multiple-choice', prompt: '"She won\'t have finished by then" means:', options: ["She stopped before then.", "She finishes right then.", "She still won't be done by that future moment.", "She finished long before then."], correctIndex: 2 },
      { id: 'c1-fpc-10', type: 'fill-blank', prompt: 'Complete.', sentence: "By the time you read this, I ___ ___ ___ (leave) the country.", answers: ['will', 'have', 'left'] },
    ],
  },

];
