// FriendlyTeaching.cl — ScheduleSlot
'use client';
import type { Booking } from '@/types/firebase';

type SlotStatus =
  | 'available'
  | 'today-available'
  | 'blocked'
  | 'occupied'           // recurring class
  | 'occupied-once'      // one-time class
  | 'interview'          // recurring interview
  | 'interview-once'     // one-time interview
  | 'pending'
  | 'completed';

interface Props {
  booking?: Booking;
  isBlocked?: boolean;
  isToday?: boolean;
  onClick: () => void;
}

const slotStyles: Record<SlotStatus, string> = {
  available:         'bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A]',
  'today-available': 'bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] ring-2 ring-[#5A3D7A]',
  blocked:           'bg-[#D9D9D9] hover:bg-[#C5C5C5] text-[#666]',
  occupied:          'bg-[#C8A8DC] hover:bg-[#B890CC] text-white',
  'occupied-once':   'bg-[#FFB8D9] hover:bg-[#FFA0C8] text-[#7A0040]',
  interview:         'bg-[#FFB347] hover:bg-[#FF9F1C] text-white',
  'interview-once':  'bg-[#FFD4A8] hover:bg-[#FFBF80] text-[#7A3B00]',
  pending:           'bg-[#FFE8A8] hover:bg-[#FFD97A] text-[#7A5E00]',
  completed:         'bg-gray-100 text-gray-400 cursor-default opacity-70',
};

export default function ScheduleSlot({ booking, isBlocked, isToday, onClick }: Props) {
  let status: SlotStatus;
  let label: string;
  let sublabel = '';

  const isInterview = booking?.bookingType === 'interview';
  // Fallback si la booking se creó sin nombre (p.ej. estudiante sin fullName
  // en su perfil que solicitó una clase). Mostramos el prefijo del email o
  // "Sin nombre" para que el slot no quede mudo.
  const displayName = booking
    ? (booking.studentName?.trim()
       || booking.studentEmail?.split('@')[0]
       || 'Sin nombre')
    : '';

  if (booking?.status === 'completed') {
    status = 'completed';
    label = displayName;
    sublabel = booking.attendance === 'attended'
      ? '✓ Asistió'
      : booking.attendance === 'absent'
        ? '✗ No asistió'
        : '✓ Completada';
  } else if (booking?.status === 'confirmed') {
    if (isInterview) {
      status = booking.isRecurring ? 'interview' : 'interview-once';
      label = displayName;
      sublabel = booking.isRecurring ? '↻ Entrevista' : '• Entrevista';
    } else {
      status = booking.isRecurring ? 'occupied' : 'occupied-once';
      label = displayName;
      sublabel = booking.isRecurring ? '↻ Recurrente' : '• Una vez';
    }
  } else if (booking?.status === 'pending') {
    status = 'pending';
    label = displayName;
    sublabel = 'Pendiente';
  } else if (isBlocked) {
    status = 'blocked';
    label = 'Bloqueado';
  } else {
    status = isToday ? 'today-available' : 'available';
    label = 'Disponible';
  }

  return (
    <button
      onClick={status === 'completed' ? onClick : onClick}
      className={`
        w-full h-full rounded-xl px-2 py-1 text-left text-[15px] font-medium
        transition-all duration-150 cursor-pointer
        ${slotStyles[status]}
      `}
    >
      <span className="block truncate font-semibold">{label}</span>
      {sublabel && (
        <span className="block truncate opacity-75 text-[13px] mt-0.5">{sublabel}</span>
      )}
    </button>
  );
}
