// FriendlyTeaching.cl — HtmlLessonResponsesModal
//
// Teacher-side review of what students filled into the inputs of an
// uploaded-HTML lesson. Lists every student who has a
// `htmlLessonResponses` doc for this lesson, shows their most recent
// save time + submission state, and lets the teacher expand each row
// to read key → value pairs.
//
// Keys come from the DOM scan in HtmlContentSlide (data-key > name >
// id > auto_${index}). We render them verbatim because the teacher
// authored the HTML and will recognise the inputs.

'use client';
import { useMemo, useState } from 'react';
import { X, ChevronDown, ChevronRight, Inbox, Clock, Check } from 'lucide-react';
import { useLessonHtmlResponses } from '@/hooks/useHtmlLessonResponse';
import { useStudents } from '@/hooks/useStudents';
import type { Timestamp } from 'firebase/firestore';
import type { HtmlLessonResponse } from '@/types/firebase';

interface Props {
  lessonId:    string;
  lessonTitle: string;
  onClose:     () => void;
}

function formatWhen(ts: Timestamp | undefined): string {
  const d = ts?.toDate?.();
  if (!d) return '—';
  const now = Date.now();
  const diffMs = now - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1)  return 'ahora mismo';
  if (min < 60) return `hace ${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr}h`;
  return d.toLocaleDateString('es-CL', { month: 'short', day: '2-digit', year: 'numeric' });
}

/** Render a single answer value as readable text. Booleans arrive as
 *  the strings "true"/"false" (checkboxes); everything else is already
 *  text. Empty strings become a grey em-dash. */
function formatValue(v: string): React.ReactNode {
  if (v === '')       return <span className="text-gray-300">—</span>;
  if (v === 'true')   return <span className="text-emerald-600 font-semibold">✓ sí</span>;
  if (v === 'false')  return <span className="text-gray-400">✗ no</span>;
  return <span className="whitespace-pre-wrap">{v}</span>;
}

export default function HtmlLessonResponsesModal({ lessonId, lessonTitle, onClose }: Props) {
  const { responses, loading } = useLessonHtmlResponses(lessonId);
  const { students }           = useStudents();

  const studentNameByUid = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of students) m.set(s.uid, s.fullName);
    return m;
  }, [students]);

  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded(prev => prev === id ? null : id);
  }

  // Merge sort keys across responses so the header of the "all answers"
  // export view is stable. Not used in the current render but worth
  // keeping — leave the ordered-keys helper for when we add CSV export.
  // (Kept as local memo so it ships with the data.)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8] mb-0.5">Respuestas</p>
            <h2 className="font-bold text-[#5A3D7A] truncate">{lessonTitle}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {loading ? 'Cargando…' : `${responses.length} estudiante${responses.length === 1 ? '' : 's'} con respuestas guardadas`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : responses.length === 0 ? (
            <div className="bg-[#FAFAFF] border border-[#F0E5FF] rounded-2xl py-12 text-center">
              <Inbox className="w-8 h-8 text-[#C8A8DC] mx-auto mb-3" strokeWidth={1.8} />
              <p className="text-sm text-[#5A3D7A] font-semibold">Todavía no hay respuestas.</p>
              <p className="text-xs text-gray-400 mt-1">Cuando un estudiante abra esta lección y escriba algo en los inputs, va a aparecer acá en vivo.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {responses.map((r: HtmlLessonResponse) => (
                <ResponseRow
                  key={r.id}
                  response={r}
                  studentName={studentNameByUid.get(r.studentId) ?? r.studentId}
                  expanded={expanded === r.id}
                  onToggle={() => toggle(r.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ResponseRow({
  response, studentName, expanded, onToggle,
}: {
  response:    HtmlLessonResponse;
  studentName: string;
  expanded:    boolean;
  onToggle:    () => void;
}) {
  const entries = Object.entries(response.answers ?? {});
  const answered = entries.filter(([, v]) => v !== '' && v !== 'false').length;
  const total    = entries.length;

  return (
    <li className="border border-[#E8D5F0] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAFF] transition-colors text-left"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-[#9B7CB8] flex-shrink-0" strokeWidth={2.5} />
          : <ChevronRight className="w-4 h-4 text-[#9B7CB8] flex-shrink-0" strokeWidth={2.5} />
        }
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#2D1B4E] truncate">{studentName}</p>
          <p className="text-[11px] text-gray-400 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={2.5} />
            Última edición {formatWhen(response.updatedAt as unknown as Timestamp)}
            {response.submittedAt && (
              <>
                <span className="mx-1 text-gray-300">·</span>
                <Check className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
                <span className="text-emerald-700 font-semibold">Entregado</span>
              </>
            )}
          </p>
        </div>
        <span className="text-[10px] font-bold text-[#5A3D7A] bg-[#F0E5FF] px-2 py-0.5 rounded-full flex-shrink-0">
          {answered}/{total}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-[#F0E5FF] bg-[#FAFAFF] px-4 py-3">
          {entries.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Sin respuestas registradas.</p>
          ) : (
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[#E8D5F0]/60">
                {entries.map(([key, value]) => (
                  <tr key={key} className="align-top">
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-[#9B7CB8] whitespace-nowrap w-1/3 max-w-[180px] truncate">
                      {key}
                    </td>
                    <td className="py-1.5 text-[#2D1B4E]">{formatValue(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </li>
  );
}
