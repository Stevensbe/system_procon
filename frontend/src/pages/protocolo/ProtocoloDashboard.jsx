import React, { useState, useEffect } from 'react';
import { 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  ArrowPathIcon,
  ChartBarIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import protocoloTramitacaoService from '../../services/protocoloTramitacaoService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProtocoloForm from '../../components/protocolo/ProtocoloForm';
import ProtocoloDetalhes from '../../components/protocolo/ProtocoloDetalhes';

const ProtocoloDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [pendencias, setPendencias] = useState([]);
  const [tramitacoesPendentes, setTramitacoesPendentes] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [protocoloSelecionado, setProtocoloSelecionado] = useState(null);
  const [consultaNumero, setConsultaNumero] = useState('');
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaResultado, setConsultaResultado] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const handleConsultaProtocolo = async () => {
    if (!consultaNumero.trim()) return;
    
    setConsultaLoading(true);
    try {
      const protocolo = await protocoloTramitacaoService.consultarProtocolo(consultaNumero.trim());
      setConsultaResultado({
        encontrado: true,
        ...protocolo
      });
    } catch (error) {
      console.error('Erro ao consultar protocolo:', error);
      setConsultaResultado({
        encontrado: false,
        erro: 'Protocolo não encontrado ou erro na consulta'
      });
    } finally {
      setConsultaLoading(false);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [stats, pend, tram] = await Promise.all([
        protocoloTramitacaoService.obterEstatisticas(),
        protocoloTramitacaoService.listarPendencias(),
        protocoloTramitacaoService.listarTramitacoesPendentes()
      ]);
      
      setEstatisticas(stats);
      setPendencias(pend.results || pend || []);
      setTramitacoesPendentes(tram.results || tram || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Dados simulados para demonstração
      setEstatisticas({
        total_protocolos: 1234,
        protocolos_mes: 89,
        em_tramitacao: 456,
        pendentes: 23,
        finalizados: 789,
        em_atraso: 12
      });
      setPendencias([
        {
          id: 1,
          numero_protocolo: '2025-0000123',
          assunto: 'Solicitação de informações sobre produto',
          interessado_nome: 'João Silva',
          data_protocolo: '2025-08-15T10:30:00Z',
          status: 'PENDENTE',
          dias_pendente: 5
        },
        {
          id: 2,
          numero_protocolo: '2025-0000124',
          assunto: 'Reclamação sobre cobrança indevida',
          interessado_nome: 'Maria Santos',
          data_protocolo: '2025-08-14T14:20:00Z',
          status: 'EM_TRAMITACAO',
          dias_pendente: 6
        }
      ]);
      setTramitacoesPendentes([
        {
          id: 1,
          protocolo: {
            numero_protocolo: '2025-0000125',
            assunto: 'Análise de recurso administrativo'
          },
          setor_origem: { nome: 'Atendimento', sigla: 'ATD' },
          setor_destino: { nome: 'Jurídico', sigla: 'JUR' },
          data_tramitacao: '2025-08-16T09:00:00Z',
          status: 'PENDENTE_RECEBIMENTO'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard de Protocolos
          </h1>
          <p className="text-gray-600">
            Acompanhe protocolos e tramitações em tempo real
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('novo-protocolo')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            Novo Protocolo
          </button>
          <button
            onClick={carregarDados}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
          { id: 'consultar', label: 'Consultar', icon: MagnifyingGlassIcon },
          { id: 'novo-protocolo', label: 'Novo Protocolo', icon: DocumentPlusIcon },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'dashboard' && (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas.total_protocolos?.toLocaleString()}
                  </p>
                </div>
                <DocumentPlusIcon className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium uppercase tracking-wider">
                    Este Mês
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas.protocolos_mes?.toLocaleString()}
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium uppercase tracking-wider">
                    Em Tramitação
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas.em_tramitacao?.toLocaleString()}
                  </p>
                </div>
                <ArrowPathIcon className="h-10 w-10 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium uppercase tracking-wider">
                    Pendentes
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas.pendentes?.toLocaleString()}
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium uppercase tracking-wider">
                    Finalizados
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas.finalizados?.toLocaleString()}
                  </p>
                </div>
                <FolderIcon className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium uppercase tracking-wider">
                    Em Atraso
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas.em_atraso?.toLocaleString()}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Seções de Pendências */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Protocolos Pendentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-red-500" />
                  Protocolos Pendentes
                </h3>
              </div>
              <div className="p-6">
                {pendencias.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum protocolo pendente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendencias.slice(0, 5).map(protocolo => (
                      <div key={protocolo.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setProtocoloSelecionado(protocolo)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-blue-600 hover:text-blue-800">
                              {protocoloTramitacaoService.formatarNumeroProtocolo(protocolo.numero_protocolo)}
                            </p>
                            <p className="text-sm text-gray-900 mt-1">
                              {protocolo.assunto}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Interessado:</strong> {protocolo.interessado_nome}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Protocolado em {new Date(protocolo.data_protocolo).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-4 flex flex-col items-end">
                            <div className="flex items-center space-x-2 mb-1">
                              <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); setProtocoloSelecionado(protocolo); }}>
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                protocolo.status === 'PENDENTE' 
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {protocoloTramitacaoService.formatarStatus(protocolo.status).label}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">
                              {protocolo.dias_pendente} dias
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tramitações Pendentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ArrowPathIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Tramitações Pendentes
                </h3>
              </div>
              <div className="p-6">
                {tramitacoesPendentes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma tramitação pendente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {tramitacoesPendentes.slice(0, 5).map(tramitacao => (
                      <div key={tramitacao.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setProtocoloSelecionado({...tramitacao.protocolo, id: tramitacao.protocolo.id || tramitacao.id})}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-blue-600 hover:text-blue-800">
                              {protocoloTramitacaoService.formatarNumeroProtocolo(tramitacao.protocolo.numero_protocolo)}
                            </p>
                            <p className="text-sm text-gray-900 mt-1">
                              {tramitacao.protocolo.assunto}
                            </p>
                            <div className="flex items-center mt-2 text-sm text-gray-600">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {tramitacao.setor_origem.sigla}
                              </span>
                              <ArrowPathIcon className="h-4 w-4 mx-2" />
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {tramitacao.setor_destino.sigla}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Tramitado em {new Date(tramitacao.data_tramitacao).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); setProtocoloSelecionado({...tramitacao.protocolo, id: tramitacao.protocolo.id || tramitacao.id}); }}>
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              Pendente
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'consultar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-blue-600" />
              Consultar Protocolo
            </h3>
            
            <div className="max-w-2xl">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={consultaNumero}
                  onChange={(e) => setConsultaNumero(e.target.value)}
                  placeholder="Digite o número do protocolo (ex: 2025-0000123)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleConsultaProtocolo()}
                />
                <button 
                  onClick={handleConsultaProtocolo}
                  disabled={consultaLoading || !consultaNumero.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {consultaLoading ? 'Consultando...' : 'Consultar'}
                </button>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
              <div className="flex">
                <div className="ml-3">
                  <h4 className="font-medium text-blue-800">Como consultar?</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>• Digite o número completo do protocolo (ex: 2025-0000123)</p>
                    <p>• O sistema irá mostrar o status atual e histórico de tramitação</p>
                    <p>• Você pode acompanhar todas as etapas do processo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resultado da Consulta */}
          {consultaResultado && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Resultado da Consulta
              </h4>
              
              {consultaResultado.encontrado ? (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-semibold text-blue-600">
                        {protocoloTramitacaoService.formatarNumeroProtocolo(consultaResultado.numero_protocolo)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status: {protocoloTramitacaoService.formatarStatus(consultaResultado.status).label}
                      </p>
                    </div>
                    <button 
                      onClick={() => setProtocoloSelecionado(consultaResultado)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>Ver Detalhes</span>
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Assunto:</p>
                      <p className="font-medium">{consultaResultado.assunto}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data do Protocolo:</p>
                      <p className="font-medium">{new Date(consultaResultado.data_protocolo).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Interessado:</p>
                      <p className="font-medium">{consultaResultado.interessado_nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dias em Tramitação:</p>
                      <p className="font-medium">
                        {Math.ceil((new Date() - new Date(consultaResultado.data_protocolo)) / (1000 * 60 * 60 * 24))} dias
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Protocolo não encontrado ou não existe.</p>
                  <p className="text-sm text-gray-500 mt-2">Verifique o número informado e tente novamente.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'novo-protocolo' && (
        <ProtocoloForm 
          onSuccess={(novoProtocolo) => {
            // Atualizar estatísticas e lista de pendências
            carregarDados();
            setActiveTab('dashboard');
            
            // Mostrar protocolo criado
            setTimeout(() => {
              setProtocoloSelecionado(novoProtocolo);
            }, 500);
          }}
          onCancel={() => setActiveTab('dashboard')}
        />
      )}
      
      {/* Modal de Detalhes do Protocolo */}
      {protocoloSelecionado && (
        <ProtocoloDetalhes 
          protocolo={protocoloSelecionado}
          onClose={() => setProtocoloSelecionado(null)}
          onUpdate={(protocoloAtualizado) => {
            // Atualizar dados e fechar modal
            carregarDados();
            setProtocoloSelecionado(null);
          }}
        />
      )}
    </div>
  );
};

export default ProtocoloDashboard;