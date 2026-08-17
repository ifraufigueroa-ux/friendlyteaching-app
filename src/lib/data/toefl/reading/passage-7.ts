// TOEFL Reading Passage 7 — Mock 4 (Physics)
// Subject: superconductivity — discovery, mechanism, and modern applications.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage7: TOEFLReadingPassage = {
  id:    'p7-superconductivity',
  title: 'Superconductivity from Discovery to Application',
  wordCount: 710,
  paragraphs: [
    // 1
    `In 1911, the Dutch physicist Heike Kamerlingh Onnes was measuring the electrical resistance of a mercury wire cooled to temperatures approaching absolute zero. What he observed astonished him. As the temperature crossed a certain threshold — about four degrees above absolute zero — the resistance of the wire did not merely become small; it disappeared entirely. A current started in a loop of the cooled wire would, in principle, flow forever, losing no energy to the resistance that governs the behaviour of every ordinary metal. Kamerlingh Onnes had discovered what became known as superconductivity, and although the phenomenon was clearly extraordinary, its physical explanation would elude physicists for nearly half a century.`,
    // 2
    `The delay was not accidental. Ordinary electrical resistance arises from the collisions of moving electrons with the vibrating atoms of a metal, and no simple modification of that picture could produce the perfect conductivity that Kamerlingh Onnes had seen. What was needed was a genuinely quantum-mechanical account of how electrons could move through a metal without scattering. The account, when it came, was surprising: below the critical temperature, electrons in certain metals pair up — through an indirect interaction mediated by the vibrations of the metal itself — and the resulting pairs behave collectively as a single quantum entity. Once locked into this coordinated state, the electrons pass through the metal as a coherent wave, and the collisions that produce resistance in an ordinary metal no longer occur.`,
    // 3
    `This explanation, developed in 1957 by John Bardeen, Leon Cooper, and Robert Schrieffer, accounted with remarkable success for the behaviour of what are now called conventional superconductors. Yet the theory carried an implication that discouraged some researchers: it seemed to place an upper limit on the temperature at which superconductivity could occur, and that limit was well below the temperature at which even the coldest terrestrial environments naturally exist. Practical use of superconductors appeared to be permanently locked to the availability of expensive liquid helium as a coolant.`,
    // 4
    `This assumption was shaken in 1986, when two researchers at IBM's Zurich laboratory reported a new class of superconductors based on copper-oxide ceramics that operated at much higher temperatures. Within a year, related materials had been found that superconducted above the temperature of liquid nitrogen — a coolant roughly a hundred times cheaper than liquid helium and produced routinely by industry. The excitement was justified in the sense that the new materials made certain applications far more affordable, but the older theoretical framework did not straightforwardly explain how these copper-oxide superconductors worked. Nearly forty years later, the precise mechanism responsible for high-temperature superconductivity in these ceramics remains one of the most actively investigated problems in condensed-matter physics.`,
    // 5
    `Whether or not their mechanism is fully understood, superconductors are already indispensable in several technologies. Magnetic-resonance imaging machines, on which modern medical diagnosis depends, use superconducting electromagnets to produce the powerful, stable magnetic fields the technique requires. Particle accelerators — including the Large Hadron Collider — rely on superconducting magnets to steer beams of subatomic particles around their circular tracks; the collider would be roughly ten times larger, and correspondingly more expensive, if built with ordinary conductors. Ultra-sensitive magnetometers used in brain imaging and geological surveying take advantage of another quantum feature of superconductors: their sensitivity to extraordinarily small magnetic fields.`,
    // 6
    `The unfulfilled promise, and the one that continues to attract public attention, is the transmission of electric power over long distances without loss. In ordinary power lines, approximately five to seven percent of transmitted energy is dissipated as heat before reaching its destination. A national grid built from superconducting cables would eliminate this loss and, with it, a share of global energy consumption comparable to the output of dozens of large power stations. Prototype superconducting cables have been installed in several cities, but the cost of cooling infrastructure has so far limited these to short, specialised links rather than the wide deployment envisioned.`,
    // 7
    `The persistent goal of the field is a material that superconducts at ambient temperature and at ordinary pressure. Recent experiments with hydrogen-rich compounds under extreme pressure have produced superconductivity at temperatures previously thought impossible, but the pressures required — several million times atmospheric — remain far outside anything usable outside a diamond anvil in a laboratory. Whether a room-temperature, room-pressure superconductor will eventually be found, or whether such a material is fundamentally forbidden by physics, is not yet known. What is certain is that the phenomenon Kamerlingh Onnes stumbled upon in 1911 has continued to shape the outer frontier of both fundamental physics and practical technology for more than a century.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, what did Kamerlingh Onnes observe in 1911?',
      options: [
        'The resistance of a mercury wire increased slowly with cooling',
        'The resistance of a mercury wire dropped to zero below a certain temperature',
        'A new subatomic particle inside a mercury wire',
        'Electrical currents in metals reverse direction near absolute zero',
      ],
      correct: 1,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 1,
      prompt: 'The word "elude" in paragraph 1 is closest in meaning to',
      options: ['convince', 'escape or evade', 'attract', 'depend on'],
      correct: 1,
    },
    {
      id: 'q3', type: 'inference', refPara: 2,
      prompt: 'What can be inferred from paragraph 2 about why superconductivity took so long to explain?',
      options: [
        'The mercury wire in the original experiment was too small to study',
        'A satisfying explanation required a quantum-mechanical account that could not be produced by modifying classical ideas',
        'Kamerlingh Onnes destroyed his experimental apparatus',
        'The phenomenon was widely regarded as a measurement error',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'factual', refPara: 2,
      prompt: 'According to paragraph 2, how do electrons behave in a conventional superconductor below its critical temperature?',
      options: [
        'They stop moving entirely',
        'They pair up and pass through the metal as a coherent quantum wave',
        'They collide with the atoms of the metal at higher rates',
        'They emit large amounts of light',
      ],
      correct: 1,
    },
    {
      id: 'q5', type: 'rhetorical-purpose', refPara: 3,
      prompt: 'Why does the author mention that the 1957 theory placed an upper temperature limit on superconductivity?',
      options: [
        'To argue that the 1957 theory was fundamentally wrong',
        'To explain why practical use of superconductors seemed permanently tied to expensive liquid-helium cooling',
        'To show that the theory could not explain low-temperature results',
        'To introduce the discovery of superconductivity in ceramics',
      ],
      correct: 1,
    },
    {
      id: 'q6', type: 'factual', refPara: 4,
      prompt: 'What made the 1986 discovery of copper-oxide superconductors significant for applications?',
      options: [
        'They superconducted above the temperature of liquid nitrogen, a much cheaper coolant than liquid helium',
        'They eliminated the need for any coolant at all',
        'They were the first superconductors made of metal',
        'They confirmed the 1957 theoretical framework',
      ],
      correct: 0,
    },
    {
      id: 'q7', type: 'sentence-simplification', refPara: 5,
      prompt: 'Which best expresses the essential information in the highlighted sentence: "Particle accelerators — including the Large Hadron Collider — rely on superconducting magnets to steer beams of subatomic particles around their circular tracks; the collider would be roughly ten times larger, and correspondingly more expensive, if built with ordinary conductors."',
      options: [
        'The Large Hadron Collider is the only accelerator that uses superconducting magnets',
        'Without superconducting magnets, particle accelerators would need to be much larger and much more expensive to work',
        'Ordinary conductors cannot generate any magnetic field at all',
        'The Large Hadron Collider is smaller because superconducting magnets are heavier than ordinary ones',
      ],
      correct: 1,
    },
    {
      id: 'q8', type: 'negative-factual', refPara: 5,
      prompt: 'Paragraph 5 mentions all of the following applications of superconductors EXCEPT',
      options: [
        'magnetic-resonance imaging in medicine',
        'steering particle beams in accelerators',
        'ultra-sensitive magnetometers for brain imaging',
        'refrigeration systems for consumer electronics',
      ],
      correct: 3,
    },
    {
      id: 'q9', type: 'inference', refPara: 6,
      prompt: 'What does paragraph 6 suggest is the main obstacle to using superconducting cables in national power grids?',
      options: [
        'Their electrical performance is worse than that of ordinary cables',
        'The cost of cooling infrastructure has limited them to short, specialised links',
        'Governments have banned their use because of safety concerns',
        'They cannot carry more than a few amps of current',
      ],
      correct: 1,
    },
    {
      id: 'q10', type: 'inference',
      prompt: 'What is the author\'s overall assessment of superconductivity research?',
      options: [
        'Its practical importance is small, and interest is only theoretical',
        'It has produced important technologies and remains a frontier of both physics and applications more than a century after its discovery',
        'It is a solved problem with no significant unanswered questions',
        'It is a field kept alive mainly by the hope of a room-temperature superconductor',
      ],
      correct: 1,
    },
  ],
};
