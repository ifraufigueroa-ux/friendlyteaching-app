// FriendlyTeaching.cl — Daily Practice lesson route
//
// Loads a single practice unit by id and hands it to <ExerciseRunner>.
// On completion the runner calls recordSession() which writes the
// session + updates streak/XP/mastery via the hook.

'use client';

import { use } from 'react';
import Link from 'next/link';
import { ExerciseRunner } from '@/components/practice/ExerciseRunner';
import { useDailyPractice } from '@/hooks/useDailyPractice';
import { findUnit } from '@/lib/data/practice/general-english';

interface Props {
  params: Promise<{ unitId: string }>;
}

export default function PracticeLessonPage({ params }: Props) {
  const { unitId } = use(params);
  const { uid, loading, recordSession, setNextUnit } = useDailyPractice();
  const unit = findUnit(unitId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF7]">
        <p className="text-sm text-[#5A3D7A]/60">Loading…</p>
      </div>
    );
  }

  if (!uid) {
    return (
      <EmptyState
        title="Sign in to practice"
        body="You need to be signed in as a student to open this lesson."
        cta={{ label: 'Back', href: '/dashboard/student' }}
      />
    );
  }

  if (!unit) {
    return (
      <EmptyState
        title="Lesson not found"
        body="That unit isn't available. Head back to pick another one."
        cta={{ label: 'Back to Practice', href: '/dashboard/student/practice' }}
      />
    );
  }

  return (
    <ExerciseRunner
      unit={unit}
      onComplete={async (summary) => {
        await recordSession({
          unitId: unit.id,
          totalCount:   summary.totalCount,
          correctCount: summary.correctCount,
        });
        // Clear the "next unit" pointer so the landing picks a new one.
        await setNextUnit(null);
      }}
    />
  );
}

function EmptyState({
  title, body, cta,
}: {
  title: string;
  body:  string;
  cta:   { label: string; href: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFFCF7]">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-md border border-[#E8D5F0] p-8 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#2D1B4E] mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-6">{body}</p>
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
