// FriendlyTeaching.cl — WhiteboardPanel
// Floating, draggable whiteboard for the teacher during slide-mode classes.
// Object-based rendering: pen, eraser, line, rect, text — all selectable and movable.
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

// ── Element types ─────────────────────────────────────────────────────────────

type DrawTool = 'select' | 'pen' | 'eraser' | 'line' | 'rect' | 'text' | 'image';

interface PenEl   { id: string; type: 'pen';   points: { x: number; y: number }[]; color: string; size: number; isEraser?: boolean; }
interface LineEl  { id: string; type: 'line';  x1: number; y1: number; x2: number; y2: number; color: string; size: number; }
interface RectEl  { id: string; type: 'rect';  x: number; y: number; w: number; h: number; color: string; size: number; }
interface TextEl  { id: string; type: 'text';  x: number; y: number; text: string; color: string; fontSize: number; }
interface ImageEl { id: string; type: 'image'; x: number; y: number; w: number; h: number; src: string; }
type El = PenEl | LineEl | RectEl | TextEl | ImageEl;

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = ['#1A1A1A','#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#A855F7','#FFFFFF'];
const SIZES  = [2, 4, 8, 16];
const FSIZES = [14, 20, 28, 40, 56];

const DEFAULT_W = 640;
const DEFAULT_H = 420;

function mkId() { return Math.random().toString(36).slice(2, 10); }
function cloneEl(el: El): El {
  return el.type === 'pen' ? { ...el, points: el.points.map(p => ({ ...p })) } : { ...el };
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

function drawEl(ctx: CanvasRenderingContext2D, el: El, bgColor: string, imageCache?: Map<string, HTMLImageElement>) {
  ctx.save();
  switch (el.type) {
    case 'image': {
      const img = imageCache?.get(el.id);
      if (img) ctx.drawImage(img, el.x, el.y, el.w, el.h);
      break;
    }
    case 'pen': {
      if (el.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length; i++) ctx.lineTo(el.points[i].x, el.points[i].y);
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.strokeStyle = el.isEraser ? bgColor : el.color;
      ctx.lineWidth   = el.isEraser ? el.size * 4 : el.size;
      ctx.stroke();
      break;
    }
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2);
      ctx.strokeStyle = el.color; ctx.lineWidth = el.size; ctx.lineCap = 'round';
      ctx.stroke();
      break;
    }
    case 'rect': {
      ctx.strokeStyle = el.color; ctx.lineWidth = el.size;
      ctx.strokeRect(el.x, el.y, el.w, el.h);
      break;
    }
    case 'text': {
      ctx.font        = `bold ${el.fontSize}px Arial, sans-serif`;
      ctx.fillStyle   = el.color;
      ctx.shadowColor = el.color === '#FFFFFF' ? '#000' : '#fff';
      ctx.shadowBlur  = 2;
      ctx.fillText(el.text, el.x, el.y);
      ctx.shadowBlur  = 0;
      break;
    }
  }
  ctx.restore();
}

function getBBox(el: El, ctx: CanvasRenderingContext2D) {
  const p = 8;
  switch (el.type) {
    case 'image':
      return { x: el.x-p, y: el.y-p, w: el.w+p*2, h: el.h+p*2 };
    case 'pen': {
      if (!el.points.length) return { x: 0, y: 0, w: 0, h: 0 };
      const xs = el.points.map(q => q.x), ys = el.points.map(q => q.y);
      const minX = Math.min(...xs), minY = Math.min(...ys);
      return { x: minX-p, y: minY-p, w: Math.max(...xs)-minX+p*2, h: Math.max(...ys)-minY+p*2 };
    }
    case 'line':
      return { x: Math.min(el.x1,el.x2)-p, y: Math.min(el.y1,el.y2)-p, w: Math.abs(el.x2-el.x1)+p*2, h: Math.abs(el.y2-el.y1)+p*2 };
    case 'rect':
      return { x: el.x-p, y: el.y-p, w: el.w+p*2, h: el.h+p*2 };
    case 'text': {
      ctx.font = `bold ${el.fontSize}px Arial, sans-serif`;
      const tw = ctx.measureText(el.text).width;
      return { x: el.x-p, y: el.y-el.fontSize-p, w: (tw||80)+p*2, h: el.fontSize*1.3+p*2 };
    }
  }
}

