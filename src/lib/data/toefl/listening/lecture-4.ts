// TOEFL Listening Lecture 4 — Mock 4 (Zoology / animal cognition)
// Subject: intelligence in the corvid family (crows, ravens, jays).

import type { TOEFLListeningAudio } from '@/types/toefl';

export const lecture4: TOEFLListeningAudio = {
  id:       'lecture-4',
  type:     'lecture',
  title:    'Cognition in the Crow Family',
  subject:  'Zoology',
  speakers: [
    { id: 'prof', name: 'Professor' },
  ],
  script: [
    { speakerId: 'prof', text:
      `Alright, so I want to spend today on a group of birds that has forced animal cognition researchers to seriously rethink some of their assumptions over the past twenty years — the corvids. That's the family that includes crows, ravens, magpies, and jays. If you'd asked most biologists in the 1970s where you'd look for high intelligence in animals, they would probably have said primates, and they might have added elephants and dolphins. Corvids would not have been on that list. Now they usually are, and that shift is not because the birds got smarter — it's because we finally started asking the right questions.` },
    { speakerId: 'prof', text:
      `Part of what threw earlier researchers off was the brain itself. Corvid brains are small — a raven's brain is about the size of a walnut. And for a long time it was assumed that complex cognition requires a big neocortex, which is the outer, folded layer of the mammalian brain. Birds don't have a neocortex in the mammalian sense. What was eventually appreciated was that a different region of the bird brain, the pallium, appears to do much of the same cognitive work, and that corvids have a very densely packed pallium with an unusually large number of neurons for a brain of that size. So the anatomy is different, but the computational hardware is comparable.` },
    { speakerId: 'prof', text:
      `Now, the behavioural evidence is really where corvids have surprised people. Let's start with tool use. New Caledonian crows, in the wild, manufacture hooked twigs to extract insect larvae from tree bark. They don't just find a suitable twig — they modify it, and different populations on different parts of the island make slightly different tools, which suggests cultural transmission of the design. In experimental settings, New Caledonian crows have solved puzzles that require them to use one tool to obtain another, and then use that second tool to reach food. This kind of sequential problem-solving was, until recently, considered largely a great-ape specialty.` },
    { speakerId: 'prof', text:
      `Then there's caching behaviour. Many corvid species store food for later, sometimes hundreds of items over a wide area, and their spatial memory for these caches is remarkable — a scrub jay can recall the location of thousands of hidden items and often knows which caches contain perishable versus non-perishable food. But what really caught researchers' attention is the social dimension. Scrub jays that were themselves observed caching food will, if they've had the opportunity to steal from other birds' caches in the past, return alone and re-cache their food in a new location. Birds that have never stolen from a cache don't bother. The implication — and this is contested but widely discussed — is that the birds are modelling what other birds are likely to do based on their own experience of doing it. That's suggestive of something like a theory of mind.` },
    { speakerId: 'prof', text:
      `Another line of evidence involves recognition. Wild crows can reliably distinguish individual human faces, even in populations where those humans are only seen briefly, and they can remember which faces are associated with threats — a person who trapped a crow for tagging will be scolded by that crow for years afterward, and will also be scolded by other crows in the same social group, even ones that were not present at the original event. That last part is interesting. It suggests that the information is being socially transmitted between birds.` },
    { speakerId: 'prof', text:
      `Now, I want to be careful here — because it's very easy, when you read about crows solving puzzles and remembering human faces, to slide into the conclusion that corvids are essentially little feathered humans. They are not. Their cognition is highly specialised for problems relevant to their ecological niche — food-caching, tool use for foraging, social recognition within their flocks. What has changed is our recognition that complex cognition of this kind evolved independently in birds and in mammals. It's a striking example of what biologists call convergent evolution: similar solutions to similar problems arising in unrelated lineages.` },
  ],
  questions: [
    {
      id: 'l4-q1',
      prompt: 'What is the lecture mainly about?',
      options: [
        'The physical anatomy of bird brains compared with mammal brains',
        'The evolution of tool use in birds and mammals',
        'The evidence for and interpretation of high cognitive abilities in corvid birds',
        'The differences between crows and ravens as species',
      ],
      correct: 2,
    },
    {
      id: 'l4-q2',
      prompt: 'According to the professor, why did earlier researchers underestimate corvid cognition?',
      options: [
        'They wrongly assumed that complex cognition requires a mammalian-style neocortex',
        'They lacked video recording technology to observe crows in the wild',
        'Corvids were not thought to exist in stable social groups',
        'They confused corvids with other, less intelligent bird families',
      ],
      correct: 0,
    },
    {
      id: 'l4-q3',
      prompt: 'What does the tool use of New Caledonian crows demonstrate?',
      options: [
        'That corvids can imitate human tool use',
        'That corvids can manufacture and modify tools, and that different populations produce slightly different designs suggestive of cultural transmission',
        'That crows share tools with other bird species',
        'That crows use tools only when food is scarce',
      ],
      correct: 1,
    },
    {
      id: 'l4-q4',
      prompt: 'What behaviour of scrub jays does the professor describe as evidence suggestive of theory of mind?',
      options: [
        'They cache food in extremely well-hidden locations',
        'They recognise individual human faces',
        'Those with prior experience of stealing from other jays\' caches will re-cache their own food after being observed',
        'They coordinate flock movements over long distances',
      ],
      correct: 2,
    },
    {
      id: 'l4-q5',
      prompt: 'What does the professor find especially interesting about crows scolding humans who have previously threatened them?',
      options: [
        'That crows can hold a grudge for their entire lifetime',
        'That crows that were not present at the original event also scold the person, suggesting social transmission of the information',
        'That crows use the same call to scold humans and predators alike',
        'That crows only scold humans in daylight hours',
      ],
      correct: 1,
    },
    {
      id: 'l4-q6',
      prompt: 'What broader point does the professor draw about corvid cognition at the end of the lecture?',
      options: [
        'Corvid cognition is essentially the same as human cognition',
        'Corvid cognition is limited to a small number of very simple tasks',
        'Complex cognition evolved independently in corvids and mammals — an example of convergent evolution',
        'Corvid cognition is fundamentally different from anything found in mammals',
      ],
      correct: 2,
    },
  ],
};
