// FriendlyTeaching.cl — Export Report API Route
// Generates PDF progress reports or invoice exports.
// POST /api/export-report
// Body: { type: 'progress' | 'invoice', data: ... }
// Returns: PDF binary (application/pdf)

import { NextRequest, NextResponse } from 'next/server';

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

type ExportRequest = ProgressReportData | InvoiceData;

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
  } else {
    return NextResponse.json({ error: 'Invalid type. Must be "progress" or "invoice"' }, { status: 400 });
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
