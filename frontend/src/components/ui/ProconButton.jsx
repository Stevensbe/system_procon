import React from 'react';

const ProconButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-sm hover:shadow-md",
    secondary: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white shadow-sm hover:shadow-md",
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white shadow-sm hover:shadow-md",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white shadow-sm hover:shadow-md",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm hover:shadow-md",
    info: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-400 text-white shadow-sm hover:shadow-md",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500",
    ghost: "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500",
    link: "text-blue-600 hover:text-blue-700 underline focus:ring-blue-500"
  };
  
  const sizeClasses = {
    xs: "px-2.5 py-1.5 text-xs",
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg"
  };
  
  const widthClasses = fullWidth ? "w-full" : "";
  
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`;
  
  const iconSize = {
    xs: "h-3 w-3",
    sm: "h-4 w-4", 
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6"
  };
  
  const iconClasses = iconSize[size];
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={`${iconClasses} mr-2`} />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={`${iconClasses} ml-2`} />
      )}
    </button>
  );
};

export default ProconButton;
