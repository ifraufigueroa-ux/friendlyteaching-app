'use client';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:   'bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white shadow-purple-sm hover:shadow-purple-md',
  secondary: 'bg-[#FFB8D9] hover:bg-[#E89BBF] text-[#4A4A4A] shadow-purple-sm hover:shadow-purple-md',
  ghost:     'bg-white/40 backdrop-blur-sm hover:bg-[#F0E5FF] text-[#5A3D7A] border border-[#C8A8DC]/40 hover:border-[#C8A8DC]',
  danger:    'bg-red-400 hover:bg-red-500 text-white shadow-sm hover:shadow-md',
};

const SIZE_STYLES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
