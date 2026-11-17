// Friendlistenings® — student index.
//
// The open catalog was retired: students only access Friendlistenings
// content after their teacher assigns it. Assigned lessons surface in
// /dashboard/student/lessons alongside every other material type.
// Deep links at /dashboard/student/listenings/[lessonId] still work
// for assigned lessons.

import { redirect } from 'next/navigation';

export default function FriendlisteningsStudentIndex() {
  redirect('/dashboard/student/lessons');
}
