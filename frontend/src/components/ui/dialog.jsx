import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';

const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (event) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10 w-full max-w-2xl px-4">{children}</div>
    </div>
  );
};

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-2xl bg-white p-6 shadow-xl',
      className
    )}
    {...props}
  >
    {children}
  </div>
));

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn('mb-4 flex flex-col space-y-1 text-center sm:text-left', className)}
    {...props}
  />
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));

DialogContent.displayName = 'DialogContent';
DialogTitle.displayName = 'DialogTitle';

export { Dialog, DialogContent, DialogHeader, DialogTitle };
