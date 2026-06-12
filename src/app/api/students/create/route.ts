// FriendlyTeaching.cl — Manually create a student account (teacher only)
//
// POST /api/students/create
//   headers: Authorization: Bearer <teacher ID token>
//   body:    { email, fullName, password, phone?, level? }
//
// Verifies the caller is a teacher, creates a Firebase Auth user with the
// chosen temporary password, writes the Firestore users/{uid} doc as
// approved + assigned to this teacher, and fires a welcome email with the
// credentials so the student can log in.
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { LessonLevel } from '@/types/firebase';

const VALID_LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface CreateBody {
  email:    string;
  fullName: string;
  password: string;
  phone?:   string;
  level?:   LessonLevel;
}

function isValidEmail(s: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

export async function POST(req: NextRequest) {
  // ── 1. Authenticate caller ───────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  let callerUid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // ── 2. Authorise: caller must be a teacher ───────────────────────────────
  const callerSnap = await adminDb().collection('users').doc(callerUid).get();
  const caller = callerSnap.data();
  if (!caller || caller.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden — teachers only' }, { status: 403 });
  }

  // ── 3. Validate payload ──────────────────────────────────────────────────
  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email    = body.email?.trim().toLowerCase();
  const fullName = body.fullName?.trim();
  const password = body.password;
  const phone    = body.phone?.trim() ?? '';
  const level    = body.level && VALID_LEVELS.includes(body.level) ? body.level : 'A1';

  if (!email || !isValidEmail(email))    return NextResponse.json({ error: 'Email inválido' },                 { status: 400 });
  if (!fullName || fullName.length < 2)  return NextResponse.json({ error: 'Nombre completo requerido' },      { status: 400 });
  if (!password || password.length < 6)  return NextResponse.json({ error: 'Password mínimo 6 caracteres' },   { status: 400 });

  // ── 4. Create Firebase Auth user ────────────────────────────────────────
  let uid: string;
  try {
    const userRecord = await adminAuth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: true, // teacher vouched for the email
    });
    uid = userRecord.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 });
    }
    if (code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    console.error('[students/create] createUser error:', err);
    return NextResponse.json({ error: 'No se pudo crear la cuenta' }, { status: 500 });
  }

  // ── 5. Write Firestore users/{uid} as approved + assigned ───────────────
  try {
    await adminDb().collection('users').doc(uid).set({
      uid,
      email,
      fullName,
      phone,
      role: 'student',
      status: 'approved',
      timezone: 'America/Santiago',
      language: 'es',
      preferences: { emailNotifications: true },
      studentData: {
        approvedByTeacherId: callerUid,
        level,
        joinedAt: FieldValue.serverTimestamp(),
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    // Level history entry mirrors approveStudent() so the analytics flow is consistent.
    await adminDb().collection('levelHistory').add({
      studentId: uid,
      teacherId: callerUid,
      fromLevel: null,
      toLevel: level,
      notes: 'Nivel inicial al crear cuenta',
      changedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Rollback the auth user if Firestore write fails — otherwise we have
    // an orphan auth account that can't be re-created with the same email.
    await adminAuth().deleteUser(uid).catch(() => { /* best effort */ });
    console.error('[students/create] Firestore write failed, rolled back auth user:', err);
    return NextResponse.json({ error: 'No se pudo guardar el estudiante' }, { status: 500 });
  }

  // ── 6. Fire welcome email with credentials (best effort) ────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://friendlyteaching.cl';
  fetch(`${appUrl}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'student_invited',
      to: email,
      studentName: fullName,
      teacherName: caller.fullName ?? 'tu profesor',
      tempPassword: password,
      appUrl,
    }),
  }).catch((err) => console.warn('[students/create] welcome email failed:', err));

  return NextResponse.json({ ok: true, uid });
}
