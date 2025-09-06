import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  DocumentTextIcon,
  BellIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const AgendaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo_evento: 'Reunião',
    data_evento: '',
    hora_inicio: '',
    hora_fim: '',
    local: '',
    endereco: '',
    organizador: '',
    status: 'Agendado',
    prioridade: 'Média',
    observacoes: '',
    participantes: [
      { id: Date.now(), nome: '', email: '', cargo: '', obrigatorio: true }
    ],
    lembretes: [
      { id: Date.now(), tipo: 'Email', tempo_antecedencia: '60', unidade: 'minutos' }
    ],
    recursos_necessarios: '',
    publico_alvo: '',
    capacidade_maxima: '',
    requer_confirmacao: false,
    evento_publico: false,
    permite_convidados: false
  });

  useEffect(() => {
    if (id) {
      fetchAgenda();
    }
  }, [id]);

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      // Simular carregamento de dados
      if (id) {
        const mockData = {
          titulo: 'Reunião Mensal de Fiscalização',
          descricao: 'Reunião mensal para alinhamento das atividades de fiscalização e apresentação dos resultados do mês anterior.',
          tipo_evento: 'Reunião',
          data_evento: '2024-03-15',
          hora_inicio: '14:00',
          hora_fim: '16:00',
          local: 'Auditório Principal',
          endereco: 'Rua das Flores, 123 - Sala de Reuniões A',
          organizador: 'Maria Silva',
          status: 'Agendado',
          prioridade: 'Alta',
          observacoes: 'Todos os coordenadores devem trazer relatórios mensais',
          participantes: [
            { id: 1, nome: 'João Santos', email: 'joao@procon.gov.br', cargo: 'Coordenador', obrigatorio: true },
            { id: 2, nome: 'Ana Paula', email: 'ana@procon.gov.br', cargo: 'Fiscal', obrigatorio: true }
          ],
          lembretes: [
            { id: 1, tipo: 'Email', tempo_antecedencia: '60', unidade: 'minutos' },
            { id: 2, tipo: 'SMS', tempo_antecedencia: '30', unidade: 'minutos' }
          ],
          recursos_necessarios: 'Projetor, notebook, flip chart',
          publico_alvo: 'Equipe de Fiscalização',
          capacidade_maxima: '15',
          requer_confirmacao: true,
          evento_publico: false,
          permite_convidados: true
        };
        setFormData(mockData);
      }
    } catch (error) {
      showNotification('Erro ao carregar dados da agenda', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addParticipante = () => {
    const newParticipante = {
      id: Date.now(),
      nome: '',
      email: '',
      cargo: '',
      obrigatorio: false
    };
    setFormData(prev => ({
      ...prev,
      participantes: [...prev.participantes, newParticipante]
    }));
  };

  const removeParticipante = (participanteId) => {
    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes.filter(p => p.id !== participanteId)
    }));
  };

  const updateParticipante = (participanteId, field, value) => {
    setFormData(prev => ({
      ...prev,
      participantes: prev.participantes.map(p => 
        p.id === participanteId ? { ...p, [field]: value } : p
      )
    }));
  };

  const addLembrete = () => {
    const newLembrete = {
      id: Date.now(),
      tipo: 'Email',
      tempo_antecedencia: '30',
      unidade: 'minutos'
    };
    setFormData(prev => ({
      ...prev,
      lembretes: [...prev.lembretes, newLembrete]
    }));
  };

  const removeLembrete = (lembreteId) => {
    setFormData(prev => ({
      ...prev,
      lembretes: prev.lembretes.filter(l => l.id !== lembreteId)
    }));
  };

  const updateLembrete = (lembreteId, field, value) => {
    setFormData(prev => ({
      ...prev,
      lembretes: prev.lembretes.map(l => 
        l.id === lembreteId ? { ...l, [field]: value } : l
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data_evento || !formData.hora_inicio) {
      showNotification('Preencha os campos obrigatórios', 'error');
      return;
    }

    // Validar horários
    if (formData.hora_fim && formData.hora_inicio >= formData.hora_fim) {
      showNotification('Horário de início deve ser anterior ao horário de fim', 'error');
      return;
    }

    try {
      setSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification(
        id ? 'Evento atualizado com sucesso' : 'Evento criado com sucesso', 
        'success'
      );
      navigate('/agenda');
    } catch (error) {
      showNotification('Erro ao salvar evento', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {id ? 'Editar Evento' : 'Novo Evento'}
              </h1>
              <p className="text-gray-600">Preencha os dados do evento da agenda</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Informações Básicas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Evento *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                placeholder="Ex: Reunião Mensal de Fiscalização"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva o objetivo e conteúdo do evento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento
              </label>
              <select
                name="tipo_evento"
                value={formData.tipo_evento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Reunião">Reunião</option>
                <option value="Audiência Pública">Audiência Pública</option>
                <option value="Palestra">Palestra</option>
                <option value="Workshop">Workshop</option>
                <option value="Treinamento">Treinamento</option>
                <option value="Evento Especial">Evento Especial</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organizador
              </label>
              <input
                type="text"
                name="organizador"
                value={formData.organizador}
                onChange={handleChange}
                placeholder="Nome do organizador"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Agendado">Agendado</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Adiado">Adiado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data e Hora */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Data e Horário
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Evento *
              </label>
              <input
                type="date"
                name="data_evento"
                value={formData.data_evento}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário de Início *
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={formData.hora_inicio}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário de Fim
              </label>
              <input
                type="time"
                name="hora_fim"
                value={formData.hora_fim}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Local */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Local do Evento
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local
              </label>
              <input
                type="text"
                name="local"
                value={formData.local}
                onChange={handleChange}
                placeholder="Ex: Auditório Principal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacidade Máxima
              </label>
              <input
                type="number"
                name="capacidade_maxima"
                value={formData.capacidade_maxima}
                onChange={handleChange}
                placeholder="Número de participantes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Completo
              </label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                placeholder="Endereço completo do local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Participantes
            </h3>
            <button
              type="button"
              onClick={addParticipante}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {formData.participantes.map((participante, index) => (
              <div key={participante.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Participante #{index + 1}</span>
                  {formData.participantes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParticipante(participante.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={participante.nome}
                      onChange={(e) => updateParticipante(participante.id, 'nome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={participante.email}
                      onChange={(e) => updateParticipante(participante.id, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={participante.cargo}
                      onChange={(e) => updateParticipante(participante.id, 'cargo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={participante.obrigatorio}
                      onChange={(e) => updateParticipante(participante.id, 'obrigatorio', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Participação obrigatória</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lembretes */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Lembretes
            </h3>
            <button
              type="button"
              onClick={addLembrete}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {formData.lembretes.map((lembrete, index) => (
              <div key={lembrete.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Lembrete #{index + 1}</span>
                  {formData.lembretes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLembrete(lembrete.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={lembrete.tipo}
                      onChange={(e) => updateLembrete(lembrete.id, 'tipo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="Push">Notificação Push</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Antecedência</label>
                    <input
                      type="number"
                      value={lembrete.tempo_antecedencia}
                      onChange={(e) => updateLembrete(lembrete.id, 'tempo_antecedencia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                    <select
                      value={lembrete.unidade}
                      onChange={(e) => updateLembrete(lembrete.id, 'unidade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="minutos">Minutos</option>
                      <option value="horas">Horas</option>
                      <option value="dias">Dias</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configurações Adicionais */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Configurações Adicionais</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recursos Necessários
              </label>
              <textarea
                name="recursos_necessarios"
                value={formData.recursos_necessarios}
                onChange={handleChange}
                rows={2}
                placeholder="Ex: Projetor, notebook, flip chart..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Público Alvo
              </label>
              <input
                type="text"
                name="publico_alvo"
                value={formData.publico_alvo}
                onChange={handleChange}
                placeholder="Ex: Equipe de Fiscalização"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requer_confirmacao"
                  checked={formData.requer_confirmacao}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Requer confirmação de presença</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="evento_publico"
                  checked={formData.evento_publico}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Evento público</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="permite_convidados"
                  checked={formData.permite_convidados}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Permite convidados</span>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/agenda')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              id ? 'Atualizar' : 'Salvar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgendaForm;