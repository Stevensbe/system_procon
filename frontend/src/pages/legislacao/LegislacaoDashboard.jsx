import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ScaleIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  StarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import legislacaoService from '../../services/legislacaoService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LegislacaoDetalhes from '../../components/legislacao/LegislacaoDetalhes';
import LegislacaoForm from '../../components/legislacao/LegislacaoForm';
import GestaoLegislacao from '../../components/legislacao/GestaoLegislacao';

const LegislacaoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState(null);
  const [leisMaisAcessadas, setLeisMaisAcessadas] = useState([]);
  const [leisRecentes, setLeisRecentes] = useState([]);
  const [tiposLegislacao, setTiposLegislacao] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [consultaQuery, setConsultaQuery] = useState('');
  const [consultaNumero, setConsultaNumero] = useState('');
  const [consultaAno, setConsultaAno] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  
  // Estados para os novos componentes
  const [selectedLei, setSelectedLei] = useState(null);
  const [showLeiDetails, setShowLeiDetails] = useState(false);
  const [showLeiForm, setShowLeiForm] = useState(false);
  const [editingLei, setEditingLei] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [stats, maisAcessadas, recentes, tipos, cats] = await Promise.all([
        legislacaoService.obterEstatisticas(),
        legislacaoService.listarMaisAcessadas(8),
        legislacaoService.listarRecentes(8),
        legislacaoService.listarTiposLegislacao(),
        legislacaoService.listarCategorias()
      ]);
      
      setEstatisticas(stats);
      setLeisMaisAcessadas(maisAcessadas.results || maisAcessadas || []);
      setLeisRecentes(recentes.results || recentes || []);
      setTiposLegislacao(tipos.results || tipos || []);
      setCategorias(cats.results || cats || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Dados simulados para demonstração
      setEstatisticas({
        total_leis: 1247,
        leis_vigentes: 1156,
        leis_revogadas: 91,
        decretos: 458,
        portarias: 289,
        resolucoes: 134,
        visualizacoes_mes: 3245
      });
      
      setLeisMaisAcessadas([
        {
          id: 1,
          titulo: 'Lei de Defesa do Consumidor',
          numero: '8078',
          ano: 1990,
          tipo: 'LEI',
          status: 'VIGENTE',
          categoria: 'DIREITO_CONSUMIDOR',
          ementa: 'Dispõe sobre a proteção do consumidor e dá outras providências.',
          visualizacoes: 15420,
          data_publicacao: '1990-09-11'
        },
        {
          id: 2,
          titulo: 'Lei Geral de Proteção de Dados',
          numero: '13709',
          ano: 2018,
          tipo: 'LEI',
          status: 'VIGENTE',
          categoria: 'DIREITO_CONSUMIDOR',
          ementa: 'Lei Geral de Proteção de Dados Pessoais (LGPD).',
          visualizacoes: 12350,
          data_publicacao: '2018-08-14'
        }
      ]);
      
      setLeisRecentes([
        {
          id: 3,
          titulo: 'Decreto sobre Marco Civil da Internet',
          numero: '8771',
          ano: 2025,
          tipo: 'DECRETO',
          status: 'VIGENTE',
          categoria: 'REGULACAO_MERCADO',
          ementa: 'Regulamenta a Lei do Marco Civil da Internet.',
          data_publicacao: '2025-08-10'
        }
      ]);
      
      setTiposLegislacao([
        { id: 1, nome: 'Lei', codigo: 'LEI' },
        { id: 2, nome: 'Decreto', codigo: 'DECRETO' },
        { id: 3, nome: 'Portaria', codigo: 'PORTARIA' },
        { id: 4, nome: 'Resolução', codigo: 'RESOLUCAO' }
      ]);
      
      setCategorias([
        { id: 1, nome: 'Direito do Consumidor', codigo: 'DIREITO_CONSUMIDOR' },
        { id: 2, nome: 'Defesa da Concorrência', codigo: 'DEFESA_CONCORRENCIA' },
        { id: 3, nome: 'Regulação de Mercado', codigo: 'REGULACAO_MERCADO' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handlers para os novos componentes
  const handleOpenLeiForm = (lei = null) => {
    setEditingLei(lei);
    setShowLeiForm(true);
  };

  const handleCloseLeiForm = () => {
    setShowLeiForm(false);
    setEditingLei(null);
  };

  const handleSaveLei = async (leiData) => {
    try {
      if (editingLei) {
        // Editar lei existente
        console.log('Editando lei:', leiData);
        // await legislacaoService.atualizarLei(editingLei.id, leiData);
      } else {
        // Criar nova lei
        console.log('Criando nova lei:', leiData);
        // await legislacaoService.criarLei(leiData);
      }
      
      // Recarregar dados
      await carregarDados();
      handleCloseLeiForm();
    } catch (error) {
      console.error('Erro ao salvar lei:', error);
      throw error;
    }
  };

  const handleViewLeiDetails = (lei) => {
    setSelectedLei(lei);
    setShowLeiDetails(true);
  };

  const handleCloseLeiDetails = () => {
    setShowLeiDetails(false);
    setSelectedLei(null);
  };

  const handleDeleteLei = async (lei) => {
    if (window.confirm(`Tem certeza que deseja excluir a ${lei.tipo} ${lei.numero}/${lei.ano}?`)) {
      try {
        console.log('Excluindo lei:', lei);
        // await legislacaoService.excluirLei(lei.id);
        await carregarDados();
      } catch (error) {
        console.error('Erro ao excluir lei:', error);
        alert('Erro ao excluir a legislação. Tente novamente.');
      }
    }
  };

  const handleBuscaTexto = async (e) => {
    e.preventDefault();
    if (!consultaQuery.trim()) return;
    
    setLoading(true);
    try {
      const filtros = {};
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroCategoria) filtros.categoria = filtroCategoria;
      
      const resultados = await legislacaoService.buscarTexto(consultaQuery, filtros);
      setResultadosBusca(resultados.results || resultados || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResultadosBusca([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscaNumero = async (e) => {
    e.preventDefault();
    if (!consultaNumero.trim()) return;
    
    setLoading(true);
    try {
      const resultados = await legislacaoService.buscarPorNumero(consultaNumero, consultaAno);
      setResultadosBusca(Array.isArray(resultados) ? resultados : [resultados].filter(Boolean));
    } catch (error) {
      console.error('Erro na busca:', error);
      setResultadosBusca([]);
    } finally {
      setLoading(false);
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
            Legislação
          </h1>
          <p className="text-gray-600">
            Consulta e gestão de leis, decretos e normas aplicáveis
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => handleOpenLeiForm()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Nova Lei
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
          { id: 'buscar', label: 'Buscar Legislação', icon: MagnifyingGlassIcon },
          { id: 'gestao', label: 'Gestão de Leis', icon: BookOpenIcon },
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
                    Total Leis
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.total_leis?.toLocaleString()}
                  </p>
                </div>
                <BookOpenIcon className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium uppercase tracking-wider">
                    Vigentes
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.leis_vigentes?.toLocaleString()}
                  </p>
                </div>
                <ScaleIcon className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium uppercase tracking-wider">
                    Revogadas
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.leis_revogadas?.toLocaleString()}
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium uppercase tracking-wider">
                    Decretos
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.decretos?.toLocaleString()}
                  </p>
                </div>
                <DocumentTextIcon className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium uppercase tracking-wider">
                    Portarias
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.portarias?.toLocaleString()}
                  </p>
                </div>
                <DocumentTextIcon className="h-10 w-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-cyan-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-600 text-sm font-medium uppercase tracking-wider">
                    Resoluções
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.resolucoes?.toLocaleString()}
                  </p>
                </div>
                <ScaleIcon className="h-10 w-10 text-cyan-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium uppercase tracking-wider">
                    Acessos/Mês
                  </p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {estatisticas?.visualizacoes_mes?.toLocaleString()}
                  </p>
                </div>
                <EyeIcon className="h-10 w-10 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Seções de Leis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Leis Mais Acessadas */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Leis Mais Acessadas
                </h3>
              </div>
              <div className="p-6">
                {leisMaisAcessadas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma lei encontrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {leisMaisAcessadas.slice(0, 5).map((lei, index) => {
                      const status = legislacaoService.formatarStatusLei(lei.status);
                      const tipo = legislacaoService.formatarTipoLegislacao(lei.tipo);
                      
                      return (
                        <div 
                          key={lei.id} 
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleViewLeiDetails(lei)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg font-bold text-yellow-600">
                                  #{index + 1}
                                </span>
                                <span className="font-semibold text-blue-600">
                                  {legislacaoService.formatarNumeroLei(lei.numero, lei.ano, lei.tipo)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {lei.titulo}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {legislacaoService.gerarResumo(lei.ementa, 120)}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${tipo.color}-100 text-${tipo.color}-800`}>
                                  {tipo.icon} {tipo.label}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                  {status.label}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <div className="flex items-center text-gray-500">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                <span className="text-sm">{lei.visualizacoes?.toLocaleString()}</span>
                              </div>
                              <span className="text-xs text-gray-400 mt-1">
                                {legislacaoService.formatarDataPublicacao(lei.data_publicacao)}
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

            {/* Leis Recentes */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Legislação Recente
                </h3>
              </div>
              <div className="p-6">
                {leisRecentes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma lei recente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {leisRecentes.slice(0, 5).map(lei => {
                      const status = legislacaoService.formatarStatusLei(lei.status);
                      const tipo = legislacaoService.formatarTipoLegislacao(lei.tipo);
                      
                      return (
                        <div 
                          key={lei.id} 
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleViewLeiDetails(lei)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-600">
                                {legislacaoService.formatarNumeroLei(lei.numero, lei.ano, lei.tipo)}
                              </p>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                {lei.titulo}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {legislacaoService.gerarResumo(lei.ementa, 120)}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${tipo.color}-100 text-${tipo.color}-800`}>
                                  {tipo.icon} {tipo.label}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                  {status.label}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <span className="text-xs text-gray-500">
                                {legislacaoService.formatarDataPublicacao(lei.data_publicacao)}
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

      {activeTab === 'buscar' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-blue-600" />
            Buscar Legislação
          </h3>
          
          {/* Tabs de Busca */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <h4 className="font-medium mb-3">Busca por Texto</h4>
              <form onSubmit={handleBuscaTexto} className="space-y-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={consultaQuery}
                    onChange={(e) => setConsultaQuery(e.target.value)}
                    placeholder="Digite palavras-chave, conceitos ou temas..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
                
                {/* Filtros */}
                <div className="flex space-x-4">
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os tipos</option>
                    {tiposLegislacao.map(tipo => (
                      <option key={tipo.id} value={tipo.codigo}>{tipo.nome}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.codigo}>{categoria.nome}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            
            <div className="w-px bg-gray-300"></div>
            
            <div className="flex-1">
              <h4 className="font-medium mb-3">Busca por Número</h4>
              <form onSubmit={handleBuscaNumero} className="space-y-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={consultaNumero}
                    onChange={(e) => setConsultaNumero(e.target.value)}
                    placeholder="Número da lei"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={consultaAno}
                    onChange={(e) => setConsultaAno(e.target.value)}
                    placeholder="Ano"
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Resultados da Busca */}
          {resultadosBusca.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-4">
                Resultados da Busca ({resultadosBusca.length})
              </h4>
              <div className="space-y-4">
                {resultadosBusca.map(lei => {
                  const status = legislacaoService.formatarStatusLei(lei.status);
                  const tipo = legislacaoService.formatarTipoLegislacao(lei.tipo);
                  
                  return (
                    <div 
                      key={lei.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewLeiDetails(lei)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-blue-600 text-lg">
                            {legislacaoService.formatarNumeroLei(lei.numero, lei.ano, lei.tipo)}
                          </p>
                          <p className="font-medium text-gray-900 mt-1">
                            {lei.titulo}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            {lei.ementa}
                          </p>
                          <div className="flex items-center space-x-2 mt-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium bg-${tipo.color}-100 text-${tipo.color}-800`}>
                              {tipo.icon} {tipo.label}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <span className="text-sm text-gray-500">
                            {legislacaoService.formatarDataPublicacao(lei.data_publicacao)}
                          </span>
                          {lei.visualizacoes && (
                            <div className="flex items-center text-gray-400 mt-1">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              <span className="text-xs">{lei.visualizacoes.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Dicas de Busca */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
            <div className="flex">
              <div className="ml-3">
                <h4 className="font-medium text-blue-800">Dicas de Busca</h4>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• Use palavras-chave específicas como "consumidor", "defesa", "concorrência"</p>
                  <p>• Para buscar leis específicas, use o número e ano (ex: 8078/1990)</p>
                  <p>• Use filtros para refinar os resultados por tipo e categoria</p>
                  <p>• A busca é feita no título, ementa e texto completo das leis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gestao' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <BookOpenIcon className="h-6 w-6 mr-2 text-blue-600" />
            Gestão de Legislação
          </h3>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h4 className="font-medium text-yellow-800">Sistema de Gestão de Legislação</h4>
                <p className="mt-1 text-sm text-yellow-700">
                  A interface completa para cadastro, edição e gestão de leis, decretos e normas está sendo implementada.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Sistema de Gestão Completo
            </h4>
            <p className="text-gray-600 mb-6">
              Interface para cadastro, edição, versionamento e publicação de legislação
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
              Implementar Sistema de Gestão
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegislacaoDashboard;