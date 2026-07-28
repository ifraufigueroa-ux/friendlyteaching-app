// FriendlyTeaching.cl — Placement Test Speaking Bank
// 3 prompts per CEFR level. The runner picks a level-matched set of 3
// (or defaults to B1 mid-scale). Each recording is transcribed with
// Whisper and evaluated by Claude against CEFR descriptors.

import type { SpeakingPromptPlacement } from '@/types/placement-suite';

export const PLACEMENT_SPEAKING: SpeakingPromptPlacement[] = [
  // A1 — 30s
  { id: 's-a1-1', level: 'A1', prompt: 'Introduce yourself. Say your name, where you live, and what you do.', prepSec: 10, speakSec: 30 },
  { id: 's-a1-2', level: 'A1', prompt: 'Describe your family. How many people are in it?', prepSec: 10, speakSec: 30 },
  { id: 's-a1-3', level: 'A1', prompt: 'What do you usually eat for breakfast?', prepSec: 10, speakSec: 30 },

  // A2 — 45s
  { id: 's-a2-1', level: 'A2', prompt: 'Describe your typical day from morning to evening.', prepSec: 15, speakSec: 45 },
  { id: 's-a2-2', level: 'A2', prompt: 'What did you do last weekend? Talk about at least two activities.', prepSec: 15, speakSec: 45 },
  { id: 's-a2-3', level: 'A2', prompt: 'Talk about a hobby or activity you enjoy and why you like it.', prepSec: 15, speakSec: 45 },

  // B1 — 45s
  { id: 's-b1-1', level: 'B1', prompt: 'Describe a person who has influenced you in a positive way. What did they do and how did it affect you?', prepSec: 20, speakSec: 45 },
  { id: 's-b1-2', level: 'B1', prompt: 'Talk about a place you have visited recently. What made it memorable?', prepSec: 20, speakSec: 45 },
  { id: 's-b1-3', level: 'B1', prompt: 'What do you usually do to relax after a stressful day, and why does it help?', prepSec: 20, speakSec: 45 },

  // B1+ — 60s
  { id: 's-b1plus-1', level: 'B1+', prompt: 'Some people prefer city life, others prefer the countryside. Which do you prefer and why? Give at least one specific example.', prepSec: 20, speakSec: 60 },
  { id: 's-b1plus-2', level: 'B1+', prompt: 'Talk about a challenge you overcame recently. What happened and what did you learn from it?', prepSec: 20, speakSec: 60 },
  { id: 's-b1plus-3', level: 'B1+', prompt: 'If you had one free day next week, how would you spend it and why?', prepSec: 20, speakSec: 60 },

  // B2 — 60s
  { id: 's-b2-1',  level: 'B2', prompt: 'Do you think social media has made us more or less connected as a society? Support your view with an example.', prepSec: 20, speakSec: 60 },
  { id: 's-b2-2',  level: 'B2', prompt: 'What is one habit you would like to change in your life, and what makes it hard to change?', prepSec: 20, speakSec: 60 },
  { id: 's-b2-3',  level: 'B2', prompt: 'Some governments impose taxes on unhealthy food. Do you agree with this policy? Explain your reasoning.', prepSec: 20, speakSec: 60 },

  // C1 — 75s
  { id: 's-c1-1', level: 'C1', prompt: 'Consider the claim that specialisation is more valuable than versatility in a professional career. Where do you stand, and why?', prepSec: 25, speakSec: 75 },
  { id: 's-c1-2', level: 'C1', prompt: 'To what extent should artificial intelligence be regulated by governments? Discuss the trade-offs and defend your position.', prepSec: 25, speakSec: 75 },
  { id: 's-c1-3', level: 'C1', prompt: 'Describe a time when you had to change your mind about something you were previously certain of. What triggered the shift, and what did it teach you about your own thinking?', prepSec: 25, speakSec: 75 },
];

export function pickSpeakingPromptsForAnchor(anchor: string, count: number): SpeakingPromptPlacement[] {
  const atAnchor = PLACEMENT_SPEAKING.filter(p => p.level === anchor);
  if (atAnchor.length >= count) return atAnchor.slice(0, count);
  // Fallback: mix in adjacent levels.
  const order = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
  const idx = order.indexOf(anchor);
  const collected = [...atAnchor];
  for (let r = 1; collected.length < count && r < order.length; r++) {
    for (const dir of [-1, 1] as const) {
      const i = idx + dir * r;
      if (i < 0 || i >= order.length) continue;
      const extras = PLACEMENT_SPEAKING.filter(p => p.level === order[i]);
      for (const e of extras) {
        if (collected.length >= count) break;
        collected.push(e);
      }
    }
  }
  return collected.slice(0, count);
}
