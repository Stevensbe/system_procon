import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  TrophyIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Rankings = () => {
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [rankings, setRankings] = useState({
    empresas: [],
    fiscais: [],
    processos: [],
    multas: [],
    autos: [],
    peticoes: []
  });
  const [estatisticas, setEstatisticas] = useState({});
  const [chartData, setChartData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('empresas');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [periodoSelecionado, categoriaSelecionada]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Importar o serviço de rankings
      const rankingsService = (await import('../../services/rankingsService')).default;
      
      // Carregar dados reais da API
      const [
        estatisticasData,
        empresasData,
        fiscaisData,
        processosData,
        multasData,
        autosData,
        peticoesData
      ] = await Promise.all([
        rankingsService.obterEstatisticas(),
        rankingsService.listarRankingEmpresas({ periodo: periodoSelecionado, categoria: categoriaSelecionada }),
        rankingsService.listarRankingFiscais({ periodo: periodoSelecionado }),
        rankingsService.listarRankingProcessos({ periodo: periodoSelecionado }),
        rankingsService.listarRankingMultas({ periodo: periodoSelecionado }),
        rankingsService.listarRankingAutos({ periodo: periodoSelecionado }),
        rankingsService.listarRankingPeticoes({ periodo: periodoSelecionado })
      ]);

      setEstatisticas(estatisticasData);
      setRankings({
        empresas: empresasData.results || empresasData || [],
        fiscais: fiscaisData.results || fiscaisData || [],
        processos: processosData.results || processosData || [],
        multas: multasData.results || multasData || [],
        autos: autosData.results || autosData || [],
        peticoes: peticoesData.results || peticoesData || []
      });

      // Preparar dados para gráficos
      const chartData = {
        empresasPorCategoria: prepararDadosGraficoEmpresas(empresasData.results || empresasData || []),
        fiscaisPorSetor: prepararDadosGraficoFiscais(fiscaisData.results || fiscaisData || []),
        processosPorTipo: prepararDadosGraficoProcessos(processosData.results || processosData || []),
        multasPorValor: prepararDadosGraficoMultas(multasData.results || multasData || [])
      };
      setChartData(chartData);
    } catch (error) {
      console.error('Erro ao carregar dados de rankings:', error);
      // Fallback para dados mock em caso de erro
      const mockRankings = {
        empresas: [
          { id: 1, posicao: 1, nome: 'Supermercado Central', categoria: 'Supermercado', score: 95, fiscalizacoes: 12, multas: 2, valorMultas: 15000, status: 'Ativo', ultimaFiscalizacao: '2024-01-15' },
          { id: 2, posicao: 2, nome: 'Posto Combustível ABC', categoria: 'Posto', score: 88, fiscalizacoes: 8, multas: 1, valorMultas: 8000, status: 'Ativo', ultimaFiscalizacao: '2024-01-10' },
          { id: 3, posicao: 3, nome: 'Banco Popular', categoria: 'Banco', score: 82, fiscalizacoes: 15, multas: 3, valorMultas: 25000, status: 'Ativo', ultimaFiscalizacao: '2024-01-12' },
          { id: 4, posicao: 4, nome: 'Farmácia Saúde', categoria: 'Farmácia', score: 78, fiscalizacoes: 6, multas: 1, valorMultas: 5000, status: 'Ativo', ultimaFiscalizacao: '2024-01-08' },
          { id: 5, posicao: 5, nome: 'Restaurante Sabor', categoria: 'Restaurante', score: 75, fiscalizacoes: 10, multas: 2, valorMultas: 12000, status: 'Ativo', ultimaFiscalizacao: '2024-01-05' }
        ],
        fiscais: [
          { id: 1, posicao: 1, nome: 'João Silva', setor: 'Fiscalização', fiscalizacoes: 45, autos: 38, multas: 12, score: 92, status: 'Ativo', ultimaAtividade: '2024-01-15' },
          { id: 2, posicao: 2, nome: 'Maria Santos', setor: 'Fiscalização', fiscalizacoes: 42, autos: 35, multas: 10, score: 89, status: 'Ativo', ultimaAtividade: '2024-01-14' },
          { id: 3, posicao: 3, nome: 'Pedro Costa', setor: 'Fiscalização', fiscalizacoes: 38, autos: 32, multas: 8, score: 85, status: 'Ativo', ultimaAtividade: '2024-01-13' },
          { id: 4, posicao: 4, nome: 'Ana Oliveira', setor: 'Fiscalização', fiscalizacoes: 35, autos: 28, multas: 7, score: 82, status: 'Ativo', ultimaAtividade: '2024-01-12' },
          { id: 5, posicao: 5, nome: 'Carlos Lima', setor: 'Fiscalização', fiscalizacoes: 32, autos: 25, multas: 6, score: 78, status: 'Ativo', ultimaAtividade: '2024-01-11' }
        ],
        processos: [
          { id: 1, posicao: 1, numero: '2024-001234', tipo: 'Fiscalização', empresa: 'Supermercado Central', status: 'Em andamento', prazo: '15 dias', prioridade: 'Alta', score: 95 },
          { id: 2, posicao: 2, numero: '2024-001235', tipo: 'Denúncia', empresa: 'Posto Combustível ABC', status: 'Concluído', prazo: 'Vencido', prioridade: 'Média', score: 88 },
          { id: 3, posicao: 3, numero: '2024-001236', tipo: 'Recurso', empresa: 'Banco Popular', status: 'Pendente', prazo: '30 dias', prioridade: 'Baixa', score: 82 },
          { id: 4, posicao: 4, numero: '2024-001237', tipo: 'Fiscalização', empresa: 'Farmácia Saúde', status: 'Em andamento', prazo: '20 dias', prioridade: 'Alta', score: 78 },
          { id: 5, posicao: 5, numero: '2024-001238', tipo: 'Denúncia', empresa: 'Restaurante Sabor', status: 'Concluído', prazo: 'Vencido', prioridade: 'Média', score: 75 }
        ],
        multas: [
          { id: 1, posicao: 1, empresa: 'Supermercado Central', valor: 15000, tipo: 'Infração Grave', data: '2024-01-15', status: 'Paga', score: 95 },
          { id: 2, posicao: 2, empresa: 'Banco Popular', valor: 12000, tipo: 'Infração Média', data: '2024-01-10', status: 'Pendente', score: 88 },
          { id: 3, posicao: 3, empresa: 'Posto Combustível ABC', valor: 8000, tipo: 'Infração Leve', data: '2024-01-08', status: 'Paga', score: 82 },
          { id: 4, posicao: 4, empresa: 'Restaurante Sabor', valor: 6000, tipo: 'Infração Média', data: '2024-01-05', status: 'Pendente', score: 78 },
          { id: 5, posicao: 5, empresa: 'Farmácia Saúde', valor: 5000, tipo: 'Infração Leve', data: '2024-01-03', status: 'Paga', score: 75 }
        ],
        autos: [
          { id: 1, posicao: 1, numero: 'AUTO-2024-001', tipo: 'Auto de Infração', empresa: 'Supermercado Central', fiscal: 'João Silva', data: '2024-01-15', valor: 15000, score: 95 },
          { id: 2, posicao: 2, numero: 'AUTO-2024-002', tipo: 'Auto de Constatação', empresa: 'Posto Combustível ABC', fiscal: 'Maria Santos', data: '2024-01-10', valor: 0, score: 88 },
          { id: 3, posicao: 3, numero: 'AUTO-2024-003', tipo: 'Auto de Infração', empresa: 'Banco Popular', fiscal: 'Pedro Costa', data: '2024-01-08', valor: 12000, score: 82 },
          { id: 4, posicao: 4, numero: 'AUTO-2024-004', tipo: 'Auto de Apreensão', empresa: 'Restaurante Sabor', fiscal: 'Ana Oliveira', data: '2024-01-05', valor: 0, score: 78 },
          { id: 5, posicao: 5, numero: 'AUTO-2024-005', tipo: 'Auto de Infração', empresa: 'Farmácia Saúde', fiscal: 'Carlos Lima', data: '2024-01-03', valor: 5000, score: 75 }
        ],
        peticoes: [
          { id: 1, posicao: 1, numero: 'PET-2024-001', tipo: 'Denúncia', interessado: 'Consumidor Anônimo', data: '2024-01-15', status: 'Em análise', score: 95 },
          { id: 2, posicao: 2, numero: 'PET-2024-002', tipo: 'Reclamação', interessado: 'João da Silva', data: '2024-01-12', status: 'Concluída', score: 88 },
          { id: 3, posicao: 3, numero: 'PET-2024-003', tipo: 'Solicitação', interessado: 'Maria Santos', data: '2024-01-10', status: 'Em análise', score: 82 },
          { id: 4, posicao: 4, numero: 'PET-2024-004', tipo: 'Denúncia', interessado: 'Pedro Costa', data: '2024-01-08', status: 'Concluída', score: 78 },
          { id: 5, posicao: 5, numero: 'PET-2024-005', tipo: 'Reclamação', interessado: 'Ana Oliveira', data: '2024-01-05', status: 'Em análise', score: 75 }
        ]
      };

      const mockEstatisticas = {
        totalEmpresas: 156,
        totalFiscais: 23,
        totalProcessos: 89,
        totalMultas: 45,
        totalAutos: 67,
        totalPeticoes: 123,
        valorTotalMultas: 125000,
        taxaConclusao: 78.5,
        tempoMedioProcesso: 15,
        satisfacaoCidadao: 4.2,
        empresasAtivas: 142,
        empresasInativas: 14,
        fiscaisAtivos: 20,
        fiscaisInativos: 3
      };

      const mockChartData = {
        rankingEmpresas: [
          { posicao: 1, nome: 'Supermercado Central', score: 95, fiscalizacoes: 12 },
          { posicao: 2, nome: 'Posto ABC', score: 88, fiscalizacoes: 8 },
          { posicao: 3, nome: 'Banco Popular', score: 82, fiscalizacoes: 15 },
          { posicao: 4, nome: 'Farmácia Saúde', score: 78, fiscalizacoes: 6 },
          { posicao: 5, nome: 'Restaurante Sabor', score: 75, fiscalizacoes: 10 }
        ],
        rankingFiscais: [
          { posicao: 1, nome: 'João Silva', score: 92, fiscalizacoes: 45 },
          { posicao: 2, nome: 'Maria Santos', score: 89, fiscalizacoes: 42 },
          { posicao: 3, nome: 'Pedro Costa', score: 85, fiscalizacoes: 38 },
          { posicao: 4, nome: 'Ana Oliveira', score: 82, fiscalizacoes: 35 },
          { posicao: 5, nome: 'Carlos Lima', score: 78, fiscalizacoes: 32 }
        ],
        distribuicaoCategorias: [
          { categoria: 'Supermercado', quantidade: 45, score: 85, cor: '#EF4444' },
          { categoria: 'Posto', quantidade: 32, score: 78, cor: '#3B82F6' },
          { categoria: 'Banco', quantidade: 28, score: 82, cor: '#10B981' },
          { categoria: 'Farmácia', quantidade: 25, score: 75, cor: '#F59E0B' },
          { categoria: 'Restaurante', quantidade: 22, score: 72, cor: '#8B5CF6' },
          { categoria: 'Outros', quantidade: 18, score: 68, cor: '#EC4899' }
        ],
        evolucaoRanking: [
          { mes: 'Jan', mediaScore: 75, topScore: 95, bottomScore: 55 },
          { mes: 'Fev', mediaScore: 78, topScore: 92, bottomScore: 58 },
          { mes: 'Mar', mediaScore: 82, topScore: 94, bottomScore: 62 },
          { mes: 'Abr', mediaScore: 85, topScore: 96, bottomScore: 65 },
          { mes: 'Mai', mediaScore: 88, topScore: 98, bottomScore: 68 },
          { mes: 'Jun', mediaScore: 90, topScore: 99, bottomScore: 70 }
        ]
      };

      setRankings(mockRankings);
      setEstatisticas(mockEstatisticas);
      setChartData(mockChartData);
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares para preparar dados dos gráficos
  const prepararDadosGraficoEmpresas = (empresas) => {
    const categorias = {};
    empresas.forEach(empresa => {
      if (!categorias[empresa.categoria]) {
        categorias[empresa.categoria] = { quantidade: 0, scoreMedio: 0, total: 0 };
      }
      categorias[empresa.categoria].quantidade++;
      categorias[empresa.categoria].total += empresa.score;
    });

    return Object.keys(categorias).map(categoria => ({
      categoria,
      quantidade: categorias[categoria].quantidade,
      scoreMedio: categorias[categoria].total / categorias[categoria].quantidade
    }));
  };

  const prepararDadosGraficoFiscais = (fiscais) => {
    const setores = {};
    fiscais.forEach(fiscal => {
      if (!setores[fiscal.setor]) {
        setores[fiscal.setor] = { quantidade: 0, fiscalizacoes: 0, autos: 0 };
      }
      setores[fiscal.setor].quantidade++;
      setores[fiscal.setor].fiscalizacoes += fiscal.fiscalizacoes;
      setores[fiscal.setor].autos += fiscal.autos;
    });

    return Object.keys(setores).map(setor => ({
      setor,
      quantidade: setores[setor].quantidade,
      fiscalizacoes: setores[setor].fiscalizacoes,
      autos: setores[setor].autos
    }));
  };

  const prepararDadosGraficoProcessos = (processos) => {
    const tipos = {};
    processos.forEach(processo => {
      if (!tipos[processo.tipo]) {
        tipos[processo.tipo] = { quantidade: 0, prioridadeAlta: 0 };
      }
      tipos[processo.tipo].quantidade++;
      if (processo.prioridade === 'Alta') {
        tipos[processo.tipo].prioridadeAlta++;
      }
    });

    return Object.keys(tipos).map(tipo => ({
      tipo,
      quantidade: tipos[tipo].quantidade,
      prioridadeAlta: tipos[tipo].prioridadeAlta
    }));
  };

  const prepararDadosGraficoMultas = (multas) => {
    const tipos = {};
    multas.forEach(multa => {
      if (!tipos[multa.tipo]) {
        tipos[multa.tipo] = { quantidade: 0, valorTotal: 0 };
      }
      tipos[multa.tipo].quantidade++;
      tipos[multa.tipo].valorTotal += multa.valor;
    });

    return Object.keys(tipos).map(tipo => ({
      tipo,
      quantidade: tipos[tipo].quantidade,
      valorTotal: tipos[tipo].valorTotal
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setSearchTerm('');
  };

  const handleConfigurarRanking = () => {
    setShowConfig(true);
  };

  const handleGerarRelatorio = async (tipo) => {
    try {
      // Simular geração de relatório
      console.log(`Gerando relatório de ranking: ${tipo}`);
      alert(`Relatório de ranking ${tipo} gerado com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const getFilteredAndSortedData = () => {
    let data = rankings[filterType] || [];
    
    // Aplicar filtro de busca
    if (searchTerm) {
      data = data.filter(item => {
        const searchFields = [
          item.nome || '',
          item.empresa || '',
          item.numero || '',
          item.tipo || '',
          item.categoria || '',
          item.setor || '',
          item.interessado || ''
        ];
        return searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Aplicar ordenação
    data.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return data;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ativo':
      case 'paga':
      case 'concluída':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'pendente':
      case 'em análise':
      case 'em andamento':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inativo':
      case 'vencido':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredData = getFilteredAndSortedData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Rankings</h1>
          <p className="text-gray-600 dark:text-gray-400">Análise e comparação de performance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleGerarRelatorio('Mensal')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Gerar Relatório
          </button>
          <button
            onClick={handleConfigurarRanking}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Configurar
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Empresas</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {estatisticas.totalEmpresas}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Fiscais Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {estatisticas.fiscaisAtivos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processos Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {estatisticas.totalProcessos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Taxa de Conclusão</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {estatisticas.taxaConclusao}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 5 Empresas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.rankingEmpresas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribuição por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.distribuicaoCategorias}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ categoria, score }) => `${categoria}: ${score}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="score"
              >
                {chartData.distribuicaoCategorias?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="empresas">Empresas</option>
            <option value="fiscais">Fiscais</option>
            <option value="processos">Processos</option>
            <option value="multas">Multas</option>
            <option value="autos">Autos</option>
            <option value="peticoes">Petições</option>
          </select>
        </div>

        {/* Lista de Rankings */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Posição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {filterType === 'empresas' ? 'Empresa' : 
                   filterType === 'fiscais' ? 'Fiscal' : 
                   filterType === 'processos' ? 'Processo' : 
                   filterType === 'multas' ? 'Multa' : 
                   filterType === 'autos' ? 'Auto' : 'Petição'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                {filterType === 'empresas' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fiscalizações
                    </th>
                  </>
                )}
                {filterType === 'fiscais' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Setor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fiscalizações
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 ? (
                        <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      ) : (
                        <span className="w-5 h-5 mr-2"></span>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.posicao}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.nome || item.numero || item.empresa}
                      </div>
                      {item.tipo && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.tipo}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(item.score)}`}>
                      {item.score}
                    </span>
                  </td>
                  {filterType === 'empresas' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.fiscalizacoes}
                      </td>
                    </>
                  )}
                  {filterType === 'fiscais' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.setor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.fiscalizacoes}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                                             <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                         <ArrowTrendingUpIcon className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Configuração */}
      {showConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurar Sistema de Rankings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Critérios de Pontuação
                  </label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Performance Padrão</option>
                    <option>Performance Avançada</option>
                    <option>Performance Personalizada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Período de Avaliação
                  </label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowConfig(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setShowConfig(false)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
