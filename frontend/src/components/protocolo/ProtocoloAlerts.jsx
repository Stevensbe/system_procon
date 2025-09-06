import React, { useState, useEffect } from 'react';
import { 
  BellIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import useNotification from '../../hooks/useNotification';

const ProtocoloAlerts = ({ protocolo, onAlertAction }) => {
  const { showNotification } = useNotification();
  const [alerts, setAlerts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simular alertas baseados no protocolo
  useEffect(() => {
    generateAlerts();
  }, [protocolo]);

  const generateAlerts = () => {
    const mockAlerts = [];

    // Alerta de prazo vencendo
    if (protocolo?.data_limite) {
      const hoje = new Date();
      const prazo = new Date(protocolo.data_limite);
      const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));

      if (diasRestantes < 0) {
        mockAlerts.push({
          id: 1,
          tipo: 'PRAZO_VENCIDO',
          titulo: 'Prazo vencido',
          mensagem: `O prazo para conclusão deste protocolo venceu há ${Math.abs(diasRestantes)} dia(s)`,
          prioridade: 'ALTA',
          data: new Date().toISOString(),
          lido: false,
          acao_requerida: true
        });
      } else if (diasRestantes <= 3) {
        mockAlerts.push({
          id: 2,
          tipo: 'PRAZO_VENCENDO',
          titulo: 'Prazo vencendo',
          mensagem: `O prazo para conclusão vence em ${diasRestantes} dia(s)`,
          prioridade: 'MEDIA',
          data: new Date().toISOString(),
          lido: false,
          acao_requerida: true
        });
      }
    }

    // Alerta de protocolo sem responsável
    if (!protocolo?.responsavel_atual) {
      mockAlerts.push({
        id: 3,
        tipo: 'SEM_RESPONSAVEL',
        titulo: 'Sem responsável',
        mensagem: 'Este protocolo não possui responsável atribuído',
        prioridade: 'ALTA',
        data: new Date().toISOString(),
        lido: false,
        acao_requerida: true
      });
    }

    // Alerta de protocolo urgente
    if (protocolo?.prioridade === 'URGENTE') {
      mockAlerts.push({
        id: 4,
        tipo: 'URGENTE',
        titulo: 'Protocolo urgente',
        mensagem: 'Este protocolo foi marcado como urgente e requer atenção imediata',
        prioridade: 'ALTA',
        data: new Date().toISOString(),
        lido: false,
        acao_requerida: true
      });
    }

    // Alerta de documentos pendentes
    if (protocolo?.documentos?.length === 0) {
      mockAlerts.push({
        id: 5,
        tipo: 'SEM_DOCUMENTOS',
        titulo: 'Sem documentos',
        mensagem: 'Este protocolo não possui documentos anexados',
        prioridade: 'MEDIA',
        data: new Date().toISOString(),
        lido: false,
        acao_requerida: false
      });
    }

    setAlerts(mockAlerts);
  };

  const getAlertIcon = (tipo) => {
    const iconMap = {
      'PRAZO_VENCIDO': ExclamationTriangleIcon,
      'PRAZO_VENCENDO': ClockIcon,
      'SEM_RESPONSAVEL': ExclamationTriangleIcon,
      'URGENTE': ExclamationTriangleIcon,
      'SEM_DOCUMENTOS': ExclamationTriangleIcon,
      'TRAMITACAO': ClockIcon,
      'CONCLUSAO': CheckCircleIcon
    };
    return iconMap[tipo] || BellIcon;
  };

  const getAlertColor = (prioridade) => {
    const colorMap = {
      'BAIXA': 'bg-blue-50 border-blue-200 text-blue-800',
      'MEDIA': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'ALTA': 'bg-red-50 border-red-200 text-red-800'
    };
    return colorMap[prioridade] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getAlertIconColor = (prioridade) => {
    const colorMap = {
      'BAIXA': 'text-blue-600',
      'MEDIA': 'text-yellow-600',
      'ALTA': 'text-red-600'
    };
    return colorMap[prioridade] || 'text-gray-600';
  };

  const markAsRead = async (alertId) => {
    setLoading(true);
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, lido: true }
            : alert
        )
      );
      
      showNotification('Alerta marcado como lido', 'success');
    } catch (error) {
      showNotification('Erro ao marcar alerta como lido', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAlerts(prev => 
        prev.map(alert => ({ ...alert, lido: true }))
      );
      
      showNotification('Todos os alertas marcados como lidos', 'success');
    } catch (error) {
      showNotification('Erro ao marcar alertas como lidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAlertAction = (alert) => {
    if (onAlertAction) {
      onAlertAction(alert);
    }
    
    // Ações específicas por tipo de alerta
    switch (alert.tipo) {
      case 'PRAZO_VENCIDO':
      case 'PRAZO_VENCENDO':
        showNotification('Redirecionando para edição do protocolo...', 'info');
        break;
      case 'SEM_RESPONSAVEL':
        showNotification('Abrindo seletor de responsável...', 'info');
        break;
      case 'URGENTE':
        showNotification('Protocolo urgente - prioridade máxima', 'warning');
        break;
      case 'SEM_DOCUMENTOS':
        showNotification('Abrindo upload de documentos...', 'info');
        break;
      default:
        break;
    }
  };

  const unreadAlerts = alerts.filter(alert => !alert.lido);
  const highPriorityAlerts = alerts.filter(alert => alert.prioridade === 'ALTA' && !alert.lido);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BellIcon className="w-6 h-6 text-gray-600" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Alertas do Protocolo
              </h3>
              <p className="text-sm text-gray-500">
                {unreadAlerts.length} não lido{unreadAlerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadAlerts.length > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                Marcar todos como lidos
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de Alta Prioridade (Sempre visíveis) */}
      {highPriorityAlerts.length > 0 && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <h4 className="text-sm font-medium text-red-800 mb-3">
            ⚠️ Alertas de Alta Prioridade
          </h4>
          <div className="space-y-2">
            {highPriorityAlerts.map(alert => {
              const AlertIcon = getAlertIcon(alert.tipo);
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColor(alert.prioridade)}`}
                >
                  <div className="flex items-start space-x-3">
                    <AlertIcon className={`w-5 h-5 mt-0.5 ${getAlertIconColor(alert.prioridade)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">{alert.titulo}</h5>
                        <div className="flex items-center space-x-1">
                          {alert.acao_requerida && (
                            <button
                              onClick={() => handleAlertAction(alert)}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              Ação
                            </button>
                          )}
                          <button
                            onClick={() => markAsRead(alert.id)}
                            disabled={loading}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm mt-1">{alert.mensagem}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista Completa de Alertas (Expandível) */}
      {isExpanded && (
        <div className="p-4">
          <div className="space-y-3">
            {alerts.map(alert => {
              const AlertIcon = getAlertIcon(alert.tipo);
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    alert.lido 
                      ? 'bg-gray-50 border-gray-200 text-gray-600' 
                      : getAlertColor(alert.prioridade)
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <AlertIcon className={`w-5 h-5 mt-0.5 ${
                      alert.lido ? 'text-gray-400' : getAlertIconColor(alert.prioridade)
                    }`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h5 className={`text-sm font-medium ${
                            alert.lido ? 'text-gray-500' : ''
                          }`}>
                            {alert.titulo}
                          </h5>
                          {!alert.lido && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Novo
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(alert.data).toLocaleDateString('pt-BR')}
                          </span>
                          
                          {alert.acao_requerida && (
                            <button
                              onClick={() => handleAlertAction(alert)}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                            >
                              Ação
                            </button>
                          )}
                          
                          <button
                            onClick={() => markAsRead(alert.id)}
                            disabled={loading}
                            className="p-1 hover:bg-gray-100 rounded"
                            title={alert.lido ? 'Marcar como não lido' : 'Marcar como lido'}
                          >
                            {alert.lido ? (
                              <EyeSlashIcon className="w-4 h-4" />
                            ) : (
                              <XMarkIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <p className={`text-sm mt-1 ${
                        alert.lido ? 'text-gray-500' : ''
                      }`}>
                        {alert.mensagem}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Prioridade: {alert.prioridade}</span>
                        <span>Tipo: {alert.tipo.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Total: {alerts.length}</span>
            <span>Não lidos: {unreadAlerts.length}</span>
            <span>Alta prioridade: {highPriorityAlerts.length}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs">
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocoloAlerts;
