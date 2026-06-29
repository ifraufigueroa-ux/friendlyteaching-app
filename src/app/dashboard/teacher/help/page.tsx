'use client';
// FriendlyTeaching.cl — Teacher Help: Tutoriales
import { useState } from 'react';
import Image from 'next/image';
import TopBar from '@/components/layout/TopBar';

// ── Tutorial data ───────────────────────────────────────────────────

const TUTORIALS: { id: string; icon: string; title: string; description: string; Content: React.ComponentType }[] = [
  {
    id: 'fusionar-nombres',
    icon: '🔗',
    title: 'Cómo fusionar nombres duplicados',
    description: 'Unifica en un solo nombre a los estudiantes que aparecen escritos de forma distinta en tu horario.',
    Content: FusionarNombresTutorial,
  },
];

// ── Page ────────────────────────────────────────────────────────────

export default function TeacherHelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] via-white to-[#F0E8FF]">
      <TopBar
        title="Tutoriales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Ayuda' },
        ]}
      />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center gap-4">
            <Image
              src="/logo-friendlyteaching.jpg"
              alt="FriendlyTeaching"
              width={48}
              height={48}
              className="rounded-xl shadow-sm flex-shrink-0"
            />
            <div>
              <h1 className="text-xl font-extrabold text-[#3D1F6B]">Centro de Ayuda</h1>
              <p className="text-sm text-gray-400">Haz clic en un tutorial para ver los pasos.</p>
            </div>
          </div>

          {/* Accordion list */}
          <div className="space-y-3">
            {TUTORIALS.map(({ id, icon, title, description, Content }) => (
              <TutorialAccordion key={id} tutorial={{ icon, title, description, Content }} />
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 pb-8">
            <p className="text-[#C8A8DC] text-xs">FriendlyTeaching.cl</p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Accordion card ──────────────────────────────────────────────────

function TutorialAccordion({
  tutorial,
}: {
  tutorial: { icon: string; title: string; description: string; Content: React.ComponentType };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden bg-white
      ${open ? 'border-[#C8A8DC] shadow-md' : 'border-[#E8DAFF] hover:border-[#C8A8DC] shadow-sm hover:shadow-md'}`}>

      {/* ── Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left group"
      >
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-all
          ${open ? 'bg-[#5A3D7A] text-white shadow-sm' : 'bg-[#F0E5FF] group-hover:bg-[#5A3D7A] group-hover:text-white'}`}>
          {tutorial.icon}
        </span>

        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm transition-colors ${open ? 'text-[#3D1F6B]' : 'text-gray-700 group-hover:text-[#3D1F6B]'}`}>
            {tutorial.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{tutorial.description}</p>
        </div>

        {/* Chevron */}
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
          ${open ? 'bg-[#5A3D7A] text-white rotate-180' : 'bg-[#F0E5FF] text-[#5A3D7A]'}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* ── Content (animated roll-down, lazy mount) ── */}
      <div className={`transition-all duration-500 ease-in-out ${open ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        {open && (
          <div className="border-t border-[#F0E5FF] px-5 py-6 space-y-5">
            <tutorial.Content />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tutorial content ────────────────────────────────────────────────

function FusionarNombresTutorial() {
  return (
    <div className="space-y-4">
      <StepCard number={1} emoji="📅" title="Ve a tu Horario Semanal" color="purple">
        <p>En el menú lateral izquierdo, haz clic en <Strong>Horario</Strong>.</p>
        <MockNavItem icon="📅" label="Horario" />
      </StepCard>

      <StepCard number={2} emoji="🔗" title='Haz clic en "Fusionar nombres"' color="violet">
        <p>En la parte superior del horario verás el botón <Strong>🔗 Fusionar nombres</Strong>.</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <MockButton>🔗 Fusionar nombres</MockButton>
          <MockButton muted>⚙️ Disponibilidad</MockButton>
        </div>
      </StepCard>

      <StepCard number={3} emoji="👈" title="Selecciona los nombres duplicados" color="pink">
        <p>Toca los nombres de la columna izquierda que son la misma persona — se pondrán en azul.</p>
        <div className="space-y-1.5 mt-2">
          <NameChip name="Mila Mo" selected />
          <NameChip name="Mila Mogollón" selected />
          <NameChip name="Helena" />
        </div>
        <Tip>Puedes seleccionar 2 o más antes de agrupar.</Tip>
      </StepCard>

      <StepCard number={4} emoji="📦" title='Haz clic en "Agrupar"' color="purple">
        <p>Aparecerá el botón <Strong>🔗 Agrupar X nombres</Strong>. Repite para cada par de duplicados.</p>
        <div className="flex justify-center mt-2">
          <div className="bg-[#5A3D7A] text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md">
            🔗 Agrupar 2 nombres
          </div>
        </div>
      </StepCard>

      <StepCard number={5} emoji="⭐" title="Elige cuál nombre conservar" color="violet">
        <p>En la columna derecha, toca el nombre que quieres <Strong>conservar</Strong>.</p>
        <div className="space-y-1.5 mt-2">
          <CanonicalChip name="Mila Mo" isCanonical />
          <CanonicalChip name="Mila Mogollón" isCanonical={false} />
        </div>
        <Tip>Por defecto se elige el nombre más largo (con apellido completo).</Tip>
      </StepCard>

      <StepCard number={6} emoji="🔗" title="Fusionar todo" color="pink">
        <p>
          Haz clic en <Strong>🔗 Fusionar</Strong>. Se actualizarán las clases del horario
          y el historial completo sin pérdida de datos.
        </p>
        <div className="bg-[#F9F5FF] border border-[#E8DAFF] rounded-2xl p-3 mt-2 space-y-1.5 text-sm text-gray-600">
          <p>✅ Clases del <Strong>horario</Strong> actualizadas</p>
          <p>✅ <Strong>Historial</Strong> unificado</p>
        </div>
      </StepCard>

      <StepCard number={7} emoji="✅" title="¡Listo!" color="green">
        <p>Cierra la ventana y el horario mostrará los nombres unificados.</p>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center mt-2">
          <p className="text-2xl mb-1">✅</p>
          <p className="font-bold text-gray-800 text-sm">Registros actualizados</p>
        </div>
      </StepCard>

      {/* Cheat sheet */}
      <div className="bg-[#F9F5FF] rounded-2xl border border-[#E8DAFF] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9B7CB8] mb-3 text-center">
          Pares de nombres a fusionar
        </p>
        <div className="space-y-1.5">
          {[
            ['Andrée',         'Andrée Barraza'],
            ['Anto Acuña',     'Antonia Acuña'],
            ['Beatriz Sepulv', 'Beatriz Sepúlveda'],
            ['Fabricio',       'Fabricio Melendez'],
            ['Helena',         'Helena Barraza'],
            ['Joaquin',        'Joaquin Zapata'],
            ['Mila Mo',        'Mila Mogollón'],
          ].map(([v, c]) => (
            <div key={v} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-xs">
              <span className="text-red-400 font-mono">✗</span>
              <span className="text-gray-400 flex-1">{v}</span>
              <span className="text-[#9B7CB8]">→</span>
              <span className="font-semibold text-[#5A3D7A] flex-1 text-right">{c}</span>
              <span className="text-green-500 font-mono">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared micro-components ─────────────────────────────────────────

function StepCard({ number, emoji, title, color, children }: {
  number: number; emoji: string; title: string;
  color: 'purple' | 'violet' | 'pink' | 'green';
  children: React.ReactNode;
}) {
  const p = {
    purple: { ring: 'border-[#C8A8DC]', num: 'bg-[#5A3D7A] text-white', bg: 'bg-[#F9F5FF]' },
    violet: { ring: 'border-[#B89FD8]', num: 'bg-[#7B5EA7] text-white', bg: 'bg-[#F4EEFF]' },
    pink:   { ring: 'border-[#E8A8D0]', num: 'bg-[#C0609A] text-white', bg: 'bg-[#FFF0F8]' },
    green:  { ring: 'border-[#86C8A0]', num: 'bg-[#3D9A65] text-white', bg: 'bg-[#F0FFF6]' },
  }[color];
  return (
    <div className={`rounded-2xl border-2 ${p.ring} ${p.bg} px-4 py-4 space-y-2`}>
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-full ${p.num} flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-sm`}>
          {number}
        </div>
        <span className="text-lg">{emoji}</span>
        <h3 className="font-bold text-[#3D1F6B] text-sm">{title}</h3>
      </div>
      <div className="text-sm text-gray-600 space-y-2 leading-relaxed pl-10">
        {children}
      </div>
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="text-[#5A3D7A] font-semibold">{children}</strong>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-white/70 border border-[#E8DAFF] rounded-xl px-3 py-2 mt-1 text-xs text-[#7B5EA7]">
      <span className="flex-shrink-0 mt-0.5">💡</span>
      <span>{children}</span>
    </div>
  );
}

function MockNavItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#F0E5FF] w-fit mt-2">
      <span className="w-6 h-6 rounded-lg bg-[#5A3D7A] text-white flex items-center justify-center text-xs">{icon}</span>
      <span className="text-sm font-semibold text-[#3D1F6B]">{label}</span>
    </div>
  );
}

function MockButton({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${muted ? 'bg-gray-100 text-gray-500' : 'bg-[#F0E5FF] text-[#5A3D7A]'}`}>
      {children}
    </span>
  );
}

function NameChip({ name, selected }: { name: string; selected?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border-2
      ${selected ? 'bg-[#5A3D7A] border-[#5A3D7A] text-white font-semibold' : 'bg-white border-[#E0D5FF] text-gray-500'}`}>
      <span>{name}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selected ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>
        {selected ? '✓ seleccionado' : 'toca para seleccionar'}
      </span>
    </div>
  );
}

function CanonicalChip({ name, isCanonical }: { name: string; isCanonical: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border-2
      ${isCanonical ? 'bg-[#5A3D7A] border-[#5A3D7A] text-white font-semibold' : 'bg-white border-[#E0D5FF] text-gray-400 line-through'}`}>
      <span className="flex items-center gap-2">
        {isCanonical && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">conservar</span>}
        {name}
      </span>
    </div>
  );
}
