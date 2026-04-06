// FriendlyTeaching.cl — Payments Hook
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  FirestoreError,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  PaymentRecord,
  PaymentStatus,
  PaymentMethod,
  PaymentCurrency,
} from '@/types/firebase';

export function usePayments(teacherId: string, period: string) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId || !period) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'payments'),
      where('teacherId', '==', teacherId),
      where('period', '==', period),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setPayments(
          snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as PaymentRecord)),
        );
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('usePayments error:', err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [teacherId, period]);

  /** Create a pending payment record for a student/period */
  async function createPayment(
    studentId: string,
    studentName: string,
    amount: number,
    currency: PaymentCurrency = 'CLP',
  ): Promise<string> {
    const ref = await addDoc(collection(db, 'payments'), {
      studentId,
      studentName,
      teacherId,
      amount,
      currency,
      period,
      status: 'pending' as PaymentStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Mark an existing payment record as paid */
  async function markPaid(
    paymentId: string,
    method: PaymentMethod = 'transfer',
    notes = '',
  ): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'paid' as PaymentStatus,
      method,
      notes,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  /** Set status back to pending */
  async function markPending(paymentId: string): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'pending' as PaymentStatus,
      paidAt: null,
      updatedAt: serverTimestamp(),
    });
  }

  /** Mark as overdue */
  async function markOverdue(paymentId: string): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'overdue' as PaymentStatus,
      updatedAt: serverTimestamp(),
    });
  }

  /** Upsert: get existing or create new for this student+period */
  async function upsertPayment(
    studentId: string,
    studentName: string,
    amount: number,
    currency: PaymentCurrency = 'CLP',
  ): Promise<PaymentRecord> {
    const existing = payments.find(p => p.studentId === studentId);
    if (existing) return existing;
    const id = await createPayment(studentId, studentName, amount, currency);
    return {
      id,
      studentId,
      studentName,
      teacherId,
      amount,
      currency,
      period,
      status: 'pending',
      createdAt: Timestamp.now(),
    };
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return {
    payments,
    loading,
    createPayment,
    markPaid,
    markPending,
    markOverdue,
    upsertPayment,
    totalPaid,
    totalPending,
  };
}
