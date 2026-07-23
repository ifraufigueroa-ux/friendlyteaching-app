// FriendlyTeaching.cl — IELTS Writing Task 2 (essay)
// Same T2 pool serves both Academic and General Training — the essay format
// is identical across the two versions. 250+ words, ~40 min.

import type { Task2Prompt } from '@/types/ielts-writing';

const CLOSING = '\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.';

/** Both academic + gt use the same T2, so we ship it once and tag both. */
function bothVersions(base: Omit<Task2Prompt, 'version'>): [Task2Prompt, Task2Prompt] {
  return [
    { ...base, version: 'academic', id: `ac-${base.id}` },
    { ...base, version: 'general-training', id: `gt-${base.id}` },
  ];
}

const RAW = [
  {
    id:        't2-01-tech-communication',
    task:      2 as const,
    title:     'Technology and human communication',
    essayType: 'discussion' as const,
    prompt:    `Some people believe that technology has improved the way we communicate with each other. Others feel that it has made real human interaction more difficult.\n\nDiscuss both views and give your own opinion.${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['technology', 'society'],
  },
  {
    id:        't2-02-university-free',
    task:      2 as const,
    title:     'Free university education',
    essayType: 'opinion' as const,
    prompt:    `In many countries, university education is fully paid for by students. Some people argue that university should be free for everyone.\n\nTo what extent do you agree or disagree?${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['education', 'policy'],
  },
  {
    id:        't2-03-remote-work',
    task:      2 as const,
    title:     'Remote work: benefits and drawbacks',
    essayType: 'advantage-disadvantage' as const,
    prompt:    `In recent years, working from home has become far more common than it was in the past.\n\nDo the advantages of this trend outweigh the disadvantages?${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['work', 'lifestyle'],
  },
  {
    id:        't2-04-plastic-waste',
    task:      2 as const,
    title:     'Reducing plastic waste',
    essayType: 'problem-solution' as const,
    prompt:    `Plastic waste has become a serious environmental problem, particularly in the oceans.\n\nWhat are the main causes of this problem, and what steps can governments and individuals take to solve it?${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['environment', 'problem-solution'],
  },
  {
    id:        't2-05-social-media-kids',
    task:      2 as const,
    title:     'Children and social media',
    essayType: 'opinion' as const,
    prompt:    `Some people think that children under 13 should not be allowed to use social media platforms.\n\nTo what extent do you agree or disagree?${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['society', 'technology'],
  },
  {
    id:        't2-06-city-vs-country',
    task:      2 as const,
    title:     'Living in a city vs the countryside',
    essayType: 'discussion' as const,
    prompt:    `Some people prefer to live in a big city, while others believe that life in the countryside offers a better quality of life.\n\nDiscuss both views and give your own opinion.${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['lifestyle', 'society'],
  },
  {
    id:        't2-07-tourism-benefits',
    task:      2 as const,
    title:     'Tourism: local costs and benefits',
    essayType: 'two-part' as const,
    prompt:    `International tourism has grown rapidly in the last few decades. While it brings clear economic benefits, some argue that it also causes damage to local communities.\n\nWhat are the main reasons for the growth of international tourism, and what can be done to reduce its negative impact on local communities?${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['tourism', 'two-part'],
  },
  {
    id:        't2-08-processed-food-health',
    task:      2 as const,
    title:     'Processed food and public health',
    essayType: 'problem-solution' as const,
    prompt:    `Many people today rely heavily on processed and fast food, which has led to rising rates of obesity and other health problems.\n\nWhat are the main causes of this trend, and what can be done to encourage healthier eating?${CLOSING}`,
    minWords:     250 as const,
    suggestedMin: 40 as const,
    tags: ['health', 'problem-solution'],
  },
];

export const T2_ESSAY_PROMPTS: Task2Prompt[] = RAW.flatMap(bothVersions);
