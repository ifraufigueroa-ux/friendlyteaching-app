// FriendlyTeaching.cl — Skeleton loading primitives
'use client';

/** Base shimmer block. Pass className for sizing (w-*, h-*, rounded-*). */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

/** Card-shaped skeleton matching LessonCard layout. */
export function LessonCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-10" />
          <Skeleton className="h-9 w-10" />
        </div>
      </div>
    </div>
  );
}

/** Row skeleton for student/table lists. */
export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 glass-card rounded-2xl">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

/** Stat card skeleton for dashboard overview. */
export function StatCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** Dashboard page skeleton: stats row + content grid. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <ListRowSkeleton key={i} />
          ))}
        </div>
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Lessons grid skeleton. */
export function LessonsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LessonCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Students list skeleton. */
export function StudentsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}
