// FriendlyTeaching.cl — IELTS Writing prompt registry
//
// To add a new prompt: drop it in the right file below and it appears in the
// simulator landing (grouped by version + task).

import type {
  WritingPrompt, AcademicTask1Prompt, GTTask1Prompt, Task2Prompt, IELTSVersion,
} from '@/types/ielts-writing';
import { ACADEMIC_T1_PROMPTS } from './academic-t1';
import { GT_T1_LETTER_PROMPTS } from './gt-t1-letters';
import { T2_ESSAY_PROMPTS } from './t2-essays';

export const ALL_WRITING_PROMPTS: WritingPrompt[] = [
  ...ACADEMIC_T1_PROMPTS,
  ...GT_T1_LETTER_PROMPTS,
  ...T2_ESSAY_PROMPTS,
];

export function getPrompt(id: string): WritingPrompt | undefined {
  return ALL_WRITING_PROMPTS.find(p => p.id === id);
}

export function promptsForVersion(version: IELTSVersion) {
  const task1: (AcademicTask1Prompt | GTTask1Prompt)[] =
    version === 'academic' ? ACADEMIC_T1_PROMPTS : GT_T1_LETTER_PROMPTS;
  const task2: Task2Prompt[] = T2_ESSAY_PROMPTS.filter(p => p.version === version);
  return { task1, task2 };
}
