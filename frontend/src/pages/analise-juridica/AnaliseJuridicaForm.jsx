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
  XMarkIcon
} from '@heroicons/react/24/outline';
import analiseJuridicaService from '../../services/analiseJuridicaService';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const AnaliseJuridicaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analistas, setAnalistas] = useState([]);
  const [processos, setProcessos] = useState([]);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    processo: '',
    analista: '',
    tipo_analise: '',
    prioridade: 'NORMAL',
    prazo: '',
    observacoes: '',
    documentos_anexos: []
  });

  const tiposAnalise = [
    { value: 'CONSULTIVA', label: 'Consultiva' },
    { value: 'RECURSAL', label: 'Recursal' },
    { value: 'ADMINISTRATIVA', label: 'Administrativa' },
    { value: 'LEGISLATIVA', label: 'Legislativa' },
    { value: 'JUDICIAL', label: 'Judicial' }
  ];

  const prioridades = [
    { value: 'BAIXA', label: 'Baixa', color: 'text-green-600' },
    { value: 'NORMAL', label: 'Normal', color: 'text-blue-600' },
    { value: 'ALTA', label: 'Alta', color: 'text-orange-600' },
    { value: 'URGENTE', label: 'Urgente', color: 'text-red-600' }
  ];

  useEffect(() => {
    carregarDadosIniciais();
    if (id) {
      carregarAnalise();
    }
  }, [id]);

  const carregarDadosIniciais = async () => {
    try {
      setLoading(true);
      
      // Carregar analistas disponíveis
      const analistasData = await analiseJuridicaService.listarAnalistas();
      setAnalistas(analistasData);
      
      // Carregar processos disponíveis
      const processosData = await analiseJuridicaService.listarProcessos();
      setProcessos(processosData);
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const carregarAnalise = async () => {
    try {
      setLoading(true);
      const analise = await analiseJuridicaService.obterAnalise(id);
      setFormData(analise);
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      toast.error('Erro ao carregar análise');
      navigate('/analise-juridica');
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
    
    if (!formData.titulo.trim()) {
      erros.push('Título é obrigatório');
    }
    
    if (!formData.descricao.trim()) {
      erros.push('Descrição é obrigatória');
    }
    
    if (!formData.processo) {
      erros.push('Processo é obrigatório');
    }
    
    if (!formData.analista) {
      erros.push('Analista é obrigatório');
    }
    
    if (!formData.tipo_analise) {
      erros.push('Tipo de análise é obrigatório');
    }
    
    if (!formData.prazo) {
      erros.push('Prazo é obrigatório');
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
        await analiseJuridicaService.atualizarAnalise(id, formData);
        toast.success('Análise atualizada com sucesso!');
      } else {
        await analiseJuridicaService.criarAnalise(formData);
        toast.success('Análise criada com sucesso!');
      }
      
      navigate('/analise-juridica');
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      toast.error('Erro ao salvar análise');
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
                onClick={() => navigate('/analise-juridica')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {id ? 'Editar Análise Jurídica' : 'Nova Análise Jurídica'}
                </h1>
                <p className="text-gray-600">
                  {id ? 'Edite os dados da análise jurídica' : 'Crie uma nova análise jurídica'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Título */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Análise *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o título da análise"
                required
              />
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

            {/* Analista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analista Responsável *
              </label>
              <select
                name="analista"
                value={formData.analista}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um analista</option>
                {analistas.map(analista => (
                  <option key={analista.id} value={analista.id}>
                    {analista.nome} - {analista.especialidade}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Análise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Análise *
              </label>
              <select
                name="tipo_analise"
                value={formData.tipo_analise}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione o tipo</option>
                {tiposAnalise.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                name="prioridade"
                value={formData.prioridade}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {prioridades.map(prioridade => (
                  <option key={prioridade.value} value={prioridade.value}>
                    {prioridade.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prazo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo *
              </label>
              <input
                type="date"
                name="prazo"
                value={formData.prazo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Descrição */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva os detalhes da análise jurídica"
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
              onClick={() => navigate('/analise-juridica')}
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
              <span>{saving ? 'Salvando...' : 'Salvar Análise'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnaliseJuridicaForm;
