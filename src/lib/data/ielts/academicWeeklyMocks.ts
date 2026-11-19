// FriendlyTeaching.cl — Weekly IELTS Academic mock rotation
//
// Each Weekly IELTS assignment serves one of these mocks at a time.
// Reading currently points at a GT reading mock as a placeholder — the
// question types are identical (T/F/NG, matching, completion, MCQ),
// only the passage genre differs. Dedicated Academic reading passages
// come in a later content pass.

export interface WeeklyIeltsMockDef {
  id: string;
  title: string;
  // IDs the module runners look up in the existing IELTS simulators.
  listeningMockId: string;
  readingMockId:   string;
  writingTask1Id:  string;
  writingTask2Id:  string;
  // Speaking is driven by topic strings matched against the Part 1 /
  // Part 3 pools (ieltsPart1Topics.ts / ieltsPart3Questions.ts), plus a
  // specific cue card id from IELTS_CUE_CARDS.
  speaking: {
    part1TopicIds: string[]; // matches entry.id in IELTS_PART1_TOPICS
    cueCardId:     string;   // matches entry.id in IELTS_CUE_CARDS
    part3Topics:   string[]; // matches entry.topic in IELTS_PART3_QUESTIONS
  };
}

export const ACADEMIC_WEEKLY_MOCKS: WeeklyIeltsMockDef[] = [
  {
    id:    'academic-mock-1',
    title: 'Academic Mock 1',
    listeningMockId: 'listening-advanced-mock-1',
    readingMockId:   'reading-gt-mock-1',
    writingTask1Id:  'ac-t1-01-energy-consumption',
    writingTask2Id:  'ac-t2-01-tech-communication',
    speaking: {
      part1TopicIds: ['work-studies', 'hometown'],
      cueCardId:     'useful-skill',
      part3Topics:   ['Education & learning', 'Technology & society'],
    },
  },
  {
    id:    'academic-mock-2',
    title: 'Academic Mock 2',
    listeningMockId: 'listening-advanced-mock-2',
    readingMockId:   'reading-gt-mock-2',
    writingTask1Id:  'ac-t1-02-internet-users',
    writingTask2Id:  'ac-t2-03-remote-work',
    speaking: {
      part1TopicIds: ['technology', 'free-time'],
      cueCardId:     'memorable-trip',
      part3Topics:   ['Environment & climate', 'Cities & hometowns'],
    },
  },
  {
    id:    'academic-mock-3',
    title: 'Academic Mock 3',
    listeningMockId: 'listening-advanced-mock-3',
    readingMockId:   'reading-gt-mock-3',
    writingTask1Id:  'ac-t1-03-transport-modes',
    writingTask2Id:  'ac-t2-04-plastic-waste',
    speaking: {
      part1TopicIds: ['music', 'travel'],
      cueCardId:     'piece-of-technology',
      part3Topics:   ['Culture & society', 'Health & wellbeing'],
    },
  },
];

export const DEFAULT_MOCK_ROTATION: string[] = ACADEMIC_WEEKLY_MOCKS.map((m) => m.id);

export function getAcademicMock(id: string): WeeklyIeltsMockDef | undefined {
  return ACADEMIC_WEEKLY_MOCKS.find((m) => m.id === id);
}

export function nextMockIdFromRotation(
  rotation: string[],
  currentIndex: number,
): { nextIndex: number; nextMockId: string } {
  if (rotation.length === 0) {
    return { nextIndex: 0, nextMockId: ACADEMIC_WEEKLY_MOCKS[0].id };
  }
  const nextIndex = (currentIndex + 1) % rotation.length;
  return { nextIndex, nextMockId: rotation[nextIndex] };
}
