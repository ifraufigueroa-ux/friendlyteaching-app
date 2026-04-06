// FriendlyTeaching.cl — Billing & Payments Page
'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import { usePayments } from '@/hooks/usePayments';
import { useExportReport } from '@/hooks/useExportReport';
import type { FTUser, PaymentRecord, PaymentCurrency, PaymentMethod } from '@/types/firebase';
import type { InvoiceData } from '@/app/api/export-report/route';
import TopBar from '@/components/layout/TopBar';
import { StudentsListSkeleton } from '@/components/ui/Skeleton';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const CURRENCY_SYMBOL: Record<PaymentCurrency, string> = {
  CLP: '$',
  USD: 'US$',
  EUR: '€',
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: '🏦 Transferencia',
  cash: '💵 Efectivo',
  other: '📝 Otro',
};

const MONTH_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

function getPeriod(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// ─── Mark paid modal ──────────────────────────────────────────────────────────

function MarkPaidModal({
  studentName,
  amount,
  onConfirm,
  onClose,
}: {
  studentName: string;
  amount: number;
  onConfirm: (method: PaymentMethod, notes: string) => Promise<void>;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await onConfirm(method, notes); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-bold text-[#5A3D7A] text-base mb-1">Registrar pago</h2>
        <p className="text-sm text-gray-500 mb-4">
          {studentName} — <strong>{formatCLP(amount)}</strong>
        </p>

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
          Método de pago
        </label>
        <div className="space-y-2 mb-4">
          {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold text-left transition-all ${
                method === m
                  ? 'border-[#C8A8DC] bg-[#F0E5FF] text-[#5A3D7A]'
                  : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
              }`}
            >
              {METHOD_LABELS[m]}
            </button>
          ))}
        </div>

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Notas (opcional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Ej: Transferencia #12345"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : '✅ Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Set amount modal ─────────────────────────────────────────────────────────

function SetAmountModal({
  studentName,
  current,
  onSave,
  onClose,
}: {
  studentName: string;
  current: number;
  onSave: (amount: number) => Promise<void>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(current || ''));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const n = parseInt(amount, 10);
    if (isNaN(n) || n <= 0) return;
    setSaving(true);
    try { await onSave(n); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl">
        <h2 className="font-bold text-[#5A3D7A] text-base mb-1">Monto mensual</h2>
        <p className="text-sm text-gray-400 mb-4">{studentName}</p>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="50000"
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student payment card ─────────────────────────────────────────────────────

function StudentPaymentCard({
  student,
  payment,
  teacherId,
  period,
  onCreatePayment,
  onMarkPaid,
  onMarkPending,
  onMarkOverdue,
}: {
  student: FTUser;
  payment: PaymentRecord | undefined;
  teacherId: string;
  period: string;
  onCreatePayment: (studentId: string, name: string, amount: number) => Promise<void>;
  onMarkPaid: (paymentId: string, method: PaymentMethod, notes: string) => Promise<void>;
  onMarkPending: (paymentId: string) => Promise<void>;
  onMarkOverdue: (paymentId: string) => Promise<void>;
}) {
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const monthlyRate = (student as FTUser & { studentData?: { monthlyRate?: number } }).studentData?.monthlyRate ?? 0;
  const status = payment?.status;

  const STATUS_CONFIG = {
    paid:    { label: 'Pagado',   icon: '✅', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
    pending: { label: 'Pendiente',icon: '⏳', bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
    overdue: { label: 'Atrasado', icon: '🔴', bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
  } as const;

  const cfg = status ? STATUS_CONFIG[status] : null;

  async function handleCreateAndMarkPaid() {
    if (!payment) {
      setCreating(true);
      try {
        await onCreatePayment(student.uid, student.fullName, monthlyRate || 0);
      } finally {
        setCreating(false);
      }
    } else {
      setShowPaidModal(true);
    }
  }

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-all ${cfg ? `${cfg.bg} ${cfg.border}` : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm flex-shrink-0">
              {student.fullName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{student.fullName}</p>
              {student.studentData?.level && (
                <span className="text-[10px] text-gray-400">{student.studentData.level}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {cfg && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.icon} {cfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Amount row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <button
              onClick={() => setShowAmountModal(true)}
              className="text-sm font-bold text-gray-700 hover:text-[#5A3D7A] transition-colors"
            >
              {monthlyRate > 0 ? formatCLP(monthlyRate) : '$ Sin definir'}
              <span className="text-[10px] text-gray-400 ml-1 font-normal">/mes ✏️</span>
            </button>
            {payment?.paidAt?.toDate && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Pagó: {payment.paidAt.toDate().toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                {payment.method && ` · ${METHOD_LABELS[payment.method]}`}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!payment || status === 'pending' || status === 'overdue' ? (
            <>
              <button
                disabled={creating}
                onClick={async () => {
                  if (!payment) {
                    setCreating(true);
                    try { await onCreatePayment(student.uid, student.fullName, monthlyRate || 0); }
                    finally { setCreating(false); }
                    // After creation, show paid modal
                    setShowPaidModal(true);
                  } else {
                    setShowPaidModal(true);
                  }
                }}
                className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {creating ? '...' : '✅ Marcar pagado'}
              </button>
              {payment && status !== 'overdue' && (
                <button
                  onClick={() => onMarkOverdue(payment.id)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                >
                  🔴
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onMarkPending(payment.id)}
              className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition-colors"
            >
              ↩ Marcar pendiente
            </button>
          )}
        </div>

        {payment?.notes && (
          <p className="text-[10px] text-gray-400 italic mt-2">&ldquo;{payment.notes}&rdquo;</p>
        )}

        {/* Export invoice button */}
        {payment && (
          <ExportInvoiceButton student={student} payment={payment} period={period} />
        )}
      </div>

      {showPaidModal && payment && (
        <MarkPaidModal
          studentName={student.fullName}
          amount={payment.amount}
          onConfirm={async (method, notes) => {
            await onMarkPaid(payment.id, method, notes);
            setShowPaidModal(false);
          }}
          onClose={() => setShowPaidModal(false)}
        />
      )}

      {showAmountModal && (
        <SetAmountModal
          studentName={student.fullName}
          current={monthlyRate}
          onSave={async (amount) => {
            await updateDoc(doc(db, 'users', student.uid), {
              'studentData.monthlyRate': amount,
              updatedAt: serverTimestamp(),
            });
            setShowAmountModal(false);
          }}
          onClose={() => setShowAmountModal(false)}
        />
      )}
    </>
  );
}

// ─── Export invoice button ────────────────────────────────────────────────────

function ExportInvoiceButton({
  student,
  payment,
  period,
}: {
  student: FTUser;
  payment: PaymentRecord;
  period: string;
}) {
  const { exportReport, loading: exporting } = useExportReport();
  const { profile } = useAuthStore();

  function handleExport() {
    // Format period: "2026-03" → "Marzo 2026"
    const [y, m] = period.split('-');
    const monthIdx = parseInt(m, 10) - 1;
    const periodLabel = `${MONTH_ES[monthIdx]} ${y}`;

    const invoiceData: InvoiceData = {
      type: 'invoice',
      teacherName: profile?.fullName ?? 'Profesor FT',
      teacherEmail: profile?.email ?? '',
      studentName: student.fullName,
      period: periodLabel,
      amount: payment.amount,
      currency: 'CLP',
      status: payment.status,
      classCount: 0,
      notes: payment.notes ?? undefined,
    };

    exportReport(invoiceData);
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="w-full mt-2 py-1.5 bg-[#F0E5FF] hover:bg-[#E0D0F5] text-[#5A3D7A] rounded-xl text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
    >
      {exporting ? 'Generando...' : '📄 Exportar factura'}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { profile } = useAuthStore();
  const { students, loading: studentsLoading } = useStudents();
  const teacherId = profile?.uid ?? '';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const period = useMemo(() => getPeriod(year, month), [year, month]);
  const { payments, loading: paymentsLoading, createPayment, markPaid, markPending, markOverdue } = usePayments(teacherId, period);

  const approvedStudents = students.filter(s => s.status === 'approved');

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter(p => p.status === 'paid').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  if (studentsLoading) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 space-y-2">
            <div className="animate-pulse bg-gray-200 rounded-xl h-8 w-56" />
            <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-36" />
          </div>
          <StudentsListSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="💳 Facturación"
        subtitle="Seguimiento de pagos mensuales por estudiante"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Facturación' },
        ]}
      />
      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Month selector */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
            ←
          </button>
          <div className="text-center">
            <p className="font-extrabold text-[#5A3D7A] text-lg">{MONTH_ES[month]}</p>
            <p className="text-sm text-gray-400">{year}</p>
          </div>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30"
          >
            →
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-green-700">{paidCount}</p>
            <p className="text-xs text-green-600 font-semibold mt-0.5">Pagaron</p>
            <p className="text-[10px] text-green-500 mt-0.5">{formatCLP(totalPaid)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-amber-700">
              {approvedStudents.length - paidCount}
            </p>
            <p className="text-xs text-amber-600 font-semibold mt-0.5">Pendientes</p>
            <p className="text-[10px] text-amber-500 mt-0.5">{formatCLP(totalPending)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-red-700">{overdueCount}</p>
            <p className="text-xs text-red-600 font-semibold mt-0.5">Atrasados</p>
            <p className="text-[10px] text-red-400 mt-0.5">Requieren atención</p>
          </div>
        </div>

        {/* Student list */}
        {approvedStudents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-gray-500 text-sm">No hay estudiantes aprobados.</p>
            <p className="text-xs text-gray-400 mt-1">Aprueba estudiantes para ver el seguimiento de pagos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
              {approvedStudents.length} estudiante{approvedStudents.length !== 1 ? 's' : ''} · {MONTH_ES[month]} {year}
            </p>
            {approvedStudents.map(student => {
              const payment = payments.find(p => p.studentId === student.uid);
              return (
                <StudentPaymentCard
                  key={student.uid}
                  student={student}
                  payment={payment}
                  teacherId={teacherId}
                  period={period}
                  onCreatePayment={async (sid, name, amount) => {
                    await createPayment(sid, name, amount);
                  }}
                  onMarkPaid={markPaid}
                  onMarkPending={markPending}
                  onMarkOverdue={markOverdue}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
