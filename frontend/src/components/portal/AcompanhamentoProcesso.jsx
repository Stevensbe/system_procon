import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import portalCidadaoService from '../../services/portalCidadaoService';
import ConsultaResultado from './ConsultaResultado';

const AcompanhamentoProcesso = ({ onSuccess, onError }) => {
  const [protocolo, setProtocolo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numero = protocolo.trim();
    if (!numero) {
      setError('Informe o número do protocolo.');
      return;
    }

    setLoading(true);
    setError('');
    setResultado(null);

    try {
      const dados = await portalCidadaoService.acompanharProcesso(numero);

      if (dados?.encontrado) {
        setResultado(dados);
        onSuccess?.(dados);
      } else {
        const message =
          dados?.detail ||
          dados?.erro ||
          'Nenhum processo encontrado para o protocolo informado.';
        setError(message);
        onError?.(message);
      }
    } catch (err) {
      const message =
        err?.message ||
        'Erro ao consultar processo. Verifique o número do protocolo e tente novamente.';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        <div className="flex items-center mb-6">
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acompanhar Processo</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número do Protocolo *
            </label>
            <div className="flex">
              <input
                type="text"
                value={protocolo}
                onChange={(event) => setProtocolo(event.target.value)}
                placeholder="Digite o número do protocolo"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Consultando...</span>
                  </span>
                ) : (
                  'Consultar'
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
      </div>

      {resultado && (
        <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
          <ConsultaResultado resultado={resultado} tipo="protocolo" />
        </div>
      )}
    </div>
  );
};

export default AcompanhamentoProcesso;
