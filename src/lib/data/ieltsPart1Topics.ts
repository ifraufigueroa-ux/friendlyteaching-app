// FriendlyTeaching.cl — IELTS Speaking Part 1 topic bank
// Each topic has 4 development questions that the teacher can throw at
// the student after the random pick lands.

export interface Part1Topic {
  id: string;
  emoji: string;
  name: string;
  questions: string[];
}

// Core IELTS Part 1 staples — the topics a guided mock must surface.
// Order matters: slot 1 and slot 2 of every mock are pulled from the front.
export const IELTS_PART1_CORE_TOPIC_IDS = [
  'work-studies',
  'hometown',
  'free-time',
  'technology',
  'books',
  'travel',
  'food',
] as const;

export const IELTS_PART1_TOPICS: Part1Topic[] = [
  // ── Core IELTS Part 1 staples (must-have per teacher) ─────────────
  {
    id: 'work-studies',
    emoji: '💼',
    name: 'Work / Studies',
    questions: [
      'Do you work or are you a student?',
      'What do you most enjoy about your work or studies?',
      'What is the most challenging part of it?',
      'Where do you see yourself in five years?',
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
    id: 'free-time',
    emoji: '🌳',
    name: 'Free Time',
    questions: [
      'How do you usually spend your free time?',
      'Do you have enough free time during the week?',
      'What did you enjoy doing in your free time as a child?',
      'Do you think people have less free time now than in the past?',
    ],
  },
  {
    id: 'technology',
    emoji: '💻',
    name: 'Technology',
    questions: [
      'Are you good with technology?',
      'How has technology changed your daily life?',
      'Do you prefer learning new technology by yourself or with help?',
      'What piece of technology could you not live without?',
    ],
  },
  {
    id: 'books',
    emoji: '📚',
    name: 'Books',
    questions: [
      'Do you read books often?',
      'What kinds of books do you enjoy?',
      'Do you prefer paper books or e-books?',
      'Has your taste in books changed over the years?',
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

  // ── Extended bank (curveballs to keep mocks fresh) ────────────────
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
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    name: 'Family',
    questions: [
      'Do you have a large or small family?',
      'Who are you closest to in your family?',
      'How often do you spend time with your family?',
      'Do you think family is more important today than in the past?',
    ],
  },
  {
    id: 'weekends',
    emoji: '🎉',
    name: 'Weekends',
    questions: [
      'What do you usually do on weekends?',
      'Do you prefer to stay in or go out on weekends?',
      'Do you spend weekends differently from when you were a child?',
      'Is the weekend long enough for you to rest?',
    ],
  },
  {
    id: 'holidays',
    emoji: '🏖️',
    name: 'Holidays',
    questions: [
      'When did you last take a holiday?',
      'Do you prefer short trips or longer holidays?',
      'Who do you usually go on holiday with?',
      'How important are holidays for you?',
    ],
  },
  {
    id: 'childhood',
    emoji: '🧒',
    name: 'Childhood',
    questions: [
      'What is your happiest childhood memory?',
      'What kinds of games did you play as a child?',
      'Were you closer to your mother or your father as a child?',
      'Do you think children today have a better childhood than you did?',
    ],
  },
  {
    id: 'pets',
    emoji: '🐶',
    name: 'Pets & animals',
    questions: [
      'Do you have a pet? Would you like to?',
      'What is the most popular pet in your country?',
      'Do you think keeping wild animals as pets is a good idea?',
      'Did you have a favourite animal as a child?',
    ],
  },
  {
    id: 'public-transport',
    emoji: '🚌',
    name: 'Public transport',
    questions: [
      'How do you usually get around your city?',
      'Do you often use public transport?',
      'What is public transport like where you live?',
      'How could public transport in your city be improved?',
    ],
  },
  {
    id: 'museums',
    emoji: '🏛️',
    name: 'Museums',
    questions: [
      'Do you enjoy visiting museums?',
      'When did you last go to a museum?',
      'What kinds of museums are most popular in your country?',
      'Do you think museums are important for children?',
    ],
  },
  {
    id: 'fashion',
    emoji: '👗',
    name: 'Fashion & clothes',
    questions: [
      'Are you interested in fashion?',
      'What kind of clothes do you usually wear?',
      'How often do you buy new clothes?',
      'Do you dress differently now compared to when you were younger?',
    ],
  },
  {
    id: 'neighbours',
    emoji: '🏠',
    name: 'Neighbours',
    questions: [
      'Do you know your neighbours well?',
      'How often do you talk to them?',
      'What makes a good neighbour?',
      'Do you think neighbours today are less friendly than in the past?',
    ],
  },
  {
    id: 'handwriting',
    emoji: '✍️',
    name: 'Handwriting',
    questions: [
      'Do you often write things by hand?',
      'Is your handwriting easy to read?',
      'Do you prefer writing by hand or typing?',
      'Do you think handwriting will disappear in the future?',
    ],
  },
  {
    id: 'advertisements',
    emoji: '📺',
    name: 'Advertisements',
    questions: [
      'Do you pay attention to advertisements?',
      'Where do you see most advertisements in your daily life?',
      'Have you ever bought something because of an advertisement?',
      'Do you think advertisements are useful for consumers?',
    ],
  },
  {
    id: 'coffee-tea',
    emoji: '☕',
    name: 'Coffee & tea',
    questions: [
      'Do you prefer coffee or tea?',
      'When did you start drinking coffee or tea?',
      'Is drinking coffee or tea popular in your country?',
      'Do you drink these hot or cold?',
    ],
  },
  {
    id: 'gifts',
    emoji: '🎁',
    name: 'Gifts',
    questions: [
      'Do you enjoy giving gifts to people?',
      'What was the last gift you received?',
      'Is it common to give gifts on special occasions in your country?',
      'Do you prefer to give practical gifts or fun ones?',
    ],
  },
  {
    id: 'birthdays',
    emoji: '🎂',
    name: 'Birthdays',
    questions: [
      'How do you usually celebrate your birthday?',
      'Which birthday do you remember most fondly?',
      'Are birthdays celebrated differently in your country compared to other places?',
      'Do adults celebrate their birthdays as much as children?',
    ],
  },
  {
    id: 'tv-shows',
    emoji: '📺',
    name: 'TV shows',
    questions: [
      'What kinds of TV shows do you enjoy watching?',
      'How much time do you spend watching TV each week?',
      'Do you watch TV shows live or on streaming platforms?',
      'Have your favourite kinds of shows changed over the years?',
    ],
  },
  {
    id: 'podcasts',
    emoji: '🎙️',
    name: 'Podcasts',
    questions: [
      'Do you listen to podcasts? What kinds?',
      'When do you usually listen to them?',
      'Do you prefer podcasts to the radio? Why or why not?',
      'Have you ever thought about creating your own podcast?',
    ],
  },
  {
    id: 'concentration',
    emoji: '🎯',
    name: 'Concentration',
    questions: [
      'When during the day do you concentrate best?',
      'What things make it hard for you to concentrate?',
      'What do you do to improve your focus?',
      'Was it easier to concentrate when you were younger?',
    ],
  },
  {
    id: 'decisions',
    emoji: '🤔',
    name: 'Making decisions',
    questions: [
      'Are you good at making decisions?',
      'Do you usually decide things quickly or slowly?',
      'Do you ask others for advice before deciding?',
      'What is the biggest decision you have ever made?',
    ],
  },
  {
    id: 'getting-up',
    emoji: '⏰',
    name: 'Getting up early',
    questions: [
      'What time do you usually get up?',
      'Are you a morning person or a night person?',
      'Do you use an alarm to wake up?',
      'Do you think getting up early has any benefits?',
    ],
  },
  {
    id: 'bags-wallets',
    emoji: '👜',
    name: 'Bags & wallets',
    questions: [
      'What kinds of bags do you usually carry?',
      'What do you keep in your bag or wallet?',
      'Do you own many different bags?',
      'Do you think men and women use bags differently?',
    ],
  },

  // ── Curveballs 2024/25 (real Part 1 hot topics) ──────────────────
  {
    id: 'colours',
    emoji: '🎨',
    name: 'Colours',
    questions: [
      'What is your favourite colour?',
      'Are there any colours you don\'t like?',
      'Do you think colours can affect how people feel?',
      'Are there any colours that are important in your culture?',
    ],
  },
  {
    id: 'numbers',
    emoji: '🔢',
    name: 'Numbers',
    questions: [
      'Are you good with numbers?',
      'Do you use numbers a lot in your daily life?',
      'Do you have a favourite or lucky number?',
      'Do you think it is important for children to learn math from a young age?',
    ],
  },
  {
    id: 'names',
    emoji: '🏷️',
    name: 'Names',
    questions: [
      'Do you like your name? Why or why not?',
      'Who chose your name?',
      'Is there a story behind your name?',
      'Do people in your country often change their names?',
    ],
  },
  {
    id: 'chocolate',
    emoji: '🍫',
    name: 'Chocolate',
    questions: [
      'Do you like chocolate?',
      'How often do you eat chocolate?',
      'Is chocolate popular in your country?',
      'Did you eat a lot of chocolate as a child?',
    ],
  },
  {
    id: 'wild-animals',
    emoji: '🦁',
    name: 'Wild animals',
    questions: [
      'Have you ever seen a wild animal in real life?',
      'Do you enjoy watching documentaries about wild animals?',
      'Are wild animals popular as attractions in your country?',
      'Do you think zoos are a good way to see wild animals?',
    ],
  },
  {
    id: 'countryside',
    emoji: '🏞️',
    name: 'The countryside',
    questions: [
      'Do you enjoy spending time in the countryside?',
      'How often do you visit rural areas?',
      'What do people typically do when they go to the countryside?',
      'Would you prefer to live in the city or the countryside?',
    ],
  },
  {
    id: 'perfume',
    emoji: '🌸',
    name: 'Perfume',
    questions: [
      'Do you wear perfume or cologne?',
      'When did you first start using perfume?',
      'How do you choose which perfume to buy?',
      'Do you think perfume makes a good gift?',
    ],
  },
  {
    id: 'old-buildings',
    emoji: '🏛️',
    name: 'Old buildings',
    questions: [
      'Are there any old buildings in your hometown?',
      'Do you enjoy visiting historical buildings?',
      'Do you think old buildings should be preserved?',
      'Would you like to live in an old building? Why or why not?',
    ],
  },
  {
    id: 'rain',
    emoji: '🌧️',
    name: 'Rain',
    questions: [
      'Do you like rainy days?',
      'Does it rain a lot in your city?',
      'What do you usually do when it rains?',
      'Do you think rain affects people\'s moods?',
    ],
  },
  {
    id: 'small-businesses',
    emoji: '🏪',
    name: 'Small businesses',
    questions: [
      'Are there many small shops in your neighbourhood?',
      'Do you prefer buying from small shops or big supermarkets?',
      'Would you like to run your own small business one day?',
      'Do you think small businesses are important for a community?',
    ],
  },
  {
    id: 'uniforms',
    emoji: '👔',
    name: 'Uniforms',
    questions: [
      'Did you wear a uniform at school?',
      'Do you think school uniforms are a good idea?',
      'Are there jobs in your country where people have to wear uniforms?',
      'What are the advantages of wearing a uniform at work?',
    ],
  },
  {
    id: 'boredom',
    emoji: '😐',
    name: 'Boredom',
    questions: [
      'How often do you feel bored?',
      'What do you usually do when you are bored?',
      'Do you think children today get bored more easily than in the past?',
      'Do you think being bored is always a bad thing?',
    ],
  },
];
