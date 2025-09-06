import React from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MinusIcon 
} from '@heroicons/react/24/solid';

const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  change, 
  changeType = 'neutral',
  description 
}) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800'
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        icon: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-800'
      }
    };
    return colors[color] || colors.blue;
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'positive':
        return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${colorClasses.border} p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${colorClasses.bg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                {title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {value}
              </p>
            </div>
          </div>
          
          {change && (
            <div className="mt-4 flex items-center">
              {getChangeIcon(changeType)}
              <span className={`ml-1 text-sm font-medium ${getChangeColor(changeType)}`}>
                {change}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                vs período anterior
              </span>
            </div>
          )}
          
          {description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
