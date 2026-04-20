import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface NeonSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const NeonSelect = forwardRef<HTMLSelectElement, NeonSelectProps>(
  ({ label, className, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs text-slate-400 uppercase tracking-wider">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            'bg-dark-muted border border-dark-border rounded-lg px-3 py-2 text-sm text-slate-200',
            'focus:outline-none focus:border-neon-cyan/60',
            'transition-all duration-200',
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);

NeonSelect.displayName = 'NeonSelect';
