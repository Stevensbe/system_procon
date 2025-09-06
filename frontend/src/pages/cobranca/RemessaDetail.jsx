import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  UploadIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { cobrancaService } from '../../services/cobrancaService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { toast } from 'react-hot-toast';

const RemessaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [remessa, setRemessa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    carregarRemessa();
  }, [id]);

  const carregarRemessa = async () => {
    try {
      setLoading(true);
      const data = await cobrancaService.getRemessa(id);
      setRemessa(data);
    } catch (error) {
      console.error('Erro ao carregar remessa:', error);
      toast.error('Erro ao carregar remessa');
      navigate('/cobranca/remessas');
    } finally {
      setLoading(false);
    }
  };

  const handleGerarRemessa = async () => {
    try {
      setProcessing(true);
      await cobrancaService.gerarRemessa(id);
      toast.success('Remessa gerada com sucesso!');
      carregarRemessa();
    } catch (error) {
      console.error('Erro ao gerar remessa:', error);
      toast.error('Erro ao gerar remessa');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessarRetorno = async () => {
    try {
      setProcessing(true);
      await cobrancaService.processarRetorno(id);
      toast.success('Retorno processado com sucesso!');
      carregarRemessa();
    } catch (error) {
      console.error('Erro ao processar retorno:', error);
      toast.error('Erro ao processar retorno');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadRemessa = () => {
    if (remessa?.arquivo_remessa) {
      const link = document.createElement('a');
      link.href = remessa.arquivo_remessa;
      link.download = `remessa_${remessa.numero}.rem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadRetorno = () => {
    if (remessa?.arquivo_retorno) {
      const link = document.createElement('a');
      link.href = remessa.arquivo_retorno;
      link.download = `retorno_${remessa.numero}.ret`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'text-yellow-600 bg-yellow-100';
      case 'gerado': return 'text-blue-600 bg-blue-100';
      case 'enviado': return 'text-purple-600 bg-purple-100';
      case 'processado': return 'text-green-600 bg-green-100';
      case 'erro': return 'text-red-600 bg-red-100';
      case 'cancelado': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return <ClockIcon className="w-5 h-5" />;
      case 'gerado': return <DocumentArrowDownIcon className="w-5 h-5" />;
      case 'enviado': return <DocumentArrowUpIcon className="w-5 h-5" />;
      case 'processado': return <CheckCircleIcon className="w-5 h-5" />;
      case 'erro': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'cancelado': return <XCircleIcon className="w-5 h-5" />;
      default: return <ClockIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!remessa) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Remessa não encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          A remessa solicitada não foi encontrada ou não existe.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/cobranca/remessas')}
            className="btn-primary"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Voltar para Remessas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/cobranca/remessas')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Remessa {remessa.numero}</h1>
            <p className="text-gray-600">Detalhes da remessa bancária</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          {remessa.status === 'pendente' && (
            <button
              onClick={handleGerarRemessa}
              disabled={processing}
              className="btn-primary"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              {processing ? 'Gerando...' : 'Gerar Remessa'}
            </button>
          )}
          
          {remessa.status === 'enviado' && (
            <button
              onClick={handleProcessarRetorno}
              disabled={processing}
              className="btn-secondary"
            >
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              {processing ? 'Processando...' : 'Processar Retorno'}
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(remessa.status)}`}>
              {getStatusIcon(remessa.status)}
              <span className="ml-2">{remessa.status}</span>
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            Criado em {formatDate(remessa.criado_em)}
          </div>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados da Remessa */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Remessa</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Número</label>
              <p className="text-sm text-gray-900">{remessa.numero}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo</label>
              <p className="text-sm text-gray-900">{remessa.tipo}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Banco</label>
              <p className="text-sm text-gray-900">{remessa.banco?.nome} ({remessa.banco?.codigo})</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Sequencial</label>
              <p className="text-sm text-gray-900">{remessa.sequencial}</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BanknotesIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Quantidade de Boletos</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{remessa.quantidade_boletos}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BanknotesIcon className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Valor Total</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(remessa.valor_total)}</span>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datas</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Data de Geração</label>
              <p className="text-sm text-gray-900">{formatDate(remessa.data_geracao)}</p>
            </div>
            
            {remessa.data_envio && (
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Envio</label>
                <p className="text-sm text-gray-900">{formatDate(remessa.data_envio)}</p>
              </div>
            )}
            
            {remessa.data_processamento && (
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Processamento</label>
                <p className="text-sm text-gray-900">{formatDate(remessa.data_processamento)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Arquivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arquivo de Remessa */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Arquivo de Remessa</h3>
          
          {remessa.arquivo_remessa ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DocumentArrowDownIcon className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {remessa.arquivo_remessa.split('/').pop()}
                    </p>
                    <p className="text-sm text-gray-500">Arquivo CNAB gerado</p>
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadRemessa}
                  className="btn-secondary"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum arquivo gerado</h3>
              <p className="mt-1 text-sm text-gray-500">
                O arquivo de remessa ainda não foi gerado.
              </p>
            </div>
          )}
        </div>

        {/* Arquivo de Retorno */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Arquivo de Retorno</h3>
          
          {remessa.arquivo_retorno ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DocumentArrowUpIcon className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {remessa.arquivo_retorno.split('/').pop()}
                    </p>
                    <p className="text-sm text-gray-500">Arquivo de retorno processado</p>
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadRetorno}
                  className="btn-secondary"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum retorno</h3>
              <p className="mt-1 text-sm text-gray-500">
                O arquivo de retorno ainda não foi processado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Observações */}
      {remessa.observacoes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Observações</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{remessa.observacoes}</p>
        </div>
      )}

      {/* Erro de Processamento */}
      {remessa.erro_processamento && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Erro de Processamento</h3>
          <p className="text-sm text-red-700 whitespace-pre-wrap">{remessa.erro_processamento}</p>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Criado por:</span>
            <span className="ml-2 text-gray-900">{remessa.criado_por || 'Sistema'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Última atualização:</span>
            <span className="ml-2 text-gray-900">{formatDate(remessa.atualizado_em)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemessaDetail;
