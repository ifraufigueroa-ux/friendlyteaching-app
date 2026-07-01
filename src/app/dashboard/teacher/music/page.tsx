'use client';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';

export default function FriendlyricsPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Friendlyrics®"
        subtitle="Lecciones basadas en canciones reales"
        breadcrumbs={[
          { label: 'Herramientas', href: '/dashboard/teacher/tools' },
          { label: 'Friendlyrics' },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto bg-mesh">
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-10 text-center space-y-4 shadow-glass">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#EC4899] to-[#F472B6] flex items-center justify-center text-4xl shadow-lg">
            🎵
          </div>
          <div>
            <p className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-1">Próximamente</p>
            <h2 className="text-2xl font-extrabold text-[#5A3D7A]">Friendlyrics®</h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Busca una canción, genera ejercicios de listening, gramática y vocabulario con IA,
            y asígnalos a tus estudiantes. En construcción.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard/teacher/tools"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
              ← Volver a Herramientas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
