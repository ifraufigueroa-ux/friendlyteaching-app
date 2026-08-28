// FriendlyTeaching.cl — A1-A2+ Speaking Part 2 cue cards
//
// Simple description prompts. Each card asks the student to describe
// something familiar (a person, a place, a habit, a plan, a memory)
// using target grammar at their level. Bullets scaffold what to include
// so the student can produce ~60-90 seconds of speech.

export interface A2CueCard {
  id: string;
  topic: string;                 // "Describe your favorite meal."
  bullets: string[];             // 3-4 support prompts
  explainPrompt: string;         // wrap-up prompt
  focus: string;                 // grammar target for teacher note
}

export const A2_CUE_CARDS: A2CueCard[] = [
  {
    id: 'favorite-meal',
    topic: 'Describe your favorite meal.',
    bullets: [
      'what the meal is',
      'when you usually eat it',
      'who you eat it with',
      'how it tastes',
    ],
    explainPrompt: 'and explain why you like it so much.',
    focus: 'Present simple · like / prefer',
  },
  {
    id: 'best-friend',
    topic: 'Describe your best friend.',
    bullets: [
      'who this person is',
      'how you met them',
      'what they look like',
      'what you do together',
    ],
    explainPrompt: 'and explain why they are your best friend.',
    focus: 'Present simple · past simple · adjectives',
  },
  {
    id: 'typical-day',
    topic: 'Describe a typical day in your life.',
    bullets: [
      'what time you get up',
      'what you do in the morning',
      'what you do in the afternoon',
      'what you do at night',
    ],
    explainPrompt: 'and explain what part of the day you like the most.',
    focus: 'Present simple · time expressions',
  },
  {
    id: 'last-holiday',
    topic: 'Describe your last holiday.',
    bullets: [
      'where you went',
      'who you went with',
      'what you did there',
      'how long you stayed',
    ],
    explainPrompt: 'and explain if you enjoyed the trip.',
    focus: 'Past simple',
  },
  {
    id: 'favorite-place',
    topic: 'Describe a place you like to visit.',
    bullets: [
      'where the place is',
      'how often you go there',
      'who you go with',
      'what you do there',
    ],
    explainPrompt: 'and explain why this place is special to you.',
    focus: 'Present simple · adverbs of frequency',
  },
  {
    id: 'something-you-can-do',
    topic: 'Describe something you can do well.',
    bullets: [
      'what activity or skill it is',
      'when you learned it',
      'how you learned it',
      'how often you do it',
    ],
    explainPrompt: 'and explain why you enjoy doing it.',
    focus: 'Can / can\'t · past simple',
  },
  {
    id: 'favorite-room',
    topic: 'Describe your favorite room in your house.',
    bullets: [
      'which room it is',
      'what furniture is in it',
      'what you do there',
      'what colors you can see',
    ],
    explainPrompt: 'and explain why you like this room the most.',
    focus: 'There is / there are · adjectives',
  },
  {
    id: 'birthday',
    topic: 'Describe a birthday you remember well.',
    bullets: [
      'whose birthday it was',
      'where you were',
      'what you did that day',
      'what you ate',
    ],
    explainPrompt: 'and explain why you remember this birthday.',
    focus: 'Past simple',
  },
  {
    id: 'favorite-show',
    topic: 'Describe your favorite movie or TV show.',
    bullets: [
      'the name of the movie or show',
      'what it is about',
      'the main characters',
      'when you watch it',
    ],
    explainPrompt: 'and explain why you like it.',
    focus: 'Present simple · describing plots',
  },
  {
    id: 'next-weekend',
    topic: 'Describe what you are going to do next weekend.',
    bullets: [
      'what your plan is',
      'who you are going with',
      'where you are going',
      'what you need to prepare',
    ],
    explainPrompt: 'and explain why you are looking forward to it.',
    focus: 'Going to · future plans',
  },
  {
    id: 'morning-routine',
    topic: 'Describe your morning routine.',
    bullets: [
      'what time you wake up',
      'what you eat and drink',
      'what clothes you wear',
      'how you go to work or school',
    ],
    explainPrompt: 'and explain if you like your mornings.',
    focus: 'Present simple · daily routines',
  },
  {
    id: 'family-member',
    topic: 'Describe a person in your family.',
    bullets: [
      'who they are',
      'what they look like',
      'what job they do',
      'what they like doing',
    ],
    explainPrompt: 'and explain why this person is important to you.',
    focus: 'Present simple · describing people',
  },
  {
    id: 'thing-you-bought',
    topic: 'Describe something you bought recently.',
    bullets: [
      'what you bought',
      'where you bought it',
      'how much it cost',
      'why you bought it',
    ],
    explainPrompt: 'and explain if you are happy with it.',
    focus: 'Past simple',
  },
  {
    id: 'city-town',
    topic: 'Describe the city or town where you live.',
    bullets: [
      'the name of the place',
      'where it is',
      'what people can do there',
      'what the weather is like',
    ],
    explainPrompt: 'and explain what you like about it.',
    focus: 'Present simple · there is / there are',
  },
  {
    id: 'want-to-learn',
    topic: 'Describe something you want to learn.',
    bullets: [
      'what you want to learn',
      'why you want to learn it',
      'how you can learn it',
      'when you will start',
    ],
    explainPrompt: 'and explain how it will be useful for you.',
    focus: 'Will / going to · want to + verb',
  },
];
