// FriendlyTeaching.cl — Regenerate clip_controlled_practice using the
// template-first algorithm (v2, August 2026).
//
// Prior versions scraped raw dialogue lines and produced garbage items
// (`{{blank}}` leaks, `strategist` as a base verb, etc.). This mirrors
// the rewritten TS builder in src/lib/utils/clipLessonGenerator.ts so
// existing lessons get the same quality as freshly-generated ones.
//
// Usage:
//   node scripts/regenerate-clip-practice-v2.js         # dry run
//   node scripts/regenerate-clip-practice-v2.js --apply # write

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const APPLY = process.argv.includes('--apply');

initAdmin();
const db = getFirestore();

// ─── Focus resolution (same as previous script) ───────────────────────

const FOCI = [
  { test: /\b(would|could|might|may)\b/i,        name: 'Modals of possibility',    short: 'modals' },
  { test: /\b(have|has)\s+(been|got|had|done|made|seen|gone|come)/i,
                                                 name: 'Present perfect',           short: 'present-perfect' },
  { test: /\bgoing to\b/i,                       name: 'Future with "going to"',    short: 'be-going-to' },
  { test: /\bif\b.+\b(would|will)\b/i,           name: 'Conditionals',              short: 'conditionals' },
  { test: /\b(was|were)\s+\w+ing\b/i,            name: 'Past continuous',           short: 'past-continuous' },
  { test: /\b(said|told|asked)\b.+\b(that|to)\b/i, name: 'Reported speech',         short: 'reported-speech' },
];
const DEFAULT_FOCUS = { name: 'Past simple', short: 'past-simple' };

function detectFocus(dialogue) {
  for (const f of FOCI) if (f.test.test(dialogue)) return { name: f.name, short: f.short };
  return DEFAULT_FOCUS;
}

function cleanGrammarName(raw) {
  if (!raw) return null;
  return raw
    .replace(/^\s*language\s*focus\s*:\s*/i, '')
    .replace(/^\s*language\s*awareness\s*[—-]\s*/i, '')
    .replace(/^\s*language\s*focus\s*[—-]\s*/i, '')
    .trim();
}

// Returns a bank key if the grammar name maps to a known template set,
// otherwise null so the caller falls back to NEUTRAL_BANK. Never guess
// past-simple for custom labels — that would produce simple past
// templates while the header says something like "Passive Voice".
function guessShort(name) {
  if (!name) return null;
  const s = name.toLowerCase();
  if (s.includes('past perfect'))    return 'past-perfect';
  if (s.includes('present perfect')) return 'present-perfect';
  if (s.includes('past continuous')) return 'past-continuous';
  if (s.includes('past simple'))     return 'past-simple';
  if (s.includes('second') && s.includes('conditional')) return 'second-conditional';
  if (s.includes('first') && s.includes('conditional'))  return 'first-conditional';
  if (s.includes('conditional'))     return 'first-conditional';
  if (s.includes('reported'))        return 'reported-speech';
  if (s.includes('going to'))        return 'be-going-to';
  if (s.includes('future') || s.includes('will')) return 'future-forms';
  if (s.includes('modal'))           return 'modals';
  return null;
}

function resolveFocus(languageFocusTitle, practiceSubtitle, dialogue) {
  const fromLang = cleanGrammarName(languageFocusTitle);
  if (fromLang && fromLang.length > 2) return { name: fromLang, short: guessShort(fromLang) };
  const fromSub = cleanGrammarName(practiceSubtitle);
  if (fromSub && fromSub.length > 2 && !fromSub.endsWith('.')) return { name: fromSub, short: guessShort(fromSub) };
  return detectFocus(dialogue);
}

