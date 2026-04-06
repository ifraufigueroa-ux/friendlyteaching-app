// FriendlyTeaching.cl — PresentationProjector
// Branded projection frame with canvas annotation tools (pen, text, eraser)
// overlaid on top of any embeddable presentation (Canva, Google Slides, PPTX via Office Online)
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import NextImage from 'next/image';

// ── Types ──────────────────────────────────────────────────────
type DrawTool = 'pointer' | 'pen' | 'eraser';

interface TextAnnotation {
  id: string;
  x: number;       // canvas coordinates (for drawing text on canvas)
  y: number;
  cssX: number;    // CSS pixel coordinates (for positioning the input element)
  cssY: number;
  text: string;
  color: string;
  size: number;
  editing: boolean;
}

interface Props {
  src: string;
  title: string;
  isTeacher: boolean;
  onFinish?: () => void;
  // Live session props (teacher emits, student receives)
  onCanvasChange?: (dataUrl: string) => void;         // teacher: called after each stroke/text
  teacherCanvasOverlay?: string;                       // student: base64 img from Firestore
  studentAnnotationsEnabled?: boolean;                 // student: show annotation tools
  isLive?: boolean;                                    // teacher: show live indicator
  onOpenLivePanel?: () => void;                        // teacher: open live session panel
}

// ── Constants ──────────────────────────────────────────────────
const COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#3B82F6', // blue
  '#A855F7', // purple
  '#FFFFFF', // white
  '#1A1A1A', // black
];

const STROKE_SIZES = [
  { value: 3,  label: 'S' },
  { value: 6,  label: 'M' },
  { value: 12, label: 'L' },
  { value: 22, label: 'XL' },
];

