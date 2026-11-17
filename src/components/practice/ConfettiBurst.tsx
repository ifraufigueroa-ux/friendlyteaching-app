// FriendlyTeaching.cl — CSS-only confetti burst.
//
// Spawns N absolutely-positioned coloured chips from the centre of its
// container, each with a randomised angle/distance/rotation. Animation
// lives in globals.css (keyframes `confetti-fly`). Zero deps, zero
// assets, un-mounts itself after the animation.

'use client';
import { useEffect, useMemo, useState } from 'react';

const PALETTE = [
  '#6e3fb0', // ft-700 (primary purple)
  '#8352c7', // ft-600
  '#C8A8DC', // soft purple
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#EC4899', // pink-500
  '#38BDF8', // sky-400
];

interface Props {
  count?:  number;
  active?: boolean;
  /** Shown until this many ms have elapsed. Default 1600. */
  ttlMs?:  number;
}

interface Piece {
  bg:    string;
  dx:    number;  // target x delta in px
  dy:    number;  // target y delta in px
  rot:   number;  // rotation in degrees
  delay: number;  // start delay in ms
  w:     number;  // width in px
  h:     number;  // height in px
}

export default function ConfettiBurst({ count = 36, active = true, ttlMs = 1600 }: Props) {
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (!active) return;
    setMounted(true);
    const id = window.setTimeout(() => setMounted(false), ttlMs);
    return () => window.clearTimeout(id);
  }, [active, ttlMs]);

  const pieces = useMemo<Piece[]>(() => {
    if (!active) return [];
    const out: Piece[] = [];
    for (let i = 0; i < count; i++) {
      const angle   = Math.random() * Math.PI * 2;
      const dist    = 90 + Math.random() * 180;
      out.push({
        bg:    PALETTE[Math.floor(Math.random() * PALETTE.length)],
        dx:    Math.cos(angle) * dist,
        dy:    Math.sin(angle) * dist - 60, // bias upward so they "lift"
        rot:   (Math.random() - 0.5) * 720,
        delay: Math.random() * 120,
        w:     4 + Math.random() * 6,
        h:     8 + Math.random() * 10,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible z-30" aria-hidden>
      <div className="absolute left-1/2 top-1/2">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute confetti-piece"
            style={{
              background:   p.bg,
              width:        `${p.w}px`,
              height:       `${p.h}px`,
              borderRadius: '2px',
              // CSS custom props the keyframe reads for per-piece motion.
              // Cast because React's CSSProperties doesn't know these yet.
              ...({
                '--cx': `${p.dx}px`,
                '--cy': `${p.dy}px`,
                '--cr': `${p.rot}deg`,
              } as React.CSSProperties),
              animationDelay: `${p.delay}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
