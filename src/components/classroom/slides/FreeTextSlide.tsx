// FriendlyTeaching.cl — FreeTextSlide
import DOMPurify from 'dompurify';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; isTeacher?: boolean; }

export default function FreeTextSlide({ slide, isTeacher }: Props) {
  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      {slide.imageUrl && (
        <div className="text-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl}
            alt=""
            className="max-w-full max-h-64 object-cover rounded-2xl mx-auto"
          />
        </div>
      )}

      {slide.content && (
        <div
          className="text-gray-700 text-lg leading-relaxed bg-[#F0E5FF]/30 rounded-2xl p-5 flex-1"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(slide.content.replace(/\n/g, '<br>')) }}
        />
      )}

      {isTeacher && slide.teacherNotes && (
        <div className="mt-4 bg-[#FFF5C8] border border-[#FFE070] rounded-xl p-4 flex gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-xs font-bold text-[#7A5E00] mb-1">Nota para el Profesor</p>
            <p className="text-sm text-[#5A4500]">{slide.teacherNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
