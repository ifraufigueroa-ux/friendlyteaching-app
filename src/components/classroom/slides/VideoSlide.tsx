// FriendlyTeaching.cl — VideoSlide (embedded video with title & question)
'use client';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function VideoSlide({ slide }: Props) {
  const videoUrl = slide.audioUrl ?? slide.content ?? '';

  // Extract YouTube/Vimeo embed URL
  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      {embedUrl ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg mb-4">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={slide.title ?? 'Video'}
          />
        </div>
      ) : videoUrl ? (
        <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg mb-4">
          <video
            src={videoUrl}
            controls
            className="w-full"
            preload="metadata"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-2xl text-gray-400">
          <p>Sin video configurado</p>
        </div>
      )}

      {slide.question && (
        <div className="bg-[#F0E5FF]/40 rounded-xl p-4">
          <p className="text-gray-700 font-semibold">{slide.question}</p>
        </div>
      )}
    </div>
  );
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Already an embed URL
  if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/')) return url;

  return null;
}
