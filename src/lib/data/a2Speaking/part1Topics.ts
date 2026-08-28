// FriendlyTeaching.cl — A1-A2+ Speaking Part 1 topic bank
//
// Familiar, concrete topics that get an A1-A2 student talking about
// themselves. Each topic has 4 development questions calibrated for
// the level: simple grammar (present simple / continuous, basic past,
// like + noun/verb-ing, going to), everyday vocabulary, no idiomatic
// traps. Every question can be answered in 1-2 short sentences.

export interface A2Part1Topic {
  id: string;
  emoji: string;
  name: string;
  questions: string[];
}

// Warm-up topics — the two universal openers a full mock always starts
// with. Slot 3 is drawn at random from the rest of the bank.
export const A2_PART1_CORE_TOPIC_IDS = [
  'about-you',
  'daily-routine',
] as const;

export const A2_PART1_TOPICS: A2Part1Topic[] = [
  {
    id: 'about-you',
    emoji: '👋',
    name: 'About you',
    questions: [
      'What is your name and where are you from?',
      'How old are you?',
      'Do you work or study? Tell me about it.',
      'What languages can you speak?',
    ],
  },
  {
    id: 'daily-routine',
    emoji: '⏰',
    name: 'Your daily routine',
    questions: [
      'What time do you usually get up?',
      'What do you have for breakfast?',
      'What do you do in the afternoon?',
      'What time do you go to bed?',
    ],
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    name: 'Your family',
    questions: [
      'How many people are there in your family?',
      'Who do you live with?',
      'Do you have brothers or sisters? Tell me about them.',
      'What does your family like to do together?',
    ],
  },
  {
    id: 'home',
    emoji: '🏠',
    name: 'Your home',
    questions: [
      'Where do you live? A house or an apartment?',
      'How many rooms are in your home?',
      'Which room is your favorite? Why?',
      'What can you see from your window?',
    ],
  },
  {
    id: 'food',
    emoji: '🍽️',
    name: 'Food and drinks',
    questions: [
      'What food do you like the most?',
      'Is there any food you don\'t like?',
      'Do you cook at home? What do you cook?',
      'What did you eat yesterday for lunch?',
    ],
  },
  {
    id: 'free-time',
    emoji: '🎨',
    name: 'Free time and hobbies',
    questions: [
      'What do you like to do in your free time?',
      'Do you have any hobbies?',
      'What do you usually do on weekends?',
      'Do you prefer being at home or going out?',
    ],
  },
  {
    id: 'weather',
    emoji: '🌦️',
    name: 'Weather and seasons',
    questions: [
      'What is the weather like today?',
      'What is your favorite season? Why?',
      'What do you wear when it is cold?',
      'Do you like the rain? Why or why not?',
    ],
  },
  {
    id: 'travel',
    emoji: '✈️',
    name: 'Travel and places',
    questions: [
      'Do you like to travel? Why?',
      'What was the last place you visited?',
      'Where would you like to go one day?',
      'Do you prefer the beach or the mountains?',
    ],
  },
  {
    id: 'sports',
    emoji: '⚽',
    name: 'Sports and exercise',
    questions: [
      'Do you play any sports?',
      'What sport do you like to watch?',
      'How often do you exercise?',
      'Is there a sport you would like to try?',
    ],
  },
  {
    id: 'music',
    emoji: '🎵',
    name: 'Music',
    questions: [
      'What kind of music do you like?',
      'Who is your favorite singer or band?',
      'When do you listen to music?',
      'Can you play any musical instrument?',
    ],
  },
  {
    id: 'movies-tv',
    emoji: '🎬',
    name: 'Movies and TV',
    questions: [
      'What kind of movies do you enjoy?',
      'What is a movie you watched recently?',
      'Do you prefer movies or TV series? Why?',
      'Who is your favorite actor or actress?',
    ],
  },
  {
    id: 'technology',
    emoji: '📱',
    name: 'Technology and phones',
    questions: [
      'How often do you use your phone?',
      'What apps do you use every day?',
      'Do you like taking photos with your phone?',
      'Is technology helpful for learning English?',
    ],
  },
  {
    id: 'shopping',
    emoji: '🛍️',
    name: 'Shopping',
    questions: [
      'Do you like shopping? Why?',
      'Where do you usually buy your clothes?',
      'Do you prefer shopping online or in stores?',
      'What was the last thing you bought?',
    ],
  },
  {
    id: 'friends',
    emoji: '🧑‍🤝‍🧑',
    name: 'Friends',
    questions: [
      'Do you have many friends?',
      'Who is your best friend? Tell me about them.',
      'What do you like to do with your friends?',
      'When did you last meet your friends?',
    ],
  },
  {
    id: 'weekend',
    emoji: '🌟',
    name: 'Your weekend',
    questions: [
      'What did you do last weekend?',
      'Do you usually work or rest on weekends?',
      'What are your plans for next weekend?',
      'Do you prefer Saturdays or Sundays? Why?',
    ],
  },
];
