'use client';
// FriendlyTeaching.cl — SubtitleCover
//
// Draggable + resizable white overlay used to mask hardcoded subtitles on
// Friendlyflix video clips. Mount inside the same `relative` container as the
// YouTube iframe; the cover positions itself absolutely with percentage units
// so it scales with the video container.
//
// Position + size + enabled state are persisted in localStorage (single
// global key) so the teacher's last layout survives across slides and
// sessions.

import { useEffect, useRef, useState, useCallback } from 'react';

interface Layout {
  /** All values are percentages of the parent (0–100). */
  x:      number;
  y:      number;
  width:  number;
  height: number;
}

const STORAGE_KEY = 'ft.subtitleCover.v1';

const DEFAULT_LAYOUT: Layout = {
  x:      10,
  y:      80,
  width:  80,
  height: 14,
};

const MIN_W = 8;
const MIN_H = 4;

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface DragState {
  kind:     'move' | ResizeHandle;
  startX:   number;
  startY:   number;
  origin:   Layout;
  parentW:  number;
  parentH:  number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function loadState(): { layout: Layout; enabled: boolean } {
  if (typeof window === 'undefined') return { layout: DEFAULT_LAYOUT, enabled: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { layout: DEFAULT_LAYOUT, enabled: false };
    const parsed = JSON.parse(raw) as { layout?: Partial<Layout>; enabled?: boolean };
    return {
      layout: {
        x:      typeof parsed.layout?.x      === 'number' ? parsed.layout.x      : DEFAULT_LAYOUT.x,
        y:      typeof parsed.layout?.y      === 'number' ? parsed.layout.y      : DEFAULT_LAYOUT.y,
        width:  typeof parsed.layout?.width  === 'number' ? parsed.layout.width  : DEFAULT_LAYOUT.width,
        height: typeof parsed.layout?.height === 'number' ? parsed.layout.height : DEFAULT_LAYOUT.height,
      },
      enabled: parsed.enabled ?? false,
    };
  } catch {
    return { layout: DEFAULT_LAYOUT, enabled: false };
  }
}

function saveState(layout: Layout, enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, enabled }));
  } catch {
    // ignore quota errors
  }
}

