'use client';

import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  zClass?: string;
}

export function Modal({ open, onClose, title, children, className, zClass = 'z-50' }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={cn('fixed inset-0 flex items-center justify-center p-4', zClass)}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-10 bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg',
          'shadow-[0_0_40px_rgba(0,245,255,0.1)]',
          'flex flex-col max-h-[90vh]',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border shrink-0">
            <h2 className="text-sm font-semibold text-neon-cyan uppercase tracking-wider">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
