// FriendlyTeaching.cl — IELTS GT Simulator: consolidated section metadata
//
// This is Phase 1 of the IELTS unification. The four section pages
// (listening, reading, writing, cue-cards for speaking) still power the
// actual mock content — this file only describes the sections in a
// single object so the landing page can present them as one product.
//
// Section durations follow the official IELTS General Training format:
//   Listening : 30 min + 10 min answer transfer  (40 min total)
//   Reading   : 60 min
//   Writing   : 60 min  (Task 1 letter 20 min + Task 2 essay 40 min)
//   Speaking  : 11-14 min (Part 1 + cue card + Part 3)

export type IELTSSection = 'listening' | 'reading' | 'writing' | 'speaking';

// Ordered as they run in a real GT mock exam.
export const IELTS_SECTIONS: IELTSSection[] = ['listening', 'reading', 'writing', 'speaking'];

export interface IELTSSectionMeta {
  icon:     string;
  label:    string;
  minutes:  number;
  /** Where the current section page lives — the landing routes here when
   *  the teacher launches the section (Phase 1: open in a new tab). */
  href:     string;
  /** One-liner shown on the section card. */
  summary:  string;
}

export const IELTS_SECTION_META: Record<IELTSSection, IELTSSectionMeta> = {
  listening: {
    icon:    '🎧',
    label:   'Listening',
    minutes: 40,
    href:    '/dashboard/teacher/ielts/listening',
    summary: '40 questions × 4 sections. Audio, floating timer, and diagnostics by band + question type.',
  },
  reading: {
    icon:    '📖',
    label:   'Reading',
    minutes: 60,
    href:    '/dashboard/teacher/ielts/reading',
    summary: 'General Training: 3 sections × 40 questions with diagnostics by band + question type.',
  },
  writing: {
    icon:    '✍️',
    label:   'Writing',
    minutes: 60,
    href:    '/dashboard/teacher/ielts/writing',
    summary: 'Task 1 letter (20 min) + Task 2 essay (40 min). AI grading with official band descriptors.',
  },
  speaking: {
    icon:    '🎤',
    label:   'Speaking',
    minutes: 14,
    href:    '/dashboard/teacher/cue-cards',
    summary: 'Part 1 + 2 (cue cards) + 3 with instructions and per-part timers.',
  },
};

// ── Presets ────────────────────────────────────────────────────────────

export interface IELTSPreset {
  id:       string;
  label:    string;
  desc:     string;
  sections: IELTSSection[];
}

export const IELTS_PRESETS: IELTSPreset[] = [
  {
    id:       'full-gt',
    label:    'Full GT mock',
    desc:     'All 4 sections in official order (~2h 54min).',
    sections: ['listening', 'reading', 'writing', 'speaking'],
  },
  {
    id:       'lr',
    label:    'Listening + Reading',
    desc:     'Comprehension only (~1h 40min).',
    sections: ['listening', 'reading'],
  },
  {
    id:       'ws',
    label:    'Writing + Speaking',
    desc:     'Production only (~1h 14min).',
    sections: ['writing', 'speaking'],
  },
  {
    id:       'rw',
    label:    'Reading + Writing',
    desc:     'Great for a longer class (~2h).',
    sections: ['reading', 'writing'],
  },
  {
    id:       'ls',
    label:    'Listening + Speaking',
    desc:     'Oral focus (~54 min).',
    sections: ['listening', 'speaking'],
  },
  {
    id:       'lrw',
    label:    'L + R + W (no Speaking)',
    desc:     'All the written sections (~2h 40min).',
    sections: ['listening', 'reading', 'writing'],
  },
];
