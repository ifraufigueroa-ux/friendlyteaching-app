// FriendlyTeaching.cl — Billing & Payments Page
'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import { usePayments } from '@/hooks/usePayments';
import { useExportReport } from '@/hooks/useExportReport';
import { useClassHistory } from '@/hooks/useClassHistory';
import { useLessonPlans, createLessonPlan, updateLessonPlan, deleteLessonPlan } from '@/hooks/useLessonPlans';
import { useBookingStudentIdMap } from '@/hooks/useBookings';
import type { LessonPlan } from '@/hooks/useLessonPlans';
import type { ClassHistoryEntry } from '@/hooks/useClassHistory';
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

// ─── Paid modal (payment registration + optional plan reset) ──────────────────

function PaidModal({
  studentName,
  amount,
  plan,
  onConfirm,
  onClose,
}: {
  studentName: string;
  amount: number;
  plan: LessonPlan | undefined;
  onConfirm: (opts: { method: PaymentMethod; notes: string; newTotalClasses: number; newStartDate: Date }) => Promise<void>;
  onClose: () => void;
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [notes, setNotes] = useState('');
  const [newTotalClasses, setNewTotalClasses] = useState(String(plan?.totalClasses ?? 12));
  const [newStartDate, setNewStartDate] = useState(todayStr);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onConfirm({
        method,
        notes,
        newTotalClasses: parseInt(newTotalClasses, 10) || (plan?.totalClasses ?? 12),
        newStartDate: new Date(newStartDate + 'T12:00:00'),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-bold text-[#5A3D7A] text-base mb-1">Registrar pago</h2>
        <p className="text-sm text-gray-500 mb-4">
          {studentName}{amount > 0 && <> — <strong>{formatCLP(amount)}</strong></>}
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

        {plan && (
          <>
            <div className="border-t border-gray-100 my-4" />
            <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">
              📚 Nuevo período del plan
            </p>

            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Total de clases
            </label>
            <input
              type="number"
              value={newTotalClasses}
              onChange={e => setNewTotalClasses(e.target.value)}
              min="1"
              max="200"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />

            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Nueva fecha de inicio
            </label>
            <input
              type="date"
              value={newStartDate}
              onChange={e => setNewStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </>
        )}

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

// ─── Unified student card (payment + dot tracker) ─────────────────────────────

function UnifiedStudentCard({
  student,
  payment,
  plan,
  completedCount,
  period,
  onPaid,
  onMarkPending,
  onMarkOverdue,
  onEditPlan,
  onDeletePlan,
  onManualCount,
}: {
  student: FTUser;
  payment: PaymentRecord | undefined;
  plan: LessonPlan | undefined;
  completedCount: number;
  period: string;
  onPaid: (opts: { method: PaymentMethod; notes: string; newTotalClasses: number; newStartDate: Date }) => Promise<void>;
  onMarkPending: () => Promise<void>;
  onMarkOverdue: () => Promise<void>;
  onEditPlan: (plan: LessonPlan) => void;
  onDeletePlan: (planId: string) => Promise<void>;
  onManualCount: (planId: string, count: number) => Promise<void>;
}) {
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [confirmDeletePlan, setConfirmDeletePlan] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyRate = (student as any).studentData?.monthlyRate ?? 0;
  const status = payment?.status;

  const STATUS_CONFIG = {
    paid:    { label: 'Pagado',    icon: '✅', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
    pending: { label: 'Pendiente', icon: '⏳', bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
    overdue: { label: 'Atrasado',  icon: '🔴', bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' },
  } as const;

  const cfg = status ? STATUS_CONFIG[status] : null;

  const autoCount = completedCount;
  const manualCount = plan?.manualCompletedCount ?? 0;
  const effectiveCount = Math.max(autoCount, manualCount);
  const isComplete = plan ? effectiveCount >= plan.totalClasses : false;
  const pct = plan && plan.totalClasses > 0 ? Math.min((effectiveCount / plan.totalClasses) * 100, 100) : 0;
  const visibleDots = plan ? Math.min(plan.totalClasses, 40) : 0;
  const extraDots = plan && plan.totalClasses > 40 ? plan.totalClasses - 40 : 0;

  function handleDotClick(i: number) {
    if (!plan) return;
    if (i < autoCount) return; // auto-counted, locked
    const newCount = (i + 1 === effectiveCount) ? i : i + 1; // toggle last off, else mark
    onManualCount(plan.id, newCount);
  }

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-all ${cfg ? `${cfg.bg} ${cfg.border}` : 'bg-white border-gray-100'}`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm flex-shrink-0">
              {student.fullName?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{student.fullName}</p>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(student as any).studentData?.level && (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <span className="text-[10px] text-gray-400">{(student as any).studentData.level}</span>
              )}
            </div>
          </div>
          {cfg && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>
              {cfg.icon} {cfg.label}
            </span>
          )}
        </div>

        {/* Amount row */}
        <div className="mb-3">
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

        {/* Dot tracker (if plan linked to this student) */}
        {plan && (
          <div className={`rounded-xl p-3 mb-3 ${isComplete ? 'bg-green-100/50' : 'bg-black/[0.03]'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-500 truncate min-w-0">
                📚 {plan.planName || 'Plan de clases'}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {effectiveCount}/{plan.totalClasses}
                </span>
                <button
                  onClick={() => onEditPlan(plan)}
                  className="w-6 h-6 rounded-lg bg-white hover:bg-[#F0E5FF] text-gray-400 hover:text-[#5A3D7A] flex items-center justify-center text-[10px] transition-colors shadow-sm"
                >
                  ✏️
                </button>
                {confirmDeletePlan ? (
                  <>
                    <button onClick={() => onDeletePlan(plan.id)} className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center text-[10px] font-bold transition-colors">✓</button>
                    <button onClick={() => setConfirmDeletePlan(false)} className="w-6 h-6 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] transition-colors">✗</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDeletePlan(true)} className="w-6 h-6 rounded-lg bg-white hover:bg-red-50 text-gray-300 hover:text-red-400 flex items-center justify-center text-[10px] transition-colors shadow-sm">🗑️</button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {Array.from({ length: visibleDots }).map((_, i) => {
                const isGreen = i < effectiveCount;
                const isAuto = i < autoCount;
                return (
                  <button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    disabled={isAuto}
                    title={isAuto ? `Clase ${i + 1} (registrada)` : isGreen ? `Clase ${i + 1} — click para desmarcar` : `Clase ${i + 1} — click para marcar`}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      isGreen
                        ? isAuto
                          ? 'bg-green-500 shadow-sm shadow-green-200 cursor-default'
                          : 'bg-green-400 shadow-sm shadow-green-200 cursor-pointer hover:bg-green-600 ring-1 ring-green-300'
                        : 'bg-gray-200 border border-gray-300 cursor-pointer hover:bg-green-200 hover:border-green-300'
                    }`}
                  />
                );
              })}
              {extraDots > 0 && <span className="text-[10px] text-gray-400 self-center ml-0.5">+{extraDots}</span>}
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-[#C8A8DC]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!payment || status === 'pending' || status === 'overdue' ? (
            <>
              <button
                onClick={() => setShowPaidModal(true)}
                className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors"
              >
                ✅ Paid
              </button>
              {payment && status !== 'overdue' && (
                <button
                  onClick={onMarkOverdue}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                >
                  🔴
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onMarkPending}
              className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-semibold transition-colors"
            >
              ↩ Marcar pendiente
            </button>
          )}
        </div>

        {payment?.notes && (
          <p className="text-[10px] text-gray-400 italic mt-2">&ldquo;{payment.notes}&rdquo;</p>
        )}

        {payment && (
          <ExportInvoiceButton student={student} payment={payment} period={period} />
        )}
      </div>

      {showPaidModal && (
        <PaidModal
          studentName={student.fullName}
          amount={monthlyRate}
          plan={plan}
          onConfirm={async (opts) => {
            await onPaid(opts);
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

// ─── Lesson plan: Add modal ───────────────────────────────────────────────────

function AddPlanModal({
  students,
  onSave,
  onClose,
}: {
  students: FTUser[];
  onSave: (data: { studentName: string; studentId?: string; planName: string; totalClasses: number; startDate: Date }) => Promise<void>;
  onClose: () => void;
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [mode, setMode] = useState<'registered' | 'manual'>('registered');
  const [selectedUid, setSelectedUid] = useState('');
  const [manualName, setManualName] = useState('');
  const [planName, setPlanName] = useState('');
  const [totalClasses, setTotalClasses] = useState('12');
  const [startDate, setStartDate] = useState(todayStr);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedStudent = students.find(s => s.uid === selectedUid);
  const resolvedName = mode === 'registered' ? (selectedStudent?.fullName ?? '') : manualName.trim();
  const canSave = resolvedName.length > 0 && parseInt(totalClasses, 10) > 0;

  async function handleSave() {
    if (!canSave) return;
    const n = parseInt(totalClasses, 10);
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        studentName: resolvedName,
        studentId: mode === 'registered' ? selectedStudent?.uid : undefined,
        planName,
        totalClasses: n,
        startDate: new Date(startDate + 'T12:00:00'),
      });
    } catch (err: unknown) {
      console.error('createLessonPlan error:', err);
      setSaveError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-bold text-[#5A3D7A] text-base mb-4">Nuevo plan de clases</h2>

        <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setMode('registered')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'registered'
                ? 'bg-white text-[#5A3D7A] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Estudiante registrado
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'manual'
                ? 'bg-white text-[#5A3D7A] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ingreso manual
          </button>
        </div>

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Estudiante
        </label>
        {mode === 'registered' ? (
          <select
            value={selectedUid}
            onChange={e => setSelectedUid(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
          >
            <option value="">Seleccionar estudiante...</option>
            {students.map(s => (
              <option key={s.uid} value={s.uid}>{s.fullName}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            placeholder="Nombre completo del estudiante"
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
          />
        )}

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Nombre del plan (opcional)
        </label>
        <input
          type="text"
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          placeholder="Ej: Curso A2 — 12 clases"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        />

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Total de clases
        </label>
        <input
          type="number"
          value={totalClasses}
          onChange={e => setTotalClasses(e.target.value)}
          min="1"
          max="200"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        />

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Fecha de inicio
        </label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        />

        {saveError && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{saveError}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? '...' : 'Crear plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lesson plan: Edit modal ──────────────────────────────────────────────────

function EditPlanModal({
  plan,
  onSave,
  onClose,
}: {
  plan: LessonPlan;
  onSave: (patch: { planName?: string; totalClasses?: number; startDate?: Date }) => Promise<void>;
  onClose: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = plan.startDate as any;
  const startDateObj: Date = typeof raw?.toDate === 'function' ? raw.toDate()
    : raw?.seconds ? new Date(raw.seconds * 1000) : new Date();
  const startDateStr = startDateObj.toISOString().split('T')[0];

  const [planName, setPlanName] = useState(plan.planName ?? '');
  const [totalClasses, setTotalClasses] = useState(String(plan.totalClasses));
  const [startDate, setStartDate] = useState(startDateStr);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const n = parseInt(totalClasses, 10);
    if (isNaN(n) || n <= 0) return;
    setSaving(true);
    try {
      await onSave({
        planName,
        totalClasses: n,
        startDate: new Date(startDate + 'T12:00:00'),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="font-bold text-[#5A3D7A] text-base mb-1">Editar plan</h2>
        <p className="text-sm text-gray-400 mb-4">{plan.studentName}</p>

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Nombre del plan
        </label>
        <input
          type="text"
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          placeholder="Ej: Curso A2 — 12 clases"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        />

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Total de clases
        </label>
        <input
          type="number"
          value={totalClasses}
          onChange={e => setTotalClasses(e.target.value)}
          min="1"
          max="200"
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        />

        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Fecha de inicio
        </label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Class detail popup (shown when clicking an auto-counted dot) ─────────────

const DAY_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MOOD_EMOJI: Record<string, string> = { great: '🌟', good: '😊', regular: '😕' };

function ClassDetailPopup({
  entry,
  index,
  onClose,
}: {
  entry: ClassHistoryEntry;
  index: number;
  onClose: () => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = entry.date as any;
  const date: Date = typeof raw?.toDate === 'function' ? raw.toDate()
    : raw?.seconds ? new Date(raw.seconds * 1000) : new Date();

  const dayName = DAY_ES[date.getDay()];
  const dateStr = `${dayName} ${date.getDate()} ${MONTH_ES[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
            Clase {index + 1}
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold w-6 h-6 flex items-center justify-center">×</button>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-3">📅 {dateStr}</p>

        {entry.notes ? (
          <div className="space-y-2 text-sm">
            {entry.notes.mood && (
              <p className="text-gray-600">
                {MOOD_EMOJI[entry.notes.mood]} Clase {entry.notes.mood === 'great' ? 'excelente' : entry.notes.mood === 'good' ? 'bien' : 'regular'}
              </p>
            )}
            {entry.notes.covered && (
              <div>
                <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-0.5">📚 Temas</p>
                <p className="text-gray-700 text-sm leading-snug">{entry.notes.covered}</p>
              </div>
            )}
            {entry.notes.performance && (
              <div>
                <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-0.5">💬 Desempeño</p>
                <p className="text-gray-600 text-sm leading-snug">{entry.notes.performance}</p>
              </div>
            )}
            {entry.notes.homework && (
              <div>
                <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-0.5">📋 Tarea</p>
                <p className="text-gray-600 text-sm">{entry.notes.homework}</p>
              </div>
            )}
            {entry.notes.nextClass && (
              <div>
                <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-0.5">🎯 Próxima clase</p>
                <p className="text-gray-600 text-sm">{entry.notes.nextClass}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Sin notas registradas para esta clase.</p>
        )}
      </div>
    </div>
  );
}

// ─── Manual plan row ──────────────────────────────────────────────────────────

function ManualPlanRow({
  plan,
  autoCount,
  historyEntries,
  onEdit,
  onDelete,
  onManualCount,
}: {
  plan: LessonPlan;
  autoCount: number;
  historyEntries: ClassHistoryEntry[];
  onEdit: (plan: LessonPlan) => void;
  onDelete: (planId: string) => void;
  onManualCount: (planId: string, count: number) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedDot, setSelectedDot] = useState<number | null>(null);

  const manualCount = plan.manualCompletedCount ?? 0;
  const effectiveCount = Math.max(autoCount, manualCount);
  const isComplete = effectiveCount >= plan.totalClasses;
  const pct = plan.totalClasses > 0 ? Math.min((effectiveCount / plan.totalClasses) * 100, 100) : 0;
  const visibleDots = Math.min(plan.totalClasses, 50);
  const extraDots = plan.totalClasses > 50 ? plan.totalClasses - 50 : 0;

  function handleDotClick(i: number) {
    if (i < autoCount) {
      // Auto-counted dot: show class detail popup
      setSelectedDot(i);
      return;
    }
    // Manual dot: toggle count
    const newCount = (i + 1 === effectiveCount) ? i : i + 1;
    onManualCount(plan.id, newCount);
  }

  return (
    <>
      <div className={`rounded-2xl border p-4 transition-all shadow-sm ${
        isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm flex-shrink-0">
                {plan.studentName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{plan.studentName}</p>
                {plan.planName && (
                  <p className="text-[11px] text-gray-400 truncate">{plan.planName}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {effectiveCount}/{plan.totalClasses}
            </span>
            <button onClick={() => onEdit(plan)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-[#F0E5FF] text-gray-500 hover:text-[#5A3D7A] flex items-center justify-center text-xs transition-colors">
              ✏️
            </button>
            {confirmDelete ? (
              <>
                <button onClick={() => onDelete(plan.id)} className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs transition-colors font-bold">✓</button>
                <button onClick={() => setConfirmDelete(false)} className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-xs transition-colors">✗</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center text-xs transition-colors">
                🗑️
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {Array.from({ length: visibleDots }).map((_, i) => {
            const isGreen = i < effectiveCount;
            const isAuto = i < autoCount;
            return (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                title={
                  isAuto
                    ? `Clase ${i + 1} · Haz click para ver detalles`
                    : isGreen
                      ? `Clase ${i + 1} (manual) — click para desmarcar`
                      : `Clase ${i + 1} — click para marcar`
                }
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isGreen
                    ? isAuto
                      ? 'bg-green-500 shadow-sm shadow-green-200 cursor-pointer hover:bg-green-400 hover:scale-110'
                      : 'bg-green-400 shadow-sm shadow-green-200 cursor-pointer hover:bg-green-600 ring-1 ring-green-300'
                    : 'bg-gray-200 border border-gray-300 hover:bg-green-200 hover:border-green-300 cursor-pointer'
                }`}
              />
            );
          })}
          {extraDots > 0 && (
            <span className="text-[11px] text-gray-400 self-center font-medium">+{extraDots}</span>
          )}
        </div>

        {autoCount > 0 && (
          <p className="text-[10px] text-gray-400 mb-2">
            🟢 {autoCount} registrada{autoCount !== 1 ? 's' : ''} — click en un punto para ver detalles
            {manualCount > autoCount ? ` · +${manualCount - autoCount} manual` : ''}
          </p>
        )}

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-[#C8A8DC]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {selectedDot !== null && historyEntries[selectedDot] && (
        <ClassDetailPopup
          entry={historyEntries[selectedDot]}
          index={selectedDot}
          onClose={() => setSelectedDot(null)}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { profile, firebaseUser } = useAuthStore();
  const { students, loading: studentsLoading } = useStudents();
  const teacherId = firebaseUser?.uid ?? profile?.uid ?? '';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const period = useMemo(() => getPeriod(year, month), [year, month]);
  const { loading: paymentsLoading } = usePayments(teacherId, period);

  const { plans, loading: plansLoading, error: plansError } = useLessonPlans(teacherId);
  const { history } = useClassHistory(teacherId, 9999);
  const bookingStudentMap = useBookingStudentIdMap(teacherId);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);

  // planDataMap: planId → { count, entries (sorted oldest→newest, attended only, from plan startDate) }
  const planDataMap = useMemo(() => {
    const map = new Map<string, { count: number; entries: ClassHistoryEntry[] }>();
    for (const plan of plans) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawStart = plan.startDate as any;
      const startMs: number = typeof rawStart?.toDate === 'function'
        ? rawStart.toDate().getTime()
        : rawStart?.seconds ? rawStart.seconds * 1000 : 0;

      const planNameNorm = plan.studentName.trim().toLowerCase();
      const matched: ClassHistoryEntry[] = [];

      for (const h of history) {
        if (!h.attended) continue;
        const directId = plan.studentId && h.studentId && h.studentId === plan.studentId;
        const viaBooking = !directId && plan.studentId && h.bookingId
          && bookingStudentMap.get(h.bookingId) === plan.studentId;
        const entryNorm = h.studentName.trim().toLowerCase();
        const nameMatch = !directId && !viaBooking
          && (entryNorm === planNameNorm || planNameNorm.startsWith(entryNorm) || entryNorm.startsWith(planNameNorm));
        if (!directId && !viaBooking && !nameMatch) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDate = h.date as any;
        const ms: number = typeof rawDate?.toDate === 'function'
          ? rawDate.toDate().getTime()
          : rawDate?.seconds ? rawDate.seconds * 1000 : 0;
        if (ms >= startMs) matched.push(h);
      }

      // Sort oldest → newest so dot index 0 = first class
      matched.sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ms = (e: ClassHistoryEntry) => { const r = e.date as any; return typeof r?.toDate === 'function' ? r.toDate().getTime() : r?.seconds ? r.seconds * 1000 : 0; };
        return ms(a) - ms(b);
      });

      map.set(plan.id, { count: matched.length, entries: matched });
    }
    return map;
  }, [plans, history, bookingStudentMap]);

  const approvedStudents = students.filter(s => s.status === 'approved');

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
      <div className="min-h-screen p-6">
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

        {/* Plans section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
              📚 Planes de clases
            </p>
            <button
              onClick={() => setShowAddPlan(true)}
              className="text-xs font-bold text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E0D0F5] px-3 py-1.5 rounded-xl transition-colors"
            >
              + Plan
            </button>
          </div>

          {plansError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
              <p className="text-xs text-red-600 font-semibold">Error al cargar planes: {plansError}</p>
            </div>
          )}

          {plansLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-gray-500 text-sm">Sin planes de clases aún.</p>
              <p className="text-xs text-gray-400 mt-1">Presiona &ldquo;+ Plan&rdquo; para crear uno.</p>
            </div>
          ) : (
            plans.map(plan => {
              const data = planDataMap.get(plan.id) ?? { count: 0, entries: [] };
              return (
                <ManualPlanRow
                  key={plan.id}
                  plan={plan}
                  autoCount={data.count}
                  historyEntries={data.entries}
                  onEdit={setEditingPlan}
                  onDelete={async (id) => { await deleteLessonPlan(id); }}
                  onManualCount={async (planId, count) => { await updateLessonPlan(planId, { manualCompletedCount: count }); }}
                />
              );
            })
          )}
        </div>

      </div>

      {/* Add plan modal */}
      {showAddPlan && (
        <AddPlanModal
          students={approvedStudents}
          onSave={async (data) => {
            await createLessonPlan({ teacherId, ...data });
            setShowAddPlan(false);
          }}
          onClose={() => setShowAddPlan(false)}
        />
      )}

      {/* Edit plan modal */}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onSave={async (patch) => {
            await updateLessonPlan(editingPlan.id, patch);
            setEditingPlan(null);
          }}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}
