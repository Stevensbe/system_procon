import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';
import { formatDate, formatTime } from '../../utils/formatters';

const AgendaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    fetchEventoDetail();
  }, [id]);

  const fetchEventoDetail = async () => {
    try {
      setLoading(true);
      // Simular dados do evento
      const mockData = {
        id: id,
        codigo_evento: `EVT-${id}-2024`,
        titulo: 'Reunião Mensal de Fiscalização',
        descricao: 'Reunião mensal para alinhamento das atividades de fiscalização, apresentação dos resultados do mês anterior e planejamento das ações para o próximo mês. Discussão sobre novos procedimentos e melhorias nos processos.',
        tipo_evento: 'Reunião',
        data_evento: '2024-03-15',
        hora_inicio: '14:00',
        hora_fim: '16:00',
        duracao: '2h',
        local: 'Auditório Principal',
        endereco: 'Rua das Flores, 123 - Sala de Reuniões A - Centro',
        organizador: 'Maria Silva',
        organizador_contato: 'maria.silva@procon.gov.br',
        status: 'Confirmado',
        prioridade: 'Alta',
        observacoes: 'Todos os coordenadores devem trazer relatórios mensais. Apresentação será projetada.',
        recursos_necessarios: 'Projetor, notebook, flip chart, coffee break',
        publico_alvo: 'Equipe de Fiscalização e Coordenadores',
        capacidade_maxima: '15',
        participantes_confirmados: 12,
        requer_confirmacao: true,
        evento_publico: false,
        permite_convidados: true,
        participantes: [
          { 
            id: 1, 
            nome: 'João Santos', 
            email: 'joao@procon.gov.br', 
            cargo: 'Coordenador de Fiscalização', 
            obrigatorio: true,
            status_confirmacao: 'Confirmado',
            data_confirmacao: '2024-03-01'
          },
          { 
            id: 2, 
            nome: 'Ana Paula Costa', 
            email: 'ana@procon.gov.br', 
            cargo: 'Fiscal Sênior', 
            obrigatorio: true,
            status_confirmacao: 'Confirmado',
            data_confirmacao: '2024-03-02'
          },
          { 
            id: 3, 
            nome: 'Carlos Silva', 
            email: 'carlos@procon.gov.br', 
            cargo: 'Analista', 
            obrigatorio: false,
            status_confirmacao: 'Pendente',
            data_confirmacao: null
          },
          { 
            id: 4, 
            nome: 'Fernanda Oliveira', 
            email: 'fernanda@procon.gov.br', 
            cargo: 'Coordenadora Jurídica', 
            obrigatorio: true,
            status_confirmacao: 'Rejeitado',
            data_confirmacao: '2024-03-03',
            motivo_rejeicao: 'Conflito de agenda'
          }
        ],
        lembretes: [
          { 
            id: 1, 
            tipo: 'Email', 
            tempo_antecedencia: '60', 
            unidade: 'minutos',
            enviado: true,
            data_envio: '2024-03-15T13:00:00'
          },
          { 
            id: 2, 
            tipo: 'SMS', 
            tempo_antecedencia: '30', 
            unidade: 'minutos',
            enviado: false,
            data_envio: null
          }
        ],
        historico: [
          { data: '2024-02-15', acao: 'Evento criado', usuario: 'Maria Silva', observacoes: 'Evento programado para março' },
          { data: '2024-02-20', acao: 'Participantes adicionados', usuario: 'Maria Silva', observacoes: 'Lista de participantes definida' },
          { data: '2024-03-01', acao: 'Confirmação enviada', usuario: 'Sistema', observacoes: 'Convites enviados por email' },
          { data: '2024-03-01', acao: 'João Santos confirmou presença', usuario: 'João Santos', observacoes: 'Confirmação via sistema' },
          { data: '2024-03-02', acao: 'Ana Paula confirmou presença', usuario: 'Ana Paula Costa', observacoes: 'Confirmação via email' },
          { data: '2024-03-03', acao: 'Fernanda rejeitou convite', usuario: 'Fernanda Oliveira', observacoes: 'Conflito de agenda' }
        ],
        agenda_detalhada: [
          { horario: '14:00', item: 'Abertura e boas-vindas', responsavel: 'Maria Silva', duracao: '10min' },
          { horario: '14:10', item: 'Relatório mensal de fiscalizações', responsavel: 'João Santos', duracao: '30min' },
          { horario: '14:40', item: 'Apresentação de casos especiais', responsavel: 'Ana Paula', duracao: '25min' },
          { horario: '15:05', item: 'Coffee break', responsavel: '-', duracao: '15min' },
          { horario: '15:20', item: 'Novos procedimentos e melhorias', responsavel: 'Maria Silva', duracao: '25min' },
          { horario: '15:45', item: 'Planejamento próximo mês', responsavel: 'Todos', duracao: '15min' }
        ],
        metricas: {
          taxa_confirmacao: 75, // 3 confirmados de 4
          participantes_obrigatorios: 3,
          participantes_opcionais: 1,
          lembretes_enviados: 1,
          lembretes_pendentes: 1
        }
      };

      setEvento(mockData);
    } catch (error) {
      showNotification('Erro ao carregar dados do evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Agendado': 'bg-blue-100 text-blue-800',
      'Confirmado': 'bg-green-100 text-green-800',
      'Em Andamento': 'bg-yellow-100 text-yellow-800',
      'Concluído': 'bg-gray-100 text-gray-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'Adiado': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadeColor = (prioridade) => {
    const colors = {
      'Urgente': 'bg-red-500 text-white',
      'Alta': 'bg-red-100 text-red-800',
      'Média': 'bg-yellow-100 text-yellow-800',
      'Baixa': 'bg-green-100 text-green-800'
    };
    return colors[prioridade] || 'bg-gray-100 text-gray-800';
  };

  const getConfirmacaoColor = (status) => {
    const colors = {
      'Confirmado': 'bg-green-100 text-green-800',
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'Rejeitado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = () => {
    navigate(`/agenda/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        showNotification('Evento excluído com sucesso', 'success');
        navigate('/agenda');
      } catch (error) {
        showNotification('Erro ao excluir evento', 'error');
      }
    }
  };

  const handleEnviarLembrete = async (lembreteId) => {
    try {
      showNotification('Lembrete enviado com sucesso', 'success');
      // Atualizar estado local
      setEvento(prev => ({
        ...prev,
        lembretes: prev.lembretes.map(l => 
          l.id === lembreteId ? { ...l, enviado: true, data_envio: new Date().toISOString() } : l
        )
      }));
    } catch (error) {
      showNotification('Erro ao enviar lembrete', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!evento) return <div className="text-center text-red-600">Evento não encontrado</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/agenda')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {evento.titulo}
              </h1>
              <p className="text-gray-600">{evento.codigo_evento} - {evento.tipo_evento}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(evento.status)}`}>
              {evento.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(evento.prioridade)}`}>
              {evento.prioridade}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg"
                title="Editar"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                title="Excluir"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmações</p>
              <p className="text-2xl font-bold text-gray-900">{evento.metricas.taxa_confirmacao}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Participantes</p>
              <p className="text-2xl font-bold text-gray-900">{evento.participantes_confirmados}/{evento.capacidade_maxima}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lembretes</p>
              <p className="text-2xl font-bold text-gray-900">{evento.metricas.lembretes_enviados}/{evento.lembretes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Duração</p>
              <p className="text-2xl font-bold text-gray-900">{evento.duracao}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dados', name: 'Dados Gerais', icon: DocumentTextIcon },
            { id: 'participantes', name: 'Participantes', icon: UserGroupIcon },
            { id: 'agenda', name: 'Agenda Detalhada', icon: ClockIcon },
            { id: 'lembretes', name: 'Lembretes', icon: BellIcon },
            { id: 'historico', name: 'Histórico', icon: CalendarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`mr-2 h-5 w-5 ${
                activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Básicas */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo de Evento</label>
                  <p className="mt-1 text-sm text-gray-900">{evento.tipo_evento}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Organizador</label>
                  <div className="mt-1 flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm text-gray-900">{evento.organizador}</span>
                      <p className="text-xs text-gray-500">{evento.organizador_contato}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Público Alvo</label>
                  <p className="mt-1 text-sm text-gray-900">{evento.publico_alvo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Capacidade</label>
                  <p className="mt-1 text-sm text-gray-900">{evento.capacidade_maxima} pessoas</p>
                </div>
              </div>
            </div>

            {/* Data e Local */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data e Local</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data</label>
                  <div className="mt-1 flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{formatDate(evento.data_evento)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Horário</label>
                  <div className="mt-1 flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{evento.hora_inicio} às {evento.hora_fim}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Local</label>
                  <div className="mt-1 flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm text-gray-900">{evento.local}</span>
                      <p className="text-xs text-gray-500">{evento.endereco}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição e Recursos */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes do Evento</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Descrição</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg leading-relaxed">{evento.descricao}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Recursos Necessários</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{evento.recursos_necessarios}</p>
                </div>
                {evento.observacoes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Observações</label>
                    <p className="mt-1 text-sm text-gray-900 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">{evento.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Configurações */}
            <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className={`h-5 w-5 ${evento.requer_confirmacao ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Requer confirmação</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className={`h-5 w-5 ${evento.evento_publico ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Evento público</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className={`h-5 w-5 ${evento.permite_convidados ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-sm text-gray-700">Permite convidados</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participantes' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Lista de Participantes</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {evento.participantes.map((participante) => (
                  <div key={participante.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <UserIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{participante.nome}</h4>
                          <p className="text-sm text-gray-600">{participante.cargo}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1">
                              <EnvelopeIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{participante.email}</span>
                            </div>
                            {participante.obrigatorio && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                Obrigatório
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfirmacaoColor(participante.status_confirmacao)}`}>
                          {participante.status_confirmacao}
                        </span>
                        {participante.data_confirmacao && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(participante.data_confirmacao)}
                          </p>
                        )}
                        {participante.motivo_rejeicao && (
                          <p className="text-xs text-red-600 mt-1">
                            {participante.motivo_rejeicao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Agenda Detalhada</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {evento.agenda_detalhada.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-16 text-right">
                      <span className="text-sm font-medium text-gray-900">{item.horario}</span>
                      <p className="text-xs text-gray-500">{item.duracao}</p>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.item}</h4>
                      {item.responsavel !== '-' && (
                        <p className="text-sm text-gray-600">Responsável: {item.responsavel}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lembretes' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Lembretes Configurados</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {evento.lembretes.map((lembrete) => (
                  <div key={lembrete.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BellIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {lembrete.tipo} - {lembrete.tempo_antecedencia} {lembrete.unidade} antes
                          </h4>
                          {lembrete.enviado ? (
                            <p className="text-sm text-green-600">
                              Enviado em {formatDate(lembrete.data_envio)} às {formatTime(lembrete.data_envio)}
                            </p>
                          ) : (
                            <p className="text-sm text-yellow-600">Aguardando envio</p>
                          )}
                        </div>
                      </div>
                      {!lembrete.enviado && (
                        <button
                          onClick={() => handleEnviarLembrete(lembrete.id)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          Enviar Agora
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Histórico do Evento</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {evento.historico.map((item, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== evento.historico.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                              <CalendarIcon className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{item.acao}</p>
                              <p className="text-sm text-gray-500">por {item.usuario}</p>
                              {item.observacoes && (
                                <p className="text-sm text-gray-600 mt-1">{item.observacoes}</p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(item.data)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaDetail;