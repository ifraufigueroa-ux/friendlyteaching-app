// TOEFL Writing — Task 2 Academic Discussion prompt for Mock 1.
// Format introduced in the 2023 TOEFL revision. 10-minute timer, 100+ words.

import type { TOEFLWritingPrompt } from '@/types/toefl';

export const writingPromptMock1: TOEFLWritingPrompt = {
  id: 'w1-remote-work-policy',
  professorPost:
    `Your professor is teaching a class on labour economics. Write a post responding to the professor's question. In your response you should:\n\n– express and support your opinion\n– make a contribution to the discussion\n\nAn effective response will contain at least 100 words. You have 10 minutes to write it.`,
  question:
    `Professor Álvarez: In the past few years, many large companies have introduced permanent remote-work policies for at least part of their workforce. Some economists argue that this trend will make cities less economically dynamic in the long run, because face-to-face interaction between workers drives a lot of innovation. Others counter that remote work simply spreads that dynamism to a wider range of places, and that innovation does not depend on any single city. Which side of this debate do you find more convincing, and why?`,
  studentA: {
    name: 'Karen',
    text:
      `I think permanent remote work will hurt cities in the long run. When I visited San Francisco last summer, my cousin — who works in tech — told me that many of the cafés and coworking spaces where people used to have chance conversations are now half empty. Those "accidental" meetings really do lead to new ideas and start-ups, and you cannot replicate them on video calls.`,
  },
  studentB: {
    name: 'Miguel',
    text:
      `I disagree. Remote work has allowed talent from smaller cities and towns to join projects they never could have joined before. In my own country, I know engineers in provincial cities who are now contributing to global teams. That seems more dynamic to me, not less, even if the effect on any one city is negative.`,
  },
  minWords: 100,
  timerMin: 10,
};
