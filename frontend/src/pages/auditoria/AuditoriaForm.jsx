import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const AuditoriaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tipo_auditoria: '',
    objeto_auditoria: '',
    data_inicio: '',
    data_fim: '',
    equipe_auditoria: '',
    responsavel_auditoria: '',
    departamento_auditado: '',
    objetivo: '',
    escopo: '',
    criterios: '',
    metodologia: '',
    status: 'Planejada',
    observacoes: '',
    documentos: [],
    achados: [
      {
        id: Date.now(),
        titulo: '',
        descricao: '',
        tipo: 'Oportunidade de Melhoria',
        prioridade: 'Média',
        prazo_implementacao: '',
        responsavel: '',
        status: 'Pendente'
      }
    ],
    recomendacoes: [
      {
        id: Date.now() + 1,
        titulo: '',
        descricao: '',
        prazo: '',
        responsavel: '',
        status: 'Pendente'
      }
    ]
  });

  useEffect(() => {
    if (id) {
      fetchAuditoria();
    }
  }, [id]);

  const fetchAuditoria = async () => {
    try {
      setLoading(true);
      // Simular carregamento de dados
      if (id) {
        const mockData = {
          tipo_auditoria: 'Auditoria de Conformidade',
          objeto_auditoria: 'Processo de Atendimento ao Consumidor',
          data_inicio: '2024-02-01',
          data_fim: '2024-02-15',
          equipe_auditoria: 'Equipe de Auditoria Interna',
          responsavel_auditoria: 'Ana Paula Silva',
          departamento_auditado: 'Atendimento',
          objetivo: 'Verificar conformidade dos processos de atendimento',
          escopo: 'Todos os canais de atendimento',
          criterios: 'ISO 9001, Regulamentações do PROCON',
          metodologia: 'Entrevistas, análise documental, observação',
          status: 'Em Andamento',
          observacoes: 'Auditoria de rotina anual',
          achados: [
            {
              id: 1,
              titulo: 'Documentação desatualizada',
              descricao: 'Encontrados manuais de procedimento desatualizados',
              tipo: 'Não Conformidade',
              prioridade: 'Alta',
              prazo_implementacao: '2024-03-01',
              responsavel: 'João Santos',
              status: 'Pendente'
            }
          ],
          recomendacoes: [
            {
              id: 1,
              titulo: 'Atualizar documentação',
              descricao: 'Revisar e atualizar todos os manuais de procedimento',
              prazo: '2024-03-15',
              responsavel: 'Maria Silva',
              status: 'Pendente'
            }
          ]
        };
        setFormData(mockData);
      }
    } catch (error) {
      showNotification('Erro ao carregar dados da auditoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      nome: file.name,
      arquivo: file,
      tamanho: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }));
    
    setFormData(prev => ({
      ...prev,
      documentos: [...prev.documentos, ...newDocuments]
    }));
  };

  const removeDocument = (docId) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter(doc => doc.id !== docId)
    }));
  };

  const addAchado = () => {
    const newAchado = {
      id: Date.now(),
      titulo: '',
      descricao: '',
      tipo: 'Oportunidade de Melhoria',
      prioridade: 'Média',
      prazo_implementacao: '',
      responsavel: '',
      status: 'Pendente'
    };
    setFormData(prev => ({
      ...prev,
      achados: [...prev.achados, newAchado]
    }));
  };

  const removeAchado = (achadoId) => {
    setFormData(prev => ({
      ...prev,
      achados: prev.achados.filter(a => a.id !== achadoId)
    }));
  };

  const updateAchado = (achadoId, field, value) => {
    setFormData(prev => ({
      ...prev,
      achados: prev.achados.map(a => 
        a.id === achadoId ? { ...a, [field]: value } : a
      )
    }));
  };

  const addRecomendacao = () => {
    const newRecomendacao = {
      id: Date.now(),
      titulo: '',
      descricao: '',
      prazo: '',
      responsavel: '',
      status: 'Pendente'
    };
    setFormData(prev => ({
      ...prev,
      recomendacoes: [...prev.recomendacoes, newRecomendacao]
    }));
  };

  const removeRecomendacao = (recomendacaoId) => {
    setFormData(prev => ({
      ...prev,
      recomendacoes: prev.recomendacoes.filter(r => r.id !== recomendacaoId)
    }));
  };

  const updateRecomendacao = (recomendacaoId, field, value) => {
    setFormData(prev => ({
      ...prev,
      recomendacoes: prev.recomendacoes.map(r => 
        r.id === recomendacaoId ? { ...r, [field]: value } : r
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo_auditoria || !formData.objeto_auditoria) {
      showNotification('Preencha os campos obrigatórios', 'error');
      return;
    }

    try {
      setSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification(
        id ? 'Auditoria atualizada com sucesso' : 'Auditoria criada com sucesso', 
        'success'
      );
      navigate('/auditoria');
    } catch (error) {
      showNotification('Erro ao salvar auditoria', 'error');
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
              onClick={() => navigate('/auditoria')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {id ? 'Editar Auditoria' : 'Nova Auditoria'}
              </h1>
              <p className="text-gray-600">Preencha os dados da auditoria</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Auditoria *
              </label>
              <select
                name="tipo_auditoria"
                value={formData.tipo_auditoria}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione o tipo</option>
                <option value="Auditoria de Conformidade">Auditoria de Conformidade</option>
                <option value="Auditoria Operacional">Auditoria Operacional</option>
                <option value="Auditoria de Processos">Auditoria de Processos</option>
                <option value="Auditoria de Qualidade">Auditoria de Qualidade</option>
                <option value="Auditoria de Sistemas">Auditoria de Sistemas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objeto da Auditoria *
              </label>
              <input
                type="text"
                name="objeto_auditoria"
                value={formData.objeto_auditoria}
                onChange={handleChange}
                required
                placeholder="Ex: Processo de Atendimento"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Fim
              </label>
              <input
                type="date"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável pela Auditoria
              </label>
              <input
                type="text"
                name="responsavel_auditoria"
                value={formData.responsavel_auditoria}
                onChange={handleChange}
                placeholder="Nome do responsável"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento Auditado
              </label>
              <select
                name="departamento_auditado"
                value={formData.departamento_auditado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione o departamento</option>
                <option value="Atendimento">Atendimento</option>
                <option value="Fiscalização">Fiscalização</option>
                <option value="Jurídico">Jurídico</option>
                <option value="Administrativa">Administrativa</option>
                <option value="TI">Tecnologia da Informação</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipe de Auditoria
              </label>
              <input
                type="text"
                name="equipe_auditoria"
                value={formData.equipe_auditoria}
                onChange={handleChange}
                placeholder="Nome da equipe ou membros"
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
                <option value="Planejada">Planejada</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Escopo e Metodologia */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Escopo e Metodologia
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objetivo
              </label>
              <textarea
                name="objetivo"
                value={formData.objetivo}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva o objetivo da auditoria..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escopo
              </label>
              <textarea
                name="escopo"
                value={formData.escopo}
                onChange={handleChange}
                rows={3}
                placeholder="Defina o escopo da auditoria..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critérios
              </label>
              <textarea
                name="criterios"
                value={formData.criterios}
                onChange={handleChange}
                rows={3}
                placeholder="Liste os critérios de auditoria..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metodologia
              </label>
              <textarea
                name="metodologia"
                value={formData.metodologia}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva a metodologia utilizada..."
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
          </div>
        </div>

        {/* Achados */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
              Achados de Auditoria
            </h3>
            <button
              type="button"
              onClick={addAchado}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {formData.achados.map((achado, index) => (
              <div key={achado.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Achado #{index + 1}</span>
                  {formData.achados.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAchado(achado.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={achado.titulo}
                      onChange={(e) => updateAchado(achado.id, 'titulo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={achado.descricao}
                      onChange={(e) => updateAchado(achado.id, 'descricao', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={achado.tipo}
                      onChange={(e) => updateAchado(achado.id, 'tipo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Não Conformidade">Não Conformidade</option>
                      <option value="Oportunidade de Melhoria">Oportunidade de Melhoria</option>
                      <option value="Observação">Observação</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select
                      value={achado.prioridade}
                      onChange={(e) => updateAchado(achado.id, 'prioridade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo para Implementação</label>
                    <input
                      type="date"
                      value={achado.prazo_implementacao}
                      onChange={(e) => updateAchado(achado.id, 'prazo_implementacao', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                    <input
                      type="text"
                      value={achado.responsavel}
                      onChange={(e) => updateAchado(achado.id, 'responsavel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendações */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
              Recomendações
            </h3>
            <button
              type="button"
              onClick={addRecomendacao}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-4">
            {formData.recomendacoes.map((rec, index) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Recomendação #{index + 1}</span>
                  {formData.recomendacoes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecomendacao(rec.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input
                      type="text"
                      value={rec.titulo}
                      onChange={(e) => updateRecomendacao(rec.id, 'titulo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={rec.descricao}
                      onChange={(e) => updateRecomendacao(rec.id, 'descricao', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                    <input
                      type="date"
                      value={rec.prazo}
                      onChange={(e) => updateRecomendacao(rec.id, 'prazo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                    <input
                      type="text"
                      value={rec.responsavel}
                      onChange={(e) => updateRecomendacao(rec.id, 'responsavel', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Documentos
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexar Documentos
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {formData.documentos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Documentos Anexados:</h4>
                <div className="space-y-2">
                  {formData.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{doc.nome} ({doc.tamanho})</span>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/auditoria')}
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

export default AuditoriaForm;