'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

export default function LyricsSlide({ slide }: Props) {
  const [showFull, setShowFull] = useState(false);
  const song = slide.songData;
  const lyrics = slide.content ?? '';
  const lines = lyrics.split('\n');
  const preview = lines.slice(0, 8).join('\n');

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      {/* Song header */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-[#F0E5FF] to-[#E8DAFF] rounded-2xl p-4 shadow-sm">
        {song?.albumArt && (
          <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md flex-shrink-0">
            <Image src={song.albumArt} alt={song.title ?? 'Album art'} width={80} height={80} className="object-cover w-full h-full" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-[#5A3D7A] text-lg leading-tight truncate">{song?.title ?? slide.title}</p>
          <p className="text-[#9B7CB8] text-sm">{song?.artist}</p>
          <p className="text-xs text-gray-400 mt-1 italic">{slide.subtitle}</p>
        </div>
      </div>

      {/* Audio player */}
      {song?.previewUrl && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preview (30s)</p>
          <audio controls src={song.previewUrl} className="w-full h-10 accent-[#5A3D7A]" />
        </div>
      )}

      {/* YouTube embed */}
      {song?.youtubeUrl && (
        <div className="rounded-xl overflow-hidden shadow-sm aspect-video">
          <iframe
            src={toEmbedUrl(song.youtubeUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Lyrics */}
      <div className="bg-white rounded-2xl border border-[#E8DAFF] p-4 shadow-sm">
        <p className="text-xs font-semibold text-[#9B7CB8] uppercase tracking-wider mb-3">Lyrics</p>
        <pre className="font-sans text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {showFull ? lyrics : preview}
        </pre>
        {lines.length > 8 && (
          <button
            onClick={() => setShowFull(v => !v)}
            className="mt-3 text-xs font-semibold text-[#5A3D7A] hover:underline"
          >
            {showFull ? 'Show less ▲' : 'Show full lyrics ▼'}
          </button>
        )}
      </div>
    </div>
  );
}

function toEmbedUrl(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}
