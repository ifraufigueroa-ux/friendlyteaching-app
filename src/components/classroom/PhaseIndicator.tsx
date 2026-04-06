// FriendlyTeaching.cl — PhaseIndicator
import type { SlidePhase } from '@/types/firebase';

const PHASE_CONFIG = {
  pre: { label: 'PRE', color: 'bg-[#7EB8D8] text-white', title: 'Calentamiento' },
  while: { label: 'WHILE', color: 'bg-[#8DC8A0] text-white', title: 'Actividad Principal' },
  post: { label: 'POST', color: 'bg-[#C8A8DC] text-white', title: 'Cierre' },
};

interface Props { phase?: SlidePhase; }

export default function PhaseIndicator({ phase }: Props) {
  if (!phase) return null;
  const config = PHASE_CONFIG[phase];

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${config.color}`}>
        {config.label}
      </span>
      <span className="text-xs text-gray-400 hidden sm:block">{config.title}</span>
    </div>
  );
}
