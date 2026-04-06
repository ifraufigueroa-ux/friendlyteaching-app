// FriendlyTeaching.cl — Sync Status Indicator
// Shows canvas sync connection quality during live sessions.
'use client';
import type { SyncStatus } from '@/lib/utils/canvasSync';

interface Props {
  status: SyncStatus;
  lastSyncAt?: number;
  compact?: boolean;
}

const STATUS_CONFIG: Record<SyncStatus, { color: string; label: string; pulse: boolean }> = {
  connected:    { color: 'bg-green-400',  label: 'Conectado',    pulse: false },
  syncing:      { color: 'bg-blue-400',   label: 'Sincronizando', pulse: true },
  stale:        { color: 'bg-amber-400',  label: 'Reconectando', pulse: true },
  disconnected: { color: 'bg-red-400',    label: 'Desconectado', pulse: false },
};

export default function SyncStatusIndicator({ status, lastSyncAt, compact }: Props) {
  const config = STATUS_CONFIG[status];
  const timeSince = lastSyncAt ? Math.round((Date.now() - lastSyncAt) / 1000) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-1" title={config.label}>
        <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-[10px] font-semibold text-gray-600">{config.label}</span>
      {timeSince !== null && timeSince > 5 && (
        <span className="text-[9px] text-gray-400">({timeSince}s)</span>
      )}
    </div>
  );
}
