// TOEFL iBT 2026 Speaking Sections — one per mock.
//
// Format (ETS 2026, effective 21 January 2026):
//   · 7 Listen and Repeat items — hear a sentence, repeat it exactly.
//     Record window: 8s (items 1-2), 10s (3-5), 12s (6-7).
//   · 4 Take an Interview items — all four questions revolve around a single
//     everyday topic; 45s per response; no prep.
//
// Sentences for Listen and Repeat are calibrated to grow in length:
//  · items 1-2: short, 6-8 words   (fits 8s window comfortably)
//  · items 3-5: medium, 10-14 words (10s window)
//  · items 6-7: longer, 15-20 words (12s window)

import type { TOEFLSpeakingSection } from '@/types/toefl';

export const speakingSection2026Mock1: TOEFLSpeakingSection = {
  listenAndRepeat: [
    { id: 'm1-lr-1', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'The library closes early on Sundays.' },
    { id: 'm1-lr-2', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'Please turn off your phone during class.' },
    { id: 'm1-lr-3', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'Our project deadline was moved to next Friday morning.' },
    { id: 'm1-lr-4', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'The professor uploaded the reading list to the shared folder.' },
    { id: 'm1-lr-5', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'She usually studies in the quiet corner near the window.' },
    { id: 'm1-lr-6', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'Before submitting the essay, remember to check the citation format and word count.' },
    { id: 'm1-lr-7', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'If you need help with the group presentation, feel free to come to my office hours.' },
  ],
  interviewTopic: 'Your studies and daily routine',
  interviewIntro: 'Hi, thanks for taking the time to talk with me today. I have four short questions about how you organise your studies. There is no right or wrong answer — just tell me what actually works for you.',
  takeInterview: [
    { id: 'm1-ti-1', type: 'take-an-interview', speakSec: 45, question: 'Can you tell me a little about what you are currently studying and why you chose it?' },
    { id: 'm1-ti-2', type: 'take-an-interview', speakSec: 45, question: 'Walk me through a typical study day. When do you concentrate best, and where do you usually work?' },
    { id: 'm1-ti-3', type: 'take-an-interview', speakSec: 45, question: 'What is one strategy that has really helped you learn — for example, note-taking, group discussions, or something else?' },
    { id: 'm1-ti-4', type: 'take-an-interview', speakSec: 45, question: 'If you could change one thing about your current study routine, what would it be and why?' },
  ],
};

export const speakingSection2026Mock2: TOEFLSpeakingSection = {
  listenAndRepeat: [
    { id: 'm2-lr-1', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'The bus stops in front of the campus.' },
    { id: 'm2-lr-2', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'She left her notebook on the desk.' },
    { id: 'm2-lr-3', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'We should meet at the coffee shop before the lecture.' },
    { id: 'm2-lr-4', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'The application deadline is at the end of the month.' },
    { id: 'm2-lr-5', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'He forgot to bring the printed copy of the assignment.' },
    { id: 'm2-lr-6', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'Even though the exam was long, most students finished with plenty of time to review their answers.' },
    { id: 'm2-lr-7', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'Whenever the weather is nice, we prefer to walk to campus instead of taking the subway.' },
  ],
  interviewTopic: 'Your neighbourhood and free time',
  interviewIntro: 'Hi! I would love to hear a bit about the neighbourhood you live in and how you spend your free time there. Just answer naturally — no need to prepare anything.',
  takeInterview: [
    { id: 'm2-ti-1', type: 'take-an-interview', speakSec: 45, question: 'Can you describe the area where you live? What is it like on a typical day?' },
    { id: 'm2-ti-2', type: 'take-an-interview', speakSec: 45, question: 'What do you usually do when you have some free time at home?' },
    { id: 'm2-ti-3', type: 'take-an-interview', speakSec: 45, question: 'Is there a place nearby — a park, a café, anywhere — that you go to relax or think?' },
    { id: 'm2-ti-4', type: 'take-an-interview', speakSec: 45, question: 'If a friend visited you for one day, what would you show them in your area?' },
  ],
};

export const speakingSection2026Mock3: TOEFLSpeakingSection = {
  listenAndRepeat: [
    { id: 'm3-lr-1', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'The rain stopped just after noon.' },
    { id: 'm3-lr-2', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'Please save your files before leaving.' },
    { id: 'm3-lr-3', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'The concert was postponed because of the weather forecast.' },
    { id: 'm3-lr-4', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'We agreed to meet in front of the museum at three.' },
    { id: 'm3-lr-5', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'They renovated the whole building over the summer break.' },
    { id: 'm3-lr-6', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'The research team spent two years collecting data before publishing any of their findings.' },
    { id: 'm3-lr-7', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'She has been learning three languages at the same time, and honestly it does not seem to slow her down.' },
  ],
  interviewTopic: 'Cooking, food, and eating habits',
  interviewIntro: 'Hi, thanks for chatting with me. I want to ask you a few questions about food and cooking — what you eat, how you cook, and what you enjoy about it. Just answer naturally.',
  takeInterview: [
    { id: 'm3-ti-1', type: 'take-an-interview', speakSec: 45, question: 'Do you enjoy cooking? Tell me how you got started, or why you avoid it.' },
    { id: 'm3-ti-2', type: 'take-an-interview', speakSec: 45, question: 'What does a typical meal look like at your place — breakfast, lunch, or dinner?' },
    { id: 'm3-ti-3', type: 'take-an-interview', speakSec: 45, question: 'Is there a dish that means something special to you? What is the story behind it?' },
    { id: 'm3-ti-4', type: 'take-an-interview', speakSec: 45, question: 'If you had to teach someone one recipe you know well, what would it be and why?' },
  ],
};

export const speakingSection2026Mock4: TOEFLSpeakingSection = {
  listenAndRepeat: [
    { id: 'm4-lr-1', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'The team meets every Tuesday at six.' },
    { id: 'm4-lr-2', type: 'listen-and-repeat', recordSec: 8,  targetSentence: 'She usually walks to work in the mornings.' },
    { id: 'm4-lr-3', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'The new manager scheduled a short meeting for tomorrow afternoon.' },
    { id: 'm4-lr-4', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'I forgot to charge my laptop before the presentation started.' },
    { id: 'm4-lr-5', type: 'listen-and-repeat', recordSec: 10, targetSentence: 'Our office moved to a bigger building near the train station.' },
    { id: 'm4-lr-6', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'After the client approved the design, the whole team celebrated with a long lunch at the corner restaurant.' },
    { id: 'm4-lr-7', type: 'listen-and-repeat', recordSec: 12, targetSentence: 'Although we finished the report on time, everyone agreed that the last week had been unusually stressful for the group.' },
  ],
  interviewTopic: 'Travel and new places',
  interviewIntro: 'Hi! Thanks for talking with me. I have four questions about travel — places you have been, places you would like to go, and how you experience new places. Just answer freely.',
  takeInterview: [
    { id: 'm4-ti-1', type: 'take-an-interview', speakSec: 45, question: 'Tell me about a place you visited that surprised you in some way. Where was it, and what surprised you?' },
    { id: 'm4-ti-2', type: 'take-an-interview', speakSec: 45, question: 'When you travel, do you prefer to plan everything or leave things open? Why?' },
    { id: 'm4-ti-3', type: 'take-an-interview', speakSec: 45, question: 'What kind of place would you love to visit next, and what would you want to do there?' },
    { id: 'm4-ti-4', type: 'take-an-interview', speakSec: 45, question: 'Do you think travelling has changed how you see your own city or country? In what way?' },
  ],
};
