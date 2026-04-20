import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  neon?: 'green' | 'cyan' | 'pink' | 'yellow' | 'purple' | null;
}

export function Card({ className, neon, children, ...props }: CardProps) {
  const neonBorder = {
    green:  'border-neon-green/40  card-glow-green',
    cyan:   'border-neon-cyan/40   card-glow-cyan',
    pink:   'border-neon-pink/40   card-glow-pink',
    yellow: 'border-neon-yellow/40 card-glow-yellow',
    purple: 'border-neon-purple/40 card-glow-purple',
  };

  return (
    <div
      className={cn(
        'bg-dark-card border border-dark-border rounded-xl p-4',
        neon && neonBorder[neon],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
