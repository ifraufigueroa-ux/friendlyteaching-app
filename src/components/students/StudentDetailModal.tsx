'use client';
// FriendlyTeaching.cl — Student Detail Modal
// Shows gap analysis radar chart, assessment history, and allows adding new evaluations.

import { useState } from 'react';
import { useSkillAssessments } from '@/hooks/useSkillAssessments';
import { useLevelHistory } from '@/hooks/useLevelHistory';
import { useExportReport } from '@/hooks/useExportReport';
import { SkillRadarChart } from './SkillRadarChart';
import { LevelTimeline } from './LevelTimeline';
import type { FTUser, SkillScores } from '@/types/firebase';
import type { ProgressReportData } from '@/app/api/export-report/route';

const SKILL_KEYS: (keyof SkillScores)[] = [
  'speaking',
  'listening',
  'reading',
  'writing',
  'grammar',
  'vocabulary',
];

const SKILL_META: Record<keyof SkillScores, { label: string; icon: string }> = {
  speaking: { label: 'Hablar', icon: '🗣️' },
  listening: { label: 'Escuchar', icon: '👂' },
  reading: { label: 'Leer', icon: '📖' },
  writing: { label: 'Escribir', icon: '✍️' },
  grammar: { label: 'Gramática', icon: '📐' },
  vocabulary: { label: 'Vocabulario', icon: '📚' },
};

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-600',
  A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-xl transition-transform hover:scale-110 focus:outline-none"
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

const STAR_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-amber-400', 'text-lime-500', 'text-green-500'];

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] rounded-full transition-all duration-500"
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-[#5A3D7A] w-6 text-right">{score}</span>
    </div>
  );
}

// ─── New assessment form ──────────────────────────────────────────────────────

