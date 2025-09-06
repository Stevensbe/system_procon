import React, { useState } from 'react';
import { 
  EyeIcon, 
  CheckIcon, 
  ArrowUpIcon, 
  ArchiveBoxIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { ProconButton, ProconCard } from '../ui';

const DocumentoCard = ({ documento, onAcao }) => {
  const [loading, setLoading] = useState(false);

  const handleAcao = async (acao, dados = {}) => {
    if (onAcao) {
      setLoading(true);
      try {
        await onAcao(documento.id, acao, dados);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NAO_LIDO':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'LIDO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'EM_ANALISE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ENCAMINHADO':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'ARQUIVADO':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'BAIXA':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'DENUNCIA':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'PETICAO':
        return <DocumentTextIcon className="h-5 w-5 text-blue-600" />;
      case 'AUTO_INFRACAO':
        return <FlagIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAtrasado = () => {
    if (!documento.prazo_resposta) return false;
    return new Date(documento.prazo_resposta) < new Date();
  };

  const isUrgente = () => {
    return documento.prioridade === 'URGENTE' || isAtrasado();
  };

  return (
    <ProconCard
      className={`transition-all duration-200 hover:shadow-lg ${
        isUrgente() ? 'border-l-4 border-l-red-500' : ''
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        
        {/* Informações principais */}
        <div className="flex-1 space-y-3">
          
          {/* Header com protocolo e tipo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getTipoIcon(documento.tipo_documento)}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {documento.numero_protocolo}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {documento.tipo_documento?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            
            {/* Status e prioridade */}
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(documento.status)}`}>
                {documento.status?.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadeColor(documento.prioridade)}`}>
                {documento.prioridade}
              </span>
            </div>
          </div>

          {/* Assunto */}
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white">
              {documento.assunto}
            </h4>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            
            {/* Remetente */}
            <div className="flex items-center space-x-2">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {documento.remetente_nome || 'N/A'}
              </span>
            </div>

            {/* Empresa */}
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {documento.empresa_nome || 'N/A'}
              </span>
            </div>

            {/* Data de entrada */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatarData(documento.data_entrada)}
              </span>
            </div>

            {/* Prazo de resposta */}
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className={`${
                isAtrasado() 
                  ? 'text-red-600 dark:text-red-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {formatarData(documento.prazo_resposta)}
              </span>
            </div>
          </div>

          {/* Indicadores especiais */}
          <div className="flex items-center space-x-3">
            {documento.notificado_dte && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                <CheckIcon className="h-3 w-3 mr-1" />
                Notificado DTE
              </span>
            )}
            
            {isAtrasado() && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Atrasado
              </span>
            )}
            
            {isUrgente() && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full">
                <FlagIcon className="h-3 w-3 mr-1" />
                Urgente
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row lg:flex-col space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-0 lg:space-y-2">
          
          <ProconButton
            variant="info"
            size="sm"
            icon={EyeIcon}
            onClick={() => handleAcao('visualizar')}
            disabled={loading}
            fullWidth
          >
            Visualizar
          </ProconButton>

          {documento.status === 'NAO_LIDO' && (
            <ProconButton
              variant="success"
              size="sm"
              icon={CheckIcon}
              onClick={() => handleAcao('marcar_lido')}
              disabled={loading}
              fullWidth
            >
              Marcar Lido
            </ProconButton>
          )}

          <ProconButton
            variant="warning"
            size="sm"
            icon={ArrowUpIcon}
            onClick={() => handleAcao('encaminhar')}
            disabled={loading}
            fullWidth
          >
            Encaminhar
          </ProconButton>

          <ProconButton
            variant="secondary"
            size="sm"
            icon={ArchiveBoxIcon}
            onClick={() => handleAcao('arquivar')}
            disabled={loading}
            fullWidth
          >
            Arquivar
          </ProconButton>
        </div>
      </div>
    </ProconCard>
  );
};

export default DocumentoCard;
