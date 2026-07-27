// TOEFL Reading Passage 1 — Introductory mock
// Subject: astronomy (habitable-zone planets). ~700 words, 10 MCQ mirroring
// ETS question mix: factual, negative-factual, vocabulary, inference,
// rhetorical purpose, sentence simplification, reference.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage1: TOEFLReadingPassage = {
  id:    'p1-habitable-zone',
  title: 'The Search for Habitable Worlds',
  wordCount: 706,
  paragraphs: [
    // 1
    `For most of the twentieth century, astronomers who studied planets outside our solar system had no way of knowing whether such worlds existed at all. The first confirmed detection of an exoplanet orbiting a Sun-like star came in 1995, and in the three decades since, the count has grown to more than five thousand. This explosion of data has transformed a once-speculative field into an empirical science, and it has also given rise to a specific and intensely studied question: how many of these planets could plausibly support life?`,
    // 2
    `The central concept in this line of inquiry is the so-called habitable zone — a shell-shaped region around a star within which surface temperatures on a rocky planet would allow liquid water to persist. Water is treated as the crucial ingredient because every known form of life depends on it, and because its molecular properties make it a uniquely versatile solvent for the chemistry of living cells. A planet that orbits too close to its star loses its water to a runaway greenhouse effect, as Venus did; one that orbits too far freezes, as appears to have happened on Mars.`,
    // 3
    `The precise limits of the habitable zone depend on the star's mass and luminosity, as well as on properties of the planet itself, particularly its atmosphere. A dense atmosphere can trap heat and expand the outer edge of the zone outward; a thin one shrinks it inward. Because these atmospheric conditions cannot be measured directly for most exoplanets, current estimates of the habitable zone are necessarily conservative. Astronomers typically report a "conservative" and an "optimistic" zone, differing by as much as fifty percent in width.`,
    // 4
    `Even a planet firmly within the habitable zone, however, is not guaranteed to be habitable. Tidal locking is one complication: planets that orbit close to small, cool stars — the type most commonly surveyed — often end up with one hemisphere permanently facing their star. The resulting extremes of temperature between the day side and the night side can be violent, and the atmosphere may collapse onto the frozen night side unless winds redistribute heat efficiently. Whether such conditions preclude life is one of the most contested questions in the field.`,
    // 5
    `A second complication is stellar activity. The cool red dwarfs that dominate the population of nearby stars are prone to intense flares that can strip a planet of its atmosphere over geological time. If Proxima Centauri b, the closest known exoplanet to Earth, receives even a fraction of the flare radiation that its parent star is capable of producing, its prospects for retaining an atmosphere — and therefore any water — are uncertain.`,
    // 6
    `Given these caveats, the more accurate way to state the current consensus is that "habitable" describes potential rather than confirmation. Planets in the habitable zone are worthy of closer study, not certificates of biological promise. The next generation of instruments, including the James Webb Space Telescope and several ground-based observatories under construction, will begin to obtain spectra of exoplanet atmospheres. Certain combinations of gases — oxygen and methane appearing together, for instance — are difficult to explain without a biological source and would be a strong (though not conclusive) sign of life.`,
    // 7
    `It is worth noting that even a confirmed biosignature would leave much unanswered. The gases could point to microbes rather than complex organisms, and the light we now receive from a distant planet was emitted many years ago. What we would learn is that life, in some form, is not exclusive to our own planet — a finding whose scientific and cultural weight is difficult to overstate, but which would raise as many questions as it answers.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, what changed in 1995?',
      options: [
        'Astronomers first proposed the concept of the habitable zone',
        'The first exoplanet orbiting a Sun-like star was confirmed',
        'Over five thousand exoplanets had been catalogued',
        'The James Webb Space Telescope began operating',
      ],
      correct: 1,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 2,
      prompt: 'The word "persist" in paragraph 2 is closest in meaning to',
      options: ['freeze', 'continue to exist', 'evaporate quickly', 'form for the first time'],
      correct: 1,
    },
    {
      id: 'q3', type: 'factual', refPara: 2,
      prompt: 'Why does the passage describe water as the crucial ingredient for life?',
      options: [
        'Because it is the most common molecule in the universe',
        'Because all known life depends on it and its molecular properties make it a uniquely versatile solvent',
        'Because it can survive both Venus-like and Mars-like conditions',
        'Because it is the only substance whose limits define a habitable zone',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'inference', refPara: 3,
      prompt: 'It can be inferred from paragraph 3 that current estimates of the habitable zone are conservative because',
      options: [
        'Astronomers disagree about the mass of most exoplanets',
        'The properties of exoplanet atmospheres cannot generally be measured directly',
        'Only rocky planets are considered for the habitable zone',
        'Stars with different masses are treated as identical for simplicity',
      ],
      correct: 1,
    },
    {
      id: 'q5', type: 'rhetorical-purpose', refPara: 4,
      prompt: 'The author mentions tidal locking in paragraph 4 primarily in order to',
      options: [
        'Argue that planets around small stars cannot be habitable',
        'Illustrate a complication that can undermine habitability even within the habitable zone',
        'Explain why Proxima Centauri b is unusually well-studied',
        'Contrast the mass of small stars with that of Sun-like stars',
      ],
      correct: 1,
    },
    {
      id: 'q6', type: 'negative-factual', refPara: 5,
      prompt: 'According to paragraph 5, all of the following are true about red dwarfs EXCEPT that they',
      options: [
        'Dominate the population of nearby stars',
        'Can produce intense flares over geological time',
        'Are cooler than Sun-like stars',
        'Have been shown to strip Proxima Centauri b of its atmosphere',
      ],
      correct: 3,
    },
    {
      id: 'q7', type: 'sentence-simplification', refPara: 6,
      prompt: 'Which of the following best expresses the essential information in the highlighted sentence: "Planets in the habitable zone are worthy of closer study, not certificates of biological promise."',
      options: [
        'Planets in the habitable zone should be studied because they are certain to host life',
        'Being in the habitable zone justifies further study, but it is not itself proof that a planet supports life',
        'Only planets outside the habitable zone deserve close study',
        'Biological promise is more important than the habitable zone in identifying candidates',
      ],
      correct: 1,
    },
    {
      id: 'q8', type: 'factual', refPara: 6,
      prompt: 'According to paragraph 6, what would the presence of both oxygen and methane in an exoplanet\'s atmosphere suggest?',
      options: [
        'That the planet is definitely inhabited',
        'That the planet\'s atmosphere is stable and old',
        'A strong but not conclusive sign of life',
        'That the planet has weather patterns like Earth\'s',
      ],
      correct: 2,
    },
    {
      id: 'q9', type: 'reference', refPara: 7,
      prompt: 'The phrase "a finding" in paragraph 7 refers to',
      options: [
        'A future confirmed biosignature',
        'The detection of exoplanet atmospheres',
        'The construction of ground-based observatories',
        'The current consensus on habitability',
      ],
      correct: 0,
    },
    {
      id: 'q10', type: 'inference',
      prompt: 'What is the author\'s overall stance in the passage?',
      options: [
        'Confident that life will soon be confirmed on many exoplanets',
        'Sceptical that the concept of a habitable zone is scientifically useful',
        'Cautiously optimistic — habitability is a research target, not a settled fact',
        'Concerned that public expectations of the field have been overstated',
      ],
      correct: 2,
    },
  ],
};
