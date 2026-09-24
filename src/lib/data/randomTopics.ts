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
  | 'Relationships'
  | 'Gaming';

export interface RandomTopic {
  id:        string;
  category:  RandomTopicCategory;
  emoji:     string;
  topic:     string;          // The main prompt shown big on the card
  followUps: string[];        // Exactly 3 questions to develop the conversation
}

export const RANDOM_TOPIC_CATEGORIES: RandomTopicCategory[] = [
  'Life', 'Work', 'Culture', 'Tech', 'Society', 'Fun', 'Travel', 'Relationships', 'Gaming',
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
  'Gaming':        { icon: '🎮', gradient: 'from-purple-600 to-pink-600',    chipBg: 'bg-purple-600',   chipText: 'text-white' },
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

  // ── Gaming ───────────────────────────────────────────────────────────
  {
    id: 'gaming-first-obsession',
    category: 'Gaming',
    emoji: '🕹️',
    topic: 'The first game you got completely obsessed with.',
    followUps: [
      'What was it, and how old were you?',
      'How many hours a day were you sinking into it?',
      'Did anyone in your life try to pull you away from it?',
    ],
  },
  {
    id: 'gaming-best-multiplayer-moment',
    category: 'Gaming',
    emoji: '🎧',
    topic: 'A moment online with friends you still talk about.',
    followUps: [
      'What game was it, and who were you playing with?',
      'What happened — a clutch win, a wipe, something ridiculous?',
      'Do you still play together?',
    ],
  },
  {
    id: 'gaming-rage-quit',
    category: 'Gaming',
    emoji: '💢',
    topic: 'The last time a game truly made you rage.',
    followUps: [
      'What was going wrong — bad teammates, difficulty, lag?',
      'Did you throw anything, unplug, walk away?',
      'How long before you booted it back up?',
    ],
  },
  {
    id: 'gaming-story-that-stayed',
    category: 'Gaming',
    emoji: '📖',
    topic: 'A game story that stayed with you like a movie would.',
    followUps: [
      'Which game, and which moment in particular?',
      'What did it make you feel — grief, awe, guilt, hope?',
      'Would you replay it, or is it better as a memory?',
    ],
  },
  {
    id: 'gaming-comfort-game',
    category: 'Gaming',
    emoji: '🛋️',
    topic: 'Your comfort game — the one you go back to on a bad day.',
    followUps: [
      'What is it, and what makes it feel like home?',
      'How is it different from the games you play to compete?',
      'What was going on in your life when you first fell for it?',
    ],
  },

  // ── Extra variety across existing categories ────────────────────────
  {
    id: 'fun-guilty-pleasure-show',
    category: 'Fun',
    emoji: '📺',
    topic: 'A show or movie you\'d never admit you love — but you do.',
    followUps: [
      'What is it, and why the secrecy?',
      'Who would tease you if they found out?',
      'What does it give you that "prestige" stuff doesn\'t?',
    ],
  },
  {
    id: 'tech-app-cant-delete',
    category: 'Tech',
    emoji: '📲',
    topic: 'The app you keep saying you\'ll delete but never do.',
    followUps: [
      'Which one, and what pulled you back the last time you tried?',
      'How much time does it actually eat from your day?',
      'What would replace it if it were gone tomorrow?',
    ],
  },
  {
    id: 'life-small-daily-ritual',
    category: 'Life',
    emoji: '☕',
    topic: 'A tiny daily ritual that grounds you.',
    followUps: [
      'When does it happen, and what does it look like?',
      'How do you feel on the days you skip it?',
      'Would it still work if someone else joined in?',
    ],
  },
  {
    id: 'work-mistake-that-taught-you',
    category: 'Work',
    emoji: '🧯',
    topic: 'A mistake at work that ended up teaching you something big.',
    followUps: [
      'What happened, and how public was the mess?',
      'How did the people around you react?',
      'Would you make it again on purpose if it meant learning the same thing?',
    ],
  },

  // ── Second pass — bring every category up to 10 ─────────────────────

  // Life ×4
  {
    id: 'life-nickname',
    category: 'Life',
    emoji: '🏷️',
    topic: 'A nickname you\'ve had — one you loved or one you hated.',
    followUps: [
      'Who started calling you that, and when?',
      'How did you feel about it back then vs. now?',
      'Does anyone still use it?',
    ],
  },
  {
    id: 'life-superstition',
    category: 'Life',
    emoji: '🍀',
    topic: 'A superstition you secretly still follow.',
    followUps: [
      'What is it, and where did you pick it up?',
      'Have you ever "tested" it on purpose?',
      'Would you feel weird breaking it, honestly?',
    ],
  },
  {
    id: 'life-advice-to-younger-self',
    category: 'Life',
    emoji: '⏳',
    topic: 'Advice you\'d give your 15-year-old self.',
    followUps: [
      'What\'s the one thing you\'d say first?',
      'Would younger-you have actually listened?',
      'Is there anything you\'re glad they didn\'t know yet?',
    ],
  },
  {
    id: 'life-first-adult-moment',
    category: 'Life',
    emoji: '🗝️',
    topic: 'The exact moment you realized you were an adult.',
    followUps: [
      'What were you doing?',
      'Was it exciting, scary, or just quiet?',
      'Do you feel like an adult every day, or does it come and go?',
    ],
  },

  // Work ×4
  {
    id: 'work-worst-interview',
    category: 'Work',
    emoji: '😬',
    topic: 'Your worst job interview.',
    followUps: [
      'What went wrong — you, them, or both?',
      'Did you get the job anyway?',
      'What would you do differently now?',
    ],
  },
  {
    id: 'work-side-project',
    category: 'Work',
    emoji: '🧪',
    topic: 'A side project or idea you can\'t stop thinking about.',
    followUps: [
      'What is it, in one sentence?',
      'What\'s the tiniest first step you could take this week?',
      'What are you actually afraid of if you try it?',
    ],
  },
  {
    id: 'work-annoying-habit',
    category: 'Work',
    emoji: '🙄',
    topic: 'A coworker habit that drives you quietly crazy.',
    followUps: [
      'What is it, and who does it?',
      'Have you ever said something, or just suffered in silence?',
      'Do you have a habit that probably annoys them back?',
    ],
  },
  {
    id: 'work-money-vs-passion',
    category: 'Work',
    emoji: '💸',
    topic: 'Money vs. passion when choosing a job.',
    followUps: [
      'Which one are you leaning on right now?',
      'Have you ever chosen one over the other and regretted it?',
      'Is "do what you love" honest advice, or a bit of a lie?',
    ],
  },

  // Culture ×5
  {
    id: 'culture-santiago-vs-regions',
    category: 'Culture',
    emoji: '🚆',
    topic: 'Santiago vs. the rest of Chile.',
    followUps: [
      'Which one do you feel closer to?',
      'What does each one get right that the other doesn\'t?',
      'If you had to move tomorrow, where would you go?',
    ],
  },
  {
    id: 'culture-chilean-humor',
    category: 'Culture',
    emoji: '😂',
    topic: 'What makes Chilean humor different.',
    followUps: [
      'How would you describe it to someone from another country?',
      'Who is the funniest person you know in real life?',
      'Does it translate on the internet, or is it a "you had to be there" thing?',
    ],
  },
  {
    id: 'culture-18-de-septiembre',
    category: 'Culture',
    emoji: '🎉',
    topic: 'How you actually spend the 18 de septiembre.',
    followUps: [
      'Family asado, ramada, escape from the city, or none of the above?',
      'What\'s the one dish you can\'t skip?',
      'Do you enjoy it, or is it more of an obligation now?',
    ],
  },
  {
    id: 'culture-foreign-obsession',
    category: 'Culture',
    emoji: '🎌',
    topic: 'A foreign culture you\'re a little obsessed with.',
    followUps: [
      'Which one, and how did it start?',
      'What have you learned or picked up from it?',
      'Would you actually want to live there, or just visit?',
    ],
  },
  {
    id: 'culture-generation-gap',
    category: 'Culture',
    emoji: '👴',
    topic: 'Something your parents\' generation did that yours never would.',
    followUps: [
      'What is it, and why has it disappeared?',
      'Do you actually miss it, or is it better gone?',
      'What will your generation be remembered for?',
    ],
  },

  // Tech ×4
  {
    id: 'tech-first-computer',
    category: 'Tech',
    emoji: '💾',
    topic: 'Your first computer, console or phone.',
    followUps: [
      'What was it, and how did you get it?',
      'What did you spend most of your time doing on it?',
      'What would it feel like to hold it again today?',
    ],
  },
  {
    id: 'tech-regret-purchase',
    category: 'Tech',
    emoji: '🧾',
    topic: 'A tech purchase you completely regret.',
    followUps: [
      'What was it, and what did it promise?',
      'How long before you knew it was a mistake?',
      'Do you still own it, or did you get rid of it?',
    ],
  },
  {
    id: 'tech-privacy',
    category: 'Tech',
    emoji: '🕵️',
    topic: 'What you actually think about apps tracking everything you do.',
    followUps: [
      'Does it bother you, or have you made peace with it?',
      'What\'s the creepiest ad or recommendation you\'ve ever gotten?',
      'Would you pay to opt out completely?',
    ],
  },
  {
    id: 'tech-remote-friendship',
    category: 'Tech',
    emoji: '📨',
    topic: 'A friendship that only exists through messages.',
    followUps: [
      'Who is it, and how did it start?',
      'Is it as real as the in-person ones, honestly?',
      'What would happen if you actually met up?',
    ],
  },

  // Society ×5
  {
    id: 'society-education-broken',
    category: 'Society',
    emoji: '🏫',
    topic: 'What\'s broken about the education system today.',
    followUps: [
      'What\'s the biggest thing you\'d fix?',
      'What did school teach you that turned out to be useless?',
      'What should schools teach that they don\'t?',
    ],
  },
  {
    id: 'society-cancel-culture',
    category: 'Society',
    emoji: '🚫',
    topic: 'Cancel culture — real problem or overblown?',
    followUps: [
      'Where do you actually land on it?',
      'Have you ever changed your mind about someone who was "cancelled"?',
      'Is there a line, and where would you draw it?',
    ],
  },
  {
    id: 'society-mental-health',
    category: 'Society',
    emoji: '🧠',
    topic: 'How your generation talks about mental health.',
    followUps: [
      'Is it healthier now, or has it become a trend?',
      'What did your parents\' generation get right or wrong about it?',
      'Do you find it easy to talk about your own?',
    ],
  },
  {
    id: 'society-work-life-boundary',
    category: 'Society',
    emoji: '🛑',
    topic: 'The blurring line between work and personal life.',
    followUps: [
      'Do you check work messages after hours?',
      'Whose responsibility is it to draw the line — you or your job?',
      'When was the last time you truly disconnected?',
    ],
  },
  {
    id: 'society-consumerism',
    category: 'Society',
    emoji: '🛍️',
    topic: 'Something you own way too many of.',
    followUps: [
      'What is it, and how did that happen?',
      'What do you think is really behind buying more of it?',
      'Could you go a year without buying another one?',
    ],
  },

  // Fun ×4
  {
    id: 'fun-comfort-food-secret',
    category: 'Fun',
    emoji: '🍜',
    topic: 'A comfort food you only eat when nobody\'s watching.',
    followUps: [
      'What is it, and why the secrecy?',
      'When do you usually reach for it?',
      'Would you order it in front of a date?',
    ],
  },
  {
    id: 'fun-danced-and-meant-it',
    category: 'Fun',
    emoji: '💃',
    topic: 'The last time you danced and actually meant it.',
    followUps: [
      'Where were you, and what was playing?',
      'Who were you with — or were you alone?',
      'How long since the time before that?',
    ],
  },
  {
    id: 'fun-nostalgia-album',
    category: 'Fun',
    emoji: '💿',
    topic: 'An album that instantly transports you to a specific year.',
    followUps: [
      'Which album, and what year?',
      'What were you doing back then?',
      'Can you still listen to it without feeling something?',
    ],
  },
  {
    id: 'fun-hidden-talent',
    category: 'Fun',
    emoji: '🎩',
    topic: 'A hidden talent nobody thinks to ask you about.',
    followUps: [
      'What is it, and how did you get good at it?',
      'When was the last time you actually used it?',
      'Could you make money from it if you wanted to?',
    ],
  },

  // Travel ×5
  {
    id: 'travel-hyped-city-disappointment',
    category: 'Travel',
    emoji: '📍',
    topic: 'A hyped city that turned out to disappoint you.',
    followUps: [
      'Where was it, and what were you expecting?',
      'What was actually the problem — the place, or your mood?',
      'Would you give it a second chance?',
    ],
  },
  {
    id: 'travel-best-food-abroad',
    category: 'Travel',
    emoji: '🍽️',
    topic: 'The best thing you ever ate in another country.',
    followUps: [
      'Where were you, and what were you eating?',
      'Can you get anything close to it here?',
      'Would you fly back just for that meal?',
    ],
  },
  {
    id: 'travel-stranger-helped',
    category: 'Travel',
    emoji: '🤲',
    topic: 'A stranger who helped you in a country you didn\'t know.',
    followUps: [
      'What was going wrong before they showed up?',
      'How did the two of you even communicate?',
      'Do you think you\'d do the same for a tourist here?',
    ],
  },
  {
    id: 'travel-packing-style',
    category: 'Travel',
    emoji: '🎒',
    topic: 'Your packing philosophy.',
    followUps: [
      'Minimalist, over-prepared, or last-minute chaos?',
      'What\'s the one thing you always forget?',
      'What\'s the weirdest thing you always take?',
    ],
  },
  {
    id: 'travel-tourist-trap-worth-it',
    category: 'Travel',
    emoji: '🎪',
    topic: 'A "tourist trap" that was actually worth it.',
    followUps: [
      'Which one, and why do people usually skip it?',
      'What surprised you about it?',
      'Would you tell friends to go, or keep it to yourself?',
    ],
  },

  // Relationships ×5
  {
    id: 'rel-family-story-late',
    category: 'Relationships',
    emoji: '🗂️',
    topic: 'A family story you only fully understood as an adult.',
    followUps: [
      'What was the story, roughly?',
      'What did you assume as a kid, and what was really going on?',
      'Has it changed how you see the person involved?',
    ],
  },
  {
    id: 'rel-forgiveness',
    category: 'Relationships',
    emoji: '🕊️',
    topic: 'Someone you forgave — or someone you probably should.',
    followUps: [
      'What did they do, without naming them?',
      'What did forgiving them (or not) actually cost you?',
      'Would you handle it the same way today?',
    ],
  },
  {
    id: 'rel-first-crush',
    category: 'Relationships',
    emoji: '💘',
    topic: 'Your first real crush.',
    followUps: [
      'Who were they, and how old were you?',
      'Did they ever find out?',
      'What was it about them, honestly, looking back?',
    ],
  },
  {
    id: 'rel-hard-goodbye',
    category: 'Relationships',
    emoji: '👋',
    topic: 'A goodbye that hit harder than you expected.',
    followUps: [
      'Who or what were you saying goodbye to?',
      'What tipped it from routine into something heavier?',
      'Would you do the goodbye differently now?',
    ],
  },
  {
    id: 'rel-boundary-set',
    category: 'Relationships',
    emoji: '🧱',
    topic: 'A boundary you had to set with someone close.',
    followUps: [
      'What was crossing the line?',
      'How did they react when you finally said it?',
      'What did setting it teach you about the relationship?',
    ],
  },

  // Gaming ×5
  {
    id: 'gaming-character-crush',
    category: 'Gaming',
    emoji: '💖',
    topic: 'A game character you kind of fell for.',
    followUps: [
      'Who was it, and what game?',
      'What was it about them — looks, story, voice, all of it?',
      'Would that same character work as a real person?',
    ],
  },
  {
    id: 'gaming-side-character-remembered',
    category: 'Gaming',
    emoji: '🗨️',
    topic: 'A minor character or side quest you still remember years later.',
    followUps: [
      'What was it, and why did it stick?',
      'Did the main story even need it?',
      'What kind of story tends to stay with you the longest?',
    ],
  },
  {
    id: 'gaming-cheat-or-not',
    category: 'Gaming',
    emoji: '🃏',
    topic: 'The time you cheated in a game — or refused to.',
    followUps: [
      'What was the game and the temptation?',
      'What did cheating (or resisting) actually feel like?',
      'Is there a line between "cheating" and "playing smart"?',
    ],
  },
  {
    id: 'gaming-console-bring-back',
    category: 'Gaming',
    emoji: '📼',
    topic: 'An old console or era of gaming you\'d bring back.',
    followUps: [
      'Which one, and what did it get right?',
      'What would kids today not understand about it?',
      'Was it actually better, or is it just nostalgia?',
    ],
  },
  {
    id: 'gaming-outgrew',
    category: 'Gaming',
    emoji: '🚪',
    topic: 'A game or genre you\'ve completely outgrown.',
    followUps: [
      'What used to hook you about it?',
      'What changed — you, the games, or both?',
      'Is there anything you miss about that phase?',
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
