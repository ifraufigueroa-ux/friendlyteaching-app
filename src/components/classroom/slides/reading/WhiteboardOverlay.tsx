// Full-screen modal that hosts the polished StandaloneWhiteboard so the
// teacher/student can sketch beside the reading without leaving the lesson.
'use client';
import { useEffect } from 'react';
import StandaloneWhiteboard from '@/components/tools/StandaloneWhiteboard';

interface Props { open: boolean; onClose: () => void; }

export default function WhiteboardOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F0A1A]/95 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] shadow-md flex-shrink-0">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center text-[11px]">🖊️</span>
          Pizarra
        </span>
        <button
          onClick={onClose}
          className="text-xs font-semibold text-white/80 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
        >
          Cerrar pizarra ✕
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <StandaloneWhiteboard />
      </div>
    </div>
  );
}
