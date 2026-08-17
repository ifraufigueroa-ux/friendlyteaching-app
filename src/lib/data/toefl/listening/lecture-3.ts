// TOEFL Listening Lecture 3 — Mock 3 (Botany)
// Subject: how plants defend themselves chemically against herbivores.

import type { TOEFLListeningAudio } from '@/types/toefl';

export const lecture3: TOEFLListeningAudio = {
  id:       'lecture-3',
  type:     'lecture',
  title:    'Chemical Defences in Plants',
  subject:  'Botany',
  speakers: [
    { id: 'prof', name: 'Professor' },
  ],
  script: [
    { speakerId: 'prof', text:
      `So today we're going to look at what is, in my opinion, one of the most under-appreciated facts about plant biology, which is that plants are chemists. They can't run away from the animals that want to eat them, and they can't hit back the way most animals can. But over hundreds of millions of years, plants have evolved an extraordinary chemical arsenal — thousands of compounds whose primary function is not to help the plant grow but to make the plant taste bad, or make it toxic, or otherwise convince a herbivore to go eat something else.` },
    { speakerId: 'prof', text:
      `These compounds are called secondary metabolites — "secondary" because, at first, they seemed unrelated to the plant's basic metabolism. That framing has aged badly, actually, because we now know how essential these compounds are for survival in the wild, but the name stuck. The three main families you'll want to know are the alkaloids, the terpenoids, and the phenolics. Caffeine is an alkaloid. So are nicotine, morphine, cocaine — a lot of what you might call psychoactive chemicals started their evolutionary careers as plant defences.` },
    { speakerId: 'prof', text:
      `Now, why should caffeine, which we treat as an enjoyable stimulant, be a defence? Well, from the plant's perspective, we're not the target. Caffeine at the concentrations found in a coffee plant's young leaves is quite toxic to most insects. It disrupts insect nervous systems and interferes with their behaviour. Humans have a metabolism large enough and different enough that we can process a cup of coffee as a mild stimulant; a beetle that takes the same relative dose is often incapacitated. This mismatch — between the animals a plant evolved to deter and the animals that later found the compound useful — is very common. It's why so many plant-derived drugs are so specifically active in the human body.` },
    { speakerId: 'prof', text:
      `But not all plant chemical defences are constitutive — that is, present in the plant all the time. Producing these compounds is metabolically expensive, and if there are no herbivores around, it's a waste. So many plants have evolved induced defences, which are produced or upregulated only in response to attack. Some acacia trees, for example, dramatically increase the tannin content of their leaves within hours of being browsed by giraffes. Tannins bind to proteins in the animal's saliva and make the leaves both bitter and harder to digest.` },
    { speakerId: 'prof', text:
      `And this is where it gets interesting. Those same acacia trees release a volatile chemical — a gas, essentially — that drifts on the wind and is picked up by neighbouring trees. Those neighbouring trees, which have not yet been touched by a giraffe, respond by increasing their own tannins pre-emptively. In effect, the trees are communicating an alarm signal to each other. There was a lot of scepticism about this claim when it was first proposed, in the 1980s, but the evidence for chemical signalling between plants is now quite robust across many species.` },
    { speakerId: 'prof', text:
      `And there's a further layer, which really impressed me the first time I encountered it. Some plants under attack by caterpillars release volatiles that attract the specific parasitic wasps that prey on those caterpillars. So the plant is not only defending itself directly with chemistry — it's also, in effect, calling in reinforcements. This means the same chemical release has to be tuned to whichever species is doing the eating, because the wasp species you want to attract depends on the caterpillar species you're being eaten by. And it seems that plants can, in fact, distinguish between herbivore species and adjust their signalling accordingly.` },
  ],
  questions: [
    {
      id: 'l3-q1',
      prompt: 'What is the lecture mainly about?',
      options: [
        'The nutritional value of plants for humans',
        'The ways plants use chemistry to defend themselves and communicate',
        'The history of drug discovery from plant sources',
        'The genetic engineering of pest-resistant crops',
      ],
      correct: 1,
    },
    {
      id: 'l3-q2',
      prompt: 'According to the professor, why is the name "secondary metabolites" now considered somewhat misleading?',
      options: [
        'Because these compounds are actually essential for the plant\'s survival, not truly "secondary"',
        'Because they are produced in larger quantities than primary metabolites',
        'Because they are the same compounds as primary metabolites',
        'Because they are only produced in domesticated plants',
      ],
      correct: 0,
    },
    {
      id: 'l3-q3',
      prompt: 'Why is caffeine, which humans use as a stimulant, considered a chemical defence?',
      options: [
        'It causes humans to plant more coffee, increasing the plant\'s numbers',
        'It is highly toxic to most insects that would otherwise eat coffee plants',
        'It gives coffee plants a distinctive taste that humans prefer',
        'It prevents fungal infections in the soil',
      ],
      correct: 1,
    },
    {
      id: 'l3-q4',
      prompt: 'What is the difference between constitutive and induced defences, as the professor describes them?',
      options: [
        'Constitutive defences are physical, while induced defences are chemical',
        'Constitutive defences are always present in the plant; induced defences are produced only in response to attack',
        'Constitutive defences are produced in the leaves and induced defences in the roots',
        'Induced defences are found only in tropical plants',
      ],
      correct: 1,
    },
    {
      id: 'l3-q5',
      prompt: 'What does the acacia tree example illustrate?',
      options: [
        'Plants cannot detect when they are being eaten',
        'Neighbouring plants can receive volatile chemical signals from attacked plants and raise their own defences',
        'Giraffes are immune to plant chemical defences',
        'Only injured plants can produce tannins',
      ],
      correct: 1,
    },
    {
      id: 'l3-q6',
      prompt: 'Why does the professor find the example of parasitic-wasp-attracting volatiles particularly impressive?',
      options: [
        'Because the plant produces the same signal regardless of the attacker',
        'Because plants can apparently distinguish between herbivore species and adjust their chemical signals to attract the appropriate predator',
        'Because it shows that plants prefer certain wasp species over others',
        'Because wasps are the only insects that can smell plant volatiles',
      ],
      correct: 1,
    },
  ],
};
