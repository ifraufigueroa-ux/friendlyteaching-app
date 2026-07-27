// TOEFL Reading Passage 2 — Introductory mock
// Subject: history / economics (medieval market fairs). Contrasts with the
// natural-science passage so the mock hits multiple domains.

import type { TOEFLReadingPassage } from '@/types/toefl';

export const passage2: TOEFLReadingPassage = {
  id:    'p2-medieval-fairs',
  title: 'Medieval Trade Fairs and Long-Distance Commerce',
  wordCount: 693,
  paragraphs: [
    // 1
    `The great trade fairs of medieval Europe, which reached their peak between the twelfth and fourteenth centuries, were more than seasonal markets. They were carefully organised institutions that brought together merchants from regions separated by hundreds of kilometres, at a time when travel was slow, dangerous, and expensive. Historians studying these fairs have argued that they served as the closest medieval equivalent to a modern financial exchange — a place where prices were set, credit was extended, and information about distant markets was exchanged.`,
    // 2
    `The most famous of these gatherings were the six annual fairs of Champagne, in northern France, which by the mid-thirteenth century drew participants from Flanders, Italy, England, and the German-speaking lands. A merchant travelling from Genoa to purchase Flemish cloth could reasonably expect to complete the transaction in Champagne rather than undertaking the far longer journey to Bruges or Ghent. This concentration of trade in a single location reduced transport costs and, perhaps more importantly, reduced risk: merchants who might have hesitated to venture into unfamiliar cities could conduct business in an environment governed by well-known rules.`,
    // 3
    `Those rules were the fairs' most distinctive feature. Each fair operated under a special legal regime that suspended local jurisdictions and replaced them with a court run by fair officials. Disputes between merchants were settled swiftly and, crucially, according to the customs of long-distance trade rather than local law. A merchant from Lucca who felt cheated by a merchant from Ypres did not have to navigate a foreign legal system; both were subject to the same fair court, which had strong incentives to reach a fair judgement quickly so that trade could continue.`,
    // 4
    `The fairs also developed sophisticated financial instruments. Because carrying large quantities of coin was both risky and impractical, merchants increasingly settled accounts through bills of exchange — written orders instructing a third party to pay a sum in a different city, often in a different currency. The Champagne fairs became clearing houses where these bills were accepted, transferred, and cancelled against one another. A merchant who had bought cloth on credit at one fair could pay for it with a bill drawn on his agent in Genoa, and the recipient could either wait for the payment to arrive or negotiate the bill onward to a third party.`,
    // 5
    `Historians have debated the causes of the fairs' decline, which was underway by the early fourteenth century. One argument holds that the growth of permanent commercial infrastructure — banks, notarial offices, and standing markets in cities like Bruges and Venice — simply made temporary fairs redundant. Once merchants could conduct international business from a fixed location year-round, there was less reason to travel to a seasonal event. A second argument emphasises the political troubles of the late thirteenth and fourteenth centuries: the Hundred Years' War disrupted the routes leading to Champagne, and the French monarchy began imposing taxes that made attendance less attractive.`,
    // 6
    `A third view, more recent, cautions against treating the decline as a simple story of obsolescence. Fairs continued to operate elsewhere — in Frankfurt, Leipzig, and Lyon — well into the early modern period, and even the Champagne fairs did not so much disappear as change character, shrinking into local markets. In this reading, the fairs were an early phase of commercial integration whose functions were gradually absorbed into other institutions, rather than an institution that failed.`,
    // 7
    `Whatever the balance of causes, the fairs left behind a set of legal and financial practices that outlasted them. The rules developed in the fair courts influenced early commercial law across Europe, and the bills of exchange perfected at Champagne became the foundation of modern banking. When historians look for the origins of the international economy, they are increasingly likely to point not at the great voyages of exploration in the fifteenth century but at these earlier, quieter gatherings in the fields of northern France.`,
  ],
  questions: [
    {
      id: 'q1', type: 'factual', refPara: 1,
      prompt: 'According to paragraph 1, medieval trade fairs functioned as',
      options: [
        'informal social gatherings for regional lords',
        'the closest medieval equivalent to a modern financial exchange',
        'centres for the exchange of religious ideas',
        'markets restricted to a single region',
      ],
      correct: 1,
    },
    {
      id: 'q2', type: 'vocabulary', refPara: 2,
      prompt: 'The word "concentration" in paragraph 2 is closest in meaning to',
      options: ['attention', 'gathering into one place', 'strength of a liquid', 'careful thought'],
      correct: 1,
    },
    {
      id: 'q3', type: 'factual', refPara: 2,
      prompt: 'Why does the author mention a Genoese merchant travelling to Champagne?',
      options: [
        'To show that Italian merchants were the most important customers of Flemish cloth',
        'To illustrate how the fairs reduced both transport costs and risk',
        'To argue that Bruges and Ghent lost most of their long-distance trade',
        'To demonstrate that all trade routes led through northern France',
      ],
      correct: 1,
    },
    {
      id: 'q4', type: 'factual', refPara: 3,
      prompt: 'According to paragraph 3, disputes between merchants at the fairs were settled',
      options: [
        'by the ruler of the region hosting the fair',
        'according to local law of the parties involved',
        'by a fair court applying the customs of long-distance trade',
        'through mediation by other merchants',
      ],
      correct: 2,
    },
    {
      id: 'q5', type: 'inference', refPara: 3,
      prompt: 'What can be inferred about the fair court\'s incentive to resolve disputes quickly?',
      options: [
        'Slow resolutions would have discouraged merchants from returning, harming the fair',
        'The court was paid a percentage of each disputed transaction',
        'Merchants would have appealed to local rulers if delays occurred',
        'Quick resolutions saved on translation costs',
      ],
      correct: 0,
    },
    {
      id: 'q6', type: 'vocabulary', refPara: 4,
      prompt: 'The word "cancelled" in paragraph 4 is closest in meaning to',
      options: ['destroyed', 'ignored', 'settled against one another', 'renewed'],
      correct: 2,
    },
    {
      id: 'q7', type: 'sentence-simplification', refPara: 4,
      prompt: 'Which sentence best expresses the essential information in this highlighted text: "The Champagne fairs became clearing houses where these bills were accepted, transferred, and cancelled against one another."',
      options: [
        'Champagne fairs sold bills of exchange to merchants from many countries',
        'The fairs served as centres where merchants processed and offset written payment orders among each other',
        'Merchants had to attend Champagne to obtain valid bills of exchange',
        'Clearing houses were physical buildings owned by fair officials',
      ],
      correct: 1,
    },
    {
      id: 'q8', type: 'negative-factual', refPara: 5,
      prompt: 'Paragraph 5 mentions all of the following as possible causes of the fairs\' decline EXCEPT',
      options: [
        'the growth of permanent commercial infrastructure in other cities',
        'the disruption of trade routes by the Hundred Years\' War',
        'the imposition of French taxes on attendance',
        'a widespread epidemic that reduced merchant travel',
      ],
      correct: 3,
    },
    {
      id: 'q9', type: 'inference', refPara: 6,
      prompt: 'What does the more recent view described in paragraph 6 suggest about the decline of the fairs?',
      options: [
        'The fairs never really declined at all',
        'The fairs\' functions were absorbed into other institutions rather than simply disappearing',
        'Political troubles were the sole cause of decline',
        'Fairs at Frankfurt and Leipzig replaced Champagne almost immediately',
      ],
      correct: 1,
    },
    {
      id: 'q10', type: 'rhetorical-purpose', refPara: 7,
      prompt: 'The author closes the passage by mentioning "the great voyages of exploration" in order to',
      options: [
        'argue that those voyages, not the fairs, created international trade',
        'contrast the fairs\' quiet importance with the more dramatic image usually associated with early global commerce',
        'introduce a new topic about maritime navigation',
        'praise the achievements of fifteenth-century explorers',
      ],
      correct: 1,
    },
  ],
};
