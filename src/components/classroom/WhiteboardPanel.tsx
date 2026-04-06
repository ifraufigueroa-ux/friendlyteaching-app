// FriendlyTeaching.cl — WhiteboardPanel
// Floating, draggable whiteboard for the teacher during slide-mode classes.
// Pen, eraser, basic shapes (line, rectangle), text, color palette, clear, close.
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type DrawTool = 'pen' | 'eraser' | 'line' | 'rect' | 'text';

interface Snapshot {
  imageData: ImageData;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = [
  '#1A1A1A', // black
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#3B82F6', // blue
  '#A855F7', // purple
  '#FFFFFF', // white
];

const SIZES = [
  { value: 2,  label: 'XS' },
  { value: 4,  label: 'S' },
  { value: 8,  label: 'M' },
  { value: 16, label: 'L' },
];

const DEFAULT_W = 640;
const DEFAULT_H = 420;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function WhiteboardPanel({ onClose }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const panelRef     = useRef<HTMLDivElement>(null);

  // Tool state
  const [tool,       setTool]       = useState<DrawTool>('pen');
  const [color,      setColor]      = useState('#1A1A1A');
  const [size,       setSize]       = useState(4);
  const [bgDark,     setBgDark]     = useState(false);

  // Drawing state
  const isDrawing    = useRef(false);
  const startPt      = useRef<{ x: number; y: number } | null>(null);
  const lastPt       = useRef<{ x: number; y: number } | null>(null);
  const snapshot     = useRef<Snapshot | null>(null); // for shape preview

  // Undo stack (up to 20 steps)
  const undoStack    = useRef<string[]>([]);
  const [canUndo,    setCanUndo]    = useState(false);

  // Panel position + drag
  const [pos,        setPos]        = useState<{ x: number; y: number }>(() => ({
    x: Math.max(20, window.innerWidth  / 2 - DEFAULT_W / 2),
    y: Math.max(20, window.innerHeight / 2 - DEFAULT_H / 2 - 40),
  }));
  const dragOffset   = useRef<{ dx: number; dy: number } | null>(null);

  // Panel size + resize
  const [panelSize,  setPanelSize]  = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const resizing     = useRef(false);
  const resizeOrigin = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);

  // Text input
  const [textInput,  setTextInput]  = useState<{ x: number; y: number } | null>(null);
  const [textVal,    setTextVal]    = useState('');

