import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'bg-dark-muted border border-dark-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500',
            'focus:outline-none focus:border-neon-cyan/60 focus:shadow-[0_0_0_2px_rgba(0,245,255,0.15)]',
            'transition-all duration-200',
            error && 'border-red-500/60',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }
);

NeonInput.displayName = 'NeonInput';
