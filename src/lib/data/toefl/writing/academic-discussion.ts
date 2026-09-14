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
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `I find Miguel's position more convincing, though I would add an important qualification. Karen is right that the "accidental" encounters that once fuelled hubs like San Francisco are harder to reproduce remotely, but this argument treats innovation as if it can only happen in a handful of expensive coastal cities. In reality, remote work has expanded the pool of people who can contribute to complex projects — engineers in Córdoba or Nairobi who were previously locked out by geography now join global teams every day. The city that loses a few cafés may look less dynamic, but the overall economy gains many more contributors. That said, companies should invest deliberately in periodic in-person retreats, because the strongest evidence still shows that early-stage creative work benefits from short bursts of physical proximity.`,
    whyItWorks: [
      'Toma una posición clara en la primera oración y la matiza (no un simple "estoy de acuerdo").',
      'Se refiere por nombre a los dos alumnos (Karen y Miguel) — el rúbrico premia "contribute to the discussion".',
      'Un ejemplo concreto extendido (Córdoba/Nairobi) en vez de generalidades.',
      'Cierra con una síntesis propia (los retreats presenciales) — no repite lo que ya dijeron los otros.',
      'Registro académico, variedad sintáctica (subordinadas, guiones), sin errores gramaticales.',
    ],
  },
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
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `Priya's concern about the "filter bubble" is well founded, but I find Diego's framing ultimately more convincing. A biased media diet is not new: for most of the twentieth century, a family in a small town received one local paper and two television networks, which was hardly a wide range of viewpoints. What social media does change is that the responsibility for building a balanced information diet now falls on the individual, not on an editor. When I actively follow reporters from countries whose politics I disagree with, my feed becomes far more diverse than any single newspaper could be. The genuine danger is not the platforms themselves but the passive user who never leaves the default recommendations. Media literacy education, rather than a nostalgic return to newspapers, is the more realistic response.`,
    whyItWorks: [
      'Reconoce el punto válido de Priya antes de discreparle — evita el "I disagree" plano.',
      'Contexto histórico concreto (siglo XX, un diario local + dos canales) que desafía el supuesto de "más variedad antes".',
      'Ejemplo personal específico (seguir reporteros de otros países) que muestra ownership del argumento.',
      'Reformula el problema (usuario pasivo vs. plataforma) — es una contribución propia, no eco de los otros.',
      'Cierre con propuesta accionable (media literacy) — señal de pensamiento crítico maduro.',
    ],
  },
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
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `I side with Aisha, though I think both classmates are describing real problems that admissions systems will always have to trade off. Tomás is right that expensive test-prep industries distort scores, but removing the test does not remove the underlying inequality; it just shifts it to essays, extracurriculars and school reputation — arenas where wealthy families have even larger advantages. In many countries, the standardised test remains the only channel through which a strong student from an unknown school can prove they belong at a top university. A pragmatic middle path is to keep the test but weight it more modestly, publish the score distribution of the incoming class, and offer free preparation to public-school applicants. That preserves comparability without pretending admissions can ever be perfectly neutral.`,
    whyItWorks: [
      'Reconoce que ambos alumnos identifican problemas reales antes de tomar posición — muestra pensamiento matizado.',
      'Contra-argumento fuerte al planteo de Tomás: sin test, la desigualdad se traslada (no desaparece).',
      'Menciona un caso específico ("strong student from an unknown school") que suena vivido, no teórico.',
      'Propone una tercera vía concreta (mantener test + pesarlo menos + prep gratis) — la contribución más valiosa.',
      'Cierre honesto: "admissions can never be perfectly neutral" — el evaluador premia esta sofisticación.',
    ],
  },
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
  sampleAnswer: {
    scoreOn5: 5,
    text:
      `Marco's historical comparison is reassuring, but I think Nia points at something the camera-and-synthesiser analogy misses. Both of those tools required a human to press the shutter or play the keys with intent; today's generative models can produce a passable illustration from a two-line prompt with almost no craft on the user's side. That collapse in the required human input is what changes the economics for a working illustrator, not the mere existence of a new instrument. However, I do agree with Marco that the top layer of highly original work — where taste and long-term vision matter — is likely to remain human. The question universities and governments should be asking is not whether AI will replace artists, but how to protect the middle-tier commercial work that has historically been the ladder into the profession.`,
    whyItWorks: [
      'Aísla exactamente qué falla en la analogía de Marco (el input humano requerido) — análisis fino, no reacción genérica.',
      'Concede a Marco lo que es cierto ("top layer... likely to remain human") — muestra fair-mindedness.',
      'Reencuadra el debate con una pregunta más útil (proteger la "middle-tier commercial work") — contribución original.',
      'Vocabulario preciso ("collapse in the required human input", "ladder into the profession") — nivel académico alto.',
      'Estructura clara: concesión → objeción específica → matiz → reformulación. Cada oración avanza el argumento.',
    ],
  },
};
