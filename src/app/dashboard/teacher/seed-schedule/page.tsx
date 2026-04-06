// FriendlyTeaching.cl — Seed Schedule (one-time import)
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createBooking } from '@/hooks/useBookings';
import { auth } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';

// ── Schedule from image ──────────────────────────────────────────
// dow: 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
// isRecurring: yellow=true, red=false
const SCHEDULE: {
  dow: number; hour: number; name: string; isRecurring: boolean;
}[] = [
  // Lunes
  { dow: 1, hour: 14, name: 'D. Luna',    isRecurring: false },
  { dow: 1, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 1, hour: 18, name: 'Fernando',   isRecurring: true  },
  { dow: 1, hour: 19, name: 'Felipes',    isRecurring: true  },
  // Martes
  { dow: 2, hour: 10, name: 'Felipe',     isRecurring: false },
  { dow: 2, hour: 11, name: 'Andreina',   isRecurring: true  },
  { dow: 2, hour: 12, name: 'Betzabé',    isRecurring: false },
  { dow: 2, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 2, hour: 20, name: 'Guillermo',  isRecurring: true  },
  // Miércoles
  { dow: 3, hour: 11, name: 'Andreina',   isRecurring: true  },
  { dow: 3, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 3, hour: 18, name: 'Fernando',   isRecurring: true  },
  { dow: 3, hour: 19, name: 'D. Ibaceta', isRecurring: true  },
  { dow: 3, hour: 20, name: 'Verónica',   isRecurring: true  },
  // Jueves
  { dow: 4, hour: 15, name: 'Cristian',   isRecurring: true  },
  { dow: 4, hour: 16, name: 'Betzabé',    isRecurring: false },
  { dow: 4, hour: 18, name: 'Felipes',    isRecurring: true  },
  { dow: 4, hour: 19, name: 'C. Leon',    isRecurring: true  },
  { dow: 4, hour: 20, name: 'Guillermo',  isRecurring: true  },
  // Viernes
  { dow: 5, hour: 15, name: 'C. Labbé',   isRecurring: true  },
  { dow: 5, hour: 16, name: 'Abdón',      isRecurring: true  },
  { dow: 5, hour: 18, name: 'Fernando',   isRecurring: true  },
  { dow: 5, hour: 20, name: 'Verónica',   isRecurring: true  },
  // Sábado
  { dow: 6, hour: 10, name: 'Joselin',    isRecurring: true  },
  { dow: 6, hour: 11, name: 'Guillermo',  isRecurring: true  },
  { dow: 6, hour: 12, name: 'Abdón',      isRecurring: true  },
  { dow: 6, hour: 13, name: 'Felipe',     isRecurring: true  },
];

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getThisMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SeedSchedulePage() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleImport() {
    const uid = profile?.uid ?? auth.currentUser?.uid;
    if (!uid) {
      setErrorMsg('No se encontró el usuario. Recarga la página e intenta de nuevo.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setProgress(0);

    const weekStart = getThisMonday();

    try {
      for (let i = 0; i < SCHEDULE.length; i++) {
        const entry = SCHEDULE[i];
        await createBooking(uid, {
          studentName: entry.name,
          dayOfWeek: entry.dow,
          hour: entry.hour,
          weekStart,
          isRecurring: entry.isRecurring,
        });
        setProgress(Math.round(((i + 1) / SCHEDULE.length) * 100));
      }
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Importar Horario"
        subtitle="Carga tu horario actual de una sola vez"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Horario', href: '/dashboard/teacher/schedule' },
          { label: 'Importar' },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">

          {/* Preview table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <p className="font-bold text-[#5A3D7A] mb-4">
              📋 {SCHEDULE.length} clases a importar
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 font-semibold text-gray-500">Día</th>
                    <th className="pb-2 font-semibold text-gray-500">Hora</th>
                    <th className="pb-2 font-semibold text-gray-500">Estudiante</th>
                    <th className="pb-2 font-semibold text-gray-500">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {SCHEDULE.map((e, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-1.5 text-gray-700">{DAY_NAMES[e.dow]}</td>
                      <td className="py-1.5 font-mono text-gray-700">{e.hour}:00</td>
                      <td className="py-1.5 font-semibold text-[#5A3D7A]">{e.name}</td>
                      <td className="py-1.5">
                        {e.isRecurring
                          ? <span className="text-xs bg-[#C8A8DC] text-white px-2 py-0.5 rounded-full font-semibold">↻ Recurrente</span>
                          : <span className="text-xs bg-[#FFB8D9] text-[#5A3D7A] px-2 py-0.5 rounded-full font-semibold">• Una vez</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action */}
          {status === 'idle' && (
            <div className="space-y-3">
              {!profile?.uid && (
                <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                  ⚠️ Cargando perfil... si el botón no responde, recarga la página.
                </p>
              )}
              <button
                onClick={handleImport}
                className="w-full py-4 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white font-extrabold text-base rounded-2xl shadow-md transition-all hover:-translate-y-0.5"
              >
                🚀 Importar Horario Ahora
              </button>
            </div>
          )}

          {status === 'loading' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[#5A3D7A] font-semibold mb-3">Importando... {progress}%</p>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#C8A8DC] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-bold text-green-700 text-lg">¡Horario importado exitosamente!</p>
              <p className="text-green-600 text-sm mt-1 mb-4">
                {SCHEDULE.length} clases cargadas. Las recurrentes se repiten por 8 semanas.
              </p>
              <button
                onClick={() => router.push('/dashboard/teacher')}
                className="px-6 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Ir al Panel Principal →
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="font-bold text-red-600">Error al importar</p>
              <p className="text-red-500 text-sm mt-1 mb-4">{errorMsg}</p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
