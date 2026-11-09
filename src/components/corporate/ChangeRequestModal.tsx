// FriendlyTeaching.cl — Change-request modal
//
// Opens when the admin picks one of the three actions from the student
// row menu. Shape of the form varies by type:
//   • change-group → target group dropdown + note
//   • reevaluation → note only
//   • replacement  → note required (why they're leaving)

'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { createChangeRequest, CHANGE_REQUEST_LABELS } from '@/hooks/useChangeRequests';
import type { ChangeRequestType, OrgGroup, RosterEntry } from '@/types/organization';

interface Props {
  type:          ChangeRequestType;
  student:       RosterEntry;
  currentGroup:  OrgGroup | null;
  allGroups:     OrgGroup[];
  orgId:         string;
  onClose:       () => void;
  onSubmitted?:  (requestId: string) => void;
}

export function ChangeRequestModal({
  type, student, currentGroup, allGroups, orgId, onClose, onSubmitted,
}: Props) {
  const { profile } = useAuthStore();
  const label = CHANGE_REQUEST_LABELS[type];
  const [targetGroupId, setTargetGroupId] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Candidates = all groups except the one the student is already in.
  const candidateGroups = allGroups.filter(g => g.id !== currentGroup?.id);

  // Esc closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (type === 'change-group' && !targetGroupId) {
      setError('Elige a qué grupo quieres mover al estudiante.');
      return;
    }
    if (type === 'replacement' && !note.trim()) {
      setError('Agrega una nota explicando el motivo del reemplazo.');
      return;
    }
    if (!profile?.uid) {
      setError('Sesión no cargada todavía — recarga la página.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const target = candidateGroups.find(g => g.id === targetGroupId) ?? null;
      const requestId = await createChangeRequest({
        orgId,
        type,
        studentUid:        student.uid,
        studentName:       student.fullName,
        currentGroupId:    currentGroup?.id ?? null,
        currentGroupName:  currentGroup?.name ?? null,
        targetGroupId:     type === 'change-group' ? targetGroupId : null,
        targetGroupName:   type === 'change-group' ? target?.name ?? null : null,
        note:              note.trim(),
        createdByUid:      profile.uid,
        createdByName:     profile.fullName ?? profile.email ?? 'Admin',
      });
      onSubmitted?.(requestId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
      setSubmitting(false);
    }
  }

  const noteRequired = type === 'replacement';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D1B4E]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-request-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-7 pt-7 pb-4 border-b border-[#F0E5FF]">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9B7CB8] mb-1">
              {label.emoji} Solicitud
            </p>
            <h2 id="change-request-title" className="font-serif text-2xl font-bold text-[#2D1B4E] leading-tight">
              {label.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1 truncate">
              Para <span className="font-semibold text-[#5A3D7A]">{student.fullName}</span>
              {currentGroup && <> · actualmente en <span className="font-semibold text-[#5A3D7A]">{currentGroup.name}</span></>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex-shrink-0 w-9 h-9 rounded-full text-[#9B7CB8] hover:bg-[#F0E5FF] hover:text-[#5A3D7A] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {type === 'change-group' && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-[#9B7CB8] block">
                Mover al grupo
              </label>
              {candidateGroups.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
                  No hay otros grupos disponibles.
                </p>
              ) : (
                <select
                  required
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#E8D5F0] rounded-xl text-[15px] font-medium text-[#2D1B4E] bg-white focus:outline-none focus:border-[#5A3D7A] transition-colors"
                >
                  <option value="">Elige un grupo…</option>
                  {candidateGroups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name}{g.level ? ` · ${g.level}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {type === 'reevaluation' && (
            <div className="bg-[#FAF5FF] border border-[#E8D5F0] rounded-2xl p-4 text-sm text-[#5A3D7A] leading-relaxed">
              La profesora recibirá la solicitud y coordinará una nueva
              evaluación de nivel para <strong>{student.fullName}</strong>.
              Agrega abajo cualquier contexto que ayude (ej. cambio de rol,
              exposición a inglés en el trabajo, feedback del equipo).
            </div>
          )}

          {type === 'replacement' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800 leading-relaxed">
              Esto saca a <strong>{student.fullName}</strong> del programa y
              libera su cupo. Si ya sabes quién lo reemplazará, inclúyelo en
              la nota — la profesora se contacta contigo antes de ejecutar.
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-[#9B7CB8] block">
              Nota {noteRequired && <span className="text-rose-600 normal-case tracking-normal font-bold">· requerida</span>}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required={noteRequired}
              rows={4}
              maxLength={500}
              placeholder={
                type === 'change-group' ? 'Por ejemplo: avanzó más rápido que el grupo A1 — la profesora lo evaluó la semana pasada.'
                : type === 'reevaluation' ? 'Opcional — contexto que ayude a decidir el nuevo nivel.'
                : 'Motivo y nombre del reemplazo si ya lo tienes.'
              }
              className="w-full px-4 py-3 border-2 border-[#E8D5F0] rounded-xl text-[14px] text-[#2D1B4E] bg-white focus:outline-none focus:border-[#5A3D7A] transition-colors resize-none"
            />
            <p className="text-[11px] text-gray-400 text-right">{note.length}/500</p>
          </div>

          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-5 py-3 rounded-full text-sm font-bold text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E8D5FF] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || (type === 'change-group' && candidateGroups.length === 0)}
              className="flex-[2] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] shadow-lg shadow-[#5A3D7A]/20 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando…' : (<><Check className="w-4 h-4" strokeWidth={3} /> Enviar solicitud</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
