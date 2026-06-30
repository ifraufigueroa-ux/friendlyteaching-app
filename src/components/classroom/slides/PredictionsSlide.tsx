// FriendlyTeaching.cl — PredictionsSlide
// "Before you watch" stage. Shows a prompt and a list of guiding questions /
// cues the student answers BEFORE the clip plays.

import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function PredictionsSlide({ slide }: Props) {
  const cues = (slide.content ?? '').split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-col h-full overflow-auto p-6 sm:p-8">
      <div className="mb-5">
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#9B7CB8] mb-2">Before you watch</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#5A3D7A] leading-tight">{slide.title ?? 'Predictions'}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      {slide.prompt && (
        <div className="bg-gradient-to-br from-[#F0E5FF] to-[#E8D5F0] border border-[#C8A8DC] rounded-2xl p-5 mb-5 shadow-sm">
          <p className="text-base sm:text-lg text-[#2D1B4E] font-semibold leading-relaxed">{slide.prompt}</p>
        </div>
      )}

      {cues.length > 0 && (
        <ul className="space-y-3">
          {cues.map((cue, i) => (
            <li key={i} className="flex items-start gap-3 bg-white border border-[#E8D5F0] rounded-xl p-4 shadow-sm">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#5A3D7A] text-white font-bold text-xs flex items-center justify-center">{i + 1}</span>
              <p className="text-base text-gray-700 leading-relaxed">{cue}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
