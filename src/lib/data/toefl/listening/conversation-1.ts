// TOEFL Listening Conversation 1 — Introductory mock
// Setting: student visiting the university library help desk. ~3 min audio.

import type { TOEFLListeningAudio } from '@/types/toefl';

export const conversation1: TOEFLListeningAudio = {
  id:       'conv-1',
  type:     'conversation',
  title:    'Library Research Help',
  subject:  'Campus life',
  speakers: [
    { id: 'student',   name: 'Student' },
    { id: 'librarian', name: 'Librarian' },
  ],
  script: [
    { speakerId: 'student',   text:
      `Excuse me, hi. Do you have a minute? I have kind of a specific problem and I'm not sure who to ask.` },
    { speakerId: 'librarian', text:
      `Sure, that's what the desk is for. What's the problem?` },
    { speakerId: 'student',   text:
      `Okay, so I'm writing a paper for my history seminar on the Roman Republic, and my professor keeps insisting that I use primary sources — not just modern historians. And I get why, but every time I go to search in the catalogue for something like, I don't know, Cicero's letters, I get a list of about fifty different editions and translations, and I have no idea which one I'm supposed to be citing.` },
    { speakerId: 'librarian', text:
      `Ah, yeah, that's a very common problem, actually. It's not really a searching problem, it's more of a citation problem. The short version is that your professor probably wants you to cite the ancient text itself — Cicero's letter to whoever it is — using the standard reference system, and then in a bibliography you list the specific edition or translation you consulted.` },
    { speakerId: 'student',   text:
      `Oh. So the fifty editions don't matter for the actual reference?` },
    { speakerId: 'librarian', text:
      `Not for the reference itself. When you cite Cicero, you cite Cicero — by the reference numbers that ancient texts have that stay the same across all editions. The edition matters at the end, in your bibliography, so that anyone reading your paper can go find the exact version you read, in case they want to check a translation or look at the notes.` },
    { speakerId: 'student',   text:
      `Right, that makes sense. But how do I know which edition to actually use in the first place? Like, is one of them the correct one?` },
    { speakerId: 'librarian', text:
      `Correct isn't really the word. What you want is a scholarly edition — usually something from a university press or from one of the well-known series like the Loeb Classical Library. Those are the ones that have gone through serious editorial work, with the Latin or Greek on one side, an English translation, and notes explaining textual choices. Avoid anything you find on random websites — those often reprint out-of-copyright translations from the 1800s that aren't reliable anymore.` },
    { speakerId: 'student',   text:
      `Loeb — okay, I've seen those. The little red and green books, right? We have them here?` },
    { speakerId: 'librarian', text:
      `Yes, on the second floor, in the classics section. And if we don't have a particular volume, we can request it through interlibrary loan, usually within a week. But — and this is the more useful part probably — for a lot of the standard texts, we also have digital access through a database called Perseus. Have you used it?` },
    { speakerId: 'student',   text:
      `I don't think so.` },
    { speakerId: 'librarian', text:
      `It's free and it's excellent. Original texts, translations, cross-references. I'd start there before you even come get the physical books, honestly. You can browse and figure out which specific letters you want, and then come get the print edition if you want to use the scholarly notes.` },
    { speakerId: 'student',   text:
      `Okay, that would save me a huge amount of time. One more thing — do I need to check out the Loeb volumes or can I just use them in the library?` },
    { speakerId: 'librarian', text:
      `You can check them out, but I'd honestly recommend just using them here. They're a shared resource and other students in classics courses will be looking for them too. If you photocopy or scan the pages you need, that's usually enough.` },
    { speakerId: 'student',   text:
      `Perfect. Thank you — this was really helpful.` },
  ],
  questions: [
    {
      id: 'c1-q1',
      prompt: 'Why does the student go to the library help desk?',
      options: [
        'To renew books he has already checked out',
        'To request access to a restricted archive',
        'To ask for help figuring out which edition of a primary source to cite',
        'To recommend that the library purchase new titles',
      ],
      correct: 2,
    },
    {
      id: 'c1-q2',
      prompt: 'According to the librarian, how should the student cite an ancient text?',
      options: [
        'By the ancient reference numbers, with the specific edition listed in the bibliography',
        'By the title of the modern edition he used',
        'By the publication date of the earliest available translation',
        'By the name of the translator only',
      ],
      correct: 0,
    },
    {
      id: 'c1-q3',
      prompt: 'What kind of edition does the librarian recommend?',
      options: [
        'Any edition available online for free',
        'A scholarly edition from a university press or a series like the Loeb Classical Library',
        'Whichever edition is oldest, since those are considered most authoritative',
        'A student edition designed specifically for undergraduate courses',
      ],
      correct: 1,
    },
    {
      id: 'c1-q4',
      prompt: 'What does the librarian suggest the student try before coming to get the print editions?',
      options: [
        'Emailing his professor for a list of specific books',
        'Using a database called Perseus for original texts and translations',
        'Requesting the books through interlibrary loan',
        'Checking the university\'s recorded lectures on Cicero',
      ],
      correct: 1,
    },
    {
      id: 'c1-q5',
      prompt: 'Why does the librarian recommend using the Loeb volumes in the library rather than checking them out?',
      options: [
        'They cannot legally be removed from the building',
        'The library charges a fee for checking them out',
        'They are too heavy for casual transport',
        'They are a shared resource that other classics students also need',
      ],
      correct: 3,
    },
  ],
};
