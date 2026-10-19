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
  | 'Gaming'
  | 'Food'
  | 'Health'
  | 'Nature'
  | 'Money';

export interface RandomTopic {
  id:        string;
  category:  RandomTopicCategory;
  emoji:     string;
  topic:     string;          // The main prompt shown big on the card
  followUps: string[];        // Exactly 3 short follow-up questions
}

export const RANDOM_TOPIC_CATEGORIES: RandomTopicCategory[] = [
  'Life', 'Work', 'Culture', 'Tech', 'Society', 'Fun', 'Travel', 'Relationships', 'Gaming',
  'Food', 'Health', 'Nature', 'Money',
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
  'Food':          { icon: '🍜', gradient: 'from-lime-500 to-green-600',     chipBg: 'bg-lime-600',     chipText: 'text-white' },
  'Health':        { icon: '🧘', gradient: 'from-teal-400 to-emerald-600',   chipBg: 'bg-teal-600',     chipText: 'text-white' },
  'Nature':        { icon: '🌿', gradient: 'from-green-500 to-emerald-700',  chipBg: 'bg-green-700',    chipText: 'text-white' },
  'Money':         { icon: '💰', gradient: 'from-yellow-500 to-amber-600',   chipBg: 'bg-amber-600',    chipText: 'text-white' },
};

