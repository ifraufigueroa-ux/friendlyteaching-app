// TOEFL Reading Passage 6 — Mock 3 (Environmental science / marine biology)
// Subject: coral bleaching. ~700 words.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage6: TOEFLReadingPassage = {
  id:    'p6-coral-bleaching',
  title: 'Coral Bleaching and Reef Recovery',
  wordCount: 705,
  paragraphs: [
    // 1
    `Coral reefs are among the most diverse ecosystems on Earth. Although they cover less than one percent of the ocean's surface, they provide habitat for roughly a quarter of all known marine species and support the livelihoods of hundreds of millions of people who depend on reef-based fisheries and coastal protection. Since the 1980s, however, reefs have been affected by a phenomenon known as coral bleaching, in which large expanses of reef lose their colour and, if the underlying cause is not reversed, die.`,
    // 2
    `The biology of bleaching is now well understood. Reef-building corals harbour, within the cells of their tissues, single-celled algae called zooxanthellae. The relationship is mutual: the algae photosynthesise and pass most of the resulting sugars to the coral, which returns waste nutrients and provides the algae with a stable, sunlit environment. The characteristic colours of a healthy coral come from these algal partners. When the relationship breaks down and the coral expels the algae, the animal's white skeleton becomes visible through its now-transparent tissue — hence the term "bleaching."`,
    // 3
    `A brief expulsion of the algae is not, in itself, fatal. Corals can survive several weeks without their partners, and if conditions return to normal within that window, the algae can be reacquired and the reef recovers. The problem arises when the trigger persists. The most common trigger, by a considerable margin, is elevated sea temperature: even one or two degrees Celsius above the local summer maximum, sustained for a few weeks, is enough to induce bleaching over hundreds of kilometres of reef simultaneously. Extended bleaching leads to starvation of the coral animal, and if the temperature stress continues, death follows.`,
    // 4
    `Bleaching events have grown in frequency and severity in the past four decades. The first documented mass bleaching occurred in 1983; since then, at least five global bleaching events have been recorded, with the 2014 to 2017 episode affecting reefs on a scale unmatched in the observational record. What makes the recent events particularly worrying is not the peak severity but the shortened interval between them. Historically, a reef that experienced severe bleaching had perhaps ten to fifteen years to recover before the next event; recent bleaching events have followed one another within a small number of years, leaving insufficient time for recovery.`,
    // 5
    `Recovery, when it occurs, is not simply a matter of the surviving corals regrowing. The species composition of a recovering reef is usually different from the one that was lost. Fast-growing branching corals, such as those of the genus Acropora, are highly vulnerable to bleaching but recolonise quickly if conditions improve; slow-growing massive corals of the genus Porites are more heat-tolerant but reappear far more slowly. As a result, a reef that has survived several bleaching cycles often shifts toward a lower-diversity assemblage dominated by a few resistant species — still a coral reef, but a structurally simpler one, with fewer of the intricate microhabitats that support the reef's characteristic fish and invertebrate diversity.`,
    // 6
    `Marine biologists studying recovery have identified a small number of reefs that have proved surprisingly resilient. Some of these lie in areas naturally exposed to frequent temperature fluctuations — inlets and shallow lagoons where corals evolved with a wider tolerance for stress. Others sit near cold-water upwellings that periodically reset the local temperature during heat waves. A third category, and one whose mechanisms are still being investigated, appears to have benefited from repeated mild bleaching that culled the least tolerant colonies without collapsing the reef, leaving behind a population better adapted to warmer conditions.`,
    // 7
    `The practical difficulty for conservation is that the primary driver of mass bleaching — the average temperature of the surface ocean — cannot be addressed at the local scale. Reducing pollution, protecting fish populations, and limiting physical damage from anchoring or tourism can improve a reef's odds of recovery, but they cannot prevent temperature-driven bleaching in the first place. The window in which conventional reef protection can be effective therefore depends on the global trajectory of warming. Marine scientists tend to describe their work in this area with a mixture of urgency and cautious hope: enough of the ingredients for recovery still exist that reef futures are not entirely determined, but the range of possible outcomes narrows with every warm summer.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, coral reefs are especially valuable ecosystems because',
      options: [
        'they cover most of the ocean floor',
        'they contain the world\'s largest fish',
        'they host roughly a quarter of all known marine species despite covering less than 1% of the ocean',
        'they were the first ecosystems studied by marine biologists',
      ],
      correct: 2,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 2,
      prompt: 'The word "harbour" in paragraph 2 is closest in meaning to',
      options: ['expel', 'shelter within', 'search for', 'consume as food'],
      correct: 1,
    },
    {
      id: 'q3', type: 'factual', refPara: 2,
      prompt: 'What causes the white "bleached" appearance of a coral?',
      options: [
        'The coral bleaches its own tissue as a defence',
        'The coral\'s white skeleton becomes visible after the algae are expelled from its now-transparent tissue',
        'A pigment change in the algae themselves',
        'Direct sunlight bleaches the coral\'s outer layer',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'inference', refPara: 3,
      prompt: 'What can be inferred from paragraph 3 about a mild, short-term bleaching event?',
      options: [
        'It always kills the entire reef',
        'It can be reversed if the coral reacquires its algae within a few weeks',
        'It occurs only in cold-water reefs',
        'It cannot occur if temperatures rise by less than five degrees Celsius',
      ],
      correct: 1,
    },
    {
      id: 'q5', type: 'rhetorical-purpose', refPara: 4,
      prompt: 'Why does the author state that the shortened interval between bleaching events is more worrying than their peak severity?',
      options: [
        'To argue that individual events are becoming less severe over time',
        'To emphasise that reefs no longer have enough time to recover between events',
        'To suggest that severity is impossible to measure accurately',
        'To indicate that only recent events have affected biodiversity',
      ],
      correct: 1,
    },
    {
      id: 'q6', type: 'factual', refPara: 5,
      prompt: 'What does the passage say happens to species composition after repeated bleaching?',
      options: [
        'All coral species recover at the same rate',
        'The reef shifts toward a lower-diversity assemblage dominated by heat-tolerant species',
        'New coral species migrate in from other oceans',
        'Only Acropora species remain because they grow fastest',
      ],
      correct: 1,
    },
    {
      id: 'q7', type: 'sentence-simplification', refPara: 5,
      prompt: 'Which best expresses the essential information in the highlighted sentence: "As a result, a reef that has survived several bleaching cycles often shifts toward a lower-diversity assemblage dominated by a few resistant species — still a coral reef, but a structurally simpler one, with fewer of the intricate microhabitats that support the reef\'s characteristic fish and invertebrate diversity."',
      options: [
        'Reefs that have survived several bleaching cycles are indistinguishable from reefs that have not',
        'Bleached reefs eventually recover their original diversity in every case',
        'Multiple bleaching cycles tend to leave reefs simpler and dominated by tolerant species, reducing the habitat diversity that supports many fish and invertebrates',
        'Fish and invertebrates leave the reef permanently once bleaching occurs',
      ],
      correct: 2,
    },
    {
      id: 'q8', type: 'negative-factual', refPara: 6,
      prompt: 'Paragraph 6 identifies all of the following as factors that appear to make some reefs unusually resilient EXCEPT',
      options: [
        'natural exposure to frequent temperature fluctuations',
        'proximity to cold-water upwellings',
        'repeated mild bleaching that eliminates the least tolerant colonies',
        'the addition of fresh water from nearby rivers',
      ],
      correct: 3,
    },
    {
      id: 'q9', type: 'reference', refPara: 7,
      prompt: 'The word "they" in paragraph 7 (in "they cannot prevent temperature-driven bleaching") refers most directly to',
      options: [
        'coral reefs',
        'local conservation measures such as reducing pollution',
        'marine biologists',
        'warm summers',
      ],
      correct: 1,
    },
    {
      id: 'q10', type: 'inference',
      prompt: 'What is the author\'s overall stance about the future of coral reefs?',
      options: [
        'Optimistic — reefs will fully recover regardless of temperature trends',
        'Purely pessimistic — recovery is already impossible',
        'Cautiously hopeful — recovery is still possible, but the range of good outcomes shrinks with continued warming',
        'Indifferent — reefs are of limited ecological importance',
      ],
      correct: 2,
    },
  ],
};
