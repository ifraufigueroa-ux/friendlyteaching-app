// FriendlyTeaching.cl — POST /api/students/impersonate
//
// Mints a Firebase custom token that signs the caller in as one of
// their students, so the teacher can see the student's view without
// needing the student's password.
//
// Guardrails:
//   · Caller must be authenticated.
//   · Caller must have role === 'teacher'.
//   · Target studentId must exist, be role === 'student' and status
//     === 'approved'.
//   · Teacher can only impersonate students whose
//     studentData.approvedByTeacherId matches their uid (or are
//     unassigned). Prevents one teacher from signing in as another
//     teacher's students.
//   · The minted token carries developerClaims { impersonatedBy,
//     impersonatedByEmail, impersonatedByName } so the client can show
//     a banner and the student doc stays auditable.
//
// Request body:  { idToken: string, studentId: string }
// Response 200:  { customToken: string, studentName: string, studentEmail: string }
// Response 401/403/404/500 with { error }.

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let idToken = '';
  let studentId = '';
  try {
    const body = await req.json();
    idToken = String(body?.idToken ?? '').trim();
    studentId = String(body?.studentId ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'bad body' }, { status: 400 });
  }
  if (!idToken || !studentId) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  // Who is calling?
  let callerUid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'bad token' }, { status: 401 });
  }

  // Caller must be a teacher.
  const callerSnap = await adminDb().collection('users').doc(callerUid).get();
  if (!callerSnap.exists) {
    return NextResponse.json({ error: 'caller not found' }, { status: 403 });
  }
  const caller = callerSnap.data() ?? {};
  if (caller.role !== 'teacher') {
    return NextResponse.json({ error: 'only teachers can impersonate' }, { status: 403 });
  }

  // Target must be one of this teacher's approved students.
  const targetSnap = await adminDb().collection('users').doc(studentId).get();
  if (!targetSnap.exists) {
    return NextResponse.json({ error: 'student not found' }, { status: 404 });
  }
  const target = targetSnap.data() ?? {};
  if (target.role !== 'student') {
    return NextResponse.json({ error: 'target is not a student' }, { status: 403 });
  }
  if (target.status !== 'approved') {
    return NextResponse.json({ error: 'student is not approved' }, { status: 403 });
  }
  const assignedTeacher = target.studentData?.approvedByTeacherId;
  if (assignedTeacher && assignedTeacher !== callerUid) {
    return NextResponse.json(
      { error: 'student is assigned to a different teacher' },
      { status: 403 },
    );
  }

  // Mint a custom token. The claims travel in the id token the client
  // will get right after signInWithCustomToken; they also show up in
  // request.auth.token on Firestore rules if we ever want to gate on
  // impersonation.
  const customToken = await adminAuth().createCustomToken(studentId, {
    impersonatedBy:        callerUid,
    impersonatedByEmail:   caller.email ?? '',
    impersonatedByName:    caller.fullName ?? '',
    impersonationIssuedAt: Date.now(),
  });

  return NextResponse.json({
    customToken,
    studentName:  target.fullName ?? '',
    studentEmail: target.email ?? '',
  });
}
