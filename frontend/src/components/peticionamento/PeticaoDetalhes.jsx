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
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import peticionamentoService from '../../services/peticionamentoService';

const PeticaoDetalhes = ({ peticao, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [loading, setLoading] = useState(false);
  const [respostas, setRespostas] = useState(peticao.respostas || []);
  const [anexos, setAnexos] = useState(peticao.anexos || []);

  const formatarStatus = (status) => {
    const statusMap = {
      'RASCUNHO': { label: 'Rascunho', color: 'gray', icon: DocumentTextIcon },
      'ENVIADA': { label: 'Enviada', color: 'blue', icon: ArrowPathIcon },
      'RECEBIDA': { label: 'Recebida', color: 'green', icon: CheckCircleIcon },
      'EM_ANALISE': { label: 'Em Análise', color: 'yellow', icon: EyeIcon },
      'PENDENTE_DOCUMENTACAO': { label: 'Pendente Documentação', color: 'orange', icon: ExclamationTriangleIcon },
      'RESPONDIDA': { label: 'Respondida', color: 'purple', icon: ChatBubbleLeftRightIcon },
      'FINALIZADA': { label: 'Finalizada', color: 'green', icon: CheckCircleIcon },
      'INDEFERIDA': { label: 'Indeferida', color: 'red', icon: ExclamationTriangleIcon },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: ExclamationTriangleIcon };
  };

  const formatarTipoPeticao = (categoria) => {
    const tipoMap = {
      'RECLAMACAO': { label: 'Reclamação', color: 'red', icon: '⚠️' },
      'DENUNCIA': { label: 'Denúncia', color: 'orange', icon: '🚨' },
      'SOLICITACAO': { label: 'Solicitação', color: 'blue', icon: '📋' },
      'SUGESTAO': { label: 'Sugestão', color: 'green', icon: '💡' },
      'RECURSO': { label: 'Recurso', color: 'purple', icon: '⚖️' },
    };
    
    return tipoMap[categoria] || { label: categoria, color: 'gray', icon: '📄' };
  };

  const calcularDiasAnalise = () => {
    if (!peticao.criado_em) return 0;
    const dataCriacao = new Date(peticao.criado_em);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - dataCriacao);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calcularPrazoRestante = () => {
    if (!peticao.prazo_resposta) return null;
    const diasAnalise = calcularDiasAnalise();
    return peticao.prazo_resposta - diasAnalise;
  };

  const status = formatarStatus(peticao.status);
  const tipoPeticao = formatarTipoPeticao(peticao.tipo_peticao?.categoria);
  const StatusIcon = status.icon;
  const diasAnalise = calcularDiasAnalise();
  const prazoRestante = calcularPrazoRestante();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Cabeçalho */}
        <div className={`bg-${status.color}-500 text-white p-6`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <StatusIcon className="h-8 w-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">
                  {peticionamentoService.formatarNumeroPeticao(peticao.numero_peticao)}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-sm opacity-90">
                    Status: {status.label}
                  </p>
                  <span className="text-lg">{tipoPeticao.icon}</span>
                  <span className="text-sm opacity-90">{tipoPeticao.label}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-75">Dias em análise</p>
                <p className="text-xl font-bold">{diasAnalise}</p>
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
              { id: 'respostas', label: 'Respostas', icon: ChatBubbleLeftRightIcon },
              { id: 'anexos', label: 'Anexos', icon: PaperClipIcon },
              { id: 'historico', label: 'Histórico', icon: ArrowPathIcon },
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
                  {tab.id === 'respostas' && respostas.length > 0 && (
                    <span className="bg-blue-200 text-blue-600 text-xs rounded-full px-2 py-1">
                      {respostas.length}
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
              
              {/* Informações da Petição */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assunto</p>
                      <p className="text-gray-900 font-medium">{peticao.assunto}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Envio</p>
                      <p className="text-gray-900">
                        {new Date(peticao.criado_em).toLocaleDateString('pt-BR', {
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
                      <p className="text-sm font-medium text-gray-500">Tipo de Petição</p>
                      <p className="text-gray-900">{peticao.tipo_peticao?.nome || 'Não informado'}</p>
                    </div>
                  </div>
                  
                  {peticao.valor_causa && (
                    <div className="flex items-start">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Valor Envolvido</p>
                        <p className="text-gray-900 font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(peticao.valor_causa)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Peticionário</p>
                      <p className="text-gray-900 font-medium">{peticao.peticionario_nome}</p>
                      <p className="text-sm text-gray-600">{peticao.peticionario_documento}</p>
                    </div>
                  </div>
                  
                  {peticao.peticionario_email && (
                    <div className="flex items-start">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">E-mail</p>
                        <p className="text-gray-900">{peticao.peticionario_email}</p>
                      </div>
                    </div>
                  )}
                  
                  {peticao.peticionario_telefone && (
                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Telefone</p>
                        <p className="text-gray-900">{peticao.peticionario_telefone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Prazo de Resposta</p>
                      <p className="text-gray-900">{peticao.prazo_resposta || 30} dias úteis</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Empresa Reclamada */}
              {peticao.empresa_nome && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Empresa Reclamada</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nome/Razão Social</p>
                        <p className="text-gray-900">{peticao.empresa_nome}</p>
                      </div>
                      {peticao.empresa_cnpj && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">CNPJ</p>
                          <p className="text-gray-900">{peticao.empresa_cnpj}</p>
                        </div>
                      )}
                      {peticao.empresa_endereco && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-500">Endereço</p>
                          <p className="text-gray-900">{peticao.empresa_endereco}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Descrição */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Descrição da Petição</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {peticao.descricao}
                  </p>
                </div>
              </div>
              
              {/* Pedidos */}
              {peticao.pedidos && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Pedidos</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {peticao.pedidos}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* RESPOSTAS */}
          {activeTab === 'respostas' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  Respostas e Comunicações
                </h4>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                  Nova Resposta
                </button>
              </div>
              
              {respostas.length === 0 ? (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma resposta registrada</p>
                  <p className="text-sm text-gray-400 mt-1">
                    As respostas enviadas ao peticionário aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {respostas.map((resposta, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {resposta.tipo === 'RESPOSTA_OFICIAL' ? '📋 Resposta Oficial' :
                             resposta.tipo === 'SOLICITACAO_DOCUMENTOS' ? '📎 Solicitação de Documentos' :
                             resposta.tipo === 'COMUNICACAO_INTERNA' ? '🏢 Comunicação Interna' :
                             '💬 Comunicação'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Por: {resposta.usuario?.nome || 'Sistema'} • {new Date(resposta.data_envio).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          resposta.enviado_email 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {resposta.enviado_email ? 'Enviado por e-mail' : 'Interno'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {resposta.conteudo}
                        </p>
                      </div>
                      
                      {resposta.anexos && resposta.anexos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Anexos:</p>
                          <div className="flex flex-wrap gap-2">
                            {resposta.anexos.map((anexo, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                📄 {anexo.nome}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* ANEXOS */}
          {activeTab === 'anexos' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                Anexos da Petição
              </h4>
              
              {anexos.length === 0 ? (
                <div className="text-center py-8">
                  <PaperClipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum anexo encontrado</p>
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
                Histórico da Petição
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Petição criada</p>
                    <p className="text-sm text-blue-700">
                      Petição registrada no sistema pelo cidadão
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {new Date(peticao.criado_em).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(peticao.criado_em).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                {peticao.data_recebimento && (
                  <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Petição recebida</p>
                      <p className="text-sm text-green-700">
                        Confirmado recebimento pela instituição
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(peticao.data_recebimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {peticao.status === 'EM_ANALISE' && (
                  <div className="flex items-start space-x-3 bg-yellow-50 p-4 rounded-lg">
                    <EyeIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Em análise</p>
                      <p className="text-sm text-yellow-700">
                        Petição sendo analisada pela equipe técnica
                      </p>
                    </div>
                  </div>
                )}
                
                {peticao.status === 'RESPONDIDA' && (
                  <div className="flex items-start space-x-3 bg-purple-50 p-4 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900">Petição respondida</p>
                      <p className="text-sm text-purple-700">
                        Resposta oficial enviada ao peticionário
                      </p>
                      {peticao.data_resposta && (
                        <p className="text-xs text-purple-600 mt-1">
                          {new Date(peticao.data_resposta).toLocaleDateString('pt-BR')}
                        </p>
                      )}
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
              Petição gerada automaticamente pelo sistema
            </div>
            
            <div className="flex space-x-3">
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">
                Imprimir
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                Responder
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

export default PeticaoDetalhes;