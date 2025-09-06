import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DemoModeAlert = ({ show, onDismiss }) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-orange-50 border border-orange-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-orange-800">
            Modo Demonstração
          </h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>
              O sistema está exibindo dados simulados porque o backend não está disponível. 
              Os gráficos e números são apenas para demonstração.
            </p>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md bg-orange-50 p-1.5 text-orange-500 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 focus:ring-offset-orange-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModeAlert;