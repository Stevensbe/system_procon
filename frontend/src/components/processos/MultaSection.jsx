import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  DocumentArrowUpIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { multasService } from '../../services/multasService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import MultaForm from '../MultaForm';

export default function MultaSection({ processoId }) {
  const [multa, setMulta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadMulta();
  }, [processoId]);

  const loadMulta = async () => {
    try {
      setLoading(true);
      // Buscar multa pelo processo
      const multas = await multasService.getMultas({ processo: processoId });
      if (multas.results && multas.results.length > 0) {
        setMulta(multas.results[0]);
      } else {
        setMulta(null);
      }
    } catch (error) {
      console.error('Erro ao carregar multa:', error);
      setMulta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMulta = () => {
    setShowCreateModal(false);
    loadMulta();
  };

  const handleMarcarComoPaga = async () => {
    if (!multa) return;
    
    try {
      await multasService.marcarComoPaga(multa.id);
      loadMulta();
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const handleCancelarMulta = async () => {
    if (!multa) return;
    
    if (window.confirm('Tem certeza que deseja cancelar esta multa?')) {
      try {
        await multasService.cancelarMulta(multa.id);
        loadMulta();
      } catch (error) {
        console.error('Erro ao cancelar multa:', error);
      }
    }
  };

  const getStatusBadge = (pago) => {
    const statusConfig = {
      true: { color: 'bg-green-100 text-green-800', text: 'Paga' },
      false: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' }
    };
    
    const config = statusConfig[pago] || statusConfig.false;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const isVencida = () => {
    if (!multa || multa.pago) return false;
    const hoje = new Date();
    const vencimento = new Date(multa.data_vencimento);
    return vencimento < hoje;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Multa Aplicada</h3>
        {!multa && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Gerar Multa
          </button>
        )}
      </div>

      {!multa ? (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Nenhuma multa foi aplicada a este processo</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Gerar Multa
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Alerta de vencimento */}
          {isVencida() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-800 text-sm font-medium">
                  Esta multa está vencida desde {formatDate(multa.data_vencimento)}
                </p>
              </div>
            </div>
          )}

          {/* Informações da multa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Valor</label>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(multa.valor)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <div className="mt-1">
                {getStatusBadge(multa.pago)}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Data de Emissão</label>
              <p className="text-gray-900">{formatDate(multa.data_emissao)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Data de Vencimento</label>
              <p className="text-gray-900">{formatDate(multa.data_vencimento)}</p>
            </div>
          </div>

          {/* Observações */}
          {multa.observacoes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
              <p className="text-gray-900">{multa.observacoes}</p>
            </div>
          )}

          {/* Comprovante de pagamento */}
          {multa.comprovante_pagamento && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-600 mb-1">Comprovante de Pagamento</label>
              <a
                href={multa.comprovante_pagamento}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                Ver comprovante
              </a>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              Ver Detalhes
            </button>
            
            {!multa.pago && (
              <>
                <button
                  onClick={handleMarcarComoPaga}
                  className="inline-flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                  Marcar como Paga
                </button>
                
                <button
                  onClick={handleCancelarMulta}
                  className="inline-flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancelar Multa
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && multa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detalhes da Multa</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {formatCurrency(multa.valor)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(multa.pago)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(multa.data_emissao)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(multa.data_vencimento)}
                  </p>
                </div>
              </div>
              
              {multa.observacoes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {multa.observacoes}
                  </p>
                </div>
              )}
              
              {multa.comprovante_pagamento && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comprovante de Pagamento</label>
                  <a
                    href={multa.comprovante_pagamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                    Ver comprovante
                  </a>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <MultaForm
          multa={{ processo: processoId }}
          onSave={handleSaveMulta}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
