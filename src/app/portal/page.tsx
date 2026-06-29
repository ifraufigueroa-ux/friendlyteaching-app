'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type View = 'select' | 'student';

export default function PortalPage() {
  const [view, setView] = useState<View>('select');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0E5FF] via-white to-[#E8F5E9] flex flex-col items-center justify-center p-6">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={36} height={36} className="rounded-xl object-cover" />
        <span className="font-extrabold text-[#5A3D7A] text-xl tracking-tight">FriendlyTeaching.cl</span>
      </Link>

      {view === 'select' && (
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-extrabold text-[#5A3D7A] text-center mb-2">Portal de Clases</h1>
          <p className="text-gray-500 text-center mb-10">¿Cómo quieres ingresar hoy?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Profesor */}
            <Link
              href="/auth/login"
              className="group flex flex-col items-center gap-4 bg-white rounded-3xl p-8 shadow-md border-2 border-transparent hover:border-[#C8A8DC] hover:shadow-xl transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F0E5FF] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-200">
                👩‍🏫
              </div>
              <div className="text-center">
                <p className="font-extrabold text-[#5A3D7A] text-lg">Profesor</p>
                <p className="text-xs text-gray-400 mt-1">Accede a tu panel de clases</p>
              </div>
            </Link>

            {/* Estudiante */}
            <button
              onClick={() => setView('student')}
              className="group flex flex-col items-center gap-4 bg-white rounded-3xl p-8 shadow-md border-2 border-transparent hover:border-[#A8E6A1] hover:shadow-xl transition-all duration-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-200">
                🎓
              </div>
              <div className="text-center">
                <p className="font-extrabold text-[#2D6E2A] text-lg">Estudiante</p>
                <p className="text-xs text-gray-400 mt-1">Elige tu plataforma de acceso</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {view === 'student' && (
        <div className="w-full max-w-lg">
          <button
            onClick={() => setView('select')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#5A3D7A] font-semibold mb-8 transition-colors"
          >
            ← Volver
          </button>

          <h1 className="text-3xl font-extrabold text-[#2D6E2A] text-center mb-2">Acceso Estudiante</h1>
          <p className="text-gray-500 text-center mb-10">Elige la plataforma que necesitas</p>

          <div className="flex flex-col gap-4">
            {/* Portal FriendlyTeaching */}
            <Link
              href="/auth/login"
              className="group flex items-center gap-5 bg-white rounded-2xl px-6 py-5 shadow-md border-2 border-transparent hover:border-[#C8A8DC] hover:shadow-xl transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#F0E5FF] flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                🏫
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-[#5A3D7A] text-base">Portal FriendlyTeaching</p>
                <p className="text-xs text-gray-400 mt-0.5">Tu progreso, tareas y clases</p>
              </div>
              <span className="ml-auto text-[#C8A8DC] font-bold text-lg flex-shrink-0">→</span>
            </Link>

            {/* Off2Class */}
            <a
              href="https://app.off2class.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-5 bg-white rounded-2xl px-6 py-5 shadow-md border-2 border-transparent hover:border-[#FFB347] hover:shadow-xl transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FFF5E5] flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                📚
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-[#7A3B00] text-base">Off2Class</p>
                <p className="text-xs text-gray-400 mt-0.5">Tareas y ejercicios online</p>
              </div>
              <span className="ml-auto text-[#FFB347] font-bold text-lg flex-shrink-0">→</span>
            </a>

            {/* Sounter */}
            <a
              href="https://sounter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-5 bg-white rounded-2xl px-6 py-5 shadow-md border-2 border-transparent hover:border-[#A5D6A7] hover:shadow-xl transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                🔊
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-[#2E7D32] text-base">Sounter</p>
                <p className="text-xs text-gray-400 mt-0.5">Pronunciación y speaking</p>
              </div>
              <span className="ml-auto text-[#A5D6A7] font-bold text-lg flex-shrink-0">→</span>
            </a>

            {/* Ellii */}
            <a
              href="https://ellii.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-5 bg-white rounded-2xl px-6 py-5 shadow-md border-2 border-transparent hover:border-[#A8D8EA] hover:shadow-xl transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#E8F4F8] flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                🌐
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-[#1A6B9A] text-base">Ellii</p>
                <p className="text-xs text-gray-400 mt-0.5">Práctica de inglés interactiva</p>
              </div>
              <span className="ml-auto text-[#A8D8EA] font-bold text-lg flex-shrink-0">→</span>
            </a>
          </div>
        </div>
      )}

      <p className="mt-12 text-xs text-gray-300">© {new Date().getFullYear()} FriendlyTeaching.cl</p>
    </div>
  );
}