function hitTest(el: El, px: number, py: number, ctx: CanvasRenderingContext2D) {
  const b = getBBox(el, ctx);
  return px >= b.x && px <= b.x+b.w && py >= b.y && py <= b.y+b.h;
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, el: El) {
  const b = getBBox(el, ctx);
  const pad = 4;
  ctx.save();
  ctx.strokeStyle = '#7C3AED';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(b.x-pad, b.y-pad, b.w+pad*2, b.h+pad*2);
  ctx.setLineDash([]);
  ctx.fillStyle = '#7C3AED';
  for (const [cx, cy] of [[b.x-pad,b.y-pad],[b.x+b.w+pad,b.y-pad],[b.x-pad,b.y+b.h+pad],[b.x+b.w+pad,b.y+b.h+pad]] as [number,number][]) {
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { onClose: () => void; }

export default function WhiteboardPanel({ onClose }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const panelRef     = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageCache   = useRef<Map<string, HTMLImageElement>>(new Map());

  const [tool,       setTool]       = useState<DrawTool>('pen');
  const [color,      setColor]      = useState('#1A1A1A');
  const [size,       setSize]       = useState(4);
  const [fontSize,   setFontSize]   = useState(28);
  const [bgDark,     setBgDark]     = useState(false);
  const [elements,   setElements]   = useState<El[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canUndo,    setCanUndo]    = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [textInput,  setTextInput]  = useState<{ x: number; y: number } | null>(null);
  const [textVal,    setTextVal]    = useState('');

  // Panel position + drag
  const [pos,       setPos]       = useState<{ x: number; y: number }>(() => ({
    x: Math.max(20, window.innerWidth  / 2 - DEFAULT_W / 2),
    y: Math.max(20, window.innerHeight / 2 - DEFAULT_H / 2 - 40),
  }));
  const [panelSize, setPanelSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });

  const undoStack    = useRef<El[][]>([]);
  const isDrawing    = useRef(false);
  const liveStroke   = useRef<El | null>(null);
  const dragRef      = useRef<{ id: string; ox: number; oy: number; origEl: El } | null>(null);
  const dragOffset   = useRef<{ dx: number; dy: number } | null>(null);
  const resizing     = useRef(false);
  const resizeOrigin = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);
  const committingRef  = useRef(false);
  const elementsRef    = useRef<El[]>([]);
  const selectedIdRef  = useRef<string | null>(null);
  const bgColorRef     = useRef('#FFFFFF');

  useEffect(() => { elementsRef.current   = elements;  }, [elements]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const bgColor = bgDark ? '#1E1E2E' : '#FFFFFF';
  useEffect(() => { bgColorRef.current = bgColor; }, [bgColor]);

  // ── Render ────────────────────────────────────────────────────────────────

  const doRender = useCallback((els: El[], live: El | null, selId: string | null, bg: string) => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const el of els) drawEl(ctx, el, bg, imageCache.current);
    if (live) drawEl(ctx, live, bg, imageCache.current);
    if (selId) {
      const sel = els.find(e => e.id === selId);
      if (sel) drawSelectionBox(ctx, sel);
    }
  }, []);

  useEffect(() => {
    doRender(elements, null, selectedId, bgColor);
  }, [elements, selectedId, bgColor, panelSize, doRender]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = panelSize.w;
    canvas.height = panelSize.h;
  }, [panelSize]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (!undoStack.current.length) return;
        const prev = undoStack.current.pop()!;
        setCanUndo(undoStack.current.length > 0);
        setElements(prev); setSelectedId(null);
        return;
      }
      if (e.key === 'Escape') { setSelectedId(null); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
        const selId = selectedIdRef.current;
        undoStack.current = [...undoStack.current.slice(-19), [...elementsRef.current]];
        setCanUndo(true);
        setElements(prev => prev.filter(el => el.id !== selId));
        setSelectedId(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ── Coord helper ──────────────────────────────────────────────────────────

  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }, []);

  // ── Undo / Clear ──────────────────────────────────────────────────────────

  function pushUndo(els: El[]) {
    undoStack.current = [...undoStack.current.slice(-19), els];
    setCanUndo(true);
  }

  function undo() {
    if (!undoStack.current.length) return;
    const prev = undoStack.current.pop()!;
    setCanUndo(undoStack.current.length > 0);
    setElements(prev); setSelectedId(null);
  }

  function clearCanvas() {
    pushUndo([...elements]);
    setElements([]); setSelectedId(null);
  }

  // ── Image upload ──────────────────────────────────────────────────────────

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxW  = Math.min(400, panelSize.w);
        const maxH  = Math.min(300, panelSize.h);
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const id = mkId();
        imageCache.current.set(id, img);
        const x = Math.round(panelSize.w / 2 - w / 2);
        const y = Math.round(panelSize.h / 2 - h / 2);
        pushUndo([...elementsRef.current]);
        setElements(prev => [...prev, { id, type: 'image', src, x, y, w, h }]);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  // ── Export PNG ────────────────────────────────────────────────────────────

  function exportPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    doRender(elements, null, null, bgColor);
    const link = document.createElement('a');
    link.download = `pizarra-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    doRender(elements, null, selectedId, bgColor);
  }

  // ── Mouse down ────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPos(e);

    if (tool === 'text') {
      e.preventDefault();
      setTextInput(pt); setTextVal('');
      requestAnimationFrame(() => textInputRef.current?.focus());
      return;
    }

    if (tool === 'select') {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const els = elementsRef.current;
      let found: El | null = null;
      for (let i = els.length - 1; i >= 0; i--) {
        if (hitTest(els[i], pt.x, pt.y, ctx)) { found = els[i]; break; }
      }
      if (found) {
        pushUndo(els.map(cloneEl));
        setSelectedId(found.id);
        setIsDragging(true);
        dragRef.current = { id: found.id, ox: pt.x, oy: pt.y, origEl: cloneEl(found) };
      } else {
        setSelectedId(null); dragRef.current = null;
      }
      return;
    }

    pushUndo([...elementsRef.current]);
    isDrawing.current = true;

    if (tool === 'pen' || tool === 'eraser') {
      liveStroke.current = { id: mkId(), type: 'pen', points: [pt], color: tool === 'eraser' ? bgColorRef.current : color, size, isEraser: tool === 'eraser' };
    } else if (tool === 'line') {
      liveStroke.current = { id: mkId(), type: 'line', x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, color, size };
    } else if (tool === 'rect') {
      liveStroke.current = { id: mkId(), type: 'rect', x: pt.x, y: pt.y, w: 0, h: 0, color, size };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, color, size, getPos]);

  // ── Mouse move ────────────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPos(e);

    if (tool === 'select' && dragRef.current) {
      const { id, ox, oy, origEl } = dragRef.current;
      const dx = pt.x - ox, dy = pt.y - oy;
      setElements(prev => prev.map(el => {
        if (el.id !== id) return el;
        switch (origEl.type) {
          case 'pen':   return { ...el, points: (origEl as PenEl).points.map(p => ({ x: p.x+dx, y: p.y+dy })) };
          case 'line':  { const o = origEl as LineEl;  return { ...el, x1: o.x1+dx, y1: o.y1+dy, x2: o.x2+dx, y2: o.y2+dy }; }
          case 'rect':  { const o = origEl as RectEl;  return { ...el, x: o.x+dx, y: o.y+dy }; }
          case 'text':  { const o = origEl as TextEl;  return { ...el, x: o.x+dx, y: o.y+dy }; }
          case 'image': { const o = origEl as ImageEl; return { ...el, x: o.x+dx, y: o.y+dy }; }
        }
      }));
      return;
    }

    if (!isDrawing.current || !liveStroke.current) return;
    const s = liveStroke.current;
    if (s.type === 'pen')  liveStroke.current = { ...s, points: [...s.points, pt] };
    if (s.type === 'line') liveStroke.current = { ...s, x2: pt.x, y2: pt.y };
    if (s.type === 'rect') liveStroke.current = { ...s, w: pt.x - s.x, h: pt.y - s.y };
    doRender(elementsRef.current, liveStroke.current, selectedIdRef.current, bgColorRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, doRender, getPos]);

  // ── Mouse up ──────────────────────────────────────────────────────────────

  const handleMouseUp = useCallback(() => {
    if (tool === 'select') {
      dragRef.current = null; setIsDragging(false); return;
    }
    isDrawing.current = false;
    const s = liveStroke.current;
    liveStroke.current = null;
    if (!s) return;
    let valid = false;
    if (s.type === 'pen')  valid = s.points.length > 1;
    if (s.type === 'line') valid = Math.hypot((s as LineEl).x2-(s as LineEl).x1, (s as LineEl).y2-(s as LineEl).y1) > 3;
    if (s.type === 'rect') valid = Math.abs((s as RectEl).w) > 3 && Math.abs((s as RectEl).h) > 3;
    if (valid) {
      setElements(prev => [...prev, s]);
    } else {
      undoStack.current.pop();
      setCanUndo(undoStack.current.length > 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  // ── Text commit ───────────────────────────────────────────────────────────

  function commitText() {
    if (committingRef.current) return;
    if (!textVal.trim() || !textInput) { setTextInput(null); return; }
    committingRef.current = true;
    pushUndo([...elementsRef.current]);
    setElements(prev => [...prev, { id: mkId(), type: 'text', x: textInput.x, y: textInput.y, text: textVal, color, fontSize }]);
    setTextInput(null); setTextVal('');
    requestAnimationFrame(() => { committingRef.current = false; });
  }

  // ── Panel drag ────────────────────────────────────────────────────────────

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    function onMove(ev: MouseEvent) {
      if (!dragOffset.current) return;
      setPos({ x: Math.max(0, ev.clientX - dragOffset.current.dx), y: Math.max(0, ev.clientY - dragOffset.current.dy) });
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
    resizing.current     = true;
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, w: panelSize.w, h: panelSize.h };
    function onMove(ev: MouseEvent) {
      if (!resizeOrigin.current) return;
      setPanelSize({
        w: Math.max(400, resizeOrigin.current.w + (ev.clientX - resizeOrigin.current.mx)),
        h: Math.max(260, resizeOrigin.current.h + (ev.clientY - resizeOrigin.current.my)),
      });
    }
    function onUp() {
      resizing.current = false; resizeOrigin.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ── Cursor / theme ────────────────────────────────────────────────────────

  const cursor =
    tool === 'select'  ? (isDragging ? 'grabbing' : 'default') :
    tool === 'pen'     ? 'crosshair' :
    tool === 'eraser'  ? 'cell' :
    tool === 'text'    ? 'text' :
    'crosshair';

  const btnBase  = bgDark ? '#3D3D5F' : '#E8D5F0';
  const btnTxt   = bgDark ? '#C0B0D0' : '#5A3D7A';
  const divider  = bgDark ? '#4D4D6F' : '#D0C0E0';

  // Total panel height: canvas + title bar (~40px) + toolbar (~50px)
  const TITLE_H   = 40;
  const TOOLBAR_H = 50;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleImageUpload}
    />
    <div
      ref={panelRef}
      className="fixed z-[60] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden select-none flex flex-col"
      style={{ left: pos.x, top: pos.y, width: panelSize.w, height: panelSize.h + TITLE_H + TOOLBAR_H, background: bgColor }}
    >
      {/* ── Title bar / drag handle ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing flex-shrink-0"
        style={{ height: TITLE_H, background: bgDark ? '#2D2D3F' : '#F3EAF9', borderBottom: `1px solid ${bgDark ? '#3D3D5F' : '#E0D5F0'}` }}
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🖊️</span>
          <span className="text-xs font-bold" style={{ color: bgDark ? '#C8A8DC' : '#5A3D7A' }}>Pizarra</span>
        </div>
        <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => setBgDark(v => !v)}
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors"
            style={{ color: bgDark ? '#C8A8DC' : '#7A5A90', background: btnBase }}
          >{bgDark ? '☀️ Claro' : '🌙 Oscuro'}</button>
          <button onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold disabled:opacity-30 transition-colors"
            style={{ color: bgDark ? '#C8A8DC' : '#7A5A90', background: btnBase }}
          >↩ Deshacer</button>
          <button onClick={clearCanvas}
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors"
            style={{ color: '#EF4444', background: bgDark ? '#3D2020' : '#FEE2E2' }}
          >🗑 Limpiar</button>
          <button onClick={exportPNG}
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors"
            style={{ color: '#FFFFFF', background: '#7C3AED' }}
          >⬇ PNG</button>
          <button onClick={onClose}
            className="text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors"
            style={{ color: bgDark ? '#A0A0B0' : '#888', background: bgDark ? '#3D3D5F' : '#F0F0F0' }}
          >✕</button>
        </div>
      </div>

      {/* ── Canvas area ─────────────────────────────────────────────────────── */}
      <div className="relative flex-shrink-0" style={{ width: panelSize.w, height: panelSize.h }}>
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

        {textInput && (
          <input
            ref={textInputRef}
            autoFocus
            value={textVal}
            onChange={e => setTextVal(e.target.value)}
            placeholder="Escribe aquí..."
            onBlur={commitText}
            onKeyDown={e => {
              if (e.key === 'Enter')  commitText();
              if (e.key === 'Escape') { setTextInput(null); setTextVal(''); }
            }}
            className="absolute outline-none font-bold rounded px-1"
            style={{
              left:          textInput.x,
              top:           Math.max(0, textInput.y - fontSize - 4),
              color,
              fontSize,
              fontFamily:    'Arial, sans-serif',
              borderBottom:  `2px dashed ${color}`,
              background:    bgDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
              minWidth:      120,
              maxWidth:      panelSize.w - textInput.x - 10,
              zIndex:        20,
              pointerEvents: 'auto',
            }}
          />
        )}

        {/* Resize handle */}
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

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 flex-wrap flex-shrink-0"
        style={{ height: TOOLBAR_H, background: bgDark ? '#2D2D3F' : '#F8F4FD', borderTop: `1px solid ${bgDark ? '#3D3D5F' : '#E8D5F0'}` }}
      >
        {/* Tools */}
        <div className="flex gap-1">
          {([
            { t: 'select', label: '↖',  title: 'Seleccionar y mover' },
            { t: 'pen',    label: '✏️', title: 'Lápiz' },
            { t: 'eraser', label: '⬜', title: 'Borrador' },
            { t: 'line',   label: '╱',  title: 'Línea' },
            { t: 'rect',   label: '▭',  title: 'Rectángulo' },
            { t: 'text',   label: 'T',  title: 'Texto' },
          ] as { t: DrawTool; label: string; title: string }[]).map(({ t, label, title: ttl }) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              title={ttl}
              className="w-8 h-8 rounded-lg text-sm flex items-center justify-center font-bold transition-all"
              style={{ background: tool === t ? '#C8A8DC' : btnBase, color: tool === t ? '#FFF' : btnTxt }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Insertar imagen"
            className="w-8 h-8 rounded-lg text-sm flex items-center justify-center font-bold transition-all"
            style={{ background: btnBase, color: btnTxt }}
          >
            🖼
          </button>
        </div>

        <div className="w-px h-6 flex-shrink-0" style={{ background: divider }} />

        {/* Colors */}
        <div className="flex gap-1 items-center">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
              title={c}
              className="rounded-full transition-all hover:scale-110 flex-shrink-0"
              style={{
                width: 16, height: 16, background: c,
                border:    c === color ? `2px solid ${bgDark ? '#C8A8DC' : '#5A3D7A'}` : c === '#FFFFFF' ? '1px solid #ccc' : '2px solid transparent',
                boxShadow: c === color ? `0 0 0 2px ${bgDark ? '#5A3D7A' : '#C8A8DC'}` : undefined,
                transform: c === color ? 'scale(1.2)' : undefined,
              }}
            />
          ))}
        </div>

        <div className="w-px h-6 flex-shrink-0" style={{ background: divider }} />

        {/* Stroke sizes — hidden when text tool active */}
        {tool !== 'text' && (
          <div className="flex gap-1">
            {SIZES.map(v => (
              <button
                key={v}
                onClick={() => setSize(v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: size === v ? '#C8A8DC' : btnBase, color: size === v ? '#FFF' : btnTxt }}
              >
                <div className="rounded-full" style={{ width: Math.min(v*2, 14), height: Math.min(v*2, 14), background: 'currentColor' }} />
              </button>
            ))}
          </div>
        )}

        {/* Font sizes — only when text tool active */}
        {tool === 'text' && (
          <div className="flex gap-1 items-center">
            <span className="text-[10px] font-semibold" style={{ color: btnTxt }}>Tamaño:</span>
            {FSIZES.map(fs => (
              <button
                key={fs}
                onClick={() => setFontSize(fs)}
                className="min-w-[28px] h-8 px-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: fontSize === fs ? '#C8A8DC' : btnBase, color: fontSize === fs ? '#FFF' : btnTxt }}
              >
                {fs}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
