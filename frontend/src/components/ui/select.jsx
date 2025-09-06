import React from 'react';
import { cn } from '../../utils/cn';

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";

const SelectContent = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <option
    ref={ref}
    className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100", className)}
    {...props}
  >
    {children}
  </option>
));

SelectItem.displayName = "SelectItem";

const SelectTrigger = Select;
const SelectValue = ({ placeholder, children, ...props }) => (
  <span {...props}>{children || placeholder}</span>
);

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};