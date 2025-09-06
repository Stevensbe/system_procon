import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { multasService } from '../services/multasService';

export default function MultaForm({ multa = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    processo: '',
    empresa: '',
    valor: '',
    observacoes: ''
  });
  
  const [empresas, setEmpresas] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadEmpresas();
    loadProcessos();
    
    if (multa) {
      setFormData({
        processo: multa.processo || '',
        empresa: multa.empresa || '',
        valor: multa.valor || '',
        observacoes: multa.observacoes || ''
      });
    }
  }, [multa]);

  const loadEmpresas = async () => {
    try {
      const data = await multasService.getEmpresas();
      setEmpresas(data.results || data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadProcessos = async () => {
    try {
      // Aqui você precisaria ter um serviço para processos
      // Por enquanto, vamos usar dados mockados
      setProcessos([
        { id: 1, numero: 'PROC-2024-001' },
        { id: 2, numero: 'PROC-2024-002' },
        { id: 3, numero: 'PROC-2024-003' }
      ]);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.processo) newErrors.processo = 'Processo é obrigatório';
    if (!formData.empresa) newErrors.empresa = 'Empresa é obrigatória';
    if (!formData.valor) newErrors.valor = 'Valor é obrigatório';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const data = {
        ...formData,
        valor: parseFloat(formData.valor)
      };
      
      if (multa) {
        await multasService.updateMulta(multa.id, data);
      } else {
        await multasService.createMulta(data);
      }
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar multa:', error);
      setErrors({ submit: 'Erro ao salvar multa. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {multa ? 'Editar Multa' : 'Nova Multa'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Processo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processo *
              </label>
              <select
                name="processo"
                value={formData.processo}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.processo ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um processo</option>
                {processos.map(processo => (
                  <option key={processo.id} value={processo.id}>
                    {processo.numero}
                  </option>
                ))}
              </select>
              {errors.processo && (
                <p className="mt-1 text-sm text-red-600">{errors.processo}</p>
              )}
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa *
              </label>
              <select
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.empresa ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione uma empresa</option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razao_social}
                  </option>
                ))}
              </select>
              {errors.empresa && (
                <p className="mt-1 text-sm text-red-600">{errors.empresa}</p>
              )}
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) *
              </label>
              <input
                type="number"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.valor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0,00"
              />
              {errors.valor && (
                <p className="mt-1 text-sm text-red-600">{errors.valor}</p>
              )}
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações sobre a multa..."
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Erro geral */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : (multa ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
