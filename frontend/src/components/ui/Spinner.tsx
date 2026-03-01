import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'pink' | 'purple' | 'white' | 'gray';
  className?: string;
}

const sizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colors = {
  pink: 'text-brand-pink',
  purple: 'text-brand-purple',
  white: 'text-white',
  gray: 'text-gray-400',
};

function Spinner({ size = 'md', color = 'pink', className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', sizes[size], colors[color], className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="pink" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

Spinner.displayName = 'Spinner';
FullPageSpinner.displayName = 'FullPageSpinner';

export { Spinner, FullPageSpinner };
export type { SpinnerProps };
