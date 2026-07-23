// FriendlyTeaching.cl — Export Report API Route
// Generates PDF progress reports or invoice exports.
// POST /api/export-report
// Body: { type: 'progress' | 'invoice', data: ... }
// Returns: PDF binary (application/pdf)

import { NextRequest, NextResponse } from 'next/server';
import { PLACEMENT_QUESTIONS, TOPIC_LABELS, LEVEL_SECTIONS } from '@/data/placementQuestions';
import type { PlacementAnswer, SectionScore, WeakArea, LearningProgram } from '@/types/placement';
import type { LessonLevel } from '@/types/firebase';
import type { WritingGradeResult, IELTSVersion } from '@/types/ielts-writing';
import type { ComponentId, ComponentResult } from '@/types/placement-suite';
import { VOCAB_TOPIC_LABELS, READING_TYPE_LABELS, COMPONENT_META } from '@/types/placement-suite';

export interface ProgressReportData {
  type: 'progress';
  studentName: string;
  studentLevel: string;
  teacherName: string;
  period: string;           // e.g. "Marzo 2026"
  lessonsCompleted: number;
  totalLessons: number;
  homeworkScore: number;    // average 1-7
  attendance: number;       // percentage
  skillScores?: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    grammar: number;
    vocabulary: number;
  };
  comments?: string;
  lessonsDetail?: { code: string; title: string; score?: number; date: string }[];
}

export interface InvoiceData {
  type: 'invoice';
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  period: string;
  amount: number;
  currency: string;
  status: string;
  classCount: number;
  classDetails?: { date: string; topic: string; duration: number }[];
  notes?: string;
}

export interface PlacementSuiteReportData {
  type:            'placement-suite';
  studentName:     string;
  studentEmail?:   string;
  studentPhone?:   string;
  components:      ComponentId[];
  results:         Partial<Record<ComponentId, ComponentResult>>;
  perSkillLevel?:  Partial<Record<ComponentId, LessonLevel>>;
  overallLevel?:   LessonLevel;
  weakAreas?:      WeakArea[];
  learningProgram?: LearningProgram;
  completedAt?:    string;   // ISO date
  mode:            'student-self' | 'teacher-led';
}

export interface WritingFeedbackReportData {
  type:            'writing-feedback';
  studentName?:    string;
  taskTitle:       string;
  version:         IELTSVersion;
  task:            1 | 2;
  taskLabel:       string;         // e.g. "Task 1 · Letter (formal)" or "Task 2 · opinion"
  prompt:          string;
  studentAnswer:   string;
  result:          WritingGradeResult;
  completedAt?:    string;         // ISO date
}

export interface PlacementReportData {
  type: 'placement';
  variant?: 'student' | 'teacher';  // default: 'student'
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  placedLevel?: LessonLevel;
  totalAnswered: number;
  totalCorrect: number;
  sectionScores?: SectionScore[];
  weakAreas?: WeakArea[];
  answers: PlacementAnswer[];
  completedAt?: string;    // ISO date string
  status: string;
  learningProgram?: LearningProgram;
}

type ExportRequest = ProgressReportData | InvoiceData | PlacementReportData | WritingFeedbackReportData | PlacementSuiteReportData;

// ── PDF generation using pure HTML → PDF conversion ──────────

