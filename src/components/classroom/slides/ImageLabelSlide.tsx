// FriendlyTeaching.cl — ImageLabelSlide
import DOMPurify from 'dompurify';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function ImageLabelSlide({ slide }: Props) {
  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      {slide.imageUrl && (
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl}
            alt={slide.title ?? ''}
            className="max-h-80 object-contain rounded-2xl mx-auto shadow-md"
          />
        </div>
      )}

      {slide.content && (
        <div
          className="text-gray-700 leading-relaxed text-base"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(slide.content.replace(/\n/g, '<br>')) }}
        />
      )}

      {slide.words && slide.words.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">Vocabulario</p>
          <div className="flex flex-wrap gap-2">
            {slide.words.map((word, i) => (
              <div key={i} className="bg-[#F0E5FF] rounded-xl px-3 py-1.5">
                <span className="text-sm font-bold text-[#5A3D7A]">{word.word}</span>
                {word.translation && (
                  <span className="text-xs text-gray-400 ml-2">= {word.translation}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
