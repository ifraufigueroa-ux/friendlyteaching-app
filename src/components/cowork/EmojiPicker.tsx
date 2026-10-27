// FriendlyTeaching.cl — EmojiPicker del Co-Work.
// Popover con dos pestañas: friendly (iconos del sidebar como stickers)
// y unicode (emojis estándar agrupados). Al elegir uno, llama onPick
// con el token a insertar en el textarea.

'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Smile, Sparkles } from 'lucide-react';
import { FRIENDLY_EMOJIS, UNICODE_EMOJIS } from '@/lib/cowork/friendlyEmojis';

type Tab = 'friendly' | 'unicode';

export function EmojiPicker({
  open,
  onClose,
  onPick,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  // token a insertar: un `:ft-xxx:` para friendly, o el caracter emoji
  onPick: (token: string) => void;
  // ref del botón que abre el picker — para posicionar y para que un
  // click en él no cuente como "fuera" en el handler de cerrar
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const [tab, setTab] = useState<Tab>('friendly');
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera o Escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full right-0 mb-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-30"
      role="dialog"
      aria-label="Selector de emojis"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50/60">
        <button
          type="button"
          onClick={() => setTab('friendly')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${
            tab === 'friendly'
              ? 'text-[#5A3D7A] bg-white border-b-2 border-[#5A3D7A]'
              : 'text-gray-500 hover:text-[#5A3D7A]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
          Friendly
        </button>
        <button
          type="button"
          onClick={() => setTab('unicode')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-colors ${
            tab === 'unicode'
              ? 'text-[#5A3D7A] bg-white border-b-2 border-[#5A3D7A]'
              : 'text-gray-500 hover:text-[#5A3D7A]'
          }`}
        >
          <Smile className="w-3.5 h-3.5" strokeWidth={2.5} />
          Emoji
        </button>
      </div>

      {/* Contenido */}
      <div className="p-3 max-h-72 overflow-y-auto">
        {tab === 'friendly' ? (
          <div className="grid grid-cols-6 gap-1.5">
            {FRIENDLY_EMOJIS.map((e) => (
              <button
                key={e.code}
                type="button"
                onClick={() => onPick(`:${e.code}:`)}
                title={e.label}
                aria-label={e.label}
                className="w-10 h-10 rounded-lg hover:bg-[#F0E5FF] hover:scale-110 transition-all flex items-center justify-center p-0.5"
              >
                <Image
                  src={e.src}
                  alt=""
                  width={36}
                  height={36}
                  className="w-full h-full object-cover rounded-md"
                  unoptimized
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {UNICODE_EMOJIS.map((group) => (
              <div key={group.title}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1 px-0.5">
                  {group.title}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {group.emojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => onPick(em)}
                      title={em}
                      className="w-8 h-8 rounded-md hover:bg-[#F0E5FF] hover:scale-125 transition-all flex items-center justify-center text-xl leading-none"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
