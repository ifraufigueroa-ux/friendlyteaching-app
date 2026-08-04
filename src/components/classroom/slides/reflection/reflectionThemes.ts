// FriendlyTeaching.cl — Reflection-slide theme variants
//
// The Predictions and Wrap-up slides share the same skeleton across all
// three lesson brands (Friendlytext, Friendlyrics, Friendlyflix). This
// module gives each brand its own set of 3 rotating themes, picked
// deterministically from the lesson title so a given lesson always
// renders the same look, but a series of lessons feels visually varied
// instead of "everything is purple".
//
// Consumers:
//   const theme = pickTextTheme(title)  // Friendlytext
//   const theme = pickMusicTheme(title) // Friendlyrics
//   const theme = pickClipTheme(title)  // Friendlyflix

export interface ReflectionTheme {
  id: string;
  // Outer surface
  bgWrapper: string;         // gradient background classes for the slide wrapper
  textColor: string;         // main body text color (Tailwind arbitrary)
  headingColor: string;      // heading H1 color
  // Eyebrow chip (top brand label)
  eyebrowText: string;
  eyebrowBg: string;
  eyebrowBorder: string;
  brandLabel: string;        // "Friendlytext" / "Friendlyrics" / "Friendlyflix"
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
  // Small captions (word counter dim, muted "reflect on…" line)
  mutedText: string;
  mutedHover: string;        // fully-qualified `hover:text-…` string so Tailwind JIT finds it
}

// ────────────────────────────────────────────────────────────────
// FriendlyTales — Cinematic Mystery & Editorial Dark
//
// Deep purple + gold + neon magenta. Only one variant now — the
// entire product line reads as a single cinematic universe. The
// three-variant rotation stays for Friendlyrics and Friendlyflix.
// ────────────────────────────────────────────────────────────────

export const TEXT_THEMES: readonly ReflectionTheme[] = [
  {
    id: 'text-cinematic-mystery',
    // Wrapper is transparent so it inherits the radial-gradient from the
    // .theme-friendly-tales scope (see globals.css).
    bgWrapper:     'bg-transparent',
    textColor:     'text-[#F8F5FC]',
    headingColor:  'text-[#F9F0A8]',
    eyebrowText:   'text-[#F9F0A8]',
    eyebrowBg:     'bg-[rgba(30,20,50,0.75)]',
    eyebrowBorder: 'border-[#EC008C]/40',
    brandLabel:    'FriendlyTales',
    heroPredictions: '🔮',
    heroWrapup:      '✨',
    floaters:      ['✦', '✧', '✵'] as const,
    floaterColor:  'text-[#F9F0A8]/40',
    cardShadow:    'shadow-[#EC008C]/25',
    badgeGradient: 'bg-gradient-to-br from-[#EC008C] to-[#7B1E5A]',
    ctaGradient:   'bg-gradient-to-r from-[#EC008C] to-[#A70066]',
    ctaShadow:     'shadow-[#EC008C]/40',
    focusBorder:   'focus:border-[#F9F0A8]',
    mutedText:     'text-[#A69BB8]',
    mutedHover:    'hover:text-[#F9F0A8]',
  },
];

// ────────────────────────────────────────────────────────────────
// Friendlyrics — twilight (default purple), amber (acoustic/warm),
// midnight (nocturnal/chill)
// ────────────────────────────────────────────────────────────────

export const MUSIC_THEMES: readonly ReflectionTheme[] = [
  {
    id: 'music-twilight',
    bgWrapper:     'bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0]',
    textColor:     'text-[#2D1B4E]',
    headingColor:  'text-[#2D1B4E]',
    eyebrowText:   'text-[#5A3D7A]',
    eyebrowBg:     'bg-white/60',
    eyebrowBorder: 'border-[#C8A8DC]/40',
    brandLabel:    'Friendlyrics',
    heroPredictions: '🎧',
    heroWrapup:      '💬',
    floaters:      ['♪', '♫', '♬'] as const,
    floaterColor:  'text-[#9B7CB8]/40',
    cardShadow:    'shadow-[#C8A8DC]/20',
    badgeGradient: 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8]',
    ctaGradient:   'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]',
    ctaShadow:     'shadow-[#5A3D7A]/30',
    focusBorder:   'focus:border-[#9B7CB8]',
    mutedText:     'text-[#5A3D7A]/70',
    mutedHover:    'hover:text-[#5A3D7A]',
  },
  {
    id: 'music-amber',
    bgWrapper:     'bg-gradient-to-br from-[#FFF5E8] via-[#FDE9C8] to-[#FAD8A0]',
    textColor:     'text-[#3A2A0F]',
    headingColor:  'text-[#3A2A0F]',
    eyebrowText:   'text-[#8A5A1A]',
    eyebrowBg:     'bg-white/70',
    eyebrowBorder: 'border-[#F59E0B]/40',
    brandLabel:    'Friendlyrics',
    heroPredictions: '🎤',
    heroWrapup:      '🎶',
    floaters:      ['♪', '♩', '♫'] as const,
    floaterColor:  'text-[#F59E0B]/45',
    cardShadow:    'shadow-[#F59E0B]/25',
    badgeGradient: 'bg-gradient-to-br from-[#B45309] to-[#F59E0B]',
    ctaGradient:   'bg-gradient-to-r from-[#B45309] to-[#F59E0B]',
    ctaShadow:     'shadow-[#B45309]/30',
    focusBorder:   'focus:border-[#F59E0B]',
    mutedText:     'text-[#8A5A1A]/70',
    mutedHover:    'hover:text-[#8A5A1A]',
  },
  {
    id: 'music-midnight',
    bgWrapper:     'bg-gradient-to-br from-[#E9ECFF] via-[#D6DCFB] to-[#B8C4F5]',
    textColor:     'text-[#0F172A]',
    headingColor:  'text-[#0F172A]',
    eyebrowText:   'text-[#312E81]',
    eyebrowBg:     'bg-white/70',
    eyebrowBorder: 'border-[#6366F1]/40',
    brandLabel:    'Friendlyrics',
    heroPredictions: '🌙',
    heroWrapup:      '✨',
    floaters:      ['♪', '♫', '♬'] as const,
    floaterColor:  'text-[#6366F1]/45',
    cardShadow:    'shadow-[#6366F1]/25',
    badgeGradient: 'bg-gradient-to-br from-[#0F172A] to-[#6366F1]',
    ctaGradient:   'bg-gradient-to-r from-[#0F172A] to-[#6366F1]',
    ctaShadow:     'shadow-[#0F172A]/30',
    focusBorder:   'focus:border-[#6366F1]',
    mutedText:     'text-[#312E81]/70',
    mutedHover:    'hover:text-[#312E81]',
  },
];

