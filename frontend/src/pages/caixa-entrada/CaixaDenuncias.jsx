import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  EyeIcon,
  CheckIcon,
  ArrowUpIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ProconCard, ProconButton } from '../../components/ui';
import DocumentoCard from '../../components/caixa-entrada/DocumentoCard';
import FiltrosCaixa from '../../components/caixa-entrada/FiltrosCaixa';
import caixaEntradaService from '../../services/caixaEntradaService';

const CaixaDenuncias = () => {
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
      tipo_documento: 'DENUNCIA',
      assunto: 'Denúncia contra empresa de telefonia',
      remetente_nome: 'João Silva',
      empresa_nome: 'Telefonia XYZ Ltda',
      data_entrada: '2025-01-15T10:30:00Z',
      status: 'NAO_LIDO',
      prioridade: 'URGENTE',
      setor_destino: 'FISCALIZACAO',
      prazo_resposta: '2025-01-22T10:30:00Z',
      notificado_dte: false
    },
    {
      id: '2',
      numero_protocolo: 'PROT-2025-000002',
      tipo_documento: 'DENUNCIA',
      assunto: 'Reclamação sobre plano de saúde',
      remetente_nome: 'Maria Santos',
      empresa_nome: 'Saúde Plus S/A',
      data_entrada: '2025-01-14T14:20:00Z',
      status: 'EM_ANALISE',
      prioridade: 'NORMAL',
      setor_destino: 'FISCALIZACAO',
      prazo_resposta: '2025-01-21T14:20:00Z',
      notificado_dte: false
    },
    {
      id: '3',
      numero_protocolo: 'PROT-2025-000003',
      tipo_documento: 'DENUNCIA',
      assunto: 'Denúncia anônima sobre comércio local',
      remetente_nome: 'Denunciante Anônimo',
      empresa_nome: 'Comércio Local',
      data_entrada: '2025-01-13T09:15:00Z',
      status: 'NAO_LIDO',
      prioridade: 'ALTA',
      setor_destino: 'FISCALIZACAO',
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
        setor: 'FISCALIZACAO',
        tipo_documento: 'DENUNCIA'
      });
      setEstatisticas(stats);

      // Buscar documentos
      const docs = await caixaEntradaService.getDocumentosSetor({
        setor: 'FISCALIZACAO',
        tipo_documento: 'DENUNCIA',
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
        
        {/* Header */}
        <ProconCard
          icon={ExclamationTriangleIcon}
          title="🚨 Caixa de Denúncias"
          subtitle="Gerencie denúncias recebidas dos cidadãos"
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
          title="Denúncias"
          subtitle={`${documentos.length} denúncia(s) encontrada(s)`}
          error={error}
        >
          {documentos.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma denúncia encontrada
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Não há denúncias que correspondam aos filtros aplicados.
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
      </div>
    </div>
  );
};

export default CaixaDenuncias;
