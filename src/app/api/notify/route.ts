// FriendlyTeaching.cl — Email Notification API Route
// Uses Resend (https://resend.com) — free tier: 3000 emails/month
// Set RESEND_API_KEY in .env.local to enable. Falls back to console.log in dev.
import { NextRequest, NextResponse } from 'next/server';

interface NotifyBody {
  type: 'student_approved' | 'student_registered' | 'homework_reviewed' | 'class_reminder';
  to: string;
  studentName?: string;
  teacherName?: string;
  homeworkTitle?: string;
  feedback?: string;
  score?: number;
  appUrl?: string;
  // class_reminder fields
  classDay?: string;
  classHour?: number;
  hoursUntil?: number;
}

function buildEmail(body: NotifyBody): { subject: string; html: string } {
  const appUrl = body.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://friendlyteaching.cl';

  switch (body.type) {
    case 'student_approved':
      return {
        subject: '✅ Tu cuenta en FriendlyTeaching ha sido aprobada',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h1 style="color:#5A3D7A;font-size:22px;margin-bottom:8px;">¡Bienvenido/a a FriendlyTeaching! 🎉</h1>
            <p style="color:#555;font-size:15px;line-height:1.6;">
              Hola <strong>${body.studentName ?? 'estudiante'}</strong>,<br><br>
              Tu cuenta ha sido aprobada por <strong>${body.teacherName ?? 'tu profesor'}</strong>.
              Ya tienes acceso completo a todas las lecciones, horarios y materiales.
            </p>
            <div style="margin:24px 0;">
              <a href="${appUrl}/auth/login"
                style="display:inline-block;background:#C8A8DC;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none;">
                Iniciar sesión →
              </a>
            </div>
            <p style="color:#999;font-size:12px;">FriendlyTeaching.cl · Si no esperabas este correo, ignóralo.</p>
          </div>
        `,
      };

    case 'student_registered':
      return {
        subject: '👋 Nuevo estudiante registrado en FriendlyTeaching',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h1 style="color:#5A3D7A;font-size:22px;margin-bottom:8px;">Nuevo estudiante pendiente</h1>
            <p style="color:#555;font-size:15px;line-height:1.6;">
              <strong>${body.studentName ?? 'Un estudiante'}</strong> acaba de registrarse
              y está esperando tu aprobación.
            </p>
            <div style="margin:24px 0;">
              <a href="${appUrl}/dashboard/teacher/students"
                style="display:inline-block;background:#C8A8DC;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none;">
                Revisar solicitud →
              </a>
            </div>
            <p style="color:#999;font-size:12px;">FriendlyTeaching.cl</p>
          </div>
        `,
      };

    case 'class_reminder': {
      const hours = body.hoursUntil ?? 24;
      const when = hours === 1 ? 'en 1 hora' : `mañana ${body.classDay ?? ''}`;
      return {
        subject: `🔔 Recordatorio: tu clase de inglés ${hours === 1 ? 'en 1 hora' : 'mañana'}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h1 style="color:#5A3D7A;font-size:22px;margin-bottom:8px;">Recordatorio de clase 🎓</h1>
            <p style="color:#555;font-size:15px;line-height:1.6;">
              Hola <strong>${body.studentName ?? 'estudiante'}</strong>,<br><br>
              Te recordamos que tienes clase de inglés con
              <strong>${body.teacherName ?? 'tu profesor'}</strong>
              <strong>${when}</strong>
              ${body.classHour !== undefined ? `a las <strong>${body.classHour}:00</strong>` : ''}.
            </p>
            <div style="background:#F9F5FF;border-radius:12px;padding:16px;margin:20px 0;">
              <p style="color:#5A3D7A;font-size:14px;font-weight:700;margin:0 0 4px;">📅 Detalles de la clase:</p>
              <p style="color:#555;font-size:14px;margin:0;">
                ${body.classDay ? `${body.classDay}` : ''} ${body.classHour !== undefined ? `· ${body.classHour}:00 – ${body.classHour! + 1}:00` : ''}
              </p>
            </div>
            <p style="color:#999;font-size:12px;">FriendlyTeaching.cl · Recuerda conectarte a tiempo.</p>
          </div>
        `,
      };
    }

    case 'homework_reviewed':
      return {
        subject: `📝 Tu tarea "${body.homeworkTitle}" ha sido revisada`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h1 style="color:#5A3D7A;font-size:22px;margin-bottom:8px;">Tu tarea fue revisada ✅</h1>
            <p style="color:#555;font-size:15px;line-height:1.6;">
              Hola <strong>${body.studentName ?? 'estudiante'}</strong>,<br><br>
              <strong>${body.teacherName ?? 'Tu profesor'}</strong> revisó tu tarea
              <em>"${body.homeworkTitle}"</em>.
            </p>
            ${body.score !== undefined ? `<p style="color:#5A3D7A;font-size:18px;font-weight:700;margin:16px 0;">Nota: ${body.score}/7</p>` : ''}
            ${body.feedback ? `
              <div style="background:#F9F5FF;border-radius:12px;padding:16px;margin:16px 0;">
                <p style="color:#5A3D7A;font-size:13px;font-weight:700;margin:0 0 8px;">Feedback:</p>
                <p style="color:#555;font-size:14px;margin:0;line-height:1.6;">${body.feedback}</p>
              </div>
            ` : ''}
            <div style="margin:24px 0;">
              <a href="${appUrl}/dashboard/student/homework"
                style="display:inline-block;background:#C8A8DC;color:#fff;font-weight:700;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none;">
                Ver mis tareas →
              </a>
            </div>
            <p style="color:#999;font-size:12px;">FriendlyTeaching.cl</p>
          </div>
        `,
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: NotifyBody = await req.json();

    if (!body.type || !body.to) {
      return NextResponse.json({ error: 'Missing type or to' }, { status: 400 });
    }

    const { subject, html } = buildEmail(body);

    const apiKey = process.env.RESEND_API_KEY;

    // ── Dev mode: log to console if no API key ─────────────────────────────────
    if (!apiKey) {
      console.log('[notify] No RESEND_API_KEY set. Email would have been sent:');
      console.log('  to:', body.to);
      console.log('  subject:', subject);
      return NextResponse.json({ ok: true, dev: true });
    }

    // ── Production: send via Resend ────────────────────────────────────────────
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FriendlyTeaching <noreply@friendlyteaching.cl>',
        to: [body.to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[notify] Resend error:', err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data: unknown = await res.json();
    return NextResponse.json({ ok: true, data });

  } catch (err) {
    console.error('[notify] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