// ────────────────────────────────────────────────────────────────
// Friendlyflix — reel (default purple), golden hour (warm cinema),
// noir (moody dark accents)
// ────────────────────────────────────────────────────────────────

export const CLIP_THEMES: readonly ReflectionTheme[] = [
  {
    id: 'clip-reel',
    bgWrapper:     'bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0]',
    textColor:     'text-[#2D1B4E]',
    headingColor:  'text-[#2D1B4E]',
    eyebrowText:   'text-[#5A3D7A]',
    eyebrowBg:     'bg-white/60',
    eyebrowBorder: 'border-[#C8A8DC]/40',
    brandLabel:    'Friendlyflix',
    heroPredictions: '🔮',
    heroWrapup:      '🎬',
    floaters:      ['✦', '✧', '✵'] as const,
    floaterColor:  'text-[#9B7CB8]/40',
    cardShadow:    'shadow-[#C8A8DC]/20',
    badgeGradient: 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8]',
    ctaGradient:   'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]',
    ctaShadow:     'shadow-[#5A3D7A]/30',
    focusBorder:   'focus:border-[#9B7CB8]',
    mutedText:     'text-[#5A3D7A]/70',
    mutedHover:    'hover:text-[#5A3D7A]',
  },
  {
    id: 'clip-golden',
    bgWrapper:     'bg-gradient-to-br from-[#FFF3D9] via-[#FDDDA1] to-[#F5B76B]',
    textColor:     'text-[#3A2A0F]',
    headingColor:  'text-[#3A2A0F]',
    eyebrowText:   'text-[#7A4E10]',
    eyebrowBg:     'bg-white/70',
    eyebrowBorder: 'border-[#E8B547]/40',
    brandLabel:    'Friendlyflix',
    heroPredictions: '🎞️',
    heroWrapup:      '🌇',
    floaters:      ['✦', '★', '✧'] as const,
    floaterColor:  'text-[#B45309]/40',
    cardShadow:    'shadow-[#E8B547]/25',
    badgeGradient: 'bg-gradient-to-br from-[#7A4E10] to-[#E8B547]',
    ctaGradient:   'bg-gradient-to-r from-[#7A4E10] to-[#E8B547]',
    ctaShadow:     'shadow-[#7A4E10]/30',
    focusBorder:   'focus:border-[#E8B547]',
    mutedText:     'text-[#7A4E10]/70',
    mutedHover:    'hover:text-[#7A4E10]',
  },
  {
    id: 'clip-noir',
    bgWrapper:     'bg-gradient-to-br from-[#F2F1F4] via-[#E4E2EA] to-[#D5D3DE]',
    textColor:     'text-[#1B1720]',
    headingColor:  'text-[#1B1720]',
    eyebrowText:   'text-[#4C1D1D]',
    eyebrowBg:     'bg-white/80',
    eyebrowBorder: 'border-[#7F1D1D]/40',
    brandLabel:    'Friendlyflix',
    heroPredictions: '🕵️',
    heroWrapup:      '🎭',
    floaters:      ['◈', '◆', '◇'] as const,
    floaterColor:  'text-[#7F1D1D]/40',
    cardShadow:    'shadow-[#1B1720]/25',
    badgeGradient: 'bg-gradient-to-br from-[#1B1720] to-[#7F1D1D]',
    ctaGradient:   'bg-gradient-to-r from-[#1B1720] to-[#7F1D1D]',
    ctaShadow:     'shadow-[#1B1720]/30',
    focusBorder:   'focus:border-[#7F1D1D]',
    mutedText:     'text-[#4C1D1D]/70',
    mutedHover:    'hover:text-[#4C1D1D]',
  },
];

// ────────────────────────────────────────────────────────────────
// Deterministic pickers — same lesson always renders the same theme,
// but a batch of lessons cycles through the 3 variants.
// ────────────────────────────────────────────────────────────────

function hashString(seed: string | undefined): number {
  if (!seed) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickTextTheme(seed: string | undefined): ReflectionTheme {
  return TEXT_THEMES[hashString(seed) % TEXT_THEMES.length];
}

export function pickMusicTheme(seed: string | undefined): ReflectionTheme {
  return MUSIC_THEMES[hashString(seed) % MUSIC_THEMES.length];
}

export function pickClipTheme(seed: string | undefined): ReflectionTheme {
  return CLIP_THEMES[hashString(seed) % CLIP_THEMES.length];
}
