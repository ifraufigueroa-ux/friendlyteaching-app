// TOEFL Writing — Task 2 Academic Discussion prompts.
// Format introduced in the 2023 TOEFL revision. 10-minute timer, 100+ words.
// One prompt per mock. Each includes a professor question and two brief
// student posts that the test-taker must respond to.

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

export const writingPromptMock2: TOEFLWritingPrompt = {
  id: 'w2-social-media-news',
  professorPost:
    `Your professor is teaching a class on media and society. Write a post responding to the professor's question. In your response you should:\n\n– express and support your opinion\n– make a contribution to the discussion\n\nAn effective response will contain at least 100 words. You have 10 minutes to write it.`,
  question:
    `Professor Nakamura: In many countries, most young adults now get the majority of their news from social media platforms rather than from traditional newspapers or television networks. Some observers argue that this shift is dangerous because it exposes readers to a narrower and more biased range of viewpoints. Others argue that it is beneficial because it gives readers direct access to a wider variety of voices, including those that traditional media used to ignore. Which position do you find more convincing, and why?`,
  studentA: {
    name: 'Priya',
    text:
      `I think the shift is mostly dangerous. Social media platforms show us posts based on what we already like, so over time we mainly see viewpoints that confirm what we already think. When I compare the range of stories my grandparents read in a printed newspaper with the ones that appear on my feed, my grandparents actually see more variety, not less.`,
  },
  studentB: {
    name: 'Diego',
    text:
      `I disagree. Traditional newspapers also had strong biases — they were just less visible. Social media lets me follow journalists from other countries directly, read primary sources, and hear from communities that used to be ignored. The problem is not the platform itself but how we choose to use it.`,
  },
  minWords: 100,
  timerMin: 10,
};

export const writingPromptMock3: TOEFLWritingPrompt = {
  id: 'w3-standardised-testing',
  professorPost:
    `Your professor is teaching a class on educational policy. Write a post responding to the professor's question. In your response you should:\n\n– express and support your opinion\n– make a contribution to the discussion\n\nAn effective response will contain at least 100 words. You have 10 minutes to write it.`,
  question:
    `Professor Ojeda: Many universities are now debating whether to reduce or eliminate the role of standardised tests, such as the SAT or entrance examinations, in their admissions processes. Some argue that removing these tests makes admissions fairer, because scores are strongly correlated with family income. Others argue that removing the tests makes admissions more subjective and gives an advantage to applicants who attended well-known schools. Do you think universities should keep standardised tests as a major part of their admissions decisions? Why or why not?`,
  studentA: {
    name: 'Aisha',
    text:
      `I think tests should stay, though not as the only factor. A standardised score is one of the very few pieces of an application that is not shaped by the reputation of the applicant's school. Without it, admissions officers rely much more heavily on where an applicant studied, which I think ends up hurting exactly the students they say they want to help.`,
  },
  studentB: {
    name: 'Tomás',
    text:
      `I disagree. In my country, entire tutoring industries exist to game these tests. Students from wealthy families take courses their classmates cannot afford, and their scores rise accordingly. Removing the test forces universities to look at what students actually did in school and beyond, which is a more accurate picture.`,
  },
  minWords: 100,
  timerMin: 10,
};

export const writingPromptMock4: TOEFLWritingPrompt = {
  id: 'w4-ai-creative-work',
  professorPost:
    `Your professor is teaching a class on technology and society. Write a post responding to the professor's question. In your response you should:\n\n– express and support your opinion\n– make a contribution to the discussion\n\nAn effective response will contain at least 100 words. You have 10 minutes to write it.`,
  question:
    `Professor Bell: Artificial intelligence tools can now generate images, music, and written text at a level that many people find difficult to distinguish from work made by humans. Some argue that these tools should be treated as a new form of creative instrument — like the camera or the synthesiser — that will expand what human artists can do. Others argue that widespread use of these tools will devalue original creative work and eventually reduce the number of people who can make a living from it. Which view do you find more convincing, and why?`,
  studentA: {
    name: 'Nia',
    text:
      `I lean towards the pessimistic view. When a client can generate a passable illustration in thirty seconds for almost no cost, it becomes very hard to justify paying an illustrator for a week of work. Camera and synthesiser did not replace painters or musicians because those tools still required a human to operate them expressively; today's AI tools work with much less human input, and that changes the economics.`,
  },
  studentB: {
    name: 'Marco',
    text:
      `I disagree with Nia. Every new technology has caused this same anxiety and each time human creative work has adapted, not disappeared. What may vanish is a certain layer of routine commercial work, but the space for genuinely original human vision, and for the taste and judgement that AI tools still cannot supply, is likely to grow, not shrink.`,
  },
  minWords: 100,
  timerMin: 10,
};
