// TOEFL Listening Lecture 2 — Mock 2 (Psychology)
// Subject: memory consolidation during sleep. ~5 min audio when TTS'd.

import type { TOEFLListeningAudio } from '@/types/toefl';

export const lecture2: TOEFLListeningAudio = {
  id:       'lecture-2',
  type:     'lecture',
  title:    'Memory Consolidation During Sleep',
  subject:  'Psychology',
  speakers: [
    { id: 'prof', name: 'Professor' },
  ],
  script: [
    { speakerId: 'prof', text:
      `Today I want to pick up where we left off last week and talk about what actually happens to a memory after you form it. Because — and this is one of those ideas that sounds obvious once you say it, but really wasn't obvious historically — encoding a memory and keeping a memory are two very different processes. You can perfectly encode something at, say, three in the afternoon, and if the right things don't happen between then and, say, tomorrow morning, that memory is going to be significantly less accessible, and in some cases essentially gone.` },
    { speakerId: 'prof', text:
      `The process that stabilises a newly formed memory is called consolidation, and one of the most productive research areas in the last twenty or thirty years has been the finding that consolidation depends heavily on sleep. Now, when we say "depends heavily on sleep," we don't mean that you can't remember anything if you don't sleep — obviously people who pull all-nighters can retain some information. What we mean is that memories that are followed by a night of good sleep are, on average, more accurately recalled, more robustly stored, and better integrated with other knowledge than the same memories followed by a period of wakefulness of the same length.` },
    { speakerId: 'prof', text:
      `The classic experimental design here goes something like this. You teach two groups of participants the same list of word pairs — for example, apple-forest, table-lightning, that kind of thing. One group learns the list in the morning and is tested twelve hours later, in the evening, having been awake the whole time. The other group learns the list in the evening and is tested twelve hours later, in the morning, having slept. The interval is the same. The material is the same. But the group that slept typically remembers about twenty to thirty percent more of the pairs. This basic finding has been replicated many times and with many kinds of material.` },
    { speakerId: 'prof', text:
      `What is happening during sleep that produces this benefit? A lot, it turns out. Sleep is not one homogeneous state; it's a sequence of stages that cycle through the night, and different stages appear to consolidate different kinds of memory. Slow-wave sleep — the deep, dreamless sleep that dominates the early part of the night — appears especially important for what we call declarative memory: facts, events, word pairs, the sorts of things you can consciously report. REM sleep — the stage associated with vivid dreaming, which dominates the latter part of the night — seems more important for procedural memories, motor skills, and, interestingly, for the emotional processing of memories.` },
    { speakerId: 'prof', text:
      `The neural mechanism, at least for declarative memory, involves a kind of dialogue between two brain structures — the hippocampus, which is where new declarative memories are first stored, and the neocortex, which is where they eventually reside long-term. During slow-wave sleep, patterns of activity that were present in the hippocampus during learning are, in effect, replayed. And this replay appears to strengthen the connections in the cortex that will eventually take over storage of the memory. So we're not just resting the system; we're actively transferring information between structures.` },
    { speakerId: 'prof', text:
      `One implication of all this — and this is where you can probably see the practical relevance — is that pulling an all-nighter to cram for an exam is, from a neuroscience standpoint, one of the least efficient things you can do. You may increase the amount of material you're exposed to in that window, but by skipping the sleep that would consolidate what you already know, you're likely reducing your long-term retention of everything you studied that week. The evidence for this is now pretty strong. And for skill-based learning — say, a musical instrument or a sport — the effect of sleep may be even larger; performance on a motor task is often better the morning after practice than it was at the end of the practice session itself.` },
  ],
  questions: [
    {
      id: 'l2-q1',
      prompt: 'What is the lecture mainly about?',
      options: [
        'The difference between sleep in humans and other animals',
        'Why some people need more sleep than others',
        'The role of sleep in stabilising newly formed memories',
        'Techniques for improving initial memory encoding',
      ],
      correct: 2,
    },
    {
      id: 'l2-q2',
      prompt: 'What is memory consolidation, as the professor uses the term?',
      options: [
        'The initial encoding of a memory when it is first learned',
        'The process by which newly formed memories are stabilised over time',
        'The confusion of two similar memories with each other',
        'The retrieval of a memory during recall',
      ],
      correct: 1,
    },
    {
      id: 'l2-q3',
      prompt: 'In the classic experiment described, why is the twelve-hour interval used for both groups?',
      options: [
        'To ensure that the amount of time between learning and testing is the same, so that any difference must come from sleep versus wakefulness',
        'Because most declarative memories decay after twelve hours',
        'To match the natural length of one sleep cycle',
        'Because participants can only stay awake for that long',
      ],
      correct: 0,
    },
    {
      id: 'l2-q4',
      prompt: 'According to the professor, which stage of sleep is most important for declarative memories such as facts and word pairs?',
      options: [
        'Light sleep just before waking',
        'REM sleep, which is associated with vivid dreaming',
        'Slow-wave sleep, which dominates the early part of the night',
        'Micro-sleeps during the day',
      ],
      correct: 2,
    },
    {
      id: 'l2-q5',
      prompt: 'The professor describes a "dialogue" between the hippocampus and the neocortex during sleep. What does this dialogue accomplish?',
      options: [
        'It erases memories that are no longer useful',
        'It replays learning-related activity to strengthen cortical connections for long-term storage',
        'It transfers procedural memories into declarative form',
        'It suppresses dreaming so that consolidation can occur undisturbed',
      ],
      correct: 1,
    },
    {
      id: 'l2-q6',
      prompt: 'What practical conclusion does the professor draw from the research on sleep and memory?',
      options: [
        'Students should study only in the morning',
        'Pulling an all-nighter is one of the least efficient ways to prepare for an exam because it skips consolidation',
        'Motor skills cannot be improved once practice has ended',
        'Memory research has few practical implications',
      ],
      correct: 1,
    },
  ],
};
