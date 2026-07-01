'use client';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';

export default function WhiteboardPage() {
  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Pizarra"
        subtitle="Dibuja, escribe y explica conceptos en tiempo real"
        breadcrumbs={[
          { label: 'Herramientas', href: '/dashboard/teacher/tools' },
          { label: 'Pizarra' },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto bg-mesh">
        <div className="max-w-2xl mx-auto glass-card rounded-2xl p-10 text-center space-y-4 shadow-glass">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#7B5EA7] to-[#9B7CB8] flex items-center justify-center text-4xl shadow-purple-md">
            🖊️
          </div>
          <div>
            <p className="text-xs font-bold text-[#9B7CB8] uppercase tracking-widest mb-1">Próximamente</p>
            <h2 className="text-2xl font-extrabold text-[#5A3D7A]">Pizarra Digital</h2>
          </div>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Estamos preparando una pizarra colaborativa con lápiz, formas, texto y exportación a PNG.
            Podrás usarla en vivo durante tus clases.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard/teacher/tools"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-purple-sm"
            >
              ← Volver a Herramientas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
