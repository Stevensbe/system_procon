import React from 'react';
import { cn } from '../../utils/cn';

const Checkbox = React.forwardRef(({ className, checked, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    checked={checked}
    className={cn(
      'h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
));

Checkbox.displayName = 'Checkbox';

export { Checkbox };
