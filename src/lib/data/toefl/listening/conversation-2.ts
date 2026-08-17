// TOEFL Listening Conversation 2 — Mock 2
// Setting: student meets her academic advisor to discuss changing her major.

import type { TOEFLListeningAudio } from '@/types/toefl';

export const conversation2: TOEFLListeningAudio = {
  id:       'conv-2',
  type:     'conversation',
  title:    'Considering a Change of Major',
  subject:  'Academic advising',
  speakers: [
    { id: 'student', name: 'Student' },
    { id: 'advisor', name: 'Advisor' },
  ],
  script: [
    { speakerId: 'student', text:
      `Hi, thanks for making the time. I actually wanted to talk about maybe changing my major, and I have no idea whether it's a good idea or a terrible one.` },
    { speakerId: 'advisor', text:
      `That's a very common conversation, actually — probably a third of the students I see in a given semester. So don't feel like you're in some unusual situation. What are you thinking about?` },
    { speakerId: 'student', text:
      `Okay. So right now I'm declared as an economics major, and I chose it before I even started here, kind of because it seemed practical and my parents thought it was a good idea. But this last semester I took an intro course in environmental science because I needed a lab science credit, and I honestly haven't stopped thinking about it since. Like, I'm reading the textbook for fun, which is not something I do for my econ courses.` },
    { speakerId: 'advisor', text:
      `That's actually a pretty useful sign — the "reading the textbook for fun" test. It's not the only test, but it tells you something. How far along are you in the economics requirements?` },
    { speakerId: 'student', text:
      `I've finished the intro sequence, and I'm about halfway through the intermediate courses. I've probably taken six courses that count toward the major.` },
    { speakerId: 'advisor', text:
      `Okay, so that's meaningful — not fatal, but meaningful. Six courses is roughly a year and a half of investment. Some of those will count toward general education requirements no matter what, so they're not wasted, but some are specific to economics and wouldn't apply to environmental science. Do you have a sense of what the environmental science major requires that you haven't done?` },
    { speakerId: 'student', text:
      `I looked it up. There's a chemistry sequence, another biology course, and a statistics course. I've done one semester of chem for my science credit but not the second one.` },
    { speakerId: 'advisor', text:
      `Alright. So realistically, switching now probably means you graduate one semester later than you would have, maybe two if you can't fit the chemistry into a summer. That's not a small thing, but it's also not catastrophic. The question I want you to sit with is not really "should I switch," it's "if I finish economics as I planned, will I regret not switching?" Because you can always take environmental science courses as electives even without changing major.` },
    { speakerId: 'student', text:
      `That's actually the part I keep going back and forth on. The double option, I mean.` },
    { speakerId: 'advisor', text:
      `Right. So one path is: stay in economics, add an environmental science minor. That doesn't extend your time here much and it gives you both credentials. A second path is: switch fully. A third — and I don't want to push you toward it because it depends on you — is: pick up an environmental economics track, which is offered as a concentration within your current major. It sits between the two.` },
    { speakerId: 'student', text:
      `Wait — I didn't know that existed.` },
    { speakerId: 'advisor', text:
      `It's new, actually — just this year. It uses your existing intermediate courses and adds three that overlap with environmental science. So no time lost, and it lets you see whether environmental questions really keep you engaged for another year before making the bigger call.` },
    { speakerId: 'student', text:
      `That sounds honestly kind of perfect for where I am. Can I officially switch to that concentration this semester?` },
    { speakerId: 'advisor', text:
      `You can, but I'd suggest we don't do the paperwork today. Take a week, look at the specific course list, and talk to one of the environmental economics professors — Dr. Ren teaches the intro to it — before you commit. If it still looks right after that, come back and we'll fill out the form in five minutes.` },
    { speakerId: 'student', text:
      `Okay. That makes sense. Thanks — I actually feel a lot less panicked than when I walked in.` },
  ],
  questions: [
    {
      id: 'c2-q1',
      prompt: 'Why does the student go to see the advisor?',
      options: [
        'To request a letter of recommendation for a summer programme',
        'To discuss the possibility of changing her major',
        'To register for the following semester',
        'To appeal a grade she received in economics',
      ],
      correct: 1,
    },
    {
      id: 'c2-q2',
      prompt: 'Why does the student think she might want to switch majors?',
      options: [
        'Her economics professors have been unhelpful',
        'She is failing the required intermediate courses',
        'An intro environmental science course captured her interest more than her economics courses',
        'She has decided to move to a different university',
      ],
      correct: 2,
    },
    {
      id: 'c2-q3',
      prompt: 'The advisor mentions the "reading the textbook for fun" observation primarily to',
      options: [
        'discourage the student from switching majors',
        'suggest that the observation is a useful, though not conclusive, sign of genuine interest',
        'illustrate a strict rule about when to change majors',
        'compare economics students to environmental science students',
      ],
      correct: 1,
    },
    {
      id: 'c2-q4',
      prompt: 'According to the advisor, what would be the likely practical cost of switching majors now?',
      options: [
        'The student would lose all credit for her previous courses',
        'The student would need to leave her current university',
        'The student would probably graduate one or two semesters later than planned',
        'The student would be required to complete a summer internship',
      ],
      correct: 2,
    },
    {
      id: 'c2-q5',
      prompt: 'What option does the advisor propose that would let the student explore environmental questions without extending her time at the university?',
      options: [
        'Taking a semester off to travel',
        'An environmental economics concentration within her existing major',
        'A double major in both fields',
        'Enrolling in online courses on environmental topics',
      ],
      correct: 1,
    },
    {
      id: 'c2-q6',
      prompt: 'Why does the advisor recommend waiting a week before completing the paperwork?',
      options: [
        'Because the university requires a waiting period for all major changes',
        'To give the student time to review the course list and talk to a professor in the field',
        'Because the advisor is unavailable for the rest of the week',
        'To allow the student to first raise her economics grades',
      ],
      correct: 1,
    },
  ],
};
