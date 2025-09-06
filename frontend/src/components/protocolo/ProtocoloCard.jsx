import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const ProtocoloCard = ({ protocolo, onSelect, selected, showActions = true }) => {
  const getStatusColor = (status) => {
    const statusColors = {
      'PROTOCOLADO': 'bg-blue-100 text-blue-800 border-blue-200',
      'EM_TRAMITACAO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PENDENTE': 'bg-orange-100 text-orange-800 border-orange-200',
      'CONCLUIDO': 'bg-green-100 text-green-800 border-green-200',
      'CANCELADO': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPrioridadeColor = (prioridade) => {
    const prioridadeColors = {
      'BAIXA': 'bg-gray-100 text-gray-800',
      'NORMAL': 'bg-blue-100 text-blue-800',
      'ALTA': 'bg-orange-100 text-orange-800',
      'URGENTE': 'bg-red-100 text-red-800'
    };
    return prioridadeColors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'PROTOCOLADO': DocumentTextIcon,
      'EM_TRAMITACAO': ClockIcon,
      'PENDENTE': ExclamationTriangleIcon,
      'CONCLUIDO': CheckCircleIcon,
      'CANCELADO': ExclamationTriangleIcon
    };
    return statusIcons[status] || DocumentTextIcon;
  };

  const StatusIcon = getStatusIcon(protocolo.status);

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <StatusIcon className="w-5 h-5 text-gray-600" />
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(protocolo.status)}`}>
              {protocolo.status}
            </span>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadeColor(protocolo.prioridade)}`}>
            {protocolo.prioridade}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {protocolo.numero}
        </h3>
        
        <p className="text-sm text-gray-600 line-clamp-2">
          {protocolo.assunto}
        </p>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Tipo */}
          <div className="flex items-center text-sm text-gray-600">
            <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{protocolo.tipo_protocolo?.nome || 'Tipo não informado'}</span>
          </div>

          {/* Data */}
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {new Date(protocolo.data_abertura).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* Responsável */}
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{protocolo.responsavel_atual?.username || 'Não atribuído'}</span>
          </div>

          {/* Prazo */}
          {protocolo.data_limite && (
            <div className="flex items-center text-sm">
              <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
              <span className={protocolo.esta_atrasado ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {protocolo.esta_atrasado ? 'Atrasado' : `${protocolo.dias_restantes} dias restantes`}
              </span>
            </div>
          )}

          {/* Descrição */}
          {protocolo.descricao && (
            <div className="text-sm text-gray-600">
              <p className="line-clamp-3">{protocolo.descricao}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onSelect(protocolo.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                to={`/protocolo/${protocolo.id}`}
                className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                title="Visualizar"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                Ver
              </Link>
              <Link
                to={`/protocolo/${protocolo.id}/editar`}
                className="inline-flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                title="Editar"
              >
                <PencilIcon className="w-4 h-4 mr-1" />
                Editar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtocoloCard;
