// FriendlyTeaching.cl — Schedule Store (Zustand)
import { create } from 'zustand';
import type { Booking } from '@/types/firebase';

type SlotType = 'available' | 'blocked' | 'occupied' | 'pending';

interface SlotActionState {
  isOpen: boolean;
  day: number | null;
  hour: number | null;
  minute: number | null;   // 0, 15, 30, 45 — null means unset
  slotType: SlotType | null;
  booking: Booking | null;
}

interface ScheduleState {
  currentWeekStart: Date;
  slotAction: SlotActionState;
  isBookingModalOpen: boolean;
  /** Incremented every time booking or schedule onSnapshot listeners fire. */
  dataVersion: number;
  /**
   * Set by SlotActionModal after it records a completed class to classHistory.
   * TeacherDashboardPage watches this and opens ClassNotesModal when non-null.
   */
  pendingClassNotes: { entryId: string; studentName: string } | null;

  setWeekStart: (date: Date) => void;
  previousWeek: () => void;
  nextWeek: () => void;
  openSlotAction: (day: number, hour: number, minute: number, slotType: SlotType, booking: Booking | null) => void;
  closeSlotAction: () => void;
  openBookingModal: () => void;
  closeBookingModal: () => void;
  /** Skip the intermediate SlotActionModal and open BookingModal directly for a given slot. */
  openDirectBooking: (day: number, hour: number, minute?: number) => void;
  /** Bump the data version (called from hooks when onSnapshot fires). */
  bumpDataVersion: () => void;
  /** Wait for the next onSnapshot update (resolves when dataVersion changes, or after maxWait ms). */
  waitForDataRefresh: (maxWait?: number) => Promise<void>;
  /** Signal TeacherDashboardPage to open ClassNotesModal for a completed class. */
  setPendingClassNotes: (val: { entryId: string; studentName: string } | null) => void;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentWeekStart: getMonday(new Date()),
  slotAction: { isOpen: false, day: null, hour: null, minute: null, slotType: null, booking: null },
  isBookingModalOpen: false,
  dataVersion: 0,
  pendingClassNotes: null,

  setWeekStart: (date) => set({ currentWeekStart: date }),

  previousWeek: () => {
    const d = new Date(get().currentWeekStart);
    d.setDate(d.getDate() - 7);
    set({ currentWeekStart: d });
  },

  nextWeek: () => {
    const d = new Date(get().currentWeekStart);
    d.setDate(d.getDate() + 7);
    set({ currentWeekStart: d });
  },

  openSlotAction: (day, hour, minute, slotType, booking) =>
    set({ slotAction: { isOpen: true, day, hour, minute, slotType, booking } }),

  closeSlotAction: () =>
    set({ slotAction: { isOpen: false, day: null, hour: null, minute: null, slotType: null, booking: null }, isBookingModalOpen: false }),

  openBookingModal: () => set({ isBookingModalOpen: true }),
  closeBookingModal: () => set({ isBookingModalOpen: false }),

  openDirectBooking: (day, hour, minute = 0) =>
    set({
      slotAction: { isOpen: true, day, hour, minute, slotType: 'available', booking: null },
      isBookingModalOpen: true,
    }),

  bumpDataVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),

  setPendingClassNotes: (val) => set({ pendingClassNotes: val }),

  waitForDataRefresh: (maxWait = 3000) => {
    const startVersion = get().dataVersion;
    return new Promise<void>((resolve) => {
      // Check every 50ms if onSnapshot has delivered new data
      const interval = setInterval(() => {
        if (get().dataVersion !== startVersion) {
          clearInterval(interval);
          clearTimeout(timeout);
          // Small extra delay to let React re-render with new data
          setTimeout(resolve, 50);
        }
      }, 50);
      // Safety timeout — never block longer than maxWait ms
      const timeout = setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, maxWait);
    });
  },
}));
