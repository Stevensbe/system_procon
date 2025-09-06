import React from 'react';

const KPICard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  prefix = '', 
  suffix = '',
  isLoading = false 
}) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50',
    purple: 'border-purple-500 bg-purple-50'
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    purple: 'text-purple-500'
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (prefix === 'R$') {
        return val.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
      }
      return val.toLocaleString('pt-BR');
    }
    return val;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${colorClasses[color]} p-6 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
            {title}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
            ) : (
              <>
                {prefix && <span className="text-lg">{prefix} </span>}
                {formatValue(value)}
                {suffix && <span className="text-lg"> {suffix}</span>}
              </>
            )}
          </div>
        </div>
        {icon && (
          <div className={`text-4xl ${iconColorClasses[color]} opacity-75`}>
            <i className={icon}></i>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;