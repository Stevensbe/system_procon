import React from 'react';

const ProconCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  icon: Icon,
  title,
  subtitle,
  actions,
  loading = false,
  error,
  success
}) => {
  const baseClasses = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg transition-all duration-300";
  
  const variantClasses = {
    default: "hover:shadow-xl",
    primary: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20",
    success: "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20",
    warning: "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20",
    danger: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20",
    info: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
  };

  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={cardClasses}>
      {/* Header */}
      {(title || Icon) && (
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {Icon && (
              <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            )}
            <div>
              {title && (
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-6 text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-blue-600 dark:text-blue-400 shadow rounded-md">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Carregando...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            <div className="flex">
              <svg className="h-5 w-5 mr-2 mt-0.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {success && (
        <div className="p-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
            <div className="flex">
              <svg className="h-5 w-5 mr-2 mt-0.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{success}</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && !success && (
        <div className="p-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProconCard;
