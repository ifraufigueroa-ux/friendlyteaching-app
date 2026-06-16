// FriendlyTeaching.cl — IELTS Speaking Part 2 cue cards
// Source: PDF provided by teacher (5 official-style practice cards).
// Add more cards here as the bank grows.

export interface CueCard {
  id: string;
  topic: string;            // "Describe a useful skill."
  bullets: string[];        // 4 prompts after "You should say:"
  explainPrompt: string;    // "explain why this skill is important to you."
  category?: 'skill' | 'place' | 'person' | 'thing' | 'experience' | 'media';
}

export const IELTS_CUE_CARDS: CueCard[] = [
  {
    id: 'useful-skill',
    topic: 'Describe a useful skill.',
    bullets: [
      'what the skill is',
      'why you want to learn it',
      'how you could learn it',
      'how long it might take to learn',
    ],
    explainPrompt: 'and explain why this skill is important to you.',
    category: 'skill',
  },
  {
    id: 'memorable-trip',
    topic: 'Describe a memorable trip.',
    bullets: [
      'where you went',
      'who you went with',
      'what you did there',
      'how long you stayed',
    ],
    explainPrompt: 'and explain why the trip was memorable.',
    category: 'experience',
  },
  {
    id: 'person-you-admire',
    topic: 'Describe a person you admire.',
    bullets: [
      'who this person is',
      'how you know them',
      'what qualities they have',
      'what they have achieved',
    ],
    explainPrompt: 'and explain why you admire them.',
    category: 'person',
  },
  {
    id: 'piece-of-technology',
    topic: 'Describe a piece of technology.',
    bullets: [
      'what it is',
      'when you started using it',
      'what you use it for',
      'how often you use it',
    ],
    explainPrompt: 'and explain why it is important to you.',
    category: 'thing',
  },
  {
    id: 'interesting-book',
    topic: 'Describe an interesting book.',
    bullets: [
      'what the book was',
      'when you read it',
      'what it was about',
      'why you chose to read it',
    ],
    explainPrompt: 'and explain why you enjoyed it.',
    category: 'media',
  },
];
