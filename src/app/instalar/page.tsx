// FriendlyTeaching.cl — Public install page
//
// Standalone, un-auth-gated landing for "how to install the app".
// Teachers can share this link with students without having to log
// them in first. Also linked from the student sidebar when the app
// is NOT already running as a PWA.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import InstallGuide from '@/components/pwa/InstallGuide';

export const metadata: Metadata = {
  title: 'Instalar la app — FriendlyTeaching.cl',
  description: 'Cómo instalar FriendlyTeaching.cl en tu celular en 2 pasos.',
};

export default function InstalarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-white to-[#F0E8FF] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Image
            src="/logo-friendlyteaching.jpg"
            alt="FriendlyTeaching"
            width={56}
            height={56}
            className="rounded-2xl shadow-sm flex-shrink-0"
          />
          <div>
            <h1 className="font-fun text-2xl font-extrabold text-[#3D1F6B] leading-tight">
              Instala la app
            </h1>
            <p className="text-sm text-gray-500 leading-snug">
              FriendlyTeaching.cl queda como ícono en tu celular — más rápido
              y siempre a mano.
            </p>
          </div>
        </div>

        {/* Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <InstallGuide
            intro={
              <p className="text-sm text-gray-600 leading-snug">
                No bajas nada de Play Store ni App Store. Se instala directo
                desde el navegador. Elige tu plataforma:
              </p>
            }
          />
        </div>

        {/* Back to app */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5A3D7A] hover:text-[#4b3869]"
          >
            ← Volver a FriendlyTeaching.cl
          </Link>
        </div>

      </div>
    </div>
  );
}
