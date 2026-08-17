// TOEFL Speaking — Independent prompts (4 tasks per mock).
// Each: 15 s prep + 45 s speak, standard Independent format.
// Prompts are grouped by mock so each simulator run gets a distinct set.

import type { TOEFLSpeakingPrompt } from '@/types/toefl';

export const speakingPromptsMock1: TOEFLSpeakingPrompt[] = [
  {
    id:       's1-preferred-study',
    category: 'personal',
    prompt:   'Describe a place where you enjoy studying. Explain why this place helps you concentrate. Include specific details in your explanation.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       's2-agree-disagree',
    category: 'opinion',
    prompt:   'Some students believe that it is more important to take courses that are directly related to their future career. Others believe that students should also take courses outside their major field. Which view do you agree with, and why?',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       's3-choice',
    category: 'choice',
    prompt:   'If you had one free week to spend as you like, would you prefer to travel to a new place or spend the time learning a new skill at home? Explain your choice with specific reasons.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       's4-society',
    category: 'opinion',
    prompt:   'Some people think that governments should invest more money in public parks and libraries. Others think this money would be better spent on scientific research. What is your opinion, and why?',
    prepSec:  15,
    speakSec: 45,
  },
];

export const speakingPromptsMock2: TOEFLSpeakingPrompt[] = [
  {
    id:       'm2-s1-influential-person',
    category: 'personal',
    prompt:   'Describe a person outside your family who has had an important influence on the way you think. Explain what this person taught you and why the lesson stayed with you. Include specific details.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm2-s2-agree-disagree',
    category: 'opinion',
    prompt:   'Some people believe that the best way to learn about a new subject is by studying alone. Others believe it is better to study with a group of classmates. Which approach do you find more effective, and why?',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm2-s3-choice',
    category: 'choice',
    prompt:   'If you received a small amount of unexpected money, would you prefer to spend it on an experience — such as a concert or a trip — or on a useful object you have wanted for a long time? Explain your choice.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm2-s4-society',
    category: 'opinion',
    prompt:   'Some cities are considering charging drivers a fee for entering the busiest downtown areas in order to reduce traffic and pollution. Do you think this is a good policy? Explain your reasons.',
    prepSec:  15,
    speakSec: 45,
  },
];

export const speakingPromptsMock3: TOEFLSpeakingPrompt[] = [
  {
    id:       'm3-s1-place-visited',
    category: 'personal',
    prompt:   'Describe a place you visited that turned out to be different from what you expected. Explain how it differed and how the experience changed your view of the place. Include specific details.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm3-s2-agree-disagree',
    category: 'opinion',
    prompt:   'It is often said that people learn more from failure than from success. Do you agree or disagree with this statement? Give specific reasons and examples to support your answer.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm3-s3-choice',
    category: 'choice',
    prompt:   'When choosing a job, some people give priority to a high salary, while others give priority to work that they find personally meaningful. Which would you prioritise, and why?',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm3-s4-society',
    category: 'opinion',
    prompt:   'Some schools are considering replacing traditional textbooks with digital devices such as tablets. What do you think is the most important advantage or disadvantage of this change? Explain your reasons.',
    prepSec:  15,
    speakSec: 45,
  },
];

export const speakingPromptsMock4: TOEFLSpeakingPrompt[] = [
  {
    id:       'm4-s1-hobby',
    category: 'personal',
    prompt:   'Describe an activity or hobby you began doing recently. Explain why you started it and what you have gained from it. Include specific details.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm4-s2-agree-disagree',
    category: 'opinion',
    prompt:   'Some people believe that it is better to work for a large, well-established company. Others prefer to work for a small company or a start-up. Which do you think is a better choice for a young professional, and why?',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm4-s3-choice',
    category: 'choice',
    prompt:   'When solving a difficult problem, would you rather work on it patiently by yourself or ask other people for help right away? Explain your choice with specific reasons.',
    prepSec:  15,
    speakSec: 45,
  },
  {
    id:       'm4-s4-society',
    category: 'opinion',
    prompt:   'Some people think that universities should require all students to take at least one course in the arts, such as music, painting, or theatre. Do you agree or disagree? Explain your reasons.',
    prepSec:  15,
    speakSec: 45,
  },
];
