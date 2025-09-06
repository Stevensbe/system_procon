import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import tramitacaoService from '../../services/tramitacaoService';
import { toast } from 'react-hot-toast';

const TramitacaoDashboard = () => {
  const [estatisticas, setEstatisticas] = useState({
    total_tramitacoes: 0,
    pendentes: 0,
    concluidas: 0,
    atrasadas: 0,
    tempo_medio: 0
  });
  const [tramitacoesPendentes, setTramitacoesPendentes] = useState([]);
  const [tramitacoesRecentes, setTramitacoesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [stats, pendentes, recentes] = await Promise.all([
        tramitacaoService.obterEstatisticas(),
        tramitacaoService.listarTramitacoesPendentes(),
        tramitacaoService.listarTramitacoesRecentes()
      ]);

      setEstatisticas(stats);
      setTramitacoesPendentes(pendentes);
      setTramitacoesRecentes(recentes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da tramitação');
    } finally {
      setLoading(false);
    }
  };

  const filtrarTramitacoes = (tramitacoes) => {
    let filtradas = tramitacoes;

    if (filtro !== 'todas') {
      filtradas = filtradas.filter(t => t.status === filtro);
    }

    if (busca) {
      filtradas = filtradas.filter(t => 
        t.protocolo?.numero_protocolo?.includes(busca) ||
        t.protocolo?.assunto?.toLowerCase().includes(busca.toLowerCase()) ||
        t.setor_origem?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        t.setor_destino?.nome?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    return filtradas;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-50';
      case 'ENVIADA': return 'text-blue-600 bg-blue-50';
      case 'RECEBIDA': return 'text-green-600 bg-green-50';
      case 'ATRASADA': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDENTE': return <ClockIcon className="w-4 h-4" />;
      case 'ENVIADA': return <DocumentArrowUpIcon className="w-4 h-4" />;
      case 'RECEBIDA': return <CheckCircleIcon className="w-4 h-4" />;
      case 'ATRASADA': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ArrowPathIcon className="w-4 h-4" />;
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularDiasAtraso = (dataLimite) => {
    const hoje = new Date();
    const limite = new Date(dataLimite);
    const diffTime = hoje - limite;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Tramitação</h1>
              <p className="text-gray-600 mt-2">Gerencie e acompanhe todas as tramitações do sistema</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={carregarDados}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Atualizar
              </button>
              <Link
                to="/tramitacao/nova"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Nova Tramitação
              </Link>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentArrowUpIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.total_tramitacoes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.concluidas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.atrasadas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.tempo_medio} dias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por protocolo, assunto, setor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todas</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="ENVIADA">Enviadas</option>
                <option value="RECEBIDA">Recebidas</option>
                <option value="ATRASADA">Atrasadas</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <FunnelIcon className="w-4 h-4" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tramitações Pendentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Tramitações Pendentes</h2>
              <p className="text-gray-600 mt-1">Documentos aguardando processamento</p>
            </div>
            <div className="p-6">
              {tramitacoesPendentes.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma tramitação pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtrarTramitacoes(tramitacoesPendentes).slice(0, 5).map((tramitacao) => (
                    <div
                      key={tramitacao.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/tramitacao/${tramitacao.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tramitacao.status)}`}>
                            {getStatusIcon(tramitacao.status)}
                            {tramitacao.status}
                          </span>
                          {tramitacao.prazo_limite && calcularDiasAtraso(tramitacao.prazo_limite) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              {calcularDiasAtraso(tramitacao.prazo_limite)} dias atrasado
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatarData(tramitacao.data_tramitacao)}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-1">
                        Protocolo: {tramitacao.protocolo?.numero_protocolo || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {tramitacao.protocolo?.assunto || 'Assunto não informado'}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {tramitacao.setor_origem?.nome} → {tramitacao.setor_destino?.nome}
                        </span>
                        <span>
                          Por: {tramitacao.usuario?.nome || 'Sistema'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {tramitacoesPendentes.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/tramitacao/pendentes"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todas ({tramitacoesPendentes.length})
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Tramitações Recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Tramitações Recentes</h2>
              <p className="text-gray-600 mt-1">Últimas movimentações</p>
            </div>
            <div className="p-6">
              {tramitacoesRecentes.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentArrowDownIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma tramitação recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtrarTramitacoes(tramitacoesRecentes).slice(0, 5).map((tramitacao) => (
                    <div
                      key={tramitacao.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/tramitacao/${tramitacao.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tramitacao.status)}`}>
                            {getStatusIcon(tramitacao.status)}
                            {tramitacao.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatarData(tramitacao.data_tramitacao)}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-1">
                        Protocolo: {tramitacao.protocolo?.numero_protocolo || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {tramitacao.protocolo?.assunto || 'Assunto não informado'}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {tramitacao.setor_origem?.nome} → {tramitacao.setor_destino?.nome}
                        </span>
                        <span>
                          Por: {tramitacao.usuario?.nome || 'Sistema'}
                        </span>
                      </div>
                      
                      {tramitacao.observacoes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                          {tramitacao.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {tramitacoesRecentes.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/tramitacao/historico"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver histórico completo
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/tramitacao/nova"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <PlusIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Nova Tramitação</h3>
                <p className="text-sm text-gray-600">Criar nova tramitação</p>
              </div>
            </Link>
            
            <Link
              to="/tramitacao/pendentes"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Pendentes</h3>
                <p className="text-sm text-gray-600">Ver tramitações pendentes</p>
              </div>
            </Link>
            
            <Link
              to="/tramitacao/relatorios"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Relatórios</h3>
                <p className="text-sm text-gray-600">Gerar relatórios</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TramitacaoDashboard;
