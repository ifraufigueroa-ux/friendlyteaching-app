// FriendlyTeaching.cl — Placement Test Vocabulary Bank
// 60 MCQ ordered A0 → C1. Same shape as PlacementQuestion so the same
// scorer works. Question topic is a VocabularyTopic (synonyms,
// collocations, phrasal_verbs, word_formation, gap_fill_context, etc.).

import type { PlacementQuestion } from '@/types/placement';

// The scorer keys off `topic: GrammarTopic` — we cast the vocab topic to a
// string via `unknown` so the runtime path stays untouched. Weak-area labels
// use VOCAB_TOPIC_LABELS below.
type VocabQ = Omit<PlacementQuestion, 'topic'> & { topic: string };

export const PLACEMENT_VOCABULARY: VocabQ[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // A0 (1-6)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 1, level: 'A0', topic: 'gap_fill_context', sentence: 'My brother is very ___. He always tells jokes.',
    options: ['sad', 'funny', 'tired', 'quiet'], correct: 1 },
  { id: 2, level: 'A0', topic: 'gap_fill_context', sentence: 'I drink ___ every morning with breakfast.',
    options: ['a book', 'coffee', 'shoes', 'a chair'], correct: 1 },
  { id: 3, level: 'A0', topic: 'synonyms', sentence: 'A word that means the same as "big" is ___.',
    options: ['small', 'large', 'tall', 'short'], correct: 1 },
  { id: 4, level: 'A0', topic: 'antonyms', sentence: 'The opposite of "hot" is ___.',
    options: ['warm', 'cool', 'cold', 'wet'], correct: 2 },
  { id: 5, level: 'A0', topic: 'gap_fill_context', sentence: 'Cats and dogs are ___.',
    options: ['fruits', 'colours', 'animals', 'days'], correct: 2 },
  { id: 6, level: 'A0', topic: 'gap_fill_context', sentence: 'I go to bed because I am ___.',
    options: ['happy', 'tired', 'clean', 'busy'], correct: 1 },

  // ═══════════════════════════════════════════════════════════════════════
  // A1 (7-15)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 7, level: 'A1', topic: 'gap_fill_context', sentence: "I don't have any money, so I can't ___ this jacket.",
    options: ['sell', 'buy', 'give', 'lose'], correct: 1 },
  { id: 8, level: 'A1', topic: 'collocations', sentence: 'She wants to ___ a photo of the sunset.',
    options: ['make', 'do', 'take', 'have'], correct: 2,
    explanation: "'Take a photo' — standard collocation." },
  { id: 9, level: 'A1', topic: 'synonyms', sentence: 'The word closest in meaning to "quick" is ___.',
    options: ['slow', 'fast', 'quiet', 'small'], correct: 1 },
  { id: 10, level: 'A1', topic: 'gap_fill_context', sentence: 'On Sunday my family and I ___ lunch together at home.',
    options: ['play', 'have', 'do', 'listen'], correct: 1 },
  { id: 11, level: 'A1', topic: 'phrasal_verbs', sentence: 'What time do you usually ___ in the morning?',
    options: ['get up', 'get out', 'get in', 'get on'], correct: 0 },
  { id: 12, level: 'A1', topic: 'antonyms', sentence: 'The opposite of "expensive" is ___.',
    options: ['rich', 'cheap', 'small', 'poor'], correct: 1 },
  { id: 13, level: 'A1', topic: 'gap_fill_context', sentence: 'I need an umbrella because it is ___.',
    options: ['sunny', 'raining', 'cold', 'windy'], correct: 1 },
  { id: 14, level: 'A1', topic: 'collocations', sentence: "Let's ___ a break — I'm tired.",
    options: ['do', 'make', 'take', 'get'], correct: 2 },
  { id: 15, level: 'A1', topic: 'phrasal_verbs', sentence: 'Please ___ the light — I want to read.',
    options: ['turn on', 'turn in', 'turn to', 'turn about'], correct: 0 },

  // ═══════════════════════════════════════════════════════════════════════
  // A2 (16-24)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 16, level: 'A2', topic: 'phrasal_verbs', sentence: 'I ___ my old friend from school yesterday at the supermarket.',
    options: ['ran into', 'ran out of', 'ran after', 'ran over'], correct: 0,
    explanation: "'Run into' = meet by chance." },
  { id: 17, level: 'A2', topic: 'gap_fill_context', sentence: 'The film was ___ — everyone in the cinema was laughing.',
    options: ['boring', 'terrible', 'hilarious', 'serious'], correct: 2 },
  { id: 18, level: 'A2', topic: 'collocations', sentence: "She's very good at her job — she always ___ decisions quickly.",
    options: ['does', 'makes', 'takes', 'has'], correct: 1 },
  { id: 19, level: 'A2', topic: 'synonyms', sentence: 'A word closest in meaning to "difficult" is ___.',
    options: ['easy', 'simple', 'hard', 'clear'], correct: 2 },
  { id: 20, level: 'A2', topic: 'gap_fill_context', sentence: "I can't hear you — could you speak a bit ___, please?",
    options: ['softer', 'louder', 'faster', 'quicker'], correct: 1 },
  { id: 21, level: 'A2', topic: 'phrasal_verbs', sentence: "I'm sorry, I have to ___ our meeting until next week.",
    options: ['put off', 'put on', 'put up', 'put in'], correct: 0 },
  { id: 22, level: 'A2', topic: 'antonyms', sentence: 'The opposite of "polite" is ___.',
    options: ['kind', 'rude', 'shy', 'quiet'], correct: 1 },
  { id: 23, level: 'A2', topic: 'word_formation', sentence: 'She works very hard. She is a ___ student.',
    options: ['dedicate', 'dedicated', 'dedication', 'dedicating'], correct: 1 },
  { id: 24, level: 'A2', topic: 'collocations', sentence: 'He wants to ___ money for a new car.',
    options: ['save', 'do', 'keep', 'spend'], correct: 0 },

  // ═══════════════════════════════════════════════════════════════════════
  // B1 (25-33)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 25, level: 'B1', topic: 'phrasal_verbs', sentence: "I've been trying to ___ smoking for years, but it's really hard.",
    options: ['give up', 'give out', 'give in', 'give away'], correct: 0 },
  { id: 26, level: 'B1', topic: 'gap_fill_context', sentence: "The manager wasn't ___ with the results and asked the team for an explanation.",
    options: ['satisfied', 'satisfying', 'satisfy', 'satisfaction'], correct: 0 },
  { id: 27, level: 'B1', topic: 'collocations', sentence: 'The company plans to ___ a new product next month.',
    options: ['launch', 'produce', 'invent', 'sell'], correct: 0,
    explanation: "'Launch a product' is the standard business collocation." },
  { id: 28, level: 'B1', topic: 'word_formation', sentence: 'His ___ to detail is one of his best qualities.',
    options: ['attention', 'attend', 'attentive', 'attentively'], correct: 0 },
  { id: 29, level: 'B1', topic: 'connectors', sentence: "I really wanted to help him; ___, I was too busy at work.",
    options: ['moreover', 'therefore', 'however', 'because'], correct: 2 },
  { id: 30, level: 'B1', topic: 'phrasal_verbs', sentence: "We should ___ every possible solution before making a decision.",
    options: ['look after', 'look into', 'look up', 'look over'], correct: 1 },
  { id: 31, level: 'B1', topic: 'synonyms', sentence: '"To purchase" means to ___.',
    options: ['sell', 'buy', 'return', 'exchange'], correct: 1 },
  { id: 32, level: 'B1', topic: 'gap_fill_context', sentence: 'The traffic was ___, so we arrived an hour late.',
    options: ['light', 'heavy', 'quick', 'small'], correct: 1 },
  { id: 33, level: 'B1', topic: 'idioms', sentence: 'When she got the promotion, she was ___.',
    options: ['on top of the world', 'in hot water', 'under the weather', 'out of the blue'], correct: 0 },

  // ═══════════════════════════════════════════════════════════════════════
  // B1+ (34-39)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 34, level: 'B1+', topic: 'phrasal_verbs', sentence: 'The teacher had to ___ the difficult concept several times before we understood.',
    options: ['carry out', 'go over', 'take up', 'come across'], correct: 1 },
  { id: 35, level: 'B1+', topic: 'connectors', sentence: '___ the bad weather, they decided to continue with the hike.',
    options: ['Because of', 'Despite', 'Although', 'However'], correct: 1,
    explanation: "'Despite' + noun phrase; 'although' would need a clause." },
  { id: 36, level: 'B1+', topic: 'word_formation', sentence: 'The scientist made an amazing ___ that changed the field forever.',
    options: ['discover', 'discovery', 'discovered', 'discoverer'], correct: 1 },
  { id: 37, level: 'B1+', topic: 'idioms', sentence: "He didn't want to answer directly, so he ___.",
    options: ['beat around the bush', 'hit the roof', 'let the cat out of the bag', 'pulled his leg'], correct: 0 },
  { id: 38, level: 'B1+', topic: 'collocations', sentence: 'The negotiations were tense, but they finally ___ an agreement.',
    options: ['made', 'took', 'reached', 'built'], correct: 2 },
  { id: 39, level: 'B1+', topic: 'gap_fill_context', sentence: 'The company is facing a serious ___ due to the economic downturn.',
    options: ['crisis', 'chance', 'reward', 'benefit'], correct: 0 },

  // ═══════════════════════════════════════════════════════════════════════
  // B2 (40-50)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 40, level: 'B2', topic: 'phrasal_verbs', sentence: 'The council has decided to ___ a new recycling programme next year.',
    options: ['bring up', 'bring about', 'bring in', 'bring back'], correct: 2,
    explanation: "'Bring in' = introduce (a policy, rule, system)." },
  { id: 41, level: 'B2', topic: 'connectors', sentence: '___ she works very hard, she rarely takes any credit for her achievements.',
    options: ['Since', 'Even though', 'As long as', 'Now that'], correct: 1 },
  { id: 42, level: 'B2', topic: 'word_formation', sentence: 'The scheme has been a huge ___ for the community.',
    options: ['benefit', 'beneficial', 'beneficially', 'benefiting'], correct: 0 },
  { id: 43, level: 'B2', topic: 'collocations', sentence: 'The two sides eventually managed to ___ their differences and sign the treaty.',
    options: ['handle', 'resolve', 'answer', 'defeat'], correct: 1 },
  { id: 44, level: 'B2', topic: 'idioms', sentence: 'The new intern is really ___ — she picked up the entire workflow in a week.',
    options: ['a piece of cake', 'a quick study', 'a couch potato', 'a wet blanket'], correct: 1 },
  { id: 45, level: 'B2', topic: 'gap_fill_context', sentence: "The report highlights the ___ impact that social media has had on political discourse.",
    options: ['profound', 'gentle', 'temporary', 'invisible'], correct: 0 },
  { id: 46, level: 'B2', topic: 'phrasal_verbs', sentence: "I don't want to ___ the meeting for a second time — let's just do it Friday.",
    options: ['put back', 'put on', 'put up', 'put out'], correct: 0 },
  { id: 47, level: 'B2', topic: 'synonyms', sentence: 'A synonym for "reluctant" is ___.',
    options: ['eager', 'unwilling', 'certain', 'brave'], correct: 1 },
  { id: 48, level: 'B2', topic: 'word_formation', sentence: 'His speech was so ___ that the audience was silent for a full minute afterwards.',
    options: ['power', 'powerful', 'powerfully', 'powered'], correct: 1 },
  { id: 49, level: 'B2', topic: 'connectors', sentence: 'The proposal was rejected; ___, an alternative plan is being drafted.',
    options: ['meanwhile', 'accordingly', 'in contrast', 'namely'], correct: 1 },
  { id: 50, level: 'B2', topic: 'collocations', sentence: 'We need to ___ strict deadlines if we want the project to succeed.',
    options: ['set', 'do', 'take', 'give'], correct: 0 },

  // ═══════════════════════════════════════════════════════════════════════
  // C1 (51-60)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 51, level: 'C1', topic: 'idioms', sentence: "The plan was doomed to fail from the outset — it was ___.",
    options: ['a stitch in time', 'a wild goose chase', 'a blessing in disguise', 'a piece of cake'], correct: 1 },
  { id: 52, level: 'C1', topic: 'phrasal_verbs', sentence: 'The chair had to ___ the meeting when tempers began to flare.',
    options: ['break up', 'wind up', 'set up', 'live up'], correct: 1,
    explanation: "'Wind up' = bring (a meeting) to an end." },
  { id: 53, level: 'C1', topic: 'connectors', sentence: 'The evidence is compelling; ___, it does not prove causation beyond doubt.',
    options: ['albeit', 'notwithstanding', 'insofar as', 'whereby'], correct: 1 },
  { id: 54, level: 'C1', topic: 'word_formation', sentence: 'The proposal was met with a certain amount of ___ from the board.',
    options: ['sceptic', 'sceptical', 'scepticism', 'sceptically'], correct: 2 },
  { id: 55, level: 'C1', topic: 'gap_fill_context', sentence: 'Her comments were widely seen as ___ and drew criticism from across the political spectrum.',
    options: ['tactful', 'inflammatory', 'trivial', 'restrained'], correct: 1 },
  { id: 56, level: 'C1', topic: 'idioms', sentence: 'I think we should ___ on this one — we can revisit it after the holidays.',
    options: ['hit the nail on the head', 'call it a day', 'let sleeping dogs lie', 'jump the gun'], correct: 2 },
  { id: 57, level: 'C1', topic: 'collocations', sentence: 'The report ___ serious concerns about data-handling practices at the firm.',
    options: ['raises', 'lifts', 'grows', 'rises'], correct: 0 },
  { id: 58, level: 'C1', topic: 'phrasal_verbs', sentence: 'The chief executive was forced to ___ following the scandal.',
    options: ['step down', 'step on', 'step in', 'step out'], correct: 0 },
  { id: 59, level: 'C1', topic: 'synonyms', sentence: "'To exacerbate' most closely means to ___.",
    options: ['reduce', 'worsen', 'clarify', 'suspend'], correct: 1 },
  { id: 60, level: 'C1', topic: 'word_formation', sentence: 'Her thesis provides a ___ analysis of contemporary migration patterns.',
    options: ['nuance', 'nuanced', 'nuancing', 'nuances'], correct: 1 },
];

// Cast to PlacementQuestion so the scorer can consume it unchanged.
export const PLACEMENT_VOCABULARY_QUESTIONS = PLACEMENT_VOCABULARY as unknown as PlacementQuestion[];

// Level → id range (parallels LEVEL_SECTIONS for grammar).
export const VOCAB_LEVEL_SECTIONS: Record<string, { start: number; end: number }> = {
  A0:    { start: 1,  end: 6  },
  A1:    { start: 7,  end: 15 },
  A2:    { start: 16, end: 24 },
  B1:    { start: 25, end: 33 },
  'B1+': { start: 34, end: 39 },
  B2:    { start: 40, end: 50 },
  C1:    { start: 51, end: 60 },
};
