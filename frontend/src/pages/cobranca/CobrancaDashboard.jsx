import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import { cobrancaService } from '../../services/cobrancaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import KPICard from '../../components/common/KPICard';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CobrancaDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [recentBoletos, setRecentBoletos] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentRemessas, setRecentRemessas] = useState([]);
  const [boletosVencidos, setBoletosVencidos] = useState([]);
  const [boletosPorStatus, setBoletosPorStatus] = useState([]);
  const [paymentsPorMes, setPaymentsPorMes] = useState([]);
  const [remessasPorStatus, setRemessasPorStatus] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do dashboard
      const [
        stats,
        boletosRecentes,
        pagamentosRecentes,
        remessasRecentes,
        vencidos,
        statusBoletos,
        pagamentosMes,
        statusRemessas
      ] = await Promise.all([
        cobrancaService.getEstatisticas(),
        cobrancaService.getBoletosRecentes(),
        cobrancaService.getPagamentosRecentes(),
        cobrancaService.getRemessasRecentes(),
        cobrancaService.getBoletosVencidos(),
        cobrancaService.getBoletosPorStatus(),
        cobrancaService.getPagamentosPorMes(),
        cobrancaService.getRemessasPorStatus()
      ]);

      setStatistics(stats);
      setRecentBoletos(Array.isArray(boletosRecentes) ? boletosRecentes : []);
      setRecentPayments(Array.isArray(pagamentosRecentes) ? pagamentosRecentes : []);
      setRecentRemessas(Array.isArray(remessasRecentes) ? remessasRecentes : []);
      setBoletosVencidos(Array.isArray(vencidos) ? vencidos : []);
      setBoletosPorStatus(Array.isArray(statusBoletos) ? statusBoletos : []);
      setPaymentsPorMes(Array.isArray(pagamentosMes) ? pagamentosMes : []);
      setRemessasPorStatus(Array.isArray(statusRemessas) ? statusRemessas : []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      
      // Verificar se é erro de autenticação
      if (error.response?.status === 401) {
        console.error('Erro de autenticação. Faça login novamente.');
      }
      
      // Garantir que as variáveis sejam arrays vazios em caso de erro
      setRecentBoletos([]);
      setRecentPayments([]);
      setRecentRemessas([]);
      setBoletosVencidos([]);
      setBoletosPorStatus([]);
      setPaymentsPorMes([]);
      setRemessasPorStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pago': return 'text-green-600 bg-green-100';
      case 'vencido': return 'text-red-600 bg-red-100';
      case 'pendente': return 'text-yellow-600 bg-yellow-100';
      case 'cancelado': return 'text-gray-600 bg-gray-100';
      case 'processado': return 'text-blue-600 bg-blue-100';
      case 'erro': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'multa': return 'text-red-600 bg-red-100';
      case 'taxa': return 'text-blue-600 bg-blue-100';
      case 'juros': return 'text-orange-600 bg-orange-100';
      case 'correção': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Cobrança</h1>
          <p className="text-gray-600">Gestão avançada de boletos, pagamentos e remessas</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-primary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Novo Boleto
          </button>
          <button className="btn-secondary">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Gerar Remessa
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total em Aberto"
          value={formatCurrency(statistics.totalEmAberto || 0)}
          icon={CurrencyDollarIcon}
          color="blue"
          change={statistics.variacaoEmAberto || 0}
          changeType="percentage"
          description="Valor total de boletos pendentes"
        />
        <KPICard
          title="Recebido Hoje"
          value={formatCurrency(statistics.recebidoHoje || 0)}
          icon={CreditCardIcon}
          color="green"
          change={statistics.variacaoRecebido || 0}
          changeType="percentage"
          description="Pagamentos processados hoje"
        />
        <KPICard
          title="Boletos Vencidos"
          value={statistics.boletosVencidos || 0}
          icon={ExclamationTriangleIcon}
          color="red"
          change={statistics.variacaoVencidos || 0}
          changeType="number"
          description="Boletos com prazo expirado"
        />
        <KPICard
          title="Taxa de Pagamento"
          value={`${statistics.taxaPagamento || 0}%`}
          icon={CheckCircleIcon}
          color="green"
          change={statistics.variacaoTaxa || 0}
          changeType="percentage"
          description="Percentual de boletos pagos"
        />
      </div>

      {/* Gráficos e Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Boletos por Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Boletos por Status</h3>
          <div className="space-y-3">
            {boletosPorStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status).split(' ')[1]}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{item.quantidade}</span>
                  <span className="text-sm text-gray-500">({item.percentual}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagamentos por Mês */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagamentos por Mês</h3>
          <div className="space-y-3">
            {paymentsPorMes.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.mes}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{formatCurrency(item.valor)}</span>
                  <span className="text-sm text-gray-500">({item.quantidade} pagamentos)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Boletos Vencidos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Boletos Vencidos</h3>
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
                  Dias Vencido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(boletosVencidos) && boletosVencidos.slice(0, 5).map((boleto) => (
                <tr key={boleto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{boleto.numero}</div>
                    <div className="text-sm text-gray-500">{boleto.tipo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{boleto.devedor}</div>
                    <div className="text-sm text-gray-500">{boleto.documento}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(boleto.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(boleto.vencimento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {boleto.diasVencido} dias
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Boletos Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Boletos Recentes</h3>
          </div>
          <div className="p-6 space-y-4">
            {Array.isArray(recentBoletos) && recentBoletos.slice(0, 5).map((boleto) => (
              <div key={boleto.id} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(boleto.status).split(' ')[1]}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {boleto.numero}
                  </p>
                  <p className="text-sm text-gray-500">
                    {boleto.devedor} • {formatCurrency(boleto.valor)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(boleto.status)}`}>
                  {boleto.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pagamentos Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Pagamentos Recentes</h3>
          </div>
          <div className="p-6 space-y-4">
            {Array.isArray(recentPayments) && recentPayments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {payment.numeroBoleto}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.formaPagamento} • {formatCurrency(payment.valor)}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(payment.dataPagamento)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Remessas Recentes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Remessas Recentes</h3>
          </div>
          <div className="p-6 space-y-4">
            {Array.isArray(recentRemessas) && recentRemessas.slice(0, 5).map((remessa) => (
              <div key={remessa.id} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(remessa.status).split(' ')[1]}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {remessa.numero}
                  </p>
                  <p className="text-sm text-gray-500">
                    {remessa.banco} • {remessa.quantidadeBoletos} boletos
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(remessa.status)}`}>
                  {remessa.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <PlusIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Novo Boleto</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <DocumentArrowDownIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Gerar Remessa</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <BanknotesIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Processar Pagamentos</span>
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <ScaleIcon className="w-6 h-6 text-gray-600 mr-3" />
            <span className="text-sm font-medium text-gray-700">Relatórios</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CobrancaDashboard;