export default function SubtitleCover() {
  const [layout,  setLayout]  = useState<Layout>(DEFAULT_LAYOUT);
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ── Hydrate from localStorage on mount ─────────────────────────
  useEffect(() => {
    const s = loadState();
    setLayout(s.layout);
    setEnabled(s.enabled);
    setHydrated(true);
  }, []);

  // ── Persist on change (after hydration) ─────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    saveState(layout, enabled);
  }, [layout, enabled, hydrated]);

  // ── Drag / resize handling ─────────────────────────────────────
  const onPointerMove = useCallback((ev: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPct = ((ev.clientX - d.startX) / d.parentW) * 100;
    const dyPct = ((ev.clientY - d.startY) / d.parentH) * 100;

    setLayout(prev => {
      const next = { ...prev };
      const o = d.origin;
      switch (d.kind) {
        case 'move':
          next.x = clamp(o.x + dxPct, 0, 100 - o.width);
          next.y = clamp(o.y + dyPct, 0, 100 - o.height);
          break;
        case 'n': {
          const newH = clamp(o.height - dyPct, MIN_H, o.y + o.height);
          next.y      = o.y + (o.height - newH);
          next.height = newH;
          break;
        }
        case 's':
          next.height = clamp(o.height + dyPct, MIN_H, 100 - o.y);
          break;
        case 'e':
          next.width  = clamp(o.width + dxPct, MIN_W, 100 - o.x);
          break;
        case 'w': {
          const newW = clamp(o.width - dxPct, MIN_W, o.x + o.width);
          next.x     = o.x + (o.width - newW);
          next.width = newW;
          break;
        }
        case 'ne': {
          next.width  = clamp(o.width + dxPct, MIN_W, 100 - o.x);
          const newH  = clamp(o.height - dyPct, MIN_H, o.y + o.height);
          next.y      = o.y + (o.height - newH);
          next.height = newH;
          break;
        }
        case 'nw': {
          const newW = clamp(o.width - dxPct, MIN_W, o.x + o.width);
          const newH = clamp(o.height - dyPct, MIN_H, o.y + o.height);
          next.x     = o.x + (o.width  - newW);
          next.y     = o.y + (o.height - newH);
          next.width = newW;
          next.height = newH;
          break;
        }
        case 'se':
          next.width  = clamp(o.width  + dxPct, MIN_W, 100 - o.x);
          next.height = clamp(o.height + dyPct, MIN_H, 100 - o.y);
          break;
        case 'sw': {
          const newW = clamp(o.width - dxPct, MIN_W, o.x + o.width);
          next.x     = o.x + (o.width - newW);
          next.width = newW;
          next.height = clamp(o.height + dyPct, MIN_H, 100 - o.y);
          break;
        }
      }
      return next;
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup',   onPointerUp);
  }, [onPointerMove]);

  const beginDrag = useCallback((ev: React.PointerEvent, kind: DragState['kind']) => {
    ev.preventDefault();
    ev.stopPropagation();
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    dragRef.current = {
      kind,
      startX:  ev.clientX,
      startY:  ev.clientY,
      origin:  layout,
      parentW: rect.width  || 1,
      parentH: rect.height || 1,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup',   onPointerUp);
  }, [layout, onPointerMove, onPointerUp]);

  // Cleanup listeners on unmount
  useEffect(() => () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup',   onPointerUp);
  }, [onPointerMove, onPointerUp]);

  function resetLayout() {
    setLayout(DEFAULT_LAYOUT);
  }

  // ── Render ──────────────────────────────────────────────────────
  // Always render the toggle button — without enabled the cover stays hidden.
  return (
    <>
      {/* Toggle button — fixed in the top-right of the parent container */}
      <button
        type="button"
        onClick={() => setEnabled(e => !e)}
        title={enabled ? 'Quitar tapa-subtítulos' : 'Tapar subtítulos'}
        className={`absolute top-2 right-2 z-30 px-2.5 py-1.5 rounded-lg text-[11px] font-bold backdrop-blur-sm transition-all flex items-center gap-1 ${
          enabled
            ? 'bg-white/90 text-[#5A3D7A] shadow-lg hover:bg-white'
            : 'bg-black/40 text-white/80 hover:bg-black/60'
        }`}
      >
        <span>{enabled ? '🔳' : '⬜'}</span>
        <span className="hidden sm:inline">{enabled ? 'Tapa activa' : 'Tapar subs'}</span>
      </button>

      {enabled && (
        <div
          ref={containerRef}
          className="absolute z-20 select-none"
          style={{
            left:   `${layout.x}%`,
            top:    `${layout.y}%`,
            width:  `${layout.width}%`,
            height: `${layout.height}%`,
          }}
        >
          {/* The white cover itself — onPointerDown drags it */}
          <div
            onPointerDown={(e) => beginDrag(e, 'move')}
            className="absolute inset-0 bg-white shadow-xl cursor-move rounded-sm"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
          />

          {/* Small floating action row (reset + close) — pointer-events controlled
              so dragging on the cover itself still works */}
          <div className="absolute -top-7 right-0 flex items-center gap-1 z-10">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={resetLayout}
              title="Volver al tamaño/posición por defecto"
              className="w-6 h-6 rounded-full bg-black/60 text-white text-[10px] font-bold hover:bg-black/80 transition-colors flex items-center justify-center"
            >
              ↺
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setEnabled(false)}
              title="Ocultar"
              className="w-6 h-6 rounded-full bg-red-500 text-white text-[12px] font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Resize handles */}
          <Handle pos="n"  beginDrag={beginDrag} />
          <Handle pos="s"  beginDrag={beginDrag} />
          <Handle pos="e"  beginDrag={beginDrag} />
          <Handle pos="w"  beginDrag={beginDrag} />
          <Handle pos="ne" beginDrag={beginDrag} />
          <Handle pos="nw" beginDrag={beginDrag} />
          <Handle pos="se" beginDrag={beginDrag} />
          <Handle pos="sw" beginDrag={beginDrag} />
        </div>
      )}
    </>
  );
}

// ── Resize handles ──────────────────────────────────────────────

function Handle({
  pos, beginDrag,
}: {
  pos:       ResizeHandle;
  beginDrag: (ev: React.PointerEvent, kind: DragState['kind']) => void;
}) {
  const isCorner = pos.length === 2;
  const size = isCorner ? 'w-3 h-3' : pos === 'n' || pos === 's' ? 'h-2 w-12' : 'w-2 h-12';
  const cursor = {
    n:  'cursor-ns-resize',
    s:  'cursor-ns-resize',
    e:  'cursor-ew-resize',
    w:  'cursor-ew-resize',
    ne: 'cursor-nesw-resize',
    sw: 'cursor-nesw-resize',
    nw: 'cursor-nwse-resize',
    se: 'cursor-nwse-resize',
  }[pos];

  // Positioning
  const positionStyle: React.CSSProperties = {};
  if (pos.includes('n')) positionStyle.top    = isCorner ? -4 : -3;
  if (pos.includes('s')) positionStyle.bottom = isCorner ? -4 : -3;
  if (pos.includes('e')) positionStyle.right  = isCorner ? -4 : -3;
  if (pos.includes('w')) positionStyle.left   = isCorner ? -4 : -3;

  // Center single-axis handles
  if (pos === 'n' || pos === 's') { positionStyle.left = '50%'; positionStyle.transform = 'translateX(-50%)'; }
  if (pos === 'e' || pos === 'w') { positionStyle.top  = '50%'; positionStyle.transform = 'translateY(-50%)'; }

  return (
    <div
      onPointerDown={(e) => beginDrag(e, pos)}
      className={`absolute ${size} ${cursor} bg-[#5A3D7A] hover:bg-[#7B5EA7] rounded-sm shadow-md`}
      style={positionStyle}
    />
  );
}
