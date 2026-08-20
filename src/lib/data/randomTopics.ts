// FriendlyTeaching.cl — Random Topic Simulator
// Casual conversation topics with 3 follow-up questions each.
// Not exam-specific — designed as a general-purpose speaking prompt bank
// that complements Q&A Simulator (bare questions) and IELTS Cue Cards
// (exam-style bullets). Add topics freely; the runner categorises visually.

export type RandomTopicCategory =
  | 'Life'
  | 'Work'
  | 'Culture'
  | 'Tech'
  | 'Society'
  | 'Fun'
  | 'Travel'
  | 'Relationships';

export interface RandomTopic {
  id:        string;
  category:  RandomTopicCategory;
  emoji:     string;
  topic:     string;          // The main prompt shown big on the card
  followUps: string[];        // Exactly 3 questions to develop the conversation
}

export const RANDOM_TOPIC_CATEGORIES: RandomTopicCategory[] = [
  'Life', 'Work', 'Culture', 'Tech', 'Society', 'Fun', 'Travel', 'Relationships',
];

export interface RandomTopicCategoryMeta {
  icon:     string;   // Category emoji used in chips
  gradient: string;   // Tailwind gradient classes used for the card face + back
  chipBg:   string;   // Tailwind bg class for the small filter chip when active
  chipText: string;   // Tailwind text class for the small filter chip when active
}

export const RANDOM_TOPIC_CATEGORY_META: Record<RandomTopicCategory, RandomTopicCategoryMeta> = {
  'Life':          { icon: '🌱', gradient: 'from-emerald-500 to-teal-500',   chipBg: 'bg-emerald-500',  chipText: 'text-white' },
  'Work':          { icon: '💼', gradient: 'from-amber-500 to-orange-500',   chipBg: 'bg-amber-500',    chipText: 'text-white' },
  'Culture':       { icon: '🌎', gradient: 'from-rose-500 to-pink-500',      chipBg: 'bg-rose-500',     chipText: 'text-white' },
  'Tech':          { icon: '📱', gradient: 'from-sky-500 to-blue-500',       chipBg: 'bg-sky-500',      chipText: 'text-white' },
  'Society':       { icon: '💭', gradient: 'from-indigo-500 to-violet-500',  chipBg: 'bg-indigo-500',   chipText: 'text-white' },
  'Fun':           { icon: '🎨', gradient: 'from-fuchsia-500 to-purple-500', chipBg: 'bg-fuchsia-500',  chipText: 'text-white' },
  'Travel':        { icon: '✈️', gradient: 'from-cyan-500 to-teal-500',      chipBg: 'bg-cyan-500',     chipText: 'text-white' },
  'Relationships': { icon: '👥', gradient: 'from-red-500 to-rose-500',       chipBg: 'bg-red-500',      chipText: 'text-white' },
};

