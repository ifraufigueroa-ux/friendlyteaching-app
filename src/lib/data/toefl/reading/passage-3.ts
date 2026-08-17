// TOEFL Reading Passage 3 — Mock 2 (Biology / Ecology)
// Subject: pollinator decline and its ecological consequences. ~700 words,
// full ETS question mix.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage3: TOEFLReadingPassage = {
  id:    'p3-pollinator-decline',
  title: 'The Decline of Wild Pollinators',
  wordCount: 704,
  paragraphs: [
    // 1
    `Approximately three-quarters of the world's flowering plants and roughly a third of global food crops depend on animal pollinators for reproduction. Most of that work is done not by the familiar domesticated honeybee but by wild pollinators: bumblebees, solitary bees, hoverflies, moths, butterflies, and — in tropical regions — bats and birds. Because these animals are less visible than commercial hives and do not belong to any single industry, their decline over the past several decades attracted little public attention until the ecological and agricultural consequences began to be quantified.`,
    // 2
    `The evidence for the decline itself is now robust. Long-term monitoring programmes in Europe and North America have documented losses of individual pollinator species that in some cases exceed seventy percent over three or four decades. In one widely cited German study, the total biomass of flying insects captured in nature reserves fell by more than seventy-five percent between the late 1980s and the mid-2010s. The causes are multiple and, importantly, interact with one another rather than acting in isolation.`,
    // 3
    `The single largest factor is habitat loss. As agricultural landscapes have been consolidated into ever larger monocultures, the hedgerows, meadows, and patches of unmanaged land that once supported a diverse flora have shrunk. Because most wild bees are specialists that visit only a narrow range of plant species, the loss of a single group of wildflowers can eliminate an entire pollinator community from a region. What appears to farmers as merely cleaner and more efficient cultivation is often, from the pollinator's perspective, the disappearance of an entire ecosystem.`,
    // 4
    `Pesticides constitute a second, more contested factor. A class of insecticides known as neonicotinoids came into wide use in the 1990s and has been shown, in both laboratory and field studies, to impair the navigation, foraging, and reproductive success of bees even at doses far below those needed to kill them outright. Because these effects are sublethal, they are easily missed by regulatory tests focused on acute toxicity. The European Union imposed significant restrictions on neonicotinoid use in 2018, but the chemicals remain widely used elsewhere, and other insecticide classes present similar concerns.`,
    // 5
    `A third factor, and one that is only recently receiving detailed study, is climate change. Many wild pollinators are strongly seasonal: they emerge in spring in response to temperature cues and must find flowers in bloom within a narrow window. If warming causes plants to flower earlier while the insect life cycle does not shift correspondingly, the two can fall out of synchrony. Bumblebees, whose queens overwinter and emerge at a fixed time, are particularly vulnerable to this kind of phenological mismatch. Field data from mountainous regions suggest that suitable elevation ranges for several bumblebee species have contracted noticeably over the past thirty years.`,
    // 6
    `A common response to these findings is to suggest that honeybee colonies can simply be increased to compensate. This assumption is misleading. Honeybees are efficient generalist pollinators of some crops but perform poorly on others; tomatoes, blueberries, and certain squashes are pollinated far more effectively by bumblebees, which can vibrate their flight muscles to release pollen that other bees cannot access. Furthermore, high densities of managed honeybees can compete with wild pollinators for scarce floral resources and transmit diseases to them, deepening the decline of the wild populations rather than substituting for their services.`,
    // 7
    `The measures that appear to work are, unsurprisingly, the ones that reverse the underlying pressures. Field margins planted with a diverse mix of native wildflowers, reduced pesticide application on land adjacent to pollinator habitat, and the preservation of relatively small patches of unmanaged vegetation can produce measurable increases in local pollinator abundance within a few seasons. These interventions are inexpensive compared with the value of the ecosystem services at stake, but they require coordinated action across ownership boundaries. Because pollinators move freely between fields, a diverse hedgerow on one farm is of limited use if the neighbouring farm is chemically sterile.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, most pollination in the world is carried out by',
      options: [
        'commercially managed honeybees',
        'a wide range of wild insects, birds, and bats',
        'wind rather than any animal',
        'a small number of tropical bird species',
      ],
      correct: 1,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 2,
      prompt: 'The word "robust" in paragraph 2 is closest in meaning to',
      options: ['strong and well-supported', 'physically healthy', 'complicated', 'preliminary'],
      correct: 0,
    },
    {
      id: 'q3', type: 'factual', refPara: 2,
      prompt: 'What does the German study cited in paragraph 2 show?',
      options: [
        'That honeybee populations recovered in the 2010s',
        'That flying insect biomass in nature reserves fell by over seventy-five percent in about three decades',
        'That pesticide use was the dominant cause of insect losses',
        'That insect decline in cities was faster than in reserves',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'inference', refPara: 3,
      prompt: 'It can be inferred from paragraph 3 that many wild bee species',
      options: [
        'can adapt to almost any cultivated landscape',
        'benefit from the consolidation of small fields into larger ones',
        'are unable to survive if a specific group of wildflowers disappears',
        'require the same conditions as domesticated honeybees',
      ],
      correct: 2,
    },
    {
      id: 'q5', type: 'rhetorical-purpose', refPara: 4,
      prompt: 'Why does the author mention that neonicotinoid effects on bees are sublethal?',
      options: [
        'To argue that the effects are unimportant',
        'To explain why regulatory tests focused on acute toxicity may miss them',
        'To contrast neonicotinoids with older insecticides',
        'To justify continued neonicotinoid use in Europe',
      ],
      correct: 1,
    },
    {
      id: 'q6', type: 'sentence-simplification', refPara: 5,
      prompt: 'Which of the following best expresses the essential information in the highlighted sentence: "If warming causes plants to flower earlier while the insect life cycle does not shift correspondingly, the two can fall out of synchrony."',
      options: [
        'Rising temperatures always harm both plants and insects equally',
        'Plants and insects tend to shift their life cycles at the same rate as the climate warms',
        'When climate change advances plant flowering but not insect emergence, plants and pollinators can end up mismatched in time',
        'Insects can only survive if plants flower on their historical schedule',
      ],
      correct: 2,
    },
    {
      id: 'q7', type: 'factual', refPara: 5,
      prompt: 'Why are bumblebees especially vulnerable to phenological mismatch?',
      options: [
        'They cannot fly in cool weather at all',
        'Their queens overwinter and emerge at a fixed time, which may not match earlier plant flowering',
        'They rely entirely on a single flower species',
        'They lose their navigation abilities during winter',
      ],
      correct: 1,
    },
    {
      id: 'q8', type: 'negative-factual', refPara: 6,
      prompt: 'According to paragraph 6, all of the following are true about relying on managed honeybees to replace wild pollinators EXCEPT that',
      options: [
        'honeybees are less effective on some crops such as tomatoes and blueberries',
        'high densities of honeybees can compete with wild pollinators for floral resources',
        'honeybees can transmit diseases to wild pollinator populations',
        'honeybees are unable to pollinate any wildflower species outside cultivated land',
      ],
      correct: 3,
    },
    {
      id: 'q9', type: 'reference', refPara: 7,
      prompt: 'The word "them" in paragraph 7 (in "the value of the ecosystem services at stake") refers most directly to',
      options: [
        'field margins planted with wildflowers',
        'the interventions described',
        'the underlying pressures on pollinators',
        'honeybees managed by farmers',
      ],
      correct: 1,
    },
    {
      id: 'q10', type: 'inference',
      prompt: 'What is the author\'s main point about protecting wild pollinators?',
      options: [
        'It is technically impossible without eliminating modern agriculture',
        'Simple, inexpensive measures work, but they require coordination across land ownership boundaries',
        'It should be left entirely to government regulation of pesticides',
        'It is unnecessary because honeybees can perform the same role',
      ],
      correct: 1,
    },
  ],
};
