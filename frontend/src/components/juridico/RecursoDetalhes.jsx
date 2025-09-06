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
  ScaleIcon,
  GavelIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import analiseJuridicaService from '../../services/analiseJuridicaService';

const RecursoDetalhes = ({ recurso, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [loading, setLoading] = useState(false);
  const [pareceres, setPareceres] = useState(recurso.pareceres || []);
  const [anexos, setAnexos] = useState(recurso.anexos || []);
  const [movimentacoes, setMovimentacoes] = useState(recurso.movimentacoes || []);

  const formatarStatus = (status) => {
    const statusMap = {
      'AGUARDANDO_ANALISE': { label: 'Aguardando Análise', color: 'blue', icon: ClockIcon },
      'EM_ANALISE': { label: 'Em Análise', color: 'yellow', icon: EyeIcon },
      'PENDENTE_INFORMACOES': { label: 'Pendente Informações', color: 'orange', icon: ExclamationTriangleIcon },
      'PARECER_EMITIDO': { label: 'Parecer Emitido', color: 'purple', icon: DocumentCheckIcon },
      'DEFERIDO': { label: 'Deferido', color: 'green', icon: CheckCircleIcon },
      'INDEFERIDO': { label: 'Indeferido', color: 'red', icon: ExclamationTriangleIcon },
      'PARCIALMENTE_DEFERIDO': { label: 'Parcialmente Deferido', color: 'yellow', icon: ScaleIcon },
      'AGUARDANDO_JULGAMENTO': { label: 'Aguardando Julgamento', color: 'blue', icon: GavelIcon },
      'JULGADO': { label: 'Julgado', color: 'gray', icon: GavelIcon },
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: ExclamationTriangleIcon };
  };

  const formatarTipoRecurso = (tipo) => {
    const tipoMap = {
      'MULTA': { label: 'Recurso de Multa', color: 'red', icon: '💰' },
      'AUTO_INFRACAO': { label: 'Auto de Infração', color: 'orange', icon: '⚠️' },
      'FISCALIZACAO': { label: 'Fiscalização', color: 'blue', icon: '🔍' },
      'ADMINISTRATIVO': { label: 'Administrativo', color: 'purple', icon: '📋' },
      'RECONSIDERACAO': { label: 'Reconsideração', color: 'yellow', icon: '🔄' },
    };
    
    return tipoMap[tipo] || { label: tipo, color: 'gray', icon: '📄' };
  };

  const calcularDiasAnalise = () => {
    if (!recurso.data_abertura) return 0;
    const dataAbertura = new Date(recurso.data_abertura);
    const hoje = new Date();
    const diffTime = Math.abs(hoje - dataAbertura);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calcularPrazoRestante = () => {
    if (!recurso.prazo_resposta) return null;
    const diasAnalise = calcularDiasAnalise();
    return recurso.prazo_resposta - diasAnalise;
  };

  const status = formatarStatus(recurso.status);
  const tipoRecurso = formatarTipoRecurso(recurso.tipo_recurso);
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
                  {analiseJuridicaService.formatarNumeroRecurso(recurso.numero_recurso)}
                </h2>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-sm opacity-90">
                    Status: {status.label}
                  </p>
                  <span className="text-lg">{tipoRecurso.icon}</span>
                  <span className="text-sm opacity-90">{tipoRecurso.label}</span>
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
              { id: 'pareceres', label: 'Pareceres', icon: DocumentCheckIcon },
              { id: 'anexos', label: 'Anexos', icon: PaperClipIcon },
              { id: 'movimentacoes', label: 'Movimentações', icon: ArrowPathIcon },
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
                  {tab.id === 'pareceres' && pareceres.length > 0 && (
                    <span className="bg-blue-200 text-blue-600 text-xs rounded-full px-2 py-1">
                      {pareceres.length}
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
              
              {/* Informações do Recurso */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fundamentação</p>
                      <p className="text-gray-900 font-medium">{recurso.fundamentacao}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Abertura</p>
                      <p className="text-gray-900">
                        {new Date(recurso.data_abertura).toLocaleDateString('pt-BR', {
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
                    <ScaleIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Processo de Origem</p>
                      <p className="text-gray-900 font-semibold">{recurso.numero_processo_origem}</p>
                    </div>
                  </div>
                  
                  {recurso.valor_causa && (
                    <div className="flex items-start">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Valor da Causa</p>
                        <p className="text-gray-900 font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(recurso.valor_causa)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Requerente</p>
                      <p className="text-gray-900 font-medium">{recurso.requerente_nome}</p>
                      {recurso.requerente_documento && (
                        <p className="text-sm text-gray-600">{recurso.requerente_documento}</p>
                      )}
                    </div>
                  </div>
                  
                  {recurso.relator && (
                    <div className="flex items-start">
                      <GavelIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Relator</p>
                        <p className="text-gray-900">{recurso.relator.first_name} {recurso.relator.last_name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Prazo para Decisão</p>
                      <p className="text-gray-900">{recurso.prazo_resposta || 30} dias úteis</p>
                    </div>
                  </div>
                  
                  {recurso.instancia && (
                    <div className="flex items-start">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Instância</p>
                        <p className="text-gray-900">{recurso.instancia}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Descrição Detalhada */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Descrição do Recurso</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {recurso.descricao || recurso.fundamentacao}
                  </p>
                </div>
              </div>
              
              {/* Pedidos */}
              {recurso.pedidos && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Pedidos</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {recurso.pedidos}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Jurisprudência Citada */}
              {recurso.jurisprudencia && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Jurisprudência Citada</h4>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {recurso.jurisprudencia}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* PARECERES */}
          {activeTab === 'pareceres' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  Pareceres Jurídicos
                </h4>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                  Novo Parecer
                </button>
              </div>
              
              {pareceres.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum parecer emitido</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Os pareceres jurídicos sobre este recurso aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pareceres.map((parecer, index) => (
                    <div key={index} className="border rounded-lg p-6 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-gray-900">
                              {parecer.tipo === 'PRELIMINAR' ? 'Parecer Preliminar' :
                               parecer.tipo === 'DEFINITIVO' ? 'Parecer Definitivo' :
                               parecer.tipo === 'COMPLEMENTAR' ? 'Parecer Complementar' :
                               'Parecer Jurídico'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Por: {parecer.parecerista?.nome || 'Sistema'} • {new Date(parecer.data_emissao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            parecer.conclusao === 'DEFERIMENTO' ? 'bg-green-100 text-green-800' :
                            parecer.conclusao === 'INDEFERIMENTO' ? 'bg-red-100 text-red-800' :
                            parecer.conclusao === 'PARCIAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {parecer.conclusao === 'DEFERIMENTO' ? '✅ Favorável' :
                             parecer.conclusao === 'INDEFERIMENTO' ? '❌ Contrário' :
                             parecer.conclusao === 'PARCIAL' ? '⚖️ Parcial' :
                             '📋 Em análise'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Fundamentação */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Fundamentação Jurídica:</h5>
                        <div className="bg-gray-50 rounded p-4">
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {parecer.fundamentacao}
                          </p>
                        </div>
                      </div>
                      
                      {/* Dispositivo/Conclusão */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Dispositivo:</h5>
                        <div className="bg-blue-50 rounded p-4 border-l-4 border-blue-400">
                          <p className="text-gray-800 font-medium">
                            {parecer.dispositivo}
                          </p>
                        </div>
                      </div>
                      
                      {/* Base Legal */}
                      {parecer.base_legal && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Base Legal:</h5>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                            {parecer.base_legal}
                          </p>
                        </div>
                      )}
                      
                      {/* Observações */}
                      {parecer.observacoes && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Observações:</h5>
                          <p className="text-sm text-gray-600 italic">
                            {parecer.observacoes}
                          </p>
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
                Anexos do Recurso
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
          
          {/* MOVIMENTAÇÕES */}
          {activeTab === 'movimentacoes' && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-6">
                Histórico de Movimentações
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Recurso protocolado</p>
                    <p className="text-sm text-blue-700">
                      Recurso administrativo registrado no sistema
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {new Date(recurso.data_abertura).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(recurso.data_abertura).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                {recurso.data_distribuicao && (
                  <div className="flex items-start space-x-3 bg-yellow-50 p-4 rounded-lg">
                    <ArrowPathIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Recurso distribuído</p>
                      <p className="text-sm text-yellow-700">
                        Recurso distribuído para análise jurídica
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {new Date(recurso.data_distribuicao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {recurso.status === 'PARECER_EMITIDO' && (
                  <div className="flex items-start space-x-3 bg-purple-50 p-4 rounded-lg">
                    <DocumentCheckIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900">Parecer emitido</p>
                      <p className="text-sm text-purple-700">
                        Parecer jurídico elaborado e anexado ao processo
                      </p>
                    </div>
                  </div>
                )}
                
                {(recurso.status === 'DEFERIDO' || recurso.status === 'INDEFERIDO' || recurso.status === 'PARCIALMENTE_DEFERIDO') && (
                  <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg">
                    <GavelIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Decisão proferida</p>
                      <p className="text-sm text-green-700">
                        Recurso julgado e decisão administrativa publicada
                      </p>
                      {recurso.data_julgamento && (
                        <p className="text-xs text-green-600 mt-1">
                          {new Date(recurso.data_julgamento).toLocaleDateString('pt-BR')}
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
              Recurso gerado automaticamente pelo sistema
            </div>
            
            <div className="flex space-x-3">
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm">
                Imprimir
              </button>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm">
                Emitir Parecer
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                Julgar Recurso
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

export default RecursoDetalhes;