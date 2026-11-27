// FriendlyTeaching.cl — IELTS lessons catalog
//
// Same shape as the TOEFL catalog (src/lib/data/toefl-lessons/catalog.ts).
// Metadata for every IELTS prep lesson shipped as a standalone HTML
// under /public/ielts-lessons/<slug>.html. Audios are pre-baked via
// `scripts/bake-ielts-lesson.js <slug>` so students hear studio-quality
// ElevenLabs MP3s instead of browser SpeechSynthesis fallback.

export type IeltsSection = 'reading' | 'listening' | 'speaking' | 'writing' | 'intro';
export type IeltsLevel   = 'B1' | 'B2' | 'C1';

export interface DialogueTurn {
  role: string;
  text: string;
}

export interface IeltsLessonAudio {
  id:          string;          // cacheKey used by renderPlayer in the HTML
  storagePath: string;          // Firebase Storage path (also URL stem)
  text?:       string;          // single-voice
  voiceId?:    string;
  dialogue?:   DialogueTurn[];  // multi-voice — stitched
  roleVoices?: Record<string, string>;
}

export interface IeltsLesson {
  id:              string;      // slug → public/ielts-lessons/<id>.html
  title:           string;
  description:     string;
  section:         IeltsSection;
  level:           IeltsLevel;
  durationMinutes: number;
  publicPath:      string;      // "/ielts-lessons/<id>.html"
  tags?:           string[];
  audios?:         IeltsLessonAudio[];
  addedOn:         string;      // ISO
}

// Voices from the non-IELTS-saturated whitelist
// (memory: feedback-listening-names-voices). Avoid Sarah, Liam, Charlotte,
// Dorothy, Felix, Daniel — those are already all over the IELTS mocks.
export const IELTS_LESSON_VOICES = {
  // Teacher / coordinator / lecturer
  professor_male:    'nPczCjzI2devNBz1zQrb', // Brian — deep lecturing male US
  coordinator_male:  'IKne3meq5aSn9XLyUdCD', // Charlie — natural male AU (IELTS-flavoured)
  // Peer / student
  student_male:      'pNInz6obpgDQGcFmaJgB', // Adam — mature male US (TODO 2026-11-26: swap to Antoni ErXwobaYiN019PkySvjV — teacher feedback "plano/demo" — pending ElevenLabs quota refill + part-3 re-bake with storage path part-3-v2.mp3)
  student_female:    'jsCqWAovK2LkecY7zXl4', // Freya — young female US
  // Guide / adult female
  guide_female:      'XrExE9yKIg1WjnnlVkGX', // Matilda — warm female US
  applicant_female:  'cgSgspJ2msm6clMCkdW9', // Jessica — young expressive female US (teacher feedback 2026-11-26: Rachel sonaba robótica)
} as const;

