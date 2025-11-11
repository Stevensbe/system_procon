import React from 'react';
import { cn } from '../../utils/cn';

const Textarea = React.forwardRef(({ className, rows = 4, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        className
      )}
      rows={rows}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
