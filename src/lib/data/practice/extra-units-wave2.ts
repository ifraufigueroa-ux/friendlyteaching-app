// FriendlyTeaching.cl — Daily Practice: extra units, wave 2
//
// Second batch toward full CEFR grammar coverage. Same shape as
// wave 1: PracticeUnit with inline quickLesson, 10 exercises each,
// targeting the grammar topic in the title. Appended to the main
// PRACTICE_UNITS export via general-english.ts.

import type { PracticeUnit } from '@/types/practice';

export const EXTRA_UNITS_WAVE_2: PracticeUnit[] = [

  // ╔══════════════════════ A0 ══════════════════════╗

  {
    id: 'a0-there-is-there-are',
    level: 'A0',
    skill: 'grammar',
    title: 'There is / There are',
    description: 'Say what exists in a place.',
    icon: '📍',
    quickLesson: {
      summary: '"There is" for one thing (singular / uncountable); "there are" for more than one. Negative: there isn\'t / there aren\'t. Questions: Is there…? / Are there…?',
      sections: [
        {
          heading: 'Positive + negative',
          body: 'Use "there is" (there\'s) before a singular or uncountable noun. Use "there are" before plural nouns.',
          examples: [
            '**There is** a cat on the sofa.',
            '**There are** three cats on the sofa.',
            '**There\'s** some milk in the fridge.',
            '**There isn\'t** any milk.',
          ],
        },
        {
          heading: 'Questions',
          body: 'Put "is / are" first: "Is there a bank near here?" / "Are there any eggs?"',
          examples: [
            '**Is there** a problem?',
            '**Are there** any seats left?',
          ],
          tip: 'Don\'t confuse "there is" (existence) with "it is" (identification). "There is a book on the table" vs "It is a book".',
        },
      ],
    },
    exercises: [
      { id: 'a0-ta-01', type: 'multiple-choice', prompt: '___ two books on the table.', options: ['There is', 'There are', 'It is', 'They is'], correctIndex: 1 },
      { id: 'a0-ta-02', type: 'fill-blank', prompt: 'Complete.', sentence: '___ a cat under the bed.', answers: ['There is'], alts: [["There's"]] },
      { id: 'a0-ta-03', type: 'multiple-choice', prompt: '"How many eggs are in the fridge?" Pick the natural answer:', options: ['There are twelve eggs.', 'There is twelve eggs.', 'It has twelve eggs.', 'It is twelve eggs.'], correctIndex: 0 },
      { id: 'a0-ta-04', type: 'fill-blank', prompt: 'Question form.', sentence: '___ ___ any milk? (singular / uncountable)', answers: ['Is', 'there'] },
      { id: 'a0-ta-05', type: 'multiple-choice', prompt: 'Negative form of "There are some apples":', options: ["There aren't any apples.", "There isn't any apples.", "There haven't any apples.", "There not are apples."], correctIndex: 0 },
      { id: 'a0-ta-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'How many people ___ ___ in the room?', answers: ['are', 'there'] },
      { id: 'a0-ta-07', type: 'multiple-choice', prompt: 'Which is grammatical?', options: ['There is five chairs.', 'There are five chairs.', 'It is five chairs.', 'There five is chairs.'], correctIndex: 1 },
      { id: 'a0-ta-08', type: 'fill-blank', prompt: 'Complete with THERE IS / THERE ARE.', sentence: '___ no coffee in my cup.', answers: ["There's"], alts: [['There is']] },
      { id: 'a0-ta-09', type: 'multiple-choice', prompt: '"Is there a bank near here?" Pick the natural answer:', options: ['Yes, it is.', 'Yes, there is.', 'Yes, it does.', 'Yes, this is.'], correctIndex: 1 },
      { id: 'a0-ta-10', type: 'fill-blank', prompt: 'Complete.', sentence: '___ ___ any messages for me? (plural)', answers: ['Are', 'there'] },
    ],
  },

  {
    id: 'a0-prepositions-of-place',
    level: 'A0',
    skill: 'grammar',
    title: 'Prepositions of Place',
    description: 'in / on / under / next to / between…',
    icon: '🗺️',
    quickLesson: {
      summary: 'in = inside. on = on top of a surface. under = below. in front of / behind. next to = beside. between = in the middle of two.',
      sections: [
        {
          heading: 'Core six',
          body: 'Picture the object and ask where it is.',
          examples: [
            'The cat is **in** the box.',
            'The book is **on** the table.',
            'The ball is **under** the chair.',
            'Anna is **next to** me.',
            'The tree is **behind** the house.',
            'The shop is **between** the bank and the café.',
          ],
        },
      ],
    },
    exercises: [
      { id: 'a0-pp-01', type: 'multiple-choice', prompt: 'The ball is ___ the chair.', options: ['on', 'in', 'under', 'between'], correctIndex: 2 },
      { id: 'a0-pp-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'My phone is ___ my pocket.', answers: ['in'] },
      { id: 'a0-pp-03', type: 'multiple-choice', prompt: 'A bird is sitting ___ the roof.', options: ['on', 'in', 'under', 'next'], correctIndex: 0 },
      { id: 'a0-pp-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'The bank is ___ the café and the hotel.', answers: ['between'] },
      { id: 'a0-pp-05', type: 'match-pairs', prompt: 'Match each preposition with its meaning.', pairs: [
        { left: 'in',       right: 'inside' },
        { left: 'on',       right: 'on top of a surface' },
        { left: 'under',    right: 'below' },
        { left: 'next to',  right: 'beside' },
      ] },
      { id: 'a0-pp-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'Our house is ___ ___ ___ the school. (the house and the school are beside each other)', answers: ['next', 'to', ''], alts: [[], [], ['']] },
      { id: 'a0-pp-07', type: 'multiple-choice', prompt: 'The dog is ___ the sofa.', options: ['in (inside it)', 'on (on top of it)', 'between (middle)', 'depends on context'], correctIndex: 3 },
      { id: 'a0-pp-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'Please stand ___ of the line.', answers: ['in front'] },
      { id: 'a0-pp-09', type: 'multiple-choice', prompt: 'Which best fits "The picture is hanging ___ the wall"?', options: ['in', 'on', 'under', 'between'], correctIndex: 1 },
      { id: 'a0-pp-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'Who is sitting ___ ___ you? (immediately beside)', answers: ['next', 'to'] },
    ],
  },

  {
    id: 'a0-like-to-vs-like-ing',
    level: 'A0',
    skill: 'grammar',
    title: 'Like + to vs Like + -ing',
    description: 'Both work. Here is the subtle difference.',
    icon: '💗',
    quickLesson: {
      summary: '"I like reading" and "I like to read" are both correct. -ing emphasises the ENJOYMENT; to + verb emphasises the HABIT or CHOICE. Hate, love, prefer behave the same.',
      sections: [
        {
          heading: 'Both work',
          body: 'With like, love, hate, enjoy, prefer — most of the time both patterns are interchangeable in meaning.',
          examples: [
            'I **love reading**. / I **love to read**.',
            'She **hates waiting**. / She **hates to wait**.',
          ],
        },
        {
          heading: 'Subtle nuance',
          body: 'Native speakers tend to use -ing when they mean "I enjoy this activity in general" and the infinitive when they mean "I choose this as a habit" or in formal contexts.',
          tip: 'After "would like", only the infinitive works: "I would like to study more", NOT "I would like studying".',
        },
      ],
    },
    exercises: [
      { id: 'a0-l-01', type: 'multiple-choice', prompt: 'Which is NATURAL?', options: ['I like swim.', 'I like to swim.', 'I like swims.', 'I like swam.'], correctIndex: 1 },
      { id: 'a0-l-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'She loves ___ (read) novels in the evening.', answers: ['reading'], alts: [['to read']] },
      { id: 'a0-l-03', type: 'multiple-choice', prompt: '"I would like ___ a coffee, please." Pick the natural one.', options: ['have', 'having', 'to have', 'had'], correctIndex: 2 },
      { id: 'a0-l-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'They hate ___ (wait) in queues.', answers: ['waiting'], alts: [['to wait']] },
      { id: 'a0-l-05', type: 'multiple-choice', prompt: '"I like dancing" vs "I like to dance". Which statement is TRUE?', options: ['Both mean the same in most cases.', '"Dancing" means past.', '"To dance" means future.', 'Only one of them is grammatical.'], correctIndex: 0 },
      { id: 'a0-l-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'My dad enjoys ___ (cook) on weekends.', answers: ['cooking'], explain: '"enjoy" prefers the -ing form specifically.' },
      { id: 'a0-l-07', type: 'multiple-choice', prompt: '"I would love ___ you tomorrow." Pick the natural one.', options: ['see', 'seeing', 'to see', 'to seeing'], correctIndex: 2 },
      { id: 'a0-l-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'We don\'t like ___ (get) up early.', answers: ['getting'], alts: [['to get']] },
      { id: 'a0-l-09', type: 'multiple-choice', prompt: 'After "enjoy" we use…', options: ['infinitive only', '-ing only', 'both', 'past tense'], correctIndex: 1 },
      { id: 'a0-l-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'I would like ___ (travel) more in the future.', answers: ['to travel'] },
    ],
  },

  // ╔══════════════════════ A1 ══════════════════════╗

  {
    id: 'a1-question-words',
    level: 'A1',
    skill: 'grammar',
    title: 'Question Words',
    description: 'What, Where, When, Who, Why, How, How much, How many.',
    icon: '❓',
    quickLesson: {
      summary: 'Each wh-word asks about a different piece of information. The question itself still needs a helping verb (do/does/is/are…) to form.',
      sections: [
        {
          heading: 'Main ones',
          body: 'What (thing / action) · Where (place) · When (time) · Who (person) · Why (reason) · Which (choice) · Whose (owner).',
          examples: [
            '**What** do you want?',
            '**Where** do you live?',
            '**When** does the class start?',
            '**Who** is that girl?',
          ],
        },
        {
          heading: 'How + quantifier',
          body: 'How = in what way / to what extent. Common combinations: how much (uncountable), how many (countable), how old, how often.',
          examples: [
            '**How much** sugar do you take?',
            '**How many** brothers do you have?',
            '**How old** are you?',
            '**How often** do you exercise?',
          ],
          tip: 'Subject vs object questions: "Who called you?" (asking for the subject → no do-support) vs "Who did you call?" (asking for the object → needs did).',
        },
      ],
    },
    exercises: [
      { id: 'a1-qw-01', type: 'multiple-choice', prompt: '___ sugar do you take?', options: ['How much', 'How many', 'What', 'Where'], correctIndex: 0 },
      { id: 'a1-qw-02', type: 'fill-blank', prompt: 'Complete.', sentence: '___ ___ are you? — I\'m 23.', answers: ['How', 'old'] },
      { id: 'a1-qw-03', type: 'multiple-choice', prompt: '___ bag is this?', options: ['Who', "Who's", 'Whose', 'Whom'], correctIndex: 2 },
      { id: 'a1-qw-04', type: 'fill-blank', prompt: 'Complete.', sentence: '___ do you live?', answers: ['Where'] },
      { id: 'a1-qw-05', type: 'multiple-choice', prompt: '___ does the film start?', options: ['Who', 'Where', 'When', 'Why'], correctIndex: 2 },
      { id: 'a1-qw-06', type: 'fill-blank', prompt: 'Complete.', sentence: '___ ___ brothers do you have? (countable)', answers: ['How', 'many'] },
      { id: 'a1-qw-07', type: 'multiple-choice', prompt: '"___ is your favourite colour?" Pick the right word.', options: ['Why', 'When', 'What', 'Who'], correctIndex: 2 },
      { id: 'a1-qw-08', type: 'fill-blank', prompt: 'Complete.', sentence: '___ are you late? — Because the traffic is bad.', answers: ['Why'] },
      { id: 'a1-qw-09', type: 'multiple-choice', prompt: '"___ one do you prefer, the red or the blue?"', options: ['What', 'Which', 'How', 'Who'], correctIndex: 1 },
      { id: 'a1-qw-10', type: 'fill-blank', prompt: 'Complete.', sentence: '___ ___ do you go to the gym? — Twice a week.', answers: ['How', 'often'] },
    ],
  },

  {
    id: 'a1-prepositions-of-time',
    level: 'A1',
    skill: 'grammar',
    title: 'Prepositions of Time',
    description: 'in / on / at — choose by granularity.',
    icon: '⏱️',
    quickLesson: {
      summary: '"at" for clock times and specific moments. "on" for days and dates. "in" for months, years, seasons, parts of the day.',
      sections: [
        {
          heading: 'at · on · in',
          body: 'From most precise to most general: at = point in time. on = full day. in = longer period.',
          examples: [
            '**at** 9 am · **at** noon · **at** midnight · **at** the weekend (UK)',
            '**on** Monday · **on** 5 July · **on** my birthday',
            '**in** 2026 · **in** July · **in** winter · **in** the morning',
          ],
        },
        {
          heading: 'Fixed expressions',
          body: '"at night" (not "in night"), "on weekends" (US), "at the weekend" (UK), "in the morning / afternoon / evening" but "at night".',
          tip: 'If you can replace the time with an exact clock reading, it\'s "at".',
        },
      ],
    },
    exercises: [
      { id: 'a1-pt-01', type: 'multiple-choice', prompt: 'The class starts ___ 10 am.', options: ['in', 'on', 'at', 'by'], correctIndex: 2 },
      { id: 'a1-pt-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'My birthday is ___ June.', answers: ['in'] },
      { id: 'a1-pt-03', type: 'multiple-choice', prompt: 'We meet ___ Mondays.', options: ['in', 'on', 'at', 'by'], correctIndex: 1 },
      { id: 'a1-pt-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'I usually study ___ the evening.', answers: ['in'] },
      { id: 'a1-pt-05', type: 'multiple-choice', prompt: '___ night, the city is quiet.', options: ['At', 'In', 'On', 'For'], correctIndex: 0 },
      { id: 'a1-pt-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'Our anniversary is ___ 14 February.', answers: ['on'] },
      { id: 'a1-pt-07', type: 'multiple-choice', prompt: 'He was born ___ 1998.', options: ['on', 'in', 'at', 'by'], correctIndex: 1 },
      { id: 'a1-pt-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'Let\'s have lunch ___ noon.', answers: ['at'] },
      { id: 'a1-pt-09', type: 'multiple-choice', prompt: '"We travel ___ summer." Pick:', options: ['in', 'on', 'at', 'by'], correctIndex: 0 },
      { id: 'a1-pt-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'The party is ___ Saturday ___ 8 pm.', answers: ['on', 'at'] },
    ],
  },

  {
    id: 'a1-going-to-future',
    level: 'A1',
    skill: 'grammar',
    title: '"be going to" Future',
    description: 'Plans and predictions based on evidence.',
    icon: '➡️',
    quickLesson: {
      summary: '"be going to + verb" = plan already decided, OR prediction based on present evidence. Different from "will" (spontaneous decisions).',
      sections: [
        {
          heading: 'Planned future',
          body: 'I decided before speaking. "I\'m going to study tonight" = I already planned it.',
          examples: [
            'I **\'m going to visit** my grandma on Sunday.',
            'She **\'s going to start** a new job next month.',
            'They **aren\'t going to come** to the party.',
          ],
        },
        {
          heading: 'Prediction from evidence',
          body: 'Something you can see / hear / feel right now tells you what will happen.',
          examples: [
            'Look at those clouds — it **\'s going to rain**.',
            'Watch out! That glass **is going to fall**!',
          ],
          tip: '"Will" = spontaneous decision at the moment of speaking. "Going to" = pre-planned.',
        },
      ],
    },
    exercises: [
      { id: 'a1-gt-01', type: 'multiple-choice', prompt: 'Look at those clouds — it ___ rain.', options: ['is going to', 'will', 'goes to', 'is go to'], correctIndex: 0 },
      { id: 'a1-gt-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'I ___ ___ ___ (visit) my aunt tomorrow — we already agreed.', answers: ['am', 'going to', 'visit'] },
      { id: 'a1-gt-03', type: 'multiple-choice', prompt: 'Which is correct?', options: ["She going to call me.", "She is go to call me.", "She is going to call me.", "She is going call me."], correctIndex: 2 },
      { id: 'a1-gt-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'They ___ ___ (not / come) to our wedding.', answers: ["aren't going to", 'come'], alts: [['are not going to'], []] },
      { id: 'a1-gt-05', type: 'multiple-choice', prompt: 'A friend asks "What\'s your plan for tonight?" You say:', options: ['I will study.', 'I\'m going to study.', 'I study.', 'I had studied.'], correctIndex: 1 },
      { id: 'a1-gt-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'Be careful! You ___ ___ ___ (fall).', answers: ['are', 'going to', 'fall'] },
      { id: 'a1-gt-07', type: 'multiple-choice', prompt: 'A spontaneous decision uses:', options: ['going to', 'will', 'past simple', 'present perfect'], correctIndex: 1 },
      { id: 'a1-gt-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'What ___ you ___ ___ (do) this summer?', answers: ['are', 'going to', 'do'] },
      { id: 'a1-gt-09', type: 'multiple-choice', prompt: 'Which signal fits BEST with "going to"?', options: ['never', 'once', 'in a week', 'yesterday'], correctIndex: 2 },
      { id: 'a1-gt-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'He ___ ___ (start) university next September.', answers: ['is going to', 'start'] },
    ],
  },

  // ╔══════════════════════ A2 ══════════════════════╗

  {
    id: 'a2-past-continuous',
    level: 'A2',
    skill: 'grammar',
    title: 'Past Continuous',
    description: 'was / were + -ing — actions in progress in the past.',
    icon: '⏱',
    quickLesson: {
      summary: '"was / were + -ing" describes something IN PROGRESS at a past moment. Often paired with past simple to show interruption.',
      sections: [
        {
          heading: 'Background vs interruption',
          body: 'Past continuous = the longer background action. Past simple = the shorter action that interrupts it.',
          examples: [
            'I **was reading** when the phone **rang**.',
            'They **were playing** football when it **started** raining.',
            'What **were** you **doing** at 8 last night?',
          ],
        },
        {
          heading: 'Two parallel past actions',
          body: 'Use past continuous twice when two things were happening at the same time.',
          examples: [
            'While I **was cooking**, my sister **was setting** the table.',
          ],
          tip: 'Stative verbs (know, love, believe) don\'t take continuous: "I was knowing" ✗ → "I knew".',
        },
      ],
    },
    exercises: [
      { id: 'a2-pc-01', type: 'multiple-choice', prompt: 'When you called, I ___ dinner.', options: ['cooked', 'was cooking', 'am cooking', 'had cooked'], correctIndex: 1 },
      { id: 'a2-pc-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'They ___ (play) football when it started to rain.', answers: ['were playing'] },
      { id: 'a2-pc-03', type: 'multiple-choice', prompt: 'Which sentence is NATURAL?', options: ['I was knowing him from school.', 'I knew him from school.', 'I was known him from school.', 'I knowing him from school.'], correctIndex: 1 },
      { id: 'a2-pc-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'While I ___ (study), my brother ___ (watch) TV.', answers: ['was studying', 'was watching'] },
      { id: 'a2-pc-05', type: 'multiple-choice', prompt: 'Past continuous of "run" (she):', options: ['was run', 'was running', 'ran', 'running'], correctIndex: 1 },
      { id: 'a2-pc-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'What ___ you ___ (do) at 9 pm last night?', answers: ['were', 'doing'] },
      { id: 'a2-pc-07', type: 'multiple-choice', prompt: 'Which pair correctly matches background + interruption?', options: ['past continuous + past continuous', 'past simple + past continuous', 'past continuous + past simple', 'past simple + past simple'], correctIndex: 2 },
      { id: 'a2-pc-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'The baby ___ (cry) all night long.', answers: ['was crying'] },
      { id: 'a2-pc-09', type: 'multiple-choice', prompt: 'Pick the correct sentence.', options: ['She was watching TV when the lights went out.', 'She watched TV when the lights were going out.', 'She watching TV when the lights went out.', 'She was watching TV when the lights were going out.'], correctIndex: 0 },
      { id: 'a2-pc-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'At midday yesterday, we ___ (have) lunch.', answers: ['were having'] },
    ],
  },

  {
    id: 'a2-will-vs-going-to',
    level: 'A2',
    skill: 'grammar',
    title: 'Will vs Going to',
    description: 'Spontaneous decisions, promises, planned future.',
    icon: '🤷',
    quickLesson: {
      summary: '"will" for decisions made RIGHT NOW, offers, promises, and neutral predictions. "going to" for plans already made and predictions based on EVIDENCE.',
      sections: [
        {
          heading: 'will',
          body: 'Decisions you make AS you speak. Offers, promises, and future facts/predictions you have no special evidence for.',
          examples: [
            'The phone is ringing. I **\'ll answer** it.',
            '**Don\'t worry**, I **\'ll help** you.',
            'She **will probably win** the match.',
          ],
        },
        {
          heading: 'going to',
          body: 'Plans already decided before now, or predictions from what you can see.',
          examples: [
            'We **\'re going to visit** Lima next month.',
            'Look! That boy **\'s going to fall**!',
          ],
          tip: 'Both can be used for predictions, but "going to" feels more grounded in current evidence.',
        },
      ],
    },
    exercises: [
      { id: 'a2-wg-01', type: 'multiple-choice', prompt: 'A: The phone is ringing. B: I ___ answer it.', options: ['am going to', 'will', 'am going', 'would'], correctIndex: 1 },
      { id: 'a2-wg-02', type: 'fill-blank', prompt: 'Planned future.', sentence: "We ___ ___ ___ to the beach on Saturday — tickets are booked. (go)", answers: ['are', 'going to', 'go'] },
      { id: 'a2-wg-03', type: 'multiple-choice', prompt: 'Look at those clouds. It ___ rain.', options: ['will', 'is going to', 'rains', 'rained'], correctIndex: 1, explain: 'Evidence (clouds) → going to.' },
      { id: 'a2-wg-04', type: 'fill-blank', prompt: 'Offer.', sentence: "You look cold. I ___ (close) the window.", answers: ["'ll close"], alts: [['will close']] },
      { id: 'a2-wg-05', type: 'multiple-choice', prompt: '"I\'m going to study medicine." The speaker means:', options: ["A spontaneous decision made now.", "A plan already made.", "A guess with no evidence.", "A regret."], correctIndex: 1 },
      { id: 'a2-wg-06', type: 'fill-blank', prompt: 'Complete.', sentence: "Don't worry, I ___ (not / tell) anyone.", answers: ["won't tell"], alts: [['will not tell']] },
      { id: 'a2-wg-07', type: 'multiple-choice', prompt: 'Which situation calls for WILL?', options: ['I decided this morning to buy a new car.', 'Looking at the sky, I say it will rain.', 'Someone asks what I want to drink — I decide right now.', 'I have evidence someone is about to fall.'], correctIndex: 2 },
      { id: 'a2-wg-08', type: 'fill-blank', prompt: 'Complete.', sentence: "That bag is heavy. I ___ (carry) it for you.", answers: ["'ll carry"] },
      { id: 'a2-wg-09', type: 'multiple-choice', prompt: '"We\'re going to have a baby!" Pick the correct nuance.', options: ["Plan / announcement.", "Spontaneous decision.", "Regret.", "Possibility."], correctIndex: 0 },
      { id: 'a2-wg-10', type: 'fill-blank', prompt: 'Complete.', sentence: "I don't know which one to choose. I ___ (think) about it tonight.", answers: ["'ll think"] },
    ],
  },

  {
    id: 'a2-too-enough',
    level: 'A2',
    skill: 'grammar',
    title: 'Too & Enough',
    description: 'Too hot, hot enough, enough water.',
    icon: '🌡️',
    quickLesson: {
      summary: '"too + adjective" = more than desirable. "adjective + enough" = the right amount. "enough + noun" = sufficient quantity. Both often take "to + verb" or "for someone".',
      sections: [
        {
          heading: 'too + adj',
          body: 'Comes BEFORE the adjective. Negative connotation.',
          examples: [
            'This coffee is **too hot**.',
            'The music is **too loud for me**.',
            'He\'s **too tired to drive**.',
          ],
        },
        {
          heading: 'adjective + enough',
          body: 'Comes AFTER the adjective. Means "sufficiently".',
          examples: [
            'Is the water **warm enough**?',
            'She\'s **old enough to vote**.',
            'He\'s not **tall enough to be** a pilot.',
          ],
        },
        {
          heading: 'enough + noun',
          body: 'BEFORE a noun (any quantity). "enough money", "enough time", "enough chairs".',
          tip: 'Common Spanish-speaker error: "I am too tired for sleep" → should be "to sleep" (infinitive).',
        },
      ],
    },
    exercises: [
      { id: 'a2-te-01', type: 'multiple-choice', prompt: 'The soup is ___ to eat.', options: ['too hot', 'hot enough', 'too hot enough', 'enough hot'], correctIndex: 0 },
      { id: 'a2-te-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'She isn\'t ___ ___ to drive a car. (old)', answers: ['old', 'enough'] },
      { id: 'a2-te-03', type: 'multiple-choice', prompt: '"I don\'t have ___ money to buy it." Pick the natural phrase.', options: ['too', 'enough', 'much enough', 'many enough'], correctIndex: 1 },
      { id: 'a2-te-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'This dress is ___ ___ for me — I love it. (big — negative connotation)', answers: ['too', 'big'] },
      { id: 'a2-te-05', type: 'multiple-choice', prompt: 'Which sentence uses TOO + adjective CORRECTLY?', options: ['The music too loud.', 'The music is too loud.', 'The music enough is loud.', 'The music is loud too.'], correctIndex: 1 },
      { id: 'a2-te-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'I don\'t speak French ___ ___ to follow the movie.', answers: ['well', 'enough'] },
      { id: 'a2-te-07', type: 'multiple-choice', prompt: '"There are not enough chairs" means:', options: ['There are more chairs than we need.', "There are too many chairs.", "We need more chairs.", 'We have the exact number.'], correctIndex: 2 },
      { id: 'a2-te-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'He\'s ___ ___ to understand the joke. (young — negative)', answers: ['too', 'young'] },
      { id: 'a2-te-09', type: 'multiple-choice', prompt: 'Which word order is CORRECT?', options: ['enough hot', 'hot enough', 'too enough hot', 'enough too hot'], correctIndex: 1 },
      { id: 'a2-te-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'I\'m ___ ___ to finish the race today. (tired — negative)', answers: ['too', 'tired'] },
    ],
  },

  // ╔══════════════════════ B1 ══════════════════════╗

  {
    id: 'b1-relative-clauses-defining',
    level: 'B1',
    skill: 'grammar',
    title: 'Defining Relative Clauses',
    description: 'who / which / that / where — identify the noun.',
    icon: '🔗',
    quickLesson: {
      summary: 'A defining relative clause adds essential information to a noun. Use WHO for people, WHICH for things, THAT for both. WHERE for places.',
      sections: [
        {
          heading: 'Who / which / that',
          body: 'No comma before the clause when it defines who/what you\'re talking about.',
          examples: [
            'That\'s the woman **who** lives next door.',
            'This is the book **which** won the prize.',
            'That\'s the car **that** I want to buy.',
          ],
        },
        {
          heading: 'Where / whose',
          body: 'WHERE for places. WHOSE for possession.',
          examples: [
            'That\'s the hotel **where** we stayed.',
            'She\'s the artist **whose** work is in the museum.',
          ],
          tip: 'If the clause describes the OBJECT of the verb, you can drop "who / which / that": "The book (that) I read" — no pronoun needed.',
        },
      ],
    },
    exercises: [
      { id: 'b1-rcd-01', type: 'multiple-choice', prompt: "That's the woman ___ lives next door.", options: ['which', 'who', 'whose', 'where'], correctIndex: 1 },
      { id: 'b1-rcd-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'The hotel ___ we stayed was beautiful.', answers: ['where'] },
      { id: 'b1-rcd-03', type: 'multiple-choice', prompt: 'Which sentence is NATURAL?', options: ["I met a girl who speaks four languages.", "I met a girl which speaks four languages.", "I met a girl where speaks four languages.", "I met a girl whose speaks four languages."], correctIndex: 0 },
      { id: 'b1-rcd-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'That\'s the artist ___ paintings are in the exhibition.', answers: ['whose'] },
      { id: 'b1-rcd-05', type: 'multiple-choice', prompt: '"The car ___ I bought last week is red." Which is NOT acceptable here?', options: ['that', 'which', 'who', 'nothing (no relative pronoun)'], correctIndex: 2 },
      { id: 'b1-rcd-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'This is the restaurant ___ we had dinner last night.', answers: ['where'] },
      { id: 'b1-rcd-07', type: 'multiple-choice', prompt: 'When can we OMIT the relative pronoun?', options: ['Always.', 'Never.', 'When it is the object of the verb in the clause.', 'When it is the subject.'], correctIndex: 2 },
      { id: 'b1-rcd-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'That\'s the man ___ wallet I found.', answers: ['whose'] },
      { id: 'b1-rcd-09', type: 'multiple-choice', prompt: 'Pick the natural sentence.', options: ["The movie which I watched was boring.", "The movie I watched was boring.", "The movie that I watched was boring.", "All of the above."], correctIndex: 3 },
      { id: 'b1-rcd-10', type: 'fill-blank', prompt: 'Complete with a pronoun.', sentence: "The pen ___ is on the table is mine.", answers: ['that'], alts: [['which']] },
    ],
  },

  {
    id: 'b1-question-tags',
    level: 'B1',
    skill: 'grammar',
    title: 'Question Tags',
    description: "It's cold, isn't it? — the mirror rule.",
    icon: '🪞',
    quickLesson: {
      summary: 'A question tag mirrors the verb in the main sentence. Positive statement → negative tag, and vice versa.',
      sections: [
        {
          heading: 'The mirror rule',
          body: 'Use the same auxiliary (be / have / modal / do). If the statement is positive, the tag is negative — and vice versa.',
          examples: [
            'It\'s cold, **isn\'t it**?',
            'You don\'t smoke, **do you**?',
            'She can swim, **can\'t she**?',
            'They have arrived, **haven\'t they**?',
          ],
        },
        {
          heading: 'No auxiliary? Use "do"',
          body: 'If the main verb is in present or past simple with no modal/aux, use do/does/did in the tag.',
          examples: [
            'He likes coffee, **doesn\'t he**?',
            'You went to school, **didn\'t you**?',
          ],
          tip: 'Watch out: "I am…, aren\'t I?" (not "amn\'t I"). And after "Let\'s…" use "shall we?".',
        },
      ],
    },
    exercises: [
      { id: 'b1-qt-01', type: 'multiple-choice', prompt: "It's hot today, ___?", options: ["isn't it", "is it", "doesn't it", "won't it"], correctIndex: 0 },
      { id: 'b1-qt-02', type: 'fill-blank', prompt: 'Complete.', sentence: "You don't smoke, ___ ___?", answers: ['do', 'you'] },
      { id: 'b1-qt-03', type: 'multiple-choice', prompt: '"She can swim, ___?"', options: ["can she", "can't she", "doesn't she", "isn't she"], correctIndex: 1 },
      { id: 'b1-qt-04', type: 'fill-blank', prompt: 'Complete.', sentence: "They have finished, ___ ___?", answers: ["haven't", 'they'] },
      { id: 'b1-qt-05', type: 'multiple-choice', prompt: '"I am your friend, ___?"', options: ["amn't I", "aren't I", "aren't you", "isn't I"], correctIndex: 1 },
      { id: 'b1-qt-06', type: 'fill-blank', prompt: 'Complete.', sentence: "He likes coffee, ___ ___?", answers: ["doesn't", 'he'] },
      { id: 'b1-qt-07', type: 'multiple-choice', prompt: "Let's go to the beach, ___?", options: ["shall we", "will we", "won't we", "aren't we"], correctIndex: 0 },
      { id: 'b1-qt-08', type: 'fill-blank', prompt: 'Complete.', sentence: "You will come, ___ ___?", answers: ["won't", 'you'] },
      { id: 'b1-qt-09', type: 'multiple-choice', prompt: "The train leaves at 8, ___?", options: ["don't it", "doesn't it", "isn't it", "won't it"], correctIndex: 1 },
      { id: 'b1-qt-10', type: 'fill-blank', prompt: 'Complete.', sentence: "She went home early, ___ ___?", answers: ["didn't", 'she'] },
    ],
  },

  {
    id: 'b1-passive-voice-intro',
    level: 'B1',
    skill: 'grammar',
    title: 'Passive Voice · intro',
    description: 'be + past participle — focus on the action, not the doer.',
    icon: '🎯',
    quickLesson: {
      summary: '"be + past participle" shifts the focus from WHO does something to WHAT happens. Use it when the doer is unknown, obvious, or less important.',
      sections: [
        {
          heading: 'How to form it',
          body: 'Change "to be" to match the original tense, keep the past participle.',
          examples: [
            'They **build** houses. → Houses **are built**.',
            'Shakespeare **wrote** Hamlet. → Hamlet **was written** by Shakespeare.',
            'Someone **has stolen** my phone. → My phone **has been stolen**.',
          ],
        },
        {
          heading: 'When to prefer passive',
          body: 'Doer unknown, obvious, or less important than the action/result. Common in news and academic writing.',
          examples: [
            'The painting **was discovered** in 1950.',
            'The decision **will be announced** tomorrow.',
          ],
          tip: 'Only transitive verbs (that take an object) can be made passive. "She arrived" → no passive form.',
        },
      ],
    },
    exercises: [
      { id: 'b1-pv-01', type: 'multiple-choice', prompt: '"The painting ___ in 1890." (passive)', options: ['painted', 'was painted', 'is painted', 'has painted'], correctIndex: 1 },
      { id: 'b1-pv-02', type: 'fill-blank', prompt: 'Complete (present passive).', sentence: 'English ___ ___ (speak) in many countries.', answers: ['is', 'spoken'] },
      { id: 'b1-pv-03', type: 'multiple-choice', prompt: '"The letter ___ yesterday." (past passive)', options: ['was sent', 'sent', 'is sent', 'was send'], correctIndex: 0 },
      { id: 'b1-pv-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'The results ___ ___ (announce) next week.', answers: ['will be', 'announced'] },
      { id: 'b1-pv-05', type: 'multiple-choice', prompt: 'Passive of "Someone has stolen my phone":', options: ["My phone has stolen.", "My phone has been stolen.", "My phone was stealing.", "My phone was stolen by someone."], correctIndex: 1 },
      { id: 'b1-pv-06', type: 'fill-blank', prompt: 'Complete.', sentence: "These biscuits ___ ___ (make) by my grandmother.", answers: ['were', 'made'] },
      { id: 'b1-pv-07', type: 'multiple-choice', prompt: 'When should you AVOID the passive?', options: ["When the doer matters and you want them front and centre.", "In news articles.", "In academic writing.", "When the doer is unknown."], correctIndex: 0 },
      { id: 'b1-pv-08', type: 'fill-blank', prompt: 'Complete.', sentence: "Breakfast ___ ___ (serve) from 7 to 10.", answers: ['is', 'served'] },
      { id: 'b1-pv-09', type: 'multiple-choice', prompt: "Which cannot be made passive?", options: ["She broke the glass.", "They painted the house.", "He arrived at 9.", "They've built a new school."], correctIndex: 2, explain: '"Arrive" has no object → no passive form.' },
      { id: 'b1-pv-10', type: 'fill-blank', prompt: 'Complete.', sentence: "The window ___ ___ (break) last night.", answers: ['was', 'broken'] },
    ],
  },

  // ╔══════════════════════ B2 ══════════════════════╗

  {
    id: 'b2-mixed-conditionals',
    level: 'B2',
    skill: 'grammar',
    title: 'Mixed Conditionals',
    description: 'Past condition, present result (and vice versa).',
    icon: '🔀',
    quickLesson: {
      summary: 'A mixed conditional has its "if" clause in one time frame and its result clause in another. The two most useful mixes: past condition → present result, present condition → past result.',
      sections: [
        {
          heading: 'Past cause, present result',
          body: 'if + had + pp, would + base verb. "If I had studied medicine (past), I would be a doctor now (present)."',
          examples: [
            '**If I had studied** harder, I **would have** a better job today.',
            '**If she hadn\'t missed** the train, she **would be** here by now.',
          ],
        },
        {
          heading: 'Present state, past result',
          body: 'if + past simple, would have + pp. "If I were more organised (I\'m not), I wouldn\'t have forgotten (past)."',
          examples: [
            '**If I were** better at maths, I **would have passed** the exam.',
            '**If he weren\'t** so shy, he **would have made** more friends.',
          ],
          tip: 'Mixed conditionals express how a permanent fact (your personality, your past decisions) still shapes outcomes — very useful for reflection.',
        },
      ],
    },
    exercises: [
      { id: 'b2-mc-01', type: 'multiple-choice', prompt: 'If I ___ harder, I ___ a better job now.', options: ["studied / would have", "had studied / would have", "had studied / would have had", "would study / had"], correctIndex: 2 },
      { id: 'b2-mc-02', type: 'fill-blank', prompt: 'Complete.', sentence: "If she ___ ___ (not miss) the train, she would be here by now.", answers: ["hadn't", 'missed'], alts: [["had not"], []] },
      { id: 'b2-mc-03', type: 'multiple-choice', prompt: 'Which sentence is a MIXED conditional?', options: ["If I were rich, I would travel more.", "If I had studied French, I would be fluent now.", "If it rains, we will stay home.", "If I had the time, I would help."], correctIndex: 1 },
      { id: 'b2-mc-04', type: 'fill-blank', prompt: 'Complete.', sentence: "If I ___ taller (I'm not), I ___ ___ (have / play) basketball professionally.", answers: ['were', 'would have', 'played'] },
      { id: 'b2-mc-05', type: 'multiple-choice', prompt: 'What does "If I were more organised, I wouldn\'t have forgotten" tell us?', options: ["I am organised.", "I was organised in the past.", "I'm generally disorganised AND I forgot something in the past.", "I always forget."], correctIndex: 2 },
      { id: 'b2-mc-06', type: 'fill-blank', prompt: 'Complete.', sentence: "If we ___ ___ (not / argue) last night, we ___ (be) friends again by now.", answers: ["hadn't", 'argued', 'would be'] },
      { id: 'b2-mc-07', type: 'multiple-choice', prompt: 'Pick the CORRECT mixed conditional.', options: ["If I had bought the ticket, I would be at the concert now.", "If I bought the ticket, I would have been at the concert now.", "If I had bought the ticket, I had been at the concert now.", "If I would have bought the ticket, I would be at the concert now."], correctIndex: 0 },
      { id: 'b2-mc-08', type: 'fill-blank', prompt: 'Complete.', sentence: "If she ___ (be) more patient, she ___ ___ ___ (have / finish) the project.", answers: ['were', 'would', 'have', 'finished'] },
      { id: 'b2-mc-09', type: 'multiple-choice', prompt: 'A classic mistake in mixed conditionals is:', options: ["Using 'had + pp' in the if clause", "Using 'would + verb' in the result clause", "Using 'would have' in the if clause", "Using 'if' before the past"], correctIndex: 2 },
      { id: 'b2-mc-10', type: 'fill-blank', prompt: 'Complete.', sentence: "If I ___ ___ (go) to that university, I ___ ___ (have) the same friends I do today.", answers: ["hadn't", 'gone', "wouldn't", 'have'] },
    ],
  },

  {
    id: 'b2-reported-speech-advanced',
    level: 'B2',
    skill: 'grammar',
    title: 'Reported Speech · advanced',
    description: 'Questions, commands, and pronoun / time shifts.',
    icon: '🔁',
    quickLesson: {
      summary: 'Reporting what someone said: shift tenses back, swap pronouns, change time/place markers. Reporting questions keeps statement word order. Commands use "told X to do".',
      sections: [
        {
          heading: 'Reporting questions',
          body: 'Yes/no questions: use "if" or "whether". Wh-questions: keep the wh-word. In both cases, statement word order (no do-support).',
          examples: [
            '"Are you tired?" → She asked **if** I **was** tired.',
            '"Where do you live?" → He asked **where** I **lived**.',
            '"Will you come?" → She wanted to know **whether** I **would come**.',
          ],
        },
        {
          heading: 'Reporting commands & requests',
          body: '"told / asked + person + to + verb". Negative: "not to".',
          examples: [
            '"Sit down." → She **told me to sit down**.',
            '"Please help me." → She **asked me to help** her.',
            '"Don\'t touch that." → He **told me not to touch** it.',
          ],
          tip: 'Pronouns shift from the original speaker\'s point of view to the reporter\'s: "I love YOU" → She said she loved ME.',
        },
      ],
    },
    exercises: [
      { id: 'b2-rsa-01', type: 'multiple-choice', prompt: '"Where do you live?" → He asked ___.', options: ['where did I live', 'where I live', 'where I lived', 'where do I live'], correctIndex: 2 },
      { id: 'b2-rsa-02', type: 'fill-blank', prompt: 'Report the yes/no question.', sentence: '"Are you Spanish?" → She asked ___ I ___ Spanish.', answers: ['if', 'was'] },
      { id: 'b2-rsa-03', type: 'multiple-choice', prompt: '"Please close the door." → She asked me ___.', options: ['close the door', 'closing the door', 'to close the door', 'closed the door'], correctIndex: 2 },
      { id: 'b2-rsa-04', type: 'fill-blank', prompt: 'Report the command.', sentence: '"Don\'t touch that." → He told me ___ ___ touch it.', answers: ['not', 'to'] },
      { id: 'b2-rsa-05', type: 'multiple-choice', prompt: 'Which reported question is CORRECT?', options: ["She asked where did he go.", "She asked where he went.", "She asked where was he gone.", "She asked where he had went."], correctIndex: 1 },
      { id: 'b2-rsa-06', type: 'fill-blank', prompt: 'Report the sentence.', sentence: '"I will call you tomorrow." → He said he ___ ___ me ___ ___ ___.', answers: ['would', 'call', 'the', 'next', 'day'] },
      { id: 'b2-rsa-07', type: 'multiple-choice', prompt: '"Can you help me?" → She asked ___.', options: ["if I can help her", "if I could help her", "if could I help her", "if I will help her"], correctIndex: 1 },
      { id: 'b2-rsa-08', type: 'fill-blank', prompt: 'Report the command.', sentence: '"Be quiet!" → The teacher told us ___ ___ quiet.', answers: ['to', 'be'] },
      { id: 'b2-rsa-09', type: 'multiple-choice', prompt: 'When reporting, what happens to "tomorrow"?', options: ["Stays as 'tomorrow'", "Changes to 'the next day'", "Changes to 'today'", "Disappears"], correctIndex: 1 },
      { id: 'b2-rsa-10', type: 'fill-blank', prompt: 'Report.', sentence: '"How old are you?" → She asked me ___ ___ I ___.', answers: ['how', 'old', 'was'] },
    ],
  },

  {
    id: 'b2-unreal-past-as-if',
    level: 'B2',
    skill: 'grammar',
    title: 'Unreal Past · as if / as though',
    description: '"He acts as if he knew everything."',
    icon: '🎭',
    quickLesson: {
      summary: 'After "as if" / "as though", use the past simple to describe a present situation that isn\'t really true. Use past perfect for an unreal past.',
      sections: [
        {
          heading: 'Unreal present',
          body: 'The speaker knows the situation isn\'t true. Past simple after "as if / as though" → hypothetical present.',
          examples: [
            'He acts **as if he knew** everything (he doesn\'t).',
            'She talks **as though she were** in charge (she isn\'t).',
            'They treat me **as if I were** a child.',
          ],
        },
        {
          heading: 'Unreal past',
          body: 'For imagined past situations use past perfect after "as if / as though".',
          examples: [
            'He looked **as if he had seen** a ghost.',
            'She spoke **as though she had been** there.',
          ],
          tip: 'If the situation IS actually true, use the normal present/past — "as if" then just means "it seems that".',
        },
      ],
    },
    exercises: [
      { id: 'b2-ua-01', type: 'multiple-choice', prompt: 'He acts ___ ___ he knew everything.', options: ['as if', 'as though', 'both are correct', "neither"], correctIndex: 2 },
      { id: 'b2-ua-02', type: 'fill-blank', prompt: 'Complete (unreal present).', sentence: "She talks as if she ___ (be) the boss.", answers: ['were'], alts: [['was']] },
      { id: 'b2-ua-03', type: 'multiple-choice', prompt: 'Pick the natural sentence (unreal present).', options: ["He drives as if he owns the road.", "He drives as if he owned the road.", "He drives as if he owning the road.", "He drives as if he had owned the road."], correctIndex: 1 },
      { id: 'b2-ua-04', type: 'fill-blank', prompt: 'Complete (unreal past).', sentence: "She looked as though she ___ ___ (see) a ghost.", answers: ['had', 'seen'] },
      { id: 'b2-ua-05', type: 'multiple-choice', prompt: '"He looks as if he hasn\'t slept." The speaker thinks:', options: ["He slept well.", "He didn't actually sleep.", "He is rested.", "He is lying."], correctIndex: 1 },
      { id: 'b2-ua-06', type: 'fill-blank', prompt: 'Complete.', sentence: "They treat me as if I ___ ___ ___ (be / child).", answers: ['were', 'a', 'child'], alts: [['was'], [], []] },
      { id: 'b2-ua-07', type: 'multiple-choice', prompt: 'Which sentence describes an UNREAL past?', options: ["He acts as if he knows everything.", "He looked as if he had seen a ghost.", "She talks as if she were rich.", "They treat me as if I were a child."], correctIndex: 1 },
      { id: 'b2-ua-08', type: 'fill-blank', prompt: 'Complete.', sentence: "He spoke to me as though I ___ (be) his servant.", answers: ['were'] },
      { id: 'b2-ua-09', type: 'multiple-choice', prompt: '"It looks as if it is going to rain." What is the speaker saying?', options: ["Rain is impossible.", "Based on evidence, rain seems likely.", "It never rains here.", "They don't like rain."], correctIndex: 1 },
      { id: 'b2-ua-10', type: 'fill-blank', prompt: 'Complete.', sentence: "He described the place as if he ___ ___ there before.", answers: ['had', 'been'] },
    ],
  },

  // ╔══════════════════════ B2+ ═════════════════════╗

  {
    id: 'b2plus-nominalization',
    level: 'B2+',
    skill: 'grammar',
    title: 'Nominalization',
    description: '"The decision was made" instead of "They decided".',
    icon: '📰',
    quickLesson: {
      summary: 'Turning a verb or adjective into a noun to make writing more formal, concise, and impersonal. Fundamental for academic and news register.',
      sections: [
        {
          heading: 'Verb → noun',
          body: 'Replace an action verb with its noun form and reshape the sentence.',
          examples: [
            'They **decided** → the **decision** was made.',
            'Prices **rose sharply** → there was a **sharp rise** in prices.',
            'She **discovered** a new molecule → her **discovery** of a new molecule…',
          ],
        },
        {
          heading: 'Adjective → noun',
          body: 'Classic abstract-noun suffixes: -ness, -ity, -ence/-ance, -tion.',
          examples: [
            'The job is **difficult** → The **difficulty** of the job…',
            'Participants were **enthusiastic** → The **enthusiasm** of the participants…',
            'The city is **important** → The **importance** of the city…',
          ],
          tip: 'Over-nominalization makes writing heavy. Use it to COMPRESS multiple clauses, not to show off.',
        },
      ],
    },
    exercises: [
      { id: 'b2p-no-01', type: 'multiple-choice', prompt: 'Nominalise "They decided quickly."', options: ['The decision came quickly.', 'They decide quickly.', 'They are deciding quickly.', 'A quick decide was taken.'], correctIndex: 0 },
      { id: 'b2p-no-02', type: 'fill-blank', prompt: 'Turn the adjective into a noun.', sentence: "difficult → ___", answers: ['difficulty'] },
      { id: 'b2p-no-03', type: 'multiple-choice', prompt: 'Which sentence is MORE formal?', options: ["Prices rose sharply.", "There was a sharp rise in prices.", "Both equally formal.", "Neither is formal."], correctIndex: 1 },
      { id: 'b2p-no-04', type: 'fill-blank', prompt: 'Noun of "discover".', sentence: "She made an important ___ .", answers: ['discovery'] },
      { id: 'b2p-no-05', type: 'multiple-choice', prompt: '"The importance of early intervention" — what is nominalized?', options: ["the adverb", "the adjective 'important'", "the verb 'intervene'", "the noun 'intervention'"], correctIndex: 1 },
      { id: 'b2p-no-06', type: 'fill-blank', prompt: 'Noun of "enthusiastic".', sentence: "Her ___ for the project was clear.", answers: ['enthusiasm'] },
      { id: 'b2p-no-07', type: 'multiple-choice', prompt: 'Nominalization is MOST useful when you want to:', options: ["make writing more casual", "describe a dialogue", "compress multiple clauses into one phrase", "add emotion"], correctIndex: 2 },
      { id: 'b2p-no-08', type: 'fill-blank', prompt: 'Noun of "intervene".', sentence: "Early medical ___ saved his life.", answers: ['intervention'] },
      { id: 'b2p-no-09', type: 'multiple-choice', prompt: 'Which pair is CORRECT?', options: ["consider → consideration", "arrive → arrivement", "happy → happiness", "both a and c"], correctIndex: 3 },
      { id: 'b2p-no-10', type: 'fill-blank', prompt: 'Noun of "fail".', sentence: "The ___ of the system to boot is a known bug.", answers: ['failure'] },
    ],
  },

  {
    id: 'b2plus-passive-reporting',
    level: 'B2+',
    skill: 'grammar',
    title: 'Passive Reporting Structures',
    description: '"It is said that…" and "He is said to…"',
    icon: '📢',
    quickLesson: {
      summary: 'Two passive structures for reporting beliefs, rumours and opinions: "It is said/believed/thought that + clause" and "Subject + is said/believed to + verb".',
      sections: [
        {
          heading: 'It + be + pp + that…',
          body: 'Classic news opener. Introduces a general belief without naming the source.',
          examples: [
            '**It is said that** the CEO will resign.',
            '**It is believed that** the painting is genuine.',
            '**It was reported that** the fire was contained.',
          ],
        },
        {
          heading: 'Subject + is said to + verb',
          body: 'More elegant: brings the subject to the front. Use a perfect infinitive ("to have + pp") for a past reference.',
          examples: [
            'The CEO **is said to be** considering a new role.',
            'The painting **is believed to be** worth millions.',
            'The suspect **is thought to have left** the country.',
          ],
          tip: 'Very common in news and academic writing because it stays neutral about who holds the belief.',
        },
      ],
    },
    exercises: [
      { id: 'b2p-pr-01', type: 'multiple-choice', prompt: '"It ___ that the CEO will resign."', options: ['is believed', 'believes', 'is believing', 'has believed'], correctIndex: 0 },
      { id: 'b2p-pr-02', type: 'fill-blank', prompt: 'Complete.', sentence: "The CEO ___ ___ to be considering a new role.", answers: ['is', 'said'] },
      { id: 'b2p-pr-03', type: 'multiple-choice', prompt: '"The painting ___ to be worth millions."', options: ['is believed', 'believes', 'is believing', 'believed'], correctIndex: 0 },
      { id: 'b2p-pr-04', type: 'fill-blank', prompt: 'Complete.', sentence: "It ___ ___ (rumour) that they are getting divorced.", answers: ['is', 'rumoured'] },
      { id: 'b2p-pr-05', type: 'multiple-choice', prompt: 'Which sentence refers to a PAST event?', options: ["She is thought to be in Paris.", "She is thought to have left for Paris.", "She is thought to leave for Paris.", "She was thought to is in Paris."], correctIndex: 1 },
      { id: 'b2p-pr-06', type: 'fill-blank', prompt: 'Complete.', sentence: "The suspect ___ ___ to ___ ___ (leave) the country.", answers: ['is', 'thought', 'have', 'left'] },
      { id: 'b2p-pr-07', type: 'multiple-choice', prompt: 'Which structure is MORE elegant for news writing?', options: ["It is said that Mary visited Paris.", "Mary is said to have visited Paris.", "They say Mary visited Paris.", "All are equally good."], correctIndex: 1 },
      { id: 'b2p-pr-08', type: 'fill-blank', prompt: 'Complete.', sentence: "It ___ ___ (report) that the fire was contained quickly.", answers: ['was', 'reported'] },
      { id: 'b2p-pr-09', type: 'multiple-choice', prompt: '"He is said to be very rich." The speaker:', options: ["knows for sure he is rich", "hears/claims he is rich without personal confirmation", "believes he is poor", "is making a joke"], correctIndex: 1 },
      { id: 'b2p-pr-10', type: 'fill-blank', prompt: 'Complete.', sentence: "The CEO ___ ___ ___ to ___ ___ (step down) by the end of the year.", answers: ['is', 'expected', '', 'step', 'down'], alts: [[], [], [''], [], []] },
    ],
  },

  {
    id: 'b2plus-discourse-markers-advanced',
    level: 'B2+',
    skill: 'grammar',
    title: 'Discourse Markers · advanced',
    description: 'however, nevertheless, furthermore, in contrast…',
    icon: '🔀',
    quickLesson: {
      summary: 'Linking words that glue arguments together in formal writing and speech. Pick based on the relationship: contrast, addition, cause, example, conclusion.',
      sections: [
        {
          heading: 'Contrast',
          body: 'however, nevertheless, on the other hand, in contrast, whereas, while.',
          examples: [
            'The plan is risky. **However**, it could pay off.',
            '**Whereas** Spain exports olive oil, Chile exports wine.',
          ],
        },
        {
          heading: 'Addition & Example',
          body: 'furthermore / moreover / in addition / besides (add info). for example / for instance / such as (examples).',
          examples: [
            'The region is cold. **Moreover**, it rains nine months of the year.',
            'Many languages, **such as** French and Italian, come from Latin.',
          ],
        },
        {
          heading: 'Cause / Conclusion',
          body: 'therefore, consequently, as a result, thus (conclusion). due to / owing to / because of (cause + noun).',
          examples: [
            'The project failed. **Consequently**, the team was restructured.',
            '**Due to** the strike, the flight was cancelled.',
          ],
          tip: 'Spot the difference: "however" = contrast; "whereas" = parallel contrast; "despite + noun / in spite of + noun" also contrast but take a NOUN after.',
        },
      ],
    },
    exercises: [
      { id: 'b2p-dma-01', type: 'multiple-choice', prompt: 'The project is complex. ___, we will meet the deadline.', options: ['Nevertheless', 'Furthermore', 'For example', 'As a result'], correctIndex: 0 },
      { id: 'b2p-dma-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'The region is remote. ___, it has no cell coverage.', answers: ['Moreover'], alts: [['Furthermore', 'In addition']] },
      { id: 'b2p-dma-03', type: 'multiple-choice', prompt: 'Which marker signals CAUSE + noun?', options: ['however', 'due to', 'moreover', 'in contrast'], correctIndex: 1 },
      { id: 'b2p-dma-04', type: 'fill-blank', prompt: 'Complete.', sentence: '___ the rain, the match was postponed.', answers: ['Due to'], alts: [['Because of', 'Owing to']] },
      { id: 'b2p-dma-05', type: 'multiple-choice', prompt: 'Which is NOT a contrast marker?', options: ['however', 'nevertheless', 'on the other hand', 'therefore'], correctIndex: 3 },
      { id: 'b2p-dma-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'Sales fell this quarter. ___, the board is replacing the manager.', answers: ['Consequently'], alts: [['Therefore', 'As a result']] },
      { id: 'b2p-dma-07', type: 'multiple-choice', prompt: '"___ the weather was terrible, they won the match."', options: ['Although', 'Despite', 'However', 'Because'], correctIndex: 0, explain: '"Although + clause"; "despite + noun".' },
      { id: 'b2p-dma-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'Many languages, ___ French and Italian, come from Latin.', answers: ['such as'], alts: [['like']] },
      { id: 'b2p-dma-09', type: 'multiple-choice', prompt: '"Whereas Chile exports copper, Peru exports zinc." This marks:', options: ['parallel contrast', 'cause', 'example', 'addition'], correctIndex: 0 },
      { id: 'b2p-dma-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'The plan is solid. ___, costs remain a concern.', answers: ['However'], alts: [['Nevertheless']] },
    ],
  },

  // ╔══════════════════════ C1 ══════════════════════╗

  {
    id: 'c1-fronting-topicalization',
    level: 'C1',
    skill: 'grammar',
    title: 'Fronting · topicalization',
    description: 'Moving elements to the front for emphasis.',
    icon: '⬅️',
    quickLesson: {
      summary: 'Pulling a phrase to the start of the sentence to spotlight it. Often triggers inversion (verb before subject) when the fronted element is negative, adverbial of place/direction, or "so + adjective".',
      sections: [
        {
          heading: 'No inversion needed',
          body: 'For contrast or emphasis, you can just move the object/object-complement/prepositional phrase to the front.',
          examples: [
            'His first novel was boring. **His second novel**, I actually enjoyed.',
            '**Those shoes** I would never wear.',
            '**Really tired** I was, but I kept going.',
          ],
        },
        {
          heading: 'Fronting that triggers inversion',
          body: 'Negative or restrictive adverbials, directional adverbials at the front invert aux + subject.',
          examples: [
            '**Never before had I seen** such beauty.',
            '**Not only did she win**, but she also broke the record.',
            '**Here comes** the bride.',
            '**Down the hill rolled** the bike.',
          ],
          tip: 'Fronting works in writing for rhythm and emphasis. In speech it can sound theatrical — reserve for moments of real stress.',
        },
      ],
    },
    exercises: [
      { id: 'c1-ft-01', type: 'multiple-choice', prompt: '___ before had I seen such beauty.', options: ['Never', 'Nobody', 'None', 'Not'], correctIndex: 0 },
      { id: 'c1-ft-02', type: 'fill-blank', prompt: 'Front the directional adverbial.', sentence: 'The bike rolled down the hill. → ___ ___ ___ ___ the bike.', answers: ['Down', 'the', 'hill', 'rolled'] },
      { id: 'c1-ft-03', type: 'multiple-choice', prompt: 'Which sentence uses fronting WITH inversion correctly?', options: ['Rarely I eat meat.', 'Rarely do I eat meat.', 'Rarely I do eat meat.', 'Rarely am I eat meat.'], correctIndex: 1 },
      { id: 'c1-ft-04', type: 'fill-blank', prompt: 'Complete.', sentence: "Not only ___ she win, but she ___ broke the record.", answers: ['did', 'also'] },
      { id: 'c1-ft-05', type: 'multiple-choice', prompt: 'When is INVERSION required after fronting?', options: ["Never", "Always", "After negative/restrictive adverbials fronted for emphasis", "Only in questions"], correctIndex: 2 },
      { id: 'c1-ft-06', type: 'fill-blank', prompt: 'Complete.', sentence: "Here ___ the bride!", answers: ['comes'] },
      { id: 'c1-ft-07', type: 'multiple-choice', prompt: 'Pick the SENTENCE that uses fronting WITHOUT inversion.', options: ["Never have I done that.", "His latest film, I really didn't enjoy.", "So beautiful was the scene that I cried.", "Not until then did I understand."], correctIndex: 1 },
      { id: 'c1-ft-08', type: 'fill-blank', prompt: 'Complete.', sentence: "So ___ was the scenery that I couldn't look away. (adjective: beautiful)", answers: ['beautiful'] },
      { id: 'c1-ft-09', type: 'multiple-choice', prompt: 'Which is the best effect of fronting?', options: ["Making the sentence longer", "Shifting focus / emphasis to a specific element", "Avoiding inversion", "Making it less formal"], correctIndex: 1 },
      { id: 'c1-ft-10', type: 'fill-blank', prompt: 'Complete.', sentence: 'Hardly ___ I sat down when the phone rang.', answers: ['had'] },
    ],
  },

  {
    id: 'c1-inversion-advanced',
    level: 'C1',
    skill: 'grammar',
    title: 'Advanced Inversion',
    description: 'Only / Hardly / So / Such / Little / No sooner…',
    icon: '🔄',
    quickLesson: {
      summary: 'Formal inversion is triggered by fronted restrictive or negative elements. Subject-auxiliary inverts as in a question.',
      sections: [
        {
          heading: 'Negative / restrictive triggers',
          body: 'After: Never, Rarely, Seldom, Hardly, Scarcely, No sooner, Only (+ then/if/when/by), Little, Under no circumstances, In no way, Not until.',
          examples: [
            '**Rarely do I see** such talent.',
            '**Little did she know** what was coming.',
            '**Only then did I realise** my mistake.',
            '**No sooner had I sat down** than the phone rang.',
          ],
        },
        {
          heading: '"So / Such" patterns',
          body: 'So + adj/adv + aux + subject + that…  ·  Such + noun phrase + aux + subject + that…',
          examples: [
            '**So tired was he** that he fell asleep standing up.',
            '**Such was his anger** that he walked out.',
          ],
          tip: 'Inversion sounds formal / literary. Save it for essays, speeches and punchy openings.',
        },
      ],
    },
    exercises: [
      { id: 'c1-ia-01', type: 'multiple-choice', prompt: 'Only when I arrived ___ the problem.', options: ['I saw', 'did I see', 'I did see', 'had I see'], correctIndex: 1 },
      { id: 'c1-ia-02', type: 'fill-blank', prompt: 'Complete.', sentence: 'Little ___ she ___ (know) what was coming.', answers: ['did', 'know'] },
      { id: 'c1-ia-03', type: 'multiple-choice', prompt: '"No sooner ___ sat down than the phone rang."', options: ['I had', 'had I', 'I did', 'did I'], correctIndex: 1 },
      { id: 'c1-ia-04', type: 'fill-blank', prompt: 'Complete.', sentence: "So ___ was the music that I covered my ears. (adjective: loud)", answers: ['loud'] },
      { id: 'c1-ia-05', type: 'multiple-choice', prompt: 'Which triggers inversion?', options: ['usually', 'always', 'rarely', 'often'], correctIndex: 2 },
      { id: 'c1-ia-06', type: 'fill-blank', prompt: 'Complete.', sentence: 'Under no circumstances ___ you ___ (enter) that area.', answers: ['may', 'enter'], alts: [['should', 'can', 'must'], []] },
      { id: 'c1-ia-07', type: 'multiple-choice', prompt: '"Such was his anger that he slammed the door." What is inverted?', options: ['anger with was', 'he with his anger', 'subject with was', 'nothing'], correctIndex: 2 },
      { id: 'c1-ia-08', type: 'fill-blank', prompt: 'Complete.', sentence: 'Hardly ___ he ___ (arrive) when the meeting started.', answers: ['had', 'arrived'] },
      { id: 'c1-ia-09', type: 'multiple-choice', prompt: 'Pick the natural inverted sentence.', options: ['Never I have seen such beauty.', 'Never had I seen such beauty.', 'Never I had seen such beauty.', 'Never seen had I such beauty.'], correctIndex: 1 },
      { id: 'c1-ia-10', type: 'fill-blank', prompt: 'Complete.', sentence: "Not until the sun set ___ we ___ (realise) we were lost.", answers: ['did', 'realise'], alts: [[], ['realize']] },
    ],
  },

  {
    id: 'c1-aspectual-nuance',
    level: 'C1',
    skill: 'grammar',
    title: 'Aspectual Nuance',
    description: 'Simple vs continuous vs perfect — subtle timing.',
    icon: '🎚️',
    quickLesson: {
      summary: 'At C1, learners often pick the WRONG aspect. Simple = fact/completion; continuous = ongoing/temporary; perfect = relevance of a past point to a later one.',
      sections: [
        {
          heading: 'Simple vs continuous (nuance)',
          body: 'Continuous often adds "temporary", "unfinished", or "annoying" meaning.',
          examples: [
            'I **live** in Lima. (permanent)',
            'I **\'m living** in Lima at the moment. (temporary)',
            'She **is always leaving** the lights on. (annoying habit)',
          ],
        },
        {
          heading: 'Perfect vs simple past',
          body: 'Perfect links two time points. Simple past is a sealed, finished fact.',
          examples: [
            'I **lived** in Madrid for five years. (I don\'t anymore)',
            'I **have lived** in Madrid for five years. (and still do)',
          ],
        },
        {
          heading: 'Perfect continuous: duration + ongoing',
          body: 'Use "have been doing" to stress HOW LONG an activity has been going on (and often that it still is).',
          examples: [
            'She **has been running** for an hour. (ongoing emphasis)',
            'I **have run** three marathons this year. (finished countable result)',
          ],
          tip: 'Stative verbs (know, believe, own, contain) normally stay simple. If you say "I\'m loving it", you\'re marking the feeling as fresh/temporary.',
        },
      ],
    },
    exercises: [
      { id: 'c1-an-01', type: 'multiple-choice', prompt: 'Which conveys an ANNOYING habit?', options: ['He always leaves the lights on.', 'He is always leaving the lights on.', 'He left the lights on.', 'He has left the lights on.'], correctIndex: 1 },
      { id: 'c1-an-02', type: 'fill-blank', prompt: 'Complete (temporary at the moment).', sentence: 'I usually live in Lima, but I ___ ___ (stay) in Chile this month.', answers: ['am', 'staying'] },
      { id: 'c1-an-03', type: 'multiple-choice', prompt: 'Which sentence implies the speaker STILL lives in Madrid?', options: ["I lived in Madrid for five years.", "I have lived in Madrid for five years.", "I was living in Madrid for five years.", "I had lived in Madrid for five years."], correctIndex: 1 },
      { id: 'c1-an-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'She ___ ___ ___ (study) for three hours. She needs a break. (ongoing emphasis)', answers: ['has', 'been', 'studying'] },
      { id: 'c1-an-05', type: 'multiple-choice', prompt: '"I\'ve run three marathons this year" emphasises:', options: ['that I am still running one now', 'the duration of running', 'a completed, countable result', 'an annoying habit'], correctIndex: 2 },
      { id: 'c1-an-06', type: 'fill-blank', prompt: 'Complete.', sentence: "The baby ___ (not / stop) crying since we left. (ongoing frustration)", answers: ["hasn't stopped"], alts: [["has not stopped"]] },
      { id: 'c1-an-07', type: 'multiple-choice', prompt: '"I\'m loving this song" — why continuous with a stative verb?', options: ["Grammatical mistake.", "To mark the feeling as fresh / of-the-moment.", "To talk about past love.", "To soften the statement."], correctIndex: 1 },
      { id: 'c1-an-08', type: 'fill-blank', prompt: 'Complete.', sentence: "I ___ (wait) for an hour before she arrived.", answers: ['had been waiting'] },
      { id: 'c1-an-09', type: 'multiple-choice', prompt: 'Which is the MOST natural?', options: ["I am knowing him for a long time.", "I know him for a long time.", "I have known him for a long time.", "I have been knowing him for a long time."], correctIndex: 2 },
      { id: 'c1-an-10', type: 'fill-blank', prompt: 'Complete (duration + ongoing).', sentence: "By next summer, I ___ ___ ___ (work) here for ten years.", answers: ['will', 'have been', 'working'] },
    ],
  },

];