export const IELTS_LESSONS: IeltsLesson[] = [
  {
    id:              'listening-intro',
    title:           'IELTS Listening · Introduction',
    description:     'Scaffolded walk-through of the IELTS Listening test: prediction, Part-1 form, Part-2 map, Part-3 academic discussion, Part-4 lecture, and 12 Band 7+ tips & tricks.',
    section:         'listening',
    level:           'B2',
    durationMinutes: 60,
    publicPath:      '/ielts-lessons/listening-intro.html',
    tags:            ['scaffolded', 'four-parts', 'tips-and-tricks', 'intro'],
    addedOn:         '2026-11-24',
    audios: [
      {
        id:          'test',
        storagePath: 'audio/ielts-lessons/listening-intro/test.mp3',
        voiceId:     IELTS_LESSON_VOICES.applicant_female,
        text:        "Hello! If you can hear me, your audio is working. Let's start.",
      },
      {
        id:          'part-1',
        // v2: re-baked 2026-11-26 with Jessica as Nadia (teacher feedback:
        // Rachel sonaba robótica). New filename busts the Storage
        // immutable-1yr cache so students pick up the new MP3 immediately.
        storagePath: 'audio/ielts-lessons/listening-intro/part-1-v2.mp3',
        roleVoices: {
          Coordinator: IELTS_LESSON_VOICES.coordinator_male,
          Nadia:       IELTS_LESSON_VOICES.applicant_female,
        },
        dialogue: [
          { role: 'Coordinator', text: 'Good morning, Hillview Community Garden. How can I help you?' },
          { role: 'Nadia',       text: "Hi, I'd like to sign up as a volunteer, please." },
          { role: 'Coordinator', text: "Lovely. I'll just take a few details. What's your first name?" },
          { role: 'Nadia',       text: "It's Nadia." },
          { role: 'Coordinator', text: 'And your surname?' },
          { role: 'Nadia',       text: "Keane. That's K, E, A, N, E." },
          { role: 'Coordinator', text: "Great. And what's your address?" },
          { role: 'Nadia',       text: '48 Oakfield Lane.' },
          { role: 'Coordinator', text: "So, that's four-eight? Not eighteen?" },
          { role: 'Nadia',       text: "That's right, forty-eight." },
          { role: 'Coordinator', text: 'And a contact number?' },
          { role: 'Nadia',       text: "Sure. It's oh seven, five double two, one four seven, oh three five." },
          { role: 'Coordinator', text: 'Thank you. Now, we have three volunteer levels. Casual is one Saturday a month — good for people who just want to help out occasionally. Weekend-only is Saturdays and Sundays, for people who work full-time. And regular is three sessions a week.' },
          { role: 'Nadia',       text: "Three sessions sounds about right. I'm looking for something I can commit to properly." },
          { role: 'Coordinator', text: "Perfect, so regular. That's around six hours a week." },
          { role: 'Coordinator', text: 'Now, which area would you like to work in? We have the vegetable beds, the herb garden, and composting.' },
          { role: 'Nadia',       text: "Hmm, I was going to say composting — but it might be a bit physical. Actually, could I do the herb garden? I've been reading about it." },
          { role: 'Coordinator', text: "Of course, the herb garden is open. And when would you like to start?" },
          { role: 'Nadia',       text: "Could I start on the fifth of March?" },
          { role: 'Coordinator', text: "Sorry, that week we're closed for mulching the main beds. The earliest would be the eighth." },
          { role: 'Nadia',       text: 'The eighth of March is fine.' },
          { role: 'Coordinator', text: "Perfect. One last thing — how did you hear about us? Was it on our website?" },
          { role: 'Nadia',       text: 'No, I saw a poster at the library.' },
        ],
      },
      {
        id:          'part-2',
        storagePath: 'audio/ielts-lessons/listening-intro/part-2.mp3',
        voiceId:     IELTS_LESSON_VOICES.guide_female,
        text:
          "Welcome to Greenfield Community Centre. Before we start the tour, let me explain where everything is. As you come through the main entrance, reception is straight ahead of you. " +
          "The café is on your left as you come in, right next to the entrance. It's a great place to meet friends. " +
          "If you walk past reception, you'll find the library. It's in the middle of the back wall, directly behind reception. " +
          "The computer room is just to the right of reception. It's open to everyone, but you need to book a computer in advance. " +
          "Our art studio is in the far left-hand corner, at the back of the building. It has lots of natural light. " +
          "Now, some of you may remember that the gym used to be in the top right-hand corner. Well, that room is now used for meetings, and the gym has moved. It's now next to the main entrance, on the right. " +
          "A few important points. The centre is open every day, but on Sundays we close early, at two o'clock instead of nine. And please remember that all visitors must sign in at reception when they arrive.",
      },
      {
        id:          'part-3',
        storagePath: 'audio/ielts-lessons/listening-intro/part-3.mp3',
        roleVoices: {
          Emma: IELTS_LESSON_VOICES.student_female,
          Tom:  IELTS_LESSON_VOICES.student_male,
        },
        dialogue: [
          { role: 'Emma', text: 'So, Tom, we need to choose a topic for our presentation. I was thinking about recycling at the university.' },
          { role: 'Tom',  text: "That's a good idea, but didn't the group before us do recycling last term?" },
          { role: 'Emma', text: "Oh, you're right. What about food waste in the canteen instead?" },
          { role: 'Tom',  text: 'I like that. There is a lot of information about it, and it affects every student.' },
          { role: 'Emma', text: 'Great. So how should we collect our data? I think an online survey would be the quickest way.' },
          { role: 'Tom',  text: "Maybe, but people often ignore online surveys. I'd rather watch the canteen for a few days and count how much food is thrown away." },
          { role: 'Emma', text: "Hmm, that would take longer, but the results would be more reliable. OK, let's do that." },
          { role: 'Tom',  text: "Now, who's going to make the slides? You're much better at design than me." },
          { role: 'Emma', text: "Fine, I'll design the slides. Could you write the introduction?" },
          { role: 'Tom',  text: "Sure. And I'll email the kitchen manager to ask for permission to watch the canteen." },
          { role: 'Emma', text: "Perfect. But we'll both present the results, OK?" },
          { role: 'Tom',  text: 'Of course. When is it due, by the way? The twentieth?' },
          { role: 'Emma', text: 'No, the tutor moved it to the twenty-seventh, remember?' },
        ],
      },
      {
        id:          'part-4',
        storagePath: 'audio/ielts-lessons/listening-intro/part-4.mp3',
        voiceId:     IELTS_LESSON_VOICES.professor_male,
        text:
          "Good morning, everyone. Today I'm going to talk about the history of the bicycle. First, I'll look at the early designs. Then I'll discuss how the bicycle changed society. And finally, I'll consider its future in our cities. " +
          "Let's start with the early designs. The first machine that looked like a bicycle appeared in Germany in 1817. It had two wheels but no pedals, so riders had to push it along the ground with their feet. It was made almost completely of wood. " +
          "In the 1870s, the high-wheeler became popular. Its front wheel was extremely large, which made it fast, but also quite dangerous. Riders often fell forward over the handlebars. " +
          "The big change came in the 1880s with the safety bicycle. It had two wheels of the same size, and a chain that connected the pedals to the back wheel. This is basically the design we still use today. " +
          "Moving on to the bicycle's effect on society. First of all, it gave ordinary workers a cheap way to travel, so they could live further away from the factories where they worked. It also had a huge effect on women's freedom. Women could travel on their own, and it even changed fashion, because long skirts were replaced by more practical clothes. " +
          "Finally, let's turn to the future. Many cities are now building protected bike lanes, and electric bikes are making cycling possible for older people and for people who live in hilly areas. However, the main challenge is still safety. Many people are afraid of cycling in heavy traffic. " +
          "So, to sum up, the bicycle has a long history, and it may play an even bigger role in the cities of the future.",
      },
    ],
  },
];

export function findIeltsLesson(id: string): IeltsLesson | undefined {
  return IELTS_LESSONS.find(l => l.id === id);
}

export const IELTS_SECTION_LABELS: Record<IeltsSection, string> = {
  reading:   'Reading',
  listening: 'Listening',
  speaking:  'Speaking',
  writing:   'Writing',
  intro:     'Introduction',
};
