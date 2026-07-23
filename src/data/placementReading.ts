// FriendlyTeaching.cl — Placement Test Reading Bank
// 6 passages of increasing complexity. Each has 4-5 MCQ.
// Question ids are unique across the whole bank; question `level` is the CEFR
// level of THAT question (not the passage) so section scoring stays granular.
// Weak-area topics are the question types (detail, inference, etc.).

import type { ReadingPassage } from '@/types/placement-suite';

export const PLACEMENT_READING: ReadingPassage[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // A1 — Everyday routine (~90 words)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'a1-morning-routine',
    level:     'A1',
    title:     'A busy morning',
    wordCount: 92,
    text:
`My name is Elena and I live in a small town in Chile. I get up at seven o'clock every day, but on Mondays I get up at six because I start work early.

I live with my mother and my sister. My sister is a nurse and she works at night. I usually eat breakfast alone. I drink coffee and eat toast with jam. My mother eats fruit — she doesn't like coffee.

At half past seven I take the bus to the office. I arrive at eight and I stay until five. In the evening I cook dinner for my family.`,
    questions: [
      { id: 1001, level: 'A1', type: 'detail',
        prompt: 'What time does Elena usually get up?',
        options: ['At six o\'clock', 'At seven o\'clock', 'At half past seven', 'At eight o\'clock'],
        correct: 1 },
      { id: 1002, level: 'A1', type: 'detail',
        prompt: 'Why does Elena get up earlier on Mondays?',
        options: ['She takes the early bus', 'Her sister is at home', 'She starts work early', 'She has breakfast with her mother'],
        correct: 2 },
      { id: 1003, level: 'A1', type: 'detail',
        prompt: 'What does Elena\'s mother eat for breakfast?',
        options: ['Coffee and toast', 'Fruit', 'Nothing', 'Jam'],
        correct: 1 },
      { id: 1004, level: 'A2', type: 'inference',
        prompt: 'Why does Elena eat breakfast alone?',
        options: ['She does not like her family', 'Her sister works at night', 'Her mother eats later', 'She lives alone'],
        correct: 1 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // A2 — A weekend at the beach (~110 words)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'a2-beach-weekend',
    level:     'A2',
    title:     'A weekend at the beach',
    wordCount: 118,
    text:
`Last weekend my friends and I decided to visit the beach in Viña del Mar. We took the bus at eight in the morning and arrived two hours later. The weather was warm and sunny, but the water was very cold — much colder than we expected.

We didn't swim for long. Instead, we walked along the beach, ate empanadas at a small restaurant near the pier, and took a lot of photos. In the afternoon we visited a museum in the centre of the city.

We returned to Santiago at nine in the evening. I was tired but very happy. Next month we want to go back and try to swim again — maybe the water will be warmer.`,
    questions: [
      { id: 1101, level: 'A2', type: 'detail',
        prompt: 'How long was the bus journey to Viña del Mar?',
        options: ['One hour', 'Two hours', 'Eight hours', 'Nine hours'],
        correct: 1 },
      { id: 1102, level: 'A2', type: 'detail',
        prompt: 'Why did they not swim for long?',
        options: ['The beach was empty', 'The weather was bad', 'The water was cold', 'They had no time'],
        correct: 2 },
      { id: 1103, level: 'A2', type: 'vocabulary-in-context',
        prompt: 'In the text, "instead" is closest in meaning to ___.',
        options: ['before', 'as an alternative', 'without stopping', 'quickly'],
        correct: 1 },
      { id: 1104, level: 'B1', type: 'inference',
        prompt: 'What can we understand about their trip?',
        options: [
          'They did not enjoy the day',
          'They plan to go back to the beach',
          'They swam a lot during the day',
          'They stayed in Viña del Mar overnight',
        ],
        correct: 1 },
      { id: 1105, level: 'A2', type: 'detail',
        prompt: 'What did they do in the afternoon?',
        options: ['They swam', 'They ate empanadas', 'They visited a museum', 'They took the bus home'],
        correct: 2 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // B1 — Working from home (~150 words)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'b1-work-from-home',
    level:     'B1',
    title:     'Working from home',
    wordCount: 156,
    text:
`Five years ago, working from home was unusual in most industries. Employees went to an office almost every day, and remote work was often seen as a favour granted to a lucky few. Today, the situation has changed dramatically. Many companies now allow their staff to work from home at least two or three days a week, and some jobs are entirely remote.

There are clear advantages. Employees save time on commuting, have more flexibility to organise their day, and can often concentrate better without the noise of a busy office. Employers, in turn, spend less on office space and can hire from a wider pool of talent.

However, remote work is not without its problems. Some workers report feeling isolated from their colleagues, and others struggle to separate work from their personal life. New employees, in particular, may find it harder to build professional relationships when they rarely meet their team in person.`,
    questions: [
      { id: 1201, level: 'B1', type: 'main-idea',
        prompt: 'What is the main idea of the passage?',
        options: [
          'Working from home is always better than going to an office',
          'Remote work has become common but brings both advantages and disadvantages',
          'Employers should force everyone back to the office',
          'New employees cannot work from home',
        ],
        correct: 1 },
      { id: 1202, level: 'B1', type: 'detail',
        prompt: 'According to the text, what do employees save when they work from home?',
        options: ['Money on rent', 'Time on commuting', 'Effort at work', 'Health problems'],
        correct: 1 },
      { id: 1203, level: 'B1', type: 'vocabulary-in-context',
        prompt: '"Granted" in the first paragraph is closest in meaning to ___.',
        options: ['taken', 'given', 'refused', 'discussed'],
        correct: 1 },
      { id: 1204, level: 'B2', type: 'inference',
        prompt: 'What does the passage suggest about new employees?',
        options: [
          'They prefer working from home',
          'They dislike their colleagues',
          'Remote work can make it harder for them to integrate',
          'They earn less than experienced workers',
        ],
        correct: 2 },
      { id: 1205, level: 'B1', type: 'detail',
        prompt: 'What benefit do employers gain, according to the text?',
        options: [
          'They pay their staff more',
          'They spend less on office space',
          'They have more customers',
          'Their employees never feel isolated',
        ],
        correct: 1 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // B1+ — The rise of second-hand fashion (~170 words)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'b1plus-second-hand-fashion',
    level:     'B1+',
    title:     'The rise of second-hand fashion',
    wordCount: 179,
    text:
`Ten years ago, most people would have hesitated to admit that they bought their clothes second-hand. Charity shops were associated with tight budgets rather than personal style. Today, however, second-hand fashion — often marketed under the more glamorous label "pre-loved" — is booming, particularly among younger consumers.

Several factors explain this shift. Environmental concerns have made shoppers more aware of the enormous waste generated by the fast-fashion industry, in which garments are worn only a handful of times before being discarded. At the same time, online platforms such as Vinted and Depop have made it far easier to buy, sell and browse used clothing from home.

There is also a cultural dimension. For many young people, wearing something unique is more attractive than owning yet another mass-produced item found in every high-street shop. In some cases, second-hand pieces have become status symbols in their own right, admired precisely because they cannot be easily replicated.`,
    questions: [
      { id: 1301, level: 'B1+', type: 'main-idea',
        prompt: 'What is the writer\'s main point?',
        options: [
          'Charity shops used to be more popular than they are now',
          'Second-hand clothing has become fashionable for a mix of reasons',
          'Fast fashion is the only way to buy affordable clothes',
          'Vinted and Depop have replaced physical shops entirely',
        ],
        correct: 1 },
      { id: 1302, level: 'B1+', type: 'detail',
        prompt: 'Why has second-hand fashion grown, according to the text?',
        options: [
          'Because clothes have become more expensive',
          'Because young people no longer follow trends',
          'Because of environmental concerns and easier online platforms',
          'Because charity shops have opened more branches',
        ],
        correct: 2 },
      { id: 1303, level: 'B2', type: 'vocabulary-in-context',
        prompt: 'The word "discarded" in the second paragraph most closely means ___.',
        options: ['sold', 'thrown away', 'donated', 'repaired'],
        correct: 1 },
      { id: 1304, level: 'B2', type: 'inference',
        prompt: 'What does the writer suggest about the appeal of pre-loved pieces?',
        options: [
          'They are always cheaper than new clothes',
          'They give the wearer something distinctive',
          'They are difficult to find online',
          'They are worn only by wealthy people',
        ],
        correct: 1 },
      { id: 1305, level: 'B1+', type: 'purpose',
        prompt: 'What is the writer\'s main purpose?',
        options: [
          'To criticise the fast-fashion industry',
          'To recommend specific second-hand shops',
          'To describe and explain a trend',
          'To warn readers about buying second-hand',
        ],
        correct: 2 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // B2 — Universal basic income (~200 words)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'b2-universal-basic-income',
    level:     'B2',
    title:     'The universal basic income debate',
    wordCount: 208,
    text:
`Few economic proposals in recent memory have provoked as much heated discussion as universal basic income, or UBI: a scheme under which every adult would receive a regular payment from the state, regardless of their employment status. Its supporters argue that UBI would provide a safety net in an era of increasing automation, offering security to workers whose jobs might be lost to machines. They also point out that a guaranteed income would reduce administrative costs, since the complex bureaucracy of means-tested benefits could be significantly streamlined.

Critics, however, remain unconvinced. Some worry that giving people money without any conditions could weaken the incentive to work, particularly among younger adults still shaping their careers. Others question the sheer cost of any universal payment large enough to matter, warning that it would either require substantial tax increases or lead to cuts elsewhere in public spending.

Empirical evidence is still limited. Small pilots in Finland, Kenya and parts of the United States have produced mixed results: recipients reported greater wellbeing and less financial stress, but the effects on employment were less clear. Whether UBI could work on a national scale remains, for now, a genuinely open question.`,
    questions: [
      { id: 1401, level: 'B2', type: 'main-idea',
        prompt: 'What is the writer\'s main aim?',
        options: [
          'To argue that UBI should be adopted everywhere',
          'To present arguments for and against UBI and note the lack of clear evidence',
          'To describe how UBI works in Finland',
          'To criticise the bureaucracy of the benefits system',
        ],
        correct: 1 },
      { id: 1402, level: 'B2', type: 'detail',
        prompt: 'Which of the following is mentioned as an argument in favour of UBI?',
        options: [
          'It would completely eliminate poverty',
          'It would offer security to workers whose jobs may be automated',
          'It has already worked at a national scale',
          'It would replace all forms of government spending',
        ],
        correct: 1 },
      { id: 1403, level: 'B2', type: 'vocabulary-in-context',
        prompt: 'The word "streamlined" in the first paragraph is closest in meaning to ___.',
        options: ['expanded', 'made simpler and more efficient', 'made more expensive', 'privatised'],
        correct: 1 },
      { id: 1404, level: 'C1', type: 'inference',
        prompt: 'What can be inferred about the writer\'s stance?',
        options: [
          'The writer strongly supports UBI',
          'The writer strongly opposes UBI',
          'The writer presents both sides and remains cautious',
          'The writer believes UBI is too dangerous to test',
        ],
        correct: 2 },
      { id: 1405, level: 'B2', type: 'detail',
        prompt: 'What do the pilots in Finland, Kenya and the US suggest?',
        options: [
          'People stop working when they receive UBI',
          'UBI produces mixed results — better wellbeing but unclear effects on employment',
          'UBI is impossible outside of Europe',
          'UBI eliminates the need for other benefits',
        ],
        correct: 1 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // C1 — The paradox of choice (~240 words)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id:        'c1-paradox-of-choice',
    level:     'C1',
    title:     'The paradox of choice',
    wordCount: 246,
    text:
`For much of the twentieth century, consumer choice was widely regarded as an unambiguous good. The more options a market offered, the reasoning went, the more likely each individual would be to find something that matched their preferences. This assumption underpinned decades of marketing strategy — and, arguably, much of contemporary economic policy.

More recent psychological research has cast doubt on this view. In a series of now-famous experiments, the American psychologist Barry Schwartz demonstrated that beyond a certain threshold, additional options tend to produce not liberation but paralysis. Faced with dozens of near-identical jams, mortgages or pension plans, consumers frequently postpone or abandon the decision altogether, and those who do choose often feel dissatisfied afterwards, haunted by the possibility that they might have selected something better.

The phenomenon, which Schwartz calls the "paradox of choice", has significant implications well beyond the supermarket aisle. In healthcare, patients presented with too many treatment options may feel less confident in their eventual decision, even when the outcome is objectively favourable. In education, students overwhelmed by an ever-expanding menu of degree combinations may take longer to graduate, if they graduate at all.

None of this is to suggest that choice is inherently harmful. Rather, it points to the more nuanced conclusion that the value of choice is not linear. Beyond a threshold that varies from person to person, further options offer diminishing returns and may even, quite counter-intuitively, reduce our wellbeing.`,
    questions: [
      { id: 1501, level: 'C1', type: 'main-idea',
        prompt: 'What is the central idea of the passage?',
        options: [
          'Consumer choice should be restricted by law',
          'Beyond a point, more choice tends to reduce satisfaction rather than increase it',
          'Barry Schwartz\'s experiments were not scientifically valid',
          'Marketing strategies of the twentieth century were entirely wrong',
        ],
        correct: 1 },
      { id: 1502, level: 'C1', type: 'detail',
        prompt: 'According to the text, what did Schwartz\'s experiments show?',
        options: [
          'That consumers always make the correct choice',
          'That excessive options can cause paralysis and dissatisfaction',
          'That jam is the most difficult product to choose',
          'That people prefer to shop online',
        ],
        correct: 1 },
      { id: 1503, level: 'C1', type: 'vocabulary-in-context',
        prompt: 'The word "haunted" in the second paragraph is closest in meaning to ___.',
        options: ['convinced', 'persistently troubled', 'physically affected', 'relieved'],
        correct: 1 },
      { id: 1504, level: 'C1', type: 'inference',
        prompt: 'What can be inferred from the reference to healthcare and education?',
        options: [
          'These sectors should reduce their offerings drastically',
          'The paradox of choice is limited to shopping',
          'The paradox has consequences that extend beyond commercial decisions',
          'Students always take too long to graduate',
        ],
        correct: 2 },
      { id: 1505, level: 'C1', type: 'purpose',
        prompt: 'What is the writer\'s overall stance in the final paragraph?',
        options: [
          'Choice is always harmful and should be minimised',
          'Choice is inherently good and should be maximised',
          'The value of choice is not linear — its benefits diminish and may even reverse past a certain point',
          'Choice has no measurable impact on wellbeing',
        ],
        correct: 2 },
    ],
  },
];

export function totalReadingQuestions(): number {
  return PLACEMENT_READING.reduce((sum, p) => sum + p.questions.length, 0);
}
