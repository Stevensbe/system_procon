import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Financeiro = () => {
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [estatisticas, setEstatisticas] = useState({});
  const [chartData, setChartData] = useState({});
  const [transacoes, setTransacoes] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [filterType, setFilterType] = useState('todas');

  useEffect(() => {
    carregarDados();
  }, [periodoSelecionado, categoriaSelecionada]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Importar o serviço financeiro
      const financeiroService = (await import('../../services/financeiroService')).default;
      
      // Carregar dados reais da API
      const [
        estatisticasData,
        transacoesData,
        receitasData,
        despesasData,
        multasAplicadasData,
        multasPagasData,
        multasPendentesData,
        fluxoCaixaData,
        dreData
      ] = await Promise.all([
        financeiroService.obterEstatisticas(),
        financeiroService.listarTransacoes({ periodo: periodoSelecionado, categoria: categoriaSelecionada }),
        financeiroService.listarReceitas({ periodo: periodoSelecionado }),
        financeiroService.listarDespesas({ periodo: periodoSelecionado }),
        financeiroService.listarMultasAplicadas({ periodo: periodoSelecionado }),
        financeiroService.listarMultasPagas({ periodo: periodoSelecionado }),
        financeiroService.listarMultasPendentes({ periodo: periodoSelecionado }),
        financeiroService.obterFluxoCaixa(periodoSelecionado),
        financeiroService.obterDRE(periodoSelecionado)
      ]);

      setEstatisticas(estatisticasData);
      setTransacoes(transacoesData.results || transacoesData || []);
      
      // Preparar dados para gráficos
      const chartData = {
        receitaDespesa: prepararDadosReceitaDespesa(receitasData.results || receitasData || [], despesasData.results || despesasData || []),
        multasPorCategoria: prepararDadosMultasPorCategoria(multasAplicadasData.results || multasAplicadasData || []),
        pagamentosPorMes: prepararDadosPagamentosPorMes(multasPagasData.results || multasPagasData || [], multasPendentesData.results || multasPendentesData || []),
        fluxoCaixa: fluxoCaixaData || [],
        dre: dreData || {}
      };
      setChartData(chartData);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      // Fallback para dados mock em caso de erro
      const mockEstatisticas = {
        receitaTotal: 1250000,
        receitaMes: 125000,
        receitaAno: 1250000,
        despesaTotal: 450000,
        despesaMes: 45000,
        despesaAno: 450000,
        lucroTotal: 800000,
        lucroMes: 80000,
        lucroAno: 800000,
        multasAplicadas: 156,
        multasPagas: 134,
        multasPendentes: 22,
        valorMultasAplicadas: 1250000,
        valorMultasPagas: 1050000,
        valorMultasPendentes: 200000,
        taxaPagamento: 85.9,
        tempoMedioPagamento: 15,
        inadimplencia: 14.1
      };

      const mockChartData = {
        receitaDespesa: [
          { mes: 'Jan', receita: 98000, despesa: 42000, lucro: 56000 },
          { mes: 'Fev', receita: 105000, despesa: 45000, lucro: 60000 },
          { mes: 'Mar', receita: 112000, despesa: 48000, lucro: 64000 },
          { mes: 'Abr', receita: 118000, despesa: 50000, lucro: 68000 },
          { mes: 'Mai', receita: 125000, despesa: 52000, lucro: 73000 },
          { mes: 'Jun', receita: 132000, despesa: 55000, lucro: 77000 }
        ],
        multasPorCategoria: [
          { categoria: 'Supermercado', quantidade: 45, valor: 180000, cor: '#EF4444' },
          { categoria: 'Posto', quantidade: 32, valor: 120000, cor: '#3B82F6' },
          { categoria: 'Banco', quantidade: 28, valor: 150000, cor: '#10B981' },
          { categoria: 'Farmácia', quantidade: 25, valor: 80000, cor: '#F59E0B' },
          { categoria: 'Restaurante', quantidade: 22, valor: 60000, cor: '#8B5CF6' },
          { categoria: 'Outros', quantidade: 18, valor: 40000, cor: '#EC4899' }
        ],
        pagamentosPorMes: [
          { mes: 'Jan', pagos: 85, pendentes: 15, vencidos: 5 },
          { mes: 'Fev', pagos: 88, pendentes: 12, vencidos: 3 },
          { mes: 'Mar', pagos: 92, pendentes: 8, vencidos: 2 },
          { mes: 'Abr', pagos: 89, pendentes: 11, vencidos: 4 },
          { mes: 'Mai', pagos: 95, pendentes: 5, vencidos: 1 },
          { mes: 'Jun', pagos: 91, pendentes: 9, vencidos: 3 }
        ],
        fluxoCaixa: [
          { dia: 'Seg', entrada: 25000, saida: 8000, saldo: 17000 },
          { dia: 'Ter', entrada: 28000, saida: 8500, saldo: 19500 },
          { dia: 'Qua', entrada: 32000, saida: 9000, saldo: 23000 },
          { dia: 'Qui', entrada: 35000, saida: 9500, saldo: 25500 },
          { dia: 'Sex', entrada: 30000, saida: 10000, saldo: 20000 },
          { dia: 'Sab', entrada: 15000, saida: 5000, saldo: 10000 },
          { dia: 'Dom', entrada: 8000, saida: 3000, saldo: 5000 }
        ]
      };

      const mockTransacoes = [
        { id: 1, tipo: 'Receita', categoria: 'Multa', descricao: 'Multa Supermercado Central', valor: 15000, data: '2024-01-15', status: 'Pago', empresa: 'Supermercado Central', protocolo: '2024-001234' },
        { id: 2, tipo: 'Receita', categoria: 'Multa', descricao: 'Multa Banco Popular', valor: 12000, data: '2024-01-14', status: 'Pendente', empresa: 'Banco Popular', protocolo: '2024-001235' },
        { id: 3, tipo: 'Despesa', categoria: 'Operacional', descricao: 'Material de Escritório', valor: 2500, data: '2024-01-13', status: 'Pago', empresa: 'Fornecedor ABC', protocolo: '2024-001236' },
        { id: 4, tipo: 'Receita', categoria: 'Multa', descricao: 'Multa Posto Combustível', valor: 8000, data: '2024-01-12', status: 'Pago', empresa: 'Posto Combustível ABC', protocolo: '2024-001237' },
        { id: 5, tipo: 'Despesa', categoria: 'Manutenção', descricao: 'Manutenção de Equipamentos', valor: 3500, data: '2024-01-11', status: 'Pendente', empresa: 'Técnico XYZ', protocolo: '2024-001238' }
      ];

      const mockRelatorios = [
        { id: 1, nome: 'Relatório Mensal de Receitas', tipo: 'Mensal', data: '2024-01-31', status: 'Gerado', tamanho: '2.5 MB' },
        { id: 2, nome: 'Análise de Inadimplência', tipo: 'Trimestral', data: '2024-01-15', status: 'Pendente', tamanho: '1.8 MB' },
        { id: 3, nome: 'Fluxo de Caixa Anual', tipo: 'Anual', data: '2024-01-01', status: 'Gerado', tamanho: '3.2 MB' },
        { id: 4, nome: 'Relatório de Multas por Setor', tipo: 'Mensal', data: '2024-01-30', status: 'Gerado', tamanho: '1.5 MB' }
      ];

      setEstatisticas(mockEstatisticas);
      setChartData(mockChartData);
      setTransacoes(mockTransacoes);
      setRelatorios(mockRelatorios);
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares para preparar dados dos gráficos
  const prepararDadosReceitaDespesa = (receitas, despesas) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses.map((mes, index) => {
      const receita = receitas.find(r => r.mes === mes) || { valor: 0 };
      const despesa = despesas.find(d => d.mes === mes) || { valor: 0 };
      return {
        mes,
        receita: receita.valor,
        despesa: despesa.valor,
        lucro: receita.valor - despesa.valor
      };
    });
  };

  const prepararDadosMultasPorCategoria = (multas) => {
    const categorias = {};
    multas.forEach(multa => {
      if (!categorias[multa.categoria]) {
        categorias[multa.categoria] = { quantidade: 0, valor: 0 };
      }
      categorias[multa.categoria].quantidade++;
      categorias[multa.categoria].valor += multa.valor;
    });

    return Object.keys(categorias).map(categoria => ({
      categoria,
      quantidade: categorias[categoria].quantidade,
      valor: categorias[categoria].valor,
      cor: getRandomColor()
    }));
  };

  const prepararDadosPagamentosPorMes = (pagas, pendentes) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    return meses.map(mes => {
      const pagasMes = pagas.filter(p => p.mes === mes).length;
      const pendentesMes = pendentes.filter(p => p.mes === mes).length;
      return {
        mes,
        pagos: pagasMes,
        pendentes: pendentesMes,
        vencidos: Math.floor(Math.random() * 5)
      };
    });
  };

  const getRandomColor = () => {
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleNovaTransacao = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEditarTransacao = (transacao) => {
    setEditingTransaction(transacao);
    setShowForm(true);
  };

  const handleSalvarTransacao = async (dados) => {
    try {
      if (editingTransaction) {
        // Atualizar transação existente
        const updatedTransacoes = transacoes.map(t => 
          t.id === editingTransaction.id ? { ...t, ...dados } : t
        );
        setTransacoes(updatedTransacoes);
      } else {
        // Nova transação
        const novaTransacao = {
          id: Date.now(),
          ...dados,
          data: new Date().toISOString().split('T')[0]
        };
        setTransacoes([novaTransacao, ...transacoes]);
      }
      setShowForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  const handleExcluirTransacao = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        const updatedTransacoes = transacoes.filter(t => t.id !== id);
        setTransacoes(updatedTransacoes);
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
      }
    }
  };

  const handleGerarRelatorio = async (tipo) => {
    try {
      // Simular geração de relatório
      const novoRelatorio = {
        id: Date.now(),
        nome: `Relatório ${tipo} - ${new Date().toLocaleDateString()}`,
        tipo: tipo,
        data: new Date().toISOString().split('T')[0],
        status: 'Gerado',
        tamanho: `${Math.random() * 5 + 1} MB`
      };
      setRelatorios([novoRelatorio, ...relatorios]);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const filteredTransacoes = transacoes.filter(transacao => {
    const matchesSearch = transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.protocolo.includes(searchTerm);
    const matchesStatus = filterStatus === 'todas' || transacao.status === filterStatus;
    const matchesType = filterType === 'todas' || transacao.tipo === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Módulo Financeiro</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestão completa das finanças do PROCON</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleGerarRelatorio('Mensal')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Gerar Relatório
          </button>
          <button
            onClick={handleNovaTransacao}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Receita Total</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {estatisticas.receitaTotal?.toLocaleString()}
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
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Despesa Total</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {estatisticas.despesaTotal?.toLocaleString()}
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
                <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Lucro Total</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    R$ {estatisticas.lucroTotal?.toLocaleString()}
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
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Taxa de Pagamento</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {estatisticas.taxaPagamento}%
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Receita vs Despesa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.receitaDespesa}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="despesa" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Multas por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.multasPorCategoria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ categoria, valor }) => `${categoria}: R$ ${valor.toLocaleString()}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {chartData.multasPorCategoria?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todas">Todos os Status</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
            <option value="Vencido">Vencido</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todas">Todos os Tipos</option>
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
        </div>

        {/* Lista de Transações */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransacoes.map((transacao) => (
                <tr key={transacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {transacao.descricao}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {transacao.empresa} - {transacao.protocolo}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transacao.tipo === 'Receita' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {transacao.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    R$ {transacao.valor.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transacao.status === 'Pago' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : transacao.status === 'Pendente'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {transacao.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(transacao.data).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditarTransacao(transacao)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExcluirTransacao(transacao.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relatórios */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Relatórios Financeiros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {relatorios.map((relatorio) => (
            <div key={relatorio.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">{relatorio.nome}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{relatorio.tipo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{relatorio.data}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    relatorio.status === 'Gerado' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {relatorio.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{relatorio.tamanho}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              <TransacaoForm
                transacao={editingTransaction}
                onSave={handleSalvarTransacao}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Formulário de Transação
const TransacaoForm = ({ transacao, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    descricao: transacao?.descricao || '',
    tipo: transacao?.tipo || 'Receita',
    categoria: transacao?.categoria || '',
    valor: transacao?.valor || '',
    empresa: transacao?.empresa || '',
    protocolo: transacao?.protocolo || '',
    status: transacao?.status || 'Pendente'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      valor: parseFloat(formData.valor)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
        <input
          type="text"
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({...formData, tipo: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
          <input
            type="text"
            value={formData.categoria}
            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor</label>
          <input
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({...formData, valor: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Pendente">Pendente</option>
            <option value="Pago">Pago</option>
            <option value="Vencido">Vencido</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
          <input
            type="text"
            value={formData.empresa}
            onChange={(e) => setFormData({...formData, empresa: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Protocolo</label>
          <input
            type="text"
            value={formData.protocolo}
            onChange={(e) => setFormData({...formData, protocolo: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Salvar
        </button>
      </div>
    </form>
  );
};

export default Financeiro;