function AssessmentForm({
  onSave,
  onCancel,
}: {
  onSave: (scores: SkillScores, notes: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [scores, setScores] = useState<SkillScores>({
    speaking: 3,
    listening: 3,
    reading: 3,
    writing: 3,
    grammar: 3,
    vocabulary: 3,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(scores, notes);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Evalúa el desempeño del estudiante en cada habilidad de 1 (inicial) a 5 (excelente).
      </p>

      {/* Radar preview */}
      <div className="bg-[#FFFCF7] rounded-2xl p-3 border border-[#E5D8F0]">
        <SkillRadarChart scores={scores} compact />
      </div>

      {/* Skill sliders */}
      <div className="space-y-3">
        {SKILL_KEYS.map(key => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-base w-6 text-center">{SKILL_META[key].icon}</span>
            <span className="text-sm font-semibold text-gray-700 w-24">{SKILL_META[key].label}</span>
            <div className={`${STAR_COLORS[scores[key]]}`}>
              <StarRating value={scores[key]} onChange={v => setScores(s => ({ ...s, [key]: v }))} />
            </div>
            <span className="text-xs text-gray-400 ml-auto">{scores[key]}/5</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
          Observaciones (opcional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Ej: Mejoró pronunciación pero necesita trabajar escritura..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : '💾 Guardar evaluación'}
        </button>
      </div>
    </div>
  );
}

// ─── Assessment history entry ─────────────────────────────────────────────────

function AssessmentCard({
  assessment,
  index,
  isLatest,
}: {
  assessment: import('@/types/firebase').SkillAssessment;
  index: number;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = useState(isLatest);
  const date = assessment.assessedAt?.toDate?.()
    ? assessment.assessedAt.toDate().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const avg =
    Math.round(
      ((assessment.scores.speaking +
        assessment.scores.listening +
        assessment.scores.reading +
        assessment.scores.writing +
        assessment.scores.grammar +
        assessment.scores.vocabulary) /
        6) *
        10,
    ) / 10;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isLatest ? 'border-[#C8A8DC] bg-[#FDFAFF]' : 'border-gray-100 bg-white'
      }`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {isLatest && (
            <span className="text-xs bg-[#C8A8DC] text-white px-2 py-0.5 rounded-full font-semibold">
              Última
            </span>
          )}
          <span className="text-sm font-semibold text-gray-700">
            Evaluación #{index + 1}
          </span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#5A3D7A]">Prom {avg}/5</span>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
          {SKILL_KEYS.map(key => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm w-5">{SKILL_META[key].icon}</span>
              <span className="text-xs text-gray-500 w-20">{SKILL_META[key].label}</span>
              <div className="flex-1">
                <ScoreBar score={assessment.scores[key]} />
              </div>
            </div>
          ))}
          {assessment.notes && (
            <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 rounded-lg px-3 py-2">
              &ldquo;{assessment.notes}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  student: FTUser;
  teacherId: string;
  onClose: () => void;
}

export function StudentDetailModal({ student, teacherId, onClose }: Props) {
  const { assessments, loading, addAssessment, averageScores } = useSkillAssessments(
    student.uid,
    teacherId,
  );
  const { history: levelHistory, loading: levelLoading } = useLevelHistory(student.uid, teacherId);
  const { exportReport, loading: exporting, error: exportError } = useExportReport();
  const [view, setView] = useState<'chart' | 'history' | 'level' | 'new'>('chart');

  function handleExportProgress() {
    const now = new Date();
    const periodStr = now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    const periodCapitalized = periodStr.charAt(0).toUpperCase() + periodStr.slice(1);

    const reportData: ProgressReportData = {
      type: 'progress',
      studentName: student.fullName,
      studentLevel: student.studentData?.level ?? 'A1',
      teacherName: 'Profesor FT',
      period: periodCapitalized,
      lessonsCompleted: assessments.length,
      totalLessons: assessments.length,
      homeworkScore: averageScores
        ? Math.round(((averageScores.speaking + averageScores.listening + averageScores.reading + averageScores.writing + averageScores.grammar + averageScores.vocabulary) / 6) * 10) / 10
        : 0,
      attendance: 100,
      ...(averageScores && {
        skillScores: {
          speaking: averageScores.speaking,
          listening: averageScores.listening,
          reading: averageScores.reading,
          writing: averageScores.writing,
          grammar: averageScores.grammar,
          vocabulary: averageScores.vocabulary,
        },
      }),
    };

    exportReport(reportData);
  }

  const level = student.studentData?.level;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="glass-strong rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-glass-xl max-h-[92vh] overflow-hidden flex flex-col border border-white/40">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm">
              {student.fullName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{student.fullName}</p>
              <div className="flex items-center gap-2">
                {level && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[level]}`}>
                    {level}
                  </span>
                )}
                <span className="text-xs text-gray-400">{student.email}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {([['chart', '📊 Análisis'], ['history', '📋 Historial'], ['level', '📈 Nivel'], ['new', '➕ Evaluar']] as const).map(
            ([tab, label]) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`flex-1 py-3 text-xs font-bold transition-colors ${
                  view === tab
                    ? 'text-[#5A3D7A] border-b-2 border-[#9B7CB8]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Chart view ── */}
          {view === 'chart' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : averageScores ? (
                <>
                  <p className="text-xs text-gray-400 text-center mb-1">
                    Promedio de {assessments.length} evaluación{assessments.length !== 1 ? 'es' : ''}
                  </p>
                  <SkillRadarChart
                    scores={averageScores}
                    previousScores={assessments.length > 1 ? assessments[assessments.length - 1].scores : null}
                  />
                  {/* Score summary row */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {SKILL_KEYS.map(key => (
                      <div
                        key={key}
                        className="bg-[#FDFAFF] rounded-xl px-3 py-2 border border-[#EDE0F6] text-center"
                      >
                        <p className="text-base">{SKILL_META[key].icon}</p>
                        <p className="text-xs text-gray-500 leading-tight">{SKILL_META[key].label}</p>
                        <p className="text-sm font-bold text-[#5A3D7A] mt-0.5">
                          {averageScores[key]}/5
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Identify weakest skill */}
                  {(() => {
                    const weakest = SKILL_KEYS.reduce((a, b) =>
                      averageScores[a] < averageScores[b] ? a : b,
                    );
                    const strongest = SKILL_KEYS.reduce((a, b) =>
                      averageScores[a] > averageScores[b] ? a : b,
                    );
                    return (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-3 py-2 text-xs font-semibold">
                          <span>⚠️</span>
                          <span>
                            Área a reforzar: <strong>{SKILL_META[weakest].label}</strong> ({averageScores[weakest]}/5)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-3 py-2 text-xs font-semibold">
                          <span>✅</span>
                          <span>
                            Mejor habilidad: <strong>{SKILL_META[strongest].label}</strong> ({averageScores[strongest]}/5)
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Export progress report button */}
                  <button
                    onClick={handleExportProgress}
                    disabled={exporting}
                    className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] hover:opacity-90 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {exporting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generando...
                      </>
                    ) : (
                      '📄 Exportar reporte de progreso'
                    )}
                  </button>
                  {exportError && (
                    <p className="text-xs text-red-500 text-center mt-1">{exportError}</p>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-gray-500 text-sm font-semibold">Sin evaluaciones aún</p>
                  <p className="text-xs text-gray-400 mt-1 mb-5">
                    Registra la primera evaluación para ver el análisis de brechas.
                  </p>
                  <button
                    onClick={() => setView('new')}
                    className="px-5 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    ➕ Primera evaluación
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── History view ── */}
          {view === 'history' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-gray-500 text-sm">Sin historial de evaluaciones.</p>
                </div>
              ) : (
                assessments.map((a, i) => (
                  <AssessmentCard
                    key={a.id}
                    assessment={a}
                    index={assessments.length - 1 - i}
                    isLatest={i === 0}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Level timeline view ── */}
          {view === 'level' && (
            <LevelTimeline
              history={levelHistory}
              currentLevel={student.studentData?.level ?? null}
              loading={levelLoading}
            />
          )}

          {/* ── New assessment view ── */}
          {view === 'new' && (
            <AssessmentForm
              onSave={async (scores, notes) => {
                await addAssessment(scores, notes);
                setView('chart');
              }}
              onCancel={() => setView('chart')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
