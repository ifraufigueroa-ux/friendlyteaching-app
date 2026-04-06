// FriendlyTeaching.cl — Brand Colors
export const FT_COLORS = {
  purple: '#C8A8DC',
  purpleDeep: '#9B7CB8',
  purpleDark: '#6B4F8A',
  purpleText: '#5A3D7A',
  pink: '#FFB8D9',
  pinkDeep: '#E89BBF',
  yellow: '#FFF5C8',
  cyan: '#B8E8E8',
  cream: '#FFFEF5',
  lavender: '#F0E5FF',
  peach: '#FFE0D5',
  dark: '#4A4A4A',
  light: '#FFFCF7',
  white: '#FFFFFF',
  // Slot states
  slotAvailable: '#A8E6A1',
  slotConfirmed: '#A8D5E8',
  slotPending: '#FFE8A8',
  slotUnavailable: '#D9D9D9',
  slotOccupied: '#C8A8DC',
  slotOneOff: '#F4B8C1',
  // Phase indicators
  phasePre: '#7EB8D8',
  phaseWhile: '#8DC8A0',
  phasePost: '#C8A8DC',
  // CEFR levels
  cefrA0: '#17a2b8',
  cefrA1: '#28a745',
  cefrA2: '#6abf69',
  cefrB1: '#ff9800',
  cefrB2: '#9c27b0',
  cefrC1: '#6610f2',
} as const;

// Tailwind CSS variable equivalents (used in tailwind.config.ts)
export const TAILWIND_COLORS = {
  'ft-purple': FT_COLORS.purple,
  'ft-purple-deep': FT_COLORS.purpleDeep,
  'ft-pink': FT_COLORS.pink,
  'ft-yellow': FT_COLORS.yellow,
  'ft-cyan': FT_COLORS.cyan,
  'ft-cream': FT_COLORS.cream,
  'ft-lavender': FT_COLORS.lavender,
  'ft-dark': FT_COLORS.dark,
  'ft-light': FT_COLORS.light,
} as const;

export const CEFR_COLORS: Record<string, string> = {
  A0: FT_COLORS.cefrA0,
  A1: FT_COLORS.cefrA1,
  A2: FT_COLORS.cefrA2,
  B1: FT_COLORS.cefrB1,
  'B1+': FT_COLORS.cefrB1,
  B2: FT_COLORS.cefrB2,
  C1: FT_COLORS.cefrC1,
};