  // ── Canvas background ─────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const saved = canvas.toDataURL();
    canvas.width  = panelSize.w;
    canvas.height = panelSize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Fill background
    ctx.fillStyle = bgDark ? '#1E1E2E' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Restore previous drawing if resizing
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = saved;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    // Repaint background colour; preserve drawings
    const saved = canvas.toDataURL();
    ctx.fillStyle = bgDark ? '#1E1E2E' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = saved;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgDark]);

  // ── Coordinate helper ─────────────────────────────────────────────────────

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }, []);

  // ── Undo helpers ──────────────────────────────────────────────────────────

  function pushUndo() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL();
    undoStack.current = [...undoStack.current.slice(-19), url];
    setCanUndo(true);
  }

  function undo() {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas || undoStack.current.length === 0) return;
    const prev = undoStack.current.pop()!;
    setCanUndo(undoStack.current.length > 0);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  }

  // ── Clear canvas ──────────────────────────────────────────────────────────

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    pushUndo();
    ctx.fillStyle = bgDark ? '#1E1E2E' : '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── Drawing events ────────────────────────────────────────────────────────

  // Ref for text input to force focus
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      e.preventDefault(); // prevent canvas from stealing focus
      const pt = getPos(e);
      setTextInput(pt);
      setTextVal('');
      // Focus the input after React renders it
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
      });
      return;
    }
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    pushUndo();
    const pt = getPos(e);
    isDrawing.current  = true;
    startPt.current    = pt;
    lastPt.current     = pt;

    // Save snapshot for shape tools (so we can redraw preview each mousemove)
    if (tool === 'line' || tool === 'rect') {
      snapshot.current = { imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) };
    }

    // Dot on mousedown for pen/eraser
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (tool === 'eraser' ? size * 2 : size) / 2, 0, Math.PI * 2);
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = color;
      }
      ctx.fill();
    }
  }, [tool, color, size, getPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !lastPt.current || !startPt.current) return;

    const pt = getPos(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.lineCap    = 'round';
      ctx.lineJoin   = 'round';
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth   = size * 4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth   = size;
      }
      ctx.stroke();
      lastPt.current = pt;
    }

    if ((tool === 'line' || tool === 'rect') && snapshot.current) {
      // Restore snapshot and draw preview
      ctx.putImageData(snapshot.current.imageData, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth   = size;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPt.current.x, startPt.current.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      } else {
        const rx = Math.min(startPt.current.x, pt.x);
        const ry = Math.min(startPt.current.y, pt.y);
        const rw = Math.abs(pt.x - startPt.current.x);
        const rh = Math.abs(pt.y - startPt.current.y);
        ctx.strokeRect(rx, ry, rw, rh);
      }
    }
  }, [tool, color, size, getPos]);

  const handleMouseUp = useCallback(() => {
    isDrawing.current  = false;
    startPt.current    = null;
    lastPt.current     = null;
    snapshot.current   = null;
  }, []);

  // ── Text commit ───────────────────────────────────────────────────────────

  function commitText() {
    if (!textVal.trim() || !textInput) { setTextInput(null); return; }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    pushUndo();
    ctx.globalCompositeOperation = 'source-over';
    ctx.font         = `bold ${Math.max(14, size * 4)}px Arial, sans-serif`;
    ctx.fillStyle    = color;
    ctx.shadowColor  = color === '#FFFFFF' ? '#000' : '#fff';
    ctx.shadowBlur   = 2;
    ctx.fillText(textVal, textInput.x, textInput.y);
    ctx.shadowBlur   = 0;
    setTextInput(null);
    setTextVal('');
  }

  // ── Panel drag ────────────────────────────────────────────────────────────

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };

    function onMove(ev: MouseEvent) {
      if (!dragOffset.current) return;
      setPos({
        x: Math.max(0, ev.clientX - dragOffset.current.dx),
        y: Math.max(0, ev.clientY - dragOffset.current.dy),
      });
    }
    function onUp() {
      dragOffset.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Panel resize ──────────────────────────────────────────────────────────

  function onResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    resizing.current   = true;
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: panelSize.w, h: panelSize.h };

    function onMove(ev: MouseEvent) {
      if (!resizeOrigin.current) return;
      const nw = Math.max(360, resizeOrigin.current.w + (ev.clientX - resizeOrigin.current.mx));
      const nh = Math.max(260, resizeOrigin.current.h + (ev.clientY - resizeOrigin.current.my));
      setPanelSize({ w: nw, h: nh });
    }
    function onUp() {
      resizing.current = false;
      resizeOrigin.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Cursor ────────────────────────────────────────────────────────────────

  const cursor =
    tool === 'pen'     ? 'crosshair' :
    tool === 'eraser'  ? 'cell' :
    tool === 'text'    ? 'text' :
    'crosshair';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className="fixed z-[60] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden select-none flex flex-col"
      style={{ left: pos.x, top: pos.y, width: panelSize.w, height: panelSize.h + 90, background: bgDark ? '#1E1E2E' : '#FFFFFF' }}
    >
      {/* ── Title bar / drag handle ────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{ background: bgDark ? '#2D2D3F' : '#F3EAF9', borderBottom: '1px solid ' + (bgDark ? '#3D3D5F' : '#E0D5F0') }}
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🖊️</span>
          <span className="text-xs font-bold" style={{ color: bgDark ? '#C8A8DC' : '#5A3D7A' }}>Pizarra</span>
        </div>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setBgDark((v) => !v)}
            title="Cambiar fondo"
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors"
            style={{ color: bgDark ? '#C8A8DC' : '#7A5A90', background: bgDark ? '#3D3D5F' : '#E8D8F4' }}
          >
            {bgDark ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold disabled:opacity-30 transition-colors"
            style={{ color: bgDark ? '#C8A8DC' : '#7A5A90', background: bgDark ? '#3D3D5F' : '#E8D8F4' }}
          >
            ↩ Deshacer
          </button>
          <button
            onClick={clearCanvas}
            title="Limpiar pizarra"
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors"
            style={{ color: '#EF4444', background: bgDark ? '#3D2020' : '#FEE2E2' }}
          >
            🗑 Limpiar
          </button>
          <button
            onClick={onClose}
            title="Cerrar pizarra"
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors"
            style={{ color: bgDark ? '#A0A0B0' : '#888', background: bgDark ? '#3D3D5F' : '#F0F0F0' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Canvas area ────────────────────────────────────────────────────── */}
      <div className="relative" style={{ width: panelSize.w, height: panelSize.h, minHeight: panelSize.h, flexShrink: 0 }}>
        <canvas
          ref={canvasRef}
          width={panelSize.w}
          height={panelSize.h}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block"
          style={{ cursor, touchAction: 'none', width: panelSize.w, height: panelSize.h }}
        />

        {/* Floating text input */}
        {textInput && (
          <input
            ref={textInputRef}
            autoFocus
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            placeholder="Escribe aquí..."
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText();
              if (e.key === 'Escape') { setTextInput(null); setTextVal(''); }
            }}
            className="absolute outline-none font-bold rounded px-1"
            style={{
              left:        textInput.x,
              top:         Math.max(0, textInput.y - Math.max(14, size * 4) - 4),
              color,
              fontSize:    Math.max(14, size * 4),
              borderBottom: `2px dashed ${color}`,
              background:  bgDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
              minWidth:    120,
              maxWidth:    panelSize.w - textInput.x - 10,
              zIndex:      20,
              pointerEvents: 'auto',
            }}
          />
        )}

        {/* Resize handle (bottom-right corner) */}
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end pr-1 pb-1"
          onMouseDown={onResizeStart}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill={bgDark ? '#666' : '#ccc'}>
            <line x1="1" y1="9" x2="9" y2="1" strokeWidth="1.5" stroke="currentColor" />
            <line x1="5" y1="9" x2="9" y2="5" strokeWidth="1.5" stroke="currentColor" />
            <line x1="9" y1="9" x2="9" y2="9" strokeWidth="2"   stroke="currentColor" />
          </svg>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-wrap flex-shrink-0"
        style={{ background: bgDark ? '#2D2D3F' : '#F8F4FD', borderTop: '1px solid ' + (bgDark ? '#3D3D5F' : '#E8D5F0') }}
      >
        {/* Tools */}
        <div className="flex gap-1">
          {([
            { t: 'pen',    label: '✏️', title: 'Lápiz' },
            { t: 'eraser', label: '⬜', title: 'Borrador' },
            { t: 'line',   label: '╱', title: 'Línea' },
            { t: 'rect',   label: '▭', title: 'Rectángulo' },
            { t: 'text',   label: 'T',  title: 'Texto' },
          ] as { t: DrawTool; label: string; title: string }[]).map(({ t, label, title: ttl }) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              title={ttl}
              className="w-8 h-8 rounded-lg text-sm flex items-center justify-center font-bold transition-all"
              style={{
                background: tool === t ? '#C8A8DC' : (bgDark ? '#3D3D5F' : '#E8D5F0'),
                color:      tool === t ? '#FFFFFF'  : (bgDark ? '#C0B0D0' : '#5A3D7A'),
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 flex-shrink-0" style={{ background: bgDark ? '#4D4D6F' : '#D0C0E0' }} />

        {/* Color palette */}
        <div className="flex gap-1 items-center flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
              title={c}
              className="rounded-full transition-all hover:scale-110 flex-shrink-0"
              style={{
                width:     18,
                height:    18,
                background: c,
                border:    c === color ? '2px solid ' + (bgDark ? '#C8A8DC' : '#5A3D7A') : (c === '#FFFFFF' ? '1px solid #ccc' : '2px solid transparent'),
                boxShadow: c === color ? '0 0 0 2px ' + (bgDark ? '#5A3D7A' : '#C8A8DC') : undefined,
                transform: c === color ? 'scale(1.2)' : undefined,
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 flex-shrink-0" style={{ background: bgDark ? '#4D4D6F' : '#D0C0E0' }} />

        {/* Size */}
        <div className="flex gap-1">
          {SIZES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSize(value)}
              title={`Grosor ${label}`}
              className="w-8 h-8 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center flex-col gap-0.5"
              style={{
                background: size === value ? '#C8A8DC' : (bgDark ? '#3D3D5F' : '#E8D5F0'),
                color:      size === value ? '#FFFFFF'  : (bgDark ? '#C0B0D0' : '#5A3D7A'),
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width:      Math.min(value * 2, 16),
                  height:     Math.min(value * 2, 16),
                  background: 'currentColor',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
