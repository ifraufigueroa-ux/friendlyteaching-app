// FriendlyTeaching.cl — Canvas Sync Utilities
// Delta encoding, compression, and connection management for whiteboard sync.

// ── Hash for change detection ────────────────────────────────

/** Simple DJB2 hash for quick comparison. Not cryptographic. */
export function fastHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ── Compression: Convert PNG to WebP (smaller payloads) ──────

export function canvasToCompressedDataUrl(
  canvas: HTMLCanvasElement,
  quality = 0.6,
): string {
  // Try WebP first (much smaller than PNG)
  const webp = canvas.toDataURL('image/webp', quality);
  if (webp.startsWith('data:image/webp')) return webp;
  // Fallback to JPEG (Safari < 16 doesn't support WebP export)
  return canvas.toDataURL('image/jpeg', quality);
}

// ── Delta Sync Manager ───────────────────────────────────────

export type SyncStatus = 'connected' | 'syncing' | 'stale' | 'disconnected';

export interface CanvasSyncState {
  status: SyncStatus;
  lastSyncAt: number;       // timestamp
  pendingFrames: number;    // frames waiting to be sent
  bytesSaved: number;       // cumulative bytes saved by delta encoding
}

/**
 * Creates a delta-aware canvas sync function.
 * Only sends data when the canvas content has actually changed.
 */
export function createDeltaSync(
  flushFn: (dataUrl: string) => Promise<void>,
  throttleMs = 500,
) {
  let lastHash = 0;
  let lastSyncTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: string | null = null;
  let bytesSaved = 0;
  let pendingFrames = 0;
  let status: SyncStatus = 'connected';
  let onStatusChange: ((state: CanvasSyncState) => void) | null = null;

  function notify() {
    onStatusChange?.({
      status,
      lastSyncAt: lastSyncTime,
      pendingFrames,
      bytesSaved,
    });
  }

  async function flush(dataUrl: string) {
    const hash = fastHash(dataUrl);
    if (hash === lastHash) {
      bytesSaved += dataUrl.length;
      pendingFrames = 0;
      notify();
      return; // No change — skip
    }

    status = 'syncing';
    notify();

    try {
      await flushFn(dataUrl);
      lastHash = hash;
      lastSyncTime = Date.now();
      status = 'connected';
      pendingFrames = 0;
    } catch {
      status = 'stale';
    }
    notify();
  }

  function sync(canvas: HTMLCanvasElement) {
    const dataUrl = canvasToCompressedDataUrl(canvas);
    pending = dataUrl;
    pendingFrames++;

    const now = Date.now();
    const elapsed = now - lastSyncTime;

    if (timer) clearTimeout(timer);

    if (elapsed >= throttleMs) {
      flush(dataUrl);
    } else {
      timer = setTimeout(() => {
        if (pending) flush(pending);
      }, throttleMs - elapsed);
    }
  }

  function setStatusListener(fn: (state: CanvasSyncState) => void) {
    onStatusChange = fn;
  }

  function destroy() {
    if (timer) clearTimeout(timer);
    onStatusChange = null;
  }

  return { sync, setStatusListener, destroy };
}
