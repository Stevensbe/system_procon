import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BellIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import notificacoesService from '../../services/notificacoesService';
import { toast } from 'react-hot-toast';

const NotificacoesDashboard = () => {
  const [estatisticas, setEstatisticas] = useState({
    total_notificacoes: 0,
    nao_lidas: 0,
    enviadas: 0,
    falhas: 0,
    taxa_sucesso: 0
  });
  const [notificacoesRecentes, setNotificacoesRecentes] = useState([]);
  const [configuracoes, setConfiguracoes] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [stats, recentes, config] = await Promise.all([
        notificacoesService.obterEstatisticas(),
        notificacoesService.listarNotificacoesRecentes(),
        notificacoesService.obterConfiguracoes()
      ]);

      setEstatisticas(stats);
      setNotificacoesRecentes(recentes);
      setConfiguracoes(config);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados das notificações');
    } finally {
      setLoading(false);
    }
  };

  const filtrarNotificacoes = (notificacoes) => {
    let filtradas = notificacoes;

    if (filtro !== 'todas') {
      filtradas = filtradas.filter(n => n.tipo === filtro);
    }

    if (busca) {
      filtradas = filtradas.filter(n => 
        n.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        n.mensagem?.toLowerCase().includes(busca.toLowerCase()) ||
        n.destinatario?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    return filtradas;
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'EMAIL': return 'text-blue-600 bg-blue-50';
      case 'SMS': return 'text-green-600 bg-green-50';
      case 'PUSH': return 'text-purple-600 bg-purple-50';
      case 'SISTEMA': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'EMAIL': return <EnvelopeIcon className="w-4 h-4" />;
      case 'SMS': return <DevicePhoneMobileIcon className="w-4 h-4" />;
      case 'PUSH': return <BellIcon className="w-4 h-4" />;
      case 'SISTEMA': return <ChatBubbleLeftRightIcon className="w-4 h-4" />;
      default: return <BellIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ENVIADA': return 'text-green-600 bg-green-50';
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-50';
      case 'FALHA': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ENVIADA': return <CheckCircleIcon className="w-4 h-4" />;
      case 'PENDENTE': return <ClockIcon className="w-4 h-4" />;
      case 'FALHA': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
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

  const marcarComoLida = async (id) => {
    try {
      await notificacoesService.marcarComoLida(id);
      toast.success('Notificação marcada como lida');
      carregarDados();
    } catch (error) {
      toast.error('Erro ao marcar como lida');
    }
  };

  const excluirNotificacao = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        await notificacoesService.excluirNotificacao(id);
        toast.success('Notificação excluída com sucesso');
        carregarDados();
      } catch (error) {
        toast.error('Erro ao excluir notificação');
      }
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Notificações</h1>
              <p className="text-gray-600 mt-2">Gerencie e acompanhe todas as notificações do sistema</p>
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
                to="/notificacoes/configuracoes"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Configurações
              </Link>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BellIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.total_notificacoes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Não Lidas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.nao_lidas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.enviadas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Falhas</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.falhas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.taxa_sucesso}%</p>
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
                  placeholder="Buscar por título, mensagem, destinatário..."
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
                <option value="todas">Todos os tipos</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="PUSH">Push</option>
                <option value="SISTEMA">Sistema</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <FunnelIcon className="w-4 h-4" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notificações Recentes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Notificações Recentes</h2>
              <p className="text-gray-600 mt-1">Últimas notificações do sistema</p>
            </div>
            <div className="p-6">
              {notificacoesRecentes.length === 0 ? (
                <div className="text-center py-8">
                  <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma notificação recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtrarNotificacoes(notificacoesRecentes).slice(0, 5).map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors ${!notificacao.lida ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(notificacao.tipo)}`}>
                            {getTipoIcon(notificacao.tipo)}
                            {notificacao.tipo}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notificacao.status)}`}>
                            {getStatusIcon(notificacao.status)}
                            {notificacao.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatarData(notificacao.data_criacao)}
                        </span>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-1">
                        {notificacao.titulo}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {notificacao.mensagem}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Para: {notificacao.destinatario}
                        </span>
                        <div className="flex gap-2">
                          {!notificacao.lida && (
                            <button
                              onClick={() => marcarComoLida(notificacao.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => excluirNotificacao(notificacao.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {notificacoesRecentes.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/notificacoes/historico"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver histórico completo
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Configurações Rápidas */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Configurações Rápidas</h2>
              <p className="text-gray-600 mt-1">Preferências de notificação</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Notificações por Email</h3>
                    <p className="text-sm text-gray-600">Receber notificações via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracoes.email_habilitado}
                      onChange={(e) => {
                        setConfiguracoes(prev => ({
                          ...prev,
                          email_habilitado: e.target.checked
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Notificações SMS</h3>
                    <p className="text-sm text-gray-600">Receber notificações via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracoes.sms_habilitado}
                      onChange={(e) => {
                        setConfiguracoes(prev => ({
                          ...prev,
                          sms_habilitado: e.target.checked
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Notificações Push</h3>
                    <p className="text-sm text-gray-600">Receber notificações push</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracoes.push_habilitado}
                      onChange={(e) => {
                        setConfiguracoes(prev => ({
                          ...prev,
                          push_habilitado: e.target.checked
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Notificações do Sistema</h3>
                    <p className="text-sm text-gray-600">Receber notificações do sistema</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracoes.sistema_habilitado}
                      onChange={(e) => {
                        setConfiguracoes(prev => ({
                          ...prev,
                          sistema_habilitado: e.target.checked
                        }));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={async () => {
                    try {
                      await notificacoesService.salvarConfiguracoes(configuracoes);
                      toast.success('Configurações salvas com sucesso');
                    } catch (error) {
                      toast.error('Erro ao salvar configurações');
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/notificacoes/nova"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <PlusIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Nova Notificação</h3>
                <p className="text-sm text-gray-600">Enviar notificação</p>
              </div>
            </Link>
            
            <Link
              to="/notificacoes/historico"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Histórico</h3>
                <p className="text-sm text-gray-600">Ver histórico completo</p>
              </div>
            </Link>
            
            <Link
              to="/notificacoes/templates"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <Cog6ToothIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Templates</h3>
                <p className="text-sm text-gray-600">Gerenciar templates</p>
              </div>
            </Link>
            
            <Link
              to="/notificacoes/relatorios"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
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

export default NotificacoesDashboard;
