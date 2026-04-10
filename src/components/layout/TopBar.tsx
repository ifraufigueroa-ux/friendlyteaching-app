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
    <header className="glass-strong border-b border-white/30 px-6 py-4 flex items-center justify-between shadow-glass">
      <div>
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
        <h1 className="text-xl font-bold text-[#4A4A4A]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
          <div className="w-8 h-8 rounded-full bg-[#F0E5FF] flex items-center justify-center text-sm font-bold text-[#5A3D7A]">
            {profile?.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {profile?.fullName?.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