export const RANDOM_TOPICS: RandomTopic[] = [

  // ── Life & Growing Up ────────────────────────────────────────────────
  { id: 'life-childhood-memory', category: 'Life', emoji: '🧸', topic: 'A childhood memory that makes you smile.',
    followUps: [
      'Where were you?',
      'Who was with you?',
      'Why do you still remember it?',
    ] },
  { id: 'life-influential-person', category: 'Life', emoji: '🌟', topic: 'The person who influenced you most.',
    followUps: [
      'Who are they?',
      'How did you meet?',
      'What did they teach you?',
    ] },
  { id: 'life-time-you-failed', category: 'Life', emoji: '💥', topic: 'A time you failed at something.',
    followUps: [
      'What were you trying to do?',
      'How did you feel after?',
      'What did it teach you?',
    ] },
  { id: 'life-teenage-years', category: 'Life', emoji: '🎧', topic: 'You as a teenager.',
    followUps: [
      'What were you like?',
      'What music or shows did you love?',
      'What would you tell your 15-year-old self?',
    ] },
  { id: 'life-family-tradition', category: 'Life', emoji: '🕯️', topic: 'A family tradition you keep.',
    followUps: [
      'What is it and when do you do it?',
      'Where does it come from?',
      'Will you keep it in the future?',
    ] },
  { id: 'life-nickname', category: 'Life', emoji: '🏷️', topic: 'A nickname you had.',
    followUps: [
      'Who gave it to you?',
      'Did you like it?',
      'Does anyone still use it?',
    ] },
  { id: 'life-superstition', category: 'Life', emoji: '🍀', topic: 'A superstition you still follow.',
    followUps: [
      'What is it?',
      'Where did you learn it?',
      'Does it really work?',
    ] },
  { id: 'life-advice-to-younger-self', category: 'Life', emoji: '⏳', topic: 'Advice for your younger self.',
    followUps: [
      'What would you say first?',
      'Would you have listened?',
      'What are you glad they didn\'t know?',
    ] },
  { id: 'life-first-adult-moment', category: 'Life', emoji: '🗝️', topic: 'The moment you felt like an adult.',
    followUps: [
      'What were you doing?',
      'Was it scary or exciting?',
      'Do you feel like an adult every day?',
    ] },
  { id: 'life-small-daily-ritual', category: 'Life', emoji: '☕', topic: 'A small daily ritual you love.',
    followUps: [
      'What is it?',
      'How do you feel when you skip it?',
      'Do you do it alone or with someone?',
    ] },

  // ── Work & Ambitions ─────────────────────────────────────────────────
  { id: 'work-dream-job', category: 'Work', emoji: '🚀', topic: 'Your dream job.',
    followUps: [
      'What does a normal day look like?',
      'Is it a realistic goal?',
      'What stops you from starting?',
    ] },
  { id: 'work-best-boss', category: 'Work', emoji: '👔', topic: 'The best boss or teacher you had.',
    followUps: [
      'What made them special?',
      'What did they do differently?',
      'Do you copy anything from them?',
    ] },
  { id: 'work-home-vs-office', category: 'Work', emoji: '🏠', topic: 'Working from home or in an office.',
    followUps: [
      'Which do you prefer?',
      'What are the pros and cons?',
      'How will work look in 10 years?',
    ] },
  { id: 'work-game-changing-skill', category: 'Work', emoji: '🛠️', topic: 'A skill that would change your career.',
    followUps: [
      'What skill is it?',
      'Why haven\'t you learned it yet?',
      'What is your plan to start?',
    ] },
  { id: 'work-difficult-decision', category: 'Work', emoji: '⚖️', topic: 'A hard decision at work.',
    followUps: [
      'What was the choice?',
      'Who did you ask for advice?',
      'Do you regret it?',
    ] },
  { id: 'work-worst-interview', category: 'Work', emoji: '😬', topic: 'Your worst job interview.',
    followUps: [
      'What went wrong?',
      'Did you get the job?',
      'What would you do differently?',
    ] },
  { id: 'work-side-project', category: 'Work', emoji: '🧪', topic: 'A side project you think about.',
    followUps: [
      'What is it, in one sentence?',
      'What is the first small step?',
      'What are you afraid of?',
    ] },
  { id: 'work-annoying-habit', category: 'Work', emoji: '🙄', topic: 'A coworker habit that annoys you.',
    followUps: [
      'What is it?',
      'Did you ever say something?',
      'Do you have a habit that annoys them?',
    ] },
  { id: 'work-money-vs-passion', category: 'Work', emoji: '💸', topic: 'Money or passion in your job.',
    followUps: [
      'Which one matters more now?',
      'Did you ever choose one and regret it?',
      'Is "do what you love" good advice?',
    ] },
  { id: 'work-mistake-that-taught-you', category: 'Work', emoji: '🧯', topic: 'A work mistake that taught you something.',
    followUps: [
      'What happened?',
      'How did people react?',
      'What did you learn?',
    ] },

  // ── Culture & Identity ───────────────────────────────────────────────
  { id: 'culture-proud-chilean', category: 'Culture', emoji: '🇨🇱', topic: 'Something that makes you proud of Chile.',
    followUps: [
      'What is it?',
      'When did you first notice it?',
      'Do foreigners understand it?',
    ] },
  { id: 'culture-chilean-food', category: 'Culture', emoji: '🍽️', topic: 'A Chilean food every foreigner should try.',
    followUps: [
      'What is it and how does it taste?',
      'Where is the best place to eat it?',
      'Do you eat it often at home?',
    ] },
  { id: 'culture-untranslatable-expression', category: 'Culture', emoji: '💬', topic: 'A Chilean expression that is hard to translate.',
    followUps: [
      'Which one do you use most?',
      'How would you explain it in English?',
      'Is there a similar expression in English?',
    ] },
  { id: 'culture-must-visit-place', category: 'Culture', emoji: '🏔️', topic: 'A place in Chile everyone should visit.',
    followUps: [
      'Where is it and why?',
      'When is the best time to go?',
      'Have you been there recently?',
    ] },
  { id: 'culture-change-about-chile', category: 'Culture', emoji: '🔄', topic: 'Something you would change about Chile.',
    followUps: [
      'What is it?',
      'Why does it bother you?',
      'Is it already changing?',
    ] },
  { id: 'culture-santiago-vs-regions', category: 'Culture', emoji: '🚆', topic: 'Santiago or the regions.',
    followUps: [
      'Which do you prefer?',
      'What does each one do best?',
      'Where would you move tomorrow?',
    ] },
  { id: 'culture-chilean-humor', category: 'Culture', emoji: '😂', topic: 'What makes Chilean humor different.',
    followUps: [
      'How would you describe it?',
      'Who is the funniest person you know?',
      'Does it work on the internet?',
    ] },
  { id: 'culture-18-de-septiembre', category: 'Culture', emoji: '🎉', topic: 'How you spend the 18 de septiembre.',
    followUps: [
      'Asado, ramada, or something else?',
      'What dish can you not skip?',
      'Do you enjoy it or feel it is a duty?',
    ] },
  { id: 'culture-foreign-obsession', category: 'Culture', emoji: '🎌', topic: 'A foreign culture you love.',
    followUps: [
      'Which one and how did it start?',
      'What have you learned from it?',
      'Would you live there?',
    ] },
  { id: 'culture-generation-gap', category: 'Culture', emoji: '👴', topic: 'Something your parents did that your generation doesn\'t.',
    followUps: [
      'What is it?',
      'Do you miss it?',
      'What will your generation be remembered for?',
    ] },

  // ── Tech & Modern Life ───────────────────────────────────────────────
  { id: 'tech-no-social-media', category: 'Tech', emoji: '📵', topic: 'A month without social media.',
    followUps: [
      'Could you really do it?',
      'What would you miss most?',
      'What would get better in your life?',
    ] },
  { id: 'tech-ai-daily-life', category: 'Tech', emoji: '🤖', topic: 'AI in your daily life.',
    followUps: [
      'Where do you use it already?',
      'Does it worry you or excite you?',
      'Which jobs will it replace first?',
    ] },
  { id: 'tech-your-phone', category: 'Tech', emoji: '📱', topic: 'Your relationship with your phone.',
    followUps: [
      'How many hours a day do you use it?',
      'When did you last leave it at home?',
      'Which apps do you love or hate?',
    ] },
  { id: 'tech-online-dating', category: 'Tech', emoji: '💘', topic: 'Online dating.',
    followUps: [
      'What do you think about it?',
      'Would you try it?',
      'Is it easier or harder than before?',
    ] },
  { id: 'tech-kids-screen-time', category: 'Tech', emoji: '📺', topic: 'Screen time for kids today.',
    followUps: [
      'How much is too much?',
      'What did you do at their age?',
      'Are parents today doing better or worse?',
    ] },
  { id: 'tech-app-cant-delete', category: 'Tech', emoji: '📲', topic: 'An app you want to delete but can\'t.',
    followUps: [
      'Which one?',
      'How much time does it take?',
      'What would replace it?',
    ] },
  { id: 'tech-first-computer', category: 'Tech', emoji: '💾', topic: 'Your first computer, console or phone.',
    followUps: [
      'What was it?',
      'What did you do on it?',
      'How would it feel to use it today?',
    ] },
  { id: 'tech-regret-purchase', category: 'Tech', emoji: '🧾', topic: 'A tech purchase you regret.',
    followUps: [
      'What was it?',
      'How soon did you know?',
      'Do you still have it?',
    ] },
  { id: 'tech-privacy', category: 'Tech', emoji: '🕵️', topic: 'Apps that track everything you do.',
    followUps: [
      'Does it bother you?',
      'What is the creepiest ad you have seen?',
      'Would you pay to stop it?',
    ] },
  { id: 'tech-remote-friendship', category: 'Tech', emoji: '📨', topic: 'A friendship that is only online.',
    followUps: [
      'Who is it and how did it start?',
      'Is it as real as in-person friends?',
      'What would happen if you met?',
    ] },

  // ── Society & Ideas ──────────────────────────────────────────────────
  { id: 'society-change-a-law', category: 'Society', emoji: '🏛️', topic: 'A law you would change in Chile.',
    followUps: [
      'Which law and how?',
      'Who would benefit most?',
      'Will it change in your lifetime?',
    ] },
  { id: 'society-young-people-problem', category: 'Society', emoji: '🎓', topic: 'The biggest problem for young people today.',
    followUps: [
      'What is it?',
      'Was it different when you were young?',
      'What could help?',
    ] },
  { id: 'society-money-happiness', category: 'Society', emoji: '💰', topic: 'Money and happiness.',
    followUps: [
      'How much money do you need to be happy?',
      'Is the connection real?',
      'When did money bring you real joy?',
    ] },
  { id: 'society-define-success', category: 'Society', emoji: '🏆', topic: 'How you define success.',
    followUps: [
      'Money, family, freedom, or something else?',
      'Has your idea changed over time?',
      'Who do you know that is really successful?',
    ] },
  { id: 'society-future-planet', category: 'Society', emoji: '🌍', topic: 'The future of the planet.',
    followUps: [
      'Are you optimistic or not?',
      'What small thing do you do to help?',
      'What frustrates you most?',
    ] },
  { id: 'society-education-broken', category: 'Society', emoji: '🏫', topic: 'What is wrong with schools today.',
    followUps: [
      'What would you fix first?',
      'What did school teach you that was useless?',
      'What should schools teach that they don\'t?',
    ] },
  { id: 'society-cancel-culture', category: 'Society', emoji: '🚫', topic: 'Cancel culture — real or exaggerated?',
    followUps: [
      'What do you think about it?',
      'Have you ever changed your mind about someone cancelled?',
      'Where is the limit?',
    ] },
  { id: 'society-mental-health', category: 'Society', emoji: '🧠', topic: 'How your generation talks about mental health.',
    followUps: [
      'Is it healthier now?',
      'What did your parents\' generation get right or wrong?',
      'Is it easy to talk about yours?',
    ] },
  { id: 'society-work-life-boundary', category: 'Society', emoji: '🛑', topic: 'Work and personal life.',
    followUps: [
      'Do you check work messages after hours?',
      'Whose job is it to set the limit?',
      'When did you really disconnect last?',
    ] },
  { id: 'society-consumerism', category: 'Society', emoji: '🛍️', topic: 'Something you have too many of.',
    followUps: [
      'What is it?',
      'Why do you keep buying more?',
      'Could you stop for a year?',
    ] },

  // ── Fun & Free Time ──────────────────────────────────────────────────
  { id: 'fun-hobby-never-started', category: 'Fun', emoji: '🎯', topic: 'A hobby you want to start but haven\'t.',
    followUps: [
      'What is it?',
      'What stops you?',
      'When could you start?',
    ] },
  { id: 'fun-perfect-weekend', category: 'Fun', emoji: '🌤️', topic: 'Your perfect weekend.',
    followUps: [
      'What does it look like?',
      'Who is with you?',
      'How often does it really happen?',
    ] },
  { id: 'fun-rewatchable-movie', category: 'Fun', emoji: '🎬', topic: 'A movie or show you watch again and again.',
    followUps: [
      'Which one?',
      'Which character do you connect with?',
      'Would you recommend it?',
    ] },
  { id: 'fun-mood-music', category: 'Fun', emoji: '🎵', topic: 'Music that changes your mood.',
    followUps: [
      'What song or artist?',
      'When do you play it?',
      'What memory does it bring?',
    ] },
  { id: 'fun-book-podcast-that-changed-you', category: 'Fun', emoji: '📚', topic: 'A book or podcast that changed how you think.',
    followUps: [
      'Which one?',
      'What idea stuck with you?',
      'Have you recommended it?',
    ] },
  { id: 'fun-guilty-pleasure-show', category: 'Fun', emoji: '📺', topic: 'A show you love but don\'t admit.',
    followUps: [
      'What is it?',
      'Who would tease you?',
      'Why do you like it?',
    ] },
  { id: 'fun-comfort-food-secret', category: 'Fun', emoji: '🍜', topic: 'A food you only eat alone.',
    followUps: [
      'What is it?',
      'When do you eat it?',
      'Would you eat it on a date?',
    ] },
  { id: 'fun-danced-and-meant-it', category: 'Fun', emoji: '💃', topic: 'The last time you really danced.',
    followUps: [
      'Where and what was playing?',
      'Who were you with?',
      'How long since the time before?',
    ] },
  { id: 'fun-nostalgia-album', category: 'Fun', emoji: '💿', topic: 'An album that reminds you of a year.',
    followUps: [
      'Which album and year?',
      'What were you doing then?',
      'Can you still listen without feeling emotional?',
    ] },
  { id: 'fun-hidden-talent', category: 'Fun', emoji: '🎩', topic: 'A talent nobody knows about.',
    followUps: [
      'What is it?',
      'When did you last use it?',
      'Could you make money from it?',
    ] },

  // ── Travel & Adventure ───────────────────────────────────────────────
  { id: 'travel-unforgettable-trip', category: 'Travel', emoji: '🗺️', topic: 'A trip you will never forget.',
    followUps: [
      'Where and when?',
      'What surprised you?',
      'Would you go back?',
    ] },
  { id: 'travel-alone-vs-company', category: 'Travel', emoji: '🧳', topic: 'Traveling alone or with people.',
    followUps: [
      'Which do you prefer?',
      'Have you tried both?',
      'Can you handle solo travel?',
    ] },
  { id: 'travel-country-live-a-year', category: 'Travel', emoji: '🌐', topic: 'A country you\'d live in for a year.',
    followUps: [
      'Which country?',
      'What would be hard?',
      'Could you really leave Chile?',
    ] },
  { id: 'travel-worst-travel-story', category: 'Travel', emoji: '😱', topic: 'The worst thing that happened while traveling.',
    followUps: [
      'What went wrong?',
      'How did you solve it?',
      'Do you laugh about it now?',
    ] },
  { id: 'travel-what-kind-of-tourist', category: 'Travel', emoji: '🏖️', topic: 'What kind of tourist you are.',
    followUps: [
      'Beach, adventure, culture, or food?',
      'Has your travel style changed?',
      'What tourist habit annoys you?',
    ] },
  { id: 'travel-hyped-city-disappointment', category: 'Travel', emoji: '📍', topic: 'A famous city that disappointed you.',
    followUps: [
      'Where was it?',
      'What was the problem?',
      'Would you give it another chance?',
    ] },
  { id: 'travel-best-food-abroad', category: 'Travel', emoji: '🍽️', topic: 'The best thing you ate in another country.',
    followUps: [
      'Where and what?',
      'Can you find it here?',
      'Would you fly back for it?',
    ] },
  { id: 'travel-stranger-helped', category: 'Travel', emoji: '🤲', topic: 'A stranger who helped you abroad.',
    followUps: [
      'What happened?',
      'How did you communicate?',
      'Would you do the same for a tourist?',
    ] },
  { id: 'travel-packing-style', category: 'Travel', emoji: '🎒', topic: 'How you pack for a trip.',
    followUps: [
      'Minimalist, over-prepared, or last-minute?',
      'What do you always forget?',
      'What is the weirdest thing you take?',
    ] },
  { id: 'travel-tourist-trap-worth-it', category: 'Travel', emoji: '🎪', topic: 'A tourist trap that was worth it.',
    followUps: [
      'Which one?',
      'What surprised you?',
      'Would you tell friends to go?',
    ] },

  // ── Relationships & People ───────────────────────────────────────────
  { id: 'rel-real-friend', category: 'Relationships', emoji: '🤝', topic: 'What makes a real friend.',
    followUps: [
      'What qualities matter most?',
      'How many real friends do you have?',
      'Is it harder to make friends as an adult?',
    ] },
  { id: 'rel-conversation-that-changed-you', category: 'Relationships', emoji: '🗣️', topic: 'A conversation that changed you.',
    followUps: [
      'Who was it with?',
      'What was said?',
      'Could you have the same talk today?',
    ] },
  { id: 'rel-love-at-first-sight', category: 'Relationships', emoji: '💞', topic: 'Love at first sight.',
    followUps: [
      'Do you believe in it?',
      'Have you ever felt it?',
      'Chemistry or compatibility?',
    ] },
  { id: 'rel-someone-you-miss', category: 'Relationships', emoji: '💌', topic: 'Someone you miss.',
    followUps: [
      'Who is it?',
      'What do you miss most?',
      'When did you last talk?',
    ] },
  { id: 'rel-difficult-person', category: 'Relationships', emoji: '🌪️', topic: 'A difficult person in your life.',
    followUps: [
      'Who is it (no names)?',
      'How do you deal with them?',
      'What have they taught you?',
    ] },
  { id: 'rel-family-story-late', category: 'Relationships', emoji: '🗂️', topic: 'A family story you only understood as an adult.',
    followUps: [
      'What is the story?',
      'What did you think as a kid?',
      'Did it change how you see them?',
    ] },
  { id: 'rel-forgiveness', category: 'Relationships', emoji: '🕊️', topic: 'Someone you forgave or should forgive.',
    followUps: [
      'What did they do?',
      'What did forgiving cost you?',
      'Would you do it the same today?',
    ] },
  { id: 'rel-first-crush', category: 'Relationships', emoji: '💘', topic: 'Your first real crush.',
    followUps: [
      'Who were they?',
      'Did they ever find out?',
      'What did you like about them?',
    ] },
  { id: 'rel-hard-goodbye', category: 'Relationships', emoji: '👋', topic: 'A goodbye that was hard.',
    followUps: [
      'Who were you saying goodbye to?',
      'Why was it so hard?',
      'Would you say goodbye differently now?',
    ] },
  { id: 'rel-boundary-set', category: 'Relationships', emoji: '🧱', topic: 'A limit you set with someone close.',
    followUps: [
      'What was the problem?',
      'How did they react?',
      'What did you learn?',
    ] },

  // ── Gaming ───────────────────────────────────────────────────────────
  { id: 'gaming-first-obsession', category: 'Gaming', emoji: '🕹️', topic: 'The first game you were obsessed with.',
    followUps: [
      'What was it and how old were you?',
      'How many hours a day did you play?',
      'Did anyone try to stop you?',
    ] },
  { id: 'gaming-best-multiplayer-moment', category: 'Gaming', emoji: '🎧', topic: 'A moment online with friends you still remember.',
    followUps: [
      'Which game and who with?',
      'What happened?',
      'Do you still play together?',
    ] },
  { id: 'gaming-rage-quit', category: 'Gaming', emoji: '💢', topic: 'The last time a game made you angry.',
    followUps: [
      'What went wrong?',
      'Did you throw anything or walk away?',
      'How long before you played again?',
    ] },
  { id: 'gaming-story-that-stayed', category: 'Gaming', emoji: '📖', topic: 'A game story that stayed with you.',
    followUps: [
      'Which game?',
      'How did it make you feel?',
      'Would you play it again?',
    ] },
  { id: 'gaming-comfort-game', category: 'Gaming', emoji: '🛋️', topic: 'Your comfort game for a bad day.',
    followUps: [
      'What is it?',
      'Why does it feel like home?',
      'When did you first play it?',
    ] },
  { id: 'gaming-character-crush', category: 'Gaming', emoji: '💖', topic: 'A game character you liked.',
    followUps: [
      'Who and from which game?',
      'What did you like about them?',
      'Would they work as a real person?',
    ] },
  { id: 'gaming-side-character-remembered', category: 'Gaming', emoji: '🗨️', topic: 'A side character you still remember.',
    followUps: [
      'Who was it?',
      'Why did they stick with you?',
      'What kind of character stays with you?',
    ] },
  { id: 'gaming-cheat-or-not', category: 'Gaming', emoji: '🃏', topic: 'The time you cheated in a game — or didn\'t.',
    followUps: [
      'What was the game?',
      'How did it feel?',
      'Is cheating different from playing smart?',
    ] },
  { id: 'gaming-console-bring-back', category: 'Gaming', emoji: '📼', topic: 'An old console you miss.',
    followUps: [
      'Which one?',
      'What did it get right?',
      'Was it really better or just nostalgia?',
    ] },
  { id: 'gaming-outgrew', category: 'Gaming', emoji: '🚪', topic: 'A game or genre you grew out of.',
    followUps: [
      'What did you like about it?',
      'What changed — you or the games?',
      'Do you miss that time?',
    ] },

  // ── Food & Drink ─────────────────────────────────────────────────────
  { id: 'food-defend-dish', category: 'Food', emoji: '🍲', topic: 'A dish you would defend forever.',
    followUps: [
      'What is it?',
      'Who makes the best version?',
      'Do you cook it yourself?',
    ] },
  { id: 'food-weirdest', category: 'Food', emoji: '🦑', topic: 'The weirdest thing you have eaten.',
    followUps: [
      'Where were you?',
      'How did it taste?',
      'Would you eat it again?',
    ] },
  { id: 'food-cook-for-others', category: 'Food', emoji: '👨‍🍳', topic: 'Cooking for other people.',
    followUps: [
      'Do you enjoy it or stress about it?',
      'What is your safe meal?',
      'What was your worst cooking disaster?',
    ] },
  { id: 'food-comfort', category: 'Food', emoji: '🍜', topic: 'Comfort food on a bad day.',
    followUps: [
      'What do you reach for?',
      'Is it from childhood?',
      'Do you eat it alone or with people?',
    ] },
  { id: 'food-trend-weird', category: 'Food', emoji: '🌈', topic: 'A food trend you don\'t understand.',
    followUps: [
      'What is it?',
      'Have you tried it?',
      'Why is it popular?',
    ] },
  { id: 'food-breakfast-world', category: 'Food', emoji: '🥐', topic: 'Breakfast around the world.',
    followUps: [
      'What is breakfast like in your country?',
      'What foreign breakfast would you adopt?',
      'Sweet or savory in the morning?',
    ] },
  { id: 'food-street', category: 'Food', emoji: '🌮', topic: 'Street food.',
    followUps: [
      'The best street food you have had?',
      'Do you trust street food?',
      'Is there one you miss from somewhere?',
    ] },
  { id: 'food-restaurant-change', category: 'Food', emoji: '🍽️', topic: 'A restaurant that changed how you see food.',
    followUps: [
      'Where was it?',
      'What surprised you?',
      'Have you been back?',
    ] },
  { id: 'food-drink-meaning', category: 'Food', emoji: '🍵', topic: 'A drink that means something to you.',
    followUps: [
      'What is it?',
      'Is it tied to a person or place?',
      'Is it the same with other people?',
    ] },
  { id: 'food-last-meal', category: 'Food', emoji: '🍰', topic: 'Your last meal, if you had to choose.',
    followUps: [
      'What is on the plate?',
      'Who is with you?',
      'Where would you eat it?',
    ] },

  // ── Health & Mind ────────────────────────────────────────────────────
  { id: 'health-habit-change', category: 'Health', emoji: '🌱', topic: 'A habit that changed your life.',
    followUps: [
      'What started the change?',
      'How long before it felt natural?',
      'What is the next habit on your list?',
    ] },
  { id: 'health-sleep', category: 'Health', emoji: '😴', topic: 'Your relationship with sleep.',
    followUps: [
      'Are you a night owl or an early bird?',
      'What ruins your sleep?',
      'What would you change about it?',
    ] },
  { id: 'health-stress', category: 'Health', emoji: '🫧', topic: 'How you deal with stress.',
    followUps: [
      'What does your stress look like?',
      'What really helps you?',
      'What was useless?',
    ] },
  { id: 'health-mental-country', category: 'Health', emoji: '🧠', topic: 'Mental health in your country.',
    followUps: [
      'Do people talk about it openly?',
      'Has it changed in 10 years?',
      'What still needs to change?',
    ] },
  { id: 'health-exercise', category: 'Health', emoji: '🏃', topic: 'Exercise and movement.',
    followUps: [
      'How does it fit in your life?',
      'What movement makes you feel good?',
      'Have you kept a routine for six months?',
    ] },
  { id: 'health-burnout', category: 'Health', emoji: '🔥', topic: 'Burnout — have you been there?',
    followUps: [
      'What did it look like for you?',
      'What helped you come back?',
      'How do you spot the signs now?',
    ] },
  { id: 'health-calm-moment', category: 'Health', emoji: '🪷', topic: 'A moment of real calm.',
    followUps: [
      'Where were you?',
      'What made it special?',
      'How often do you get moments like that?',
    ] },
  { id: 'health-social-mood', category: 'Health', emoji: '📱', topic: 'Social media and your mood.',
    followUps: [
      'Which platform affects you most?',
      'Have you taken a break from it?',
      'What would a healthy relationship with it look like?',
    ] },
  { id: 'health-therapy', category: 'Health', emoji: '🛋️', topic: 'Therapy — would you try it?',
    followUps: [
      'What is your reaction to the idea?',
      'What stops people from going?',
      'If you have been, what surprised you?',
    ] },
  { id: 'health-best-advice', category: 'Health', emoji: '💡', topic: 'The best health advice you got.',
    followUps: [
      'Who gave it to you?',
      'Why did it work?',
      'Do you still follow it?',
    ] },

  // ── Nature & Environment ─────────────────────────────────────────────
  { id: 'nature-place-moves', category: 'Nature', emoji: '🏔️', topic: 'A place in nature that moves you.',
    followUps: [
      'Where is it?',
      'What makes it special?',
      'When were you there last?',
    ] },
  { id: 'nature-animal-close', category: 'Nature', emoji: '🦌', topic: 'An animal moment you remember.',
    followUps: [
      'What animal and where?',
      'How did you react?',
      'Did it change how you see them?',
    ] },
  { id: 'nature-climate-life', category: 'Nature', emoji: '🌡️', topic: 'Climate change in your daily life.',
    followUps: [
      'What have you noticed around you?',
      'What do you change in your routine?',
      'Are you hopeful or not?',
    ] },
  { id: 'nature-disaster', category: 'Nature', emoji: '🌊', topic: 'A natural event you lived through.',
    followUps: [
      'What happened?',
      'What detail will you never forget?',
      'How did your community react?',
    ] },
  { id: 'nature-camping', category: 'Nature', emoji: '⛺', topic: 'Camping — fun or no thanks?',
    followUps: [
      'What is your experience with camping?',
      'What was your worst night outdoors?',
      'If you had to go next weekend, where?',
    ] },
  { id: 'nature-pets', category: 'Nature', emoji: '🐾', topic: 'Pets in your life.',
    followUps: [
      'What pets have you had?',
      'What did they teach you?',
      'If you got a new one, what would you choose?',
    ] },
  { id: 'nature-ocean', category: 'Nature', emoji: '🌊', topic: 'The ocean.',
    followUps: [
      'Does it attract or scare you?',
      'What is your strongest ocean memory?',
      'How does it feel different from a lake?',
    ] },
  { id: 'nature-light-time', category: 'Nature', emoji: '🌅', topic: 'Sunrise or sunset?',
    followUps: [
      'Which one and why?',
      'The best one you have seen?',
      'When did you last stop to watch?',
    ] },
  { id: 'nature-season-love', category: 'Nature', emoji: '🍂', topic: 'A season you love.',
    followUps: [
      'Which one?',
      'What rituals come with it?',
      'Could you live with only that season?',
    ] },
  { id: 'nature-gardening', category: 'Nature', emoji: '🌱', topic: 'Growing plants, herbs or food.',
    followUps: [
      'Have you ever kept a plant alive?',
      'Why is it fun or frustrating?',
      'If you had space, what would you grow?',
    ] },

  // ── Money & Choices ──────────────────────────────────────────────────
  { id: 'money-childhood', category: 'Money', emoji: '🏦', topic: 'Money when you were growing up.',
    followUps: [
      'How was money talked about at home?',
      'What lesson stayed with you?',
      'Is it different now?',
    ] },
  { id: 'money-regret-buy', category: 'Money', emoji: '🫣', topic: 'A big purchase you regret.',
    followUps: [
      'What was it?',
      'What did you hope it would do?',
      'What would you tell someone about to buy it?',
    ] },
  { id: 'money-worth-extra', category: 'Money', emoji: '✨', topic: 'Something worth paying extra for.',
    followUps: [
      'What is it?',
      'What is the cheap version missing?',
      'Is there something you don\'t splurge on anymore?',
    ] },
  { id: 'money-save-spend', category: 'Money', emoji: '⚖️', topic: 'Saving or spending.',
    followUps: [
      'Which side are you on?',
      'What does your family think?',
      'Have you ever switched sides?',
    ] },
  { id: 'money-broke', category: 'Money', emoji: '🪙', topic: 'A time you were really broke.',
    followUps: [
      'What were you living on?',
      'What helped you through?',
      'What did it teach you?',
    ] },
  { id: 'money-happiness', category: 'Money', emoji: '🎈', topic: 'Does money buy happiness?',
    followUps: [
      'What is your honest answer?',
      'What is "enough" for you?',
      'A happy moment that cost nothing?',
    ] },
  { id: 'money-credit', category: 'Money', emoji: '💳', topic: 'Credit cards and debt.',
    followUps: [
      'What is your relationship with credit?',
      'Have you ever been scared of debt?',
      'What would you tell a 20-year-old?',
    ] },
  { id: 'money-teach-kids', category: 'Money', emoji: '🧒', topic: 'Teaching kids about money.',
    followUps: [
      'What should they learn first?',
      'Were you taught well?',
      'Should kids see the family\'s real money?',
    ] },
  { id: 'money-free-love', category: 'Money', emoji: '🎁', topic: 'A free thing you love.',
    followUps: [
      'What is it?',
      'Why don\'t more people use it?',
      'Would you love it if you had to pay?',
    ] },
  { id: 'money-economy-country', category: 'Money', emoji: '📉', topic: 'The economy where you live.',
    followUps: [
      'How does it affect your day?',
      'What is harder or easier now?',
      'Where do you see things going?',
    ] },

];

/** Filter the topic bank by one or more categories. `null` or an empty set
 *  returns the full bank — the "All selected" state. */
export function filterRandomTopics(
  categories: RandomTopicCategory | ReadonlySet<RandomTopicCategory> | null,
): RandomTopic[] {
  if (!categories) return RANDOM_TOPICS;
  if (typeof categories === 'string') {
    return RANDOM_TOPICS.filter(t => t.category === categories);
  }
  if (categories.size === 0) return RANDOM_TOPICS;
  return RANDOM_TOPICS.filter(t => categories.has(t.category));
}

/** Count of topics per category, in declaration order. Useful for chip labels. */
export function randomTopicCounts(): Record<RandomTopicCategory, number> {
  const counts = {} as Record<RandomTopicCategory, number>;
  RANDOM_TOPIC_CATEGORIES.forEach(c => { counts[c] = 0; });
  for (const t of RANDOM_TOPICS) counts[t.category] += 1;
  return counts;
}
