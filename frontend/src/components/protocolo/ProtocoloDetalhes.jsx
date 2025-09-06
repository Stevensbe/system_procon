import React, { useState } from 'react';
import { 
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import protocoloTramitacaoService from '../../services/protocoloTramitacaoService';

const ProtocoloDetalhes = ({ protocolo, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [loading, setLoading] = useState(false);
  const [tramitacoes, setTramitacoes] = useState(protocolo.tramitacoes || []);
  const [anexos, setAnexos] = useState(protocolo.anexos || []);

  const formatarStatus = (status) => {
    const statusMap = {
      'PROTOCOLADO': { label: 'Protocolado', color: 'blue', icon: DocumentTextIcon },
      'EM_TRAMITACAO': { label: 'Em Tramitação', color: 'yellow', icon: ArrowPathIcon },
      'PENDENTE': { label: 'Pendente', color: 'red', icon: ClockIcon },
      'FINALIZADO': { label: 'Finalizado', color: 'green', icon: CheckCircleIcon },
      'ARQUIVADO': { label: 'Arquivado', color: 'gray', icon: DocumentTextIcon },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: ExclamationTriangleIcon };
  };

  const formatarPrioridade = (prioridade) => {
    const prioridadeMap = {
      'BAIXA': { label: 'Baixa', color: 'green', icon: '🟢' },
      'NORMAL': { label: 'Normal', color: 'blue', icon: '🔵' },
      'ALTA': { label: 'Alta', color: 'orange', icon: '🟠' },
      'URGENTE': { label: 'Urgente', color: 'red', icon: '🔴' },
    };
    
    return prioridadeMap[prioridade] || { label: prioridade, color: 'gray', icon: '⚪' };
  };

  const calcularDiasEmTramitacao = () => {
    if (!protocolo.data_protocolo) return 0;
    const dataProtocolo = new Date(protocolo.data_protocolo);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - dataProtocolo);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calcularPrazoRestante = () => {
    if (!protocolo.prazo_resposta) return null;
    const diasTramitacao = calcularDiasEmTramitacao();
    return protocolo.prazo_resposta - diasTramitacao;
  };

  const status = formatarStatus(protocolo.status);
  const prioridade = formatarPrioridade(protocolo.prioridade);
  const StatusIcon = status.icon;
  const diasTramitacao = calcularDiasEmTramitacao();
  const prazoRestante = calcularPrazoRestante();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Cabeçalho */}
        <div className={`bg-${status.color}-500 text-white p-6`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <StatusIcon className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">
                  {protocoloTramitacaoService.formatarNumeroProtocolo(protocolo.numero_protocolo)}
                </h2>
                <p className="text-sm opacity-90 mt-1">
                  Status: {status.label}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-75">Dias em tramitação</p>
                <p className="text-xl font-bold">{diasTramitacao}</p>
              </div>
              
              {prazoRestante !== null && (
                <div className="text-right">
                  <p className="text-sm opacity-75">Prazo restante</p>
                  <p className={`text-xl font-bold ${
                    prazoRestante <= 0 ? 'text-red-200' :
                    prazoRestante <= 5 ? 'text-yellow-200' :
                    'text-white'
                  }`}>
                    {prazoRestante > 0 ? `${prazoRestante} dias` : 'Em atraso'}
                  </p>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'detalhes', label: 'Detalhes', icon: EyeIcon },
              { id: 'tramitacoes', label: 'Tramitações', icon: ArrowPathIcon },
              { id: 'anexos', label: 'Anexos', icon: PaperClipIcon },
              { id: 'historico', label: 'Histórico', icon: ChatBubbleLeftRightIcon },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'anexos' && anexos.length > 0 && (
                    <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-1">
                      {anexos.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* DETALHES */}
          {activeTab === 'detalhes' && (
            <div className="space-y-6">
              
              {/* Informações Básicas */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assunto</p>
                      <p className="text-gray-900 font-medium">{protocolo.assunto}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data do Protocolo</p>
                      <p className="text-gray-900">
                        {new Date(protocolo.data_protocolo).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Documento</p>
                      <p className="text-gray-900">{protocolo.tipo_documento?.nome || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Interessado</p>
                      <p className="text-gray-900 font-medium">{protocolo.interessado_nome}</p>
                      <p className="text-sm text-gray-600">{protocolo.interessado_documento}</p>
                      {protocolo.interessado_email && (
                        <p className="text-sm text-gray-600">{protocolo.interessado_email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{prioridade.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Prioridade</p>
                        <p className={`text-${prioridade.color}-600 font-medium`}>
                          {prioridade.label}
                        </p>
                      </div>
                    </div>
                    
                    {protocolo.prazo_resposta && (
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Prazo</p>
                          <p className="text-gray-900">{protocolo.prazo_resposta} dias</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Observações */}
              {protocolo.observacoes && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Observações</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{protocolo.observacoes}</p>
                  </div>
                </div>
              )}
              
              {/* Endereço do Interessado */}
              {protocolo.interessado_endereco && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Endereço</h4>
                  <p className="text-gray-700">{protocolo.interessado_endereco}</p>
                </div>
              )}
            </div>
          )}
          
          {/* TRAMITAÇÕES */}
          {activeTab === 'tramitacoes' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  Histórico de Tramitações
                </h4>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                  Nova Tramitação
                </button>
              </div>
              
              {tramitacoes.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma tramitação registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tramitacoes.map((tramitacao, index) => (
                    <div key={index} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                        {index < tramitacoes.length - 1 && (
                          <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {tramitacao.setor_origem?.nome} → {tramitacao.setor_destino?.nome}
                              </p>
                              <p className="text-sm text-gray-600">
                                Por: {tramitacao.usuario?.nome || 'Sistema'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tramitacao.status === 'RECEBIDA'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tramitacao.status === 'RECEBIDA' ? 'Recebida' : 'Pendente'}
                            </span>
                          </div>
                          
                          {tramitacao.observacoes && (
                            <p className="text-sm text-gray-700 mb-2">
                              {tramitacao.observacoes}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>
                              Enviada em {new Date(tramitacao.data_tramitacao).toLocaleDateString('pt-BR')}
                            </span>
                            {tramitacao.data_recebimento && (
                              <span>
                                Recebida em {new Date(tramitacao.data_recebimento).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* ANEXOS */}
          {activeTab === 'anexos' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  Anexos do Protocolo
                </h4>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                  Adicionar Anexo
                </button>
              </div>
              
              {anexos.length === 0 ? (
                <div className="text-center py-8">
                  <PaperClipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum anexo encontrado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Anexos adicionados aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {anexos.map((anexo, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900 truncate">
                            {anexo.nome_arquivo}
                          </span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Download
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Tamanho: {(anexo.tamanho_bytes / 1024 / 1024).toFixed(2)} MB</p>
                        <p>Tipo: {anexo.tipo_mime}</p>
                        {anexo.descricao && (
                          <p className="italic">"{anexo.descricao}"</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Adicionado em {new Date(anexo.data_upload).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* HISTÓRICO */}
          {activeTab === 'historico' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                Histórico de Ações
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg">
                  <DocumentDuplicateIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Protocolo criado</p>
                    <p className="text-sm text-blue-700">
                      Documento protocolado no sistema
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {new Date(protocolo.data_protocolo).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(protocolo.data_protocolo).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                {protocolo.data_primeira_tramitacao && (
                  <div className="flex items-start space-x-3 bg-yellow-50 p-4 rounded-lg">
                    <ArrowPathIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Primeira tramitação</p>
                      <p className="text-sm text-yellow-700">
                        Documento encaminhado para análise
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {new Date(protocolo.data_primeira_tramitacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {protocolo.status === 'FINALIZADO' && (
                  <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Protocolo finalizado</p>
                      <p className="text-sm text-green-700">
                        Processo concluído com sucesso
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {protocolo.data_finalizacao && 
                          new Date(protocolo.data_finalizacao).toLocaleDateString('pt-BR')
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Protocolo gerado automaticamente pelo sistema
            </div>
            
            <div className="flex space-x-3">
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">
                Imprimir
              </button>
              <button 
                onClick={onClose}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocoloDetalhes;