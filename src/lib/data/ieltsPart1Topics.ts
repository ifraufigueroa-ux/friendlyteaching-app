// FriendlyTeaching.cl — IELTS Speaking Part 1 topic bank
// Each topic has 4 development questions that the teacher can throw at
// the student after the random pick lands.

export interface Part1Topic {
  id: string;
  emoji: string;
  name: string;
  questions: string[];
}

export const IELTS_PART1_TOPICS: Part1Topic[] = [
  {
    id: 'ai',
    emoji: '🤖',
    name: 'Artificial Intelligence',
    questions: [
      'Do you use AI tools in your daily life? Which ones?',
      'How do you feel about AI replacing jobs in the future?',
      'Has AI made your studies or work easier?',
      'Do you trust the answers AI gives you?',
    ],
  },
  {
    id: 'emails',
    emoji: '📧',
    name: 'Emails',
    questions: [
      'Do you write emails often? In what contexts?',
      'Do you prefer emails or instant messages? Why?',
      'What kinds of emails do you usually receive?',
      'Have you ever sent an email you immediately regretted?',
    ],
  },
  {
    id: 'languages',
    emoji: '🗣️',
    name: 'Languages',
    questions: [
      'How many languages do you speak?',
      'Why did you decide to learn English?',
      'Do you think learning a new language is difficult?',
      'Which language would you like to learn next, and why?',
    ],
  },
  {
    id: 'swimming',
    emoji: '🏊',
    name: 'Swimming',
    questions: [
      'Can you swim? When did you learn?',
      'Do you enjoy swimming? Why or why not?',
      'Where do people in your country usually swim?',
      'Is swimming a popular sport where you live?',
    ],
  },
  {
    id: 'hometown',
    emoji: '🏘️',
    name: 'Hometown',
    questions: [
      'Where is your hometown?',
      'What do you like most about it?',
      'Has it changed much in recent years?',
      'Would you like to live there in the future?',
    ],
  },
  {
    id: 'music',
    emoji: '🎵',
    name: 'Music',
    questions: [
      'What kind of music do you usually listen to?',
      'When do you most often listen to music?',
      'Have you ever been to a live concert?',
      'Did you learn a musical instrument as a child?',
    ],
  },
  {
    id: 'food',
    emoji: '🍝',
    name: 'Food',
    questions: [
      'What is your favourite food?',
      'Do you enjoy cooking? Why or why not?',
      'How often do you eat at restaurants?',
      'Has your diet changed over the years?',
    ],
  },
  {
    id: 'mobile-phones',
    emoji: '📱',
    name: 'Mobile phones',
    questions: [
      'How much time do you spend on your phone each day?',
      'Which apps do you use the most?',
      'Could you live for a day without your phone?',
      'How has your phone changed your daily routine?',
    ],
  },
  {
    id: 'travel',
    emoji: '✈️',
    name: 'Travel',
    questions: [
      'Do you enjoy travelling?',
      'Where was the last place you visited?',
      'Do you prefer beach destinations or cities?',
      'Where would you most like to travel to next?',
    ],
  },
  {
    id: 'reading',
    emoji: '📚',
    name: 'Reading',
    questions: [
      'Do you read books often?',
      'What kind of books do you enjoy?',
      'Do you prefer print or digital books?',
      'Did you read more when you were younger?',
    ],
  },
  {
    id: 'movies',
    emoji: '🎬',
    name: 'Movies',
    questions: [
      'How often do you watch movies?',
      'Do you prefer the cinema or streaming at home?',
      'What kind of movies do you enjoy?',
      'Have you watched anything memorable recently?',
    ],
  },
  {
    id: 'sports',
    emoji: '⚽',
    name: 'Sports',
    questions: [
      'Do you play any sports regularly?',
      'What sports are most popular in your country?',
      'Do you watch sports on television?',
      'Were you good at sports as a child?',
    ],
  },
  {
    id: 'weather',
    emoji: '🌤️',
    name: 'Weather',
    questions: [
      'What kind of weather do you prefer?',
      'What is the weather usually like in your country?',
      'Does the weather affect your mood?',
      'What is your favourite season? Why?',
    ],
  },
  {
    id: 'social-media',
    emoji: '💬',
    name: 'Social media',
    questions: [
      'Which social media platforms do you use?',
      'How much time do you spend on social media each day?',
      'Has social media changed how you stay in touch with friends?',
      'Do you think social media is mostly positive or negative?',
    ],
  },
  {
    id: 'cooking',
    emoji: '🍳',
    name: 'Cooking',
    questions: [
      'Do you cook often at home?',
      'Who taught you how to cook?',
      'What is the last dish you prepared?',
      'Do you watch cooking shows or follow recipes online?',
    ],
  },
  {
    id: 'shopping',
    emoji: '🛍️',
    name: 'Shopping',
    questions: [
      'Do you enjoy shopping?',
      'Do you prefer shopping online or in physical stores?',
      'What was the last thing you bought?',
      'Do you sometimes buy things on impulse?',
    ],
  },
  {
    id: 'sleep',
    emoji: '😴',
    name: 'Sleep',
    questions: [
      'How many hours do you usually sleep at night?',
      'Do you take naps during the day?',
      'Are you a light or deep sleeper?',
      'What do you do if you cannot fall asleep?',
    ],
  },
  {
    id: 'work-or-study',
    emoji: '💼',
    name: 'Work or study',
    questions: [
      'Do you work or are you a student?',
      'What do you most enjoy about it?',
      'What would you change about your job or studies?',
      'Where do you see yourself in five years?',
    ],
  },
  {
    id: 'photography',
    emoji: '📸',
    name: 'Photography',
    questions: [
      'Do you take photos often?',
      'What kinds of things do you usually photograph?',
      'Do you edit your photos before sharing them?',
      'Do you prefer printed photos or digital ones?',
    ],
  },
  {
    id: 'friends',
    emoji: '👫',
    name: 'Friends',
    questions: [
      'Do you have many close friends?',
      'How did you meet your best friend?',
      'How often do you see your friends?',
      'Are friendships easier to maintain in person or online?',
    ],
  },
];
