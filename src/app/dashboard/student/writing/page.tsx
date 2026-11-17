// FriendlyWriting® — student index.
//
// The open catalog was retired: students only access FriendlyWriting
// content after their teacher assigns it. Assigned lessons surface in
// /dashboard/student/lessons alongside every other material type.
// Deep links at /dashboard/student/writing/[lessonId] still work
// for assigned lessons.

import { redirect } from 'next/navigation';

export default function FriendlywritingStudentCatalog() {
  redirect('/dashboard/student/lessons');
}
