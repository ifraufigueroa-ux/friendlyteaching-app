'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, isInitialized, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && !isLoading && !firebaseUser) {
      router.replace('/auth/login');
    }
  }, [isInitialized, isLoading, firebaseUser, router]);

  // Show loading while auth initializes
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--gradient-hero)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9B7CB8] font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect handled by useEffect, show nothing meanwhile
  if (!firebaseUser) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFCF7]">
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Sidebar panel */}
          <div
            className="absolute left-0 top-0 bottom-0 w-64 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#5A3D7A] hover:bg-[#F0E5FF] transition-colors"
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect y="3" width="20" height="2" rx="1" />
              <rect y="9" width="20" height="2" rx="1" />
              <rect y="15" width="20" height="2" rx="1" />
            </svg>
          </button>
          <span className="text-sm font-bold text-[#5A3D7A]">FriendlyTeaching.cl</span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
