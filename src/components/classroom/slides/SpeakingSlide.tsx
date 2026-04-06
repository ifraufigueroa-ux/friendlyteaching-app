// FriendlyTeaching.cl — SpeakingSlide
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; isTeacher?: boolean; }

export default function SpeakingSlide({ slide, isTeacher }: Props) {
  const prompts = slide.prompt
    ? slide.prompt.split('|').map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col h-full overflow-auto p-6 items-center justify-center text-center">
      <div className="text-6xl mb-4">🗣️</div>
      <h2 className="text-2xl font-bold text-[#5A3D7A] mb-2">{slide.title}</h2>

      {slide.content && (
        <p className="text-lg text-gray-600 mb-6 max-w-lg">{slide.content}</p>
      )}

      {prompts.length > 0 && (
        <div className="space-y-3 w-full max-w-lg">
          {prompts.map((p, i) => (
            <div key={i} className="bg-[#F0E5FF]/60 border border-[#C8A8DC]/30 rounded-2xl px-5 py-4 text-left">
              <span className="text-xs font-bold text-[#9B7CB8] mr-2">#{i + 1}</span>
              <span className="text-gray-800 font-medium">{p}</span>
            </div>
          ))}
        </div>
      )}

      {isTeacher && slide.teacherNotes && (
        <div className="mt-6 bg-[#FFF5C8] border border-[#FFE070] rounded-xl p-4 w-full max-w-lg text-left flex gap-3">
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