function generateProgressHTML(data: ProgressReportData): string {
  const skillBars = data.skillScores ? Object.entries(data.skillScores).map(([skill, score]) => {
    const pct = (score / 5) * 100;
    const label = skill.charAt(0).toUpperCase() + skill.slice(1);
    return `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
          <span>${label}</span><span>${score}/5</span>
        </div>
        <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#C8A8DC,#9B7CB8);border-radius:4px;"></div>
        </div>
      </div>`;
  }).join('') : '';

  const lessonRows = (data.lessonsDetail ?? []).map(l =>
    `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:11px;">${l.code}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:11px;">${l.title}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:11px;text-align:center;">${l.score ?? '—'}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:11px;text-align:right;">${l.date}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:40px;color:#1F2937;font-size:13px;line-height:1.5;}
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding-bottom:16px;border-bottom:3px solid #C8A8DC;}
  .logo{font-size:22px;font-weight:800;color:#5A3D7A;}
  .subtitle{font-size:11px;color:#9CA3AF;}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
  .stat{background:#F9FAFB;border-radius:12px;padding:16px;text-align:center;}
  .stat-value{font-size:24px;font-weight:800;color:#5A3D7A;}
  .stat-label{font-size:10px;color:#9CA3AF;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;}
  .section{margin-bottom:24px;}
  .section-title{font-size:14px;font-weight:700;color:#5A3D7A;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #E5E7EB;}
  table{width:100%;border-collapse:collapse;}
  th{background:#F9FAFB;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;text-align:left;}
  .footer{margin-top:30px;padding-top:16px;border-top:2px solid #F3F4F6;font-size:10px;color:#9CA3AF;text-align:center;}
</style></head><body>
  <div class="header">
    <div>
      <div class="logo">FriendlyTeaching</div>
      <div class="subtitle">Reporte de Progreso · ${data.period}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:14px;font-weight:700;color:#1F2937;">${data.studentName}</div>
      <div style="font-size:12px;color:#6B7280;">Nivel ${data.studentLevel} · Prof. ${data.teacherName}</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-value">${data.lessonsCompleted}/${data.totalLessons}</div><div class="stat-label">Lecciones</div></div>
    <div class="stat"><div class="stat-value">${data.homeworkScore.toFixed(1)}</div><div class="stat-label">Nota promedio</div></div>
    <div class="stat"><div class="stat-value">${data.attendance}%</div><div class="stat-label">Asistencia</div></div>
    <div class="stat"><div class="stat-value">${data.studentLevel}</div><div class="stat-label">Nivel CEFR</div></div>
  </div>

  ${data.skillScores ? `<div class="section"><div class="section-title">Habilidades</div>${skillBars}</div>` : ''}

  ${lessonRows ? `<div class="section"><div class="section-title">Detalle de lecciones</div>
    <table><thead><tr><th>Código</th><th>Lección</th><th style="text-align:center;">Nota</th><th style="text-align:right;">Fecha</th></tr></thead>
    <tbody>${lessonRows}</tbody></table></div>` : ''}

  ${data.comments ? `<div class="section"><div class="section-title">Comentarios del profesor</div><p style="font-size:12px;color:#4B5563;">${data.comments}</p></div>` : ''}

  <div class="footer">Generado por FriendlyTeaching.cl · ${new Date().toLocaleDateString('es-CL')}</div>
</body></html>`;
}

function generateInvoiceHTML(data: InvoiceData): string {
  const classRows = (data.classDetails ?? []).map(c =>
    `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:11px;">${c.date}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:11px;">${c.topic}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #F3F4F6;font-size:11px;text-align:right;">${c.duration} min</td>
    </tr>`
  ).join('');

  const statusColor = data.status === 'paid' ? '#22C55E' : data.status === 'overdue' ? '#EF4444' : '#F59E0B';
  const statusLabel = data.status === 'paid' ? 'Pagado' : data.status === 'overdue' ? 'Vencido' : 'Pendiente';

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:40px;color:#1F2937;font-size:13px;}
  .header{display:flex;justify-content:space-between;margin-bottom:30px;padding-bottom:16px;border-bottom:3px solid #C8A8DC;}
  .logo{font-size:22px;font-weight:800;color:#5A3D7A;}
  .invoice-label{font-size:28px;font-weight:300;color:#C8A8DC;letter-spacing:2px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;}
  .info-box{background:#F9FAFB;border-radius:12px;padding:16px;}
  .info-label{font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;}
  .info-value{font-size:14px;font-weight:600;color:#1F2937;}
  .total-box{background:#5A3D7A;color:white;border-radius:12px;padding:20px;text-align:center;margin:24px 0;}
  .total-amount{font-size:32px;font-weight:800;}
  .total-label{font-size:11px;opacity:0.8;margin-top:4px;}
  table{width:100%;border-collapse:collapse;}
  th{background:#F9FAFB;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;text-align:left;}
  .footer{margin-top:30px;padding-top:16px;border-top:2px solid #F3F4F6;font-size:10px;color:#9CA3AF;text-align:center;}
</style></head><body>
  <div class="header">
    <div>
      <div class="logo">FriendlyTeaching</div>
      <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">${data.teacherName} · ${data.teacherEmail}</div>
    </div>
    <div style="text-align:right;">
      <div class="invoice-label">FACTURA</div>
      <div style="font-size:11px;color:#6B7280;">${data.period}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Estudiante</div>
      <div class="info-value">${data.studentName}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Estado</div>
      <div class="info-value" style="color:${statusColor};">${statusLabel}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Período</div>
      <div class="info-value">${data.period}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Clases</div>
      <div class="info-value">${data.classCount} clases</div>
    </div>
  </div>

  <div class="total-box">
    <div class="total-amount">${data.currency} ${data.amount.toLocaleString()}</div>
    <div class="total-label">Total a pagar</div>
  </div>

  ${classRows ? `<div style="margin-bottom:24px;"><div style="font-size:14px;font-weight:700;color:#5A3D7A;margin-bottom:12px;">Detalle de clases</div>
    <table><thead><tr><th>Fecha</th><th>Tema</th><th style="text-align:right;">Duración</th></tr></thead>
    <tbody>${classRows}</tbody></table></div>` : ''}

  ${data.notes ? `<div style="margin-bottom:24px;background:#FEF3C7;border-radius:12px;padding:12px;"><p style="font-size:11px;color:#92400E;margin:0;"><strong>Nota:</strong> ${data.notes}</p></div>` : ''}

  <div class="footer">Generado por FriendlyTeaching.cl · ${new Date().toLocaleDateString('es-CL')}</div>
</body></html>`;
}

// ── Level styling helpers ─────────────────────────────────────
const LEVEL_BADGE_STYLE: Record<string, string> = {
  A0: 'background:#F3F0FF;color:#5A3D7A',
  A1: 'background:#EEF2FF;color:#3730A3',
  A2: 'background:#E0F2FE;color:#0369A1',
  B1: 'background:#F0FDF4;color:#15803D',
  'B1+': 'background:#ECFDF5;color:#047857',
  B2: 'background:#FFFBEB;color:#B45309',
  C1: 'background:#FFF7ED;color:#C2410C',
};
const LEVEL_BAR_COLOR: Record<string, string> = {
  A0: '#C8A8DC', A1: '#818CF8', A2: '#38BDF8',
  B1: '#4ADE80', 'B1+': '#34D399', B2: '#FBBF24', C1: '#FB923C',
};

function generateLearningProgramHTML(program: LearningProgram): string {
  const phaseColors = [
    { bg: '#F0E5FF', accent: '#5A3D7A', label: 'Foundation' },
    { bg: '#E0F2FE', accent: '#0369A1', label: 'Development' },
    { bg: '#ECFDF5', accent: '#047857', label: 'Consolidation' },
  ];

  const weekRows = program.weeks.map((week) => {
    const phase = week.week <= 4 ? 0 : week.week <= 8 ? 1 : 2;
    const ph = phaseColors[phase];
    return `
    <tr style="background:${ph.bg};">
      <td style="padding:10px 12px;vertical-align:middle;width:48px;">
        <div style="width:36px;height:36px;border-radius:10px;background:${ph.accent};color:white;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1;">W${week.week}</div>
      </td>
      <td style="padding:10px 12px;vertical-align:middle;">
        <div style="font-size:12px;font-weight:700;color:${ph.accent};margin-bottom:2px;">${week.focus}
          <span style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;padding:1px 6px;border-radius:4px;background:${ph.accent}20;color:${ph.accent};margin-left:6px;">${ph.label}</span>
        </div>
        <div style="font-size:10px;color:#64748B;">${week.description}</div>
      </td>
    </tr>`;
  }).join('');

  const levelBadgeStyle = `background:#F0E5FF;color:#5A3D7A`;

  return `
  <div style="margin-top:40px;page-break-before:always;">
    <div style="font-size:13px;font-weight:800;color:#5A3D7A;padding-bottom:8px;border-bottom:2px solid #F0E5FF;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px;">
      12-Week Personalised Learning Program
    </div>
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,#F0E5FF,#E0D5FF);margin-bottom:16px;">
      <span style="display:inline-block;padding:5px 14px;border-radius:20px;font-size:15px;font-weight:800;${levelBadgeStyle}">${program.placedLevel}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:#5A3D7A;">Personalised plan based on test results</div>
        <div style="font-size:10px;color:#9B7CB8;">${program.weakAreas.length} weak area${program.weakAreas.length !== 1 ? 's' : ''} addressed in the first 6 weeks</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;">
      <tbody>${weekRows}</tbody>
    </table>
  </div>`;
}

function generatePlacementHTML(data: PlacementReportData, logoUrl: string): string {
  const accuracy = data.totalAnswered > 0
    ? Math.round((data.totalCorrect / data.totalAnswered) * 100) : 0;

  const dateStr = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Section scores table ──────────────────────────────────
  const sectionRows = (data.sectionScores ?? []).map((s) => {
    const barColor = s.total < 4 ? '#E0D5FF' : s.passed ? (LEVEL_BAR_COLOR[s.level] ?? '#4ADE80') : '#FCA5A5';
    const badgeStyle = LEVEL_BADGE_STYLE[s.level] ?? 'background:#F3F0FF;color:#5A3D7A';
    const statusIcon = s.total < 4 ? '—' : s.passed ? '✓' : '✗';
    const statusColor = s.total < 4 ? '#9B7CB8' : s.passed ? '#15803D' : '#DC2626';
    const pct = s.total > 0 ? s.pct : 0;

    return `
    <tr>
      <td style="padding:8px 12px;vertical-align:middle;">
        <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;${badgeStyle}">${s.level}</span>
      </td>
      <td style="padding:8px 12px;vertical-align:middle;">
        <div style="height:10px;background:#F0E5FF;border-radius:5px;overflow:hidden;min-width:120px;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:5px;"></div>
        </div>
      </td>
      <td style="padding:8px 12px;text-align:center;font-size:12px;font-weight:700;color:${statusColor};">${s.total > 0 ? pct + '%' : '—'}</td>
      <td style="padding:8px 12px;text-align:center;font-size:12px;color:#5A3D7A;">${s.total > 0 ? `${s.correct}/${s.total}` : '—'}</td>
      <td style="padding:8px 12px;text-align:center;font-size:14px;color:${statusColor};">${statusIcon}</td>
    </tr>`;
  }).join('');

  // ── Weak areas ────────────────────────────────────────────
  const weakChips = (data.weakAreas ?? []).map((w) => {
    const bg = w.pct === 0 ? '#FEE2E2' : '#FEF3C7';
    const color = w.pct === 0 ? '#991B1B' : '#92400E';
    return `<span style="display:inline-block;background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;margin:2px;">${TOPIC_LABELS[w.topic] ?? w.topic} ${w.pct}%</span>`;
  }).join('');

  // ── Question breakdown by section ─────────────────────────
  // Build a map of answered questions
  const answeredMap = new Map<number, PlacementAnswer>();
  for (const a of data.answers) answeredMap.set(a.questionId, a);

  const LEVELS_ORDER: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

  const questionSections = LEVELS_ORDER.map((level) => {
    const range = LEVEL_SECTIONS[level];
    if (!range) return '';

    const questions = PLACEMENT_QUESTIONS.filter(q => q.id >= range.start && q.id <= range.end);
    const badgeStyle = LEVEL_BADGE_STYLE[level] ?? 'background:#F3F0FF;color:#5A3D7A';

    const rows = questions.map((q) => {
      const ans = answeredMap.get(q.id);

      if (!ans) {
        // Not reached
        return `<tr style="background:#FDFAFF;">
          <td style="padding:6px 10px;font-size:10px;color:#C8A8DC;border-bottom:1px solid #F0E5FF;">${q.id}</td>
          <td style="padding:6px 10px;font-size:10px;color:#9B7CB8;border-bottom:1px solid #F0E5FF;" colspan="3">${q.sentence}</td>
          <td style="padding:6px 10px;text-align:center;font-size:11px;color:#C8A8DC;border-bottom:1px solid #F0E5FF;">—</td>
          <td style="padding:6px 10px;text-align:center;font-size:11px;color:#C8A8DC;border-bottom:1px solid #F0E5FF;">Not reached</td>
        </tr>`;
      }

      const selectedOpt = ans.selected !== null ? q.options[ans.selected] : '—';
      const correctOpt  = q.options[q.correct];
      const icon        = ans.correct ? '✓' : '✗';
      const iconColor   = ans.correct ? '#15803D' : '#DC2626';
      const rowBg       = ans.correct ? '#FAFFFE' : '#FFFAFA';

      return `<tr style="background:${rowBg};">
        <td style="padding:6px 10px;font-size:10px;color:#9B7CB8;border-bottom:1px solid #F0E5FF;">${q.id}</td>
        <td style="padding:6px 10px;font-size:10px;color:#2D1B4E;border-bottom:1px solid #F0E5FF;">${q.sentence}</td>
        <td style="padding:6px 10px;font-size:10px;color:${ans.correct ? '#15803D' : '#DC2626'};border-bottom:1px solid #F0E5FF;font-weight:${ans.correct ? '400' : '600'};">${selectedOpt}</td>
        <td style="padding:6px 10px;font-size:10px;color:#15803D;border-bottom:1px solid #F0E5FF;font-weight:600;">${correctOpt}</td>
        <td style="padding:6px 10px;text-align:center;font-size:15px;color:${iconColor};border-bottom:1px solid #F0E5FF;">${icon}</td>
        <td style="padding:6px 10px;text-align:center;border-bottom:1px solid #F0E5FF;"></td>
      </tr>`;
    }).join('');

    const answered    = questions.filter(q => answeredMap.has(q.id)).length;
    const correct     = questions.filter(q => answeredMap.get(q.id)?.correct).length;

    return `
    <div style="margin-bottom:20px;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:800;${badgeStyle}">${level}</span>
        <span style="font-size:11px;color:#9B7CB8;">${answered}/${questions.length} answered · ${correct} correct</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:#F0E5FF;">
            <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:30px;">#</th>
            <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;">Question</th>
            <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;">Student answer</th>
            <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;">Correct answer</th>
            <th style="padding:6px 10px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:30px;">✓✗</th>
            <th style="width:40px;"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Placement Test Report — ${data.studentName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1F2937; background: white; font-size: 13px; line-height: 1.5; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .hero { background: linear-gradient(135deg, #5A3D7A 0%, #9B7CB8 100%); border-radius: 16px; padding: 28px; margin-bottom: 28px; color: white; position: relative; overflow: hidden; }
  .hero-bg1 { position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08); }
  .hero-bg2 { position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.06); }
  .brand-row { display:flex;align-items:center;gap:10px;margin-bottom:20px; }
  .brand-logo { width:36px;height:36px;border-radius:10px;overflow:hidden;flex-shrink:0; }
  .brand-name { font-size:16px;font-weight:800;letter-spacing:-0.3px; }
  .brand-tld { font-size:11px;opacity:0.6; }
  .hero-main { display:flex;justify-content:space-between;align-items:flex-end; }
  .student-name { font-size:22px;font-weight:800;letter-spacing:-0.5px; }
  .student-sub { font-size:12px;opacity:0.75;margin-top:4px; }
  .level-pill { background:rgba(255,255,255,0.25);border-radius:12px;padding:12px 20px;text-align:center;flex-shrink:0; }
  .level-value { font-size:28px;font-weight:900; }
  .level-label { font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:0.75;margin-top:2px; }
  .stats-row { display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px; }
  .stat-box { background:#F9FAFF;border-radius:12px;padding:16px;text-align:center;border:1px solid #E0D5FF; }
  .stat-value { font-size:26px;font-weight:800;color:#5A3D7A; }
  .stat-label { font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#9B7CB8;margin-top:4px; }
  .section-title { font-size:13px;font-weight:800;color:#5A3D7A;padding-bottom:8px;border-bottom:2px solid #F0E5FF;margin-bottom:14px;margin-top:28px;text-transform:uppercase;letter-spacing:0.5px; }
  .print-btn { position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#6B4F8A,#5A3D7A);color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(90,61,122,0.35); }
  .footer { margin-top:40px;padding-top:16px;border-top:2px solid #F0E5FF;font-size:10px;color:#C8A8DC;text-align:center; }
</style>
</head>
<body>
<div class="page">

  <!-- Hero -->
  <div class="hero">
    <div class="hero-bg1"></div>
    <div class="hero-bg2"></div>
    <div class="brand-row">
      <div class="brand-logo">
        <img src="${logoUrl}" alt="FT" style="width:36px;height:36px;object-fit:cover;" onerror="this.style.display='none'"/>
      </div>
      <div>
        <div class="brand-name">FriendlyTeaching</div>
        <div class="brand-tld">.cl · Grammar Placement Test</div>
      </div>
    </div>
    <div class="hero-main">
      <div>
        <div class="student-name">${data.studentName}</div>
        <div class="student-sub">
          ${data.studentEmail ?? ''}${data.studentPhone ? ' · ' + data.studentPhone : ''}
        </div>
        <div style="font-size:11px;opacity:0.6;margin-top:6px;">${dateStr}</div>
      </div>
      ${data.placedLevel ? `
      <div class="level-pill">
        <div class="level-value">${data.placedLevel}</div>
        <div class="level-label">Placed level</div>
      </div>` : ''}
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-value">${data.totalAnswered}</div>
      <div class="stat-label">Questions answered</div>
    </div>
    <div class="stat-box">
      <div class="stat-value" style="color:#15803D;">${data.totalCorrect}</div>
      <div class="stat-label">Correct</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${accuracy}%</div>
      <div class="stat-label">Overall accuracy</div>
    </div>
  </div>

  <!-- Section scores -->
  ${data.sectionScores && data.sectionScores.length > 0 ? `
  <div class="section-title">Score by level</div>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#F0E5FF;">
        <th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:60px;">Level</th>
        <th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;">Progress</th>
        <th style="padding:8px 12px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:60px;">Score</th>
        <th style="padding:8px 12px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:70px;">Answered</th>
        <th style="padding:8px 12px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:40px;">Pass</th>
      </tr>
    </thead>
    <tbody>${sectionRows}</tbody>
  </table>` : ''}

  <!-- Weak areas -->
  ${data.weakAreas && data.weakAreas.length > 0 ? `
  <div class="section-title">Weak areas to focus on</div>
  <div style="line-height:2;">${weakChips}</div>` : ''}

  <!-- Question breakdown -->
  <div class="section-title page-break" style="margin-top:36px;">Question breakdown</div>
  <p style="font-size:11px;color:#9B7CB8;margin-bottom:16px;">
    Legend: <strong style="color:#15803D;">✓ Correct</strong> &nbsp;
    <strong style="color:#DC2626;">✗ Incorrect</strong> &nbsp;
    <strong style="color:#C8A8DC;">— Not reached</strong>
  </p>
  ${questionSections}

  <!-- Learning program (teacher PDF only) -->
  ${data.variant === 'teacher' && data.learningProgram ? generateLearningProgramHTML(data.learningProgram) : ''}

  <div class="footer">
    Generated by FriendlyTeaching.cl · ${new Date().toLocaleDateString('es-CL')} · Grammar Placement Test Report
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>
</body>
</html>`;
}

// ── IELTS Writing feedback PDF ───────────────────────────────────

function bandColor(band: number): string {
  if (band >= 8) return '#15803D';
  if (band >= 7) return '#5A3D7A';
  if (band >= 6) return '#0369A1';
  if (band >= 5) return '#B45309';
  return '#DC2626';
}
function bandBg(band: number): string {
  if (band >= 8) return '#DCFCE7';
  if (band >= 7) return '#F0E5FF';
  if (band >= 6) return '#E0F2FE';
  if (band >= 5) return '#FEF3C7';
  return '#FEE2E2';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function generateWritingFeedbackHTML(data: WritingFeedbackReportData, logoUrl: string): string {
  const r = data.result;
  const dateStr = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

  const criterion1Label = data.task === 1 ? 'Task Achievement' : 'Task Response';
  const versionLabel    = data.version === 'academic' ? 'Academic' : 'General Training';

  const criteria = [
    { title: criterion1Label,              score: r.taskAchievement   },
    { title: 'Coherence & Cohesion',       score: r.coherenceCohesion },
    { title: 'Lexical Resource',           score: r.lexicalResource   },
    { title: 'Grammatical Range',          score: r.grammarAccuracy   },
  ];

  const criterionCards = criteria.map(({ title, score }) => `
    <div style="background:#FFFFFF;border:1px solid #F0E5FF;border-radius:14px;padding:14px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#5A3D7A;">${escapeHtml(title)}</div>
        <span style="font-size:14px;font-weight:900;padding:3px 10px;border-radius:20px;background:${bandBg(score.band)};color:${bandColor(score.band)};">
          ${score.band.toFixed(1)}
        </span>
      </div>
      <div style="height:6px;background:#F0E5FF;border-radius:3px;overflow:hidden;margin-bottom:10px;">
        <div style="height:100%;width:${(score.band / 9) * 100}%;background:${bandColor(score.band)};border-radius:3px;"></div>
      </div>
      <p style="font-size:11px;color:#374151;line-height:1.5;margin-bottom:8px;">${escapeHtml(score.summary)}</p>
      ${score.strengths.length ? `
      <div style="margin-bottom:6px;">
        <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;color:#15803D;margin-bottom:3px;">Fortalezas</div>
        <ul style="margin:0;padding-left:16px;">
          ${score.strengths.map(s => `<li style="font-size:10px;color:#4B5563;line-height:1.5;">${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${score.improvements.length ? `
      <div>
        <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.6px;color:#B45309;margin-bottom:3px;">A mejorar</div>
        <ul style="margin:0;padding-left:16px;">
          ${score.improvements.map(s => `<li style="font-size:10px;color:#4B5563;line-height:1.5;">${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>` : ''}
    </div>
  `).join('');

  const errorsList = r.keyErrors.length ? `
    <div class="section-title">Errores específicos</div>
    <ul style="margin:0;padding-left:20px;">
      ${r.keyErrors.map(e => `<li style="font-size:11px;color:#374151;line-height:1.6;margin-bottom:4px;">${escapeHtml(e)}</li>`).join('')}
    </ul>
  ` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>IELTS Writing Feedback — ${escapeHtml(data.taskTitle)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1F2937; background: white; font-size: 13px; line-height: 1.5; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
  .page { max-width: 820px; margin: 0 auto; padding: 40px; }
  .hero { background: linear-gradient(135deg, #5A3D7A 0%, #9B7CB8 100%); border-radius: 16px; padding: 28px; margin-bottom: 24px; color: white; position: relative; overflow: hidden; }
  .hero-bg1 { position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08); }
  .brand-row { display:flex;align-items:center;gap:10px;margin-bottom:18px; }
  .brand-logo { width:36px;height:36px;border-radius:10px;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,0.15); }
  .brand-name { font-size:16px;font-weight:800;letter-spacing:-0.3px; }
  .brand-tld { font-size:11px;opacity:0.6; }
  .hero-main { display:flex;justify-content:space-between;align-items:flex-end;gap:20px; }
  .task-label { font-size:10px;text-transform:uppercase;letter-spacing:1.2px;opacity:0.7;margin-bottom:6px; }
  .task-title { font-size:22px;font-weight:800;letter-spacing:-0.4px; }
  .task-sub { font-size:12px;opacity:0.7;margin-top:4px; }
  .band-pill { background:rgba(255,255,255,0.2);border-radius:14px;padding:12px 22px;text-align:center;flex-shrink:0; }
  .band-value { font-size:36px;font-weight:900;line-height:1; }
  .band-label { font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:0.75;margin-top:4px; }
  .criteria-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px; }
  .section-title { font-size:12px;font-weight:800;color:#5A3D7A;padding-bottom:8px;border-bottom:2px solid #F0E5FF;margin-bottom:14px;margin-top:24px;text-transform:uppercase;letter-spacing:0.6px; }
  .prompt-box { background:#F0E5FF;border-left:4px solid #9B7CB8;border-radius:8px;padding:14px 16px;font-size:12px;color:#2D1B4E;line-height:1.6;white-space:pre-line; }
  .answer-block { background:#FDFAFF;border:1px solid #F0E5FF;border-radius:12px;padding:16px;font-family:'Courier New',monospace;font-size:11px;color:#1F2937;line-height:1.7;white-space:pre-wrap; }
  .corrected-block { background:#DCFCE7;border:1px solid #86EFAC;border-radius:12px;padding:16px;font-family:'Courier New',monospace;font-size:11px;color:#064E3B;line-height:1.7;white-space:pre-wrap; }
  .comparison { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
  .print-btn { position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#6B4F8A,#5A3D7A);color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(90,61,122,0.35); }
  .footer { margin-top:36px;padding-top:16px;border-top:2px solid #F0E5FF;font-size:10px;color:#C8A8DC;text-align:center; }
</style>
</head>
<body>
<div class="page">

  <div class="hero">
    <div class="hero-bg1"></div>
    <div class="brand-row">
      <div class="brand-logo">
        <img src="${logoUrl}" alt="FT" style="width:36px;height:36px;object-fit:cover;" onerror="this.style.display='none'"/>
      </div>
      <div>
        <div class="brand-name">FriendlyTeaching</div>
        <div class="brand-tld">.cl · IELTS Writing Feedback</div>
      </div>
    </div>
    <div class="hero-main">
      <div style="flex:1;min-width:0;">
        <div class="task-label">${versionLabel} · ${escapeHtml(data.taskLabel)}</div>
        <div class="task-title">${escapeHtml(data.taskTitle)}</div>
        <div class="task-sub">
          ${data.studentName ? escapeHtml(data.studentName) + ' · ' : ''}${r.wordCount} palabras · ${dateStr}
        </div>
      </div>
      <div class="band-pill">
        <div class="band-value">${r.overallBand.toFixed(1)}</div>
        <div class="band-label">Overall band</div>
      </div>
    </div>
  </div>

  <div class="section-title" style="margin-top:0;">Prompt</div>
  <div class="prompt-box">${escapeHtml(data.prompt)}</div>

  <div class="section-title">Desglose por criterio</div>
  <div class="criteria-grid">
    ${criterionCards}
  </div>

  ${errorsList}

  <div class="section-title page-break">Comparación</div>
  <div class="comparison">
    <div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#6B7280;margin-bottom:6px;">Tu respuesta</div>
      <div class="answer-block">${escapeHtml(data.studentAnswer)}</div>
    </div>
    <div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;color:#15803D;margin-bottom:6px;">Versión banda 8+</div>
      <div class="corrected-block">${escapeHtml(r.correctedVersion)}</div>
    </div>
  </div>

  <div class="footer">
    Generated by FriendlyTeaching.cl · ${new Date().toLocaleDateString('es-CL')} · IELTS Writing AI Feedback
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>
</body>
</html>`;
}

// ── Placement Suite PDF (multi-component: grammar + vocab + reading) ───────

function componentLabel(cid: ComponentId): string {
  return COMPONENT_META[cid]?.label ?? cid;
}
function componentIcon(cid: ComponentId): string {
  return COMPONENT_META[cid]?.icon ?? '❓';
}

function suiteWeakAreaLabel(topic: string): string {
  return (TOPIC_LABELS[topic] as string)
      ?? (VOCAB_TOPIC_LABELS[topic as keyof typeof VOCAB_TOPIC_LABELS] as string)
      ?? (READING_TYPE_LABELS[topic as keyof typeof READING_TYPE_LABELS] as string)
      ?? topic;
}

function generatePlacementSuiteHTML(data: PlacementSuiteReportData, logoUrl: string): string {
  const dateStr = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

  const overallLevel = data.overallLevel ?? 'A0';
  const overallStyle = LEVEL_BADGE_STYLE[overallLevel] ?? 'background:#F3F0FF;color:#5A3D7A';

  // Per-skill rows
  const skillRows = data.components.map((cid) => {
    const res = data.results[cid];
    const lvl = data.perSkillLevel?.[cid] ?? res?.placedLevel ?? '—';
    const barColor = LEVEL_BAR_COLOR[lvl] ?? '#C8A8DC';
    const badgeStyle = LEVEL_BADGE_STYLE[lvl] ?? 'background:#F3F0FF;color:#5A3D7A';
    const answered = res?.totalAnswered ?? 0;
    const correct = res?.totalCorrect ?? 0;
    const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return `
    <tr>
      <td style="padding:12px;vertical-align:middle;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">${componentIcon(cid)}</span>
          <div>
            <p style="font-size:13px;font-weight:700;color:#1F2937;margin:0;">${componentLabel(cid)}</p>
            <p style="font-size:10px;color:#9B7CB8;margin:2px 0 0;">${answered} question${answered !== 1 ? 's' : ''} · ${pct}% accuracy</p>
          </div>
        </div>
      </td>
      <td style="padding:12px;vertical-align:middle;width:180px;">
        <div style="height:8px;background:#F0E5FF;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;"></div>
        </div>
      </td>
      <td style="padding:12px;text-align:center;width:80px;vertical-align:middle;">
        <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:800;${badgeStyle}">${lvl}</span>
      </td>
    </tr>`;
  }).join('');

  // Per-component details (adaptive path for grammar; section scores for others)
  const componentDetails = data.components.map((cid) => {
    const res = data.results[cid];
    if (!res) return '';
    const badgeStyle = LEVEL_BADGE_STYLE[res.placedLevel] ?? 'background:#F3F0FF;color:#5A3D7A';

    // Section score rows per level
    const sectionRows = (res.sectionScores ?? [])
      .filter(s => s.total > 0)
      .map((s) => {
        const bar = s.total < 4 ? '#E0D5FF' : s.passed ? (LEVEL_BAR_COLOR[s.level] ?? '#4ADE80') : '#FCA5A5';
        const badge = LEVEL_BADGE_STYLE[s.level] ?? 'background:#F3F0FF;color:#5A3D7A';
        const statusColor = s.total < 4 ? '#9B7CB8' : s.passed ? '#15803D' : '#DC2626';
        return `
        <tr>
          <td style="padding:6px 10px;vertical-align:middle;">
            <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;${badge}">${s.level}</span>
          </td>
          <td style="padding:6px 10px;vertical-align:middle;">
            <div style="height:6px;background:#F0E5FF;border-radius:3px;overflow:hidden;min-width:100px;">
              <div style="height:100%;width:${s.pct}%;background:${bar};border-radius:3px;"></div>
            </div>
          </td>
          <td style="padding:6px 10px;text-align:center;font-size:11px;font-weight:700;color:${statusColor};">${s.pct}%</td>
          <td style="padding:6px 10px;text-align:center;font-size:11px;color:#5A3D7A;">${s.correct}/${s.total}</td>
        </tr>`;
      }).join('');

    // Weak areas chips (top 6)
    const weakChips = (res.weakAreas ?? []).slice(0, 6).map((w) => {
      const bg = w.pct === 0 ? '#FEE2E2' : '#FEF3C7';
      const color = w.pct === 0 ? '#991B1B' : '#92400E';
      return `<span style="display:inline-block;background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;margin:2px;">${suiteWeakAreaLabel(w.topic)} ${w.pct}%</span>`;
    }).join('');

    return `
    <div style="margin-bottom:24px;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="font-size:22px;">${componentIcon(cid)}</span>
        <div style="flex:1;">
          <p style="font-size:14px;font-weight:800;color:#5A3D7A;margin:0;">${componentLabel(cid)}</p>
          <p style="font-size:10px;color:#9B7CB8;margin:2px 0 0;">
            ${res.totalCorrect}/${res.totalAnswered} correct
            ${res.stopped ? ' · auto-stopped' : ''}
            ${cid === 'grammar' ? ' · adaptive path' : ''}
          </p>
        </div>
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:800;${badgeStyle}">${res.placedLevel}</span>
      </div>
      ${sectionRows ? `
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr style="background:#F0E5FF;">
            <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:60px;">Level</th>
            <th style="padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;">Progress</th>
            <th style="padding:6px 10px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:60px;">Score</th>
            <th style="padding:6px 10px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:#9B7CB8;width:70px;">Q's</th>
          </tr>
        </thead>
        <tbody>${sectionRows}</tbody>
      </table>` : ''}
      ${weakChips ? `<div style="line-height:2;">${weakChips}</div>` : ''}
    </div>`;
  }).join('');

  // Merged weak areas (across all components)
  const mergedWeakChips = (data.weakAreas ?? []).slice(0, 12).map((w) => {
    const bg = w.pct === 0 ? '#FEE2E2' : w.pct < 40 ? '#FED7AA' : '#FEF3C7';
    const color = w.pct === 0 ? '#991B1B' : w.pct < 40 ? '#7C2D12' : '#92400E';
    return `<span style="display:inline-block;background:${bg};color:${color};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;margin:2px;">${suiteWeakAreaLabel(w.topic)} ${w.pct}%</span>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Placement Suite Report — ${data.studentName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1F2937; background: white; font-size: 13px; line-height: 1.5; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }
  .page { max-width: 820px; margin: 0 auto; padding: 40px; }
  .hero { background: linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%); border-radius: 16px; padding: 28px; margin-bottom: 28px; color: white; position: relative; overflow: hidden; }
  .hero-bg1 { position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.08); }
  .hero-bg2 { position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.06); }
  .brand-row { display:flex;align-items:center;gap:10px;margin-bottom:20px; }
  .brand-logo { width:36px;height:36px;border-radius:10px;overflow:hidden;flex-shrink:0;background:rgba(255,255,255,0.15); }
  .brand-name { font-size:16px;font-weight:800;letter-spacing:-0.3px; }
  .brand-tld { font-size:11px;opacity:0.6; }
  .hero-main { display:flex;justify-content:space-between;align-items:flex-end;gap:20px; }
  .student-name { font-size:22px;font-weight:800;letter-spacing:-0.5px; }
  .student-sub { font-size:12px;opacity:0.75;margin-top:4px; }
  .level-pill { background:rgba(255,255,255,0.25);border-radius:14px;padding:14px 22px;text-align:center;flex-shrink:0; }
  .level-value { font-size:32px;font-weight:900;line-height:1; }
  .level-label { font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:0.8;margin-top:4px; }
  .section-title { font-size:12px;font-weight:800;color:#5A3D7A;padding-bottom:8px;border-bottom:2px solid #F0E5FF;margin-bottom:14px;margin-top:28px;text-transform:uppercase;letter-spacing:0.6px; }
  .print-btn { position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#6B4F8A,#5A3D7A);color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(90,61,122,0.35); }
  .footer { margin-top:36px;padding-top:16px;border-top:2px solid #F0E5FF;font-size:10px;color:#C8A8DC;text-align:center; }
  .mode-tag { display:inline-block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.2);color:white;margin-top:6px; }
</style>
</head>
<body>
<div class="page">

  <!-- Hero -->
  <div class="hero">
    <div class="hero-bg1"></div>
    <div class="hero-bg2"></div>
    <div class="brand-row">
      <div class="brand-logo">
        <img src="${logoUrl}" alt="FT" style="width:36px;height:36px;object-fit:cover;" onerror="this.style.display='none'"/>
      </div>
      <div>
        <div class="brand-name">FriendlyTeaching</div>
        <div class="brand-tld">.cl · Complete Placement Test</div>
      </div>
    </div>
    <div class="hero-main">
      <div>
        <div class="student-name">${data.studentName}</div>
        <div class="student-sub">
          ${data.studentEmail ?? ''}${data.studentPhone ? ' · ' + data.studentPhone : ''}
        </div>
        <div style="font-size:11px;opacity:0.6;margin-top:6px;">${dateStr}</div>
        <span class="mode-tag">${data.mode === 'teacher-led' ? '👤 Live session' : '🎓 Self-assessment'}</span>
      </div>
      <div class="level-pill">
        <div class="level-value">${overallLevel}</div>
        <div class="level-label">Overall CEFR</div>
      </div>
    </div>
  </div>

  <!-- Per-skill overview -->
  <div class="section-title" style="margin-top:0;">Nivel por habilidad</div>
  <p style="font-size:11px;color:#9B7CB8;margin-bottom:14px;font-style:italic;">
    Nivel global = mínimo entre habilidades (regla estándar CEFR).
  </p>
  <table style="width:100%;border-collapse:collapse;border:1px solid #F0E5FF;border-radius:12px;overflow:hidden;">
    <tbody>${skillRows}</tbody>
  </table>

  <!-- Merged weak areas -->
  ${mergedWeakChips ? `
  <div class="section-title">Áreas para reforzar</div>
  <div style="line-height:2;">${mergedWeakChips}</div>` : ''}

  <!-- Per-component detail -->
  <div class="section-title page-break">Detalle por componente</div>
  ${componentDetails}

  <!-- Learning program -->
  ${data.learningProgram ? generateLearningProgramHTML(data.learningProgram) : ''}

  <div class="footer">
    Generated by FriendlyTeaching.cl · ${new Date().toLocaleDateString('es-CL')} · Complete Placement Test Report
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  let body: ExportRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let html: string;
  let filename: string;

  if (body.type === 'progress') {
    html = generateProgressHTML(body as ProgressReportData);
    filename = `Reporte_${(body as ProgressReportData).studentName.replace(/\s+/g, '_')}_${(body as ProgressReportData).period.replace(/\s+/g, '_')}.html`;
  } else if (body.type === 'invoice') {
    html = generateInvoiceHTML(body as InvoiceData);
    filename = `Factura_${(body as InvoiceData).studentName.replace(/\s+/g, '_')}_${(body as InvoiceData).period.replace(/\s+/g, '_')}.html`;
  } else if (body.type === 'placement') {
    const d = body as PlacementReportData;
    // Build absolute logo URL from request origin
    const origin = request.nextUrl.origin;
    const logoUrl = `${origin}/logo-friendlyteaching.jpg`;
    html = generatePlacementHTML(d, logoUrl);
    filename = `PlacementReport_${d.studentName.replace(/\s+/g, '_')}.html`;
  } else if (body.type === 'writing-feedback') {
    const d = body as WritingFeedbackReportData;
    const origin = request.nextUrl.origin;
    const logoUrl = `${origin}/logo-friendlyteaching.jpg`;
    html = generateWritingFeedbackHTML(d, logoUrl);
    const slug = (d.studentName ?? d.taskTitle).replace(/\s+/g, '_');
    filename = `IELTS_Writing_${slug}.html`;
  } else if (body.type === 'placement-suite') {
    const d = body as PlacementSuiteReportData;
    const origin = request.nextUrl.origin;
    const logoUrl = `${origin}/logo-friendlyteaching.jpg`;
    html = generatePlacementSuiteHTML(d, logoUrl);
    filename = `PlacementSuite_${d.studentName.replace(/\s+/g, '_')}.html`;
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Return HTML that can be printed to PDF via browser's print dialog
  // This is the most reliable cross-platform approach
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
