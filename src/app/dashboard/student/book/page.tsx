// FriendlyTeaching.cl — Student Booking Page (under construction)
'use client';
import Link from 'next/link';
import { Hammer, ArrowLeft } from 'lucide-react';

export default function BookPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F5EEFF] via-[#EDE5FF] to-[#E6DAFF] border border-[#DDD0F5] flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(90,61,122,0.35)] mb-6">
          <Hammer className="w-9 h-9 text-[#5A3D7A]" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#3D1F6B] tracking-tight mb-2">
          Under Construction
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          The class request feature is being updated. In the meantime, please contact your teacher directly to schedule a new class.
        </p>
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5A3D7A] text-white text-sm font-semibold hover:bg-[#3D1F6B] transition-colors shadow-[0_6px_18px_-6px_rgba(90,61,122,0.45)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
