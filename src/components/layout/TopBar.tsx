// FriendlyTeaching.cl — TopBar
'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function TopBar({ title, subtitle, actions, breadcrumbs }: Props) {
  const { profile } = useAuthStore();

  return (
    <header className="glass-strong border-b border-white/30 px-4 sm:px-6 py-3 sm:py-4 shadow-glass">
      {/* Row 1: title block + avatar. On mobile the avatar sits inline
          top-right; actions drop to their own row below. On md+ everything
          fits on a single row with actions between title and avatar. */}
      <div className="flex items-start md:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 mb-1 flex-wrap">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-gray-300">›</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-[#9B7CB8] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[#9B7CB8] font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-gradient-purple truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>

        {/* Right cluster — desktop keeps actions + avatar together */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {actions}
          <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] flex items-center justify-center text-sm font-bold text-white shadow-purple-sm">
              {profile?.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {profile?.fullName?.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Mobile: only the avatar stays on row 1 so the title has room */}
        <div className="md:hidden flex items-center flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] flex items-center justify-center text-sm font-bold text-white shadow-purple-sm">
            {profile?.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </div>

      {/* Row 2 (mobile only): actions — horizontally scrollable when they overflow */}
      {actions && (
        <div className="md:hidden mt-3 -mx-1 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {actions}
        </div>
      )}
    </header>
  );
}
