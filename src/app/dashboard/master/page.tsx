// FriendlyTeaching.cl — Master dashboard: teacher list
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useMasterStore } from '@/store/masterStore';
import { useAuthStore } from '@/store/authStore';
import TopBar from '@/components/layout/TopBar';
import type { FTUser } from '@/types/firebase';

export default function MasterDashboardPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const { setViewingTeacher } = useMasterStore();
  const [teachers, setTeachers] = useState<FTUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role && role !== 'master') {
      router.replace('/dashboard');
      return;
    }

    async function loadTeachers() {
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'teacher'))
        );
        const list = snap.docs.map((d: import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData>) => ({ uid: d.id, ...d.data() } as FTUser));
        list.sort((a: FTUser, b: FTUser) => a.fullName.localeCompare(b.fullName));
        setTeachers(list);
      } finally {
        setLoading(false);
      }
    }

    loadTeachers();
  }, [role, router]);

  function handleMonitor(teacher: FTUser) {
    setViewingTeacher(teacher.uid, teacher.fullName);
    router.push(`/dashboard/master/monitor?tid=${teacher.uid}&name=${encodeURIComponent(teacher.fullName)}`);
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Panel Master"
        subtitle="Monitoreo de profesores"
        breadcrumbs={[{ label: 'Panel Master' }]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No se encontraron profesores.</p>
          ) : (
            teachers.map((t) => (
              <div
                key={t.uid}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-gray-800">{t.fullName}</p>
                  <p className="text-sm text-gray-400">{t.email}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                    t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <button
                  onClick={() => handleMonitor(t)}
                  className="px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Monitorear →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
