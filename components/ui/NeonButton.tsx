'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'cyan' | 'pink' | 'yellow' | 'orange' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ variant = 'green', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-mono font-semibold rounded-lg border transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const variants = {
      green: 'bg-neon-green/10 border-neon-green text-neon-green hover:bg-neon-green/20 hover:shadow-neon-green active:scale-95',
      cyan: 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan active:scale-95',
      pink: 'bg-neon-pink/10 border-neon-pink text-neon-pink hover:bg-neon-pink/20 hover:shadow-neon-pink active:scale-95',
      yellow: 'bg-neon-yellow/10 border-neon-yellow text-neon-yellow hover:bg-neon-yellow/20 hover:shadow-neon-yellow active:scale-95',
      orange: 'bg-neon-orange/10 border-neon-orange text-neon-orange hover:bg-neon-orange/20 hover:shadow-neon-orange active:scale-95',
      ghost: 'bg-transparent border-dark-border text-slate-400 hover:border-slate-500 hover:text-slate-200 active:scale-95',
      danger: 'bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20 active:scale-95',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
        )}
        {children}
      </button>
    );
  }
);

NeonButton.displayName = 'NeonButton';
