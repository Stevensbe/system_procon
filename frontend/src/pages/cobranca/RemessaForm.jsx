import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cobrancaService } from '../../services/cobrancaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const RemessaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bancos, setBancos] = useState([]);
  
  const [formData, setFormData] = useState({
    banco: '',
    tipo: 'remessa',
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    carregarDadosIniciais();
    if (id) {
      carregarRemessa();
    }
  }, [id]);

  const carregarDadosIniciais = async () => {
    try {
      setLoading(true);
      const [bancosData] = await Promise.all([
        cobrancaService.getBancos()
      ]);
      
      setBancos(Array.isArray(bancosData) ? bancosData : []);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const carregarRemessa = async () => {
    try {
      setLoading(true);
      const data = await cobrancaService.getRemessa(id);
      setFormData({
        banco: data.banco?.id || '',
        tipo: data.tipo || 'remessa',
        observacoes: data.observacoes || ''
      });
    } catch (error) {
      console.error('Erro ao carregar remessa:', error);
      toast.error('Erro ao carregar remessa');
      navigate('/cobranca/remessas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.banco) {
      newErrors.banco = 'Banco é obrigatório';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setSaving(true);
      
      if (id) {
        await cobrancaService.updateRemessa(id, formData);
        toast.success('Remessa atualizada com sucesso!');
      } else {
        await cobrancaService.createRemessa(formData);
        toast.success('Remessa criada com sucesso!');
      }
      
      navigate('/cobranca/remessas');
    } catch (error) {
      console.error('Erro ao salvar remessa:', error);
      toast.error('Erro ao salvar remessa');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/cobranca/remessas');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Editar Remessa' : 'Nova Remessa'}
            </h1>
            <p className="text-gray-600">
              {id ? 'Edite os dados da remessa bancária' : 'Crie uma nova remessa bancária'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Dados Básicos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dados Básicos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.banco}
                  onChange={(e) => handleInputChange('banco', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.banco ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um banco</option>
                  {Array.isArray(bancos) && bancos.map((banco) => (
                    <option key={banco.id} value={banco.id}>
                      {banco.codigo} - {banco.nome}
                    </option>
                  ))}
                </select>
                {errors.banco && (
                  <p className="mt-1 text-sm text-red-600">{errors.banco}</p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tipo ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="remessa">Remessa</option>
                  <option value="retorno">Retorno</option>
                </select>
                {errors.tipo && (
                  <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Observações
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite observações sobre a remessa..."
              />
            </div>
          </div>

          {/* Informações do Sistema */}
          {id && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações do Sistema
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-500">Criado por:</span>
                    <span className="ml-2 text-gray-900">Sistema</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-500">Criado em:</span>
                    <span className="ml-2 text-gray-900">Data atual</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
            >
              <XMarkIcon className="w-4 h-4 mr-2" />
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {id ? 'Atualizar' : 'Criar'} Remessa
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Ajuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          <DocumentArrowDownIcon className="w-5 h-5 inline mr-2" />
          Sobre Remessas Bancárias
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Remessa:</strong> Arquivo CNAB enviado ao banco com os dados dos boletos para registro.
          </p>
          <p>
            <strong>Retorno:</strong> Arquivo CNAB recebido do banco com as confirmações de processamento.
          </p>
          <p>
            <strong>Processo:</strong> Após criar a remessa, você pode gerar o arquivo CNAB e enviá-lo ao banco.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RemessaForm;
