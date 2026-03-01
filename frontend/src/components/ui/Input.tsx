import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leadingIcon, trailingIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-brand-purple mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              {leadingIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full rounded-full border bg-white text-brand-purple text-sm',
              'px-4 py-2.5 shadow-sm transition-colors',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leadingIcon && 'pl-10',
              trailingIcon && 'pr-10',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-400'
                : 'border-gray-200 hover:border-gray-300',
              className
            )}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute inset-y-0 right-3 flex items-center text-gray-400">
              {trailingIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-gray-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
