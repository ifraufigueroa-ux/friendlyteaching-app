// FriendlyTeaching.cl — Student row action menu
//
// Tiny popover with the three change-request actions. The modal lives
// one level up (the page owns the open state) so the dropdown here is
// pure UI — it just reports which action the admin picked.

'use client';
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { CHANGE_REQUEST_LABELS } from '@/hooks/useChangeRequests';
import type { ChangeRequestType } from '@/types/organization';

const ORDER: ChangeRequestType[] = ['change-group', 'reevaluation', 'replacement'];

export function StudentActionsMenu({
  onPick,
}: {
  onPick: (type: ChangeRequestType) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Esc.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(o => !o);
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
          open
            ? 'bg-[#5A3D7A] text-white border-[#5A3D7A]'
            : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:bg-[#F0E5FF] hover:border-[#C8A8DC]'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Solicitar cambios
        <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[240px] bg-white rounded-2xl border border-[#E8D5F0] shadow-xl shadow-[#5A3D7A]/15 overflow-hidden z-20"
        >
          {ORDER.map(type => {
            const l = CHANGE_REQUEST_LABELS[type];
            return (
              <button
                key={type}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  onPick(type);
                }}
                className="w-full text-left px-4 py-3 text-sm text-[#2D1B4E] hover:bg-[#FAF5FF] transition-colors inline-flex items-center gap-3 border-b border-[#F0E5FF] last:border-b-0"
              >
                <span className="text-lg leading-none">{l.emoji}</span>
                <span className="font-semibold">{l.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
