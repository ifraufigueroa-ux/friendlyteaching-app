// FriendlyTeaching.cl — Q&A Simulator shared types
//
// Each simulation is a JSON file in this directory with metadata + a question
// bank. To add a new simulation:
//   1. Create a .json file matching the QASimulation shape below
//   2. Add 1 import + 1 array entry in ./index.ts
//
// Categories and difficulty are open-ended strings on purpose — the JSON is
// the source of truth and the UI derives styling per-category from the
// CATEGORY_META lookup (with a default fallback for unknown categories).

export type QADifficulty = 'easy' | 'medium' | 'hard';

export interface QAQuestion {
  id:         number;
  category:   string;
  difficulty: QADifficulty;
  question:   string;
}

export interface QASimulation {
  /** URL slug — must be unique across all simulations. */
  id:           string;
  /** Display title shown in the index and during play. */
  title:        string;
  /** Short one-line description for the card. */
  description:  string;
  /** Optional student name this sim was built for. */
  studentName?: string;
  /** Optional research topic / context. */
  topic?:       string;
  /** Emoji or short text for the card icon. */
  icon:         string;
  /** Tailwind gradient classes for the card accent, e.g. "from-[#10B981] to-[#34D399]". */
  gradient:     string;
  /** Tailwind shadow class for the card hover glow, e.g. "shadow-emerald-200/40". */
  glow:         string;
  /** The full question bank. */
  questions:    QAQuestion[];
  /** If true, questions play in declaration order instead of being shuffled.
   *  Useful for structured beginner questionnaires (A1/A2) where the flow
   *  matters — e.g. personal info before hobbies before goals. */
  preserveOrder?: boolean;
}

// ── Category visual lookup ───────────────────────────────────────────────────
// Categories that aren't in this map fall back to the default styling.

export interface CategoryMeta {
  icon:  string;
  color: string;
  bg:    string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Theory':      { icon: '📚', color: '#5A3D7A', bg: '#F0E5FF' },
  'Methodology': { icon: '🧪', color: '#1E40AF', bg: '#DBEAFE' },
  'Results':     { icon: '📊', color: '#047857', bg: '#D1FAE5' },
  'Policy':      { icon: '🏛️', color: '#B45309', bg: '#FEF3C7' },
  'Critical':    { icon: '⚔️', color: '#B91C1C', bg: '#FEE2E2' },
  'Examiner':    { icon: '🎓', color: '#6D28D9', bg: '#EDE9FE' },
  'Follow-up':   { icon: '💬', color: '#0E7490', bg: '#CFFAFE' },
  // Beginner categories (A1 / A2 questionnaires)
  'Personal':    { icon: '👤', color: '#1D4ED8', bg: '#DBEAFE' },
  'Family':      { icon: '👨‍👩‍👧', color: '#BE185D', bg: '#FCE7F3' },
  'Work':        { icon: '💼', color: '#B45309', bg: '#FEF3C7' },
  'Likes':       { icon: '❤️', color: '#B91C1C', bg: '#FEE2E2' },
  'Free Time':   { icon: '🎨', color: '#047857', bg: '#D1FAE5' },
  'English':     { icon: '🇬🇧', color: '#5A3D7A', bg: '#F0E5FF' },
  // Grounding Knowledge categories (A1 → B1 speaking review)
  'Routines':    { icon: '🕐', color: '#7C2D12', bg: '#FED7AA' },
  'Travel':      { icon: '✈️', color: '#0284C7', bg: '#E0F2FE' },
  'Experiences': { icon: '🌍', color: '#0F766E', bg: '#CCFBF1' },
  'Opinions':    { icon: '💭', color: '#4338CA', bg: '#E0E7FF' },
  'Future':      { icon: '🚀', color: '#7E22CE', bg: '#F3E8FF' },
  // Weekly Warm-Up categories (catch-up small talk before a lesson)
  'Weekend':          { icon: '🎉', color: '#B45309', bg: '#FEF3C7' },
  'This Week':        { icon: '📅', color: '#1D4ED8', bg: '#DBEAFE' },
  'Mood':             { icon: '🌤️', color: '#A16207', bg: '#FEF9C3' },
  'Recent News':      { icon: '📰', color: '#0F766E', bg: '#CCFBF1' },
  'Wins & Struggles': { icon: '⚖️', color: '#B91C1C', bg: '#FEE2E2' },
  'Coming Up':        { icon: '🔮', color: '#7E22CE', bg: '#F3E8FF' },
  'Icebreaker':       { icon: '❄️', color: '#0284C7', bg: '#E0F2FE' },
};

const DEFAULT_CATEGORY_META: CategoryMeta = { icon: '❓', color: '#374151', bg: '#F3F4F6' };

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? DEFAULT_CATEGORY_META;
}

/** Derive the list of categories actually present in a simulation, in
 *  declaration order of CATEGORY_META first, then any extras alphabetically. */
export function categoriesInSimulation(sim: QASimulation): string[] {
  const present = new Set(sim.questions.map(q => q.category));
  const ordered: string[] = [];
  Object.keys(CATEGORY_META).forEach(c => { if (present.has(c)) ordered.push(c); });
  Array.from(present).filter(c => !CATEGORY_META[c]).sort().forEach(c => ordered.push(c));
  return ordered;
}
