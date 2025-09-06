import React, { useState, useEffect } from 'react';
import { 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ArrowPathIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import peticionamentoService from '../../services/peticionamentoService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PeticionamentoForm from '../../components/portal/PeticionamentoForm';
import PeticaoDetalhes from '../../components/peticionamento/PeticaoDetalhes';
import GestaoInterna from '../../components/peticionamento/GestaoInterna';

const PeticionamentoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [peticoesPendentes, setPeticoesPendentes] = useState([]);
  const [peticoesRecentes, setPeticoesRecentes] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [consultaNumero, setConsultaNumero] = useState('');
  const [consultaDocumento, setConsultaDocumento] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState(null);
  const [peticaoSelecionada, setPeticaoSelecionada] = useState(null);
  const [consultaLoading, setConsultaLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [dados, pendentes, recentes] = await Promise.all([
        peticionamentoService.obterDadosDashboard(),
        peticionamentoService.listarPeticoesPendentes(),
        peticionamentoService.listarPeticoes({ ordering: '-criado_em', limit: 10 })
      ]);
      
      setEstatisticas(dados);
      setPeticoesPendentes(pendentes.results || pendentes || []);
      setPeticoesRecentes(recentes.results || recentes || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Dados simulados para demonstração
      setEstatisticas({
        total_peticoes: 856,
        peticoes_mes: 124,
        enviadas: 234,
        em_analise: 89,
        respondidas: 456,
        pendentes: 34,
        finalizadas: 533
      });
      setPeticoesPendentes([
        {
          id: 1,
          numero_peticao: 'PET-2025-0000123',
          assunto: 'Reclamação sobre produto com defeito',
          peticionario_nome: 'João Silva Santos',
          tipo_peticao: { nome: 'Reclamação', categoria: 'RECLAMACAO' },
          status: 'EM_ANALISE',
          criado_em: '2025-08-15T10:30:00Z',
          prazo_resposta: 30,
          empresa_nome: 'Loja XYZ Ltda'
        },
        {
          id: 2,
          numero_peticao: 'PET-2025-0000124',
          assunto: 'Solicitação de cancelamento de serviço',
          peticionario_nome: 'Maria Fernanda Costa',
          tipo_peticao: { nome: 'Solicitação', categoria: 'SOLICITACAO' },
          status: 'PENDENTE_DOCUMENTACAO',
          criado_em: '2025-08-14T14:20:00Z',
          prazo_resposta: 15,
          empresa_nome: 'Telecom ABC'
        }
      ]);
      setPeticoesRecentes([
        {
          id: 3,
          numero_peticao: 'PET-2025-0000125',
          assunto: 'Denúncia de propaganda enganosa',
          peticionario_nome: 'Carlos Eduardo Lima',
          tipo_peticao: { nome: 'Denúncia', categoria: 'DENUNCIA' },
          status: 'ENVIADA',
          criado_em: '2025-08-16T09:15:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConsulta = async (e) => {
    e.preventDefault();
    if (!consultaNumero.trim() && !consultaDocumento.trim()) {
      alert('Informe o número da petição ou documento');
      return;
    }

    setConsultaLoading(true);
    try {
      const resultado = await peticionamentoService.consultarPeticaoPortal(
        consultaNumero,
        consultaDocumento
      );
      setResultadoConsulta(resultado);
    } catch (error) {
      console.error('Erro na consulta:', error);
      setResultadoConsulta({
        encontrada: false,
        erro: 'Petição não encontrada ou dados incorretos'
      });
    } finally {
      setConsultaLoading(false);
    }
  };

  if (loading && activeTab === 'dashboard') {
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
            Peticionamento Eletrônico
          </h1>
          <p className="text-gray-600">
            Gerencie petições, recursos e solicitações dos cidadãos
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('nova-peticao')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentPlusIcon className="h-5 w-5 mr-2" />
            Nova Petição
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
          { id: 'consultar', label: 'Consultar Petição', icon: MagnifyingGlassIcon },
          { id: 'nova-peticao', label: 'Nova Petição', icon: DocumentPlusIcon },
          { id: 'gestao', label: 'Gestão Interna', icon: ChatBubbleLeftRightIcon },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.total_peticoes?.toLocaleString()}
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
                    {estatisticas?.peticoes_mes?.toLocaleString()}
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-cyan-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-600 text-sm font-medium uppercase tracking-wider">
                    Enviadas
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.enviadas?.toLocaleString()}
                  </p>
                </div>
                <PaperAirplaneIcon className="h-10 w-10 text-cyan-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium uppercase tracking-wider">
                    Em Análise
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.em_analise?.toLocaleString()}
                  </p>
                </div>
                <EyeIcon className="h-10 w-10 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium uppercase tracking-wider">
                    Respondidas
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.respondidas?.toLocaleString()}
                  </p>
                </div>
                <ChatBubbleLeftRightIcon className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium uppercase tracking-wider">
                    Pendentes
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.pendentes?.toLocaleString()}
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium uppercase tracking-wider">
                    Finalizadas
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.finalizadas?.toLocaleString()}
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Seções de Petições */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Petições Pendentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-red-500" />
                  Petições Pendentes de Análise
                </h3>
              </div>
              <div className="p-6">
                {peticoesPendentes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma petição pendente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {peticoesPendentes.slice(0, 5).map(peticao => {
                      const status = peticionamentoService.formatarStatus(peticao.status);
                      const categoria = peticionamentoService.formatarCategoria(peticao.tipo_peticao?.categoria);
                      const diasPendente = peticionamentoService.calcularDiasPeticao(peticao.criado_em);
                      
                      return (
                        <div key={peticao.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setPeticaoSelecionada(peticao)}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-600 hover:text-blue-800">
                                {peticionamentoService.formatarNumeroPeticao(peticao.numero_peticao)}
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {peticao.assunto}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Peticionário:</strong> {peticao.peticionario_nome}
                              </p>
                              {peticao.empresa_nome && (
                                <p className="text-sm text-gray-600">
                                  <strong>Empresa:</strong> {peticao.empresa_nome}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${categoria.color}-100 text-${categoria.color}-800`}>
                                  {categoria.icon} {categoria.label}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <div className="flex items-center space-x-2 mb-1">
                                <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); setPeticaoSelecionada(peticao); }}>
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                  {status.label}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                {diasPendente} dias
                              </span>
                              {diasPendente > (peticao.prazo_resposta || 30) && (
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Petições Recentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DocumentPlusIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Petições Recentes
                </h3>
              </div>
              <div className="p-6">
                {peticoesRecentes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma petição recente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {peticoesRecentes.slice(0, 5).map(peticao => {
                      const status = peticionamentoService.formatarStatus(peticao.status);
                      const categoria = peticionamentoService.formatarCategoria(peticao.tipo_peticao?.categoria);
                      
                      return (
                        <div key={peticao.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setPeticaoSelecionada(peticao)}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-600 hover:text-blue-800">
                                {peticionamentoService.formatarNumeroPeticao(peticao.numero_peticao)}
                              </p>
                              <p className="text-sm text-gray-900 mt-1">
                                {peticao.assunto}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Peticionário:</strong> {peticao.peticionario_nome}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${categoria.color}-100 text-${categoria.color}-800`}>
                                  {categoria.icon} {categoria.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(peticao.criado_em).toLocaleDateString('pt-BR')} às {new Date(peticao.criado_em).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); setPeticaoSelecionada(peticao); }}>
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'consultar' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-blue-600" />
            Consultar Petição
          </h3>
          
          <form onSubmit={handleConsulta} className="max-w-2xl space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Petição
                </label>
                <input
                  type="text"
                  value={consultaNumero}
                  onChange={(e) => setConsultaNumero(e.target.value)}
                  placeholder="PET-2025-0000123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ do Peticionário
                </label>
                <input
                  type="text"
                  value={consultaDocumento}
                  onChange={(e) => setConsultaDocumento(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={consultaLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {consultaLoading ? 'Consultando...' : 'Consultar Petição'}
            </button>
          </form>
          
          {/* Resultado da Consulta */}
          {resultadoConsulta && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                Resultado da Consulta
              </h4>
              
              {resultadoConsulta.encontrada ? (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-semibold text-green-600">
                        ✅ Petição Encontrada
                      </p>
                      <p className="text-lg font-semibold text-blue-600 mt-2">
                        {peticionamentoService.formatarNumeroPeticao(resultadoConsulta.numero_peticao)}
                      </p>
                    </div>
                    <button 
                      onClick={() => setPeticaoSelecionada(resultadoConsulta)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>Ver Detalhes</span>
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status:</p>
                      <p className="font-medium">{peticionamentoService.formatarStatus(resultadoConsulta.status).label}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assunto:</p>
                      <p className="font-medium">{resultadoConsulta.assunto}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data de Envio:</p>
                      <p className="font-medium">{new Date(resultadoConsulta.criado_em).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Peticionário:</p>
                      <p className="font-medium">{resultadoConsulta.peticionario_nome}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-red-600 mb-2">
                    Petição Não Encontrada
                  </h4>
                  <p className="text-gray-600">
                    {resultadoConsulta.erro || 'Verifique os dados informados e tente novamente.'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
            <div className="flex">
              <div className="ml-3">
                <h4 className="font-medium text-blue-800">Como consultar?</h4>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• Informe o número da petição OU o CPF/CNPJ do peticionário</p>
                  <p>• O sistema irá mostrar o status atual e histórico da petição</p>
                  <p>• Você pode acompanhar todas as etapas do processo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nova-peticao' && (
        <PeticionamentoForm 
          onSuccess={(novaPeticao) => {
            // Atualizar estatísticas e listas
            carregarDados();
            setActiveTab('dashboard');
            
            // Mostrar petição criada
            setTimeout(() => {
              setPeticaoSelecionada(novaPeticao);
            }, 500);
          }}
          onCancel={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'gestao' && (
        <GestaoInterna 
          onPeticaoSelect={(peticao) => setPeticaoSelecionada(peticao)}
        />
      )}
      
      {/* Modal de Detalhes da Petição */}
      {peticaoSelecionada && (
        <PeticaoDetalhes 
          peticao={peticaoSelecionada}
          onClose={() => setPeticaoSelecionada(null)}
          onUpdate={(peticaoAtualizada) => {
            // Atualizar dados e fechar modal
            carregarDados();
            setPeticaoSelecionada(null);
          }}
        />
      )}
    </div>
  );
};

export default PeticionamentoDashboard;