// FriendlyTeaching.cl — WeekNavigator
'use client';
import { useScheduleStore } from '@/store/scheduleStore';

export default function WeekNavigator() {
  const { currentWeekStart, previousWeek, nextWeek } = useScheduleStore();

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 5);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const isCurrentWeek = (() => {
    const today = new Date();
    const monday = new Date(today);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toDateString() === currentWeekStart.toDateString();
  })();

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm mb-4">
      <button
        onClick={previousWeek}
        className="p-2 rounded-full hover:bg-[#F0E5FF] text-[#5A3D7A] transition-colors font-bold text-lg"
        title="Previous week"
      >
        ‹
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold text-[#5A3D7A]">
          Week of {fmt(currentWeekStart)} to {fmt(weekEnd)}
        </p>
        {isCurrentWeek && (
          <span className="text-xs text-[#9B7CB8]">Current week</span>
        )}
      </div>

      <button
        onClick={nextWeek}
        className="p-2 rounded-full hover:bg-[#F0E5FF] text-[#5A3D7A] transition-colors font-bold text-lg"
        title="Next week"
      >
        ›
      </button>
    </div>
  );
}
