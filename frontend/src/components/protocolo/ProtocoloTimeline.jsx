import React, { useState } from 'react';
import { 
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const ProtocoloTimeline = ({ tramitacoes = [], protocolo }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = (tipo) => {
    const iconMap = {
      'CRIACAO': DocumentTextIcon,
      'TRAMITACAO': ArrowRightIcon,
      'CONCLUSAO': CheckCircleIcon,
      'CANCELAMENTO': ExclamationTriangleIcon,
      'ALTERACAO': DocumentTextIcon,
      'ANEXO': DocumentTextIcon,
      'OBSERVACAO': DocumentTextIcon
    };
    return iconMap[tipo] || ClockIcon;
  };

  const getStatusColor = (tipo) => {
    const colorMap = {
      'CRIACAO': 'bg-blue-500',
      'TRAMITACAO': 'bg-yellow-500',
      'CONCLUSAO': 'bg-green-500',
      'CANCELAMENTO': 'bg-red-500',
      'ALTERACAO': 'bg-purple-500',
      'ANEXO': 'bg-indigo-500',
      'OBSERVACAO': 'bg-gray-500'
    };
    return colorMap[tipo] || 'bg-gray-500';
  };

  const getStatusText = (tipo) => {
    const textMap = {
      'CRIACAO': 'Protocolo Criado',
      'TRAMITACAO': 'Tramitado',
      'CONCLUSAO': 'Concluído',
      'CANCELAMENTO': 'Cancelado',
      'ALTERACAO': 'Alterado',
      'ANEXO': 'Anexo Adicionado',
      'OBSERVACAO': 'Observação'
    };
    return textMap[tipo] || tipo;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString('pt-BR')
    };
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };

  // Dados simulados se não houver tramitações
  const mockTramitacoes = [
    {
      id: 1,
      tipo: 'CRIACAO',
      titulo: 'Protocolo criado',
      descricao: 'Protocolo foi criado no sistema',
      data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      responsavel: { username: 'Sistema', nome_completo: 'Sistema Automático' },
      observacoes: 'Protocolo gerado automaticamente pelo sistema'
    },
    {
      id: 2,
      tipo: 'TRAMITACAO',
      titulo: 'Encaminhado para análise',
      descricao: 'Protocolo encaminhado para o setor de análise',
      data: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      responsavel: { username: 'joao.silva', nome_completo: 'João Silva' },
      observacoes: 'Encaminhado para análise técnica inicial'
    },
    {
      id: 3,
      tipo: 'ANEXO',
      titulo: 'Documento anexado',
      descricao: 'Documento complementar foi anexado',
      data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      responsavel: { username: 'maria.santos', nome_completo: 'Maria Santos' },
      observacoes: 'Anexado documento de identificação do requerente'
    },
    {
      id: 4,
      tipo: 'OBSERVACAO',
      titulo: 'Observação adicionada',
      descricao: 'Observação técnica foi registrada',
      data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      responsavel: { username: 'carlos.oliveira', nome_completo: 'Carlos Oliveira' },
      observacoes: 'Necessário esclarecimento adicional sobre o produto reclamado'
    }
  ];

  const tramitacoesToShow = tramitacoes.length > 0 ? tramitacoes : mockTramitacoes;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClockIcon className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Histórico de Tramitação
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            {tramitacoesToShow.length} movimentações
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {tramitacoesToShow.map((tramitacao, index) => {
              const StatusIcon = getStatusIcon(tramitacao.tipo);
              const isExpanded = expandedItems.has(tramitacao.id);
              const dateInfo = formatDate(tramitacao.data);
              const isLast = index === tramitacoesToShow.length - 1;

              return (
                <li key={tramitacao.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(tramitacao.tipo)}`}>
                          <StatusIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {tramitacao.titulo || getStatusText(tramitacao.tipo)}
                              </p>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {getStatusText(tramitacao.tipo)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {getTimeAgo(tramitacao.data)}
                              </span>
                              <button
                                onClick={() => toggleExpanded(tramitacao.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-4 h-4" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">
                            {tramitacao.descricao}
                          </p>
                          
                          {/* Informações expandidas */}
                          {isExpanded && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                              <div className="flex items-center space-x-2">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  <strong>Responsável:</strong> {tramitacao.responsavel?.nome_completo || tramitacao.responsavel?.username || 'Sistema'}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  <strong>Data/Hora:</strong> {dateInfo.full}
                                </span>
                              </div>
                              
                              {tramitacao.observacoes && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Observações:
                                  </p>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                    {tramitacao.observacoes}
                                  </p>
                                </div>
                              )}
                              
                              {/* Detalhes específicos por tipo */}
                              {tramitacao.tipo === 'TRAMITACAO' && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <ArrowRightIcon className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">
                                      Detalhes da Tramitação
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">De:</span>
                                      <p className="font-medium">{tramitacao.responsavel_anterior?.username || 'Sistema'}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Para:</span>
                                      <p className="font-medium">{tramitacao.responsavel_novo?.username || 'Próximo responsável'}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {tramitacao.tipo === 'ANEXO' && (
                                <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <DocumentTextIcon className="w-4 h-4 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-800">
                                      Documento Anexado
                                    </span>
                                  </div>
                                  <div className="text-sm text-indigo-700">
                                    <p><strong>Arquivo:</strong> {tramitacao.arquivo_nome || 'documento.pdf'}</p>
                                    <p><strong>Tamanho:</strong> {tramitacao.arquivo_tamanho || '2.5 MB'}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Estatísticas da timeline */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tramitacoesToShow.length}
              </div>
              <div className="text-sm text-gray-600">Total de Movimentações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tramitacoesToShow.filter(t => t.tipo === 'CONCLUSAO').length}
              </div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {tramitacoesToShow.filter(t => t.tipo === 'TRAMITACAO').length}
              </div>
              <div className="text-sm text-gray-600">Tramitações</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {tramitacoesToShow.filter(t => t.tipo === 'ANEXO').length}
              </div>
              <div className="text-sm text-gray-600">Anexos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocoloTimeline;
