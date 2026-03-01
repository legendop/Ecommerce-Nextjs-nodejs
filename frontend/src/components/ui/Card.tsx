import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const variants = {
  default: 'bg-white rounded-2xl shadow-sm border border-gray-100',
  flat: 'bg-white rounded-2xl',
  bordered: 'bg-white rounded-2xl border-2 border-brand-pink-light',
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

function Card({ className, variant = 'default', padding = 'none', hover = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-md transition-shadow cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

function CardHeader({ className, title, subtitle, action, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between px-5 pt-5 pb-3', className)} {...props}>
      <div>
        {title && <h3 className="font-semibold text-brand-purple text-base">{title}</h3>}
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="ml-4 shrink-0">{action}</div>}
    </div>
  );
}

function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-3', className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4 border-t border-gray-100', className)} {...props}>
      {children}
    </div>
  );
}

CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';
Card.displayName = 'Card';

export { Card, CardHeader, CardBody, CardFooter };
export type { CardProps };
