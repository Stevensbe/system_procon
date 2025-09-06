import React from 'react';

const ProconSelect = ({ 
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção',
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props 
}) => {
  const selectId = `select-${name}`;
  
  const baseSelectClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none";
  
  const selectClasses = `
    ${baseSelectClasses}
    ${Icon ? 'pl-10' : ''}
    ${error 
      ? 'border-red-500 focus:ring-red-500 dark:border-red-400' 
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}
    ${disabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}
    ${className}
  `;
  
  const iconClasses = "h-5 w-5 text-gray-400 absolute top-1/2 transform -translate-y-1/2 left-3";
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className={iconClasses} />
        )}
        
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={selectClasses}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Seta customizada */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default ProconSelect;
