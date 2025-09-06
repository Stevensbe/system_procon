import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentCheckIcon,
  XMarkIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';
import recursosDefesasService from '../../services/recursosDefesasService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const RecursoForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processos, setProcessos] = useState([]);
  const [advogados, setAdvogados] = useState([]);
  
  const [formData, setFormData] = useState({
    numero: '',
    tipo: '',
    processo: '',
    requerente: '',
    advogado: '',
    data_apresentacao: '',
    prazo_resposta: '',
    fundamentacao: '',
    pedidos: '',
    documentos_anexos: [],
    status: 'PENDENTE',
    observacoes: ''
  });

  const tiposRecurso = [
    { value: 'RECURSO_ADMINISTRATIVO', label: 'Recurso Administrativo' },
    { value: 'RECURSO_ESPECIAL', label: 'Recurso Especial' },
    { value: 'RECURSO_ORDINARIO', label: 'Recurso Ordinário' },
    { value: 'DEFESA_PREVIA', label: 'Defesa Prévia' },
    { value: 'DEFESA_FINAL', label: 'Defesa Final' },
    { value: 'RECONSIDERACAO', label: 'Pedido de Reconsideração' }
  ];

  const statusRecurso = [
    { value: 'PENDENTE', label: 'Pendente', color: 'text-yellow-600' },
    { value: 'EM_ANALISE', label: 'Em Análise', color: 'text-blue-600' },
    { value: 'DEFERIDO', label: 'Deferido', color: 'text-green-600' },
    { value: 'INDEFERIDO', label: 'Indeferido', color: 'text-red-600' },
    { value: 'ARQUIVADO', label: 'Arquivado', color: 'text-gray-600' }
  ];

  useEffect(() => {
    carregarDadosIniciais();
    if (id) {
      carregarRecurso();
    }
  }, [id]);

  const carregarDadosIniciais = async () => {
    try {
      setLoading(true);
      
      // Carregar processos disponíveis
      const processosData = await recursosDefesasService.listarProcessos();
      setProcessos(processosData);
      
      // Carregar advogados disponíveis
      const advogadosData = await recursosDefesasService.listarAdvogados();
      setAdvogados(advogadosData);
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const carregarRecurso = async () => {
    try {
      setLoading(true);
      const recurso = await recursosDefesasService.obterRecurso(id);
      setFormData(recurso);
    } catch (error) {
      console.error('Erro ao carregar recurso:', error);
      toast.error('Erro ao carregar recurso');
      navigate('/recursos-defesas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      documentos_anexos: [...prev.documentos_anexos, ...files]
    }));
  };

  const removerAnexo = (index) => {
    setFormData(prev => ({
      ...prev,
      documentos_anexos: prev.documentos_anexos.filter((_, i) => i !== index)
    }));
  };

  const validarFormulario = () => {
    const erros = [];
    
    if (!formData.numero.trim()) {
      erros.push('Número do recurso é obrigatório');
    }
    
    if (!formData.tipo) {
      erros.push('Tipo de recurso é obrigatório');
    }
    
    if (!formData.processo) {
      erros.push('Processo é obrigatório');
    }
    
    if (!formData.requerente.trim()) {
      erros.push('Requerente é obrigatório');
    }
    
    if (!formData.advogado) {
      erros.push('Advogado é obrigatório');
    }
    
    if (!formData.data_apresentacao) {
      erros.push('Data de apresentação é obrigatória');
    }
    
    if (!formData.fundamentacao.trim()) {
      erros.push('Fundamentação é obrigatória');
    }
    
    if (!formData.pedidos.trim()) {
      erros.push('Pedidos são obrigatórios');
    }
    
    return erros;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const erros = validarFormulario();
    if (erros.length > 0) {
      erros.forEach(erro => toast.error(erro));
      return;
    }
    
    try {
      setSaving(true);
      
      if (id) {
        await recursosDefesasService.atualizarRecurso(id, formData);
        toast.success('Recurso atualizado com sucesso!');
      } else {
        await recursosDefesasService.criarRecurso(formData);
        toast.success('Recurso criado com sucesso!');
      }
      
      navigate('/recursos-defesas');
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
      toast.error('Erro ao salvar recurso');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/recursos-defesas')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {id ? 'Editar Recurso/Defesa' : 'Novo Recurso/Defesa'}
                </h1>
                <p className="text-gray-600">
                  {id ? 'Edite os dados do recurso/defesa' : 'Crie um novo recurso ou defesa'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Número do Recurso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do Recurso *
              </label>
              <input
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: REC-2025-001"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Recurso/Defesa *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione o tipo</option>
                {tiposRecurso.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Processo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processo *
              </label>
              <select
                name="processo"
                value={formData.processo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um processo</option>
                {processos.map(processo => (
                  <option key={processo.id} value={processo.id}>
                    {processo.numero} - {processo.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusRecurso.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Requerente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requerente *
              </label>
              <input
                type="text"
                name="requerente"
                value={formData.requerente}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome do requerente"
                required
              />
            </div>

            {/* Advogado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advogado *
              </label>
              <select
                name="advogado"
                value={formData.advogado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um advogado</option>
                {advogados.map(advogado => (
                  <option key={advogado.id} value={advogado.id}>
                    {advogado.nome} - OAB: {advogado.oab}
                  </option>
                ))}
              </select>
            </div>

            {/* Data de Apresentação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Apresentação *
              </label>
              <input
                type="date"
                name="data_apresentacao"
                value={formData.data_apresentacao}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Prazo para Resposta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo para Resposta
              </label>
              <input
                type="date"
                name="prazo_resposta"
                value={formData.prazo_resposta}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Fundamentação */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fundamentação Jurídica *
              </label>
              <textarea
                name="fundamentacao"
                value={formData.fundamentacao}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva a fundamentação jurídica do recurso/defesa"
                required
              />
            </div>

            {/* Pedidos */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pedidos *
              </label>
              <textarea
                name="pedidos"
                value={formData.pedidos}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva os pedidos do recurso/defesa"
                required
              />
            </div>

            {/* Observações */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações adicionais"
              />
            </div>

            {/* Anexos */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documentos Anexos
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              
              {formData.documentos_anexos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.documentos_anexos.map((arquivo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{arquivo.name}</span>
                      <button
                        type="button"
                        onClick={() => removerAnexo(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/recursos-defesas')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <DocumentCheckIcon className="h-4 w-4" />
              )}
              <span>{saving ? 'Salvando...' : 'Salvar Recurso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecursoForm;
