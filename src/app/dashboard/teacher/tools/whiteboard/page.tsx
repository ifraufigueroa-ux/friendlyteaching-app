'use client';
import StandaloneWhiteboard from '@/components/tools/StandaloneWhiteboard';
import Link from 'next/link';

export default function WhiteboardPage() {
  return (
    <div className="flex flex-col" style={{ height: '100vh' }}>
      {/* Back bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] flex-shrink-0 shadow-md">
        <Link
          href="/dashboard/teacher/tools"
          className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
        >
          ← Herramientas
        </Link>
        <span className="text-white/20 text-xs">|</span>
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center text-[11px]">🖊️</span>
          Pizarra
        </span>
      </div>

      {/* Whiteboard fills remaining space */}
      <div className="flex-1 min-h-0">
        <StandaloneWhiteboard />
      </div>
    </div>
  );
}
