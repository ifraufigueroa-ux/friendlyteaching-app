// FriendlyTeaching.cl — Placement Test Writing Bank
// One prompt per CEFR level (A1 → C1). The runner picks the prompt whose
// level matches the anchor from Grammar (or the mid-scale B1 as fallback),
// then Claude evaluates the student's response against CEFR descriptors and
// returns a level estimate.

import type { WritingPromptPlacement } from '@/types/placement-suite';

export const PLACEMENT_WRITING: WritingPromptPlacement[] = [
  {
    id:       'w-a1-intro',
    level:    'A1',
    title:    'Introduce yourself',
    prompt:   'Write a short introduction about yourself. Include your name, where you live, your job or studies, and one thing you like doing.',
    minWords: 30,
    timerMin: 6,
  },
  {
    id:       'w-a2-weekend',
    level:    'A2',
    title:    'Last weekend',
    prompt:   'Write about what you did last weekend. Mention where you went, who you were with, and how you felt about it.',
    minWords: 60,
    timerMin: 8,
  },
  {
    id:       'w-b1-city',
    level:    'B1',
    title:    'A place you know well',
    prompt:   'Describe your city or neighbourhood to someone who has never visited. Explain what it looks like, what people typically do there, and what you would recommend a visitor to see.',
    minWords: 100,
    timerMin: 10,
  },
  {
    id:       'w-b1plus-opinion',
    level:    'B1+',
    title:    'Working from home',
    prompt:   'Some people say working from home is better than working in an office. Others disagree. What is your opinion? Give at least two reasons and one example from your own experience.',
    minWords: 130,
    timerMin: 12,
  },
  {
    id:       'w-b2-argument',
    level:    'B2',
    title:    'The role of social media',
    prompt:   'Some argue that social media has done more harm than good to public discourse. Others see it as an important democratic tool. Discuss both views and give your own opinion. Support your argument with examples.',
    minWords: 180,
    timerMin: 14,
  },
  {
    id:       'w-c1-analytical',
    level:    'C1',
    title:    'Universal basic income',
    prompt:   'A universal basic income has been proposed as a response to automation and rising inequality. Critically evaluate the arguments for and against such a policy, considering both its economic and social implications, and defend a position of your own.',
    minWords: 220,
    timerMin: 15,
  },
];

export function pickWritingPromptForAnchor(anchor: string): WritingPromptPlacement {
  const direct = PLACEMENT_WRITING.find(p => p.level === anchor);
  if (direct) return direct;
  // Fallback: B1 mid-scale.
  return PLACEMENT_WRITING.find(p => p.level === 'B1') ?? PLACEMENT_WRITING[0];
}
