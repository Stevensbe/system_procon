import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import portalCidadaoService from '../../services/portalCidadaoService';

const formatarData = (valor) => {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return '-';
  }
  return data.toLocaleString('pt-BR');
};

const RespostaDenuncia = ({ resultado }) => {
  if (!resultado || !resultado.encontrado) return null;

  const competenciaLabel =
    resultado.competencia_procon === true
      ? 'Sim, atende ao PROCON'
      : resultado.competencia_procon === false
        ? 'Nao, fora da competencia'
        : 'Em analise';

  const competenciaClass =
    resultado.competencia_procon === true
      ? 'bg-green-100 text-green-700'
      : resultado.competencia_procon === false
        ? 'bg-red-100 text-red-700'
        : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <ChatBubbleLeftRightIcon className="h-7 w-7 text-blue-600 mr-3" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">Resposta da Denuncia</h3>
          <p className="text-sm text-gray-500">Protocolo: {resultado.numero_denuncia}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Empresa denunciada</p>
            <p className="font-medium text-gray-900">{resultado.empresa_denunciada || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo de infracao</p>
            <p className="font-medium text-gray-900">{resultado.tipo_infracao || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data da ocorrencia</p>
            <p className="font-medium text-gray-900">{formatarData(resultado.data_ocorrencia)}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium text-gray-900">{resultado.status_display || resultado.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Respondido em</p>
            <p className="font-medium text-gray-900">{formatarData(resultado.respondido_em)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Respondido por</p>
            <p className="font-medium text-gray-900">{resultado.respondido_por || '-'}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Competencia do PROCON</p>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${competenciaClass}`}>
          {competenciaLabel}
        </span>
      </div>

      {resultado.orientacao_destino && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Orientacao sugerida</p>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-line">
            {resultado.orientacao_destino}
          </div>
        </div>
      )}

      {resultado.resposta_fiscal ? (
        <div>
          <p className="text-sm text-gray-500 mb-2">Resposta do fiscal</p>
          <div className="bg-blue-50 rounded-lg p-4 text-gray-700 whitespace-pre-line">
            {resultado.resposta_fiscal}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-lg p-4 text-yellow-700">
          Sua denuncia ainda esta em analise. Assim que houver uma resposta, ela aparecera aqui.
        </div>
      )}
    </div>
  );
};

const AcompanhamentoDenuncia = ({ onSuccess, onError }) => {
  const [numeroDenuncia, setNumeroDenuncia] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numero = numeroDenuncia.trim();
    if (!numero) {
      setErro('Informe o numero da denuncia.');
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      const payload = {
        numero_denuncia: numero,
      };
      if (documento.trim()) {
        payload.documento = documento.trim();
      }
      if (email.trim()) {
        payload.email = email.trim();
      }

      const dados = await portalCidadaoService.consultarDenuncia(payload);
      if (dados?.encontrado) {
        setResultado(dados);
        onSuccess?.(dados);
      } else {
        const message = dados?.detail || dados?.erro || 'Denuncia nao encontrada.';
        setErro(message);
        onError?.(message);
      }
    } catch (err) {
      const message = err?.message || 'Erro ao consultar denuncia. Tente novamente.';
      setErro(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Consultar resposta da denuncia</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numero da denuncia *</label>
            <input
              type="text"
              value={numeroDenuncia}
              onChange={(event) => setNumeroDenuncia(event.target.value)}
              placeholder="Ex: DEN-000001/2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CPF/CNPJ</label>
              <input
                type="text"
                value={documento}
                onChange={(event) => setDocumento(event.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Se a denuncia foi anonima, informe apenas o numero para consultar.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Consultando...
              </span>
            ) : (
              'Consultar resposta'
            )}
          </button>
        </form>

        {erro && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{erro}</p>
            </div>
          </div>
        )}
      </div>

      {resultado?.encontrado && (
        <RespostaDenuncia resultado={resultado} />
      )}
    </div>
  );
};

export default AcompanhamentoDenuncia;
