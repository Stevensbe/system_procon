import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

const AcompanhamentoProcesso = () => {
  const [protocolo, setProtocolo] = useState('');
  const [loading, setLoading] = useState(false);
  const [processo, setProcesso] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!protocolo.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados simulados - em produção viriam da API
      const processoSimulado = {
        protocolo: protocolo,
        status: 'EM_ANDAMENTO',
        data_abertura: '2024-01-15',
        tipo: 'DENUNCIA',
        assunto: 'Problemas com banco - cobrança indevida',
        denunciante: {
          nome: 'João Silva',
          email: 'joao@email.com',
          telefone: '(92) 99999-9999'
        },
        empresa: {
          nome: 'Banco Exemplo S.A.',
          cnpj: '00.000.000/0001-00'
        },
        etapas: [
          {
            id: 1,
            titulo: 'Denúncia Recebida',
            descricao: 'Sua denúncia foi registrada no sistema',
            status: 'CONCLUIDA',
            data: '2024-01-15',
            responsavel: 'Sistema Automático'
          },
          {
            id: 2,
            titulo: 'Análise Inicial',
            descricao: 'Denúncia está sendo analisada pela equipe técnica',
            status: 'CONCLUIDA',
            data: '2024-01-16',
            responsavel: 'Maria Santos - Analista'
          },
          {
            id: 3,
            titulo: 'Notificação à Empresa',
            descricao: 'Empresa foi notificada sobre a denúncia',
            status: 'CONCLUIDA',
            data: '2024-01-20',
            responsavel: 'Carlos Oliveira - Fiscal'
          },
          {
            id: 4,
            titulo: 'Aguardando Resposta',
            descricao: 'Aguardando resposta da empresa (prazo: 30 dias)',
            status: 'EM_ANDAMENTO',
            data: '2024-01-20',
            responsavel: 'Sistema'
          },
          {
            id: 5,
            titulo: 'Análise da Resposta',
            descricao: 'Resposta da empresa será analisada',
            status: 'PENDENTE',
            data: null,
            responsavel: null
          },
          {
            id: 6,
            titulo: 'Decisão Final',
            descricao: 'Decisão será tomada com base na análise',
            status: 'PENDENTE',
            data: null,
            responsavel: null
          }
        ],
        documentos: [
          {
            id: 1,
            nome: 'Denúncia Original',
            tipo: 'PDF',
            data: '2024-01-15',
            tamanho: '245 KB'
          },
          {
            id: 2,
            nome: 'Comprovantes',
            tipo: 'PDF',
            data: '2024-01-15',
            tamanho: '1.2 MB'
          },
          {
            id: 3,
            nome: 'Notificação à Empresa',
            tipo: 'PDF',
            data: '2024-01-20',
            tamanho: '156 KB'
          }
        ],
        prazo_estimado: '2024-03-15',
        observacoes: 'Processo em andamento normal. Empresa foi notificada e tem 30 dias para responder.'
      };

      setProcesso(processoSimulado);
    } catch (error) {
      setError('Erro ao consultar processo. Verifique o número do protocolo.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'EM_ANDAMENTO':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'PENDENTE':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONCLUIDA':
        return <CheckCircleSolid className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'EM_ANDAMENTO':
        return <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'PENDENTE':
        return <InformationCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Consulta */}
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
                onChange={(e) => setProtocolo(e.target.value)}
                placeholder="Digite o número do protocolo"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors duration-300"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
              >
                {loading ? 'Consultando...' : 'Consultar'}
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

      {/* Resultado da Consulta */}
      {processo && (
        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Informações do Processo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Protocolo
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {processo.protocolo}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(processo.status)}`}>
                  {processo.status === 'EM_ANDAMENTO' && 'Em Andamento'}
                  {processo.status === 'CONCLUIDA' && 'Concluído'}
                  {processo.status === 'PENDENTE' && 'Pendente'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Data de Abertura
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(processo.data_abertura).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tipo
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {processo.tipo === 'DENUNCIA' ? 'Denúncia' : processo.tipo}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Prazo Estimado
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(processo.prazo_estimado).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Assunto
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {processo.assunto}
                </p>
              </div>
            </div>
          </div>

          {/* Dados do Denunciante */}
          <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Dados do Denunciante
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nome
                </label>
                <p className="text-gray-900 dark:text-white">{processo.denunciante.nome}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{processo.denunciante.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Telefone
                </label>
                <p className="text-gray-900 dark:text-white">{processo.denunciante.telefone}</p>
              </div>
            </div>
          </div>

          {/* Dados da Empresa */}
          <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Empresa Denunciada
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nome da Empresa
                </label>
                <p className="text-gray-900 dark:text-white">{processo.empresa.nome}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  CNPJ
                </label>
                <p className="text-gray-900 dark:text-white">{processo.empresa.cnpj}</p>
              </div>
            </div>
          </div>

          {/* Timeline das Etapas */}
          <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Acompanhamento das Etapas
            </h3>
            
            <div className="space-y-4">
              {processo.etapas.map((etapa, index) => (
                <div key={etapa.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {getStatusIcon(etapa.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {etapa.titulo}
                      </h4>
                      {etapa.data && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(etapa.data).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {etapa.descricao}
                    </p>
                    {etapa.responsavel && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Responsável: {etapa.responsavel}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Documentos do Processo
            </h3>
            
            <div className="space-y-3">
              {processo.documentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {doc.nome}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.tipo} • {doc.tamanho} • {new Date(doc.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-300">
                    Baixar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          {processo.observacoes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Observações
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {processo.observacoes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcompanhamentoProcesso;
