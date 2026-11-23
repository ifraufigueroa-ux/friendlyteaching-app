// FriendlyTeaching.cl — Daily Practice: extra units, wave 4
//
// Reading comprehension. We had zero reading units in the catalogue;
// this wave adds one per CEFR level so the skill filter stops looking
// broken. Each unit shares a thematic thread but every exercise can
// stand alone — the passage is embedded in the exercise prompt so the
// runner doesn't need a new "passage + questions" shape.
//
// Length ramps up with level:
//   A0 — single sentence, picture-book register
//   A1 — 2-3 sentences, high-frequency vocab
//   A2 — short email/sms format
//   B1 — 4-5 sentence news snippet
//   B2 — opinion / argument paragraph
//   B2+ — inference-heavy paragraph
//   C1 — academic register with nuance
//
// Shape: all exercises are 'multiple-choice'. Passages live in the
// prompt; when a passage is reused across several items we repeat it
// so each item renders standalone (keeps the runner trivial).

import type { PracticeUnit } from '@/types/practice';

export const EXTRA_UNITS_WAVE_4: PracticeUnit[] = [

  // ╔══════════════════════ A0 ══════════════════════╗

  {
    id: 'a0-reading-first-words',
    level: 'A0',
    skill: 'reading',
    title: 'First Words',
    description: 'Read very short sentences about everyday things and pick the right answer.',
    icon: '📖',
    quickLesson: {
      summary: 'Short sentences with high-frequency words. Read slowly and look for the one keyword that tells you the answer.',
      sections: [
        {
          heading: 'Strategy',
          body: 'Read the whole sentence once. Find the subject (who/what) and the main word (verb or object). Ignore words you do not know yet — they are rarely the answer.',
          examples: [
            '«The cat is on the table.» → Where is the cat? → on the table.',
            '«I have two dogs.» → How many dogs? → two.',
          ],
          tip: 'If you understand the keyword, you understand the sentence.',
        },
      ],
    },
    exercises: [
      {
        id: 'a0-rfw-01',
        type: 'multiple-choice',
        prompt: 'Read: "Anna is a teacher. She works at a school."\n\nWhat is Anna\'s job?',
        options: ['A doctor', 'A teacher', 'A student', 'A driver'],
        correctIndex: 1,
      },
      {
        id: 'a0-rfw-02',
        type: 'multiple-choice',
        prompt: 'Read: "My brother has a red bike. He rides it every day."\n\nWhat colour is the bike?',
        options: ['Blue', 'Green', 'Red', 'Black'],
        correctIndex: 2,
      },
      {
        id: 'a0-rfw-03',
        type: 'multiple-choice',
        prompt: 'Read: "The dog is in the garden. The cat is on the sofa."\n\nWhere is the cat?',
        options: ['In the garden', 'On the sofa', 'In the kitchen', 'On the table'],
        correctIndex: 1,
      },
      {
        id: 'a0-rfw-04',
        type: 'multiple-choice',
        prompt: 'Read: "I have three sisters and one brother."\n\nHow many sisters does the person have?',
        options: ['One', 'Two', 'Three', 'Four'],
        correctIndex: 2,
      },
      {
        id: 'a0-rfw-05',
        type: 'multiple-choice',
        prompt: 'Read: "Tom lives in a small house. His house is white."\n\nWhat colour is Tom\'s house?',
        options: ['Red', 'Blue', 'White', 'Yellow'],
        correctIndex: 2,
      },
      {
        id: 'a0-rfw-06',
        type: 'multiple-choice',
        prompt: 'Read: "The school opens at 8. The school closes at 4."\n\nWhen does the school close?',
        options: ['At 8', 'At 4', 'At 12', 'At 6'],
        correctIndex: 1,
      },
    ],
  },

  // ╔══════════════════════ A1 ══════════════════════╗

  {
    id: 'a1-reading-daily-routines',
    level: 'A1',
    skill: 'reading',
    title: 'Daily Routines',
    description: 'Short paragraphs about people\'s days — times, places, activities.',
    icon: '📖',
    quickLesson: {
      summary: 'Two or three sentences per text. Watch for time expressions (at 7, every day, in the evening) and verbs in the present simple.',
      sections: [
        {
          heading: 'Strategy',
          body: 'Skim first for keywords: times, days, places. Then read again to get the detail. If a question asks "when" look for a number or day. If it asks "where" look for a place.',
          examples: [
            '«She has coffee at 7 a.m.» → When? → 7 a.m.',
            '«They play football on Sundays.» → When? → Sundays.',
          ],
          tip: 'Match the question word (when / where / what / who) with the matching word in the text.',
        },
      ],
    },
    exercises: [
      {
        id: 'a1-rdr-01',
        type: 'multiple-choice',
        prompt: 'Read: "Maria is a nurse. She starts work at 7 a.m. and finishes at 3 p.m. She usually has lunch at the hospital."\n\nWhere does Maria have lunch?',
        options: ['At home', 'At a restaurant', 'At the hospital', 'In the park'],
        correctIndex: 2,
      },
      {
        id: 'a1-rdr-02',
        type: 'multiple-choice',
        prompt: 'Read: "Maria is a nurse. She starts work at 7 a.m. and finishes at 3 p.m. She usually has lunch at the hospital."\n\nWhat time does she finish work?',
        options: ['7 a.m.', '3 p.m.', '12 p.m.', '5 p.m.'],
        correctIndex: 1,
      },
      {
        id: 'a1-rdr-03',
        type: 'multiple-choice',
        prompt: 'Read: "Tom lives in London. He takes the bus to university every morning. In the evening he studies at the library."\n\nHow does Tom get to university?',
        options: ['By car', 'By bus', 'On foot', 'By bike'],
        correctIndex: 1,
      },
      {
        id: 'a1-rdr-04',
        type: 'multiple-choice',
        prompt: 'Read: "Tom lives in London. He takes the bus to university every morning. In the evening he studies at the library."\n\nWhen does Tom study at the library?',
        options: ['In the morning', 'At lunchtime', 'In the afternoon', 'In the evening'],
        correctIndex: 3,
      },
      {
        id: 'a1-rdr-05',
        type: 'multiple-choice',
        prompt: 'Read: "On Saturdays, Jenny goes to the market with her mother. They buy fresh fruit and bread. They do not go on Sundays because the market is closed."\n\nWhy don\'t they go on Sundays?',
        options: ['It\'s too far', 'The market is closed', 'They are tired', 'They don\'t like it'],
        correctIndex: 1,
      },
      {
        id: 'a1-rdr-06',
        type: 'multiple-choice',
        prompt: 'Read: "Carlos plays football twice a week. On Tuesdays he trains with his team, and on Saturdays they play a match."\n\nWhen does Carlos play a match?',
        options: ['On Tuesdays', 'On Saturdays', 'Every day', 'On Sundays'],
        correctIndex: 1,
      },
    ],
  },

  // ╔══════════════════════ A2 ══════════════════════╗

  {
    id: 'a2-reading-messages-emails',
    level: 'A2',
    skill: 'reading',
    title: 'Messages & Short Emails',
    description: 'Real-life text messages and emails — invitations, apologies, plans.',
    icon: '📖',
    quickLesson: {
      summary: 'Everyday written English — chats, invites, short emails. Pay attention to who writes, who reads, and what the main request is.',
      sections: [
        {
          heading: 'Strategy',
          body: 'Ask yourself: What does the writer want? (an answer, a favour, information, an apology). The main point is usually in the first or last sentence.',
          examples: [
            'Hi Sam, can you bring the laptop tomorrow? → wants Sam to bring the laptop.',
            'Sorry, I can\'t come to lunch today. → apology for not coming.',
          ],
          tip: 'Greetings and sign-offs tell you how formal the message is.',
        },
      ],
    },
    exercises: [
      {
        id: 'a2-rme-01',
        type: 'multiple-choice',
        prompt: 'SMS from Lisa: "Hi, running 10 min late. Order me a coffee?"\n\nWhat does Lisa want?',
        options: ['To cancel the meeting', 'Someone to order her a coffee', 'To change the place', 'To reschedule'],
        correctIndex: 1,
      },
      {
        id: 'a2-rme-02',
        type: 'multiple-choice',
        prompt: 'Email subject: "Meeting moved to 4 p.m."\n\nBody: "Hi team, due to a scheduling conflict, tomorrow\'s meeting is now at 4 p.m. instead of 2 p.m. Same room."\n\nWhat has changed?',
        options: ['The day', 'The time', 'The room', 'The attendees'],
        correctIndex: 1,
      },
      {
        id: 'a2-rme-03',
        type: 'multiple-choice',
        prompt: 'Note on fridge: "Dinner is in the microwave. Just 2 min on high. Love, Mom"\n\nWhat should you do?',
        options: ['Cook dinner', 'Heat the food', 'Order food', 'Go out to eat'],
        correctIndex: 1,
      },
      {
        id: 'a2-rme-04',
        type: 'multiple-choice',
        prompt: 'Group chat message: "Who\'s free this Saturday? Beach picnic at 11 a.m. Bring snacks please!"\n\nWhat kind of event is this?',
        options: ['A birthday party', 'A beach picnic', 'A work meeting', 'A study session'],
        correctIndex: 1,
      },
      {
        id: 'a2-rme-05',
        type: 'multiple-choice',
        prompt: 'Email: "Dear Mr. Patel, I would like to book a table for 4 people this Friday at 8 p.m. Best, Sofia"\n\nWhat is Sofia asking for?',
        options: ['Directions', 'A reservation', 'A refund', 'A job'],
        correctIndex: 1,
      },
      {
        id: 'a2-rme-06',
        type: 'multiple-choice',
        prompt: 'Text from boss: "The report looks great. One small fix: page 4 chart — the numbers should be in thousands, not millions. Can you update and resend by 5?"\n\nWhat does the boss need?',
        options: ['A new report', 'Just a correction on page 4, by 5 p.m.', 'A phone call', 'Someone else to write it'],
        correctIndex: 1,
      },
    ],
  },

  // ╔══════════════════════ B1 ══════════════════════╗

  {
    id: 'b1-reading-news-snippets',
    level: 'B1',
    skill: 'reading',
    title: 'News Snippets',
    description: 'Short news stories — sports, lifestyle, local events — with comprehension questions.',
    icon: '📰',
    quickLesson: {
      summary: '4-5 sentence news items. Journalists put the key facts first — the who/what/when/where usually hides in sentence one.',
      sections: [
        {
          heading: 'Strategy',
          body: 'Headline → first sentence → details. Read the headline for the topic, the first sentence for the main fact, and the rest for support.',
          examples: [
            'Headline: "Local Café Reopens After Flood" → topic.',
            'First line: "Blue Mug Café reopened on Monday..." → main fact.',
          ],
          tip: 'If a question asks about a date or a name, scan the whole text for numbers and capital letters before re-reading.',
        },
      ],
    },
    exercises: [
      {
        id: 'b1-rns-01',
        type: 'multiple-choice',
        prompt: 'Read: "Local Café Reopens After Flood. Blue Mug Café in Westfield reopened on Monday, two months after heavy rain flooded the basement and damaged the coffee machines. Owner Marta Diaz said the community helped with donations and volunteer cleaning days. Regular customers were among the first in line."\n\nHow long was the café closed?',
        options: ['One week', 'One month', 'Two months', 'A year'],
        correctIndex: 2,
      },
      {
        id: 'b1-rns-02',
        type: 'multiple-choice',
        prompt: 'Read: "Local Café Reopens After Flood. Blue Mug Café in Westfield reopened on Monday, two months after heavy rain flooded the basement and damaged the coffee machines. Owner Marta Diaz said the community helped with donations and volunteer cleaning days. Regular customers were among the first in line."\n\nWho was damaged in the flood?',
        options: ['The windows', 'The coffee machines', 'The sign', 'The chairs'],
        correctIndex: 1,
      },
      {
        id: 'b1-rns-03',
        type: 'multiple-choice',
        prompt: 'Read: "City Bans Scooters in Parks. Starting next month, electric scooters will no longer be allowed in city parks. The council voted 6-3 after months of complaints from walkers. Fines will start at $50. Rental companies say they will update their apps to warn users."\n\nWho asked for the ban?',
        options: ['The rental companies', 'Walkers in the parks', 'Scooter drivers', 'The mayor alone'],
        correctIndex: 1,
      },
      {
        id: 'b1-rns-04',
        type: 'multiple-choice',
        prompt: 'Read: "City Bans Scooters in Parks. Starting next month, electric scooters will no longer be allowed in city parks. The council voted 6-3 after months of complaints from walkers. Fines will start at $50. Rental companies say they will update their apps to warn users."\n\nWhat will rental companies do?',
        options: ['Stop their business', 'Update their apps to warn users', 'Pay all the fines', 'Move to other cities'],
        correctIndex: 1,
      },
      {
        id: 'b1-rns-05',
        type: 'multiple-choice',
        prompt: 'Read: "Marathon Record Broken. Runner Luis Ortiz, 28, set a new national marathon record on Sunday with a time of 2 hours 7 minutes. Ortiz, who trained for the event in the mountains near his hometown, beat the previous record by 42 seconds. He said the cool weather helped."\n\nBy how much did Ortiz beat the record?',
        options: ['2 minutes', '42 seconds', '7 minutes', '10 seconds'],
        correctIndex: 1,
      },
      {
        id: 'b1-rns-06',
        type: 'multiple-choice',
        prompt: 'Read: "Marathon Record Broken. Runner Luis Ortiz, 28, set a new national marathon record on Sunday with a time of 2 hours 7 minutes. Ortiz, who trained for the event in the mountains near his hometown, beat the previous record by 42 seconds. He said the cool weather helped."\n\nWhat did Ortiz say helped him?',
        options: ['His diet', 'The crowd', 'The cool weather', 'His coach'],
        correctIndex: 2,
      },
    ],
  },

  // ╔══════════════════════ B2 ══════════════════════╗

  {
    id: 'b2-reading-opinion-pieces',
    level: 'B2',
    skill: 'reading',
    title: 'Opinion Pieces',
    description: 'Argumentative paragraphs — identify the writer\'s stance, reasons, and examples.',
    icon: '💭',
    quickLesson: {
      summary: 'Opinion writing has a thesis (the claim), reasons (why), and examples (evidence). Spot each one and you understand the whole piece.',
      sections: [
        {
          heading: 'Strategy',
          body: 'Ask: What does the writer want you to believe? The first or last sentence usually states it. Then look for linking words: however, because, for example, on the other hand — they signal the argument\'s shape.',
          examples: [
            '«Remote work has drawbacks, but...» → writer is about to argue it\'s still worth it.',
            '«For example, studies show...» → evidence coming up.',
          ],
          tip: 'Distinguish fact ("30% of workers...") from opinion ("I believe...").',
        },
      ],
    },
    exercises: [
      {
        id: 'b2-rop-01',
        type: 'multiple-choice',
        prompt: 'Read: "Working from home sounds ideal — no commute, flexible hours, no office noise. But the hidden cost is social. In five years of remote work, I have met many colleagues I would struggle to recognise at an airport. The bonds that let a team solve hard problems together are built in small moments: a shared coffee, a hallway chat. Zoom calls do not replace those."\n\nWhat is the writer\'s main argument?',
        options: [
          'Remote work saves money',
          'Remote work weakens team relationships',
          'Offices should be redesigned',
          'Zoom should be improved',
        ],
        correctIndex: 1,
      },
      {
        id: 'b2-rop-02',
        type: 'multiple-choice',
        prompt: 'Read: "Working from home sounds ideal — no commute, flexible hours, no office noise. But the hidden cost is social. In five years of remote work, I have met many colleagues I would struggle to recognise at an airport. The bonds that let a team solve hard problems together are built in small moments: a shared coffee, a hallway chat. Zoom calls do not replace those."\n\nWhich of these is the writer\'s evidence?',
        options: [
          'Statistics from surveys',
          'Personal experience over five years',
          'Expert interviews',
          'Published research'
        ],
        correctIndex: 1,
      },
      {
        id: 'b2-rop-03',
        type: 'multiple-choice',
        prompt: 'Read: "Public libraries are often seen as old-fashioned, but visit one on a Saturday morning and you will see something different: children at story time, teenagers studying, older adults getting help with government forms. In a world where almost every service costs money, a library is a rare place where anyone can walk in, sit down, and belong — no purchase required."\n\nThe writer\'s view of libraries is:',
        options: [
          'Nostalgic for the past',
          'Critical of their current state',
          'Supportive because they include everyone',
          'Neutral — just describing them'
        ],
        correctIndex: 2,
      },
      {
        id: 'b2-rop-04',
        type: 'multiple-choice',
        prompt: 'Read: "Public libraries are often seen as old-fashioned, but visit one on a Saturday morning and you will see something different: children at story time, teenagers studying, older adults getting help with government forms. In a world where almost every service costs money, a library is a rare place where anyone can walk in, sit down, and belong — no purchase required."\n\nThe phrase "no purchase required" is used to highlight:',
        options: [
          'The low cost of books',
          'That libraries are free to enter and use',
          'A discount available',
          'That membership is cheap'
        ],
        correctIndex: 1,
      },
      {
        id: 'b2-rop-05',
        type: 'multiple-choice',
        prompt: 'Read: "The best advice I ever got about public speaking was unexpected: don\'t try to be interesting — try to be useful. Audiences forgive dullness much faster than they forgive the feeling of wasting their time. If you give them one thing they can actually use when they get home, they will leave happy. If you entertain them without that, they leave empty."\n\nThe writer believes a good speaker should:',
        options: [
          'Tell more jokes',
          'Focus on being entertaining',
          'Give the audience something practical',
          'Speak more slowly'
        ],
        correctIndex: 2,
      },
      {
        id: 'b2-rop-06',
        type: 'multiple-choice',
        prompt: 'Read: "The best advice I ever got about public speaking was unexpected: don\'t try to be interesting — try to be useful. Audiences forgive dullness much faster than they forgive the feeling of wasting their time. If you give them one thing they can actually use when they get home, they will leave happy. If you entertain them without that, they leave empty."\n\nAccording to the text, what do audiences dislike most?',
        options: [
          'A dull speaker',
          'A long speech',
          'Feeling their time was wasted',
          'A nervous speaker'
        ],
        correctIndex: 2,
      },
    ],
  },

  // ╔══════════════════════ B2+ ══════════════════════╗

  {
    id: 'b2plus-reading-inference',
    level: 'B2+',
    skill: 'reading',
    title: 'Reading Between the Lines',
    description: 'Short texts where the answer isn\'t stated directly — you have to infer it.',
    icon: '🔎',
    quickLesson: {
      summary: 'Inference means figuring out what the text implies but doesn\'t say. You combine the writer\'s words with your common sense.',
      sections: [
        {
          heading: 'Strategy',
          body: 'Ask: What must be true for this sentence to make sense? Pay attention to tone (ironic, sincere, cautious), word choice (strong vs soft verbs), and what the writer leaves out.',
          examples: [
            '«Of course, I always wake up thrilled on Monday.» → probably ironic.',
            '«She may have had her reasons.» → writer doubts her reasons were good.',
          ],
          tip: 'If the writer could have said it directly and didn\'t, there\'s usually a reason.',
        },
      ],
    },
    exercises: [
      {
        id: 'b2p-rif-01',
        type: 'multiple-choice',
        prompt: 'Read: "When I asked the hotel receptionist about the Wi-Fi, she smiled and said, \'It works most of the time.\' I spent the next three evenings writing emails from the café across the street."\n\nWhat can we infer?',
        options: [
          'The receptionist was friendly',
          'The Wi-Fi was reliable',
          'The Wi-Fi did not actually work well',
          'The café had faster internet'
        ],
        correctIndex: 2,
      },
      {
        id: 'b2p-rif-02',
        type: 'multiple-choice',
        prompt: 'Read: "When I asked the hotel receptionist about the Wi-Fi, she smiled and said, \'It works most of the time.\' I spent the next three evenings writing emails from the café across the street."\n\nThe receptionist\'s phrase "most of the time" suggests she:',
        options: [
          'Was being precise and accurate',
          'Knew the Wi-Fi often failed but softened it',
          'Had never used the Wi-Fi herself',
          'Was joking'
        ],
        correctIndex: 1,
      },
      {
        id: 'b2p-rif-03',
        type: 'multiple-choice',
        prompt: 'Read: "The report arrived on Monday with a single Post-it note on the cover: \'Please review when you have a moment.\' By Thursday morning, three more Post-its had appeared, each one slightly more colourful than the last."\n\nWhat can we infer about the person waiting for the review?',
        options: [
          'They were patient and relaxed',
          'They were getting increasingly impatient',
          'They had lost interest',
          'They were on holiday'
        ],
        correctIndex: 1,
      },
      {
        id: 'b2p-rif-04',
        type: 'multiple-choice',
        prompt: 'Read: "At the end of the interview, the manager said, \'We\'ll be in touch.\' That was in April. It is now November. The autumn leaves outside my window are the same colour as the suit I wore that day."\n\nThe writer\'s tone is:',
        options: [
          'Hopeful',
          'Angry',
          'Resigned and mildly ironic',
          'Confused'
        ],
        correctIndex: 2,
      },
      {
        id: 'b2p-rif-05',
        type: 'multiple-choice',
        prompt: 'Read: "At the end of the interview, the manager said, \'We\'ll be in touch.\' That was in April. It is now November. The autumn leaves outside my window are the same colour as the suit I wore that day."\n\nWhat happened after the interview?',
        options: [
          'The manager contacted the writer soon',
          'The writer never heard back',
          'The writer got the job',
          'The writer withdrew their application'
        ],
        correctIndex: 1,
      },
      {
        id: 'b2p-rif-06',
        type: 'multiple-choice',
        prompt: 'Read: "He described himself as a \'morning person.\' This was generous. In the three months we shared an office, I never saw him functional before 11 a.m., and the coffee machine filed, I\'m sure, for workers\' compensation."\n\nThe phrase "the coffee machine filed for workers\' compensation" is:',
        options: [
          'A literal statement',
          'A quote from the coffee machine',
          'A humorous exaggeration about how hard it was overworked',
          'A technical comment about repairs'
        ],
        correctIndex: 2,
      },
    ],
  },

  // ╔══════════════════════ C1 ══════════════════════╗

  {
    id: 'c1-reading-academic-register',
    level: 'C1',
    skill: 'reading',
    title: 'Academic & Nuanced',
    description: 'Longer passages with abstract vocabulary, hedging language, and precise meaning.',
    icon: '🎓',
    quickLesson: {
      summary: 'Academic writing uses hedging ("suggests", "tends to", "it may be") and precise vocabulary. The meaning sits in the exact word choice.',
      sections: [
        {
          heading: 'Strategy',
          body: 'Read for the author\'s claim strength: is it a definite claim ("shows") or a tentative one ("suggests")? Notice qualifiers: "in some cases", "largely", "arguably". These change the meaning.',
          examples: [
            '«Results suggest» = soft claim.',
            '«Results prove» = strong claim.',
            '«In most contexts» = not a universal law.',
          ],
          tip: 'If the writer hedges, the correct answer usually hedges too. Watch for options that are too absolute.',
        },
      ],
    },
    exercises: [
      {
        id: 'c1-rar-01',
        type: 'multiple-choice',
        prompt: 'Read: "Recent studies suggest that short, frequent exposure to a second language is often more effective than infrequent long sessions, though the mechanism remains debated. One hypothesis attributes this to consolidation during sleep; another, to reduced cognitive fatigue."\n\nWhich statement best matches the passage?',
        options: [
          'Short frequent sessions definitely work better',
          'Short frequent sessions appear to work better, but researchers disagree on why',
          'Long sessions are useless',
          'Sleep has no role in language learning'
        ],
        correctIndex: 1,
      },
      {
        id: 'c1-rar-02',
        type: 'multiple-choice',
        prompt: 'Read: "Recent studies suggest that short, frequent exposure to a second language is often more effective than infrequent long sessions, though the mechanism remains debated. One hypothesis attributes this to consolidation during sleep; another, to reduced cognitive fatigue."\n\nThe word "hypothesis" indicates that the explanations are:',
        options: [
          'Proven facts',
          'Proposed explanations not yet confirmed',
          'Historical traditions',
          'Personal opinions'
        ],
        correctIndex: 1,
      },
      {
        id: 'c1-rar-03',
        type: 'multiple-choice',
        prompt: 'Read: "Minimum wage increases have, in the economic literature, long been associated with reduced employment among low-skilled workers. More recent studies, however, have complicated this narrative, finding modest or negligible effects in a range of settings. Whether this reflects a genuine shift or methodological refinement remains contested."\n\nThe passage implies that:',
        options: [
          'Minimum wage has no effect on employment',
          'Older studies and newer studies disagree, and the reason is unclear',
          'Minimum wage always reduces employment',
          'Methodology does not matter'
        ],
        correctIndex: 1,
      },
      {
        id: 'c1-rar-04',
        type: 'multiple-choice',
        prompt: 'Read: "Minimum wage increases have, in the economic literature, long been associated with reduced employment among low-skilled workers. More recent studies, however, have complicated this narrative, finding modest or negligible effects in a range of settings. Whether this reflects a genuine shift or methodological refinement remains contested."\n\n"Complicated this narrative" means:',
        options: [
          'Agreed with the earlier view',
          'Challenged the simple earlier view with mixed evidence',
          'Ignored the earlier view',
          'Confirmed the earlier view'
        ],
        correctIndex: 1,
      },
      {
        id: 'c1-rar-05',
        type: 'multiple-choice',
        prompt: 'Read: "Although the technology in question is frequently described as revolutionary, a closer reading of the field\'s history suggests a more incremental trajectory. Each celebrated breakthrough can typically be traced to a decade or more of preceding work, much of it unglamorous and poorly funded."\n\nThe writer\'s attitude to the word "revolutionary" is:',
        options: [
          'Full agreement',
          'Skepticism — things develop more gradually than that word suggests',
          'Enthusiasm',
          'No clear position'
        ],
        correctIndex: 1,
      },
      {
        id: 'c1-rar-06',
        type: 'multiple-choice',
        prompt: 'Read: "Although the technology in question is frequently described as revolutionary, a closer reading of the field\'s history suggests a more incremental trajectory. Each celebrated breakthrough can typically be traced to a decade or more of preceding work, much of it unglamorous and poorly funded."\n\n"Poorly funded" in context suggests the author believes that:',
        options: [
          'The important work is often under-recognised',
          'Funding is always the right amount',
          'Breakthroughs come from rich labs only',
          'Early-stage work should not be funded'
        ],
        correctIndex: 0,
      },
    ],
  },

];
