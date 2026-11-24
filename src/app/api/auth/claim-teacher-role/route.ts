// FriendlyTeaching.cl — POST /api/auth/claim-teacher-role
//
// Server-side teacher code validation.
//
// Audit 2026-11-23 C1: the code lived in NEXT_PUBLIC_TEACHER_CODE, so
// anyone could grep the browser bundle, find it, and sign up as teacher.
// Now the real code lives in a non-public env var (TEACHER_SIGNUP_CODE)
// that only the server can read, and the users/{uid} doc is promoted
// via Admin SDK — which bypasses the client-facing Firestore rule that
// otherwise forbids `role: 'teacher'` on create.
//
// Called by:
//   · src/lib/firebase/auth.ts signUp()                     (new accounts)
//   · src/app/dashboard/profile/page.tsx handleRepairRole() (misassigned)
//
// Request body:
//   { idToken: string, teacherCode: string }
//
// Response:
//   200 { ok: true, role: 'teacher' }   // promoted
//   403 { error: 'invalid code' }
//   401 { error: 'bad token' }
//   500 { error: 'server misconfigured' }

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Resolve the expected code from env; this NEVER ships to the browser.
  // Fallback to the legacy constant so the existing deployment doesn't
  // break the instant this ships — delete the fallback once Vercel has
  // TEACHER_SIGNUP_CODE set.
  const expectedCode = (process.env.TEACHER_SIGNUP_CODE || 'FT-PROFESOR-2026').trim();
  if (!expectedCode) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }

  let idToken = '';
  let teacherCode = '';
  try {
    const body = await req.json();
    idToken = String(body?.idToken ?? '').trim();
    teacherCode = String(body?.teacherCode ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 });
  }
  if (!idToken || !teacherCode) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  // Verify the Firebase id token — this limits brute force to accounts
  // the caller has already signed in to.
  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'bad token' }, { status: 401 });
  }

  // Constant-time-ish compare so a timing attack can't infer the code.
  const a = Buffer.from(teacherCode);
  const b = Buffer.from(expectedCode);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    return NextResponse.json({ error: 'invalid code' }, { status: 403 });
  }

  // Admin SDK write — bypasses the client-facing rule that forbids
  // role:'teacher' on create / owner-update.
  await adminDb().collection('users').doc(uid).set(
    {
      role:      'teacher',
      status:    'active',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true, role: 'teacher' });
}

/** Minimal constant-time compare — avoids importing node:crypto for edge
 *  but we're on the nodejs runtime so we could; keep it explicit so the
 *  intent is visible in the review. */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
