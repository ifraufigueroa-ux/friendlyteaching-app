// FriendlyTeaching.cl — ImageHotspotSlide (click on image regions)
// Uses slide.imageUrl as background. Hotspot areas defined in slide.pairs[] as:
//   left = "x,y,radius" (percentages), right = label/answer
// correctAnswer = pipe-separated labels the student must find.
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Hotspot {
  x: number; y: number; radius: number; label: string;
}

interface Props { slide: Slide; }

export default function ImageHotspotSlide({ slide }: Props) {
  const [found, setFound] = useState<Set<string>>(new Set());
  const [lastClick, setLastClick] = useState<{ x: number; y: number; hit: boolean } | null>(null);

  // Parse hotspots from pairs (left="x,y,radius" right="label")
  const hotspots: Hotspot[] = (slide.pairs ?? []).map((p) => {
    const [x, y, r] = p.left.split(',').map(Number);
    return { x: x ?? 50, y: y ?? 50, radius: r ?? 5, label: p.right };
  });

  const targets = (slide.correctAnswer ?? '').split('|').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const allFound = targets.length > 0 && targets.every((t) => found.has(t));

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (allFound) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if click is within any hotspot
    let hit = false;
    for (const hs of hotspots) {
      const dist = Math.sqrt((xPct - hs.x) ** 2 + (yPct - hs.y) ** 2);
      if (dist <= hs.radius) {
        setFound((prev) => new Set(prev).add(hs.label.toLowerCase()));
        hit = true;
      }
    }
    setLastClick({ x: xPct, y: yPct, hit });
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.question && <p className="text-gray-600 mt-2">{slide.question}</p>}
      </div>

      {/* Progress */}
      {targets.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8A8DC] transition-all duration-300 rounded-full"
              style={{ width: `${(found.size / targets.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#5A3D7A]">{found.size}/{targets.length}</span>
        </div>
      )}

      {/* Image with clickable hotspots */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-crosshair border-2 border-[#E0D5FF] shadow-lg"
        onClick={handleClick}
      >
        {slide.imageUrl ? (
          <img src={slide.imageUrl} alt={slide.title ?? ''} className="w-full" draggable={false} />
        ) : (
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">
            Sin imagen configurada
          </div>
        )}

        {/* Revealed hotspot markers */}
        {hotspots.filter((hs) => found.has(hs.label.toLowerCase())).map((hs, i) => (
          <div
            key={i}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-[fadeIn_0.3s_ease]"
            style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
          >
            <div className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
              {hs.label}
            </div>
          </div>
        ))}

        {/* Click feedback */}
        {lastClick && (
          <div
            className={`absolute w-6 h-6 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-500 ${
              lastClick.hit ? 'bg-green-400/50 ring-2 ring-green-400' : 'bg-red-400/30 ring-2 ring-red-300'
            }`}
            style={{ left: `${lastClick.x}%`, top: `${lastClick.y}%` }}
          />
        )}
      </div>

      {/* Completion message */}
      {allFound && (
        <div className="mt-4 text-center py-3 rounded-xl font-bold bg-green-50 text-green-600">
          🎉 ¡Encontraste todos los elementos!
        </div>
      )}
    </div>
  );
}
