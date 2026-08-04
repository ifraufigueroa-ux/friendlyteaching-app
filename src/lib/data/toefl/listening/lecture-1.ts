// TOEFL Listening Lecture 1 — Introductory mock
// Subject: geology (formation of caves). ~4-5 min audio when TTS'd.

import type { TOEFLListeningAudio } from '@/types/toefl';

export const lecture1: TOEFLListeningAudio = {
  id:       'lecture-1',
  type:     'lecture',
  title:    'Cave Formation',
  subject:  'Geology',
  speakers: [
    { id: 'prof', name: 'Professor' },
  ],
  script: [
    { speakerId: 'prof', text:
      `Alright, let's continue with our discussion of karst landscapes. Today I want to focus on one of the most striking features of karst — caves — and specifically on how the largest cave systems come to exist. Most people, when they think about caves, imagine a hole opening in the side of a hill, and they assume that the cave was simply always there, waiting to be found. That's not how it works. Almost all the caves we study — the big ones, the ones with named rooms and mapped tunnels — were dissolved out of solid rock, mostly limestone, over hundreds of thousands or even millions of years.` },
    { speakerId: 'prof', text:
      `The chemistry here is straightforward. When rainwater falls, it picks up carbon dioxide from the air, and then more carbon dioxide as it seeps through soil that's rich in decaying plant matter. That makes the water slightly acidic — carbonic acid, technically, though it's a very weak acid. Now, limestone is a rock made mostly of calcium carbonate, and calcium carbonate happens to be susceptible to this exact acid. So when the acidic water hits limestone, particularly along cracks and fractures, it slowly dissolves the rock and carries the dissolved material away. Emphasis on slowly. We're talking about millimetres per century, in most cases.` },
    { speakerId: 'prof', text:
      `Now, here's where it gets interesting. That process by itself would just give you slightly wider cracks, not caves. What produces a cave is the coming together of several conditions. First, you need a very large amount of limestone, ideally hundreds of metres thick. Second, you need a water table that drops over time — because the biggest cave passages form right at the water table, where the water is moving horizontally. As the water table drops, those passages are left dry, and the water is now dissolving new passages deeper down. So a really impressive cave system is often a stack of levels, each one corresponding to a former position of the water table.` },
    { speakerId: 'prof', text:
      `Third — and this is often overlooked — you need time. The famous Mammoth Cave in Kentucky, which is the longest cave system in the world, has been dissolving for roughly ten million years. The Carlsbad Caverns in New Mexico have a different history: those formed not from carbonic acid from above, but from sulphuric acid rising from below, associated with nearby oil deposits. That's a much faster process, but also much rarer. Most caves you'll encounter formed the slow way.` },
    { speakerId: 'prof', text:
      `One thing I want to make sure you understand is that a cave doesn't stop developing once it's above the water table. That's when the classic cave features — stalactites hanging from the ceiling, stalagmites growing up from the floor — start to form. What's happening there is essentially the reverse of dissolution. Water that seeped through the rock above is now slightly saturated with dissolved calcium carbonate, and when it drips into the cave, some of that carbon dioxide comes out of solution, and the calcium carbonate precipitates back out as solid rock. Drip by drip, over millennia.` },
    { speakerId: 'prof', text:
      `For your reading assignment — I want you to compare two chapters on cave development, one from the textbook and one that's on the reserve shelf at the library. Pay particular attention to how each author treats the timescale problem. Caves are one of those features where the process is so slow relative to human observation that the geological arguments have to be built almost entirely from indirect evidence. It's a good case study in how we know what we think we know about the deep past.` },
  ],
  questions: [
    {
      id: 'l1-q1',
      prompt: 'What is the lecture mainly about?',
      options: [
        'A comparison of the world\'s largest cave systems',
        'Methods used to date cave features',
        'The chemical composition of limestone',
        'How large cave systems are formed and shaped over time',
      ],
      correct: 3,
    },
    {
      id: 'l1-q2',
      prompt: 'According to the professor, what makes ordinary rainwater capable of dissolving limestone?',
      options: [
        'The high pressure at which it enters cracks',
        'Its temperature after warming underground',
        'Carbon dioxide it absorbs from the air and soil, forming a weak carbonic acid',
        'Sulphuric acid released from surrounding rocks',
      ],
      correct: 2,
    },
    {
      id: 'l1-q3',
      prompt: 'Why does the professor mention that some cave systems are arranged in levels?',
      options: [
        'To show that most caves are artificially divided by geologists for study',
        'To explain that each level corresponds to a former position of the water table',
        'To argue that cave systems are older than previously thought',
        'To illustrate that human construction has modified natural caves',
      ],
      correct: 1,
    },
    {
      id: 'l1-q4',
      prompt: 'How does the formation of the Carlsbad Caverns differ from that of most caves?',
      options: [
        'They formed from sulphuric acid rising from below, which is faster but rarer',
        'They formed from glacial meltwater',
        'They formed at the same time as the surrounding mountains rose',
        'They are still forming today at unusually rapid rates',
      ],
      correct: 0,
    },
    {
      id: 'l1-q5',
      prompt: 'According to the professor, what causes stalactites and stalagmites to grow?',
      options: [
        'Precipitation of calcium carbonate as dripping water releases carbon dioxide',
        'Continued dissolution of limestone by acidic water',
        'Vibrations from earthquakes reshaping the cave interior',
        'Deposits left behind by cave-dwelling animals',
      ],
      correct: 0,
    },
    {
      id: 'l1-q6',
      prompt: 'What is the purpose of the reading assignment the professor describes at the end of the lecture?',
      options: [
        'To identify errors in the current textbook',
        'To learn how geologists reason about processes that are far too slow to observe directly',
        'To prepare students for the next lecture on volcanic rocks',
        'To choose a specific cave to visit for their field trip',
      ],
      correct: 1,
    },
  ],
};
