import React, { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon,
  EyeIcon,
  CheckIcon,
  ArrowUpIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  UserIcon,
  DocumentMagnifyingGlassIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { ProconCard, ProconButton, ProconInput, ProconSelect } from '../../components/ui';
import DocumentoCard from '../../components/caixa-entrada/DocumentoCard';
import FiltrosCaixa from '../../components/caixa-entrada/FiltrosCaixa';
import caixaEntradaService from '../../services/caixaEntradaService';

const CaixaDiretoria = () => {
  const [documentos, setDocumentos] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    status: '',
    prioridade: '',
    busca: ''
  });

  // Mock data para desenvolvimento
  const mockDocumentos = [
    {
      id: '1',
      numero_protocolo: 'PROT-2025-000001',
      tipo_documento: 'DECISAO',
      assunto: 'Decisão sobre recurso administrativo',
      remetente_nome: 'Setor Jurídico',
      empresa_nome: 'Empresa ABC Ltda',
      data_entrada: '2025-01-15T10:30:00Z',
      status: 'NAO_LIDO',
      prioridade: 'URGENTE',
      setor_destino: 'DIRETORIA',
      prazo_resposta: '2025-01-22T10:30:00Z',
      notificado_dte: false
    },
    {
      id: '2',
      numero_protocolo: 'PROT-2025-000002',
      tipo_documento: 'ASSINATURA',
      assunto: 'Assinatura de termo de compromisso',
      remetente_nome: 'Setor Fiscalização',
      empresa_nome: 'Supermercado XYZ',
      data_entrada: '2025-01-14T14:20:00Z',
      status: 'EM_ANALISE',
      prioridade: 'NORMAL',
      setor_destino: 'DIRETORIA',
      prazo_resposta: '2025-01-21T14:20:00Z',
      notificado_dte: false
    },
    {
      id: '3',
      numero_protocolo: 'PROT-2025-000003',
      tipo_documento: 'APROVACAO',
      assunto: 'Aprovação de relatório anual',
      remetente_nome: 'Setor Administrativo',
      empresa_nome: 'PROCON-AM',
      data_entrada: '2025-01-13T09:15:00Z',
      status: 'NAO_LIDO',
      prioridade: 'ALTA',
      setor_destino: 'DIRETORIA',
      prazo_resposta: '2025-01-20T09:15:00Z',
      notificado_dte: false
    }
  ];

  const mockEstatisticas = {
    total: 3,
    nao_lidos: 2,
    em_analise: 1,
    urgentes: 1,
    atrasados: 0
  };

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas
      const stats = await caixaEntradaService.getEstatisticas({
        setor: 'DIRETORIA'
      });
      setEstatisticas(stats);

      // Buscar documentos
      const docs = await caixaEntradaService.getDocumentosSetor({
        setor: 'DIRETORIA',
        ...filtros
      });
      setDocumentos(docs.results || docs);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados. Usando dados de exemplo.');
      
      // Fallback para dados mock
      setEstatisticas(mockEstatisticas);
      setDocumentos(mockDocumentos);
    } finally {
      setLoading(false);
    }
  };

  const handleAcaoDocumento = async (documentoId, acao, dados = {}) => {
    try {
      setLoading(true);
      
      switch (acao) {
        case 'visualizar':
          console.log('Visualizando documento:', documentoId);
          break;
          
        case 'marcar_lido':
          await caixaEntradaService.marcarComoLido(documentoId);
          break;
          
        case 'encaminhar':
          await caixaEntradaService.encaminharDocumento(documentoId, dados);
          break;
          
        case 'arquivar':
          await caixaEntradaService.arquivarDocumento(documentoId);
          break;
          
        default:
          console.log('Ação não implementada:', acao);
      }
      
      // Recarregar dados após ação
      await carregarDados();
      
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      setError('Erro ao executar ação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrosChange = (novosFiltros) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  };

  if (loading && documentos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <ProconCard loading={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header com Estatísticas */}
        <ProconCard
          icon={BuildingOfficeIcon}
          title="🏢 Caixa Diretoria"
          subtitle="Gerencie decisões administrativas e assinaturas"
          variant="danger"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {estatisticas.total || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {estatisticas.nao_lidos || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Não Lidos
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {estatisticas.em_analise || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Em Análise
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {estatisticas.urgentes || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Urgentes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {estatisticas.atrasados || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Atrasados
              </div>
            </div>
          </div>
        </ProconCard>

        {/* Filtros */}
        <ProconCard
          icon={FunnelIcon}
          title="Filtros e Busca"
          variant="info"
        >
          <FiltrosCaixa
            filtros={filtros}
            onFiltrosChange={handleFiltrosChange}
            showSetorFilter={false}
          />
        </ProconCard>

        {/* Lista de Documentos */}
        <ProconCard
          icon={DocumentTextIcon}
          title="Decisões e Assinaturas"
          subtitle={`${documentos.length} documento(s) encontrado(s)`}
          error={error}
        >
          {documentos.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum documento encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Não há documentos que correspondam aos filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documentos.map((documento) => (
                <DocumentoCard
                  key={documento.id}
                  documento={documento}
                  onAcao={handleAcaoDocumento}
                />
              ))}
            </div>
          )}
        </ProconCard>

        {/* Ações Rápidas */}
        <ProconCard
          icon={ArrowUpIcon}
          title="Ações Rápidas"
          variant="primary"
        >
          <div className="flex flex-wrap gap-4">
            <ProconButton
              variant="success"
              icon={CheckIcon}
              onClick={() => console.log('Marcar todos como lidos')}
            >
              Marcar Todos como Lidos
            </ProconButton>
            
            <ProconButton
              variant="warning"
              icon={ArchiveBoxIcon}
              onClick={() => console.log('Arquivar selecionados')}
            >
              Arquivar Selecionados
            </ProconButton>
            
            <ProconButton
              variant="info"
              icon={EyeIcon}
              onClick={() => console.log('Visualizar em lote')}
            >
              Visualizar em Lote
            </ProconButton>
          </div>
        </ProconCard>

        {/* Informações do Setor */}
        <ProconCard
          icon={ClipboardDocumentCheckIcon}
          title="Informações da Diretoria"
          variant="danger"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Responsabilidades:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Tomar decisões administrativas finais</li>
                <li>• Assinar documentos oficiais</li>
                <li>• Aprovar relatórios e pareceres</li>
                <li>• Resolver recursos administrativos</li>
                <li>• Coordenar ações estratégicas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Tipos de Documentos:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Decisões administrativas</li>
                <li>• Assinaturas de documentos</li>
                <li>• Aprovações de relatórios</li>
                <li>• Resoluções de recursos</li>
                <li>• Diretrizes estratégicas</li>
              </ul>
            </div>
          </div>
        </ProconCard>

        {/* Estatísticas Avançadas */}
        <ProconCard
          icon={DocumentMagnifyingGlassIcon}
          title="Estatísticas Avançadas"
          variant="info"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {Math.round((estatisticas.em_analise || 0) / (estatisticas.total || 1) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Em Análise
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {Math.round(((estatisticas.total || 0) - (estatisticas.nao_lidos || 0)) / (estatisticas.total || 1) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Processados
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                {estatisticas.urgentes || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Urgentes
              </div>
            </div>
          </div>
        </ProconCard>

        {/* Resumo por Tipo */}
        <ProconCard
          icon={DocumentTextIcon}
          title="Resumo por Tipo de Documento"
          variant="warning"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {documentos.filter(d => d.tipo_documento === 'DECISAO').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Decisões
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                {documentos.filter(d => d.tipo_documento === 'ASSINATURA').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Assinaturas
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                {documentos.filter(d => d.tipo_documento === 'APROVACAO').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aprovações
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {documentos.filter(d => d.tipo_documento === 'RECURSO').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Recursos
              </div>
            </div>
          </div>
        </ProconCard>

        {/* Alertas e Notificações */}
        <ProconCard
          icon={ClipboardDocumentCheckIcon}
          title="Alertas e Notificações"
          variant="danger"
        >
          <div className="space-y-4">
            {estatisticas.urgentes > 0 && (
              <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Documentos Urgentes
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>Existem {estatisticas.urgentes} documento(s) com prioridade urgente aguardando sua análise.</p>
                  </div>
                </div>
              </div>
            )}
            
            {estatisticas.atrasados > 0 && (
              <div className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Documentos Atrasados
                  </h3>
                  <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                    <p>Existem {estatisticas.atrasados} documento(s) com prazo vencido.</p>
                  </div>
                </div>
              </div>
            )}
            
            {estatisticas.urgentes === 0 && estatisticas.atrasados === 0 && (
              <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Tudo em Dia
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>Não há documentos urgentes ou atrasados. Todos os prazos estão sendo cumpridos.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ProconCard>
      </div>
    </div>
  );
};

export default CaixaDiretoria;
