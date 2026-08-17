// FriendlyTeaching.cl — Feed de "Palabra del día" para el profe
'use client';
import { useMemo } from 'react';
import { useTeacherWordSubmissions } from '@/hooks/useTeacherWordSubmissions';
import type { FTUser } from '@/types/firebase';
import type { Timestamp } from 'firebase/firestore';

interface Props {
  students: FTUser[];
  /** Número máximo de respuestas a mostrar. Default 15. */
  max?: number;
  /** Si true, muestra un estado vacío en lugar de auto-esconderse. Útil para la
   *  página dedicada; en el dashboard queremos que la card no aparezca vacía. */
  showEmpty?: boolean;
}

function formatDate(ts?: Timestamp): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

export default function TeacherWordOfDayFeed({ students, max = 15, showEmpty = false }: Props) {
  const studentIds = useMemo(
    () => students.filter(s => s.status === 'approved').map(s => s.uid),
    [students],
  );
  const { submissions, loading } = useTeacherWordSubmissions(studentIds, max);

  if (loading) return null;

  if (submissions.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-3xl mb-3">📭</p>
        <p className="text-sm text-gray-500">
          Aún no hay respuestas de la palabra del día.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Cuando tus estudiantes envíen ejemplos, van a aparecer acá.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-gray-700 text-sm">📖 Palabra del día — respuestas recientes</p>
        <span className="text-xs text-gray-400">{submissions.length}</span>
      </div>
      <div className="space-y-2">
        {submissions.map(sub => {
          const student = students.find(s => s.uid === sub.studentId);
          return (
            <div key={sub.id} className="px-3 py-2.5 bg-[#F9F5FF] border border-[#EADBFB] rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-[#5A3D7A] truncate">
                  {student?.fullName ?? 'Estudiante'}
                </p>
                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                  {formatDate(sub.createdAt)}
                </span>
              </div>
              <p className="text-[10px] text-[#9B7CB8] font-bold uppercase tracking-wider mb-0.5">
                {sub.word}
              </p>
              <p className="text-sm text-gray-700 italic">&ldquo;{sub.example}&rdquo;</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