// ── Helpers ─────────────────────────────────────────────────────
function isOfficeOnlineUrl(url: string) {
  return url.includes('view.officeapps.live.com');
}
function extractFileUrlFromOfficeOnline(url: string): string | null {
  try {
    const match = url.match(/[?&]src=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}
function buildGoogleDocsViewerUrl(fileUrl: string): string {
  return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

// ── Component ──────────────────────────────────────────────────
export default function PresentationProjector({
  src, title, isTeacher, onFinish,
  onCanvasChange, teacherCanvasOverlay, studentAnnotationsEnabled,
  isLive, onOpenLivePanel,
}: Props) {
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const lastPoint      = useRef<{ x: number; y: number } | null>(null);

  const textInputRef   = useRef<HTMLInputElement>(null);

  const [tool,         setTool]         = useState<DrawTool>('pointer');
  const [color,        setColor]        = useState('#EF4444');
  const [strokeSize,   setStrokeSize]   = useState(6);
  const [isDrawing,    setIsDrawing]    = useState(false);
  const [showToolbar,  setShowToolbar]  = useState(true);
  const [textMode,     setTextMode]     = useState(false);
  const [annotations,  setAnnotations]  = useState<TextAnnotation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Viewer switching (Office Online ↔ Google Docs viewer) ─────
  type ViewerMode = 'office' | 'google';
  const [viewerMode, setViewerMode] = useState<ViewerMode>('office');
  const isOffice   = isOfficeOnlineUrl(src);
  const rawFileUrl = isOffice ? extractFileUrlFromOfficeOnline(src) : null;
  const effectiveSrc = isOffice && viewerMode === 'google' && rawFileUrl
    ? buildGoogleDocsViewerUrl(rawFileUrl)
    : src;

  // ── Fullscreen API ─────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Resize canvas to match container ──────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const saved = canvas.toDataURL();
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── Coordinate helpers ─────────────────────────────────────────
  /** Returns canvas-space coordinates AND CSS-space coordinates relative to the container */
  const getPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number; cssX: number; cssY: number } => {
      const canvas = canvasRef.current!;
      const rect   = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      return {
        x: cssX * (canvas.width  / rect.width),
        y: cssY * (canvas.height / rect.height),
        cssX,
        cssY,
      };
    },
    []
  );

  // ── Drawing handlers ───────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (tool === 'pointer' && !textMode) return;
      const pos = getPos(e);

      if (textMode) {
        e.preventDefault(); // prevent canvas from stealing focus
        setAnnotations((prev) => [
          ...prev,
          { id: Date.now().toString(), x: pos.x, y: pos.y, cssX: pos.cssX, cssY: pos.cssY, text: '', color, size: strokeSize, editing: true },
        ]);
        // Focus the input after React renders it
        requestAnimationFrame(() => {
          textInputRef.current?.focus();
        });
        return;
      }

      setIsDrawing(true);
      lastPoint.current = pos;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, tool === 'eraser' ? strokeSize * 2 : strokeSize / 2, 0, Math.PI * 2);
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = color;
      }
      ctx.fill();
    },
    [tool, textMode, color, strokeSize, getPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || tool === 'pointer') return;
      const canvas = canvasRef.current;
      const ctx    = canvas?.getContext('2d');
      if (!ctx || !lastPoint.current) return;

      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth   = strokeSize * 4;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth   = strokeSize;
      }
      ctx.stroke();
      lastPoint.current = pos;
    },
    [isDrawing, tool, color, strokeSize, getPos]
  );

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
    // Sync canvas to live session after each stroke
    if (onCanvasChange && canvasRef.current) {
      onCanvasChange(canvasRef.current.toDataURL('image/png'));
    }
  }, [onCanvasChange]);

  // ── Clear canvas ──────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setAnnotations([]);
  }, []);

  // ── Render text annotation to canvas ──────────────────────────
  function commitText(ann: TextAnnotation) {
    if (!ann.text.trim()) {
      setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
      return;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.font      = `bold ${Math.max(16, ann.size * 4)}px Arial, sans-serif`;
    ctx.fillStyle = ann.color;
    ctx.shadowColor   = ann.color === '#FFFFFF' ? '#000' : '#fff';
    ctx.shadowBlur    = 3;
    ctx.fillText(ann.text, ann.x, ann.y);
    ctx.shadowBlur = 0;
    setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
    // Sync after text is committed
    if (onCanvasChange && canvasRef.current) {
      // Small rAF delay so the canvas has finished drawing the text
      requestAnimationFrame(() => {
        if (canvasRef.current && onCanvasChange) {
          onCanvasChange(canvasRef.current.toDataURL('image/png'));
        }
      });
    }
  }

  // ── Cursor + pointer events ────────────────────────────────────
  const canvasCursor =
    tool === 'pen'     ? 'crosshair'
    : tool === 'eraser' ? 'cell'
    : textMode          ? 'text'
    : 'default';

  const canvasPointerEvents =
    tool === 'pointer' && !textMode ? 'none' : 'auto';

  // ── Windowed vs fullscreen sizing ─────────────────────────────
  // In windowed mode the 16:9 box is constrained to ~75% of space (Off2Class style).
  // In fullscreen mode it fills everything.
  const presentationStyle = isFullscreen
    ? { aspectRatio: '16/9', maxWidth: '100%', maxHeight: '100%', width: '100%' }
    : { aspectRatio: '16/9', maxWidth: '88%', maxHeight: '88%', width: '88%' };

  return (
    <div ref={wrapperRef} className="flex h-full select-none">

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#F0F2F5' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#FFF0F5] border-b border-[#FFB3CC] flex-shrink-0">
          <span className="text-[#9B3060] text-xs font-semibold truncate">{title}</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isTeacher && isOffice && (
              <button
                onClick={() => setViewerMode((m) => m === 'office' ? 'google' : 'office')}
                className="text-[10px] px-2 py-0.5 rounded-md font-semibold text-[#C8547A] hover:bg-[#FFB3CC]/40 transition-colors"
              >
                {viewerMode === 'office' ? '🔄 Visor Google' : '🔄 Visor Office'}
              </button>
            )}
            {isTeacher && (
              <button
                onClick={() => setShowToolbar((v) => !v)}
                className="text-[10px] px-2 py-0.5 rounded-md font-semibold text-[#C8547A] hover:bg-[#FFB3CC]/40 transition-colors"
              >
                {showToolbar ? '▲ Herramientas' : '▼ Herramientas'}
              </button>
            )}
            {/* Live session button — teacher only */}
            {isTeacher && onOpenLivePanel && (
              <button
                onClick={onOpenLivePanel}
                title="Clase en vivo"
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                  isLive
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'text-[#C8547A] hover:bg-[#FFB3CC]/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                {isLive ? 'En vivo' : 'Iniciar en vivo'}
              </button>
            )}
            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="text-[10px] px-2 py-0.5 rounded-md font-semibold text-[#C8547A] hover:bg-[#FFB3CC]/40 transition-colors"
            >
              {isFullscreen ? '⊡ Ventana' : '⛶ Pantalla completa'}
            </button>
          </div>
        </div>

        {/* ── Projection area ── */}
        {/* Light neutral bg so the windowed presentation has a visible, comfortable frame */}
        <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ background: '#E8EBF0' }}>
          <div
            ref={containerRef}
            className="relative rounded-sm overflow-hidden"
            style={{
              ...presentationStyle,
              boxShadow: isFullscreen ? 'none' : '0 4px 32px rgba(0,0,0,0.18)',
            }}
          >
            {/* Presentation iframe */}
            <iframe
              src={effectiveSrc}
              title={title}
              allowFullScreen
              allow="autoplay; fullscreen"
              className="absolute inset-0 w-full h-full border-0"
              style={{ pointerEvents: canvasPointerEvents === 'none' ? 'auto' : 'none' }}
            />

            {/* Teacher canvas overlay for STUDENT live view */}
            {!isTeacher && teacherCanvasOverlay && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={teacherCanvasOverlay}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 10 }}
              />
            )}

            {/* Text mode indicator */}
            {isTeacher && textMode && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-xs font-semibold rounded-full pointer-events-none"
                style={{ zIndex: 25 }}
              >
                Haz clic para insertar texto
              </div>
            )}

            {/* Annotation canvas */}
            {isTeacher && (
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: canvasPointerEvents, cursor: canvasCursor }}
              />
            )}

            {/* Floating text annotation inputs */}
            {annotations.map((ann) => {
              if (!ann.editing) return null;
              const fontSize = Math.max(14, Math.min(ann.size * 3, 32));
              return (
                <input
                  key={ann.id}
                  ref={textInputRef}
                  autoFocus
                  defaultValue=""
                  placeholder="Escribe aquí..."
                  onBlur={(e) => commitText({ ...ann, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitText({ ...ann, text: e.currentTarget.value });
                    if (e.key === 'Escape') setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
                  }}
                  className="absolute outline-none font-bold rounded px-1"
                  style={{
                    left: Math.max(0, ann.cssX),
                    top: Math.max(0, ann.cssY - fontSize - 4),
                    color: ann.color,
                    fontSize,
                    borderBottom: `2px dashed ${ann.color}`,
                    background: 'rgba(0,0,0,0.5)',
                    minWidth: 150,
                    maxWidth: '60%',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    zIndex: 30,
                    pointerEvents: 'auto',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Student: annotation tools shown only when teacher has enabled them */}
        {!isTeacher && studentAnnotationsEnabled && (
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-900 border-t border-blue-700 flex-shrink-0">
            <span className="text-[10px] text-blue-300 font-semibold mr-1">Tus herramientas:</span>
            <ToolBtn active={tool === 'pointer' && !textMode} onClick={() => { setTool('pointer'); setTextMode(false); }} title="Navegar">↖</ToolBtn>
            <ToolBtn active={tool === 'pen'}    onClick={() => { setTool('pen');    setTextMode(false); }} title="Lápiz">✏️</ToolBtn>
            <ToolBtn active={textMode}          onClick={() => { setTextMode((v) => !v); setTool('pointer'); }} title="Texto">
              <span className="font-serif font-bold text-base leading-none">T</span>
            </ToolBtn>
            <ToolBtn active={tool === 'eraser'} onClick={() => { setTool('eraser'); setTextMode(false); }} title="Borrador">⬜</ToolBtn>
            <Divider />
            {COLORS.slice(0, 6).map((c) => (
              <button key={c} onClick={() => { setColor(c); if (tool !== 'pen') setTool('pen'); }}
                className="rounded-full flex-shrink-0 transition-all hover:scale-110"
                style={{ width: 16, height: 16, background: c, border: c === color ? '2px solid white' : '2px solid transparent' }}
              />
            ))}
            <Divider />
            <button onClick={clearCanvas} className="text-[10px] px-2 py-0.5 rounded text-red-400 hover:text-red-300 font-semibold">🗑</button>
          </div>
        )}

        {/* ── Annotation toolbar (teacher only) ── */}
        {isTeacher && showToolbar && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-t border-gray-700 flex-shrink-0 flex-wrap">

            <div className="flex gap-1">
              <ToolBtn active={tool === 'pointer' && !textMode} onClick={() => { setTool('pointer'); setTextMode(false); }} title="Navegar">↖</ToolBtn>
              <ToolBtn active={tool === 'pen'}    onClick={() => { setTool('pen');    setTextMode(false); }} title="Lápiz">✏️</ToolBtn>
              <ToolBtn active={textMode}          onClick={() => { setTextMode((v) => !v); setTool('pointer'); }} title="Texto">
                <span className="font-serif font-bold text-base leading-none">T</span>
              </ToolBtn>
              <ToolBtn active={tool === 'eraser'} onClick={() => { setTool('eraser'); setTextMode(false); }} title="Borrador">⬜</ToolBtn>
            </div>

            <Divider />

            <div className="flex gap-1 items-center">
              {COLORS.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => { setColor(c); if (tool !== 'pen') setTool('pen'); setTextMode(false); }}
                  className="rounded-full transition-all hover:scale-110 flex-shrink-0"
                  style={{
                    width: 20, height: 20,
                    background: c,
                    border: c === color ? '2px solid white' : c === '#FFFFFF' ? '1px solid #555' : '2px solid transparent',
                    boxShadow: c === color ? '0 0 0 2px #C8A8DC' : undefined,
                    transform: c === color ? 'scale(1.2)' : undefined,
                  }}
                />
              ))}
            </div>

            <Divider />

            <div className="flex items-center gap-1">
              {STROKE_SIZES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStrokeSize(value)}
                  title={`Grosor ${label}`}
                  className={`w-8 h-8 rounded-lg transition-all text-xs font-bold flex items-center justify-center flex-col gap-0.5
                    ${strokeSize === value ? 'bg-[#C8A8DC] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  <div className="rounded-full bg-current" style={{ width: Math.min(value, 18), height: Math.min(value, 18) }} />
                </button>
              ))}
            </div>

            <Divider />

            <button
              onClick={clearCanvas}
              className="px-3 h-8 bg-red-950/60 hover:bg-red-900/70 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition-colors"
            >
              🗑 Limpiar
            </button>

            {onFinish && (
              <button
                onClick={onFinish}
                className="ml-auto px-4 h-8 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] text-xs font-bold rounded-lg transition-colors"
              >
                ✓ Terminar lección
              </button>
            )}
          </div>
        )}

        {/* Student finish button */}
        {!isTeacher && onFinish && (
          <div className="flex justify-end px-4 py-2 bg-gray-900 border-t border-gray-700 flex-shrink-0">
            <button
              onClick={onFinish}
              className="px-5 py-2 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-sm font-bold transition-colors"
            >
              ✓ Terminar lección
            </button>
          </div>
        )}
      </div>{/* end main area */}

      {/* ── Right branding strip (pastel pink) ── */}
      <div className="w-16 flex-shrink-0 bg-[#FFE4EE] border-l border-[#FFB3CC] flex flex-col items-center py-3 gap-2">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#FFB3CC] shadow-sm flex-shrink-0">
          <NextImage src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={44} height={44} className="object-cover w-full h-full" />
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <span
            className="text-[#C8547A] text-[10px] font-extrabold tracking-[0.2em] uppercase whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            FriendlyTeaching.cl
          </span>
        </div>
        <div className="w-3 h-3 rounded-full bg-[#FFB3CC] flex-shrink-0" />
      </div>

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function ToolBtn({
  children, active, onClick, title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all
        ${active ? 'bg-[#C8A8DC] text-white shadow-sm' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-600 flex-shrink-0" />;
}
