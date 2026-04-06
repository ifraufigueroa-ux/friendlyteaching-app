// FriendlyTeaching.cl — CoverSlide
import type { Slide } from '@/types/firebase';

const LEVEL_COLORS: Record<string, string> = {
  A0: '#17a2b8', A1: '#28a745', A2: '#5cb85c',
  B1: '#f0ad4e', 'B1+': '#e67e22', B2: '#e74c3c', C1: '#8e44ad',
};

interface Props { slide: Slide; courseTitle?: string; }

export default function CoverSlide({ slide, courseTitle }: Props) {
  const color = LEVEL_COLORS[slide.title ?? ''] ?? '#7c3aed';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8"
      style={slide.imageUrl ? {
        backgroundImage: `url(${slide.imageUrl})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      } : {}}>
      <div className={slide.imageUrl ? 'bg-white/85 rounded-2xl p-8' : ''}>
        <div className="text-7xl mb-6">📚</div>
        <h1 className="text-4xl font-extrabold text-[#5A3D7A] mb-4 leading-tight">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="text-xl text-gray-500 mb-6">{slide.subtitle}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-2">
          {slide.content && (
            <span
              className="px-3 py-1 rounded-full text-sm font-bold text-white"
              style={{ background: color }}
            >
              {slide.content}
            </span>
          )}
          {courseTitle && (
            <span className="text-gray-500 font-semibold text-sm">{courseTitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
