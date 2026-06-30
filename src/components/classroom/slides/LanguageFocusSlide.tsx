// FriendlyTeaching.cl — LanguageFocusSlide
// "Language Awareness" stage. Top: explanation/overview. Below: a list of
// key language patterns from the clip (using the words[] field, where each
// entry is { word: pattern_example, translation: pattern_label, example:
// pattern_form }). Teacher notes shown only to teachers (not yet wired).

import DOMPurify from 'dompurify';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; isTeacher?: boolean; }

export default function LanguageFocusSlide({ slide, isTeacher }: Props) {
  const overview = slide.content?.trim() ?? '';

  return (
    <div className="flex flex-col h-full overflow-auto p-6 sm:p-8">
      <div className="mb-5">
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#9B7CB8] mb-2">Language awareness</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#5A3D7A] leading-tight">{slide.title ?? 'Language focus'}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      {overview && (
        <div
          className="text-gray-700 text-base leading-relaxed bg-[#F9F5FF] border border-[#E8D5F0] rounded-2xl p-5 mb-5"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(overview.replace(/\n/g, '<br>')) }}
        />
      )}

      {(slide.words ?? []).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(slide.words ?? []).map((w, i) => (
            <div key={i} className="bg-white border border-[#E8D5F0] rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-[#5A3D7A] mb-1 leading-snug">{w.word}</p>
              {w.translation && (
                <p className="text-xs text-[#9B7CB8] font-semibold uppercase tracking-wider mt-1">{w.translation}</p>
              )}
              {w.example && (
                <p className="text-xs text-gray-500 italic mt-2 leading-snug">{w.example}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {isTeacher && slide.teacherNotes && (
        <div className="mt-5 bg-[#FFF5C8] border border-[#FFE070] rounded-xl p-4 flex gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <p className="text-xs font-bold text-[#7A5E00] mb-1">Nota para el Profesor</p>
            <p className="text-sm text-[#5A4500] leading-relaxed">{slide.teacherNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
