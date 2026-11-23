// FriendlyTeaching.cl — PWA install guide (shared UI)
//
// Two per-platform cards (Android Chrome + iOS Safari) with numbered
// steps, plus a copy-link block. Used by:
//   · /instalar (public standalone page students can land on)
//   · /dashboard/teacher/help (Tutoriales accordion)
//
// Keeps the copy, order, and visual cues in one place so the two
// surfaces don't drift.

'use client';

import { useState } from 'react';
import { Smartphone, Apple, MoreVertical, Share, PlusSquare, Copy, Check } from 'lucide-react';

const INSTALL_URL = 'https://friendlyteaching.cl';

function InstallStepsCard({
  platform, accent, icon, steps, menuIcon, menuLabel,
}: {
  platform:  'Android' | 'iPhone / iPad';
  accent:    'emerald' | 'slate';
  icon:      React.ReactNode;
  menuIcon:  React.ReactNode;
  menuLabel: string;
  steps:     { label: React.ReactNode; sub?: string }[];
}) {
  const tone = accent === 'emerald'
    ? { bg: 'bg-emerald-50', chip: 'bg-emerald-100 text-emerald-700' }
    : { bg: 'bg-slate-50',   chip: 'bg-slate-100 text-slate-700' };
  return (
    <div className={`rounded-2xl border border-gray-200 p-4 ${tone.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${tone.chip} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <p className="text-sm font-black text-gray-800">{platform}</p>
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`w-5 h-5 rounded-full ${tone.chip} text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-800 leading-snug">
                {s.label}
              </p>
              {s.sub && (
                <p className="text-[11px] text-gray-500 mt-0.5">{s.sub}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-3 pt-3 border-t border-gray-200/70 flex items-center gap-2 text-[11px] text-gray-500">
        <span className="font-semibold">Busca este ícono:</span>
        <span className={`w-6 h-6 rounded ${tone.chip} inline-flex items-center justify-center`}>
          {menuIcon}
        </span>
        <span className="italic">{menuLabel}</span>
      </div>
    </div>
  );
}

export default function InstallGuide({ intro }: { intro?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(INSTALL_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }
  return (
    <div className="space-y-4">
      {intro ?? (
        <p className="text-sm text-gray-600 leading-snug">
          La app se instala desde el navegador del celular — sin Play Store
          ni App Store. Dos pasos y queda como ícono en la pantalla principal.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InstallStepsCard
          platform="Android"
          accent="emerald"
          icon={<Smartphone className="w-4 h-4" strokeWidth={2.25} />}
          menuIcon={<MoreVertical className="w-3.5 h-3.5" strokeWidth={2.5} />}
          menuLabel="Menú de Chrome"
          steps={[
            { label: 'Abre friendlyteaching.cl en Chrome.' },
            { label: 'Toca el menú ⋮ arriba a la derecha.' },
            { label: 'Elige "Instalar app" o "Añadir a pantalla principal".', sub: 'Queda con el logo igual que cualquier app.' },
          ]}
        />
        <InstallStepsCard
          platform="iPhone / iPad"
          accent="slate"
          icon={<Apple className="w-4 h-4" strokeWidth={2.25} />}
          menuIcon={<Share className="w-3.5 h-3.5" strokeWidth={2.5} />}
          menuLabel="Botón de compartir"
          steps={[
            { label: 'Abre friendlyteaching.cl en Safari.', sub: 'En iOS tiene que ser Safari, no Chrome.' },
            { label: 'Toca el botón de compartir ⬆ abajo al centro.' },
            { label: 'Baja y elige "Añadir a pantalla de inicio".' },
          ]}
        />
      </div>

      <div className="rounded-xl border border-gray-200 p-3 flex items-center gap-3 bg-white">
        <PlusSquare className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2.25} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Link para compartir</p>
          <p className="text-sm font-semibold text-gray-700 truncate">{INSTALL_URL.replace(/^https?:\/\//, '')}</p>
        </div>
        <button
          type="button"
          onClick={copyUrl}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white inline-flex items-center gap-1 transition-colors bg-[#5A3D7A] hover:bg-[#4b3869] flex-shrink-0"
        >
          {copied
            ? <><Check className="w-3 h-3" strokeWidth={2.5} /> Copiado</>
            : <><Copy className="w-3 h-3" strokeWidth={2.5} /> Copiar link</>}
        </button>
      </div>
    </div>
  );
}
