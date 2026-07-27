// TOEFL Speaking — Independent prompts (4 tasks for the MVP mock).
// Each: 15 s prep + 45 s speak, standard Independent format.

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
