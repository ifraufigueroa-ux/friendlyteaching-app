// TOEFL Listening Conversation 3 — Mock 3
// Setting: student at the university writing center for help with a paper draft.

import type { TOEFLListeningAudio } from '@/types/toefl';

export const conversation3: TOEFLListeningAudio = {
  id:       'conv-3',
  type:     'conversation',
  title:    'Writing Center Consultation',
  subject:  'Campus life',
  speakers: [
    { id: 'student', name: 'Student' },
    { id: 'tutor',   name: 'Tutor' },
  ],
  script: [
    { speakerId: 'student', text:
      `Hi, I have a session booked for two o'clock — I think with you? My name is Anna.` },
    { speakerId: 'tutor', text:
      `Yes, hi Anna, come on in. So you signed up for a fifty-minute session about a paper draft, is that right?` },
    { speakerId: 'student', text:
      `Right. It's a five-page paper for my introduction to political theory course, and I have to hand it in on Thursday, so I'm hoping to fix whatever needs fixing before then.` },
    { speakerId: 'tutor', text:
      `Sure. Before we look at it, can you tell me a little about the assignment and what you're worried about?` },
    { speakerId: 'student', text:
      `Okay. The assignment is to take a specific concept from one of the philosophers we've read this semester and either defend it or critique it. I chose to critique Hobbes's idea of the social contract, and I feel like my argument is actually pretty solid — I just, when I read the paper back, it feels really disorganised. My professor mentioned in her feedback on our last paper that my writing tends to bury the main point.` },
    { speakerId: 'tutor', text:
      `Okay, that's really useful for me to know, because it tells me what to focus on. Organisation is something we can work on together in fifty minutes. Line-editing every sentence — we probably can't. So can we agree that we're not going to worry about individual word choices today, and just focus on structure?` },
    { speakerId: 'student', text:
      `Yes, that's fine. That's actually what I need most.` },
    { speakerId: 'tutor', text:
      `Great. So can you tell me, in one sentence, what your main argument is? Just from memory, without looking at the paper.` },
    { speakerId: 'student', text:
      `Uh — okay. That Hobbes's social contract assumes people are already capable of the kind of rational agreement that only exists in a society, which makes the whole idea kind of circular.` },
    { speakerId: 'tutor', text:
      `Great. Now let's look at your paper. Where in it does that sentence appear?` },
    { speakerId: 'student', text:
      `Let me check. It's… actually on page three. In the middle of the second paragraph on that page.` },
    { speakerId: 'tutor', text:
      `Right, and that's already telling us something. When your main argument doesn't appear until page three of a five-page paper, a reader is spending most of the paper trying to figure out where you're going. A very common fix — and it feels awkward the first time you do it — is to take that sentence, or a version of it, and put it near the end of your introduction. Then everything you write after can be read as evidence for that specific claim.` },
    { speakerId: 'student', text:
      `Oh. That's — yeah, I can see why my professor said things get buried. But if I say the whole argument in the intro, doesn't the reader lose interest?` },
    { speakerId: 'tutor', text:
      `That's a very common worry, especially from students who are used to writing narratively — for creative or personal writing where you save the reveal for the end. But in academic writing the convention is different, and it's helpful because your reader is often skimming for the argument first and then going back for the details. When they know the argument, your evidence lands more clearly.` },
    { speakerId: 'student', text:
      `Okay. So basically I move that sentence up, and then check that the paragraphs after it are actually supporting it in order.` },
    { speakerId: 'tutor', text:
      `Exactly. And if you find a paragraph that doesn't support the argument you just stated, that's a paragraph to either cut or rewrite. That's the second thing I'd have you do. Go paragraph by paragraph and ask, "does this paragraph help me prove my thesis?" If it doesn't, be honest with yourself about it. Interesting material that doesn't support your point is one of the hardest things to cut, but it usually needs to go.` },
    { speakerId: 'student', text:
      `Okay. I feel like I actually have something to work on now.` },
    { speakerId: 'tutor', text:
      `You do. I'd also encourage you to book a follow-up appointment for Wednesday if you can, once you've done a revised draft. We can look at it fresh and see whether the structural changes have solved the problem.` },
    { speakerId: 'student', text:
      `That would be perfect. Thank you.` },
  ],
  questions: [
    {
      id: 'c3-q1',
      prompt: 'Why has the student come to the writing centre?',
      options: [
        'To ask for an extension on a paper deadline',
        'To get help improving the structure of a paper before it is due',
        'To register for a semester-long writing workshop',
        'To pick up graded feedback from an earlier paper',
      ],
      correct: 1,
    },
    {
      id: 'c3-q2',
      prompt: 'Why does the tutor propose that they focus on structure rather than word choice?',
      options: [
        'Word-choice edits are the student\'s only weakness',
        'A fifty-minute session is not enough to line-edit an entire paper, and structure is what the student most needs help with',
        'The tutor is not permitted to comment on individual sentences',
        'Word choice does not affect academic writing',
      ],
      correct: 1,
    },
    {
      id: 'c3-q3',
      prompt: 'What does the tutor learn by asking the student to state her argument in one sentence?',
      options: [
        'That the student cannot articulate her argument at all',
        'That the student\'s clear thesis does not appear until page three of the paper',
        'That the argument does not match the assignment',
        'That the paper contains too many arguments',
      ],
      correct: 1,
    },
    {
      id: 'c3-q4',
      prompt: 'What is the tutor\'s main structural recommendation?',
      options: [
        'Add more paragraphs of background before stating the argument',
        'Move the main argument to the end of the introduction so that later paragraphs can be read as evidence',
        'Replace the argument with a different one that is easier to defend',
        'Convert the paper into a narrative essay',
      ],
      correct: 1,
    },
    {
      id: 'c3-q5',
      prompt: 'What does the tutor say about paragraphs that do not support the paper\'s main argument?',
      options: [
        'They should be moved to a footnote instead of cut',
        'They should be honestly evaluated and, if they do not support the thesis, cut or rewritten',
        'They should be kept if the material is interesting',
        'They should be replaced with quotations from the philosopher',
      ],
      correct: 1,
    },
    {
      id: 'c3-q6',
      prompt: 'What does the tutor suggest the student do after the session?',
      options: [
        'Submit the paper immediately without revising it',
        'Book a follow-up appointment for Wednesday to review the revised draft',
        'Ask her professor for permission to change her topic',
        'Rewrite the paper as a group assignment',
      ],
      correct: 1,
    },
  ],
};
