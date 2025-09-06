import React from 'react';

const ProconCheckbox = ({ 
  label,
  name,
  checked,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const checkboxId = `checkbox-${name}`;
  
  const baseCheckboxClasses = "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const checkboxClasses = `
    ${baseCheckboxClasses}
    ${error 
      ? 'border-red-500 focus:ring-red-500' 
      : 'focus:border-blue-500'
    }
    ${className}
  `;
  
  return (
    <div className="space-y-2">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={checkboxId}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={checkboxClasses}
            {...props}
          />
        </div>
        
        <div className="ml-3 text-sm">
          {label && (
            <label 
              htmlFor={checkboxId}
              className={`font-medium ${
                disabled 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          
          {helperText && (
            <p className={`text-sm mt-1 ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {helperText}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center ml-7">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default ProconCheckbox;
