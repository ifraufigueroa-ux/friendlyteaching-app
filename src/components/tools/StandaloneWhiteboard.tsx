'use client';
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';

// ── Element types ─────────────────────────────────────────────────────────────

type DrawTool = 'select' | 'pen' | 'eraser' | 'line' | 'rect' | 'text' | 'image';

interface PenEl   { id: string; type: 'pen';   points: { x: number; y: number }[]; color: string; size: number; isEraser?: boolean; }
interface LineEl  { id: string; type: 'line';  x1: number; y1: number; x2: number; y2: number; color: string; size: number; }
interface RectEl  { id: string; type: 'rect';  x: number; y: number; w: number; h: number; color: string; size: number; }
interface TextEl  { id: string; type: 'text';  x: number; y: number; text: string; color: string; fontSize: number; }
interface ImageEl { id: string; type: 'image'; x: number; y: number; w: number; h: number; src: string; }
type El = PenEl | LineEl | RectEl | TextEl | ImageEl;

type Handle = 'tl' | 'tr' | 'bl' | 'br';
type BBox   = { x: number; y: number; w: number; h: number };

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS  = ['#1A1A1A','#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#A855F7','#FFFFFF'];
const SIZES   = [2, 4, 8, 16];
const FSIZES  = [14, 20, 28, 40, 56];

function mkId() { return Math.random().toString(36).slice(2, 10); }

