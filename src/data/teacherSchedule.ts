// FriendlyTeaching.cl — Horario base del profesor (fuente de verdad local)
// dow: 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
// isRecurring: true = recurrente cada semana, false = única vez

export interface ScheduleEntry {
  dow: number;
  hour: number;
  name: string;
  isRecurring: boolean;
}

export const BASE_SCHEDULE: ScheduleEntry[] = [
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
  { dow: 5, hour: 15, name: 'C. Labbé',  isRecurring: true  },
  { dow: 5, hour: 16, name: 'Abdón',      isRecurring: true  },
  { dow: 5, hour: 18, name: 'Fernando',   isRecurring: true  },
  { dow: 5, hour: 20, name: 'Verónica',   isRecurring: true  },
  // Sábado
  { dow: 6, hour: 10, name: 'Joselin',    isRecurring: true  },
  { dow: 6, hour: 11, name: 'Guillermo',  isRecurring: true  },
  { dow: 6, hour: 12, name: 'Abdón',      isRecurring: true  },
  { dow: 6, hour: 13, name: 'Felipe',     isRecurring: true  },
];

/** Unique student names in the schedule */
export const SCHEDULE_STUDENT_COUNT = new Set(BASE_SCHEDULE.map((s) => s.name)).size;

/** Classes for a given day-of-week (1=Mon…6=Sat), sorted by hour */
export function getScheduleForDay(dow: number): ScheduleEntry[] {
  return BASE_SCHEDULE.filter((s) => s.dow === dow).sort((a, b) => a.hour - b.hour);
}

/** Next class from now (today or later this week) */
export function getNextScheduledClass(
  todayDow: number,
  currentHour: number,
): ScheduleEntry | undefined {
  return BASE_SCHEDULE
    .filter((s) =>
      s.dow > todayDow ||
      (s.dow === todayDow && s.hour > currentHour)
    )
    .sort((a, b) => a.dow - b.dow || a.hour - b.hour)[0];
}
