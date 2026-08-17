// TOEFL Reading Passage 5 — Mock 3 (Archaeology / anthropology)
// Subject: the domestication of the horse on the Eurasian steppe. ~700 words.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage5: TOEFLReadingPassage = {
  id:    'p5-horse-domestication',
  title: 'The Domestication of the Horse',
  wordCount: 708,
  paragraphs: [
    // 1
    `Of all the domestications that shaped the ancient world, the taming of the horse is among the most difficult to reconstruct. Unlike the domestication of grains, which leaves rich botanical traces, the shift from wild to domestic horses left few visible marks on the skeletons of the animals themselves. Archaeologists studying this transition must therefore rely on a combination of subtle skeletal evidence, patterns of animal remains at settlement sites, and — more recently — genetic analysis of both ancient and modern populations. The picture that has emerged in the last two decades differs substantially from what was accepted in older textbooks.`,
    // 2
    `The consensus that prevailed through most of the twentieth century placed the earliest horse domestication in the western Eurasian steppe, in what is now Kazakhstan and southern Russia, around 3500 BCE. The main evidence was the sheer abundance of horse bones at certain Bronze Age settlement sites of the so-called Botai culture, where horses appear to have made up ninety percent of the meat consumed. It seemed reasonable to conclude that people who ate so many horses must have been keeping them, and this assumption became firmly established in the literature.`,
    // 3
    `Beginning in the 2000s, however, archaeologists proposed more direct tests of that assumption. If the Botai horses had been ridden, their teeth should show wear from bits — the metal or bone mouthpieces used to control a mount. If mares had been milked, the pottery at Botai sites should retain lipid residues consistent with horse milk. Careful examination did produce evidence of both — bit wear on molars and milk residues in ceramic vessels — and for a time this appeared to confirm the Botai as the first true horse domesticators.`,
    // 4
    `The interpretation was overturned, however, by a series of genetic studies published beginning in 2018. When the DNA of Botai horses was compared to that of modern horses, the two groups turned out to be only distantly related. Modern domestic horses trace their ancestry not to the Botai animals but to a separate population that appears to have emerged in the western Eurasian steppe — specifically in the lower Volga and Don river regions — around 2200 BCE, more than a thousand years after Botai. This later population expanded rapidly across Eurasia in the following centuries and displaced or replaced other lineages, including whatever the Botai had.`,
    // 5
    `This finding did not contradict the physical evidence at Botai, but it did require rethinking what that evidence meant. The Botai people almost certainly did tame horses of a locally available wild population — the bit wear and milk residues are hard to explain otherwise. But their tame horses did not become the ancestors of the modern lineage. Whether the Botai lineage died out, was hunted to extinction, or was simply absorbed by later, more genetically successful domestic populations is not yet resolved. What is clear is that the transition to the "domestic horse" that spread across the ancient world was not a single event but at least two separate ones.`,
    // 6
    `The genetic evidence has also clarified a second question: why did the later, western Eurasian lineage spread so quickly? The relevant genes that distinguish modern horses from their wild relatives include variants that produce a calmer temperament and a stronger back — traits that would have made these animals significantly more suitable for riding and for pulling heavy loads. It appears that once such an improved population existed, its advantages were substantial enough that neighbouring peoples adopted it rather than continuing with their own less useful stocks. This is a pattern seen with other domestications: an improved variety, once available, can travel across cultures faster than technological innovations do.`,
    // 7
    `The revised picture has broader implications for how the horse contributed to human history. If the domesticated horse in its familiar, rideable form is only about four thousand years old, then developments once attributed to earlier horse riding — mass migrations, the spread of certain languages, the formation of steppe empires — have to be reconsidered in a later, tighter time window. Archaeologists have found this recalibration productive rather than disruptive. It has connected the biological history of the horse to specific archaeological cultures whose expansion was already documented, but whose motive power had previously been uncertain.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, why is the domestication of the horse difficult for archaeologists to reconstruct?',
      options: [
        'Because horses do not preserve well in the archaeological record',
        'Because it left few visible marks on the skeletons of the animals themselves',
        'Because the earliest horse-domesticating cultures were nomadic',
        'Because horses were never eaten and left no bones at settlement sites',
      ],
      correct: 1,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 2,
      prompt: 'The word "abundance" in paragraph 2 is closest in meaning to',
      options: ['scarcity', 'importance', 'large quantity', 'variety'],
      correct: 2,
    },
    {
      id: 'q3', type: 'inference', refPara: 2,
      prompt: 'What does paragraph 2 imply about the reasoning that led older textbooks to date horse domestication to about 3500 BCE at Botai?',
      options: [
        'It was based on genetic evidence unavailable today',
        'It rested largely on the assumption that people who ate many horses must have been keeping them',
        'It was based on documentary evidence from ancient texts',
        'It was proposed and immediately rejected by contemporary archaeologists',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'factual', refPara: 3,
      prompt: 'According to paragraph 3, what two kinds of evidence did archaeologists later find at Botai sites that seemed to support domestication?',
      options: [
        'Horse enclosures and burial mounds',
        'Bit wear on horse teeth and horse-milk residues in pottery',
        'Bronze horse ornaments and wheeled vehicles',
        'Written references and cave paintings',
      ],
      correct: 1,
    },
    {
      id: 'q5', type: 'rhetorical-purpose', refPara: 4,
      prompt: 'The author mentions the 2018 genetic studies in paragraph 4 primarily in order to',
      options: [
        'confirm that Botai was the origin of the modern domestic horse',
        'explain why archaeologists no longer study horse bones directly',
        'show how DNA evidence overturned an earlier consensus by revealing a later, separate origin for modern horses',
        'argue that all Bronze Age domestications should be reconsidered',
      ],
      correct: 2,
    },
    {
      id: 'q6', type: 'sentence-simplification', refPara: 5,
      prompt: 'Which best expresses the essential information in the highlighted sentence: "But their tame horses did not become the ancestors of the modern lineage."',
      options: [
        'Botai horses were the direct ancestors of all modern domestic horses',
        'Although the Botai kept tame horses, those animals did not give rise to today\'s domestic horse population',
        'Modern horses are descended from wild horses that were never domesticated',
        'Botai horses were mistakenly classified as wild by later researchers',
      ],
      correct: 1,
    },
    {
      id: 'q7', type: 'negative-factual', refPara: 5,
      prompt: 'According to paragraph 5, all of the following are still unresolved about the Botai horse lineage EXCEPT',
      options: [
        'whether it died out',
        'whether it was hunted to extinction',
        'whether it was absorbed by later domestic populations',
        'whether its remains show any evidence of taming at all',
      ],
      correct: 3,
    },
    {
      id: 'q8', type: 'factual', refPara: 6,
      prompt: 'According to paragraph 6, what genetic traits distinguished the later, successful lineage of domestic horses?',
      options: [
        'Larger body size and darker coat colours',
        'A calmer temperament and a stronger back',
        'Longer legs suited for cold climates',
        'A shorter reproductive cycle',
      ],
      correct: 1,
    },
    {
      id: 'q9', type: 'inference', refPara: 6,
      prompt: 'What general pattern does the author identify with other domestications in paragraph 6?',
      options: [
        'Domestications tend to fail if they occur in more than one region',
        'An improved domestic variety, once available, can spread across cultures faster than technological innovations',
        'Neighbouring peoples usually resist accepting animals from other cultures',
        'The most successful domestications require the invention of new tools',
      ],
      correct: 1,
    },
    {
      id: 'q10', type: 'inference',
      prompt: 'What broader consequence for the study of human history does the passage identify?',
      options: [
        'Historians must now reconsider events once linked to earlier horse riding within a later, tighter time window',
        'Genetic evidence has proven that migrations across the Eurasian steppe never occurred',
        'The concept of domestication itself needs to be replaced',
        'Archaeologists have concluded that horses played no significant role in ancient history',
      ],
      correct: 0,
    },
  ],
};
