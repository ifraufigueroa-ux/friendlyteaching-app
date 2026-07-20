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

  // ── People ──────────────────────────────────────────────────────
  {
    id: 'friend-different',
    topic: 'Describe a friend who is very different from you.',
    bullets: [
      'who this friend is',
      'how you met them',
      'what makes them different from you',
      'what you have in common',
    ],
    explainPrompt: 'and explain how the differences affect your friendship.',
    category: 'person',
  },
  {
    id: 'teacher-influenced',
    topic: 'Describe a teacher who influenced you.',
    bullets: [
      'who this teacher was',
      'what subject they taught',
      'what made them special',
      'how they influenced you',
    ],
    explainPrompt: 'and explain how their influence still affects you today.',
    category: 'person',
  },
  {
    id: 'elderly-person',
    topic: 'Describe an elderly person you know well.',
    bullets: [
      'who this person is',
      'how you know them',
      'what they are like',
      'what you have learned from them',
    ],
    explainPrompt: 'and explain why you enjoy spending time with them.',
    category: 'person',
  },

  // ── Places ──────────────────────────────────────────────────────
  {
    id: 'place-to-relax',
    topic: 'Describe a place where you like to relax.',
    bullets: [
      'where this place is',
      'how often you go there',
      'what you do there',
      'who you go with',
    ],
    explainPrompt: 'and explain why this place helps you relax.',
    category: 'place',
  },
  {
    id: 'interesting-building',
    topic: 'Describe an interesting building you have visited.',
    bullets: [
      'where this building is',
      'when you visited it',
      'what it looks like',
      'what makes it interesting',
    ],
    explainPrompt: 'and explain how you felt when you were there.',
    category: 'place',
  },
  {
    id: 'city-live-in',
    topic: 'Describe a city you would like to live in one day.',
    bullets: [
      'which city it is',
      'where it is located',
      'what you know about it',
      'why it appeals to you',
    ],
    explainPrompt: 'and explain what your life there would look like.',
    category: 'place',
  },
  {
    id: 'park-visited',
    topic: 'Describe a park or garden you enjoy visiting.',
    bullets: [
      'where this place is',
      'how often you go there',
      'what it looks like',
      'what you usually do there',
    ],
    explainPrompt: 'and explain why you enjoy visiting it.',
    category: 'place',
  },

  // ── Things ──────────────────────────────────────────────────────
  {
    id: 'important-object',
    topic: 'Describe an object that is very important to you.',
    bullets: [
      'what the object is',
      'how you got it',
      'how long you have had it',
      'where you keep it',
    ],
    explainPrompt: 'and explain why it means so much to you.',
    category: 'thing',
  },
  {
    id: 'gift-gave',
    topic: 'Describe a gift you gave someone that made them happy.',
    bullets: [
      'who you gave it to',
      'what the gift was',
      'why you chose it',
      'when you gave it to them',
    ],
    explainPrompt: 'and explain how they reacted when they received it.',
    category: 'thing',
  },
  {
    id: 'clothing-item',
    topic: 'Describe a piece of clothing you wear often.',
    bullets: [
      'what it is',
      'when and where you got it',
      'what it looks like',
      'when you usually wear it',
    ],
    explainPrompt: 'and explain why you like wearing it.',
    category: 'thing',
  },
  {
    id: 'old-possession',
    topic: 'Describe an old object you have kept for a long time.',
    bullets: [
      'what the object is',
      'how long you have had it',
      'where it came from',
      'where you keep it',
    ],
    explainPrompt: 'and explain why you have not thrown it away.',
    category: 'thing',
  },

  // ── Experiences ────────────────────────────────────────────────
  {
    id: 'happy-childhood',
    topic: 'Describe a happy memory from your childhood.',
    bullets: [
      'when it happened',
      'where you were',
      'who was with you',
      'what happened',
    ],
    explainPrompt: 'and explain why this memory has stayed with you.',
    category: 'experience',
  },
  {
    id: 'learned-new-thing',
    topic: 'Describe a time when you learned something new.',
    bullets: [
      'what you learned',
      'when it happened',
      'how you learned it',
      'who helped you',
    ],
    explainPrompt: 'and explain how learning it changed you.',
    category: 'experience',
  },
  {
    id: 'helped-someone',
    topic: 'Describe a time when you helped someone.',
    bullets: [
      'who you helped',
      'when this happened',
      'how you helped them',
      'why they needed your help',
    ],
    explainPrompt: 'and explain how you felt afterwards.',
    category: 'experience',
  },
  {
    id: 'difficult-decision',
    topic: 'Describe a difficult decision you had to make.',
    bullets: [
      'what the decision was',
      'when you had to make it',
      'what your options were',
      'how you decided',
    ],
    explainPrompt: 'and explain how you feel about the decision now.',
    category: 'experience',
  },
  {
    id: 'goal-achieved',
    topic: 'Describe a goal you have achieved.',
    bullets: [
      'what the goal was',
      'when you set it',
      'what you had to do to achieve it',
      'how long it took',
    ],
    explainPrompt: 'and explain how you felt when you reached it.',
    category: 'experience',
  },
  {
    id: 'special-meal',
    topic: 'Describe a special meal you shared with others.',
    bullets: [
      'where you had it',
      'who was there',
      'what you ate',
      'what the occasion was',
    ],
    explainPrompt: 'and explain what made this meal special.',
    category: 'experience',
  },
  {
    id: 'time-busy',
    topic: 'Describe a period when you were very busy.',
    bullets: [
      'when this was',
      'why you were so busy',
      'what you had to do',
      'how you managed your time',
    ],
    explainPrompt: 'and explain how you felt during that period.',
    category: 'experience',
  },

  // ── Media ───────────────────────────────────────────────────────
  {
    id: 'movie-enjoyed',
    topic: 'Describe a movie that you enjoyed watching.',
    bullets: [
      'what the movie was',
      'when you watched it',
      'who you watched it with',
      'what it was about',
    ],
    explainPrompt: 'and explain why you enjoyed it so much.',
    category: 'media',
  },
  {
    id: 'meaningful-song',
    topic: 'Describe a song that is meaningful to you.',
    bullets: [
      'what the song is',
      'when you first heard it',
      'what it is about',
      'how often you listen to it',
    ],
    explainPrompt: 'and explain why it is meaningful to you.',
    category: 'media',
  },
  {
    id: 'website-you-visit',
    topic: 'Describe a website you visit often.',
    bullets: [
      'what the website is',
      'when you first started using it',
      'what you use it for',
      'how often you visit it',
    ],
    explainPrompt: 'and explain why you keep coming back to it.',
    category: 'media',
  },
  {
    id: 'surprising-news',
    topic: 'Describe a piece of news that surprised you.',
    bullets: [
      'what the news was about',
      'when and where you first heard it',
      'how you reacted',
      'who you discussed it with',
    ],
    explainPrompt: 'and explain why the news was so surprising to you.',
    category: 'media',
  },

  // ── Skill ───────────────────────────────────────────────────────
  {
    id: 'something-good-at',
    topic: 'Describe something you are very good at.',
    bullets: [
      'what it is',
      'how you learned it',
      'how long you have been doing it',
      'how often you do it',
    ],
    explainPrompt: 'and explain why you enjoy doing it.',
    category: 'skill',
  },
];
