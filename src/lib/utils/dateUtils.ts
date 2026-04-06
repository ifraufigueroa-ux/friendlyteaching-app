// FriendlyTeaching.cl — Date Utilities

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Returns the Monday of the week containing the given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns array of 7 dates starting from weekStart (Mon–Sun) */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Returns Monday–Saturday (6 days) */
export function getWorkingDays(weekStart: Date): Date[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** "Lun 3 Mar" */
export function formatDayShort(date: Date): string {
  return `${DAYS_ES[date.getDay()]} ${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

/** "3 de Marzo, 2026" */
export function formatDateLong(date: Date): string {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

/** Format hour as "10:00" or "10:30" */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** "Semana del 3 al 8 de Marzo" */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 5); // Saturday
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `Semana del ${weekStart.getDate()} al ${weekEnd.getDate()} de ${months[weekStart.getMonth()]}`;
  }
  return `Semana del ${weekStart.getDate()} de ${months[weekStart.getMonth()]} al ${weekEnd.getDate()} de ${months[weekEnd.getMonth()]}`;
}

/** Check if two dates are the same calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

/** Returns true if date is today */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Days of week map (1=Mon, 6=Sat) */
export const DAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

// ── Timezone-aware utilities ──────────────────────────────────

const DEFAULT_TZ = 'America/Santiago';

/** Get the user's IANA timezone from the browser, or use the profile value */
export function resolveTimezone(profileTimezone?: string): string {
  return profileTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
}

/** Convert a day/hour/minute in one timezone to another timezone.
 *  Returns { dayOfWeek, hour, minute } in the target timezone.
 *  Useful for showing a teacher's 10:00 AM Santiago as 8:00 AM Bogotá. */
export function convertSlotTimezone(
  dayOfWeek: number, hour: number, minute: number,
  fromTz: string, toTz: string,
  referenceDate?: Date,
): { dayOfWeek: number; hour: number; minute: number } {
  if (fromTz === toTz) return { dayOfWeek, hour, minute };

  // Build a concrete date for the given dayOfWeek in the source timezone
  const ref = referenceDate ?? new Date();
  const refDay = ref.getDay() === 0 ? 7 : ref.getDay(); // 1=Mon...7=Sun
  const diff = dayOfWeek - refDay;
  const d = new Date(ref);
  d.setDate(d.getDate() + diff);

  // Format in source tz to get the "wall clock" date parts, then construct UTC
  const srcParts = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const y = parseInt(srcParts.find((p) => p.type === 'year')!.value);
  const m = parseInt(srcParts.find((p) => p.type === 'month')!.value) - 1;
  const dy = parseInt(srcParts.find((p) => p.type === 'day')!.value);

  // Create a date string that represents the exact wall-clock time in fromTz
  const isoStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dy).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

  // Get the offset in the source timezone to convert to UTC
  const srcDate = new Date(isoStr);
  const srcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: fromTz, hour: 'numeric', minute: 'numeric', hour12: false,
    year: 'numeric', month: 'numeric', day: 'numeric',
  });
  const tgtFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: toTz, hour: 'numeric', minute: 'numeric', hour12: false,
    weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric',
  });

  // Use a simpler approach: format the srcDate in toTz
  const tgtParts = tgtFormatter.formatToParts(srcDate);
  const tgtHour = parseInt(tgtParts.find((p) => p.type === 'hour')!.value);
  const tgtMinute = parseInt(tgtParts.find((p) => p.type === 'minute')!.value);
  const tgtWeekday = tgtParts.find((p) => p.type === 'weekday')!.value;

  const weekdayMap: Record<string, number> = {
    'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7,
  };
  const tgtDow = weekdayMap[tgtWeekday] ?? dayOfWeek;

  return { dayOfWeek: tgtDow, hour: tgtHour, minute: tgtMinute };
}

/** Format a time with timezone label, e.g. "10:00 (CLT)" */
export function formatTimeWithTz(hour: number, minute: number, tz?: string): string {
  const base = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  if (!tz) return base;
  try {
    const short = new Intl.DateTimeFormat('es-CL', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    return short ? `${base} (${short})` : base;
  } catch { return base; }
}

export { DAYS_ES, DAYS_EN, MONTHS_ES };
