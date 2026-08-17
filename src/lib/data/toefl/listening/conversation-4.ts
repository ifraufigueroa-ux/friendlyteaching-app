// TOEFL Listening Conversation 4 — Mock 4
// Setting: student meets a career-services counsellor about summer internships.

import type { TOEFLListeningAudio } from '@/types/toefl';

export const conversation4: TOEFLListeningAudio = {
  id:       'conv-4',
  type:     'conversation',
  title:    'Talking Through Summer Internships',
  subject:  'Career services',
  speakers: [
    { id: 'student',    name: 'Student' },
    { id: 'counsellor', name: 'Counsellor' },
  ],
  script: [
    { speakerId: 'student', text:
      `Hi, I'm here for a fifteen-minute drop-in. I'm a second-year mechanical engineering student and I'm trying to figure out what to do with my summer, and I honestly don't know where to start.` },
    { speakerId: 'counsellor', text:
      `Great, come on in. Fifteen minutes is enough to give you some direction, and if we need more time we can book a longer session. What have you already thought about, even loosely?` },
    { speakerId: 'student', text:
      `Well, I know there are internships. My roommate applied for a bunch of them last year and got one at an automotive company. But she started applying in October and I feel like I'm already behind, because it's February now.` },
    { speakerId: 'counsellor', text:
      `You're not too late for everything, but you're right that a lot of the largest, most competitive programmes — the automotive companies, the aerospace firms, the major consumer-electronics manufacturers — closed their applications in the winter. Those are the ones with the biggest recruiting pipelines and the earliest deadlines. There is still a lot open, though. Different categories of employer recruit on different schedules.` },
    { speakerId: 'student', text:
      `That's actually the part I don't understand. What are the other categories?` },
    { speakerId: 'counsellor', text:
      `Okay, so broadly there are three: large corporate programmes, smaller firms and start-ups, and research or lab-based positions. Large corporate: those are the ones you already know about, and yes, most of them are closed for the summer. Smaller firms and start-ups typically recruit closer to the summer itself — some don't post a role until March or April, because they can't plan that far ahead. And research positions in university labs often aren't advertised in the usual sense at all. You have to email the professor whose work interests you and ask if they need someone for the summer.` },
    { speakerId: 'student', text:
      `Oh, I didn't know that was even a thing. Do professors actually respond to those emails?` },
    { speakerId: 'counsellor', text:
      `More often than you'd think, especially if the email is short, specific, and shows you've actually read some of their work. I'd say a third of second-year engineering students who go the research route in the summer end up placing that way. But there's a real technique to writing that email, and I'd strongly recommend booking a longer session before you send any of them — I can look at drafts.` },
    { speakerId: 'student', text:
      `Okay. And in the meantime, for the smaller-firm option?` },
    { speakerId: 'counsellor', text:
      `Two things. First, keep an eye on our internal job board — it updates weekly, and small firms who post there are actively hiring within a short window. Second — this is going to sound obvious — talk to older students. Third and fourth years who worked at smaller companies last summer often have contacts, and small firms hire a disproportionate share of interns through referrals.` },
    { speakerId: 'student', text:
      `That's a good point. My advisor also mentioned there's a career fair in three weeks — is that useful for someone at my stage?` },
    { speakerId: 'counsellor', text:
      `Very useful. Especially the smaller companies with booths — those are precisely the ones that don't run a rigid recruitment schedule. A five-minute conversation at a career fair can turn into an interview in a way that a cold application usually doesn't. I'd say prioritise that fair, prepare a short version of what you want to work on this summer, and bring printed copies of your CV.` },
    { speakerId: 'student', text:
      `Okay. This is more actionable than I thought. Should I book that longer session with you now?` },
    { speakerId: 'counsellor', text:
      `Yes, let's do that. Bring your CV in whatever state it's in, and a rough list of five to ten professors whose research you'd want to work on. We can go from there.` },
  ],
  questions: [
    {
      id: 'c4-q1',
      prompt: 'Why has the student come to career services?',
      options: [
        'To apply for a position that has already been offered to him',
        'To pick up a printed copy of his transcript',
        'To get direction on how to find a summer internship',
        'To complain about the deadlines set by the university',
      ],
      correct: 2,
    },
    {
      id: 'c4-q2',
      prompt: 'Why has the student missed many of the biggest corporate internship deadlines?',
      options: [
        'His grades are not high enough for those programmes',
        'The largest corporate programmes generally close their applications in the winter, before the student has begun searching',
        'His university does not participate in those programmes',
        'He was rejected from all of them in a previous cycle',
      ],
      correct: 1,
    },
    {
      id: 'c4-q3',
      prompt: 'According to the counsellor, how are research positions in university labs typically obtained?',
      options: [
        'Through applications posted on the career-services job board',
        'By emailing the professor whose work interests you and asking if they need a summer assistant',
        'By attending large career fairs organised by the science faculty',
        'By waiting for professors to invite students directly',
      ],
      correct: 1,
    },
    {
      id: 'c4-q4',
      prompt: 'Why does the counsellor recommend booking a longer session before sending emails to professors?',
      options: [
        'The counsellor needs written permission to review any communication with professors',
        'There is a specific technique to writing effective outreach emails, and the counsellor can review drafts',
        'The university requires such emails to be pre-approved',
        'To make sure the student contacts only professors in his own department',
      ],
      correct: 1,
    },
    {
      id: 'c4-q5',
      prompt: 'What does the counsellor say about small firms and start-ups?',
      options: [
        'They rarely hire summer interns',
        'They tend to recruit closer to the summer and often hire through referrals from other students',
        'They only accept students recommended by their professors',
        'They post all their positions on national job boards',
      ],
      correct: 1,
    },
    {
      id: 'c4-q6',
      prompt: 'Why does the counsellor recommend that the student prioritise the upcoming career fair?',
      options: [
        'Because larger companies interview and hire on the spot only at career fairs',
        'Because small companies with less rigid schedules often attend, and a brief conversation can lead directly to an interview',
        'Because attendance at the fair is required for engineering students',
        'Because the fair offers cash prizes for the best CVs',
      ],
      correct: 1,
    },
  ],
};
