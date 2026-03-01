import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'pink' | 'purple' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: ReactNode;
}

const variants = {
  pink: 'bg-brand-pink-light text-brand-pink-dark',
  purple: 'bg-brand-purple text-white',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
};

const dotColors = {
  pink: 'bg-brand-pink',
  purple: 'bg-white',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-gray-400',
};

const sizes = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
};

function Badge({ className, variant = 'pink', size = 'sm', dot = false, icon, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', dotColors[variant])} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
