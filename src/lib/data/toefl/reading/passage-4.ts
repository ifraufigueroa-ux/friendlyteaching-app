// TOEFL Reading Passage 4 — Mock 2 (Art history / cultural history)
// Subject: how the invention of photography reshaped nineteenth-century
// painting. Pairs a humanities passage with the sciences passage 3.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage4: TOEFLReadingPassage = {
  id:    'p4-photography-painting',
  title: 'Photography and the Nineteenth-Century Painter',
  wordCount: 712,
  paragraphs: [
    // 1
    `When the first practical photographic process was announced in Paris in 1839, its most immediate audience was the community of painters and portraitists who had, for centuries, been the only professionals capable of producing a faithful visual likeness. The reaction was almost immediately divided. Some painters welcomed the new medium as a tool that would relieve them of drudgery; others prophesied, with genuine alarm, the end of painting itself. Neither reaction turned out to be quite right, but the debate that opened in that year would shape the practice of European painting for the rest of the century.`,
    // 2
    `The economic pressure came first. Within a decade of the invention, portrait studios were operating in every large European and American city, and the cost of a photographic likeness had fallen to a small fraction of a painted one. Middle-class customers who had once commissioned modest oil portraits found no reason to do so any longer, and this segment of the market — never glamorous, but historically the reliable base of a working painter's income — largely disappeared. Many artists who had made a living from unremarkable commissioned portraits were forced either to specialise in the small, luxurious market that still preferred paint, or to abandon portraiture altogether.`,
    // 3
    `Painters responded in several ways. A first response, most visible in the academic salons of Paris and London, was to insist that painting continued to do what photography could not: idealise, arrange, invent. Grand history paintings and mythological scenes remained the domain of the trained artist, and academic institutions initially took some comfort in the fact that no photographic process could compose an imaginary battle or a Venus rising from the sea. This defence held for a time, but it left the everyday market — precisely the market being lost — to photography.`,
    // 4
    `A second response, less obvious in its cultural implications, was to change what painting itself looked like. If photography now supplied faithful likenesses, painting could turn its attention to what a photograph could not capture: colour as an autonomous element, brushwork as a visible presence, the fleeting light of a particular moment. This was the ground on which Impressionism grew in the 1860s and 1870s. Painters such as Monet and Pissarro were not merely rebelling against academic convention; they were also, whether consciously or not, staking out territory in which photography had no advantage.`,
    // 5
    `A third response was to use photographs as tools. Portraitists who could not compete with the photographic studio began to work from photographs supplied by their clients, producing painted portraits of subjects they had never seen in person. Even ambitious artists made discreet use of photographic references — Delacroix compiled an album of nude photographs for his own use in the 1850s, and later painters, from Degas to Bacon, worked openly from photographs. What had appeared to be a rival medium became, for many, an indispensable studio aid.`,
    // 6
    `The reception of photography also affected how the public read paintings. Once photographs had accustomed viewers to a certain kind of sharp, tonally graded image, painting that looked "photographic" came to be admired by conservative critics as a sign of technical mastery, while artists uninterested in that kind of finish were frequently accused of sloppiness. This is one reason the Impressionists were, in their early years, received with such hostility: their unfinished-looking canvases were being compared, implicitly, to the smooth surfaces of the photograph rather than to older traditions of painterly handling.`,
    // 7
    `Only slowly did critics and painters develop a vocabulary for what photography could not do. That vocabulary — emphasising subjective vision, emotional colour, and the artist's individual mark — would eventually underpin much of modernist art criticism in the twentieth century. In this sense the challenge that photography posed to painting turned out to be productive rather than destructive: it forced painters to identify, and then to defend, the specific value of their own medium. The end of painting, prophesied so confidently in 1839, was in fact the beginning of a long, sometimes anxious redefinition of what painting was for.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, how did painters initially react to the announcement of photography in 1839?',
      options: [
        'They were uniformly enthusiastic about the new medium',
        'They largely ignored it, thinking it would remain a curiosity',
        'Their reactions were divided — some welcomed it, others feared the end of painting',
        'They organised legal challenges to prevent its spread',
      ],
      correct: 2,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 2,
      prompt: 'The word "reliable" in paragraph 2 is closest in meaning to',
      options: ['prestigious', 'dependable', 'creative', 'temporary'],
      correct: 1,
    },
    {
      id: 'q3', type: 'inference', refPara: 2,
      prompt: 'What can be inferred from paragraph 2 about middle-class portrait commissions?',
      options: [
        'They had always been the most profitable part of a painter\'s work',
        'They collapsed as a market segment once cheaper photographic portraits were available',
        'They shifted from oil to watercolour during the 1840s',
        'They continued to grow because painters lowered their prices',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'rhetorical-purpose', refPara: 3,
      prompt: 'The author mentions "an imaginary battle or a Venus rising from the sea" in paragraph 3 primarily in order to',
      options: [
        'illustrate the kinds of subjects that photography of the period could not produce',
        'argue that history painting had lost its cultural importance',
        'suggest that Impressionist painters had similar interests',
        'criticise academic institutions for being outdated',
      ],
      correct: 0,
    },
    {
      id: 'q5', type: 'factual', refPara: 4,
      prompt: 'According to paragraph 4, one reason Impressionist painters emphasised colour and brushwork was that',
      options: [
        'the academic salons required them to do so',
        'photography could not represent those qualities in the same way',
        'earlier painters had already exhausted the traditional subjects',
        'their clients preferred looser painterly styles',
      ],
      correct: 1,
    },
    {
      id: 'q6', type: 'sentence-simplification', refPara: 4,
      prompt: 'Which of the following best expresses the essential information in the highlighted sentence: "Painters such as Monet and Pissarro were not merely rebelling against academic convention; they were also, whether consciously or not, staking out territory in which photography had no advantage."',
      options: [
        'Impressionist painters disliked photography and organised campaigns against it',
        'Monet and Pissarro rejected academic conventions purely for personal reasons',
        'In pushing against academic convention, painters like Monet were also, intentionally or not, moving into artistic ground where photography could not compete',
        'Impressionism failed because it could not match the technical precision of photography',
      ],
      correct: 2,
    },
    {
      id: 'q7', type: 'factual', refPara: 5,
      prompt: 'How does paragraph 5 describe painters\' use of photographs?',
      options: [
        'They rejected them entirely as unartistic',
        'They used them only when photography was already declining',
        'They increasingly used photographs as references, even in the studios of ambitious artists',
        'They collected them only as souvenirs',
      ],
      correct: 2,
    },
    {
      id: 'q8', type: 'inference', refPara: 6,
      prompt: 'What does paragraph 6 suggest about why Impressionist works were initially received with hostility?',
      options: [
        'They were technically incompetent by any standard',
        'Their loose surfaces were compared unfavourably with the smooth finish of photographs',
        'They were promoted by conservative critics against public taste',
        'They portrayed subjects that photography could not capture',
      ],
      correct: 1,
    },
    {
      id: 'q9', type: 'negative-factual', refPara: 7,
      prompt: 'Paragraph 7 supports all of the following EXCEPT that',
      options: [
        'the challenge of photography ultimately proved productive for painting',
        'twentieth-century modernist criticism built on ideas developed in this period',
        'photography did in fact end painting as an art form',
        'painters were forced to identify what only their medium could do',
      ],
      correct: 2,
    },
    {
      id: 'q10', type: 'rhetorical-purpose',
      prompt: 'The passage as a whole is best described as',
      options: [
        'a lament for a form of painting that photography destroyed',
        'a technical history of the invention of the photographic process',
        'an account of how painting redefined its purposes in response to photography',
        'a defence of academic painting against modernist criticism',
      ],
      correct: 2,
    },
  ],
};
