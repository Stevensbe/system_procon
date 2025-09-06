import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useNotification from '../../hooks/useNotification';

const ConsultaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo_consulta: 'Consulta Pública',
    tema: '',
    objetivo: '',
    data_inicio: '',
    data_fim: '',
    data_publicacao: '',
    responsavel: '',
    status: 'Rascunho',
    permite_comentarios: true,
    requer_identificacao: false,
    publico_alvo: '',
    como_participar: '',
    criterios_participacao: '',
    documentos: [],
    perguntas: [
      {
        id: Date.now(),
        pergunta: '',
        tipo: 'Texto Livre',
        obrigatoria: false,
        opcoes: []
      }
    ],
    canais_divulgacao: {
      site_oficial: true,
      redes_sociais: false,
      jornal_oficial: false,
      imprensa: false,
      email_institucional: false
    },
    configuracoes: {
      limite_caracteres: 5000,
      permite_anexos: true,
      moderacao_previa: false,
      notificar_novas_participacoes: true
    }
  });

  useEffect(() => {
    if (id) {
      fetchConsulta();
    }
  }, [id]);

  const fetchConsulta = async () => {
    try {
      setLoading(true);
      // Simular carregamento de dados
      if (id) {
        const mockData = {
          titulo: 'Consulta sobre Nova Regulamentação de E-commerce',
          descricao: 'Consulta pública para coleta de contribuições sobre a nova regulamentação do comércio eletrônico no estado.',
          tipo_consulta: 'Consulta Pública',
          tema: 'Regulamentação Comercial',
          objetivo: 'Coletar contribuições da sociedade civil e empresas sobre a nova regulamentação',
          data_inicio: '2024-03-01',
          data_fim: '2024-04-15',
          data_publicacao: '2024-02-15',
          responsavel: 'Dr. João Silva',
          status: 'Aberta',
          permite_comentarios: true,
          requer_identificacao: true,
          publico_alvo: 'Empresas de e-commerce, consumidores, associações empresariais',
          como_participar: 'Através do formulário online ou envio de documento por email',
          criterios_participacao: 'Qualquer pessoa física ou jurídica pode participar',
          perguntas: [
            {
              id: 1,
              pergunta: 'Qual sua opinião sobre as novas regras propostas?',
              tipo: 'Texto Livre',
              obrigatoria: true,
              opcoes: []
            },
            {
              id: 2,
              pergunta: 'Você representa qual segmento?',
              tipo: 'Múltipla Escolha',
              obrigatoria: true,
              opcoes: ['Consumidor', 'Empresa', 'Associação', 'Outros']
            }
          ],
          canais_divulgacao: {
            site_oficial: true,
            redes_sociais: true,
            jornal_oficial: true,
            imprensa: false,
            email_institucional: true
          }
        };
        setFormData(mockData);
      }
    } catch (error) {
      showNotification('Erro ao carregar dados da consulta', 'error');
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

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
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

  const addPergunta = () => {
    const newPergunta = {
      id: Date.now(),
      pergunta: '',
      tipo: 'Texto Livre',
      obrigatoria: false,
      opcoes: []
    };
    setFormData(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, newPergunta]
    }));
  };

  const removePergunta = (perguntaId) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.filter(p => p.id !== perguntaId)
    }));
  };

  const updatePergunta = (perguntaId, field, value) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.map(p => 
        p.id === perguntaId ? { ...p, [field]: value } : p
      )
    }));
  };

  const addOpcao = (perguntaId) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.map(p => 
        p.id === perguntaId 
          ? { ...p, opcoes: [...p.opcoes, ''] }
          : p
      )
    }));
  };

  const removeOpcao = (perguntaId, opcaoIndex) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.map(p => 
        p.id === perguntaId 
          ? { ...p, opcoes: p.opcoes.filter((_, index) => index !== opcaoIndex) }
          : p
      )
    }));
  };

  const updateOpcao = (perguntaId, opcaoIndex, value) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.map(p => 
        p.id === perguntaId 
          ? { 
              ...p, 
              opcoes: p.opcoes.map((opcao, index) => 
                index === opcaoIndex ? value : opcao
              )
            }
          : p
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.descricao || !formData.data_inicio || !formData.data_fim) {
      showNotification('Preencha os campos obrigatórios', 'error');
      return;
    }

    // Validar datas
    if (formData.data_inicio >= formData.data_fim) {
      showNotification('Data de início deve ser anterior à data de fim', 'error');
      return;
    }

    try {
      setSaving(true);
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification(
        id ? 'Consulta atualizada com sucesso' : 'Consulta criada com sucesso', 
        'success'
      );
      navigate('/consulta');
    } catch (error) {
      showNotification('Erro ao salvar consulta', 'error');
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
              onClick={() => navigate('/consulta')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Voltar
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {id ? 'Editar Consulta' : 'Nova Consulta Pública'}
              </h1>
              <p className="text-gray-600">Configure os dados da consulta pública</p>
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
                Título da Consulta *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                placeholder="Ex: Consulta sobre Nova Regulamentação"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Descreva o propósito e contexto da consulta pública..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Consulta
              </label>
              <select
                name="tipo_consulta"
                value={formData.tipo_consulta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Consulta Pública">Consulta Pública</option>
                <option value="Audiência Pública">Audiência Pública</option>
                <option value="Tomada de Subsídios">Tomada de Subsídios</option>
                <option value="Pesquisa de Opinião">Pesquisa de Opinião</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema
              </label>
              <input
                type="text"
                name="tema"
                value={formData.tema}
                onChange={handleChange}
                placeholder="Ex: Regulamentação Comercial"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável
              </label>
              <input
                type="text"
                name="responsavel"
                value={formData.responsavel}
                onChange={handleChange}
                placeholder="Nome do responsável"
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
                <option value="Rascunho">Rascunho</option>
                <option value="Publicada">Publicada</option>
                <option value="Aberta">Aberta</option>
                <option value="Fechada">Fechada</option>
                <option value="Análise">Em Análise</option>
                <option value="Finalizada">Finalizada</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objetivo
              </label>
              <textarea
                name="objetivo"
                value={formData.objetivo}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva o objetivo específico da consulta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Cronograma */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Cronograma
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Publicação
              </label>
              <input
                type="date"
                name="data_publicacao"
                value={formData.data_publicacao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Fim *
              </label>
              <input
                type="date"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Participação */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Participação
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Público Alvo
              </label>
              <input
                type="text"
                name="publico_alvo"
                value={formData.publico_alvo}
                onChange={handleChange}
                placeholder="Ex: Empresas, consumidores, associações..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Como Participar
              </label>
              <textarea
                name="como_participar"
                value={formData.como_participar}
                onChange={handleChange}
                rows={3}
                placeholder="Instruções sobre como participar da consulta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critérios de Participação
              </label>
              <textarea
                name="criterios_participacao"
                value={formData.criterios_participacao}
                onChange={handleChange}
                rows={2}
                placeholder="Critérios ou requisitos para participação..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="permite_comentarios"
                  checked={formData.permite_comentarios}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Permitir comentários públicos</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requer_identificacao"
                  checked={formData.requer_identificacao}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Requer identificação para participar</span>
              </label>
            </div>
          </div>
        </div>

        {/* Perguntas */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Perguntas da Consulta
            </h3>
            <button
              type="button"
              onClick={addPergunta}
              className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar
            </button>
          </div>

          <div className="space-y-6">
            {formData.perguntas.map((pergunta, index) => (
              <div key={pergunta.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Pergunta #{index + 1}</span>
                  {formData.perguntas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePergunta(pergunta.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta</label>
                    <textarea
                      value={pergunta.pergunta}
                      onChange={(e) => updatePergunta(pergunta.id, 'pergunta', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Digite sua pergunta aqui..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Resposta</label>
                      <select
                        value={pergunta.tipo}
                        onChange={(e) => updatePergunta(pergunta.id, 'tipo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="Texto Livre">Texto Livre</option>
                        <option value="Múltipla Escolha">Múltipla Escolha</option>
                        <option value="Escolha Única">Escolha Única</option>
                        <option value="Escala">Escala (1-5)</option>
                        <option value="Sim/Não">Sim/Não</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pergunta.obrigatoria}
                          onChange={(e) => updatePergunta(pergunta.id, 'obrigatoria', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Pergunta obrigatória</span>
                      </label>
                    </div>
                  </div>

                  {(pergunta.tipo === 'Múltipla Escolha' || pergunta.tipo === 'Escolha Única') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Opções</label>
                        <button
                          type="button"
                          onClick={() => addOpcao(pergunta.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          + Adicionar opção
                        </button>
                      </div>
                      <div className="space-y-2">
                        {pergunta.opcoes.map((opcao, opcaoIndex) => (
                          <div key={opcaoIndex} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={opcao}
                              onChange={(e) => updateOpcao(pergunta.id, opcaoIndex, e.target.value)}
                              placeholder={`Opção ${opcaoIndex + 1}`}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeOpcao(pergunta.id, opcaoIndex)}
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
            ))}
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Documentos de Referência
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

        {/* Canais de Divulgação */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <GlobeAltIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Canais de Divulgação
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.canais_divulgacao).map(([canal, ativo]) => (
              <label key={canal} className="flex items-center">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => handleNestedChange('canais_divulgacao', canal, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {canal.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Configurações Avançadas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de Caracteres por Resposta
              </label>
              <input
                type="number"
                value={formData.configuracoes.limite_caracteres}
                onChange={(e) => handleNestedChange('configuracoes', 'limite_caracteres', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.configuracoes.permite_anexos}
                  onChange={(e) => handleNestedChange('configuracoes', 'permite_anexos', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Permitir anexos nas respostas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.configuracoes.moderacao_previa}
                  onChange={(e) => handleNestedChange('configuracoes', 'moderacao_previa', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Moderação prévia das participações</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.configuracoes.notificar_novas_participacoes}
                  onChange={(e) => handleNestedChange('configuracoes', 'notificar_novas_participacoes', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Notificar sobre novas participações</span>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/consulta')}
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

export default ConsultaForm;