// ─── Shared helpers ───────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sanitize(text) {
  return text
    .replace(/\{\{\s*blank\s*\}\}/gi, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/_{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const COMMON_START_WORDS = new Set([
  'The','A','An','I','You','He','She','It','We','They','My','Your','His','Her',
  'What','Who','Why','How','When','Where','Which',
  'That','This','These','Those',
  'Yes','No','Well','Okay','But','And','Or','So','Now','Then','Yeah',
  'Look','Listen','Watch','Hey',
]);

function extractName(dialogue) {
  const counts = new Map();
  const words = dialogue.match(/\b([A-Z][a-zA-Z]{2,})\b/g) ?? [];
  for (const w of words) {
    if (COMMON_START_WORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  let best = null, bestCount = 1;
  for (const [w, c] of counts) {
    if (c > bestCount) { best = w; bestCount = c; }
  }
  return bestCount >= 2 ? best : null;
}

function personalizeTemplate(t, name) {
  if (!name) return t;
  const swap = s => s.replace(/^He\b/, name).replace(/^She\b/, name);
  return { ...t, sentence: swap(t.sentence), wrongVersion: swap(t.wrongVersion) };
}

// ─── Grammar bank (mirror of clipLessonGenerator.ts) ──────────────────

const BANK = {
  'past-perfect': {
    templates: [
      { sentence: 'By the time the meeting ended, everyone had left the office.',   targetForm: 'had left', baseVerb: 'leave', wrongForms: ['left', 'has left', 'was leaving'], wrongVersion: 'By the time the meeting ended, everyone left the office.', splitAt: 7 },
      { sentence: 'She realized she had forgotten her keys at home.',                targetForm: 'had forgotten', baseVerb: 'forget', wrongForms: ['forgot', 'has forgotten', 'was forgetting'], wrongVersion: 'She realized she forgot her keys at home.', splitAt: 3 },
      { sentence: 'When we arrived, the film had already started.',                  targetForm: 'had already started', baseVerb: 'start', wrongForms: ['already started', 'has already started', 'was already starting'], wrongVersion: 'When we arrived, the film already started.', splitAt: 3 },
      { sentence: 'By the age of twenty, she had written her first novel.',          targetForm: 'had written', baseVerb: 'write', wrongForms: ['wrote', 'has written', 'was writing'], wrongVersion: 'By the age of twenty, she wrote her first novel.', splitAt: 6 },
      { sentence: 'Before the storm hit, the villagers had already left the coast.', targetForm: 'had already left', baseVerb: 'leave', wrongForms: ['already left', 'has already left', 'were already leaving'], wrongVersion: 'Before the storm hit, the villagers already left the coast.', splitAt: 4 },
      { sentence: 'He had never travelled abroad before he turned thirty.',          targetForm: 'had never travelled', baseVerb: 'travel', wrongForms: ['never travelled', 'has never travelled', 'was never travelling'], wrongVersion: 'He never travelled abroad before he turned thirty.', splitAt: 4 },
    ],
    mcDistractors: ['She left the office before the meeting ended.', 'He forgets his keys every morning.', 'They were writing the report last week.'],
    openStem: 'By the time I got home, I ',
  },
  'past-simple': {
    templates: [
      { sentence: 'Yesterday she walked to work in the rain.',                targetForm: 'walked', baseVerb: 'walk', wrongForms: ['walks', 'walking', 'was walking'], wrongVersion: 'Yesterday she walks to work in the rain.', splitAt: 3 },
      { sentence: 'They finished the project last Friday afternoon.',         targetForm: 'finished', baseVerb: 'finish', wrongForms: ['finish', 'were finishing', 'have finished'], wrongVersion: 'They finish the project last Friday afternoon.', splitAt: 2 },
      { sentence: 'We went to the cinema together on Saturday.',              targetForm: 'went', baseVerb: 'go', wrongForms: ['go', 'going', 'have gone'], wrongVersion: 'We go to the cinema together on Saturday.', splitAt: 3 },
      { sentence: 'He wrote the letter before the sun came up.',              targetForm: 'wrote', baseVerb: 'write', wrongForms: ['writes', 'was writing', 'has written'], wrongVersion: 'He writes the letter before the sun came up.', splitAt: 4 },
      { sentence: 'The children played in the yard until it got dark.',       targetForm: 'played', baseVerb: 'play', wrongForms: ['play', 'were playing', 'have played'], wrongVersion: 'The children play in the yard until it got dark.', splitAt: 4 },
      { sentence: 'She spoke to the manager about the mistake.',              targetForm: 'spoke', baseVerb: 'speak', wrongForms: ['speaks', 'was speaking', 'has spoken'], wrongVersion: 'She speaks to the manager about the mistake.', splitAt: 3 },
    ],
    mcDistractors: ['She was walk to work every day.', 'They has finish the project last week.', 'We goes to the cinema on Saturday.'],
    openStem: 'Yesterday I ',
  },
  'present-perfect': {
    templates: [
      { sentence: 'She has lived in this city for ten years.',                     targetForm: 'has lived', baseVerb: 'live', wrongForms: ['lived', 'lives', 'is living'], wrongVersion: 'She lived in this city for ten years.', splitAt: 3 },
      { sentence: 'They have already finished the report.',                         targetForm: 'have already finished', baseVerb: 'finish', wrongForms: ['already finished', 'were already finishing', 'already finish'], wrongVersion: 'They already finished the report.', splitAt: 2 },
      { sentence: 'I have never seen a film that scary before.',                    targetForm: 'have never seen', baseVerb: 'see', wrongForms: ['never saw', 'never see', 'was never seeing'], wrongVersion: 'I never saw a film that scary before.', splitAt: 4 },
      { sentence: 'We have known each other since we were children.',               targetForm: 'have known', baseVerb: 'know', wrongForms: ['knew', 'know', 'were knowing'], wrongVersion: 'We knew each other since we were children.', splitAt: 3 },
      { sentence: 'He has just left the building through the back door.',           targetForm: 'has just left', baseVerb: 'leave', wrongForms: ['just left', 'was just leaving', 'just leaves'], wrongVersion: 'He just leaves the building through the back door.', splitAt: 4 },
      { sentence: 'The team has worked on this design for months.',                 targetForm: 'has worked', baseVerb: 'work', wrongForms: ['worked', 'was working', 'works'], wrongVersion: 'The team worked on this design for months.', splitAt: 3 },
    ],
    mcDistractors: ['She lived in this city ten years ago.', 'They was finishing the report yesterday.', 'I saw a film that scary last night.'],
    openStem: 'I have ',
  },
  'past-continuous': {
    templates: [
      { sentence: 'I was reading in bed when the phone rang.',                   targetForm: 'was reading', baseVerb: 'read', wrongForms: ['read', 'have read', 'reads'], wrongVersion: 'I read in bed when the phone rang.', splitAt: 4 },
      { sentence: 'They were watching the game while it rained outside.',         targetForm: 'were watching', baseVerb: 'watch', wrongForms: ['watched', 'have watched', 'were watch'], wrongVersion: 'They watched the game while it rained outside.', splitAt: 3 },
      { sentence: 'She was cooking dinner when the guests arrived.',              targetForm: 'was cooking', baseVerb: 'cook', wrongForms: ['cooked', 'has cooked', 'cooks'], wrongVersion: 'She cooked dinner when the guests arrived.', splitAt: 3 },
      { sentence: 'We were driving down the coast when we saw the whale.',        targetForm: 'were driving', baseVerb: 'drive', wrongForms: ['drove', 'have driven', 'drives'], wrongVersion: 'We drove down the coast when we saw the whale.', splitAt: 3 },
      { sentence: 'The kids were playing outside while I finished the emails.',   targetForm: 'were playing', baseVerb: 'play', wrongForms: ['played', 'have played', 'plays'], wrongVersion: 'The kids played outside while I finished the emails.', splitAt: 3 },
      { sentence: 'He was talking on the phone when the door opened.',            targetForm: 'was talking', baseVerb: 'talk', wrongForms: ['talked', 'has talked', 'talks'], wrongVersion: 'He talked on the phone when the door opened.', splitAt: 3 },
    ],
    mcDistractors: ['I read in bed when the phone rang.', 'They watched the game while rain outside.', 'She cook dinner when the guests arrived.'],
    openStem: 'While I was walking home, ',
  },
  'modals': {
    templates: [
      { sentence: 'She might come to the meeting later this afternoon.',          targetForm: 'might come', baseVerb: 'come', wrongForms: ['might comes', 'might came', 'might coming'], wrongVersion: 'She might comes to the meeting later this afternoon.', splitAt: 3 },
      { sentence: 'You could try the new restaurant on Main Street.',              targetForm: 'could try', baseVerb: 'try', wrongForms: ['could tries', 'could tried', 'could trying'], wrongVersion: 'You could tried the new restaurant on Main Street.', splitAt: 3 },
      { sentence: 'They may need more time to finish the report.',                 targetForm: 'may need', baseVerb: 'need', wrongForms: ['may needs', 'may needed', 'may needing'], wrongVersion: 'They may needs more time to finish the report.', splitAt: 3 },
      { sentence: 'We should leave now if we want to catch the train.',            targetForm: 'should leave', baseVerb: 'leave', wrongForms: ['should leaves', 'should left', 'should leaving'], wrongVersion: 'We should left now if we want to catch the train.', splitAt: 3 },
      { sentence: 'He might not agree with the plan at first.',                    targetForm: 'might not agree', baseVerb: 'agree', wrongForms: ['might not agrees', 'might not agreed', 'might not agreeing'], wrongVersion: 'He might not agrees with the plan at first.', splitAt: 4 },
      { sentence: 'You should tell her the truth before it is too late.',          targetForm: 'should tell', baseVerb: 'tell', wrongForms: ['should tells', 'should told', 'should telling'], wrongVersion: 'You should told her the truth before it is too late.', splitAt: 3 },
    ],
    mcDistractors: ['She might comes to the meeting later.', 'You could tried the new restaurant.', 'They may needs more time.'],
    openStem: 'If I had more time, I might ',
  },
  'be-going-to': {
    templates: [
      { sentence: 'I am going to call her after the meeting ends.',                targetForm: 'am going to call', baseVerb: 'call', wrongForms: ['going to call', 'am going call', 'am going to calling'], wrongVersion: 'I going to call her after the meeting ends.', splitAt: 5 },
      { sentence: 'She is going to travel to Japan next spring.',                  targetForm: 'is going to travel', baseVerb: 'travel', wrongForms: ['going to travel', 'is going travel', 'is going to travels'], wrongVersion: 'She going to travel to Japan next spring.', splitAt: 4 },
      { sentence: 'They are going to move to a new office next month.',            targetForm: 'are going to move', baseVerb: 'move', wrongForms: ['going to move', 'are going move', 'are going to moves'], wrongVersion: 'They going to move to a new office next month.', splitAt: 5 },
      { sentence: 'We are going to watch the sunset from the rooftop.',            targetForm: 'are going to watch', baseVerb: 'watch', wrongForms: ['going to watch', 'are going watch', 'are going to watches'], wrongVersion: 'We going to watch the sunset from the rooftop.', splitAt: 5 },
      { sentence: 'He is going to start his own company after graduation.',        targetForm: 'is going to start', baseVerb: 'start', wrongForms: ['going to start', 'is going start', 'is going to starts'], wrongVersion: 'He going to start his own company after graduation.', splitAt: 4 },
      { sentence: 'You are going to love the new season of the show.',             targetForm: 'are going to love', baseVerb: 'love', wrongForms: ['going to love', 'are going love', 'are going to loves'], wrongVersion: 'You going to love the new season of the show.', splitAt: 5 },
    ],
    mcDistractors: ['I calling her after the meeting.', 'She travels to Japan next spring.', 'They move to a new office next month.'],
    openStem: 'Next weekend I am going to ',
  },
  'future-forms': {
    templates: [
      { sentence: 'I think it will rain tomorrow afternoon.',                        targetForm: 'will rain', baseVerb: 'rain', wrongForms: ['will rains', 'will rained', 'will raining'], wrongVersion: 'I think it will rains tomorrow afternoon.', splitAt: 3 },
      { sentence: 'She will finish the report before the weekend.',                   targetForm: 'will finish', baseVerb: 'finish', wrongForms: ['will finishes', 'will finished', 'will finishing'], wrongVersion: 'She will finishes the report before the weekend.', splitAt: 2 },
      { sentence: 'Next week I am flying to Buenos Aires for a conference.',           targetForm: 'am flying', baseVerb: 'fly', wrongForms: ['fly', 'will fly', 'was flying'], wrongVersion: 'Next week I fly to Buenos Aires for a conference.', splitAt: 4 },
      { sentence: 'They will probably arrive around eight tonight.',                   targetForm: 'will probably arrive', baseVerb: 'arrive', wrongForms: ['probably arrives', 'will probably arrived', 'probably will arrives'], wrongVersion: 'They probably arrive around eight tonight.', splitAt: 3 },
      { sentence: 'She is meeting the client at nine tomorrow.',                       targetForm: 'is meeting', baseVerb: 'meet', wrongForms: ['meet', 'will meet', 'was meeting'], wrongVersion: 'She meet the client at nine tomorrow.', splitAt: 2 },
      { sentence: 'We will let you know as soon as we decide.',                        targetForm: 'will let', baseVerb: 'let', wrongForms: ['will lets', 'will letting', 'will letted'], wrongVersion: 'We will letting you know as soon as we decide.', splitAt: 2 },
    ],
    mcDistractors: ['I think it rains tomorrow afternoon.', 'She finishes the report before the weekend last year.', 'They probably arrived around eight tomorrow.'],
    openStem: 'Next month I ',
  },
  'first-conditional': {
    templates: [
      { sentence: 'If it rains tomorrow, we will stay indoors all day.',              targetForm: 'will stay', baseVerb: 'stay', wrongForms: ['stayed', 'would stay', 'stays'], wrongVersion: 'If it rains tomorrow, we would stay indoors all day.', splitAt: 4 },
      { sentence: 'If she calls back, I will let you know right away.',                targetForm: 'will let', baseVerb: 'let', wrongForms: ['would let', 'let', 'lets'], wrongVersion: 'If she calls back, I would let you know right away.', splitAt: 5 },
      { sentence: 'If you miss the bus, you will have to walk.',                       targetForm: 'will have', baseVerb: 'have', wrongForms: ['would have', 'have', 'has'], wrongVersion: 'If you miss the bus, you would have to walk.', splitAt: 5 },
      { sentence: 'If they arrive early, we will start the meeting on time.',          targetForm: 'will start', baseVerb: 'start', wrongForms: ['started', 'would start', 'starts'], wrongVersion: 'If they arrive early, we would start the meeting on time.', splitAt: 4 },
      { sentence: 'If I finish the report tonight, I will send it by morning.',        targetForm: 'will send', baseVerb: 'send', wrongForms: ['would send', 'sent', 'sends'], wrongVersion: 'If I finish the report tonight, I would send it by morning.', splitAt: 6 },
      { sentence: 'If the traffic is bad, we will take the metro instead.',            targetForm: 'will take', baseVerb: 'take', wrongForms: ['would take', 'took', 'takes'], wrongVersion: 'If the traffic is bad, we would take the metro instead.', splitAt: 5 },
    ],
    mcDistractors: ['If it will rain tomorrow, we stay indoors.', 'If she will call back, I let you know.', 'If you would miss the bus, you had to walk.'],
    openStem: 'If it rains tomorrow, ',
  },
  'second-conditional': {
    templates: [
      { sentence: 'If I were you, I would speak to her directly.',                    targetForm: 'would speak', baseVerb: 'speak', wrongForms: ['will speak', 'spoke', 'speaks'], wrongVersion: 'If I was you, I will speak to her directly.', splitAt: 5 },
      { sentence: 'If she had more time, she would travel the world.',                 targetForm: 'would travel', baseVerb: 'travel', wrongForms: ['will travel', 'travelled', 'travels'], wrongVersion: 'If she had more time, she will travel the world.', splitAt: 5 },
      { sentence: 'If we lived closer, we would visit them every weekend.',            targetForm: 'would visit', baseVerb: 'visit', wrongForms: ['will visit', 'visited', 'visits'], wrongVersion: 'If we lived closer, we will visit them every weekend.', splitAt: 5 },
      { sentence: 'If they knew the truth, they would react very differently.',        targetForm: 'would react', baseVerb: 'react', wrongForms: ['will react', 'reacted', 'reacts'], wrongVersion: 'If they knew the truth, they will react very differently.', splitAt: 5 },
      { sentence: 'If I had a second chance, I would say yes without hesitating.',     targetForm: 'would say', baseVerb: 'say', wrongForms: ['will say', 'said', 'says'], wrongVersion: 'If I had a second chance, I will say yes without hesitating.', splitAt: 6 },
      { sentence: 'If he studied more, he would pass the exam easily.',                targetForm: 'would pass', baseVerb: 'pass', wrongForms: ['will pass', 'passed', 'passes'], wrongVersion: 'If he studied more, he will pass the exam easily.', splitAt: 5 },
    ],
    mcDistractors: ['If I am you, I will speak to her.', 'If she has more time, she will travel.', 'If we live closer, we visit them every weekend.'],
    openStem: 'If I were you, I would ',
  },
  'reported-speech': {
    templates: [
      { sentence: 'She said that she would call me the next day.',                    targetForm: 'would call', baseVerb: 'call', wrongForms: ['will call', 'called', 'calls'], wrongVersion: 'She said that she will call me the next day.', splitAt: 5 },
      { sentence: 'He told them he had already spoken to the manager.',                targetForm: 'had already spoken', baseVerb: 'speak', wrongForms: ['already spoke', 'has already spoken', 'was already speaking'], wrongVersion: 'He told them he has already spoken to the manager.', splitAt: 4 },
      { sentence: 'They asked if I knew the way to the station.',                     targetForm: 'knew', baseVerb: 'know', wrongForms: ['know', 'have known', 'was knowing'], wrongVersion: 'They asked if I know the way to the station.', splitAt: 4 },
      { sentence: 'She told me she was leaving the following morning.',                targetForm: 'was leaving', baseVerb: 'leave', wrongForms: ['is leaving', 'left', 'leaves'], wrongVersion: 'She told me she is leaving the following morning.', splitAt: 4 },
      { sentence: 'He said he would meet us at the entrance.',                         targetForm: 'would meet', baseVerb: 'meet', wrongForms: ['will meet', 'met', 'meets'], wrongVersion: 'He said he will meet us at the entrance.', splitAt: 3 },
      { sentence: 'They said they had never been to that country before.',             targetForm: 'had never been', baseVerb: 'be', wrongForms: ['never were', 'have never been', 'were never being'], wrongVersion: 'They said they have never been to that country before.', splitAt: 4 },
    ],
    mcDistractors: ['She said that she will call me tomorrow.', 'He told them he has already spoken to the manager yesterday.', 'They asked if I know the way to the station.'],
    openStem: 'She said she ',
  },
};

const NEUTRAL_BANK = {
  templates: [
    { sentence: 'The team completed the project just before the deadline.',              targetForm: 'completed', baseVerb: 'complete', wrongForms: ['completes', 'was completing', 'has completed'], wrongVersion: 'The team completes the project just before the deadline.', splitAt: 4 },
    { sentence: 'She explained the plan clearly to the whole class.',                     targetForm: 'explained', baseVerb: 'explain', wrongForms: ['explains', 'was explaining', 'has explained'], wrongVersion: 'She explains the plan clearly to the whole class yesterday.', splitAt: 3 },
    { sentence: 'They discussed the results after the meeting ended.',                    targetForm: 'discussed', baseVerb: 'discuss', wrongForms: ['discuss', 'was discussing', 'has discussed'], wrongVersion: 'They discuss the results after the meeting ended.', splitAt: 3 },
    { sentence: 'The report focused on three main ideas from the study.',                 targetForm: 'focused', baseVerb: 'focus', wrongForms: ['focuses', 'was focusing', 'has focused'], wrongVersion: 'The report focuses on three main ideas from the study yesterday.', splitAt: 4 },
    { sentence: 'He described the process step by step to the audience.',                 targetForm: 'described', baseVerb: 'describe', wrongForms: ['describes', 'was describing', 'has described'], wrongVersion: 'He describes the process step by step to the audience yesterday.', splitAt: 3 },
    { sentence: 'The teacher asked the students to compare the two cases.',              targetForm: 'asked', baseVerb: 'ask', wrongForms: ['asks', 'was asking', 'has asked'], wrongVersion: 'The teacher asks the students to compare the two cases yesterday.', splitAt: 3 },
  ],
  mcDistractors: ['The team was completing the project just before the deadline.', 'She explains the plan yesterday to the whole class.', 'They was discussing the results after the meeting ended.'],
  openStem: 'Reflecting on the scene, I ',
};

function bankForFocus(focus) {
  return BANK[focus.short] ?? NEUTRAL_BANK;
}

function buildControlledPracticeItems(dialogue, focus) {
  const clean = sanitize(dialogue);
  const name = extractName(clean);
  const bank = bankForFocus(focus);
  const templates = shuffle(bank.templates.map(t => personalizeTemplate(t, name)));
  const pick = i => templates[i % templates.length];

  function fromTemplate(t) {
    const s = t.sentence;
    const words = s.replace(/[.!?,]$/, '').split(/\s+/);
    const first  = words.slice(0, t.splitAt).join(' ');
    const second = words.slice(t.splitAt).join(' ');
    const distractors = shuffle(
      templates.filter(x => x !== t).slice(0, 6).map(x => {
        const xs = x.sentence.replace(/[.!?,]$/, '').split(/\s+/);
        return xs.slice(x.splitAt).join(' ');
      }),
    ).slice(0, 3);
    return {
      unscramble: { type: 'unscramble', prompt: shuffle(words).join(' / '), answer: s.replace(/[.!?,]$/, ''), grammarTopic: focus.name, contextLine: s },
      verb: { type: 'verb_form', prompt: s.replace(t.targetForm, `_____ (${t.baseVerb})`), answer: t.targetForm, options: shuffle([t.targetForm, ...t.wrongForms]), grammarTopic: focus.name, contextLine: s },
      matchHalves: { type: 'match_halves', prompt: first, answer: second, options: shuffle([second, ...distractors]).slice(0, 4), grammarTopic: focus.name, contextLine: s },
      errorCorrection: { type: 'error_correction', prompt: 'Correct the mistake:', wrongText: t.wrongVersion, answer: s, grammarTopic: focus.name, contextLine: s },
    };
  }

  const t0 = pick(0), t1 = pick(1), t2 = pick(2), t3 = pick(3), t4 = pick(4), t5 = pick(5);
  const b1 = fromTemplate(t1), b2 = fromTemplate(t2), b3 = fromTemplate(t3), b4 = fromTemplate(t4), b5 = fromTemplate(t5), b0 = fromTemplate(t0);

  const multipleSelection = {
    type: 'multiple_selection',
    prompt: `Which of these sentences uses ${focus.name} correctly?`,
    answer: t0.sentence,
    options: shuffle([t0.sentence, ...bank.mcDistractors]),
    grammarTopic: focus.name,
    contextLine: t0.sentence,
  };

  return [
    multipleSelection,
    b1.unscramble,
    b2.verb,
    b3.matchHalves,
    b4.unscramble,
    b5.verb,
    b0.errorCorrection,
    { type: 'open_ended', prompt: `Complete the sentence in your own words using ${focus.name}.`, answer: '', stem: bank.openStem, grammarTopic: focus.name },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────

(async () => {
  const snap = await db.collection('movieLessons').get();
  console.log(`Scanning ${snap.size} movieLessons doc(s)…\n`);

  let migrated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const slides = Array.isArray(data.slides) ? [...data.slides] : [];
    const practiceIdx = slides.findIndex(s => s?.type === 'clip_controlled_practice');
    if (practiceIdx < 0) continue;
    const dialogue = data.clip?.dialogue;
    if (!dialogue) continue;

    const langFocus = slides.find(s => s?.type === 'clip_language_focus');
    const focus = resolveFocus(langFocus?.title, slides[practiceIdx].subtitle, dialogue);
    const bank = bankForFocus(focus);
    const usingNeutral = bank === NEUTRAL_BANK;

    const newItems = buildControlledPracticeItems(dialogue, focus);
    console.log(`• ${doc.id} — "${data.title}"  focus="${focus.name}"  bank=${usingNeutral ? 'NEUTRAL (custom focus)' : focus.short}`);

    if (!APPLY) continue;

    await backupLessonDoc(db, doc.id, 'pre-regen-practice-v2');
    slides[practiceIdx] = { ...slides[practiceIdx], subtitle: focus.name, practiceItems: newItems };
    await doc.ref.update({ slides });
    migrated++;
  }

  console.log('\n──── Summary ────');
  console.log(APPLY ? `migrated: ${migrated}` : '(dry run — pass --apply to actually write)');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
