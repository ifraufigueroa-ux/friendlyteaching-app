// FriendlyTeaching.cl — Teacher Schedule Page
'use client';
import TopBar from '@/components/layout/TopBar';
import SchedulingGrid from '@/components/schedule/SchedulingGrid';

export default function TeacherSchedulePage() {
  const today = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Horario Semanal"
        subtitle={`Hoy es ${today}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Horario' },
        ]}
      />
      <div className="flex-1 p-2 sm:p-3 flex flex-col min-h-0">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 flex-1 flex flex-col w-full min-h-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 flex-1 flex flex-col min-h-0">
            <SchedulingGrid />
          </div>
        </div>
      </div>
    </div>
  );
}
