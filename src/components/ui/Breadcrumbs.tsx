// FriendlyTeaching.cl — Breadcrumbs navigation
'use client';
import Link from 'next/link';

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
}

export default function Breadcrumbs({ crumbs }: Props) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300">›</span>}
            {isLast || !crumb.href ? (
              <span className={isLast ? 'text-[#5A3D7A] font-semibold' : ''}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-[#9B7CB8] transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
