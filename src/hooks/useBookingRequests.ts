// FriendlyTeaching.cl — Booking Requests Hook
// Teacher side: reads pending requests addressed to THIS teacher.
// The authenticated /dashboard/student/book page always includes teacherId
// in each request, so each teacher only sees their own students.
'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp,
  type FirestoreError, type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createBooking } from '@/hooks/useBookings';
import { getWeekStart } from '@/lib/utils/dateUtils';

export interface BookingRequest {
  id: string;
  studentId?:    string;          // uid of the requesting student (auth flow)
  teacherId?:    string;          // uid of the teacher this request is for
  studentName:   string;
  studentEmail:  string;
  studentPhone?: string;
  currentLevel?: string;
  message?:      string;
  requestedDow:  number;
  requestedHour: number;
  isRecurring:   boolean;
  status:        'pending' | 'approved' | 'rejected';
  createdAt:     import('firebase/firestore').Timestamp;
}

/** Teacher hook — lists pending requests addressed to the current teacher.
 *  Subscribes to onAuthStateChanged directly instead of trusting the
 *  Zustand authStore, which can stay hydrated as null after a fresh mount
 *  and silently return zero requests. See [[authstore-hydration-bug]]. */
export function useBookingRequests() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let mounted = true;
    let stopFn: (() => void) | null = null;

    function startQuery(teacherId: string) {
      if (!mounted) return;

      const q = query(
        collection(db, 'bookingRequests'),
        where('teacherId', '==', teacherId),
        where('status',    '==', 'pending'),
        orderBy('createdAt', 'desc'),
      );

      const unsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          if (!mounted) return;
          setRequests(
            snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
              id: d.id,
              ...d.data(),
            } as BookingRequest)),
          );
          setLoading(false);
        },
        (err: FirestoreError) => {
          if (!mounted) return;
          // Fallback while composite index is building: query by status only,
          // filter client-side.
          console.warn('useBookingRequests composite query failed, falling back:', err.message);
          const fallback = query(
            collection(db, 'bookingRequests'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
          );
          const unsubFallback = onSnapshot(
            fallback,
            (snap: QuerySnapshot<DocumentData>) => {
              if (!mounted) return;
              setRequests(
                snap.docs
                  .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as BookingRequest))
                  .filter((r: BookingRequest) => !r.teacherId || r.teacherId === teacherId),
              );
              setLoading(false);
            },
            () => { if (mounted) setLoading(false); },
          );
          stopFn = unsubFallback;
        },
      );

      stopFn = unsub;
    }

    const auth = getAuth();
    if (auth.currentUser) {
      startQuery(auth.currentUser.uid);
    } else {
      let resolved = false;
      const authUnsub = onAuthStateChanged(auth, (user) => {
        if (!mounted) return;
        if (user && !resolved) {
          resolved = true;
          authUnsub();
          startQuery(user.uid);
        } else if (!user && !resolved) {
          // Wait ~2 s in case this is the pre-resolution null event.
          setTimeout(() => {
            if (!mounted || resolved) return;
            resolved = true;
            authUnsub();
            setLoading(false);
          }, 2_000);
        }
      });
      stopFn = authUnsub;
    }

    return () => {
      mounted = false;
      stopFn?.();
    };
  }, []);

  /** Aprobar = crear la booking real + marcar el request como approved.
   *  Antes sólo cambiaba el status, así que la clase nunca aparecía en el
   *  horario del estudiante ni del profe. Ahora usa el mismo createBooking
   *  que el flujo manual (crea 52 semanas si es recurrente). */
  async function approveRequest(req: BookingRequest): Promise<void> {
    if (!req.teacherId) throw new Error('bookingRequest sin teacherId');
    await createBooking(req.teacherId, {
      studentName:  req.studentName,
      studentEmail: req.studentEmail,
      studentId:    req.studentId,
      dayOfWeek:    req.requestedDow,
      hour:         req.requestedHour,
      minute:       0,
      bookingType:  'class',
      weekStart:    getWeekStart(new Date()),
      isRecurring:  req.isRecurring,
      notes:        req.message,
    });
    await updateDoc(doc(db, 'bookingRequests', req.id), {
      status:    'approved',
      updatedAt: serverTimestamp(),
    });
  }

  async function rejectRequest(id: string): Promise<void> {
    await updateDoc(doc(db, 'bookingRequests', id), {
      status:    'rejected',
      updatedAt: serverTimestamp(),
    });
  }

  return { requests, loading, approveRequest, rejectRequest };
}
