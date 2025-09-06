import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  ScaleIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CobrancaPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmAberto: 150000.00,
    recebidoHoje: 8500.00,
    boletosVencidos: 23,
    taxaPagamento: 78.5,
    totalBoletos: 145,
    boletosAtivos: 89,
    boletosPagos: 112,
    valorMedio: 1250.00
  });

  const [boletosPendentes, setBoletosPendentes] = useState([
    {
      id: 1,
      numero: 'BOL-2024-001',
      devedor: 'João Silva Santos',
      documento: '123.456.789-00',
      valor: 1500.00,
      vencimento: '2024-03-25',
      status: 'Vencido',
      diasVencido: 5,
      tipo: 'Multa'
    },
    {
      id: 2,
      numero: 'BOL-2024-002',
      devedor: 'Maria Fernanda Costa',
      documento: '987.654.321-00',
      valor: 850.00,
      vencimento: '2024-03-28',
      status: 'Pendente',
      diasVencido: 0,
      tipo: 'Taxa'
    },
    {
      id: 3,
      numero: 'BOL-2024-003',
      devedor: 'Empresa ABC Ltda',
      documento: '12.345.678/0001-90',
      valor: 3200.00,
      vencimento: '2024-03-20',
      status: 'Vencido',
      diasVencido: 10,
      tipo: 'Multa'
    }
  ]);

  const [recentPayments, setRecentPayments] = useState([
    {
      id: 1,
      numeroBoleto: 'BOL-2024-010',
      devedor: 'Carlos Silva',
      valor: 950.00,
      dataPagamento: '2024-03-29',
      formaPagamento: 'PIX',
      status: 'Confirmado'
    },
    {
      id: 2,
      numeroBoleto: 'BOL-2024-009',
      devedor: 'Ana Paula Costa',
      valor: 1200.00,
      dataPagamento: '2024-03-29',
      formaPagamento: 'Boleto Bancário',
      status: 'Confirmado'
    }
  ]);

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pago': return 'bg-green-100 text-green-800';
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'multa': return 'bg-red-100 text-red-800';
      case 'taxa': return 'bg-blue-100 text-blue-800';
      case 'juros': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewBoleto = (id) => {
    navigate(`/cobranca/boletos/${id}`);
  };

  const handleNewBoleto = () => {
    navigate('/cobranca/boletos/novo');
  };

  const handleViewDashboard = () => {
    navigate('/cobranca/dashboard');
  };

  const handleViewRemessas = () => {
    navigate('/cobranca/remessas');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            Cobrança
          </h1>
          <p className="text-gray-600 mt-2">Gerencie cobranças e pagamentos do PROCON</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleViewDashboard}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Dashboard
          </button>
          <button
            onClick={handleNewBoleto}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Novo Boleto
          </button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total em Aberto</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEmAberto)}</p>
              <p className="text-xs text-gray-500">{stats.totalBoletos} boletos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recebido Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.recebidoHoje)}</p>
              <p className="text-xs text-gray-500">Últimas 24h</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Boletos Vencidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.boletosVencidos}</p>
              <p className="text-xs text-gray-500">Necessitam atenção</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Pagamento</p>
              <p className="text-2xl font-bold text-gray-900">{stats.taxaPagamento}%</p>
              <p className="text-xs text-gray-500">Média mensal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu de Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          onClick={() => navigate('/cobranca/boletos')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Boletos</h3>
              <p className="text-gray-600 text-sm">Gerenciar todos os boletos</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.boletosAtivos}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div
          onClick={() => navigate('/cobranca/dashboard')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Dashboard</h3>
              <p className="text-gray-600 text-sm">Análises e relatórios</p>
              <p className="text-sm font-medium text-green-600 mt-2">Visualizar dados</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={handleViewRemessas}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Remessas</h3>
              <p className="text-gray-600 text-sm">Arquivos bancários</p>
              <p className="text-sm font-medium text-purple-600 mt-2">Gerenciar remessas</p>
            </div>
            <DocumentArrowDownIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Relatórios</h3>
              <p className="text-gray-600 text-sm">Análise de cobrança</p>
              <p className="text-sm font-medium text-orange-600 mt-2">Gerar relatórios</p>
            </div>
            <ScaleIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Boletos Pendentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Boletos Pendentes de Atenção</h3>
            <button
              onClick={() => navigate('/cobranca/boletos')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Ver todos
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boleto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boletosPendentes.map((boleto) => (
                <tr key={boleto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{boleto.numero}</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(boleto.tipo)}`}>
                      {boleto.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{boleto.devedor}</div>
                    <div className="text-sm text-gray-500">{boleto.documento}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(boleto.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(boleto.vencimento)}
                    {boleto.diasVencido > 0 && (
                      <div className="text-xs text-red-600">
                        {boleto.diasVencido} dias vencido
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(boleto.status)}`}>
                      {boleto.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewBoleto(boleto.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Visualizar"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagamentos Recentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pagamentos Recentes</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCardIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.numeroBoleto}</p>
                    <p className="text-sm text-gray-600">{payment.devedor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.valor)}</p>
                  <p className="text-xs text-gray-500">
                    {payment.formaPagamento} • {formatDate(payment.dataPagamento)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleNewBoleto}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <PlusIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Criar Novo Boleto</span>
          </button>

          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <DocumentArrowDownIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Gerar Remessa</span>
          </button>

          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <BanknotesIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Processar Retorno</span>
          </button>

          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <ChartBarIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Relatório Mensal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CobrancaPage;