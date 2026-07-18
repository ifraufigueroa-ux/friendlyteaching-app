// FriendlyTeaching.cl — Text-lesson theme variants for reflection slides
// (Predictions + Wrap-up).
//
// Same slide skeleton, three visual identities drawn from the brand
// palette. The variant is picked deterministically from the lesson title
// so a given lesson always looks the same, but a batch of lessons feels
// visually varied instead of the previous "everything is purple" look.
//
// Consumers pick a theme via `pickTextTheme(title)` and paste the class
// strings into the JSX. Music lessons (song_cover / lyrics_game / etc.)
// keep their original purple palette; these themes only kick in when the
// slide's `textData` field is present.

export interface TextTheme {
  id: 'amber' | 'ocean' | 'rose';
  // Outer surface
  bgWrapper: string;         // gradient background classes for the slide wrapper
  textColor: string;         // main body text color (Tailwind arbitrary)
  headingColor: string;      // heading H1 color
  // Eyebrow chip (top brand label)
  eyebrowText: string;
  eyebrowBg: string;
  eyebrowBorder: string;
  brandLabel: string;        // "Friendlytext" — subtitle is joined below
  // Hero emoji + floaters
  heroPredictions: string;   // hero glyph shown on the predictions slide
  heroWrapup: string;        // hero glyph shown on the wrap-up slide
  floaters: readonly [string, string, string];
  floaterColor: string;      // Tailwind text color class for the floating glyphs
  // Cards + badges
  cardShadow: string;        // shadow color used by the numbered cards
  badgeGradient: string;     // 1/2/3 badge gradient (Tailwind arbitrary)
  // CTA button (Submit / Save)
  ctaGradient: string;       // gradient background classes
  ctaShadow: string;         // shadow color class
  // Textarea focus ring
  focusBorder: string;       // border color class for :focus
  // Small captions (word counter dim, muted eyebrow "reflect on…" line)
  mutedText: string;
  mutedHover: string;        // fully-qualified `hover:text-…` string so Tailwind JIT finds it
}

export const TEXT_THEMES: readonly TextTheme[] = [
  {
    id: 'amber',
    bgWrapper:     'bg-gradient-to-br from-[#FFF8EC] via-[#FEF3D9] to-[#FBE8B8]',
    textColor:     'text-[#3A2A0F]',
    headingColor:  'text-[#3A2A0F]',
    eyebrowText:   'text-[#8A6D2A]',
    eyebrowBg:     'bg-white/70',
    eyebrowBorder: 'border-[#E8B547]/40',
    brandLabel:    'Friendlytext',
    heroPredictions: '📖',
    heroWrapup:      '✨',
    floaters:      ['✧', '❊', '✦'] as const,
    floaterColor:  'text-[#E8B547]/40',
    cardShadow:    'shadow-[#E8B547]/20',
    badgeGradient: 'bg-gradient-to-br from-[#B45309] to-[#E8B547]',
    ctaGradient:   'bg-gradient-to-r from-[#B45309] to-[#E8B547]',
    ctaShadow:     'shadow-[#B45309]/30',
    focusBorder:   'focus:border-[#E8B547]',
    mutedText:     'text-[#8A6D2A]/70',
    mutedHover:    'hover:text-[#8A6D2A]',
  },
  {
    id: 'ocean',
    bgWrapper:     'bg-gradient-to-br from-[#EEF6F9] via-[#DDECF3] to-[#C8DFEC]',
    textColor:     'text-[#1B2C3F]',
    headingColor:  'text-[#1B2C3F]',
    eyebrowText:   'text-[#2C4159]',
    eyebrowBg:     'bg-white/70',
    eyebrowBorder: 'border-[#7EB8D8]/40',
    brandLabel:    'Friendlytext',
    heroPredictions: '🌊',
    heroWrapup:      '🗣️',
    floaters:      ['◈', '◆', '◇'] as const,
    floaterColor:  'text-[#4B6A85]/40',
    cardShadow:    'shadow-[#7EB8D8]/25',
    badgeGradient: 'bg-gradient-to-br from-[#1B2C3F] to-[#4B6A85]',
    ctaGradient:   'bg-gradient-to-r from-[#1B2C3F] to-[#4B6A85]',
    ctaShadow:     'shadow-[#1B2C3F]/30',
    focusBorder:   'focus:border-[#4B6A85]',
    mutedText:     'text-[#4B6A85]/70',
    mutedHover:    'hover:text-[#4B6A85]',
  },
  {
    id: 'rose',
    bgWrapper:     'bg-gradient-to-br from-[#FFF0F0] via-[#FFE1E1] to-[#FFCACA]',
    textColor:     'text-[#3A0F14]',
    headingColor:  'text-[#3A0F14]',
    eyebrowText:   'text-[#7F1D1D]',
    eyebrowBg:     'bg-white/70',
    eyebrowBorder: 'border-[#F472B6]/40',
    brandLabel:    'Friendlytext',
    heroPredictions: '💌',
    heroWrapup:      '❤️',
    floaters:      ['✿', '❀', '❁'] as const,
    floaterColor:  'text-[#F472B6]/40',
    cardShadow:    'shadow-[#F472B6]/25',
    badgeGradient: 'bg-gradient-to-br from-[#B91C1C] to-[#F472B6]',
    ctaGradient:   'bg-gradient-to-r from-[#B91C1C] to-[#F472B6]',
    ctaShadow:     'shadow-[#B91C1C]/30',
    focusBorder:   'focus:border-[#F472B6]',
    mutedText:     'text-[#7F1D1D]/70',
    mutedHover:    'hover:text-[#7F1D1D]',
  },
];

// Deterministic pick from the title string — same lesson always renders
// the same theme, but different lessons in a series get different looks.
export function pickTextTheme(seed: string | undefined): TextTheme {
  if (!seed) return TEXT_THEMES[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TEXT_THEMES[Math.abs(h) % TEXT_THEMES.length];
}
