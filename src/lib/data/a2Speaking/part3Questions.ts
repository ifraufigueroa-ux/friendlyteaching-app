// FriendlyTeaching.cl — A1-A2+ Speaking Part 3 question bank
//
// "Part 3" for A2 is not the abstract discussion of the real IELTS — at
// this level we pull the student into short opinion questions that
// exercise a specific linguistic competence: present-tense description,
// past-tense narration, future plans, preferences, and simple
// experiences. Each question is answerable in 2-4 short sentences and
// naturally elicits the target grammar without needing hypotheticals or
// abstract vocabulary.

export type A2Focus =
  | 'present'
  | 'past'
  | 'future'
  | 'preferences'
  | 'experiences';

export interface A2Part3Question {
  focus: A2Focus;
  topic: string;
  emoji: string;
  question: string;
}

export const A2_PART3_QUESTIONS: A2Part3Question[] = [
  // ─── Present (Present simple / continuous) ──────────────────────
  { focus: 'present', emoji: '🍽️', topic: 'Food & habits',       question: 'What food do people in your country eat every day?' },
  { focus: 'present', emoji: '🏠', topic: 'Home life',            question: 'What do you usually do at home after work or school?' },
  { focus: 'present', emoji: '📱', topic: 'Technology',           question: 'How often do you use your phone in a day?' },
  { focus: 'present', emoji: '🎨', topic: 'Free time',            question: 'What activities are popular for young people in your city?' },
  { focus: 'present', emoji: '☕', topic: 'Morning routine',      question: 'What do most people have for breakfast where you live?' },
  { focus: 'present', emoji: '👨‍👩‍👧', topic: 'Family',            question: 'How often do you see your family in a normal week?' },
  { focus: 'present', emoji: '🚌', topic: 'Transport',            question: 'How do people usually travel to work in your city?' },
  { focus: 'present', emoji: '🌤️', topic: 'Weather',              question: 'What is the weather like at this time of year?' },

  // ─── Past (Past simple) ─────────────────────────────────────────
  { focus: 'past', emoji: '🎉', topic: 'Last celebration',        question: 'What did you do on your last birthday?' },
  { focus: 'past', emoji: '🏫', topic: 'Childhood',               question: 'What was your favorite game when you were a child?' },
  { focus: 'past', emoji: '📅', topic: 'Last weekend',            question: 'What did you do last weekend?' },
  { focus: 'past', emoji: '✈️', topic: 'Last trip',               question: 'When was the last time you traveled somewhere?' },
  { focus: 'past', emoji: '🍽️', topic: 'Yesterday\'s meals',      question: 'What did you eat yesterday for lunch and dinner?' },
  { focus: 'past', emoji: '🎬', topic: 'Recent movie',            question: 'What was the last movie or show you watched?' },
  { focus: 'past', emoji: '📚', topic: 'School days',             question: 'What subject did you like the most at school?' },
  { focus: 'past', emoji: '🎁', topic: 'A nice gift',             question: 'What was a nice gift you received? Who gave it to you?' },

  // ─── Future (Going to / will) ───────────────────────────────────
  { focus: 'future', emoji: '📅', topic: 'Next weekend',          question: 'What are you going to do next weekend?' },
  { focus: 'future', emoji: '🌴', topic: 'Next holiday',          question: 'Where are you going to travel on your next holiday?' },
  { focus: 'future', emoji: '🎯', topic: 'Learning plans',        question: 'What new skill will you learn this year?' },
  { focus: 'future', emoji: '🍽️', topic: 'Tonight',               question: 'What are you going to have for dinner tonight?' },
  { focus: 'future', emoji: '🎂', topic: 'Next birthday',         question: 'How will you celebrate your next birthday?' },
  { focus: 'future', emoji: '💼', topic: 'Career',                question: 'What job do you want to have in the future?' },
  { focus: 'future', emoji: '🏠', topic: 'Future home',           question: 'Where will you live in five years, do you think?' },
  { focus: 'future', emoji: '🎬', topic: 'Weekend plans',         question: 'What movie or show are you going to watch this week?' },

  // ─── Preferences (Like / prefer / would rather) ─────────────────
  { focus: 'preferences', emoji: '🌆', topic: 'City vs country',  question: 'Do you prefer living in a city or in the countryside? Why?' },
  { focus: 'preferences', emoji: '☕', topic: 'Drinks',            question: 'Which do you prefer: tea or coffee? Why?' },
  { focus: 'preferences', emoji: '📺', topic: 'Screen time',      question: 'Do you like movies or TV series better? Why?' },
  { focus: 'preferences', emoji: '🌦️', topic: 'Seasons',          question: 'Which season do you like the most? Why?' },
  { focus: 'preferences', emoji: '🎵', topic: 'Music',            question: 'What kind of music do you like the most?' },
  { focus: 'preferences', emoji: '🍕', topic: 'Eating out',       question: 'Do you prefer eating at home or in a restaurant? Why?' },
  { focus: 'preferences', emoji: '🛍️', topic: 'Shopping',         question: 'Do you like shopping online or in stores? Why?' },
  { focus: 'preferences', emoji: '📚', topic: 'Learning',         question: 'Do you prefer learning alone or with other people? Why?' },
  { focus: 'preferences', emoji: '🐶', topic: 'Pets',             question: 'Which do you like better: dogs or cats? Why?' },
  { focus: 'preferences', emoji: '📱', topic: 'Phones',           question: 'Do you prefer texting or calling your friends? Why?' },

  // ─── Experiences (Present perfect intro / past simple) ──────────
  { focus: 'experiences', emoji: '🌍', topic: 'Travel',           question: 'Have you ever traveled to another country? Tell me about it.' },
  { focus: 'experiences', emoji: '🍣', topic: 'New food',         question: 'Have you ever tried a food you didn\'t like? What was it?' },
  { focus: 'experiences', emoji: '🎤', topic: 'Public speaking',  question: 'Have you ever spoken in front of many people?' },
  { focus: 'experiences', emoji: '🏆', topic: 'Winning',          question: 'Have you ever won a prize or competition?' },
  { focus: 'experiences', emoji: '⭐', topic: 'Meeting someone',  question: 'Have you ever met someone famous?' },
  { focus: 'experiences', emoji: '🚴', topic: 'Learning skills',  question: 'Have you ever learned to ride a bike or drive? When?' },
  { focus: 'experiences', emoji: '📖', topic: 'Books',            question: 'Have you ever read a book in English?' },
  { focus: 'experiences', emoji: '🎬', topic: 'Cinema',           question: 'Have you ever watched a movie more than three times?' },
  { focus: 'experiences', emoji: '🐕', topic: 'Animals',          question: 'Have you ever had a pet? Tell me about it.' },
  { focus: 'experiences', emoji: '🚂', topic: 'Public transport', question: 'Have you ever traveled by train? Where did you go?' },
];
