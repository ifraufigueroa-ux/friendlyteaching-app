// FriendlyTeaching.cl — Booking Requests Hook
// Teacher side: reads pending requests addressed to THIS teacher.
// The authenticated /dashboard/student/book page always includes teacherId
// in each request, so each teacher only sees their own students.
import { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp,
  type FirestoreError, type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';

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

/** Teacher hook — lists pending requests addressed to the current teacher. */
export function useBookingRequests() {
  const { profile } = useAuthStore();
  const teacherId   = profile?.uid ?? '';

  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    // Primary query: filter by teacherId + status (requires composite index).
    const q = query(
      collection(db, 'bookingRequests'),
      where('teacherId', '==', teacherId),
      where('status',    '==', 'pending'),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setRequests(
          snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as BookingRequest)),
        );
        setLoading(false);
      },
      (err: FirestoreError) => {
        // Fallback while composite index is building: query by status only, filter client-side.
        console.warn('useBookingRequests composite query failed, falling back:', err.message);
        const fallback = query(
          collection(db, 'bookingRequests'),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc'),
        );
        onSnapshot(
          fallback,
          (snap: QuerySnapshot<DocumentData>) => {
            setRequests(
              snap.docs
                .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as BookingRequest))
                .filter((r: BookingRequest) => !r.teacherId || r.teacherId === teacherId),
            );
            setLoading(false);
          },
          () => setLoading(false),
        );
      },
    );

    return unsub;
  }, [teacherId]);

  async function approveRequest(id: string): Promise<void> {
    await updateDoc(doc(db, 'bookingRequests', id), {
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