export const RANDOM_TOPICS: RandomTopic[] = [

  // ── Life & Growing Up ────────────────────────────────────────────────
  {
    id: 'life-childhood-memory',
    category: 'Life',
    emoji: '🧸',
    topic: 'A childhood memory that always makes you smile.',
    followUps: [
      'Where were you and how old were you?',
      'Who was there with you?',
      'Why does that moment stay with you today?',
    ],
  },
  {
    id: 'life-influential-person',
    category: 'Life',
    emoji: '🌟',
    topic: 'The person who has influenced you the most.',
    followUps: [
      'Who are they and how did you meet?',
      'What did they teach you — with words, or just by example?',
      'Are you still in contact with them?',
    ],
  },
  {
    id: 'life-time-you-failed',
    category: 'Life',
    emoji: '💥',
    topic: 'A time you failed at something important.',
    followUps: [
      'What were you trying to do?',
      'How did you feel right after it happened?',
      'What did you learn that you couldn\'t have learned another way?',
    ],
  },
  {
    id: 'life-teenage-years',
    category: 'Life',
    emoji: '🎧',
    topic: 'You as a teenager.',
    followUps: [
      'What kind of teenager were you — loud, shy, rebellious, nerdy?',
      'What music, movies or trends did you love back then?',
      'What advice would you give your 15-year-old self today?',
    ],
  },
  {
    id: 'life-family-tradition',
    category: 'Life',
    emoji: '🕯️',
    topic: 'A tradition your family keeps.',
    followUps: [
      'What is it and when do you do it?',
      'Where did the tradition come from?',
      'Would you keep it with your own family in the future?',
    ],
  },

  // ── Work & Ambitions ─────────────────────────────────────────────────
  {
    id: 'work-dream-job',
    category: 'Work',
    emoji: '🚀',
    topic: 'Your dream job — the real one, not the practical one.',
    followUps: [
      'What does a typical day in that job look like?',
      'Is it realistic for you, honestly?',
      'What is stopping you from pursuing it right now?',
    ],
  },
  {
    id: 'work-best-boss',
    category: 'Work',
    emoji: '👔',
    topic: 'The best boss or teacher you have ever had.',
    followUps: [
      'What made them great?',
      'What did they do that others don\'t?',
      'Do you try to copy any of their qualities?',
    ],
  },
  {
    id: 'work-home-vs-office',
    category: 'Work',
    emoji: '🏠',
    topic: 'Working from home vs. working in an office.',
    followUps: [
      'Which do you prefer, and why?',
      'What are the hidden costs of each one?',
      'How do you think work will look in 10 years?',
    ],
  },
  {
    id: 'work-game-changing-skill',
    category: 'Work',
    emoji: '🛠️',
    topic: 'A skill that would completely change your career.',
    followUps: [
      'What skill is it?',
      'Why haven\'t you learned it yet?',
      'What\'s your realistic plan to start?',
    ],
  },
  {
    id: 'work-difficult-decision',
    category: 'Work',
    emoji: '⚖️',
    topic: 'A difficult professional decision you had to make.',
    followUps: [
      'What was at stake?',
      'Who did you talk to before deciding?',
      'Do you regret your choice, even a little?',
    ],
  },

  // ── Culture & Identity ───────────────────────────────────────────────
  {
    id: 'culture-proud-chilean',
    category: 'Culture',
    emoji: '🇨🇱',
    topic: 'Something that makes you proud of being Chilean.',
    followUps: [
      'What is it exactly?',
      'When did you first really notice it?',
      'Do foreigners usually understand it?',
    ],
  },
  {
    id: 'culture-chilean-food',
    category: 'Culture',
    emoji: '🍽️',
    topic: 'A Chilean food a foreigner absolutely must try.',
    followUps: [
      'What is it and what does it taste like?',
      'Where\'s the best place to eat it?',
      'Is it something you eat often at home?',
    ],
  },
  {
    id: 'culture-untranslatable-expression',
    category: 'Culture',
    emoji: '💬',
    topic: 'A Chilean expression that doesn\'t translate.',
    followUps: [
      'Which one do you use the most?',
      'How would you explain it to a foreigner?',
      'Is there an English expression that comes close?',
    ],
  },
  {
    id: 'culture-must-visit-place',
    category: 'Culture',
    emoji: '🏔️',
    topic: 'A place in Chile everyone should visit at least once.',
    followUps: [
      'Where is it and why is it special?',
      'What\'s the best time of year to go?',
      'Have you been there recently?',
    ],
  },
  {
    id: 'culture-change-about-chile',
    category: 'Culture',
    emoji: '🔄',
    topic: 'Something about Chilean culture you would change.',
    followUps: [
      'What is it?',
      'Why does it bother you?',
      'Do you see it slowly changing already?',
    ],
  },

  // ── Tech & Modern Life ───────────────────────────────────────────────
  {
    id: 'tech-no-social-media',
    category: 'Tech',
    emoji: '📵',
    topic: 'Life without social media for one full month.',
    followUps: [
      'Would you actually last?',
      'What would you miss the most?',
      'What do you think would improve in your life?',
    ],
  },
  {
    id: 'tech-ai-daily-life',
    category: 'Tech',
    emoji: '🤖',
    topic: 'Artificial intelligence in your daily life.',
    followUps: [
      'Where do you already use it, even without noticing?',
      'Does it worry you or excite you more?',
      'Which jobs do you think it will replace first?',
    ],
  },
  {
    id: 'tech-your-phone',
    category: 'Tech',
    emoji: '📱',
    topic: 'Your relationship with your phone.',
    followUps: [
      'How many hours a day do you really use it?',
      'When was the last time you left it at home on purpose?',
      'Which apps do you actually love, and which ones do you hate but keep?',
    ],
  },
  {
    id: 'tech-online-dating',
    category: 'Tech',
    emoji: '💘',
    topic: 'Online dating.',
    followUps: [
      'What do you honestly think of it?',
      'Would you try it — or have you already?',
      'Is it easier or harder than dating the "old way"?',
    ],
  },
  {
    id: 'tech-kids-screen-time',
    category: 'Tech',
    emoji: '📺',
    topic: 'Screen time for kids today.',
    followUps: [
      'How much is too much, in your opinion?',
      'What did you do at their age instead?',
      'Are parents today doing better or worse than yours did?',
    ],
  },

  // ── Society & Ideas ──────────────────────────────────────────────────
  {
    id: 'society-change-a-law',
    category: 'Society',
    emoji: '🏛️',
    topic: 'If you could change one law in Chile.',
    followUps: [
      'Which law, and how would you change it?',
      'Who would benefit the most?',
      'Do you think it will change in your lifetime?',
    ],
  },
  {
    id: 'society-young-people-problem',
    category: 'Society',
    emoji: '🎓',
    topic: 'The biggest problem young people face today.',
    followUps: [
      'What is it, in your opinion?',
      'Was it different when you were young?',
      'What could realistically help?',
    ],
  },
  {
    id: 'society-money-happiness',
    category: 'Society',
    emoji: '💰',
    topic: 'Money and happiness.',
    followUps: [
      'How much money do you actually need to be happy?',
      'Is the connection real, or exaggerated?',
      'When was the last time money brought you real joy?',
    ],
  },
  {
    id: 'society-define-success',
    category: 'Society',
    emoji: '🏆',
    topic: 'How you define success.',
    followUps: [
      'Is it money, freedom, family, impact, or something else?',
      'Has your definition changed with time?',
      'Who do you know that is truly successful — by your definition?',
    ],
  },
  {
    id: 'society-future-planet',
    category: 'Society',
    emoji: '🌍',
    topic: 'The future of the planet.',
    followUps: [
      'Are you optimistic or pessimistic overall?',
      'What small thing do you already do that actually helps?',
      'What frustrates you the most about how others behave?',
    ],
  },

  // ── Fun & Free Time ──────────────────────────────────────────────────
  {
    id: 'fun-hobby-never-started',
    category: 'Fun',
    emoji: '🎯',
    topic: 'A hobby you would love to start but haven\'t.',
    followUps: [
      'What is it, and why does it attract you?',
      'What has stopped you so far?',
      'When could you realistically begin?',
    ],
  },
  {
    id: 'fun-perfect-weekend',
    category: 'Fun',
    emoji: '🌤️',
    topic: 'Your perfect weekend.',
    followUps: [
      'Describe it hour by hour — from Friday night to Sunday.',
      'Who are you with?',
      'How often does a weekend like this actually happen?',
    ],
  },
  {
    id: 'fun-rewatchable-movie',
    category: 'Fun',
    emoji: '🎬',
    topic: 'A movie or series you can watch over and over.',
    followUps: [
      'Which one, and why?',
      'Which character do you connect with the most?',
      'Would you honestly recommend it to me?',
    ],
  },
  {
    id: 'fun-mood-music',
    category: 'Fun',
    emoji: '🎵',
    topic: 'Music that always changes your mood.',
    followUps: [
      'What song or artist does that for you?',
      'When do you usually play it?',
      'What memory does it bring back?',
    ],
  },
  {
    id: 'fun-book-podcast-that-changed-you',
    category: 'Fun',
    emoji: '📚',
    topic: 'A book, podcast or content creator that changed how you think.',
    followUps: [
      'Which one was it?',
      'What specific idea stuck with you?',
      'Have you recommended it to anyone since?',
    ],
  },

  // ── Travel & Adventure ───────────────────────────────────────────────
  {
    id: 'travel-unforgettable-trip',
    category: 'Travel',
    emoji: '🗺️',
    topic: 'A trip you will never forget.',
    followUps: [
      'Where did you go, and when?',
      'What surprised you the most?',
      'Would you go back, or is it a "once in a lifetime" trip?',
    ],
  },
  {
    id: 'travel-alone-vs-company',
    category: 'Travel',
    emoji: '🧳',
    topic: 'Traveling alone vs. traveling with company.',
    followUps: [
      'Which do you prefer, and why?',
      'Have you tried both?',
      'What kind of person do you need to be to handle solo travel?',
    ],
  },
  {
    id: 'travel-country-live-a-year',
    category: 'Travel',
    emoji: '🌐',
    topic: 'A country you would love to live in for a full year.',
    followUps: [
      'Which country, and why?',
      'What would be your biggest challenge?',
      'Could you actually leave Chile behind, even temporarily?',
    ],
  },
  {
    id: 'travel-worst-travel-story',
    category: 'Travel',
    emoji: '😱',
    topic: 'The worst thing that ever happened to you while traveling.',
    followUps: [
      'What went wrong?',
      'How did you eventually solve it?',
      'Do you laugh about it now?',
    ],
  },
  {
    id: 'travel-what-kind-of-tourist',
    category: 'Travel',
    emoji: '🏖️',
    topic: 'The kind of tourist you are.',
    followUps: [
      'Beach and relax, adventure, culture, or food?',
      'Has your travel style changed with age?',
      'What kind of tourist annoys you the most?',
    ],
  },

  // ── Relationships & People ───────────────────────────────────────────
  {
    id: 'rel-real-friend',
    category: 'Relationships',
    emoji: '🤝',
    topic: 'What makes a real friend.',
    followUps: [
      'What qualities matter most to you?',
      'How many "real" friends do you have?',
      'Is it harder to make friends as an adult?',
    ],
  },
  {
    id: 'rel-conversation-that-changed-you',
    category: 'Relationships',
    emoji: '🗣️',
    topic: 'A conversation that changed you.',
    followUps: [
      'Who was it with?',
      'What was said?',
      'Would you be able to have that same conversation today?',
    ],
  },
  {
    id: 'rel-love-at-first-sight',
    category: 'Relationships',
    emoji: '💞',
    topic: 'Love at first sight.',
    followUps: [
      'Do you believe in it?',
      'Have you experienced anything close to it?',
      'What matters more in the long run — chemistry or compatibility?',
    ],
  },
  {
    id: 'rel-someone-you-miss',
    category: 'Relationships',
    emoji: '💌',
    topic: 'Someone you miss.',
    followUps: [
      'Who is it?',
      'What did you love most about them?',
      'When did you last talk to them?',
    ],
  },
  {
    id: 'rel-difficult-person',
    category: 'Relationships',
    emoji: '🌪️',
    topic: 'A difficult person in your life.',
    followUps: [
      'Who are they, without naming them?',
      'How do you usually deal with them?',
      'What have they taught you — even without wanting to?',
    ],
  },
];

/** Filter the topic bank by category. Passing `null` returns the full bank. */
export function filterRandomTopics(category: RandomTopicCategory | null): RandomTopic[] {
  if (!category) return RANDOM_TOPICS;
  return RANDOM_TOPICS.filter(t => t.category === category);
}

/** Count of topics per category, in declaration order. Useful for chip labels. */
export function randomTopicCounts(): Record<RandomTopicCategory, number> {
  const counts = {} as Record<RandomTopicCategory, number>;
  RANDOM_TOPIC_CATEGORIES.forEach(c => { counts[c] = 0; });
  for (const t of RANDOM_TOPICS) counts[t.category] += 1;
  return counts;
}
