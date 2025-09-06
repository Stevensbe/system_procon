import React from 'react';

const ProconTextarea = ({ 
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  helperText,
  required = false,
  disabled = false,
  maxLength,
  showCharacterCount = false,
  className = '',
  ...props 
}) => {
  const textareaId = `textarea-${name}`;
  
  const baseTextareaClasses = "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical";
  
  const textareaClasses = `
    ${baseTextareaClasses}
    ${error 
      ? 'border-red-500 focus:ring-red-500 dark:border-red-400' 
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}
    ${disabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}
    ${className}
  `;
  
  const characterCount = value ? value.length : 0;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isOverLimit = maxLength && characterCount > maxLength;
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />
      
      {/* Contador de caracteres */}
      {showCharacterCount && maxLength && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            {characterCount} / {maxLength} caracteres
          </span>
          
          {isOverLimit && (
            <span className="text-red-500 font-medium">
              Limite excedido!
            </span>
          )}
          
          {isNearLimit && !isOverLimit && (
            <span className="text-yellow-500 font-medium">
              Aproximando do limite
            </span>
          )}
        </div>
      )}
      
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

export default ProconTextarea;