function cloneEl(el: El): El {
  if (el.type === 'pen') return { ...el, points: el.points.map(p => ({ ...p })) };
  return { ...el };
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
      ctx.strokeStyle = el.color;
      ctx.lineWidth   = el.size;
      ctx.lineCap     = 'round';
      ctx.stroke();
      break;
    }
    case 'rect': {
      ctx.strokeStyle = el.color;
      ctx.lineWidth   = el.size;
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
  for (const [cx, cy] of [[b.x-pad, b.y-pad],[b.x+b.w+pad, b.y-pad],[b.x-pad, b.y+b.h+pad],[b.x+b.w+pad, b.y+b.h+pad]] as [number,number][]) {
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ── Resize helpers ────────────────────────────────────────────────────────────

// Raw geometry bbox (no visual padding, always normalized to non-negative w/h).
function getRawBBox(el: El, ctx: CanvasRenderingContext2D): BBox {
  switch (el.type) {
    case 'image': return { x: el.x, y: el.y, w: el.w, h: el.h };
    case 'pen': {
      if (!el.points.length) return { x: 0, y: 0, w: 0, h: 0 };
      const xs = el.points.map(q => q.x), ys = el.points.map(q => q.y);
      const minX = Math.min(...xs), minY = Math.min(...ys);
      return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
    }
    case 'line':
      return { x: Math.min(el.x1, el.x2), y: Math.min(el.y1, el.y2), w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) };
    case 'rect': {
      const x = Math.min(el.x, el.x + el.w);
      const y = Math.min(el.y, el.y + el.h);
      return { x, y, w: Math.abs(el.w), h: Math.abs(el.h) };
    }
    case 'text': {
      ctx.font = `bold ${el.fontSize}px Arial, sans-serif`;
      const tw = ctx.measureText(el.text).width;
      // el.y is the baseline; visual box starts fontSize above and is ~1.3× tall.
      return { x: el.x, y: el.y - el.fontSize, w: tw || 80, h: el.fontSize * 1.3 };
    }
  }
}

function getHandlePositions(el: El, ctx: CanvasRenderingContext2D): Record<Handle, { x: number; y: number }> {
  const b = getBBox(el, ctx);
  const pad = 4;
  return {
    tl: { x: b.x - pad,       y: b.y - pad },
    tr: { x: b.x + b.w + pad, y: b.y - pad },
    bl: { x: b.x - pad,       y: b.y + b.h + pad },
    br: { x: b.x + b.w + pad, y: b.y + b.h + pad },
  };
}

function hitHandle(el: El, px: number, py: number, ctx: CanvasRenderingContext2D): Handle | null {
  const handles = getHandlePositions(el, ctx);
  const r = 12; // generous hit radius — the visual dot is 4px, but easier to grab
  for (const name of ['tl', 'tr', 'bl', 'br'] as Handle[]) {
    const p = handles[name];
    if (Math.hypot(px - p.x, py - p.y) < r) return name;
  }
  return null;
}

// Compute the new element after dragging `handle` to `curPt`. `origEl` and
// `origBBox` are captured at resize start so the math stays stable across many
// mousemove events.
function applyResize(origEl: El, handle: Handle, origBBox: BBox, curPt: { x: number; y: number }): El {
  const right  = origBBox.x + origBBox.w;
  const bottom = origBBox.y + origBBox.h;

  let newX = origBBox.x, newY = origBBox.y;
  let newW = origBBox.w, newH = origBBox.h;

  if (handle === 'br') { newW = curPt.x - origBBox.x;  newH = curPt.y - origBBox.y; }
  if (handle === 'tr') { newW = curPt.x - origBBox.x;  newY = curPt.y; newH = bottom - curPt.y; }
  if (handle === 'bl') { newX = curPt.x; newW = right - curPt.x; newH = curPt.y - origBBox.y; }
  if (handle === 'tl') { newX = curPt.x; newY = curPt.y; newW = right - curPt.x; newH = bottom - curPt.y; }

  const minSize = 8;
  newW = Math.max(minSize, newW);
  newH = Math.max(minSize, newH);

  const sx = origBBox.w > 0 ? newW / origBBox.w : 1;
  const sy = origBBox.h > 0 ? newH / origBBox.h : 1;
  const tf = (p: { x: number; y: number }) => ({
    x: (p.x - origBBox.x) * sx + newX,
    y: (p.y - origBBox.y) * sy + newY,
  });

  switch (origEl.type) {
    case 'image': return { ...origEl, x: newX, y: newY, w: newW, h: newH };
    case 'rect':  return { ...origEl, x: newX, y: newY, w: newW, h: newH };
    case 'line': {
      const p1 = tf({ x: origEl.x1, y: origEl.y1 });
      const p2 = tf({ x: origEl.x2, y: origEl.y2 });
      return { ...origEl, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    case 'pen':   return { ...origEl, points: origEl.points.map(tf) };
    case 'text': {
      // Uniform scale for text: pick the larger axis so dragging in either
      // direction visibly grows the glyphs. Keep top-left anchored.
      const scale       = Math.max(sx, sy);
      const newFontSize = Math.max(8, Math.round(origEl.fontSize * scale));
      const newBaseline = newY + newFontSize;
      return { ...origEl, x: newX, y: newBaseline, fontSize: newFontSize };
    }
  }
}

// ── Toolbar sub-components ────────────────────────────────────────────────────

function ToolBtn({ active, onClick, title, children, dark }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode; dark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-xl text-sm flex items-center justify-center font-bold transition-all duration-150 select-none
        ${active
          ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-500/30'
          : dark
            ? 'bg-white/8 text-[#C0B0D0] hover:bg-white/15 hover:text-white'
            : 'bg-white text-[#5A3D7A] hover:bg-[#F0E5FF] border border-[#E8D5F0]'
        }`}
    >
      {children}
    </button>
  );
}

function Divider({ dark }: { dark: boolean }) {
  return <div className={`w-px h-7 flex-shrink-0 mx-1 ${dark ? 'bg-white/10' : 'bg-[#E0D0F0]'}`} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StandaloneWhiteboard() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [textInput,   setTextInput]   = useState<{ x: number; y: number } | null>(null);
  const [textVal,     setTextVal]     = useState('');
  const [hoverHandle, setHoverHandle] = useState<Handle | null>(null);

  const undoStack       = useRef<El[][]>([]);
  const isDrawing       = useRef(false);
  const liveStroke      = useRef<El | null>(null);
  const dragRef         = useRef<{ id: string; ox: number; oy: number; origEl: El } | null>(null);
  const resizeRef       = useRef<{ id: string; handle: Handle; origEl: El; origBBox: BBox } | null>(null);
  const committingRef   = useRef(false);
  const elementsRef     = useRef<El[]>([]);
  const selectedIdRef   = useRef<string | null>(null);
  const bgColorRef      = useRef('#FFFFFF');
  const lastCursorRef   = useRef<{ x: number; y: number } | null>(null);
  const colorRef        = useRef('#1A1A1A');
  const fontSizeRef     = useRef(28);
  // Latest text-input state kept in refs so commitText() reads fresh values
  // even when React batches a blur with a subsequent state reset (which would
  // otherwise leave the closure staring at an empty textVal).
  const textValRef      = useRef('');
  const textInputPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { elementsRef.current   = elements;  }, [elements]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);
  useEffect(() => { textValRef.current = textVal; }, [textVal]);
  useEffect(() => { textInputPosRef.current = textInput; }, [textInput]);
  useEffect(() => { if (tool !== 'select') setHoverHandle(null); }, [tool]);

  // Chalkboard green for dark mode; clean off-white for whiteboard mode.
  const bgColor = bgDark ? '#0E3D2E' : '#FBFCFD';
  useEffect(() => { bgColorRef.current = bgColor; }, [bgColor]);

  // ── Render ────────────────────────────────────────────────────────────────

  // Draw everything. Coordinates are in CSS pixels — the canvas backing store
  // is scaled by devicePixelRatio inside the layout effect below, and the
  // context is pre-transformed so callers can keep using CSS units.
  const doRender = useCallback((els: El[], live: El | null, selId: string | null, bg: string) => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const w = canvas.width  / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (const el of els) drawEl(ctx, el, bg, imageCache.current);
    if (live) drawEl(ctx, live, bg, imageCache.current);
    if (selId) {
      const sel = els.find(e => e.id === selId);
      if (sel) drawSelectionBox(ctx, sel);
    }
  }, []);

  // ── Resize observer ───────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── devicePixelRatio change observer ──────────────────────────────────────
  // Browser zoom (Ctrl + scroll / Ctrl + +/-) changes window.devicePixelRatio
  // without necessarily changing the container's CSS pixel size. Without
  // this listener the canvas backing store wouldn't be re-scaled and the
  // drawing would stay at the old DPR — sharp on first paint, blurry after
  // zoom. We re-trigger the layout effect by reassigning canvasSize.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let mq: MediaQueryList | null = null;
    let cancelled = false;
    function listen() {
      if (cancelled) return;
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mq.addEventListener('change', onChange, { once: true });
    }
    function onChange() {
      // Bump canvasSize to a fresh object so useLayoutEffect re-runs.
      setCanvasSize(s => ({ ...s }));
      listen(); // re-arm for the next dpr step
    }
    listen();
    return () => {
      cancelled = true;
      mq?.removeEventListener('change', onChange);
    };
  }, []);

  // ── Size + paint, atomically (fixes the zoom-blank-canvas bug) ────────────
  // Setting canvas.width / height clears the backing store. If we set size in
  // one effect and re-paint in another, the resize can land AFTER the paint
  // and leave the canvas blank until the next state change. Doing both in a
  // single useLayoutEffect guarantees: resize → paint → screen, all before
  // the browser paints the frame.
  //
  // We also scale the backing store by devicePixelRatio so drawings stay
  // crisp when the browser is zoomed (Ctrl + scroll) or on hi-DPI displays.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.max(1, Math.round(canvasSize.w * dpr));
    const targetH = Math.max(1, Math.round(canvasSize.h * dpr));
    if (canvas.width !== targetW)  canvas.width  = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    doRender(elements, null, selectedId, bgColor);
  }, [canvasSize, elements, selectedId, bgColor, doRender]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (!undoStack.current.length) return;
        const prev = undoStack.current.pop()!;
        setCanUndo(undoStack.current.length > 0);
        setElements(prev);
        setSelectedId(null);
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

  // Returns coords in CSS pixels. The canvas context is pre-transformed by
  // devicePixelRatio in the layout effect, so all drawing math uses CSS
  // pixels too — keeping click coords in the same units avoids the
  // off-by-dpr placement bug on hi-DPI / zoomed browsers.
  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
    setElements(prev);
    setSelectedId(null);
  }

  function clearCanvas() {
    pushUndo([...elements]);
    setElements([]);
    setSelectedId(null);
  }

  // ── Image upload ──────────────────────────────────────────────────────────

  function placeImageFromSrc(src: string, atX?: number, atY?: number) {
    const img = new Image();
    img.onload = () => {
      // canvasSize is in CSS pixels — matches the coordinate system that
      // doRender draws into after our setTransform(dpr) in useLayoutEffect.
      const cw = canvasSize.w || 800;
      const ch = canvasSize.h || 600;
      const maxW  = Math.min(400, cw);
      const maxH  = Math.min(300, ch);
      const scale = Math.min(1, maxW / img.width, maxH / img.height);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const id = mkId();
      imageCache.current.set(id, img);
      const cx = atX ?? cw / 2;
      const cy = atY ?? ch / 2;
      const x = Math.round(cx - w / 2);
      const y = Math.round(cy - h / 2);
      pushUndo([...elementsRef.current]);
      setElements(prev => [...prev, { id, type: 'image', src, x, y, w, h }]);
    };
    img.src = src;
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => placeImageFromSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Paste from clipboard ─────────────────────────────────────────────────
  // Reads File-style image entries from the ClipboardEvent (works without
  // permission prompts) and falls back to navigator.clipboard.read() when the
  // user clicks the toolbar "Pegar" button (which requires user gesture).

  function pasteImageFromBlob(blob: Blob, atX?: number, atY?: number) {
    const reader = new FileReader();
    reader.onload = ev => placeImageFromSrc(ev.target?.result as string, atX, atY);
    reader.readAsDataURL(blob);
  }

  function pasteTextLines(text: string, atX?: number, atY?: number) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const cw = canvasSize.w || 800;
    const ch = canvasSize.h || 600;
    const fs = fontSizeRef.current;
    const baseX = atX ?? cw / 2 - 120;
    const baseY = atY ?? ch / 2 - lines.length * fs * 0.6;
    pushUndo([...elementsRef.current]);
    const newEls: El[] = lines.map((line, i) => ({
      id: mkId(),
      type: 'text',
      x: baseX,
      y: baseY + i * Math.round(fs * 1.3) + fs,
      text: line,
      color: colorRef.current,
      fontSize: fs,
    }));
    setElements(prev => [...prev, ...newEls]);
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      // Don't hijack pastes inside our inline text input — let the input handle them.
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const at = lastCursorRef.current;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            pasteImageFromBlob(file, at?.x, at?.y);
            return;
          }
        }
      }
      const txt = e.clipboardData?.getData('text/plain');
      if (txt && txt.trim()) {
        e.preventDefault();
        pasteTextLines(txt, at?.x, at?.y);
      }
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toolbar button — requires user gesture, so it gets clipboard read permission.
  async function pasteFromClipboardButton() {
    const at = lastCursorRef.current;
    const clip = navigator.clipboard as Clipboard & {
      read?: () => Promise<ClipboardItems>;
      readText?: () => Promise<string>;
    } | undefined;
    if (!clip) {
      alert('Tu navegador no soporta lectura del portapapeles. Usa Ctrl+V sobre la pizarra.');
      return;
    }
    try {
      if (typeof clip.read === 'function') {
        const items = await clip.read();
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            pasteImageFromBlob(blob, at?.x, at?.y);
            return;
          }
        }
      }
      if (typeof clip.readText === 'function') {
        const txt = await clip.readText();
        if (txt.trim()) pasteTextLines(txt, at?.x, at?.y);
      }
    } catch (err) {
      console.warn('[whiteboard] paste failed', err);
      alert('No se pudo leer el portapapeles. Prueba Ctrl+V dentro de la pizarra.');
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

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

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPos(e);
    if (tool === 'text') {
      e.preventDefault();
      // Commit any in-flight text before opening a new box, so clicking a new
      // spot never loses what the user just typed.
      if (textInputPosRef.current && textValRef.current.trim()) commitText();
      setTextInput(pt);
      setTextVal('');
      requestAnimationFrame(() => textInputRef.current?.focus());
      return;
    }
    if (tool === 'select') {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const els   = elementsRef.current;
      const selId = selectedIdRef.current;

      // If something is already selected, check for a resize-handle hit first
      // — handles sit at the corners of the current selection box.
      if (selId) {
        const selEl = els.find(el => el.id === selId);
        if (selEl) {
          const h = hitHandle(selEl, pt.x, pt.y, ctx);
          if (h) {
            pushUndo(els.map(cloneEl));
            resizeRef.current = {
              id: selId, handle: h,
              origEl: cloneEl(selEl),
              origBBox: getRawBBox(selEl, ctx),
            };
            setIsDragging(true);
            return;
          }
        }
      }

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
        setSelectedId(null);
        dragRef.current = null;
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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPos(e);
    lastCursorRef.current = pt; // track for paste-at-cursor
    if (tool === 'select') {
      if (resizeRef.current) {
        const { id, handle, origEl, origBBox } = resizeRef.current;
        setElements(prev => prev.map(el => el.id === id ? applyResize(origEl, handle, origBBox, pt) : el));
        return;
      }
      if (dragRef.current) {
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
      // Idle hover over a selected element's handles — surface a resize cursor.
      const ctx   = canvasRef.current?.getContext('2d');
      const selId = selectedIdRef.current;
      if (ctx && selId) {
        const selEl = elementsRef.current.find(el => el.id === selId);
        const h = selEl ? hitHandle(selEl, pt.x, pt.y, ctx) : null;
        if (h !== hoverHandle) setHoverHandle(h);
      } else if (hoverHandle) {
        setHoverHandle(null);
      }
      return;
    }
    if (!isDrawing.current || !liveStroke.current) return;
    const s = liveStroke.current;
    if (s.type === 'pen') {
      liveStroke.current = { ...s, points: [...s.points, pt] };
    } else if (s.type === 'line') {
      liveStroke.current = { ...s, x2: pt.x, y2: pt.y };
    } else if (s.type === 'rect') {
      liveStroke.current = { ...s, w: pt.x - s.x, h: pt.y - s.y };
    }
    doRender(elementsRef.current, liveStroke.current, selectedIdRef.current, bgColorRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, doRender, getPos]);

  const handleMouseUp = useCallback(() => {
    if (tool === 'select') {
      dragRef.current   = null;
      resizeRef.current = null;
      setIsDragging(false);
      return;
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
    // Read from refs — closure-captured state is stale during the React batch
    // between blur and the next mousedown, so we ended up committing empty text.
    const val = textValRef.current;
    const pos = textInputPosRef.current;
    if (!val.trim() || !pos) { setTextInput(null); setTextVal(''); return; }
    committingRef.current = true;
    pushUndo([...elementsRef.current]);
    setElements(prev => [...prev, {
      id: mkId(), type: 'text',
      x: pos.x, y: pos.y,
      text: val,
      color:    colorRef.current,
      fontSize: fontSizeRef.current,
    }]);
    setTextInput(null);
    setTextVal('');
    requestAnimationFrame(() => { committingRef.current = false; });
  }

  // ── Cursor ────────────────────────────────────────────────────────────────

  const handleCursor: string | null = hoverHandle
    ? ({ tl: 'nwse-resize', br: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize' }[hoverHandle])
    : null;

  const cursor =
    handleCursor      ? handleCursor :
    tool === 'select' ? (isDragging ? 'grabbing' : 'default') :
    tool === 'pen'    ? 'crosshair' :
    tool === 'eraser' ? 'cell' :
    tool === 'text'   ? 'text' :
    'crosshair';

  // ── Render ────────────────────────────────────────────────────────────────

  const dark = bgDark;

  return (
    <div className="flex flex-col h-full w-full" style={{ background: bgColor }}>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* ── Toolbar ───────────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-1.5 px-3 py-2 flex-wrap flex-shrink-0 select-none transition-colors duration-300
        ${dark
          ? 'bg-[#1A1A2E] border-b border-white/10'
          : 'bg-white border-b border-[#E8D5F0] shadow-sm'
        }`}
      >

        {/* ── Drawing tools group ── */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl ${dark ? 'bg-white/5' : 'bg-[#F5EEFF]'}`}>
          <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} title="Seleccionar y mover (S)" dark={dark}>↖</ToolBtn>
          <ToolBtn active={tool === 'pen'}    onClick={() => setTool('pen')}    title="Lápiz (P)" dark={dark}>✏️</ToolBtn>
          <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')} title="Borrador (E)" dark={dark}>⬜</ToolBtn>
          <ToolBtn active={tool === 'line'}   onClick={() => setTool('line')}   title="Línea (L)" dark={dark}>╱</ToolBtn>
          <ToolBtn active={tool === 'rect'}   onClick={() => setTool('rect')}   title="Rectángulo (R)" dark={dark}>▭</ToolBtn>
          <ToolBtn active={tool === 'text'}   onClick={() => setTool('text')}   title="Texto (T)" dark={dark}>T</ToolBtn>
          <ToolBtn active={false} onClick={() => fileInputRef.current?.click()} title="Insertar imagen" dark={dark}>🖼</ToolBtn>
          <ToolBtn active={false} onClick={pasteFromClipboardButton} title="Pegar del portapapeles (Ctrl+V)" dark={dark}>📋</ToolBtn>
        </div>

        <Divider dark={dark} />

        {/* ── Color swatches ── */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-2xl ${dark ? 'bg-white/5' : 'bg-[#F5EEFF]'}`}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
              title={c}
              className="rounded-full transition-all hover:scale-125 flex-shrink-0 focus:outline-none"
              style={{
                width: 20, height: 20,
                background: c,
                border:    c === '#FFFFFF' ? '1.5px solid #ccc' : '1.5px solid transparent',
                boxShadow: c === color
                  ? `0 0 0 2.5px ${dark ? '#fff' : '#5A3D7A'}, 0 0 0 4px ${dark ? '#5A3D7A' : '#C8A8DC'}`
                  : undefined,
                transform: c === color ? 'scale(1.25)' : undefined,
              }}
            />
          ))}
        </div>

        <Divider dark={dark} />

        {/* ── Stroke size (hidden for text) ── */}
        {tool !== 'text' && (
          <div className={`flex items-center gap-1 p-1 rounded-2xl ${dark ? 'bg-white/5' : 'bg-[#F5EEFF]'}`}>
            {SIZES.map(v => (
              <button
                key={v}
                onClick={() => setSize(v)}
                title={`Grosor ${v}px`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150
                  ${size === v
                    ? 'bg-[#7C3AED] shadow-md shadow-purple-500/25'
                    : dark
                      ? 'bg-white/8 hover:bg-white/15'
                      : 'bg-white hover:bg-[#F0E5FF] border border-[#E8D5F0]'
                  }`}
              >
                <div className="rounded-full" style={{
                  width: Math.min(v * 2, 18),
                  height: Math.min(v * 2, 18),
                  background: size === v ? '#fff' : (dark ? '#C0B0D0' : '#7C3AED'),
                }} />
              </button>
            ))}
          </div>
        )}

        {/* ── Font size (text tool only) ── */}
        {tool === 'text' && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-2xl ${dark ? 'bg-white/5' : 'bg-[#F5EEFF]'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wide mr-1 ${dark ? 'text-white/40' : 'text-[#9B7CB8]'}`}>Tamaño</span>
            {FSIZES.map(fs => (
              <button
                key={fs}
                onClick={() => setFontSize(fs)}
                className={`min-w-[34px] h-8 px-2 rounded-xl text-xs font-bold transition-all duration-150
                  ${fontSize === fs
                    ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-500/25'
                    : dark
                      ? 'bg-white/8 text-[#C0B0D0] hover:bg-white/15'
                      : 'bg-white text-[#5A3D7A] hover:bg-[#F0E5FF] border border-[#E8D5F0]'
                  }`}
              >
                {fs}
              </button>
            ))}
          </div>
        )}

        {/* ── Actions (right-aligned) ── */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setBgDark(v => !v)}
            title="Cambiar fondo"
            className={`h-9 px-3 rounded-xl text-xs font-semibold transition-all
              ${dark
                ? 'bg-white/10 text-yellow-300 hover:bg-white/20'
                : 'bg-[#F5EEFF] text-[#5A3D7A] hover:bg-[#E8D5F0] border border-[#E0D0F0]'
              }`}
          >
            {dark ? '☀️ Claro' : '🌙 Oscuro'}
          </button>

          <button
            onClick={undo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className={`h-9 px-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-30
              ${dark
                ? 'bg-white/10 text-[#C0B0D0] hover:bg-white/20'
                : 'bg-[#F5EEFF] text-[#5A3D7A] hover:bg-[#E8D5F0] border border-[#E0D0F0]'
              }`}
          >
            ↩ Deshacer
          </button>

          <button
            onClick={clearCanvas}
            title="Limpiar todo"
            className={`h-9 px-3 rounded-xl text-xs font-semibold transition-all
              ${dark ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'}`}
          >
            🗑 Limpiar
          </button>

          <button
            onClick={exportPNG}
            title="Exportar como PNG"
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#9B7CB8] text-white hover:from-[#6D28D9] hover:to-[#7C3AED] shadow-md shadow-purple-500/20 transition-all"
          >
            ⬇ Exportar PNG
          </button>
        </div>
      </div>

      {/* ── Canvas frame ────────────────────────────────────────────────────
          Outer wrapper draws the physical-looking frame (wood for chalkboard
          mode, brushed aluminium for whiteboard). Inner wrapper carries the
          recessed inset shadow that makes the board look set into the frame. */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{
          padding: dark ? 18 : 14,
          background: dark
            ? 'linear-gradient(135deg, #6B4423 0%, #4A2E18 45%, #2D1B0E 100%)'
            : 'linear-gradient(135deg, #E5E9EF 0%, #C8CFD8 50%, #98A2B0 100%)',
          boxShadow: dark
            ? 'inset 0 1px 0 rgba(255,200,150,0.12), inset 0 -2px 4px rgba(0,0,0,0.5), 0 6px 24px rgba(0,0,0,0.4)'
            : 'inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.08), 0 4px 18px rgba(0,0,0,0.15)',
        }}
      >
        {/* Tiny highlight strip on the frame (subtle wood grain / metal sheen) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: dark
              ? 'repeating-linear-gradient(95deg, transparent 0 22px, rgba(0,0,0,0.07) 22px 23px)'
              : 'repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.18) 40px 41px)',
          }}
        />

        {/* Board surface — chalkboard / whiteboard */}
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: 4,
            background: bgColor,
            boxShadow: dark
              ? 'inset 0 0 40px rgba(0,0,0,0.55), inset 0 0 12px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4)'
              : 'inset 0 0 24px rgba(80,80,100,0.12), inset 0 0 6px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block w-full h-full"
            style={{ cursor, touchAction: 'none' }}
          />

          {textInput && (
            <input
              ref={textInputRef}
              autoFocus
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
              placeholder="Escribe aquí…"
              onBlur={commitText}
              onKeyDown={e => {
                if (e.key === 'Enter')  commitText();
                if (e.key === 'Escape') { setTextInput(null); setTextVal(''); }
              }}
              className="absolute outline-none font-bold rounded-lg px-2 py-1 ring-2 ring-purple-400/60"
              style={{
                left:          textInput.x,
                top:           Math.max(0, textInput.y - fontSize - 4),
                color,
                fontSize,
                fontFamily:    'Arial, sans-serif',
                background:    dark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.06)',
                borderBottom:  `2px dashed ${color}`,
                minWidth:      120,
                zIndex:        20,
                pointerEvents: 'auto',
              }}
            />
          )}
        </div>

        {/* Decorative chalk/marker tray at the bottom of the frame */}
        <div
          aria-hidden
          className="absolute left-4 right-4 pointer-events-none flex items-center gap-2"
          style={{
            bottom: dark ? 4 : 2,
            height: dark ? 10 : 6,
          }}
        >
          {dark ? (
            <>
              <div className="h-2 w-10 rounded-sm" style={{ background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }} />
              <div className="h-2 w-8 rounded-sm" style={{ background: '#FCD34D', boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }} />
              <div className="h-2 w-9 rounded-sm" style={{ background: '#F87171', boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }} />
            </>
          ) : (
            <div className="h-1 w-full rounded-full" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18), rgba(0,0,0,0.08))' }} />
          )}
        </div>
      </div>
    </div>
  );
}
