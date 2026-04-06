// FriendlyTeaching.cl — MediaUploader: reusable upload UI component
'use client';
import { useRef } from 'react';
import { useUpload, type UploadFolder } from '@/hooks/useUpload';

interface MediaUploaderProps {
  folder: UploadFolder;
  currentUrl?: string;
  onUpload: (url: string) => void;
  label?: string;
  accept?: string;
  placeholder?: string;
}

export default function MediaUploader({
  folder,
  currentUrl,
  onUpload,
  label,
  accept,
  placeholder,
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, error, upload, reset } = useUpload(folder);

  const isAudio = folder === 'audio';
  const defaultAccept = isAudio ? 'audio/mpeg,audio/mp4,audio/wav,audio/ogg' : 'image/jpeg,image/png,image/gif,image/webp';

  const handleFile = async (file: File) => {
    try {
      const url = await upload(file);
      onUpload(url);
    } catch {
      // error shown in state
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block">
          {label}
        </label>
      )}

      {/* Current media preview */}
      {currentUrl && !uploading && (
        <div className="flex items-center gap-2 bg-[#F9F5FF] rounded-xl px-3 py-2">
          {isAudio ? (
            <audio controls src={currentUrl} className="h-8 w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="preview" className="w-16 h-16 object-cover rounded-lg" />
          )}
          <button
            onClick={() => { onUpload(''); reset(); }}
            className="ml-auto text-xs text-red-400 hover:text-red-600 font-semibold flex-shrink-0"
            title="Quitar archivo"
          >
            ✕ Quitar
          </button>
        </div>
      )}

      {/* URL text field */}
      <input
        type="url"
        value={currentUrl ?? ''}
        onChange={e => { onUpload(e.target.value); reset(); }}
        placeholder={placeholder ?? (isAudio ? 'https://... URL del audio' : 'https://... URL de la imagen')}
        className="w-full text-sm border border-[#C8A8DC] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
      />

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl px-3 py-3 text-center cursor-pointer transition-colors
          ${uploading ? 'border-[#C8A8DC] bg-[#F9F5FF]' : 'border-gray-200 hover:border-[#C8A8DC] hover:bg-[#F9F5FF]'}
        `}
      >
        {uploading ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#9B7CB8]">Subiendo... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-[#C8A8DC] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-lg mb-0.5">{isAudio ? '🎵' : '🖼️'}</p>
            <p className="text-xs font-semibold text-gray-500">
              Subir {isAudio ? 'audio' : 'imagen'} a Firebase Storage
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isAudio ? 'MP3, M4A, WAV, OGG · máx 20MB' : 'JPG, PNG, GIF, WebP · máx 5MB'}
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept ?? defaultAccept}
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
